import { NextRequest, NextResponse } from 'next/server';
import { getRecentAttempts } from '@/lib/services/mcq';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const attempts = await getRecentAttempts(limit);

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('MCQ attempts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
}
