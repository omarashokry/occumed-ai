import { NextRequest, NextResponse } from 'next/server';
import { generateLearningPlan } from '@/lib/agents/learning-planner';

export async function POST(req: NextRequest) {
  try {
    const { weakTopics = [], completedTopics = [], totalWeeks = 8 } = await req.json();
    const plan = await generateLearningPlan(weakTopics, completedTopics, totalWeeks);
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate learning plan' },
      { status: 500 }
    );
  }
}
