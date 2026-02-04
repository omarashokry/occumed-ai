import { NextRequest, NextResponse } from 'next/server';
import { getSessionForResume } from '@/lib/services/osce';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getSessionForResume(params.id);

    if (!result) {
      return NextResponse.json(
        { error: 'Session not found or already completed' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('OSCE resume error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load session' },
      { status: 500 }
    );
  }
}
