import { NextRequest, NextResponse } from 'next/server';
import { getAttemptStats } from '@/lib/services/mcq';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic') || undefined;

    const stats = await getAttemptStats(topic);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('MCQ stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
