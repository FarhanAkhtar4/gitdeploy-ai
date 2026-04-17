import { NextRequest } from 'next/server';
import { chatWithAI } from '@/lib/ai-service';

// Singleton ZAI instance for streaming
let zaiInstance: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

const SYSTEM_PROMPT_CHAT_ASSISTANT = `You are GitDeploy AI Assistant, a helpful AI that helps users with:
1. Analyzing deployment failures by reading GitHub Actions logs
2. Suggesting workflow modifications (showing diffs for approval)
3. Building new features for existing projects
4. Recommending free hosting platforms
5. General GitHub and deployment questions

HARD RULES:
- NEVER make changes to GitHub without explicit user confirmation
- NEVER suggest paid services without first exhausting free options
- NEVER claim a deployment succeeded without verifying run status
- When suggesting code changes, show them as a diff for review
- If the user types "APPROVE CHANGE", then and only then apply the change
- Be concise but thorough in explanations
- Use emoji sparingly for status indicators only`;

// POST /api/chat — AI Chat endpoint with streaming support
export async function POST(request: NextRequest) {
  try {
    const { messages, mode, stream } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If streaming is requested, use the streaming API
    if (stream) {
      try {
        const zai = await getZAI();

        const fullMessages = [
          { role: 'assistant' as const, content: SYSTEM_PROMPT_CHAT_ASSISTANT },
          ...messages,
        ];

        const result = await zai.chat.completions.create({
          messages: fullMessages,
          stream: true,
          thinking: { type: 'disabled' },
        });

        // If the SDK returns a ReadableStream (SSE), pipe it through a transformer
        if (result && typeof result === 'object' && 'getReader' in result) {
          const decoder = new TextDecoder();
          const encoder = new TextEncoder();

          const transformStream = new TransformStream({
            async transform(chunk, controller) {
              const text = decoder.decode(chunk, { stream: true });
              const lines = text.split('\n');

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === '') continue;

                // Handle SSE format: "data: {...}"
                if (trimmed.startsWith('data: ')) {
                  const data = trimmed.slice(6);
                  if (data === '[DONE]') {
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                    continue;
                  }
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                  } catch {
                    // If parsing fails, pass through as-is
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: data })}\n\n`));
                  }
                } else {
                  // Try to parse as plain JSON (non-SSE format)
                  try {
                    const parsed = JSON.parse(trimmed);
                    const content = parsed.choices?.[0]?.delta?.content || parsed.content || '';
                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                  } catch {
                    // Plain text chunk
                    if (trimmed) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: trimmed })}\n\n`));
                    }
                  }
                }
              }
            },
            flush(controller) {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            },
          });

          const readable = (result as ReadableStream).pipeThrough(transformStream);

          return new Response(readable, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }

        // If result is not a stream (SDK returned full JSON), simulate streaming
        const content = result?.choices?.[0]?.message?.content || result?.response || '';
        if (content) {
          return simulateStreaming(content);
        }

        // Fallback to non-streaming
        const response = await chatWithAI(messages, mode || 'chat-assistant');
        return new Response(JSON.stringify({ response }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (streamError) {
        console.error('Streaming error, falling back to non-streaming:', streamError);
        const response = await chatWithAI(messages, mode || 'chat-assistant');
        return simulateStreaming(response);
      }
    }

    // Non-streaming mode
    const response = await chatWithAI(messages, mode || 'chat-assistant');
    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Chat failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Simulate streaming by chunking the response into smaller pieces
function simulateStreaming(fullText: string) {
  const encoder = new TextEncoder();
  const words = fullText.split(/(\s+)/);
  let currentIndex = 0;

  const stream = new ReadableStream({
    async pull(controller) {
      if (currentIndex >= words.length) {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
        return;
      }

      // Send 1-3 words at a time for natural feel
      const chunkSize = Math.min(Math.floor(Math.random() * 3) + 1, words.length - currentIndex);
      const chunk = words.slice(currentIndex, currentIndex + chunkSize).join('');
      currentIndex += chunkSize;

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));

      // Small delay for natural streaming feel
      await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 30));
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
