import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Submission } from '@/types';

// Check if user is authenticated via cookie
async function isAuthorized(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

export async function GET(request: NextRequest) {
  // Check authorization
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Filters
    const grade = searchParams.get('grade');
    const hasEmail = searchParams.get('hasEmail');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (grade) {
      conditions.push(`grade LIKE $${paramIndex}`);
      params.push(`${grade}%`);
      paramIndex++;
    }
    if (hasEmail === 'true') {
      conditions.push('email IS NOT NULL');
    } else if (hasEmail === 'false') {
      conditions.push('email IS NULL');
    }
    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get submissions
    const submissions = await query<Submission>(
      `SELECT * FROM submissions ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM submissions ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// Get summary stats
export async function HEAD() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get total count
    const totalResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM submissions'
    );

    // Get count with emails
    const withEmailResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM submissions WHERE email IS NOT NULL'
    );

    return new NextResponse(null, {
      headers: {
        'X-Total-Submissions': totalResult?.count || '0',
        'X-With-Email': withEmailResult?.count || '0',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
