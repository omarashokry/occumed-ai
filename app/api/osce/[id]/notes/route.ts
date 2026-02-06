import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { notes, tags } = await req.json();
    const supabase = createServerClient();
    const { error } = await supabase
      .from('osce_sessions')
      .update({ custom_notes: notes, tags })
      .eq('id', params.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save notes' },
      { status: 500 }
    );
  }
}
