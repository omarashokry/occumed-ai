import { NextRequest, NextResponse } from 'next/server';
import { endSession } from '@/lib/services/osce';
import { osceEndLimiter } from '@/lib/rate-limit';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = osceEndLimiter(req);
    if (rateLimitResponse) return rateLimitResponse;

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
