import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { sendEmail, generateSnapshotHtml } from '@/lib/mailgun';
import { getGradeRange } from '@/lib/scoring';
import { DRIVERS } from '@/lib/drivers';
import { CalculatorInputs, CalculationResults, DriverCode } from '@/types';

interface SubmitPayload {
  inputs: CalculatorInputs;
  results: CalculationResults;
  drivers: DriverCode[];
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitPayload = await request.json();
    const { inputs, results, drivers, email } = body;

    // Validate required fields
    if (!inputs || !results || !drivers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store submission in database
    try {
      await query(
        `INSERT INTO submissions (
          monthly_inquiries, response_time, follow_up_depth, patient_value,
          after_hours, grade, loss_rate, dropoff_pct, risk_low, risk_high,
          drivers, email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          inputs.monthlyInquiries,
          inputs.responseTime,
          inputs.followUpDepth,
          inputs.patientValue,
          inputs.afterHours,
          results.grade,
          results.lossRate,
          results.dropoffPercent,
          results.revenueAtRisk.low,
          results.revenueAtRisk.high,
          drivers,
          email || null,
        ]
      );
    } catch (dbError) {
      console.error('Failed to insert submission:', dbError);
      // Continue even if DB insert fails - email is more important to user
    }

    // Send email if provided
    if (email) {
      const gradeRange = getGradeRange(results.grade);

      // Try to fetch custom template from DB
      const template = await queryOne<{
        subject: string;
        body: string;
        config?: string | null;
      }>(
        'SELECT subject, body, config FROM email_templates WHERE grade_range = $1',
        [gradeRange]
      );

      // Generate email HTML
      const driverTitles = drivers.map((code) => DRIVERS[code].title);
      const snapshotHtml = generateSnapshotHtml({
        grade: results.grade,
        riskLow: results.revenueAtRisk.low,
        riskHigh: results.revenueAtRisk.high,
        dropoffPercent: results.dropoffPercent,
        drivers: driverTitles,
        scores: results.scores,
      });

      // Parse config if available
      let config: Record<string, string> = {};
      if (template?.config) {
        try {
          config = JSON.parse(template.config);
        } catch (e) {
          console.error('Failed to parse template config:', e);
        }
      }

      // Use custom subject if available, otherwise use default
      const subject = template?.subject || `Your Follow-Up Health Score: ${results.grade}`;

      // Use template body if available, otherwise use generated HTML
      let emailHtml = snapshotHtml;
      if (template?.body) {
        emailHtml = template.body
          .replace(/\{\{snapshot_html\}\}/g, snapshotHtml)
          .replace(/\{\{cta_url\}\}/g, config.cta_url || process.env.NEXT_PUBLIC_APP_URL || '')
          .replace(/\{\{grade\}\}/g, results.grade)
          .replace(/\{\{risk_low\}\}/g, results.revenueAtRisk.low.toLocaleString())
          .replace(/\{\{risk_high\}\}/g, results.revenueAtRisk.high.toLocaleString())
          .replace(/\{\{dropoff_percent\}\}/g, results.dropoffPercent.toString());
      }

      await sendEmail({
        to: email,
        subject,
        html: emailHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
