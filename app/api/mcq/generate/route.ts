import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions } from '@/lib/services/mcq';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, difficulty, count } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (count !== undefined && (count < 1 || count > 10)) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 10' },
        { status: 400 }
      );
    }

    const questions = await generateQuestions(topic, difficulty, count);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('MCQ generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
