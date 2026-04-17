'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppStore, type ChatMessage } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DiffViewer } from '@/components/diff-viewer';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
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
  ChevronDown,
  Lightbulb,
  RotateCcw,
  Mic,
  Download,
  Share2,
  Star,
  Search,
  History,
  CpuIcon,
  Activity,
  Hash,
  Monitor,
  Database,
  ArrowRight,
  Square,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Popular Questions FAQ ─── */
const POPULAR_QUESTIONS = [
  { q: 'How do I deploy a Next.js app to Vercel?', a: 'Connect your GitHub repo, configure build settings, and deploy with zero-config. Vercel auto-detects Next.js and sets up preview deployments for every PR.', code: 'npx vercel --prod' },
  { q: 'What\'s the best CI/CD pipeline for a monorepo?', a: 'Use GitHub Actions with path-based triggers. Configure separate workflows for each package, share caching across jobs, and use matrix builds for parallel testing.', code: 'on:\n  push:\n    paths: \'packages/auth/**\'' },
  { q: 'How do I set up Docker for my Node.js app?', a: 'Start with a multi-stage Dockerfile: use node:20-alpine as builder, copy package.json first for caching, then copy source. Expose your port and add health checks.', code: 'FROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build' },
  { q: 'How to configure custom domains with SSL?', a: 'Most platforms (Vercel, Netlify) auto-provision SSL via Let\'s Encrypt. Add your domain in DNS settings, create a CNAME record pointing to the platform, and SSL is handled automatically.', code: null },
  { q: 'What are GitHub Actions best practices?', a: 'Cache dependencies, use matrix builds for parallelism, pin action versions with SHA, use secrets for credentials, and set timeout-minutes to prevent runaway workflows.', code: '- uses: actions/checkout@v3  # Pin to SHA for security\n- uses: actions/cache@v3' },
  { q: 'How do I implement blue-green deployments?', a: 'Maintain two identical environments. Route traffic to the "blue" (live) environment. Deploy to "green", test it, then switch the router. Rollback by switching back to blue.', code: 'kubectl label service/app color=green' },
];

/* ─── Recent Activity Timeline ─── */
const RECENT_ACTIVITY_ITEMS = [
  { icon: Rocket, text: 'Deployed my-app to Vercel', time: '5 min ago', color: '#3fb950' },
  { icon: GitBranch, text: 'Merged PR #42 into main', time: '1 hour ago', color: '#a371f7' },
  { icon: AlertCircle, text: 'Build failed on staging branch', time: '3 hours ago', color: '#f85149' },
  { icon: Check, text: 'All tests passed in CI pipeline', time: '5 hours ago', color: '#3fb950' },
];

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
    { icon: Bug, label: 'Fix a bug', color: '#f85149', tooltip: 'Debug and fix code issues' },
    { icon: Code, label: 'Review my code', color: '#58a6ff', tooltip: 'Get AI-powered code review' },
    { icon: Rocket, label: 'Deploy my app', color: '#3fb950', tooltip: 'Deploy to any platform' },
    { icon: Lightbulb, label: 'Suggest improvements', color: '#e3b341', tooltip: 'AI improvement suggestions' },
  ],
  deployment: [
    { icon: Container, label: 'Docker setup', color: '#58a6ff', tooltip: 'Containerize your app' },
    { icon: RotateCcw, label: 'Rollback guide', color: '#f85149', tooltip: 'How to rollback a deployment' },
    { icon: Globe, label: 'Custom domain', color: '#3fb950', tooltip: 'Configure custom domains' },
    { icon: Zap, label: 'Optimize build', color: '#e3b341', tooltip: 'Speed up your build' },
  ],
  cicd: [
    { icon: Workflow, label: 'Add workflow', color: '#a371f7', tooltip: 'Create CI/CD workflow' },
    { icon: TestTube, label: 'Add tests', color: '#f85149', tooltip: 'Set up automated tests' },
    { icon: Shield, label: 'Security scan', color: '#79c0ff', tooltip: 'Security vulnerability scan' },
    { icon: Zap, label: 'Cache deps', color: '#e3b341', tooltip: 'Optimize dependency caching' },
  ],
  docker: [
    { icon: Container, label: 'Dockerfile help', color: '#58a6ff', tooltip: 'Generate Dockerfile' },
    { icon: Globe, label: 'Docker Compose', color: '#3fb950', tooltip: 'Multi-container setup' },
    { icon: Shield, label: 'Image security', color: '#f85149', tooltip: 'Scan for vulnerabilities' },
    { icon: Zap, label: 'Optimize image', color: '#e3b341', tooltip: 'Reduce image size' },
  ],
  kubernetes: [
    { icon: Server, label: 'K8s deploy', color: '#58a6ff', tooltip: 'Kubernetes deployment' },
    { icon: Database, label: 'Helm charts', color: '#a371f7', tooltip: 'Package management' },
    { icon: Monitor, label: 'Monitoring', color: '#3fb950', tooltip: 'Set up monitoring' },
    { icon: Shield, label: 'K8s security', color: '#f85149', tooltip: 'Pod security policies' },
  ],
  monitoring: [
    { icon: Activity, label: 'Set up alerts', color: '#f85149', tooltip: 'Configure alerting' },
    { icon: Monitor, label: 'Dashboards', color: '#58a6ff', tooltip: 'Build monitoring dashboards' },
    { icon: Hash, label: 'Log aggregation', color: '#3fb950', tooltip: 'Centralized logging' },
    { icon: Zap, label: 'APM setup', color: '#e3b341', tooltip: 'Application performance' },
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

/* ─── Quick References for Right Sidebar ─── */
const QUICK_REFERENCES = [
  { title: 'Deploy to Vercel', code: 'npx vercel --prod', lang: 'bash' },
  { title: 'Docker Build', code: 'docker build -t myapp .', lang: 'bash' },
  { title: 'GitHub Actions YML', code: `on:\n  push:\n    branches: [main]\njobs:\n  build:\n    runs-on: ubuntu-latest`, lang: 'yaml' },
];

/* ─── Quick Reference Item (separate component for hook rules) ─── */
function QuickReferenceItem({ item }: { item: { title: string; code: string; lang: string } }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        className="w-full flex items-center justify-between text-[11px] px-2.5 py-2 rounded-lg transition-colors hover:bg-[#21262d]"
        style={{ color: '#8b949e' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span>{item.title}</span>
        <ChevronDown
          className="w-3 h-3 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-1 rounded-lg overflow-hidden"
          style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}
        >
          <pre className="p-2 text-[9px] font-mono overflow-x-auto custom-scroll" style={{ color: '#c9d1d9' }}>
            {item.code}
          </pre>
        </motion.div>
      )}
    </div>
  );
}

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

/* ─── Share Button ─── */
function ShareButton({ text }: { text: string }) {
  const [shared, setShared] = useState(false);
  const handleShare = () => {
    navigator.clipboard.writeText(text);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };
  return (
    <button
      onClick={handleShare}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#30363d]"
      style={{ color: '#8b949e' }}
      title="Share message"
    >
      {shared ? <Check className="w-3 h-3" style={{ color: '#3fb950' }} /> : <Share2 className="w-3 h-3" />}
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
      const commentIdx = remaining.indexOf('//');
      const hashCommentIdx = remaining.indexOf('#');
      let earliestComment = -1;
      let commentChar = '';

      if (commentIdx !== -1 && (earliestComment === -1 || commentIdx < earliestComment)) {
        earliestComment = commentIdx;
        commentChar = '//';
      }
      if (hashCommentIdx !== -1 && language !== 'json' && (earliestComment === -1 || hashCommentIdx < earliestComment)) {
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

/* ─── Code Block Renderer with Syntax Highlighting + Line Numbers ─── */
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
          const codeLines = code.split('\n');
          const lineCount = codeLines.length;

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
                    <span style={{ color: '#484f58' }}>{lineCount} lines</span>
                  </div>
                  <CopyButton text={code} />
                </div>
              )}
              {!language && (
                <div
                  className="px-3 py-1 text-[10px] font-mono flex items-center justify-between"
                  style={{ backgroundColor: '#161b22', color: '#8b949e', borderBottom: '1px solid #21262d' }}
                >
                  <span style={{ color: '#484f58' }}>{lineCount} lines</span>
                  <CopyButton text={code} />
                </div>
              )}
              <div className="flex">
                {/* Line numbers column */}
                <div
                  className="select-none py-3 pl-3 pr-2 text-right shrink-0"
                  style={{ color: '#484f58', borderRight: '1px solid #21262d', backgroundColor: '#0d1117' }}
                >
                  {codeLines.map((_, lineIdx) => (
                    <div key={lineIdx} className="text-[10px] font-mono leading-relaxed">
                      {lineIdx + 1}
                    </div>
                  ))}
                </div>
                <pre className="p-3 overflow-x-auto custom-scroll flex-1">
                  <code className="text-xs font-mono leading-relaxed">
                    {highlightCode(code, language)}
                  </code>
                </pre>
              </div>
            </div>
          );
        }

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

/* ─── New Message Glow Effect ─── */
function NewMessageGlow({ children, messageId }: { children: React.ReactNode; messageId: string }) {
  const [glowing, setGlowing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setGlowing(false), 3000);
    return () => clearTimeout(timer);
  }, [messageId]);

  return (
    <motion.div
      animate={glowing ? {
        boxShadow: ['0 0 0px rgba(88,166,255,0)', '0 0 15px rgba(88,166,255,0.3)', '0 0 0px rgba(88,166,255,0)'],
      } : {}}
      transition={glowing ? { duration: 1.5, repeat: 2 } : { duration: 0.3 }}
      style={{ borderRadius: '16px' }}
    >
      {children}
    </motion.div>
  );
}

/* ─── AI Mode Selector ─── */
type AIMode = 'creative' | 'balanced' | 'precise';
const AI_MODES: { value: AIMode; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { value: 'creative', label: 'Creative', icon: Sparkles, color: '#a371f7', desc: 'More exploratory, creative solutions' },
  { value: 'balanced', label: 'Balanced', icon: Zap, color: '#58a6ff', desc: 'Balanced approach, best for most tasks' },
  { value: 'precise', label: 'Precise', icon: Target, color: '#3fb950', desc: 'Focused, accurate, technical answers' },
];

function Target(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function ChatView() {
  const { chatMessages, addChatMessage, clearChatMessages } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [diffContent, setDiffContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [contextType, setContextType] = useState<'default' | 'deployment' | 'cicd' | 'docker' | 'kubernetes' | 'monitoring'>('default');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [topicSearch, setTopicSearch] = useState('');
  const [aiMode, setAIMode] = useState<AIMode>('balanced');
  const [showAIModeMenu, setShowAIModeMenu] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiModeRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionElapsed(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const formatSessionTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Export chat as markdown
  const exportChat = useCallback(() => {
    const md = chatMessages.map(m => {
      const role = m.role === 'user' ? '**You**' : '**AI Assistant**';
      const time = new Date(m.timestamp).toLocaleString();
      return `${role} _(${time})_\n\n${m.content}`;
    }).join('\n\n---\n\n');
    const header = `# GitDeploy AI - Chat Export\n_Exported on ${new Date().toLocaleString()}_\n\n---\n\n`;
    const blob = new Blob([header + md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chatMessages]);

  // Session stats
  const sessionStats = useMemo(() => {
    const userMsgs = chatMessages.filter(m => m.role === 'user').length;
    const assistantMsgs = chatMessages.filter(m => m.role === 'assistant').length;
    return { total: chatMessages.length, userMsgs, assistantMsgs };
  }, [chatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Close AI mode menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (aiModeRef.current && !aiModeRef.current.contains(e.target as Node)) {
        setShowAIModeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Detect context from last message
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1].content.toLowerCase();
      if (lastMsg.includes('kubernetes') || lastMsg.includes('k8s') || lastMsg.includes('helm') || lastMsg.includes('pod')) {
        setContextType('kubernetes');
      } else if (lastMsg.includes('monitoring') || lastMsg.includes('grafana') || lastMsg.includes('prometheus') || lastMsg.includes('alert')) {
        setContextType('monitoring');
      } else if (lastMsg.includes('docker') || lastMsg.includes('container') || lastMsg.includes('dockerfile') || lastMsg.includes('compose')) {
        setContextType('docker');
      } else if (lastMsg.includes('deploy') || lastMsg.includes('vercel') || lastMsg.includes('hosting')) {
        setContextType('deployment');
      } else if (lastMsg.includes('ci/cd') || lastMsg.includes('pipeline') || lastMsg.includes('workflow') || lastMsg.includes('github actions')) {
        setContextType('cicd');
      } else {
        setContextType('default');
      }
    }
  }, [chatMessages]);

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Save whatever we've streamed so far as a message
    if (streamingContent) {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: streamingContent + '\n\n_⏹ Stopped generating_',
        timestamp: new Date().toISOString(),
      });
    }
    setStreamingContent('');
    setIsStreaming(false);
    setIsLoading(false);
  };

  const sendMessage = async (message?: string) => {
    const content = message || input;
    if (!content.trim() || isLoading || isStreaming) return;

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
    setStreamingContent('');
    setIsStreaming(false);

    try {
      const messages = [...chatMessages, userMsg].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Create AbortController for cancellation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, mode: 'chat-assistant', stream: true }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }

      // Check if the response is a stream (SSE)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        setIsStreaming(true);
        setIsLoading(false);

        let fullContent = '';
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No reader available');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === '') continue;

            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Skip unparseable chunks
              }
            }
          }
        }

        // Streaming complete — add final message
        const aiContent = fullContent || 'Sorry, I could not generate a response.';
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiContent,
          timestamp: new Date().toISOString(),
        });

        if (aiContent.includes('---') && aiContent.includes('+++') && aiContent.includes('@@')) {
          setDiffContent(aiContent);
          setShowDiff(true);
        }
      } else {
        // Fallback: non-streaming JSON response
        const data = await res.json();
        const aiContent = data.response || 'Sorry, I could not generate a response.';

        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiContent,
          timestamp: new Date().toISOString(),
        });

        if (aiContent.includes('---') && aiContent.includes('+++') && aiContent.includes('@@')) {
          setDiffContent(aiContent);
          setShowDiff(true);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled — already handled in stopStreaming
      } else {
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Error: Could not reach AI service. Please try again.',
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentChips = CONTEXT_CHIPS[contextType] || CONTEXT_CHIPS.default;
  const currentMode = AI_MODES.find(m => m.value === aiMode)!;
  const filteredTopics = CONVERSATION_TOPICS.filter(t =>
    t.label.toLowerCase().includes(topicSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)]">
      {/* ─── Left Panel: Enhanced with Search, Favorites, Topics, History ─── */}
      <AnimatePresence>
        {leftPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-r overflow-hidden flex-shrink-0 hidden md:block"
            style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}
          >
            <div className="p-3 space-y-3 h-full overflow-y-auto custom-scroll">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#484f58' }}>
                  Explore
                </h3>
                <button
                  onClick={() => setLeftPanelOpen(false)}
                  className="p-0.5 rounded hover:bg-[#21262d] transition-colors"
                  style={{ color: '#484f58' }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#484f58' }} />
                <input
                  type="text"
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  placeholder="Search topics..."
                  className="w-full text-[11px] pl-7 pr-3 py-1.5 rounded-lg border focus:outline-none focus:border-[#58a6ff] transition-colors"
                  style={{ backgroundColor: '#161b22', borderColor: '#21262d', color: '#c9d1d9' }}
                />
              </div>

              {/* Favorites section */}
              <div>
                <h4 className="text-[9px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: '#484f58' }}>
                  <Star className="w-2.5 h-2.5" style={{ color: '#e3b341' }} /> Favorites
                </h4>
                <div className="space-y-0.5">
                  {[
                    { label: 'Deploy Next.js to Vercel', color: '#3fb950' },
                    { label: 'Docker Compose Setup', color: '#58a6ff' },
                  ].map((fav) => (
                    <button
                      key={fav.label}
                      className="w-full flex items-center gap-2 text-[10px] px-2 py-1.5 rounded-lg transition-colors hover:bg-[#161b22] text-left"
                      style={{ color: '#8b949e' }}
                      onClick={() => sendMessage(fav.label)}
                    >
                      <Star className="w-2.5 h-2.5 shrink-0" style={{ color: '#e3b341' }} />
                      <span className="truncate">{fav.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div>
                <h4 className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#484f58' }}>
                  Topics
                </h4>
                <div className="space-y-1">
                  {filteredTopics.map((topic, i) => {
                    const Icon = topic.icon;
                    return (
                      <motion.button
                        key={topic.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className="w-full flex items-center gap-2 text-[11px] px-2.5 py-2 rounded-lg transition-all duration-200 hover:bg-[#161b22] text-left group cursor-grab active:cursor-grabbing"
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
              </div>

              {/* Conversation History */}
              <div>
                <h4 className="text-[9px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: '#484f58' }}>
                  <History className="w-2.5 h-2.5" /> History
                </h4>
                <div className="space-y-0.5">
                  {RECENT_CONVERSATIONS.map((conv) => (
                    <button
                      key={conv.title}
                      className="w-full text-left px-2 py-1.5 rounded-lg transition-colors hover:bg-[#161b22]"
                      onClick={() => sendMessage(`Continue: ${conv.title}`)}
                    >
                      <p className="text-[10px] truncate" style={{ color: '#8b949e' }}>{conv.title}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: '#484f58' }}>{conv.time}</p>
                    </button>
                  ))}
                </div>
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
                {contextType === 'deployment' ? '🚀 Deployment' : contextType === 'cicd' ? '⚙️ CI/CD' : contextType === 'docker' ? '🐳 Docker' : contextType === 'kubernetes' ? '☸️ K8s' : '📊 Monitoring'} context
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
              /* ─── Enhanced Empty State ─── */
              <div className="py-6">
                {/* Animated gradient mesh background */}
                <div className="relative rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #30363d' }}>
                  {/* Gradient mesh BG */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 left-1/4 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, #58a6ff20, transparent)', animation: 'float 6s ease-in-out infinite' }} />
                    <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, #3fb95020, transparent)', animation: 'float 8s ease-in-out infinite reverse' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, #a371f720, transparent)', animation: 'float 7s ease-in-out infinite' }} />
                  </div>

                  <div className="relative p-8 text-center" style={{ backgroundColor: '#0d111780' }}>
                    {/* Sparkles icon with pulsing ring */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, type: 'spring' }}
                      className="relative w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4"
                      style={{ backgroundColor: '#58a6ff10' }}
                    >
                      <Sparkles className="w-10 h-10" style={{ color: '#58a6ff' }} />
                      <div className="absolute inset-[-4px] rounded-2xl animate-pulse-ring"
                        style={{
                          border: '2px solid transparent',
                          backgroundImage: 'linear-gradient(#161b22, #161b22), linear-gradient(135deg, #58a6ff, #3fb950, #e3b341)',
                          backgroundOrigin: 'border-box',
                          backgroundClip: 'padding-box, border-box',
                        }}
                      />
                    </motion.div>

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

                    {/* Quick action cards 2x2 */}
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
                </div>

                {/* Popular Questions FAQ */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                    <MessageCircle className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} /> Popular Questions
                  </h3>
                  <div className="space-y-1.5">
                    {POPULAR_QUESTIONS.map((faq, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05, duration: 0.25 }}
                      >
                        <button
                          className="w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200"
                          style={{
                            backgroundColor: expandedFAQ === i ? '#161b22' : '#0d1117',
                            borderColor: expandedFAQ === i ? '#58a6ff40' : '#21262d',
                          }}
                          onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-medium" style={{ color: '#c9d1d9' }}>{faq.q}</p>
                            <ChevronDown
                              className="w-3 h-3 shrink-0 transition-transform duration-200"
                              style={{
                                color: '#484f58',
                                transform: expandedFAQ === i ? 'rotate(180deg)' : 'rotate(0deg)',
                              }}
                            />
                          </div>
                          <AnimatePresence>
                            {expandedFAQ === i && (
                              <motion.p
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-[10px] mt-2 leading-relaxed overflow-hidden"
                                style={{ color: '#8b949e' }}
                              >
                                {faq.a}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: '#3fb950' }} /> Recent Activity
                  </h3>
                  <div className="space-y-0">
                    {RECENT_ACTIVITY_ITEMS.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.06, duration: 0.25 }}
                          className="flex items-center gap-3 py-2 relative"
                        >
                          {i < RECENT_ACTIVITY_ITEMS.length - 1 && (
                            <div className="absolute left-[11px] top-8 bottom-0 w-px" style={{ backgroundColor: '#21262d' }} />
                          )}
                          <div
                            className="p-1.5 rounded-md shrink-0 z-10"
                            style={{ backgroundColor: `${item.color}15` }}
                          >
                            <Icon className="w-3 h-3" style={{ color: item.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px]" style={{ color: '#c9d1d9' }}>{item.text}</p>
                            <p className="text-[9px]" style={{ color: '#484f58' }}>{item.time}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Capabilities Showcase - 4 cards */}
                <div>
                  <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                    <Cpu className="w-3.5 h-3.5" style={{ color: '#a371f7' }} /> AI Capabilities
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {AI_CAPABILITIES.map((cap, i) => {
                      const Icon = cap.icon;
                      return (
                        <motion.button
                          key={cap.title}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                          className="flex items-start gap-2.5 px-3 py-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 group text-left"
                          style={{ borderColor: '#21262d', backgroundColor: '#0d1117' }}
                          onClick={() => sendMessage(`Help me with ${cap.title.toLowerCase()}`)}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = `${cap.color}50`;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = '#21262d';
                          }}
                        >
                          <div
                            className="p-2 rounded-lg shrink-0 group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: `${cap.color}15` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: cap.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium" style={{ color: '#c9d1d9' }}>{cap.title}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>{cap.desc}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
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
                    {msg.role === 'assistant' && (
                      <div className="absolute inset-0 rounded-xl animate-pulse-ring" style={{ border: '1.5px solid rgba(88,166,255,0.3)' }} />
                    )}
                  </div>
                  <div className={`max-w-[80%] group relative ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <NewMessageGlow messageId={msg.id}>
                      <div
                        className="rounded-2xl px-4 py-3 text-sm"
                        style={{
                          backgroundColor: msg.role === 'user'
                            ? undefined
                            : undefined,
                          border: msg.role === 'user'
                            ? '1px solid #444c56'
                            : '1px solid #21262d',
                          // Gradient bg for user messages (dark blue tint)
                          ...(msg.role === 'user' ? {
                            background: 'linear-gradient(135deg, #1a2744, #1e2d4a, #1a2744)',
                          } : {
                            // Gradient bg for assistant messages
                            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 50%, #161b22 100%)',
                            borderLeft: '2px solid transparent',
                            borderImage: 'linear-gradient(to bottom, #58a6ff, #3fb950) 1',
                            borderImageSlice: 1,
                          }),
                          color: '#c9d1d9',
                        }}
                      >
                        <MessageContent content={msg.content} />
                      </div>
                    </NewMessageGlow>
                    {/* Timestamp + Copy + Share + Reactions */}
                    <div className={`flex items-center gap-1.5 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px]" style={{ color: '#484f58' }}>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                      <CopyButton text={msg.content} />
                      <ShareButton text={msg.content} />
                      {msg.role === 'assistant' && (
                        <>
                          <MessageReactions messageId={msg.id} />
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#30363d]"
                            style={{ color: '#8b949e' }}
                            title="Regenerate response"
                            onClick={() => sendMessage('Regenerate the last response')}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator (before streaming starts) */}
            {isLoading && !isStreaming && (
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

            {/* Streaming message with typewriter cursor */}
            {isStreaming && streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #58a6ff30, #3fb95020)' }}>
                    <Bot className="w-4 h-4" style={{ color: '#58a6ff' }} />
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-3 max-w-[85%]" style={{
                  background: 'linear-gradient(135deg, #161b22 0%, #0d1117 50%, #161b22 100%)',
                  border: '1px solid #21262d',
                  borderLeft: '2px solid #58a6ff',
                }}>
                  <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed" style={{ color: '#c9d1d9' }}>
                    {streamingContent}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                      className="inline-block w-2 h-4 ml-0.5 align-middle"
                      style={{ backgroundColor: '#58a6ff', borderRadius: '1px' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stop generating button */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={stopStreaming}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: '#f8514915',
                    color: '#f85149',
                    border: '1px solid #f8514930',
                  }}
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  Stop generating
                </button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* ─── Enhanced Input Area ─── */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#30363d' }}>
          <div className="max-w-3xl mx-auto">
            {/* AI Mode Selector */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative" ref={aiModeRef}>
                <button
                  className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border transition-all duration-200"
                  style={{
                    backgroundColor: `${currentMode.color}10`,
                    color: currentMode.color,
                    borderColor: `${currentMode.color}30`,
                  }}
                  onClick={() => setShowAIModeMenu(!showAIModeMenu)}
                >
                  <currentMode.icon className="w-2.5 h-2.5" />
                  {currentMode.label}
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showAIModeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute bottom-full mb-1 left-0 w-48 rounded-lg border shadow-xl z-50 overflow-hidden"
                    style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
                  >
                    {AI_MODES.map((mode) => {
                      const MIcon = mode.icon;
                      return (
                        <button
                          key={mode.value}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[#21262d]"
                          onClick={() => {
                            setAIMode(mode.value);
                            setShowAIModeMenu(false);
                          }}
                        >
                          <MIcon className="w-3.5 h-3.5" style={{ color: mode.color }} />
                          <div>
                            <p className="text-[11px] font-medium" style={{ color: aiMode === mode.value ? mode.color : '#c9d1d9' }}>{mode.label}</p>
                            <p className="text-[9px]" style={{ color: '#484f58' }}>{mode.desc}</p>
                          </div>
                          {aiMode === mode.value && <Check className="w-3 h-3 ml-auto" style={{ color: mode.color }} />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                {/* Paste code button */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="p-1 rounded-md transition-colors hover:bg-[#30363d]"
                        style={{ color: '#484f58' }}
                        aria-label="Insert code block"
                        onClick={() => {
                          const codeWrap = '\n```\n\n```\n';
                          const newInput = input + (input ? '\n' : '') + codeWrap;
                          setInput(newInput);
                          setCharCount(newInput.length);
                        }}
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px] bg-[#1c2128] text-[#c9d1d9] border-[#30363d] px-2 py-1">
                      Insert code block
                    </TooltipContent>
                  </Tooltip>
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

              {/* Export chat button */}
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl shrink-0 h-[44px] w-[44px] transition-all duration-300"
                style={{ borderColor: '#30363d', color: '#484f58' }}
                title="Export chat as markdown"
                onClick={() => {
                  const md = chatMessages.map(m => `**${m.role === 'user' ? 'You' : 'AI'}:** ${m.content}`).join('\n\n---\n\n');
                  const blob = new Blob([md], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'chat-export.md';
                  a.click();
                  URL.revokeObjectURL(url);
                  toast({ title: 'Chat exported', description: 'Downloaded as chat-export.md' });
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>

              {/* Send button */}
              <Button
                size="icon"
                disabled={!input.trim() || isLoading || isStreaming}
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

            {/* ─── Quick Action Suggestion Chips with Tooltips ─── */}
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
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full shrink-0 transition-all duration-200 hover:scale-105 relative group/chip"
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
                    title={chip.tooltip}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    {chip.label}
                    {/* Tooltip on hover */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded text-[9px] whitespace-nowrap opacity-0 group-hover/chip:opacity-100 transition-opacity pointer-events-none z-10"
                      style={{ backgroundColor: '#21262d', color: '#c9d1d9', border: '1px solid #30363d' }}
                    >
                      {chip.tooltip}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Enhanced Right Sidebar Panel ─── */}
      <div className="w-72 border-l hidden lg:block overflow-y-auto custom-scroll" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
        <div className="p-4 space-y-5">
          {/* AI Model Info Card */}
          <div>
            <h3 className="text-xs font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
              <Monitor className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} /> AI Model Info
            </h3>
            <div
              className="p-3 rounded-xl space-y-2.5"
              style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: '#8b949e' }}>Model</span>
                <span className="text-[10px] font-mono font-medium" style={{ color: '#58a6ff' }}>GPT-4o</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: '#8b949e' }}>Context Window</span>
                <span className="text-[10px] font-mono font-medium" style={{ color: '#3fb950' }}>128K tokens</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: '#8b949e' }}>Avg Response</span>
                <span className="text-[10px] font-mono font-medium" style={{ color: '#e3b341' }}>1.2s</span>
              </div>
              {/* Token Usage mini progress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px]" style={{ color: '#8b949e' }}>Token Usage</span>
                  <span className="text-[9px] font-mono" style={{ color: '#58a6ff' }}>2,847 / 128K</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#21262d' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: '#58a6ff', width: '2.2%' }}
                  />
                </div>
              </div>
            </div>
          </div>

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

          {/* Quick References */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#484f58' }}>
              <Hash className="w-3 h-3" /> Quick References
            </h3>
            <div className="space-y-1.5">
              {QUICK_REFERENCES.map((ref, i) => (
                <QuickReferenceItem key={i} item={ref} />
              ))}
            </div>
          </div>

          {/* Session Stats */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#484f58' }}>
              <Activity className="w-3 h-3" /> Session Stats
            </h3>
            <div
              className="p-3 rounded-xl space-y-2"
              style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: '#8b949e' }}>Messages</span>
                <span className="text-[10px] font-mono font-medium" style={{ color: '#58a6ff' }}>{sessionStats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: '#8b949e' }}>Your messages</span>
                <span className="text-[10px] font-mono font-medium" style={{ color: '#3fb950' }}>{sessionStats.userMsgs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: '#8b949e' }}>AI responses</span>
                <span className="text-[10px] font-mono font-medium" style={{ color: '#a371f7' }}>{sessionStats.assistantMsgs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: '#8b949e' }}>Topics discussed</span>
                <span className="text-[10px] font-mono font-medium" style={{ color: '#e3b341' }}>{Math.min(sessionStats.total, 10)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: '#8b949e' }}>Avg response time</span>
                <span className="text-[10px] font-mono font-medium" style={{ color: '#79c0ff' }}>1.2s</span>
              </div>
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
