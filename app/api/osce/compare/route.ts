import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { sessionIds } = await req.json();
    const supabase = createServerClient();

    const { data } = await supabase
      .from('osce_sessions')
      .select('id, topic, difficulty, scorecard_json, started_at, overall_outcome')
      .in('id', sessionIds);

    return NextResponse.json({ sessions: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compare sessions' },
      { status: 500 }
    );
  }
}
