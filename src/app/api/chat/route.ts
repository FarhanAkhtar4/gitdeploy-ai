import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/ai-service';

// POST /api/chat — AI Chat endpoint
export async function POST(request: NextRequest) {
  try {
    const { messages, mode } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const response = await chatWithAI(messages, mode || 'chat-assistant');

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
