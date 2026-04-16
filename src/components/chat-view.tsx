'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore, type ChatMessage } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare,
  Trash2,
} from 'lucide-react';

export function ChatView() {
  const { chatMessages, addChatMessage, clearChatMessages } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInput('');
    setIsLoading(true);

    try {
      const messages = [...chatMessages, userMsg].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, mode: 'chat-assistant' }),
      });

      const data = await res.json();
      const aiContent = data.response || 'Sorry, I could not generate a response.';

      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Error: Could not reach AI service. Please try again.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#30363d' }}>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" style={{ color: '#58a6ff' }} />
          <h2 className="text-sm font-medium" style={{ color: '#c9d1d9' }}>AI Deployment Assistant</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          style={{ color: '#8b949e' }}
          onClick={clearChatMessages}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {chatMessages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto mb-3" style={{ color: '#30363d' }} />
              <h3 className="text-lg font-medium" style={{ color: '#c9d1d9' }}>
                AI Deployment Assistant
              </h3>
              <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
                Ask me about deployment failures, workflow changes, or hosting recommendations
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {[
                  'Why did my last deployment fail?',
                  'Add a test step to my workflow',
                  'Which free platform is best for my app?',
                  'Build me a user profile page',
                ].map((example) => (
                  <button
                    key={example}
                    className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-[#21262d]"
                    style={{ borderColor: '#30363d', color: '#8b949e' }}
                    onClick={() => {
                      setInput(example);
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: msg.role === 'user' ? '#30363d' : '#58a6ff20',
                }}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" style={{ color: '#c9d1d9' }} />
                ) : (
                  <Bot className="w-4 h-4" style={{ color: '#58a6ff' }} />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                  msg.role === 'user' ? 'text-right' : ''
                }`}
                style={{
                  backgroundColor: msg.role === 'user' ? '#30363d' : '#0d1117',
                  border: `1px solid ${msg.role === 'user' ? '#30363d' : '#21262d'}`,
                  color: '#c9d1d9',
                }}
              >
                <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#58a6ff20' }}>
                <Bot className="w-4 h-4" style={{ color: '#58a6ff' }} />
              </div>
              <div className="rounded-lg px-4 py-3" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#58a6ff' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t" style={{ borderColor: '#30363d' }}>
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about deployment, workflows, or hosting..."
            className="min-h-[40px] max-h-32 bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
          />
          <Button
            size="icon"
            disabled={!input.trim() || isLoading}
            style={{ backgroundColor: '#238636', color: 'white' }}
            onClick={sendMessage}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
