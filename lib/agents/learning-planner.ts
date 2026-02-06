import { generateJSON } from './base';

interface LearningPlan {
  weeks: {
    week: number;
    focus_topic: string;
    mcq_topics: string[];
    osce_scenario: string;
    estimated_time_hours: number;
    rationale: string;
  }[];
  summary: string;
}

export async function generateLearningPlan(
  weakTopics: { topic: string; accuracy: number }[],
  completedTopics: string[],
  totalWeeks: number = 8
): Promise<LearningPlan> {
  return generateJSON<LearningPlan>(
    `You are a UK occupational medicine training coordinator. Generate a structured learning plan for a DOccMed/MFOM trainee.

The plan should:
1. Start with foundational topics and build to complex ones
2. Prioritise weak areas (listed below) early
3. Revisit weak topics at intervals (spaced repetition principle)
4. Mix MCQ practice and OSCE scenarios each week
5. Be realistic for someone studying alongside clinical work (4-6 hours/week)
6. Reference OMST 2022 Curriculum Learning Outcomes

Output as JSON: { "weeks": [...], "summary": "string" }`,
    `Weak topics (prioritise these): ${weakTopics.map((t) => `${t.topic} (${t.accuracy}%)`).join(', ')}
Topics already mastered: ${completedTopics.join(', ')}
Plan duration: ${totalWeeks} weeks
Generate a structured learning plan as JSON.`
  );
}
