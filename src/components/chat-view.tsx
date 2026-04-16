'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore, type ChatMessage } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DiffViewer } from '@/components/diff-viewer';
import {
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare,
  Trash2,
  Sparkles,
  Code,
  Wrench,
  Globe,
  AlertCircle,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { icon: AlertCircle, label: 'Why did my deployment fail?', color: '#f85149' },
  { icon: Code, label: 'Add a test step to my workflow', color: '#58a6ff' },
  { icon: Wrench, label: 'Build me a user profile page', color: '#3fb950' },
  { icon: Globe, label: 'Which free platform is best?', color: '#e3b341' },
];

export function ChatView() {
  const { chatMessages, addChatMessage, clearChatMessages } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffContent, setDiffContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async (message?: string) => {
    const content = message || input;
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
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

      // Check if AI response contains a diff
      if (aiContent.includes('---') && aiContent.includes('+++') && aiContent.includes('@@')) {
        setDiffContent(aiContent);
        setShowDiff(true);
      }
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
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#58a6ff15' }}>
            <Sparkles className="w-4 h-4" style={{ color: '#58a6ff' }} />
          </div>
          <div>
            <h2 className="text-sm font-medium" style={{ color: '#c9d1d9' }}>AI Deployment Assistant</h2>
            <p className="text-[10px]" style={{ color: '#8b949e' }}>Ask about deployments, workflows, or hosting</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          style={{ color: '#8b949e' }}
          onClick={() => {
            clearChatMessages();
            setShowDiff(false);
          }}
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {chatMessages.length === 0 && !showDiff && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: '#58a6ff10' }}>
                <Sparkles className="w-8 h-8" style={{ color: '#58a6ff' }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: '#c9d1d9' }}>
                AI Deployment Assistant
              </h3>
              <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: '#8b949e' }}>
                Ask about deployment failures, workflow changes, or hosting recommendations
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto mt-6">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    className="flex items-center gap-2.5 text-xs px-4 py-3 rounded-xl border transition-all duration-200 hover:bg-[#21262d] hover:border-[#58a6ff] hover:-translate-y-0.5 text-left"
                    style={{ borderColor: '#30363d', color: '#8b949e' }}
                    onClick={() => sendMessage(action.label)}
                  >
                    <action.icon className="w-3.5 h-3.5 shrink-0" style={{ color: action.color }} />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Diff Viewer */}
          {showDiff && diffContent && (
            <div className="mb-4">
              <DiffViewer
                title="Suggested Workflow Change"
                diff={diffContent}
                language="yaml"
                onApprove={() => {
                  addChatMessage({
                    id: Date.now().toString(),
                    role: 'user',
                    content: 'APPROVE CHANGE',
                    timestamp: new Date().toISOString(),
                  });
                  setShowDiff(false);
                }}
                onReject={() => {
                  addChatMessage({
                    id: Date.now().toString(),
                    role: 'user',
                    content: 'Change rejected. Can you suggest an alternative?',
                    timestamp: new Date().toISOString(),
                  });
                  setShowDiff(false);
                }}
              />
            </div>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #30363d, #21262d)'
                    : 'linear-gradient(135deg, #58a6ff30, #3fb95020)',
                }}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" style={{ color: '#c9d1d9' }} />
                ) : (
                  <Bot className="w-4 h-4" style={{ color: '#58a6ff' }} />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user' ? 'text-right' : ''
                }`}
                style={{
                  backgroundColor: msg.role === 'user' ? '#30363d' : '#0d1117',
                  border: `1px solid ${msg.role === 'user' ? '#484f58' : '#21262d'}`,
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
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #58a6ff30, #3fb95020)' }}>
                <Bot className="w-4 h-4" style={{ color: '#58a6ff' }} />
              </div>
              <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#58a6ff' }} />
                <span className="text-xs" style={{ color: '#8b949e' }}>Thinking...</span>
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
            className="min-h-[40px] max-h-32 bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm resize-none rounded-xl focus:border-[#58a6ff]"
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
            className="rounded-xl shrink-0"
            style={{ background: input.trim() ? 'linear-gradient(135deg, #238636, #2ea043)' : '#21262d', color: input.trim() ? 'white' : '#484f58' }}
            onClick={() => sendMessage()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
