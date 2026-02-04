import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/services/osce';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await sendMessage(params.id, message);

    return NextResponse.json(result);
  } catch (error) {
    console.error('OSCE message error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}
