import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/services/osce';

export async function GET() {
  try {
    const sessions = await getHistory();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('OSCE history error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get history' },
      { status: 500 }
    );
  }
}
