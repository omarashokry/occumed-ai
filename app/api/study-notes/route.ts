import { NextRequest, NextResponse } from 'next/server';
import { generateStudyNotes } from '@/lib/agents/study-notes';

export async function POST(req: NextRequest) {
  try {
    const { topic, weakPoints = [] } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }
    const notes = await generateStudyNotes(topic, weakPoints);
    return NextResponse.json({ notes, topic });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate study notes' },
      { status: 500 }
    );
  }
}
