import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const checks: Record<string, string> = {};

  // Check Supabase connectivity
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('documents').select('id').limit(1);
    checks.supabase = error ? `error: ${error.message}` : 'connected';
  } catch (e) {
    checks.supabase = `error: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  // Check Gemini API key is set
  checks.gemini = process.env.GEMINI_API_KEY ? 'api_key_set' : 'missing_api_key';

  const allHealthy = checks.supabase === 'connected' && checks.gemini === 'api_key_set';

  return NextResponse.json(
    { status: allHealthy ? 'healthy' : 'degraded', checks },
    { status: allHealthy ? 200 : 503 }
  );
}
