import { NextRequest, NextResponse } from 'next/server';
import { submitAnswer } from '@/lib/services/mcq';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { selectedOption, timeTakenSeconds } = body;

    if (!selectedOption) {
      return NextResponse.json(
        { error: 'selectedOption is required' },
        { status: 400 }
      );
    }

    if (!['A', 'B', 'C', 'D', 'E'].includes(selectedOption)) {
      return NextResponse.json(
        { error: 'selectedOption must be A, B, C, D, or E' },
        { status: 400 }
      );
    }

    const result = await submitAnswer(params.id, selectedOption, timeTakenSeconds);

    return NextResponse.json(result);
  } catch (error) {
    console.error('MCQ submit error:', error);

    const message = error instanceof Error ? error.message : 'Failed to submit answer';
    const status = message.includes('not found') ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
