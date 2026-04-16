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
  Copy,
  Check,
  Paperclip,
  Bug,
  GitBranch,
  Server,
  Shield,
  Zap,
  Clock,
  MessageCircle,
  Rocket,
  BookOpen,
  Cpu,
  ThumbsUp,
  ThumbsDown,
  Container,
  GitCommitHorizontal,
  TestTube,
  Workflow,
  Terminal,
  ChevronRight,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Left Panel: Conversation Topic Chips ─── */
const CONVERSATION_TOPICS = [
  { icon: Container, label: 'Docker', question: 'How do I containerize my Next.js app with Docker?', color: '#58a6ff' },
  { icon: Workflow, label: 'CI/CD', question: 'Help me set up a CI/CD pipeline for my project', color: '#a371f7' },
  { icon: Rocket, label: 'Deployment', question: 'What are the best deployment strategies for my app?', color: '#3fb950' },
  { icon: GitBranch, label: 'GitHub Actions', question: 'How do I create a GitHub Actions workflow?', color: '#e3b341' },
  { icon: TestTube, label: 'Testing', question: 'How do I add automated tests to my deployment pipeline?', color: '#f85149' },
  { icon: Shield, label: 'Security', question: 'What security best practices should I follow for deployment?', color: '#79c0ff' },
  { icon: Terminal, label: 'Build Errors', question: 'My build is failing, can you help me debug it?', color: '#ff7b72' },
  { icon: Globe, label: 'Custom Domains', question: 'How do I set up a custom domain for my deployment?', color: '#3fb950' },
  { icon: GitCommitHorizontal, label: 'Branch Strategy', question: 'What branch strategy works best for deployment?', color: '#d2a8ff' },
  { icon: Zap, label: 'Performance', question: 'How can I optimize my deployment for better performance?', color: '#e3b341' },
];

const QUICK_ACTIONS = [
  { icon: AlertCircle, label: 'Why did my deployment fail?', color: '#f85149', desc: 'Debug deployment errors' },
  { icon: Code, label: 'Add a test step to my workflow', color: '#58a6ff', desc: 'Modify CI/CD pipeline' },
  { icon: Wrench, label: 'Build me a user profile page', color: '#3fb950', desc: 'Generate new feature code' },
  { icon: Globe, label: 'Which free platform is best?', color: '#e3b341', desc: 'Compare hosting options' },
];

/* ─── Context-aware Quick Action Chips ─── */
const CONTEXT_CHIPS = {
  default: [
    { icon: Bug, label: 'Fix a bug', color: '#f85149' },
    { icon: Code, label: 'Review my code', color: '#58a6ff' },
    { icon: Rocket, label: 'Deploy my app', color: '#3fb950' },
    { icon: Lightbulb, label: 'Suggest improvements', color: '#e3b341' },
  ],
  deployment: [
    { icon: Container, label: 'Docker setup', color: '#58a6ff' },
    { icon: RotateCcw, label: 'Rollback guide', color: '#f85149' },
    { icon: Globe, label: 'Custom domain', color: '#3fb950' },
    { icon: Zap, label: 'Optimize build', color: '#e3b341' },
  ],
  cicd: [
    { icon: Workflow, label: 'Add workflow', color: '#a371f7' },
    { icon: TestTube, label: 'Add tests', color: '#f85149' },
    { icon: Shield, label: 'Security scan', color: '#79c0ff' },
    { icon: Zap, label: 'Cache deps', color: '#e3b341' },
  ],
};

/* ─── Right Sidebar Data ─── */
const SUGGESTED_TOPICS = [
  { icon: Bug, label: 'Fix build errors', color: '#f85149' },
  { icon: Code, label: 'Add CI/CD pipeline', color: '#58a6ff' },
  { icon: GitBranch, label: 'Branch strategy', color: '#a371f7' },
  { icon: Server, label: 'Environment config', color: '#3fb950' },
  { icon: Shield, label: 'Security best practices', color: '#e3b341' },
  { icon: Globe, label: 'Custom domain setup', color: '#79c0ff' },
];

const RECENT_CONVERSATIONS = [
  { title: 'Vercel deployment 502 error', time: '2 hours ago' },
  { title: 'GitHub Actions workflow optimization', time: '5 hours ago' },
  { title: 'Railway vs Render comparison', time: 'Yesterday' },
];

const AI_CAPABILITIES = [
  { icon: Code, title: 'Code Review', desc: 'Analyze code for bugs & improvements', color: '#58a6ff' },
  { icon: Bug, title: 'Bug Analysis', desc: 'Diagnose errors & suggest fixes', color: '#f85149' },
  { icon: GitBranch, title: 'Workflow Help', desc: 'Build & optimize CI/CD pipelines', color: '#3fb950' },
  { icon: Globe, title: 'Hosting Advice', desc: 'Compare platforms & setup guides', color: '#e3b341' },
];

/* ─── Bouncing Typing Indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: '#58a6ff' }}
          animate={{
            y: [0, -6, 0],
            opacity: [0.4, 1, 0.4],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Copy Button for Messages ─── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#30363d]"
      style={{ color: '#8b949e' }}
      title="Copy message"
    >
      {copied ? <Check className="w-3 h-3" style={{ color: '#3fb950' }} /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ─── Message Reactions (thumbs up/down) ─── */
function MessageReactions({ messageId }: { messageId: string }) {
  const [thumbsUp, setThumbsUp] = useState(false);
  const [thumbsDown, setThumbsDown] = useState(false);

  const handleThumbsUp = () => {
    setThumbsUp(!thumbsUp);
    if (thumbsDown) setThumbsDown(false);
  };

  const handleThumbsDown = () => {
    setThumbsDown(!thumbsDown);
    if (thumbsUp) setThumbsUp(false);
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleThumbsUp}
        className="p-1 rounded transition-all duration-200 hover:bg-[#21262d]"
        style={{ color: thumbsUp ? '#3fb950' : '#484f58' }}
        title="Helpful"
      >
        <ThumbsUp className="w-3 h-3" />
      </button>
      <button
        onClick={handleThumbsDown}
        className="p-1 rounded transition-all duration-200 hover:bg-[#21262d]"
        style={{ color: thumbsDown ? '#f85149' : '#484f58' }}
        title="Not helpful"
      >
        <ThumbsDown className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ─── Syntax Highlighting Helper ─── */
const SYNTAX_KEYWORDS = [
  'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while',
  'import', 'export', 'from', 'default', 'class', 'extends', 'new', 'this',
  'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof',
  'switch', 'case', 'break', 'continue', 'true', 'false', 'null', 'undefined',
  'interface', 'type', 'enum', 'implements', 'abstract', 'static',
  'public', 'private', 'protected', 'readonly', 'void',
  'name', 'runs-on', 'on', 'jobs', 'steps', 'uses', 'with', 'run', 'env',
  'needs', 'if', 'permissions', 'contents', 'pull-requests', 'write',
  'checkout', 'setup-node', 'cache', 'npm-ci', 'build', 'deploy',
];

function highlightCode(code: string, language: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    const elements: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Check for comments
      const commentIdx = remaining.indexOf('//');
      const hashCommentIdx = remaining.indexOf('#');
      let earliestComment = -1;
      let commentChar = '';

      if (commentIdx !== -1 && (earliestComment === -1 || commentIdx < earliestComment)) {
        earliestComment = commentIdx;
        commentChar = '//';
      }
      if (hashCommentIdx !== -1 && language !== 'json' && (earliestComment === -1 || hashCommentIdx < earliestComment)) {
        // YAML/bash comments with #
        if (language === 'yaml' || language === 'yml' || language === 'bash' || language === 'sh' || !language) {
          if (earliestComment === -1 || hashCommentIdx < earliestComment) {
            earliestComment = hashCommentIdx;
            commentChar = '#';
          }
        }
      }

      if (earliestComment === 0) {
        elements.push(
          <span key={`${lineIdx}-${keyIdx++}`} style={{ color: '#8b949e' }}>
            {remaining}
          </span>
        );
        remaining = '';
        break;
      }

      if (earliestComment > 0) {
        const before = remaining.slice(0, earliestComment);
        const comment = remaining.slice(earliestComment);
        // Process before part for keywords/strings
        elements.push(...highlightLinePart(before, lineIdx, keyIdx));
        keyIdx += 10;
        elements.push(
          <span key={`${lineIdx}-comment-${keyIdx++}`} style={{ color: '#8b949e' }}>
            {comment}
          </span>
        );
        remaining = '';
        break;
      }

      // Check for strings
      const stringMatch = remaining.match(/^(.*?)((?:"[^"]*")|(?:'[^']*')|(?:`[^`]*`))/);
      if (stringMatch && stringMatch[2]) {
        const beforeStr = stringMatch[1];
        const str = stringMatch[2];
        elements.push(...highlightLinePart(beforeStr, lineIdx, keyIdx));
        keyIdx += 10;
        elements.push(
          <span key={`${lineIdx}-str-${keyIdx++}`} style={{ color: '#a5d6ff' }}>
            {str}
          </span>
        );
        remaining = remaining.slice(beforeStr.length + str.length);
        continue;
      }

      // No more patterns, just highlight keywords
      elements.push(...highlightLinePart(remaining, lineIdx, keyIdx));
      remaining = '';
    }

    if (lineIdx < lines.length - 1) {
      elements.push('\n');
    }
    return <React.Fragment key={lineIdx}>{elements}</React.Fragment>;
  });
}

function highlightLinePart(text: string, lineIdx: number, startKey: number): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Split by word boundaries to check keywords
  const parts = text.split(/(\b)/);
  let keyCounter = startKey;

  for (const part of parts) {
    if (SYNTAX_KEYWORDS.includes(part)) {
      result.push(
        <span key={`${lineIdx}-kw-${keyCounter++}`} style={{ color: '#ff7b72' }}>
          {part}
        </span>
      );
    } else {
      result.push(
        <span key={`${lineIdx}-txt-${keyCounter++}`} style={{ color: '#c9d1d9' }}>
          {part}
        </span>
      );
    }
  }
  return result;
}

/* ─── Code Block Renderer with Syntax Highlighting ─── */
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3);
          const firstNewline = lines.indexOf('\n');
          const language = firstNewline > 0 ? lines.slice(0, firstNewline).trim() : '';
          const code = firstNewline > 0 ? lines.slice(firstNewline + 1) : lines;

          return (
            <div
              key={i}
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}
            >
              {language && (
                <div
                  className="px-3 py-1.5 text-[10px] font-mono flex items-center justify-between"
                  style={{ backgroundColor: '#161b22', color: '#8b949e', borderBottom: '1px solid #21262d' }}
                >
                  <div className="flex items-center gap-1.5">
                    <Code className="w-3 h-3" style={{ color: '#58a6ff' }} />
                    <span>{language}</span>
                  </div>
                  <CopyButton text={code} />
                </div>
              )}
              {!language && (
                <div
                  className="px-3 py-1 text-[10px] font-mono flex items-center justify-end"
                  style={{ backgroundColor: '#161b22', color: '#8b949e', borderBottom: '1px solid #21262d' }}
                >
                  <CopyButton text={code} />
                </div>
              )}
              <pre className="p-3 overflow-x-auto custom-scroll">
                <code className="text-xs font-mono leading-relaxed">
                  {highlightCode(code, language)}
                </code>
              </pre>
            </div>
          );
        }

        // Handle bold text
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i} className="whitespace-pre-wrap font-mono text-xs leading-relaxed" style={{ color: '#c9d1d9' }}>
            {boldParts.map((bp, j) => {
              if (bp.startsWith('**') && bp.endsWith('**')) {
                return (
                  <strong key={j} style={{ color: '#e6edf3', fontWeight: 600 }}>
                    {bp.slice(2, -2)}
                  </strong>
                );
              }

              // Handle inline code
              const textParts = bp.split(/(`[^`]+`)/g);
              return textParts.map((tp, k) => {
                if (tp.startsWith('`') && tp.endsWith('`')) {
                  return (
                    <code
                      key={`${j}-${k}`}
                      className="px-1.5 py-0.5 rounded text-[11px]"
                      style={{ backgroundColor: '#161b22', color: '#58a6ff', border: '1px solid #21262d' }}
                    >
                      {tp.slice(1, -1)}
                    </code>
                  );
                }
                return <span key={`${j}-${k}`}>{tp}</span>;
              });
            })}
          </span>
        );
      })}
    </div>
  );
}

export function ChatView() {
  const { chatMessages, addChatMessage, clearChatMessages } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffContent, setDiffContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [contextType, setContextType] = useState<'default' | 'deployment' | 'cicd'>('default');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Detect context from last message
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1].content.toLowerCase();
      if (lastMsg.includes('deploy') || lastMsg.includes('vercel') || lastMsg.includes('docker') || lastMsg.includes('hosting')) {
        setContextType('deployment');
      } else if (lastMsg.includes('ci/cd') || lastMsg.includes('pipeline') || lastMsg.includes('workflow') || lastMsg.includes('github actions')) {
        setContextType('cicd');
      } else {
        setContextType('default');
      }
    }
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
    setCharCount(0);
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

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentChips = CONTEXT_CHIPS[contextType];

  return (
    <div className="flex h-[calc(100vh-140px)]">
      {/* ─── Left Panel: Conversation Topics ─── */}
      <AnimatePresence>
        {leftPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-r overflow-hidden flex-shrink-0 hidden md:block"
            style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}
          >
            <div className="p-3 space-y-3 h-full overflow-y-auto custom-scroll">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#484f58' }}>
                  Topics
                </h3>
                <button
                  onClick={() => setLeftPanelOpen(false)}
                  className="p-0.5 rounded hover:bg-[#21262d] transition-colors"
                  style={{ color: '#484f58' }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Topic chips */}
              <div className="space-y-1.5">
                {CONVERSATION_TOPICS.map((topic, i) => {
                  const Icon = topic.icon;
                  return (
                    <motion.button
                      key={topic.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className="w-full flex items-center gap-2 text-[11px] px-2.5 py-2 rounded-lg transition-all duration-200 hover:bg-[#161b22] text-left group"
                      style={{ color: '#8b949e', border: '1px solid transparent' }}
                      onClick={() => sendMessage(topic.question)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = `${topic.color}40`;
                        (e.currentTarget as HTMLElement).style.color = '#c9d1d9';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#8b949e';
                      }}
                    >
                      <div
                        className="p-1 rounded shrink-0 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${topic.color}15` }}
                      >
                        <Icon className="w-3 h-3" style={{ color: topic.color }} />
                      </div>
                      <span className="truncate">{topic.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Help text */}
              <div
                className="text-[9px] text-center px-2 py-2 rounded-lg"
                style={{ backgroundColor: '#161b22', color: '#484f58', border: '1px solid #21262d' }}
              >
                Click any topic to ask a question
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button when panel is closed */}
      {!leftPanelOpen && (
        <div className="hidden md:flex items-start pt-3 pl-2">
          <button
            onClick={() => setLeftPanelOpen(true)}
            className="p-1 rounded hover:bg-[#21262d] transition-colors"
            style={{ color: '#484f58' }}
            title="Show topics"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}

      {/* Chat Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
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
          <div className="flex items-center gap-2">
            {/* Context indicator */}
            {contextType !== 'default' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: contextType === 'deployment' ? '#3fb95015' : '#a371f715',
                  color: contextType === 'deployment' ? '#3fb950' : '#a371f7',
                  border: `1px solid ${contextType === 'deployment' ? '#3fb95030' : '#a371f730'}`,
                }}
              >
                {contextType === 'deployment' ? '🚀 Deployment' : '⚙️ CI/CD'} context
              </motion.div>
            )}
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
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {chatMessages.length === 0 && !showDiff && (
              /* ─── Better Empty State ─── */
              <div className="text-center py-10 flex flex-col items-center">
                {/* Larger Sparkles icon with pulsing ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="relative w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-5"
                  style={{ backgroundColor: '#58a6ff10' }}
                >
                  <Sparkles className="w-10 h-10" style={{ color: '#58a6ff' }} />
                  {/* Pulsing ring */}
                  <div className="absolute inset-[-4px] rounded-2xl animate-pulse-ring"
                    style={{
                      border: '2px solid transparent',
                      backgroundImage: 'linear-gradient(#161b22, #161b22), linear-gradient(135deg, #58a6ff, #3fb950, #e3b341)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                    }}
                  />
                </motion.div>

                {/* Gradient text title */}
                <h3
                  className="text-xl font-bold mb-2"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #58a6ff, #3fb950)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  AI Deployment Assistant
                </h3>
                <p className="text-sm max-w-md mx-auto" style={{ color: '#8b949e' }}>
                  Ask about deployment failures, workflow changes, or hosting recommendations
                </p>

                {/* Quick action cards in 2x2 grid with better hierarchy */}
                <div className="grid grid-cols-2 gap-2.5 max-w-lg mx-auto mt-6 w-full">
                  {QUICK_ACTIONS.map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                        className="flex items-start gap-3 text-left px-4 py-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 group"
                        style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}
                        onClick={() => sendMessage(action.label)}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = action.color;
                          (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${action.color}08, #0d1117)`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#30363d';
                          (e.currentTarget as HTMLElement).style.background = '#0d1117';
                        }}
                      >
                        <div
                          className="p-2 rounded-lg shrink-0 group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: `${action.color}15` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: action.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: '#c9d1d9' }}>{action.label}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>{action.desc}</p>
                        </div>
                      </motion.button>
                    );
                  })}
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

            <AnimatePresence mode="popLayout">
              {chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className="relative shrink-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
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
                    {/* AI avatar pulsing ring */}
                    {msg.role === 'assistant' && (
                      <div className="absolute inset-0 rounded-xl animate-pulse-ring" style={{ border: '1.5px solid rgba(88,166,255,0.3)' }} />
                    )}
                  </div>
                  <div className={`max-w-[80%] group relative ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className="rounded-2xl px-4 py-3 text-sm"
                      style={{
                        backgroundColor: msg.role === 'user'
                          ? '#2d333b'
                          : undefined,
                        border: msg.role === 'user'
                          ? '1px solid #444c56'
                          : '1px solid #21262d',
                        // Gradient background for assistant messages
                        ...(msg.role === 'assistant' ? {
                          background: 'linear-gradient(135deg, #161b22 0%, #0d1117 50%, #161b22 100%)',
                          borderLeft: '2px solid transparent',
                          borderImage: 'linear-gradient(to bottom, #58a6ff, #3fb950) 1',
                          borderImageSlice: 1,
                        } : {}),
                        color: '#c9d1d9',
                      }}
                    >
                      <MessageContent content={msg.content} />
                    </div>
                    {/* Timestamp + Copy + Reactions */}
                    <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px]" style={{ color: '#484f58' }}>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                      <CopyButton text={msg.content} />
                      {msg.role === 'assistant' && (
                        <MessageReactions messageId={msg.id} />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #58a6ff30, #3fb95020)' }}>
                    <Bot className="w-4 h-4" style={{ color: '#58a6ff' }} />
                  </div>
                  <div className="absolute inset-0 rounded-xl animate-pulse-ring" style={{ border: '1.5px solid rgba(88,166,255,0.3)' }} />
                </div>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-2.5" style={{
                  background: 'linear-gradient(135deg, #161b22 0%, #0d1117 50%, #161b22 100%)',
                  border: '1px solid #21262d',
                  borderLeft: '2px solid #58a6ff',
                }}>
                  <TypingIndicator />
                  <span className="text-xs ml-1" style={{ color: '#8b949e' }}>Thinking</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* ─── Enhanced Input Area ─── */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#30363d' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                {/* Attach file button (mock) */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <button
                    className="p-1 rounded-md transition-colors hover:bg-[#30363d]"
                    style={{ color: '#484f58' }}
                    title="Attach file (coming soon)"
                    onClick={() => {}}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                  placeholder="Ask about deployment, workflows, or hosting..."
                  className="min-h-[44px] max-h-32 bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm resize-none rounded-xl focus:border-[#58a6ff] pl-10 pr-14"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                />
                {/* Character count */}
                {charCount > 0 && (
                  <span
                    className="absolute right-3 bottom-2 text-[10px] font-mono"
                    style={{ color: charCount > 1800 ? '#f85149' : '#484f58' }}
                  >
                    {charCount}/2000
                  </span>
                )}
              </div>
              <Button
                size="icon"
                disabled={!input.trim() || isLoading}
                className="rounded-xl shrink-0 transition-all duration-300 h-[44px] w-[44px]"
                style={{
                  background: input.trim()
                    ? 'linear-gradient(135deg, #58a6ff, #238636)'
                    : '#21262d',
                  color: input.trim() ? 'white' : '#484f58',
                  boxShadow: input.trim()
                    ? '0 0 20px rgba(88,166,255,0.3), 0 0 40px rgba(35,134,54,0.15)'
                    : 'none',
                }}
                onClick={() => sendMessage()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* ─── Quick Action Suggestion Chips Below Input ─── */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto custom-scroll pb-0.5">
              <span className="text-[9px] shrink-0 mr-0.5" style={{ color: '#484f58' }}>Suggest:</span>
              {currentChips.map((chip, i) => {
                const Icon = chip.icon;
                return (
                  <motion.button
                    key={`${contextType}-${chip.label}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full shrink-0 transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: `${chip.color}10`,
                      color: chip.color,
                      border: `1px solid ${chip.color}25`,
                    }}
                    onClick={() => sendMessage(chip.label)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = `${chip.color}20`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${chip.color}50`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = `${chip.color}10`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${chip.color}25`;
                    }}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    {chip.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Sidebar Panel ─── */}
      <div className="w-72 border-l hidden lg:block overflow-y-auto custom-scroll" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
        <div className="p-4 space-y-5">
          {/* Conversation Topics */}
          <div>
            <h3 className="text-xs font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
              <MessageCircle className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} /> Conversation Topics
            </h3>
            <div className="space-y-1">
              {SUGGESTED_TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <motion.button
                    key={topic.label}
                    whileHover={{ x: 4 }}
                    className="w-full flex items-center gap-2.5 text-xs px-3 py-2 rounded-lg transition-all duration-200 hover:bg-[#21262d] text-left group"
                    style={{ color: '#8b949e' }}
                    onClick={() => sendMessage(topic.label)}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" style={{ color: topic.color }} />
                    <span className="truncate">{topic.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Recent Conversations */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#484f58' }}>
              <Clock className="w-3 h-3" /> Recent Conversations
            </h3>
            <div className="space-y-1">
              {RECENT_CONVERSATIONS.map((conv) => (
                <button
                  key={conv.title}
                  className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-[#21262d]"
                  onClick={() => sendMessage(`Continue: ${conv.title}`)}
                >
                  <p className="text-xs truncate" style={{ color: '#c9d1d9' }}>{conv.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>{conv.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Capabilities */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: '#484f58' }}>
              <Cpu className="w-3 h-3" /> AI Capabilities
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {AI_CAPABILITIES.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <motion.div
                    key={cap.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 hover:border-[#58a6ff] cursor-pointer group"
                    style={{ borderColor: '#21262d', backgroundColor: '#0d1117' }}
                    onClick={() => sendMessage(`Help me with ${cap.title.toLowerCase()}`)}
                  >
                    <div
                      className="p-1.5 rounded-md shrink-0 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${cap.color}15` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: cap.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium" style={{ color: '#c9d1d9' }}>{cap.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>{cap.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick help text */}
          <div
            className="text-[10px] text-center px-3 py-2 rounded-lg"
            style={{ backgroundColor: '#0d1117', color: '#484f58', border: '1px solid #21262d' }}
          >
            <BookOpen className="w-3 h-3 inline-block mr-1" style={{ color: '#58a6ff' }} />
            Type a question or click any topic to start
          </div>
        </div>
      </div>
    </div>
  );
}
