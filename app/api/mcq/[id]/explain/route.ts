import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateChat } from '@/lib/agents/base';
import { MCQQuestion } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userQuestion, history } = await req.json();

    const supabase = createServerClient();
    const { data: question } = await supabase
      .from('mcq_questions')
      .select('question_json')
      .eq('id', params.id)
      .single();

    if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const qJson = question.question_json as MCQQuestion;

    const response = await generateChat(
      `You are a UK occupational medicine tutor helping a student understand an MCQ they got wrong.

The question was: ${qJson.stem}
Correct answer: ${qJson.correct_answer}
Explanation: ${qJson.explanation}
Citation: ${qJson.citation}

Help the student understand WHY the correct answer is right. Be educational, not condescending. Reference specific regulations. Keep responses concise (2-4 sentences).`,
      (history || []).map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        content: m.content,
      })),
      userQuestion
    );

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to explain' },
      { status: 500 }
    );
  }
}
