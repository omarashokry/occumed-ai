import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/agents/base';
import { getDrillPrompt } from '@/lib/prompts/drill';
import { retrieveContext } from '@/lib/rag/retriever';
import { createServerClient } from '@/lib/supabase';
import { ScenarioConfig } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const { contextText } = await retrieveContext(topic, { matchCount: 4 });
    const scenario = await generateJSON<ScenarioConfig>(
      getDrillPrompt(contextText),
      `Generate a SHORT drill scenario for: "${topic}". Single clinical decision focus.`
    );

    const supabase = createServerClient();
    const { data } = await supabase
      .from('osce_sessions')
      .insert({ topic, difficulty: 'DOccMed', scenario_json: scenario, is_drill: true })
      .select('id')
      .single();

    return NextResponse.json({ sessionId: data!.id, doorNote: scenario.door_note, scenario });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start drill' },
      { status: 500 }
    );
  }
}
