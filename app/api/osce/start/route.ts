import { NextRequest, NextResponse } from 'next/server';
import { startSession } from '@/lib/services/osce';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, difficulty, emotionalState } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const result = await startSession(topic, difficulty, emotionalState);

    return NextResponse.json({
      sessionId: result.sessionId,
      doorNote: result.doorNote,
    });
  } catch (error) {
    console.error('OSCE start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start session' },
      { status: 500 }
    );
  }
}
