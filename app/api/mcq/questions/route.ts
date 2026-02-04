import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsByTopic, getRandomQuestions } from '@/lib/services/mcq';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty') || undefined;
    const random = searchParams.get('random') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (random) {
      const questions = await getRandomQuestions(limit, topic || undefined, difficulty);
      return NextResponse.json({ questions });
    }

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required (or use ?random=true)' },
        { status: 400 }
      );
    }

    const questions = await getQuestionsByTopic(topic, difficulty, limit);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('MCQ questions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
