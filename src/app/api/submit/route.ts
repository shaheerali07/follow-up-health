import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { sendEmail, generateSnapshotBlock, buildEmailHtml } from '@/lib/mailgun';
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
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [SUBMIT] Preparing to send email for submission`);
      console.log(`[${timestamp}] [SUBMIT] Email: ${email}`);
      console.log(`[${timestamp}] [SUBMIT] Grade: ${results.grade}`);

      const gradeRange = getGradeRange(results.grade);
      console.log(`[${timestamp}] [SUBMIT] Grade range: ${gradeRange}`);

      const template = await queryOne<{
        subject: string;
        body: string;
        config?: string | null;
      }>(
        'SELECT subject, body, config FROM email_templates WHERE grade_range = $1',
        [gradeRange]
      );

      if (template) {
        console.log(`[${timestamp}] [SUBMIT] Template found for grade range ${gradeRange}`);
      } else {
        console.log(`[${timestamp}] [SUBMIT] No template found for grade range ${gradeRange}, using defaults`);
      }

      const driverTitles = drivers.map((code) => DRIVERS[code].title);
      const snapshotBlock = generateSnapshotBlock({
        grade: results.grade,
        riskLow: results.revenueAtRisk.low,
        riskHigh: results.revenueAtRisk.high,
        dropoffPercent: results.dropoffPercent,
        drivers: driverTitles,
        scores: results.scores,
      });

      let ctaUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      if (template?.config) {
        try {
          const config = JSON.parse(template.config) as Record<string, string>;
          if (config.cta_url) {
            ctaUrl = config.cta_url;
            console.log(`[${timestamp}] [SUBMIT] Using custom CTA URL from template config`);
          }
        } catch {
          console.warn(`[${timestamp}] [SUBMIT] Failed to parse template config, using default CTA URL`);
        }
      }

      const subject = template?.subject ?? `Your Follow-Up Health Score: ${results.grade}`;
      const customContent = template?.body?.trim() ?? '';

      console.log(`[${timestamp}] [SUBMIT] Email subject: ${subject}`);
      console.log(`[${timestamp}] [SUBMIT] Custom content length: ${customContent.length} characters`);

      const emailHtml = buildEmailHtml({
        customContent,
        snapshotBlock,
        ctaUrl,
        placeholders: {
          grade: results.grade,
          risk_low: results.revenueAtRisk.low.toLocaleString(),
          risk_high: results.revenueAtRisk.high.toLocaleString(),
          dropoff_percent: String(results.dropoffPercent),
        },
      });

      console.log(`[${timestamp}] [SUBMIT] Email HTML generated (${emailHtml.length} characters)`);
      console.log(`[${timestamp}] [SUBMIT] Calling sendEmail...`);

      const emailSent = await sendEmail({
        to: email,
        subject,
        html: emailHtml,
      });

      if (emailSent) {
        console.log(`[${timestamp}] [SUBMIT] ✓ Email sent successfully for submission`);
      } else {
        console.error(`[${timestamp}] [SUBMIT] ✗ Failed to send email for submission`);
      }
    } else {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [SUBMIT] No email provided, skipping email send`);
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
