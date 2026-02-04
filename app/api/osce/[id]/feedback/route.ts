import { NextRequest, NextResponse } from 'next/server';
import { getFeedback } from '@/lib/services/osce';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getFeedback(params.id);

    if (!result) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('OSCE feedback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get feedback' },
      { status: 500 }
    );
  }
}
