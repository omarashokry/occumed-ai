import { NextResponse } from 'next/server';
import { getRecommendedDifficulty } from '@/lib/services/difficulty';

export async function GET() {
  try {
    const result = await getRecommendedDifficulty();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Difficulty API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get difficulty' },
      { status: 500 }
    );
  }
}
