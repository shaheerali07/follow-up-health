import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { GradeRange, EmailTemplate } from '@/types';

// Check if user is authenticated via cookie
async function isAuthorized(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// Get all email templates
export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templates = await query<EmailTemplate>(
      'SELECT * FROM email_templates ORDER BY grade_range'
    );

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Templates fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// Update or create email template
export async function PUT(request: NextRequest) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { grade_range, subject, body: templateBody } = body;

    // Validate grade_range
    const validRanges: GradeRange[] = ['A', 'BC', 'DF'];
    if (!validRanges.includes(grade_range)) {
      return NextResponse.json(
        { error: 'Invalid grade range' },
        { status: 400 }
      );
    }

    if (!subject || !templateBody) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      );
    }

    // Upsert template (INSERT ... ON CONFLICT)
    const template = await queryOne<EmailTemplate>(
      `INSERT INTO email_templates (grade_range, subject, body, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (grade_range)
       DO UPDATE SET subject = $2, body = $3, updated_at = NOW()
       RETURNING *`,
      [grade_range, subject, templateBody]
    );

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}
