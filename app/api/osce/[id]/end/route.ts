import { NextRequest, NextResponse } from 'next/server';
import { endSession } from '@/lib/services/osce';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scorecard = await endSession(params.id);

    return NextResponse.json({ scorecard });
  } catch (error) {
    console.error('OSCE end error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to end session' },
      { status: 500 }
    );
  }
}
