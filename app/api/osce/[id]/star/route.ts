import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: session } = await supabase
      .from('osce_sessions')
      .select('is_starred')
      .eq('id', params.id)
      .single();

    const { error } = await supabase
      .from('osce_sessions')
      .update({ is_starred: !session?.is_starred })
      .eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ is_starred: !session?.is_starred });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle star' },
      { status: 500 }
    );
  }
}
