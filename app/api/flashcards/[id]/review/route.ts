import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { rating } = await req.json(); // 'again' | 'hard' | 'good' | 'easy'
    const supabase = createServerClient();

    const { data: card } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // SM-2 algorithm
    let easeFactor = card.ease_factor || 2.5;
    let interval = card.interval_days || 1;
    const reviewCount = (card.review_count || 0) + 1;

    switch (rating) {
      case 'again':
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        break;
      case 'hard':
        interval = Math.max(1, Math.round(interval * 1.2));
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        break;
      case 'good':
        interval = Math.round(interval * easeFactor);
        break;
      case 'easy':
        interval = Math.round(interval * easeFactor * 1.3);
        easeFactor += 0.15;
        break;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const { error } = await supabase
      .from('flashcards')
      .update({
        ease_factor: easeFactor,
        interval_days: interval,
        next_review_at: nextReview.toISOString(),
        review_count: reviewCount,
      })
      .eq('id', params.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, next_review_at: nextReview.toISOString() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to review' },
      { status: 500 }
    );
  }
}
