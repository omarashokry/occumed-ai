import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateFlashcards } from '@/lib/agents/flashcard-generator';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(20);

    return NextResponse.json({ flashcards: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch flashcards' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { topic, weakPoints = [], count = 10 } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const flashcards = await generateFlashcards(topic, weakPoints, count);

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('flashcards')
      .insert(flashcards.map((f) => ({
        topic: f.topic,
        front: f.front,
        back: f.back,
        regulation: f.regulation,
      })))
      .select();

    if (error) throw new Error(error.message);

    return NextResponse.json({ flashcards: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}
