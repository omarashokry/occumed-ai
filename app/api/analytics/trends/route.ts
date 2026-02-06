import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: mcqTrends } = await supabase
      .from('daily_performance')
      .select('*');

    const { data: osceTrends } = await supabase
      .from('osce_sessions')
      .select('topic, overall_outcome, scorecard_json, ended_at')
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: true })
      .limit(50);

    return NextResponse.json({ mcqTrends: mcqTrends || [], osceTrends: osceTrends || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}
