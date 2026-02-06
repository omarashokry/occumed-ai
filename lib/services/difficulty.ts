import { createServerClient } from '@/lib/supabase';

export type DifficultyLevel = 'DOccMed-beginner' | 'DOccMed' | 'DOccMed-advanced' | 'MFOM';

export async function getRecommendedDifficulty(): Promise<{
  mcq: DifficultyLevel;
  osce: DifficultyLevel;
  mcqAccuracy: number;
  osceAvgScore: number;
}> {
  const supabase = createServerClient();

  const { data: attempts } = await supabase
    .from('mcq_attempts')
    .select('is_correct')
    .order('attempted_at', { ascending: false })
    .limit(20);

  const mcqTotal = attempts?.length || 0;
  const mcqCorrect = attempts?.filter((a) => a.is_correct).length || 0;
  const mcqAccuracy = mcqTotal > 0 ? (mcqCorrect / mcqTotal) * 100 : 50;

  const { data: sessions } = await supabase
    .from('osce_sessions')
    .select('scorecard_json')
    .not('scorecard_json', 'is', null)
    .order('ended_at', { ascending: false })
    .limit(3);

  const scores = (sessions || [])
    .map((s) => (s.scorecard_json as { overall_percentage?: number })?.overall_percentage)
    .filter((s): s is number => typeof s === 'number');
  const osceAvgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;

  return {
    mcq: getDifficultyFromAccuracy(mcqAccuracy),
    osce: getDifficultyFromAccuracy(osceAvgScore),
    mcqAccuracy,
    osceAvgScore,
  };
}

function getDifficultyFromAccuracy(accuracy: number): DifficultyLevel {
  if (accuracy >= 85) return 'MFOM';
  if (accuracy >= 70) return 'DOccMed-advanced';
  if (accuracy >= 50) return 'DOccMed';
  return 'DOccMed-beginner';
}
