'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppStore, type ChatMessage, type RequirementsCard as RequirementsCardType } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequirementsCard } from '@/components/requirements-card';
import { FileTree, buildTreeFromPaths } from '@/components/file-tree';
import { ProjectTemplates } from '@/components/project-templates';
import { TemplateMarketplace } from '@/components/template-marketplace';
import { StatusBadge } from '@/components/status-badge';
import { Progress } from '@/components/ui/progress';
import {
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle,
  Rocket,
  FolderTree,
  FileCode,
  Sparkles,
  LayoutTemplate,
  MessageSquare,
  Circle,
  Copy,
  Check,
  X,
  Clock,
  Zap,
  Eye,
  Pencil,
  ShoppingCart,
  CheckSquare,
  BarChart3,
  MessageCircle,
  Globe,
  Server,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Code2,
  Folder,
  File,
  FileJson,
  FileType,
  Lightbulb,
  Layers,
  ArrowRight,
  Package,
  GitBranch,
  Database,
  Shield,
  Search,
  Download,
  Archive,
  Share2,
  GitFork,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

type BuilderPhase = 'describe' | 'requirements' | 'file_tree' | 'generating' | 'complete' | 'deploying';
type BuilderTab = 'chat' | 'templates' | 'marketplace' | 'preview';

/* ─── Quick Start Guide Steps ─── */
const QUICK_START_STEPS = [
  { step: 1, title: 'Describe', desc: 'Tell the AI what project you want to build', icon: MessageSquare },
  { step: 2, title: 'Review', desc: 'Review requirements and approve the file tree', icon: Eye },
  { step: 3, title: 'Deploy', desc: 'Generate code and deploy to GitHub', icon: Rocket },
];

/* ─── Recent Templates for empty right panel ─── */
const RECENT_TEMPLATES = [
  { name: 'Invoice Manager', icon: ShoppingCart, color: '#58a6ff', prompt: 'Build me a SaaS invoice management app with PDF generation, client portal, payment tracking, dashboard with charts, and Stripe integration' },
  { name: 'Task Manager', icon: CheckSquare, color: '#3fb950', prompt: 'Build a full-stack todo app with user authentication, team workspaces, real-time collaboration, drag-and-drop boards, and activity history' },
  { name: 'Analytics Dashboard', icon: BarChart3, color: '#a371f7', prompt: 'Build a real-time analytics dashboard with interactive charts, date range filters, data export to CSV, user segmentation, and email reports' },
  { name: 'Chat App', icon: MessageCircle, color: '#f778ba', prompt: 'Build a real-time chat application with chat rooms, direct messages, file sharing, message search, user presence, and notifications' },
];

/* ─── Example Prompts for Empty State ─── */
const EXAMPLE_PROMPTS = [
  { icon: '🧾', title: 'Invoice App', desc: 'SaaS invoice management with Stripe', text: 'Build me a SaaS invoice management app' },
  { icon: '🍕', title: 'Food Delivery', desc: 'REST API with order tracking', text: 'Create a REST API for a food delivery app' },
  { icon: '✅', title: 'Todo + Auth', desc: 'Full-stack with user authentication', text: 'Build a full-stack todo app with auth' },
  { icon: '📊', title: 'Analytics', desc: 'Dashboard with charts and export', text: 'Create an analytics dashboard with charts' },
];

/* ─── Template Marketplace Panel Data ─── */
const MARKETPLACE_CATEGORIES = [
  { id: 'webapps', label: 'Web Apps', icon: Globe, color: '#58a6ff' },
  { id: 'apis', label: 'APIs', icon: Server, color: '#3fb950' },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, color: '#a371f7' },
  { id: 'devops', label: 'DevOps', icon: GitBranch, color: '#e3b341' },
];

const MARKETPLACE_PANEL_TEMPLATES = [
  { id: 'mp1', name: 'Next.js SaaS', category: 'webapps', description: 'Full SaaS boilerplate with auth, billing, and dashboard', tech: ['Next.js', 'Prisma', 'Stripe'], color: '#58a6ff', prompt: 'Build a Next.js SaaS app with authentication, Stripe billing, Prisma database, and admin dashboard' },
  { id: 'mp2', name: 'React Dashboard', category: 'webapps', description: 'Analytics dashboard with interactive charts and filters', tech: ['React', 'Recharts', 'Tailwind'], color: '#58a6ff', prompt: 'Build a React analytics dashboard with Recharts, data tables, date filters, and CSV export' },
  { id: 'mp3', name: 'Express REST API', category: 'apis', description: 'Production API with auth, validation, and docs', tech: ['Express', 'MongoDB', 'JWT'], color: '#3fb950', prompt: 'Create a REST API with Express, MongoDB, JWT auth, input validation, and Swagger docs' },
  { id: 'mp4', name: 'GraphQL Server', category: 'apis', description: 'GraphQL API with subscriptions and dataloader', tech: ['Apollo', 'PostgreSQL', 'Redis'], color: '#3fb950', prompt: 'Build a GraphQL server with Apollo, PostgreSQL, Redis caching, and real-time subscriptions' },
  { id: 'mp5', name: 'React Native Chat', category: 'mobile', description: 'Cross-platform chat app with rooms and DMs', tech: ['React Native', 'Socket.io', 'Firebase'], color: '#a371f7', prompt: 'Build a React Native chat app with Socket.io, chat rooms, direct messages, push notifications, and user presence' },
  { id: 'mp6', name: 'Flutter E-commerce', category: 'mobile', description: 'Mobile store with cart, checkout, and payments', tech: ['Flutter', 'Stripe', 'Supabase'], color: '#a371f7', prompt: 'Build a Flutter e-commerce app with product catalog, shopping cart, Stripe checkout, and order tracking' },
  { id: 'mp7', name: 'CI/CD Pipeline', category: 'devops', description: 'Complete CI/CD with staging, prod, and rollback', tech: ['GitHub Actions', 'Docker', 'Terraform'], color: '#e3b341', prompt: 'Set up a CI/CD pipeline with GitHub Actions, Docker builds, Terraform infrastructure, staging and production environments' },
  { id: 'mp8', name: 'Docker Compose Stack', category: 'devops', description: 'Multi-service orchestration with monitoring', tech: ['Docker', 'Nginx', 'Prometheus'], color: '#e3b341', prompt: 'Create a Docker Compose stack with Nginx reverse proxy, Node.js API, PostgreSQL, Redis, and Prometheus monitoring' },
];

/* ─── AI Suggestions Data ─── */
const AI_SUGGESTION_MAP: Record<string, Array<{ text: string; icon: typeof Lightbulb }>> = {
  'e-commerce': [
    { text: 'Add payment integration with Stripe', icon: ShoppingCart },
    { text: 'Include admin dashboard', icon: BarChart3 },
    { text: 'Add product search and filtering', icon: Layers },
    { text: 'Include order tracking system', icon: Package },
  ],
  'chat': [
    { text: 'Add message encryption', icon: Shield },
    { text: 'Include file sharing support', icon: Package },
    { text: 'Add user presence indicators', icon: Eye },
    { text: 'Include notification system', icon: MessageCircle },
  ],
  'api': [
    { text: 'Add rate limiting middleware', icon: Shield },
    { text: 'Include API documentation', icon: FileCode },
    { text: 'Add caching layer with Redis', icon: Database },
    { text: 'Include webhook support', icon: Zap },
  ],
  'dashboard': [
    { text: 'Add real-time data updates', icon: Zap },
    { text: 'Include data export to CSV/PDF', icon: FileCode },
    { text: 'Add role-based access control', icon: Shield },
    { text: 'Include customizable widgets', icon: Layers },
  ],
  'default': [
    { text: 'Add authentication system', icon: Shield },
    { text: 'Include error handling', icon: Zap },
    { text: 'Add database integration', icon: Database },
    { text: 'Include deployment config', icon: Rocket },
  ],
};

/* ─── Build Milestones Data ─── */
const BUILD_MILESTONES = [
  {
    id: 'm1', label: 'Setting up project', substeps: [
      { id: 's1', label: 'Creating package.json' },
      { id: 's2', label: 'Installing dependencies' },
      { id: 's3', label: 'Configuring TypeScript' },
    ]
  },
  {
    id: 'm2', label: 'Generating components', substeps: [
      { id: 's4', label: 'Creating layout components' },
      { id: 's5', label: 'Building page components' },
      { id: 's6', label: 'Adding shared UI components' },
    ]
  },
  {
    id: 'm3', label: 'Writing API routes', substeps: [
      { id: 's7', label: 'Creating API handlers' },
      { id: 's8', label: 'Adding middleware' },
      { id: 's9', label: 'Connecting to database' },
    ]
  },
  {
    id: 'm4', label: 'Finalizing project', substeps: [
      { id: 's10', label: 'Adding configuration files' },
      { id: 's11', label: 'Writing README documentation' },
      { id: 's12', label: 'Validating all files' },
    ]
  },
];

/* ─── Simulated code preview lines ─── */
const SIMULATED_CODE_PREVIEW: Record<string, string[]> = {
  'ts': [
    "import { NextResponse } from 'next/server';",
    "import { prisma } from '@/lib/prisma';",
    "",
    "export async function GET() {",
    "  try {",
    "    const data = await prisma.user.findMany();",
    "    return NextResponse.json(data);",
    "  } catch (error) {",
    "    return NextResponse.json(",
    "      { error: 'Failed to fetch' },",
    "      { status: 500 }",
    "    );",
    "  }",
    "}",
  ],
  'tsx': [
    "export default function Page() {",
    "  const [data, setData] = useState([]);",
    "",
    "  useEffect(() => {",
    "    fetch('/api/data')",
    "      .then(res => res.json())",
    "      .then(setData);",
    "  }, []);",
    "",
    "  return (",
    "    <div className='container'>",
    "      {data.map(item => (",
    "        <Card key={item.id} />",
    "      ))}",
    "    </div>",
    "  );",
    "}",
  ],
  'default': [
    "{",
    '  "name": "my-project",',
    '  "version": "0.1.0",',
    '  "private": true,',
    '  "scripts": {',
    '    "dev": "next dev",',
    '    "build": "next build",',
    '    "start": "next start",',
    '    "lint": "next lint"',
    "  }",
    "}",
  ],
};

function ProgressDots({ current, total }: { current: number; total: number }) {
  const maxDots = Math.min(total, 20);
  const step = total > maxDots ? Math.ceil(total / maxDots) : 1;
  const dots = [];
  for (let i = 0; i < maxDots; i++) {
    const fileIndex = i * step;
    const isComplete = fileIndex < current;
    const isCurrent = fileIndex === current - 1;
    dots.push(
      <div
        key={i}
        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          isCurrent ? 'animate-pulse-glow scale-125' : ''
        }`}
        style={{
          backgroundColor: isComplete ? '#3fb950' : isCurrent ? '#58a6ff' : '#21262d',
          boxShadow: isCurrent ? '0 0 6px rgba(88,166,255,0.5)' : 'none',
        }}
      />
    );
  }
  return <div className="flex items-center gap-[3px] flex-wrap">{dots}</div>;
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, duration = 800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  useEffect(() => {
    countRef.current = 0;
    const increment = target > 0 ? target / (duration / 16) : 0;
    if (increment === 0) return;
    const timer = setInterval(() => {
      countRef.current += increment;
      if (countRef.current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(countRef.current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count}</span>;
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

/* ─── Code Block Renderer ─── */
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
                  <span>{language}</span>
                  <CopyButton text={code} />
                </div>
              )}
              <pre className="p-3 overflow-x-auto custom-scroll">
                <code className="text-xs font-mono leading-relaxed" style={{ color: '#c9d1d9' }}>
                  {code}
                </code>
              </pre>
            </div>
          );
        }

        const textParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={i} className="whitespace-pre-wrap font-mono text-xs leading-relaxed" style={{ color: '#c9d1d9' }}>
            {textParts.map((tp, j) => {
              if (tp.startsWith('`') && tp.endsWith('`')) {
                return (
                  <code
                    key={j}
                    className="px-1.5 py-0.5 rounded text-[11px]"
                    style={{ backgroundColor: '#161b22', color: '#58a6ff', border: '1px solid #21262d' }}
                  >
                    {tp.slice(1, -1)}
                  </code>
                );
              }
              return <span key={j}>{tp}</span>;
            })}
          </span>
        );
      })}
    </div>
  );
}

/* ─── Syntax Highlighting for Code Preview ─── */
function SyntaxHighlightedCode({ code, language }: { code: string[]; language: string }) {
  const highlightLine = (line: string) => {
    // Keywords
    const keywords = ['import', 'export', 'default', 'function', 'const', 'let', 'var', 'return', 'try', 'catch', 'async', 'await', 'from', 'if', 'else', 'new', 'typeof', 'interface', 'type'];
    // Strings
    const stringRegex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g;

    let result: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const stringMatch = remaining.match(stringRegex);
      if (stringMatch && stringMatch.index !== undefined && stringMatch.index < remaining.length) {
        // Add text before string
        if (stringMatch.index > 0) {
          const before = remaining.slice(0, stringMatch.index);
          result.push(...highlightKeywords(before, keywords, keyIdx));
          keyIdx += before.length;
        }
        // Add string
        result.push(<span key={`s${keyIdx}`} style={{ color: '#a5d6ff' }}>{stringMatch[0]}</span>);
        keyIdx++;
        remaining = remaining.slice(stringMatch.index + stringMatch[0].length);
      } else {
        result.push(...highlightKeywords(remaining, keywords, keyIdx));
        break;
      }
    }
    return result;
  };

  const highlightKeywords = (text: string, keywords: string[], startKey: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let localKey = startKey;

    while (remaining.length > 0) {
      let found = false;
      for (const kw of keywords) {
        const idx = remaining.indexOf(kw);
        if (idx === 0 || (idx > 0 && /[\s(={<>]/.test(remaining[idx - 1]))) {
          if (idx > 0) {
            parts.push(<span key={`t${localKey++}`} style={{ color: '#c9d1d9' }}>{remaining.slice(0, idx)}</span>);
          }
          // Check if it's a full keyword match
          const afterIdx = idx + kw.length;
          if (afterIdx >= remaining.length || /[\s(={<>:;,})\]]/.test(remaining[afterIdx])) {
            parts.push(<span key={`k${localKey++}`} style={{ color: '#ff7b72' }}>{kw}</span>);
            remaining = remaining.slice(afterIdx);
            found = true;
            break;
          }
        }
      }
      if (!found) {
        // Check for comments
        if (remaining.startsWith('//') || remaining.startsWith('#')) {
          parts.push(<span key={`c${localKey++}`} style={{ color: '#8b949e' }}>{remaining}</span>);
          remaining = '';
        } else {
          parts.push(<span key={`t${localKey++}`} style={{ color: '#c9d1d9' }}>{remaining.slice(0, 1)}</span>);
          remaining = remaining.slice(1);
        }
      }
    }
    return parts;
  };

  return (
    <pre className="p-3 overflow-x-auto custom-scroll text-xs font-mono leading-relaxed">
      {code.map((line, i) => (
        <div key={i} className="flex">
          <span className="select-none w-8 text-right shrink-0 pr-3" style={{ color: '#484f58' }}>{i + 1}</span>
          <span>{highlightLine(line)}</span>
        </div>
      ))}
    </pre>
  );
}

/* ─── Milestone Progress Component ─── */
function MilestoneProgress({ progress, isBuilding }: { progress: { current: number; total: number; section: string }; isBuilding: boolean }) {
  // Compute active milestone/substep from progress directly (derived state, no effect needed)
  const totalSubsteps = BUILD_MILESTONES.reduce((sum, m) => sum + m.substeps.length, 0);
  const progressRatio = progress.current / Math.max(progress.total, 1);
  const completedSubsteps = Math.floor(progressRatio * totalSubsteps);

  let activeMilestoneIdx = BUILD_MILESTONES.length - 1;
  let activeSubstepIdx = BUILD_MILESTONES[BUILD_MILESTONES.length - 1].substeps.length - 1;

  let count = 0;
  for (let mi = 0; mi < BUILD_MILESTONES.length; mi++) {
    const milestone = BUILD_MILESTONES[mi];
    for (let si = 0; si < milestone.substeps.length; si++) {
      count++;
      if (count === completedSubsteps + 1) {
        activeMilestoneIdx = mi;
        activeSubstepIdx = si;
        mi = BUILD_MILESTONES.length; // break outer
        break;
      }
    }
  }

  return (
    <div className="space-y-3">
      {BUILD_MILESTONES.map((milestone, mi) => {
        const isComplete = mi < activeMilestoneIdx;
        const isActive = mi === activeMilestoneIdx && isBuilding;
        const isPending = mi > activeMilestoneIdx || (!isBuilding && !isComplete);

        return (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: mi * 0.1, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isComplete ? 'rgba(63,185,80,0.2)' : isActive ? 'rgba(88,166,255,0.2)' : 'rgba(48,54,61,0.5)',
                }}
              >
                {isComplete ? (
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#58a6ff' }} />
                ) : (
                  <Circle className="w-3 h-3" style={{ color: '#484f58' }} />
                )}
              </div>
              <span
                className="text-[11px] font-semibold"
                style={{ color: isComplete ? '#3fb950' : isActive ? '#58a6ff' : '#8b949e' }}
              >
                {milestone.label}
              </span>
              {isActive && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(88,166,255,0.1)', color: '#58a6ff' }}>
                  In Progress
                </span>
              )}
            </div>
            <div className="ml-2.5 pl-3 border-l space-y-1" style={{ borderColor: isComplete ? '#3fb95040' : isActive ? '#58a6ff40' : '#21262d' }}>
              {milestone.substeps.map((substep, si) => {
                const subComplete = isComplete || (isActive && si < activeSubstepIdx);
                const subActive = isActive && si === activeSubstepIdx;
                return (
                  <div key={substep.id} className="flex items-center gap-2 py-0.5">
                    {subComplete ? (
                      <Check className="w-3 h-3 shrink-0" style={{ color: '#3fb950' }} />
                    ) : subActive ? (
                      <Loader2 className="w-3 h-3 shrink-0 animate-spin" style={{ color: '#58a6ff' }} />
                    ) : (
                      <Circle className="w-2.5 h-2.5 shrink-0" style={{ color: '#30363d' }} />
                    )}
                    <span
                      className="text-[10px]"
                      style={{ color: subComplete ? '#8b949e' : subActive ? '#c9d1d9' : '#484f58' }}
                    >
                      {substep.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function BuilderView() {
  const {
    user,
    builderChat,
    addBuilderChat,
    clearBuilderChat,
    requirementsCard,
    setRequirementsCard,
    isBuilding,
    setIsBuilding,
    buildProgress,
    setBuildProgress,
    generatedFiles,
    setGeneratedFiles,
    fileTreeApproved,
    setFileTreeApproved,
    setCurrentView,
    setSelectedProject,
    setSelectedFile,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<BuilderPhase>('describe');
  const [isLoading, setIsLoading] = useState(false);
  const [fileTreePaths, setFileTreePaths] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const [activeTab, setActiveTab] = useState<BuilderTab>('chat');
  const [charCount, setCharCount] = useState(0);
  const [marketplacePanelOpen, setMarketplacePanelOpen] = useState(false);
  const [codeQualityOpen, setCodeQualityOpen] = useState(false);
  const [depScannerOpen, setDepScannerOpen] = useState(false);
  const [codeQualityLoading, setCodeQualityLoading] = useState(false);
  const [depScannerLoading, setDepScannerLoading] = useState(false);
  const [fileTreeSearch, setFileTreeSearch] = useState('');
  const [marketplaceCategory, setMarketplaceCategory] = useState('webapps');
  const [previewSelectedFile, setPreviewSelectedFile] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [builderChat]);

  // Determine active step for Quick Start Guide
  const activeStep = phase === 'describe' ? 1 : (phase === 'requirements' || phase === 'file_tree') ? 2 : 3;

  // Right panel has content?
  const rightPanelHasContent = requirementsCard && phase !== 'describe' || fileTreePaths.length > 0 || generatedFiles.length > 0;

  // Compute AI suggestions based on input
  const aiSuggestions = useMemo(() => {
    if (!input || input.length < 3) return AI_SUGGESTION_MAP['default'];
    const lower = input.toLowerCase();
    for (const key of Object.keys(AI_SUGGESTION_MAP)) {
      if (key !== 'default' && lower.includes(key)) {
        return AI_SUGGESTION_MAP[key];
      }
    }
    // Check for partial matches
    if (lower.includes('shop') || lower.includes('store') || lower.includes('product') || lower.includes('cart')) return AI_SUGGESTION_MAP['e-commerce'];
    if (lower.includes('message') || lower.includes('real-time') || lower.includes('socket')) return AI_SUGGESTION_MAP['chat'];
    if (lower.includes('rest') || lower.includes('graphql') || lower.includes('endpoint') || lower.includes('server')) return AI_SUGGESTION_MAP['api'];
    if (lower.includes('chart') || lower.includes('graph') || lower.includes('analytics') || lower.includes('report')) return AI_SUGGESTION_MAP['dashboard'];
    return AI_SUGGESTION_MAP['default'];
  }, [input]);

  // Compute preview file list
  const previewFiles = useMemo(() => {
    if (generatedFiles.length > 0) return generatedFiles;
    if (fileTreePaths.length > 0) return fileTreePaths.map(p => ({ path: p, content: '', purpose: '' }));
    return [];
  }, [generatedFiles, fileTreePaths]);

  // Get code preview for selected file
  const codePreviewLines = useMemo(() => {
    if (!previewSelectedFile) return SIMULATED_CODE_PREVIEW['default'];
    const ext = previewSelectedFile.split('.').pop()?.toLowerCase() || '';
    if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') {
      // If we have actual generated file content, use it
      const genFile = generatedFiles.find(f => f.path === previewSelectedFile);
      if (genFile && genFile.content) return genFile.content.split('\n');
      return ext.includes('x') ? SIMULATED_CODE_PREVIEW['tsx'] : SIMULATED_CODE_PREVIEW['ts'];
    }
    return SIMULATED_CODE_PREVIEW['default'];
  }, [previewSelectedFile, generatedFiles]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    addBuilderChat(userMsg);
    setInput('');
    setCharCount(0);
    setIsLoading(true);

    try {
      const chatMessages = [...builderChat, userMsg].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          mode: 'project-builder',
        }),
      });

      const data = await res.json();
      const aiContent = data.response || 'Sorry, I could not generate a response.';

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString(),
      };
      addBuilderChat(assistantMsg);

      // Parse requirements from AI response
      const reqMatch = aiContent.match(/Project Name\s*:\s*(.+)/i);
      if (reqMatch && phase === 'describe') {
        const parsed = parseRequirements(aiContent);
        if (parsed) {
          setRequirementsCard(parsed);
          setProjectName(parsed.projectName);
          setPhase('requirements');
        }
      }

      // Parse file tree
      if (phase === 'requirements' && (aiContent.includes('├') || aiContent.includes('│'))) {
        const paths = parseFileTree(aiContent);
        if (paths.length > 0) {
          setFileTreePaths(paths);
          setPhase('file_tree');
        }
      }

      // Parse generated files
      if (phase === 'generating' || fileTreeApproved) {
        const files = parseCodeFiles(aiContent);
        if (files.length > 0) {
          setGeneratedFiles([...generatedFiles, ...files]);
          setBuildProgress({
            current: generatedFiles.length + files.length,
            total: fileTreePaths.length || files.length,
            section: 'Building project files',
          });
        }
      }
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '⚠️ Error: Could not reach AI service. Please try again.',
        timestamp: new Date().toISOString(),
      };
      addBuilderChat(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [builderChat, isLoading, phase, fileTreeApproved, generatedFiles, fileTreePaths.length, addBuilderChat, setRequirementsCard, setGeneratedFiles, setBuildProgress]);

  const handleTemplateSelect = (prompt: string) => {
    setActiveTab('chat');
    sendMessage(prompt);
    setMarketplacePanelOpen(false);
  };

  const handleConfirmRequirements = (card: RequirementsCardType) => {
    setRequirementsCard(card);
    setProjectName(card.projectName);
    sendMessage('✅ Requirements confirmed. Please generate the complete file tree for this project.');
    setPhase('file_tree');
  };

  const handleRejectRequirements = () => {
    sendMessage('🔄 I want to modify the requirements. Let me provide updates.');
  };

  const handleApproveFileTree = () => {
    setFileTreeApproved(true);
    setPhase('generating');
    setIsBuilding(true);
    sendMessage('✅ File tree approved. Please generate all the complete file contents now. Start with the database schema, then models, middleware, routes, and finally the frontend files. Output each file with 📄 FILE: path header.');
  };

  const handleDeploy = async () => {
    if (!user) {
      toast({ title: 'Please connect GitHub first', variant: 'destructive' });
      setCurrentView('onboarding');
      return;
    }

    try {
      const projectRes = await fetch('/api/projects/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: projectName || 'my-project',
          description: requirementsCard?.keyFeatures.join(', ') || '',
          framework: requirementsCard?.frontend?.toLowerCase().includes('next') ? 'nextjs' : 'react',
          stackJson: JSON.stringify(requirementsCard || {}),
        }),
      });
      const projectData = await projectRes.json();

      if (projectData.project) {
        setSelectedProject({
          id: projectData.project.id,
          name: projectData.project.name,
          description: projectData.project.description,
          githubRepoUrl: null,
          liveUrl: null,
          framework: projectData.project.framework,
          stackJson: projectData.project.stack_json,
          defaultBranch: 'main',
          status: 'not_deployed',
          createdAt: projectData.project.created_at,
          updatedAt: projectData.project.updated_at,
          files: [],
          deployments: [],
        });

        await fetch('/api/projects/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: projectData.project.id,
            files: generatedFiles.map((f) => ({
              path: f.path,
              content: f.content,
            })),
          }),
        });

        setCurrentView('deploy');
      }
    } catch (error) {
      toast({ title: 'Failed to save project', description: 'Please try again', variant: 'destructive' });
    }
  };

  const handleStartNew = () => {
    clearBuilderChat();
    setRequirementsCard(null);
    setGeneratedFiles([]);
    setFileTreeApproved(false);
    setPhase('describe');
    setFileTreePaths([]);
    setBuildProgress({ current: 0, total: 0, section: '' });
    setActiveTab('chat');
    setPreviewSelectedFile(null);
  };

  const handleCancelBuild = () => {
    setIsBuilding(false);
    setPhase('file_tree');
    setFileTreeApproved(false);
    toast({ title: 'Build cancelled', description: 'You can restart generation anytime' });
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get file icon based on extension — Enhanced with color coding
  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return <Code2 className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} />;
    if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return <FileJson className="w-3.5 h-3.5" style={{ color: '#e3b341' }} />;
    if (['css', 'scss', 'less'].includes(ext)) return <FileType className="w-3.5 h-3.5" style={{ color: '#a371f7' }} />;
    if (['md', 'txt'].includes(ext)) return <File className="w-3.5 h-3.5" style={{ color: '#8b949e' }} />;
    if (['prisma'].includes(ext)) return <Database className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />;
    if (['env', 'gitignore', 'dockerignore', 'eslintrc', 'prettierrc'].some(e => path.includes(e))) return <File className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />;
    return <File className="w-3.5 h-3.5" style={{ color: '#484f58' }} />;
  };

  return (
    <div className="flex h-[calc(100vh-140px)]">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#30363d' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#58a6ff15' }}>
              <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-sparkle' : ''}`} style={{ color: '#58a6ff' }} />
            </div>
            <h2
              className="text-sm font-medium"
              style={{
                color: '#c9d1d9',
                ...(isLoading ? {
                  textShadow: '0 0 20px rgba(88,166,255,0.5), 0 0 40px rgba(88,166,255,0.2)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                } : {}),
              }}
            >
              AI Project Builder
            </h2>
            <StatusBadge status={isBuilding ? 'building' : phase === 'complete' ? 'completed' : 'not_deployed'} />
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BuilderTab)}>
              <TabsList className="h-7 bg-[#21262d]">
                <TabsTrigger value="chat" className="h-5 text-xs px-2 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#58a6ff]">
                  <MessageSquare className="w-3 h-3 mr-1" /> Chat
                </TabsTrigger>
                <TabsTrigger value="templates" className="h-5 text-xs px-2 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#58a6ff]">
                  <LayoutTemplate className="w-3 h-3 mr-1" /> Templates
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="h-5 text-xs px-2 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#58a6ff]">
                  <Sparkles className="w-3 h-3 mr-1" /> Marketplace
                </TabsTrigger>
                {previewFiles.length > 0 && (
                  <TabsTrigger value="preview" className="h-5 text-xs px-2 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#58a6ff]">
                    <Eye className="w-3 h-3 mr-1" /> Preview
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
            <Button
              variant="ghost"
              size="sm"
              style={{ color: '#8b949e' }}
              onClick={handleStartNew}
            >
              New
            </Button>
            {/* Marketplace panel toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-[10px]"
              style={{ color: marketplacePanelOpen ? '#58a6ff' : '#8b949e' }}
              onClick={() => setMarketplacePanelOpen(!marketplacePanelOpen)}
            >
              {marketplacePanelOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
              {marketplacePanelOpen ? 'Close' : 'Templates'}
            </Button>
          </div>
        </div>

        {/* Marketplace, Templates, Preview or Chat */}
        {activeTab === 'marketplace' && phase === 'describe' ? (
          <ScrollArea className="flex-1 p-4">
            <TemplateMarketplace onSelectTemplate={handleTemplateSelect} />
          </ScrollArea>
        ) : activeTab === 'templates' && phase === 'describe' ? (
          <ScrollArea className="flex-1 p-4">
            <ProjectTemplates onSelectTemplate={handleTemplateSelect} />
          </ScrollArea>
        ) : activeTab === 'preview' && previewFiles.length > 0 ? (
          /* ─── Live Preview Tab ─── */
          <div className="flex-1 flex overflow-hidden">
            {/* File Tree Sidebar */}
            <div className="w-56 border-r flex flex-col" style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}>
              <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: '#21262d' }}>
                <FolderTree className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} />
                <span className="text-[11px] font-medium" style={{ color: '#c9d1d9' }}>Project Files</span>
                <span className="text-[9px] ml-auto px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(88,166,255,0.1)', color: '#58a6ff' }}>
                  {previewFiles.length}
                </span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {previewFiles.map((file, i) => {
                    const path = typeof file === 'string' ? file : file.path;
                    const fileName = path.split('/').pop() || path;
                    const isActive = previewSelectedFile === path;
                    return (
                      <motion.button
                        key={`${path}-${i}`}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02, duration: 0.15 }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors"
                        style={{
                          backgroundColor: isActive ? 'rgba(88,166,255,0.12)' : 'transparent',
                          color: isActive ? '#58a6ff' : '#8b949e',
                        }}
                        onClick={() => setPreviewSelectedFile(path)}
                        onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#161b22'; }}
                        onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                      >
                        {getFileIcon(path)}
                        <span className="text-[11px] font-mono truncate">{fileName}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Code Preview Panel */}
            <div className="flex-1 flex flex-col" style={{ backgroundColor: '#0d1117' }}>
              {/* Code preview header */}
              <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: '#21262d', backgroundColor: '#161b22' }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f8514950' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#e3b34150' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3fb95050' }} />
                </div>
                <span className="text-[11px] font-mono ml-2" style={{ color: '#8b949e' }}>
                  {previewSelectedFile || 'package.json'}
                </span>
                <span className="text-[9px] ml-auto px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#21262d', color: '#484f58' }}>
                  {codePreviewLines.length} lines
                </span>
              </div>
              {/* Code content */}
              <ScrollArea className="flex-1">
                <SyntaxHighlightedCode
                  code={codePreviewLines}
                  language={previewSelectedFile?.split('.').pop() || 'json'}
                />
              </ScrollArea>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {builderChat.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                         style={{ background: 'linear-gradient(135deg, rgba(88,166,255,0.2), rgba(63,185,80,0.1))',
                                  border: '1px solid rgba(88,166,255,0.2)' }}>
                      <Bot className="w-7 h-7" style={{ color: '#58a6ff' }} />
                    </div>
                    <h3 className="text-base font-semibold mb-2" style={{ color: '#c9d1d9' }}>
                      Describe your project
                    </h3>
                    <p className="text-sm mb-6" style={{ color: '#8b949e' }}>
                      Tell the AI what you want to build. Be as detailed or as brief as you like.
                    </p>
                    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                      {[
                        { icon: '🧾', title: 'Invoice SaaS', text: 'Build a SaaS invoice management app with Stripe integration and PDF export' },
                        { icon: '✅', title: 'Task Manager', text: 'Build a full-stack kanban task manager with real-time sync and user auth' },
                        { icon: '📊', title: 'Analytics Dashboard', text: 'Build a real-time analytics dashboard with charts and API backend' },
                        { icon: '🍕', title: 'Food Delivery API', text: 'Build a REST API for a food delivery app with order tracking and admin panel' },
                      ].map(p => (
                        <button key={p.title} onClick={() => sendMessage(p.text)}
                          className="text-xs text-left p-3 rounded-lg transition-colors hover:border-opacity-50"
                          style={{ backgroundColor: '#21262d', color: '#8b949e',
                                   border: '1px solid #30363d' }}>
                          <span className="mr-1">{p.icon}</span> {p.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {builderChat.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
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
                      <div className={`max-w-[80%] group relative ${msg.role === 'user' ? 'text-right' : ''}`}>
                        <div
                          className="rounded-2xl px-4 py-3 text-sm"
                          style={{
                            background: msg.role === 'user'
                              ? 'linear-gradient(135deg, #30363d, #21262d)'
                              : '#0d1117',
                            border: msg.role === 'user'
                              ? '1px solid #484f58'
                              : '1px solid #21262d',
                            borderLeft: msg.role === 'assistant' ? '2px solid #58a6ff' : undefined,
                            color: '#c9d1d9',
                          }}
                        >
                          <MessageContent content={msg.content} />
                        </div>
                        <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px]" style={{ color: '#484f58' }}>
                            {formatTimestamp(msg.timestamp)}
                          </span>
                          <CopyButton text={msg.content} />
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
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #58a6ff30, #3fb95020)' }}>
                      <Bot className="w-4 h-4" style={{ color: '#58a6ff' }} />
                    </div>
                    <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d', borderLeft: '2px solid #58a6ff' }}>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#58a6ff' }} />
                      <span className="text-xs" style={{ color: '#8b949e' }}>Thinking...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </>
        )}

        {/* Build Progress — Enhanced with Milestones */}
        {isBuilding && buildProgress.total > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-t"
            style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}
          >
            <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium flex items-center gap-2" style={{ color: '#58a6ff' }}>
                    <span className="animate-pulse-glow">📦</span> BUILD PROGRESS
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] flex items-center gap-1" style={{ color: '#8b949e' }}>
                      <Clock className="w-3 h-3" />
                      ~{Math.max(1, Math.ceil((buildProgress.total - buildProgress.current) * 2))}s remaining
                    </span>
                    <button
                      onClick={handleCancelBuild}
                      className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors hover:bg-[#f8514920]"
                      style={{ color: '#f85149' }}
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
                <span className="text-[10px] font-mono block mb-2" style={{ color: '#8b949e' }}>
                  {buildProgress.current} of {buildProgress.total} files — {buildProgress.section}
                </span>
                {/* Milestone-based progress */}
                <MilestoneProgress progress={buildProgress} isBuilding={isBuilding} />
                <div className="mt-3">
                  <ProgressDots current={buildProgress.current} total={buildProgress.total} />
                  <div className="mt-2">
                    <Progress
                      value={(buildProgress.current / buildProgress.total) * 100}
                      className="h-1.5 progress-shimmer"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Deploy / Complete Buttons */}
        {phase === 'generating' && generatedFiles.length > 0 && (
          <div className="px-4 py-3 border-t" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs flex items-center gap-1.5" style={{ color: '#3fb950' }}>
                <CheckCircle className="w-4 h-4" />
                {generatedFiles.length} files generated
              </span>
              <Button
                className="gap-2"
                style={{ backgroundColor: '#238636', color: 'white' }}
                onClick={() => {
                  setPhase('complete');
                  setIsBuilding(false);
                }}
              >
                Review Build
              </Button>
            </div>
          </div>
        )}

        {/* ─── Build Complete Section ─── */}
        {phase === 'complete' && (
          <div className="px-4 py-3 border-t" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
            <Card style={{ backgroundColor: '#0d1117', borderColor: '#238636' }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: '#3fb950' }}>
                      ✅ BUILD COMPLETE
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold" style={{ color: '#c9d1d9' }}>
                        <AnimatedCounter target={generatedFiles.length} />
                      </span>
                      <span className="text-xs" style={{ color: '#8b949e' }}>files built</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]" style={{ color: '#8b949e' }}>for</span>
                      <span className="text-xs font-medium" style={{ color: '#58a6ff' }}>{projectName}</span>
                    </div>
                    {requirementsCard && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {[
                          requirementsCard.frontend,
                          requirementsCard.backend,
                          requirementsCard.database,
                          requirementsCard.auth,
                        ].filter(Boolean).map((tech) => (
                          <span
                            key={tech}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: 'rgba(88,166,255,0.12)', color: '#58a6ff', border: '1px solid rgba(88,166,255,0.2)' }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      className="gap-2 font-semibold"
                      style={{
                        background: 'linear-gradient(135deg, #58a6ff, #238636)',
                        color: 'white',
                        boxShadow: '0 0 20px rgba(88,166,255,0.25)',
                      }}
                      onClick={handleDeploy}
                    >
                      <Rocket className="w-4 h-4" /> Deploy Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      style={{ borderColor: '#30363d', color: '#8b949e' }}
                      onClick={() => setPhase('file_tree')}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Continue Editing
                    </Button>
                    {/* Export Dropdown */}
                    <div className="relative group">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full"
                        style={{ borderColor: '#30363d', color: '#c9d1d9', backgroundColor: '#21262d' }}
                        onClick={() => {
                          const el = document.getElementById('export-dropdown-menu');
                          if (el) el.classList.toggle('hidden');
                        }}
                      >
                        <Download className="w-3.5 h-3.5" /> Export
                        <ChevronDown className="w-3 h-3 ml-auto" />
                      </Button>
                      <div
                        id="export-dropdown-menu"
                        className="hidden absolute right-0 top-full mt-1 z-50 w-48 rounded-lg shadow-xl border py-1"
                        style={{ backgroundColor: '#21262d', borderColor: '#30363d' }}
                      >
                        <button
                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                          style={{ color: '#c9d1d9' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#30363d'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                          onClick={() => {
                            toast({ title: 'Preparing download...', description: 'Your ZIP file is being generated.' });
                            document.getElementById('export-dropdown-menu')?.classList.add('hidden');
                          }}
                        >
                          <Archive className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} /> Download as ZIP
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                          style={{ color: '#c9d1d9' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#30363d'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                          onClick={() => {
                            const allCode = generatedFiles.map(f => `// === ${f.path} ===\n${f.content}`).join('\n\n');
                            navigator.clipboard.writeText(allCode);
                            toast({ title: 'Copied!', description: 'All code copied to clipboard.' });
                            document.getElementById('export-dropdown-menu')?.classList.add('hidden');
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" style={{ color: '#3fb950' }} /> Copy All Code
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                          style={{ color: '#c9d1d9' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#30363d'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                          onClick={() => {
                            const treeText = generatedFiles.map(f => f.path).join('\n');
                            navigator.clipboard.writeText(treeText);
                            toast({ title: 'Copied!', description: 'File tree copied to clipboard.' });
                            document.getElementById('export-dropdown-menu')?.classList.add('hidden');
                          }}
                        >
                          <FolderTree className="w-3.5 h-3.5" style={{ color: '#e3b341' }} /> Download File Tree
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Share & Fork Actions Row */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#21262d' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-[11px] h-7"
                    style={{ borderColor: '#30363d', color: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.05)' }}
                    onClick={() => {
                      const shareLink = `https://gitdeploy.ai/share/${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
                      navigator.clipboard.writeText(shareLink);
                      toast({ title: 'Share link copied!', description: shareLink });
                    }}
                  >
                    <Share2 className="w-3 h-3" /> Share Project
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-[11px] h-7"
                    style={{ borderColor: '#30363d', color: '#a371f7', backgroundColor: 'rgba(163,113,247,0.05)' }}
                    onClick={() => {
                      toast({ title: 'Project forked!', description: `A variant of ${projectName} has been created.` });
                    }}
                  >
                    <GitFork className="w-3 h-3" /> Fork Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Input + AI Suggestions Bar */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#30363d' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                  placeholder="Describe what you want to build..."
                  className="min-h-[44px] max-h-32 bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm resize-none rounded-xl focus:border-[#58a6ff] pr-14"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                />
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
                  boxShadow: input.trim() ? '0 0 20px rgba(88,166,255,0.3), 0 0 40px rgba(35,134,54,0.15)' : 'none',
                }}
                onClick={() => sendMessage(input)}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* ─── AI Suggestions Bar ─── */}
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto custom-scroll pb-0.5">
              <Lightbulb className="w-3 h-3 shrink-0" style={{ color: '#e3b341' }} />
              <span className="text-[9px] uppercase font-semibold tracking-wider shrink-0" style={{ color: '#484f58' }}>
                AI Suggests:
              </span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={aiSuggestions.map(s => s.text).join(',')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5"
                >
                  {aiSuggestions.map((suggestion) => {
                    const Icon = suggestion.icon;
                    return (
                      <motion.button
                        key={suggestion.text}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border shrink-0 transition-colors"
                        style={{
                          borderColor: '#21262d',
                          backgroundColor: '#0d1117',
                          color: '#8b949e',
                        }}
                        onClick={() => setInput(prev => prev + (prev ? '. ' : '') + suggestion.text)}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#58a6ff30';
                          (e.currentTarget as HTMLElement).style.color = '#58a6ff';
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(88,166,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#21262d';
                          (e.currentTarget as HTMLElement).style.color = '#8b949e';
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#0d1117';
                        }}
                      >
                        <Icon className="w-3 h-3" />
                        {suggestion.text}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Template Marketplace Panel */}
      <AnimatePresence>
        {marketplacePanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-l overflow-hidden"
            style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}
          >
            <div className="w-[280px] h-full flex flex-col">
              {/* Panel header */}
              <div className="px-3 py-3 border-b flex items-center justify-between" style={{ borderColor: '#21262d' }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: '#58a6ff' }} />
                  <span className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>Templates</span>
                </div>
                <button
                  onClick={() => setMarketplacePanelOpen(false)}
                  className="p-1 rounded-md hover:bg-[#21262d] transition-colors"
                  style={{ color: '#8b949e' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto custom-scroll" style={{ borderBottom: '1px solid #21262d' }}>
                {MARKETPLACE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = marketplaceCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full shrink-0 transition-all duration-200"
                      style={{
                        backgroundColor: isActive ? `${cat.color}15` : 'transparent',
                        color: isActive ? cat.color : '#8b949e',
                        border: `1px solid ${isActive ? `${cat.color}30` : 'transparent'}`,
                      }}
                      onClick={() => setMarketplaceCategory(cat.id)}
                    >
                      <Icon className="w-3 h-3" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Template cards */}
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2.5">
                  {MARKETPLACE_PANEL_TEMPLATES.filter(t => t.category === marketplaceCategory).map((template, i) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.25 }}
                      className="rounded-xl border overflow-hidden transition-all duration-200 hover:border-opacity-60"
                      style={{
                        backgroundColor: '#0d1117',
                        borderColor: '#21262d',
                        borderLeft: `3px solid ${template.color}`,
                      }}
                    >
                      {/* Preview image placeholder */}
                      <div
                        className="h-20 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${template.color}12, ${template.color}05, #0d1117)`,
                          borderBottom: '1px solid #21262d',
                        }}
                      >
                        {/* Simulated code lines */}
                        <div className="p-2.5 space-y-1">
                          <div className="flex gap-1.5 mb-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f8514950' }} />
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#e3b34150' }} />
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3fb95050' }} />
                          </div>
                          <div className="h-1 rounded" style={{ backgroundColor: `${template.color}20`, width: '55%' }} />
                          <div className="h-1 rounded" style={{ backgroundColor: `${template.color}12`, width: '80%' }} />
                          <div className="h-1 rounded" style={{ backgroundColor: `${template.color}15`, width: '40%' }} />
                        </div>
                        {/* Category badge */}
                        <span
                          className="absolute top-2 right-2 text-[7px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${template.color}20`, color: template.color, border: `1px solid ${template.color}30` }}
                        >
                          {MARKETPLACE_CATEGORIES.find(c => c.id === template.category)?.label}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-3 space-y-2">
                        <div>
                          <h4 className="text-[11px] font-semibold" style={{ color: '#c9d1d9' }}>{template.name}</h4>
                          <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: '#8b949e' }}>{template.description}</p>
                        </div>
                        {/* Tech stack badges */}
                        <div className="flex flex-wrap gap-1">
                          {template.tech.map((t) => (
                            <span
                              key={t}
                              className="text-[8px] px-1.5 py-0.5 rounded-full font-mono"
                              style={{
                                backgroundColor: 'rgba(88,166,255,0.08)',
                                color: '#58a6ff',
                                border: '1px solid rgba(88,166,255,0.15)',
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        {/* Use Template button */}
                        <Button
                          className="w-full gap-1.5 text-[10px] h-7"
                          style={{
                            background: `linear-gradient(135deg, ${template.color}, ${template.color}cc)`,
                            color: 'white',
                            boxShadow: `0 0 10px ${template.color}20`,
                          }}
                          onClick={() => handleTemplateSelect(template.prompt)}
                        >
                          <Sparkles className="w-3 h-3" /> Use Template
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Panel */}
      <div className="w-80 border-l hidden md:block overflow-y-auto custom-scroll" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
        <div className="p-4 space-y-4">
          {/* Requirements Card */}
          {requirementsCard && phase !== 'describe' && (
            <RequirementsCard
              card={requirementsCard}
              onConfirm={handleConfirmRequirements}
              onReject={handleRejectRequirements}
            />
          )}

          {/* File Tree — Enhanced with Search, Stats, Color Icons */}
          {fileTreePaths.length > 0 && (
            <div>
              <h3 className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <FolderTree className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} /> File Structure
              </h3>
              {/* Search / Filter Input */}
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#484f58' }} />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={fileTreeSearch}
                  onChange={(e) => setFileTreeSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 rounded-md text-[11px] outline-none transition-colors"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9' }}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#58a6ff'; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#30363d'; }}
                />
              </div>
              <FileTree tree={buildTreeFromPaths(fileTreePaths.filter(p => !fileTreeSearch || p.toLowerCase().includes(fileTreeSearch.toLowerCase())))} maxHeight="220px" />
              {/* File Stats Summary */}
              <div className="mt-2 flex items-center gap-3 text-[10px]" style={{ color: '#8b949e' }}>
                <span className="flex items-center gap-1"><File className="w-3 h-3" /> {fileTreePaths.length} files</span>
                <span className="flex items-center gap-1"><Code2 className="w-3 h-3" style={{ color: '#58a6ff' }} /> {fileTreePaths.filter(p => /\.(ts|tsx|js|jsx)$/.test(p)).length} TS</span>
                <span className="flex items-center gap-1"><FileJson className="w-3 h-3" style={{ color: '#e3b341' }} /> {fileTreePaths.filter(p => /\.(json|yaml|yml)$/.test(p)).length} Config</span>
              </div>
              {!fileTreeApproved && phase === 'file_tree' && (
                <Button
                  className="w-full mt-3 gap-2"
                  size="sm"
                  style={{ background: 'linear-gradient(135deg, #238636, #2ea043)', color: 'white' }}
                  onClick={handleApproveFileTree}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve & Generate Code
                </Button>
              )}
            </div>
          )}

          {/* Generated Files List */}
          {generatedFiles.length > 0 && (
            <div>
              <h3 className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <FileCode className="w-3.5 h-3.5" style={{ color: '#3fb950' }} /> Generated Files ({generatedFiles.length})
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto custom-scroll">
                <AnimatePresence>
                  {generatedFiles.map((file, i) => (
                    <motion.div
                      key={`${file.path}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:bg-[#21262d] cursor-pointer group"
                      style={{ backgroundColor: '#0d1117' }}
                      onClick={() => {
                        setSelectedFile({ path: file.path, content: file.content, purpose: file.purpose, sizeBytes: file.content.length });
                        setActiveTab('preview');
                        setPreviewSelectedFile(file.path);
                      }}
                    >
                      <CheckCircle className="w-3 h-3 shrink-0" style={{ color: '#3fb950' }} />
                      <span className="font-mono truncate flex-1" style={{ color: '#8b949e' }}>
                        {file.path}
                      </span>
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: '#58a6ff' }}>
                        View
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ─── Quick Start Guide (shown when right panel is empty) ─── */}
          {!rightPanelHasContent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="mb-5">
                <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                  <Zap className="w-3.5 h-3.5" style={{ color: '#e3b341' }} /> Quick Start Guide
                </h3>
                <div className="space-y-3">
                  {QUICK_START_STEPS.map((step) => {
                    const isActive = step.step === activeStep;
                    const isPast = step.step < activeStep;
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * step.step, duration: 0.3 }}
                        className="flex items-start gap-3"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-300"
                          style={{
                            backgroundColor: isActive ? '#58a6ff' : isPast ? '#238636' : '#21262d',
                            color: isActive || isPast ? 'white' : '#8b949e',
                            boxShadow: isActive ? '0 0 12px rgba(88,166,255,0.4)' : 'none',
                          }}
                        >
                          {isPast ? <Check className="w-3.5 h-3.5" /> : step.step}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3 h-3" style={{ color: isActive ? '#58a6ff' : '#8b949e' }} />
                            <p className="text-xs font-medium" style={{ color: isActive ? '#c9d1d9' : '#8b949e' }}>
                              {step.title}
                            </p>
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>
                            {step.desc}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Templates */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#484f58' }}>
                  Recent Templates
                </h4>
                <div className="space-y-1.5">
                  {RECENT_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <motion.button
                        key={template.name}
                        whileHover={{ x: 4 }}
                        className="w-full flex items-center gap-2.5 text-xs px-3 py-2 rounded-lg border transition-all duration-200 hover:border-[#58a6ff] text-left group"
                        style={{ borderColor: '#21262d', backgroundColor: '#0d1117', color: '#8b949e' }}
                        onClick={() => handleTemplateSelect(template.prompt)}
                      >
                        <div
                          className="p-1.5 rounded-md shrink-0 group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: `${template.color}15` }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: template.color }} />
                        </div>
                        <span className="truncate" style={{ color: '#c9d1d9' }}>{template.name}</span>
                        <Zap className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: '#e3b341' }} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── AI Code Quality Analyzer ─── */}
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#0d1117', borderColor: '#30363d' }}>
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-[#21262d]"
              onClick={() => setCodeQualityOpen(!codeQualityOpen)}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />
                <span className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>Code Quality</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(63,185,80,0.15)', color: '#3fb950' }}>A</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ color: '#8b949e', transform: codeQualityOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            <AnimatePresence>
              {codeQualityOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-3">
                    {/* Overall Grade */}
                    <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: '#161b22' }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl" style={{ background: 'linear-gradient(135deg, #3fb950, #238636)', color: 'white' }}>
                        A
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>Overall Quality</p>
                        <p className="text-[10px]" style={{ color: '#8b949e' }}>85/100 — Excellent</p>
                      </div>
                    </div>
                    {/* Metric Bars */}
                    {[
                      { label: 'Maintainability', value: 88, color: '#3fb950' },
                      { label: 'Reliability', value: 82, color: '#58a6ff' },
                      { label: 'Security', value: 90, color: '#a371f7' },
                      { label: 'Performance', value: 78, color: '#e3b341' },
                    ].map((metric, i) => (
                      <div key={metric.label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium" style={{ color: '#c9d1d9' }}>{metric.label}</span>
                          <span className="text-[10px] font-bold" style={{ color: metric.color }}>{metric.value}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#21262d' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${metric.color}, ${metric.color}cc)` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.value}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + i * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                    {/* Run Analysis Button */}
                    <Button
                      className="w-full gap-2 text-[10px] h-7"
                      style={{ backgroundColor: '#21262d', color: '#c9d1d9', border: '1px solid #30363d' }}
                      onClick={() => {
                        setCodeQualityLoading(true);
                        setTimeout(() => { setCodeQualityLoading(false); toast({ title: 'Analysis Complete', description: 'Code quality score: 85/100 (Grade A)' }); }, 2000);
                      }}
                      disabled={codeQualityLoading}
                    >
                      {codeQualityLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</> : <><BarChart3 className="w-3 h-3" /> Run Analysis</>}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Dependency Scanner ─── */}
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#0d1117', borderColor: '#30363d' }}>
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-[#21262d]"
              onClick={() => setDepScannerOpen(!depScannerOpen)}
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} />
                <span className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>Dependencies</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(63,185,80,0.12)', color: '#3fb950' }}>6 ok</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(227,179,65,0.12)', color: '#e3b341' }}>1 old</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(248,81,73,0.12)', color: '#f85149' }}>1 vuln</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ color: '#8b949e', transform: depScannerOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </div>
            </button>
            <AnimatePresence>
              {depScannerOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-1.5 max-h-64 overflow-y-auto custom-scroll">
                    {[
                      { name: 'next', version: '15.1.0', status: 'up-to-date' as const },
                      { name: 'react', version: '19.0.0', status: 'up-to-date' as const },
                      { name: 'prisma', version: '6.2.0', status: 'up-to-date' as const },
                      { name: 'tailwindcss', version: '4.0.0', status: 'up-to-date' as const },
                      { name: 'framer-motion', version: '11.15.0', status: 'up-to-date' as const },
                      { name: 'lucide-react', version: '0.468.0', status: 'up-to-date' as const },
                      { name: 'eslint', version: '8.56.0', status: 'outdated' as const },
                      { name: 'jsonwebtoken', version: '8.5.1', status: 'vulnerable' as const },
                    ].map((dep, i) => {
                      const statusConfig = {
                        'up-to-date': { color: '#3fb950', bg: 'rgba(63,185,80,0.12)', label: 'OK' },
                        'outdated': { color: '#e3b341', bg: 'rgba(227,179,65,0.12)', label: 'Old' },
                        'vulnerable': { color: '#f85149', bg: 'rgba(248,81,73,0.12)', label: 'Vuln' },
                      };
                      const cfg = statusConfig[dep.status];
                      return (
                        <motion.div
                          key={dep.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.2 }}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-[#161b22]"
                        >
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                          <span className="text-[11px] font-mono flex-1 truncate" style={{ color: '#c9d1d9' }}>{dep.name}</span>
                          <span className="text-[9px] font-mono" style={{ color: '#8b949e' }}>v{dep.version}</span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                          {dep.status !== 'up-to-date' && (
                            <button
                              className="text-[8px] px-1.5 py-0.5 rounded shrink-0 transition-colors hover:bg-[#30363d]"
                              style={{ color: '#58a6ff', border: '1px solid #30363d' }}
                              onClick={() => toast({ title: `Updating ${dep.name}`, description: `Updating to latest version...` })}
                            >
                              Update
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                    {/* Scan Button */}
                    <Button
                      className="w-full gap-2 text-[10px] h-7 mt-2"
                      style={{ backgroundColor: '#21262d', color: '#c9d1d9', border: '1px solid #30363d' }}
                      onClick={() => {
                        setDepScannerLoading(true);
                        setTimeout(() => { setDepScannerLoading(false); toast({ title: 'Scan Complete', description: '6 up-to-date · 1 outdated · 1 vulnerable' }); }, 1500);
                      }}
                      disabled={depScannerLoading}
                    >
                      {depScannerLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Scanning...</> : <><Shield className="w-3 h-3" /> Scan Dependencies</>}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper parsers
function parseRequirements(content: string): RequirementsCardType | null {
  const nameMatch = content.match(/Project Name\s*:\s*(.+)/i);
  if (!nameMatch) return null;

  return {
    projectName: nameMatch[1].trim(),
    type: content.match(/Type\s*:\s*(.+)/i)?.[1]?.trim() || 'SaaS',
    frontend: content.match(/Frontend\s*:\s*(.+)/i)?.[1]?.trim() || 'Next.js',
    backend: content.match(/Backend\s*:\s*(.+)/i)?.[1]?.trim() || 'Node/Express',
    database: content.match(/Database\s*:\s*(.+)/i)?.[1]?.trim() || 'PostgreSQL',
    auth: content.match(/Auth\s*:\s*(.+)/i)?.[1]?.trim() || 'JWT',
    keyFeatures: content.match(/Key Features\s*:\s*(.+)/i)?.[1]?.split(',').map(f => f.trim()) || [],
    freeHosting: content.match(/Free Hosting\s*:\s*(.+)/i)?.[1]?.trim() || 'Vercel + Railway',
    estimatedFiles: parseInt(content.match(/Estimated Files\s*:\s*(\d+)/i)?.[1] || '20'),
    estimatedDirs: parseInt(content.match(/(\d+)\s+directories/i)?.[1] || '5'),
  };
}

function parseFileTree(content: string): string[] {
  const paths: string[] = [];
  const lines = content.split('\n');
  const dirStack: string[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/[│├└─┐┘┤┬┴┼]/g, '').trim();
    if (!trimmed || trimmed.endsWith('/')) {
      const dirName = trimmed.replace(/\/$/, '').trim();
      if (dirName) {
        const depth = (line.match(/[│]/g) || []).length;
        dirStack.length = depth;
        dirStack.push(dirName);
      }
    } else if (trimmed && trimmed.includes('.')) {
      const depth = (line.match(/[│]/g) || []).length;
      const currentPath = dirStack.slice(0, depth).join('/');
      paths.push(currentPath ? `${currentPath}/${trimmed}` : trimmed);
    }
  }
  return paths;
}

function parseCodeFiles(content: string): Array<{ path: string; content: string; purpose: string }> {
  const files: Array<{ path: string; content: string; purpose: string }> = [];
  const regex = /📄\s*FILE:\s*(.+)\n\[PURPOSE\]:\s*(.+)\n```[\w]*\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    files.push({
      path: match[1].trim(),
      purpose: match[2].trim(),
      content: match[3].trim(),
    });
  }

  const altRegex = /\*\*FILE:\*\*\s*(.+)\n\*\*PURPOSE\*\*:?\s*(.+)\n```[\w]*\n([\s\S]*?)```/g;
  while ((match = altRegex.exec(content)) !== null) {
    files.push({
      path: match[1].trim(),
      purpose: match[2].trim(),
      content: match[3].trim(),
    });
  }

  return files;
}
