import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('weak_topics')
      .select('*')
      .lt('accuracy', 60);

    return NextResponse.json({ weakTopics: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch weak topics' },
      { status: 500 }
    );
  }
}
