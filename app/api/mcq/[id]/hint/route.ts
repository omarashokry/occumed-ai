import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateText } from '@/lib/agents/base';
import { MCQQuestion } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: question } = await supabase
      .from('mcq_questions')
      .select('question_json')
      .eq('id', params.id)
      .single();

    if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const qJson = question.question_json as MCQQuestion;

    const hint = await generateText(
      `You are a medical educator. Generate a brief, helpful hint for a student struggling with this question. Do NOT reveal the answer. Guide them toward the right regulatory framework or clinical principle.`,
      `Question: ${qJson.stem}\nTopic: ${qJson.topic_tag}\nCitation: ${qJson.citation}\n\nGenerate a 1-2 sentence hint that points toward the correct reasoning without giving the answer away.`
    );

    return NextResponse.json({ hint });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate hint' },
      { status: 500 }
    );
  }
}
