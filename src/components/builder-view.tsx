'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

type BuilderPhase = 'describe' | 'requirements' | 'file_tree' | 'generating' | 'complete' | 'deploying';
type BuilderTab = 'chat' | 'templates' | 'marketplace';

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
  // Split content by code blocks
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

        // Regular text — handle inline code
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [builderChat]);

  // Determine active step for Quick Start Guide
  const activeStep = phase === 'describe' ? 1 : (phase === 'requirements' || phase === 'file_tree') ? 2 : 3;

  // Right panel has content?
  const rightPanelHasContent = requirementsCard && phase !== 'describe' || fileTreePaths.length > 0 || generatedFiles.length > 0;

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
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
        id: (Date.now() + 1).toString(),
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
        id: (Date.now() + 1).toString(),
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
          </div>
        </div>

        {/* Marketplace, Templates or Chat */}
        {activeTab === 'marketplace' && phase === 'describe' ? (
          <ScrollArea className="flex-1 p-4">
            <TemplateMarketplace onSelectTemplate={handleTemplateSelect} />
          </ScrollArea>
        ) : activeTab === 'templates' && phase === 'describe' ? (
          <ScrollArea className="flex-1 p-4">
            <ProjectTemplates onSelectTemplate={handleTemplateSelect} />
          </ScrollArea>
        ) : (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {builderChat.length === 0 && (
                  /* ─── Better Empty State ─── */
                  <div className="text-center py-10">
                    {/* Large icon with animated gradient ring */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, type: 'spring' }}
                      className="relative w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-5"
                      style={{ backgroundColor: '#58a6ff10' }}
                    >
                      <Sparkles className="w-10 h-10 animate-sparkle" style={{ color: '#58a6ff' }} />
                      {/* Animated gradient ring */}
                      <div
                        className="absolute inset-[-4px] rounded-2xl animate-pulse-ring"
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
                      Describe your project
                    </h3>
                    <p className="text-sm max-w-md mx-auto" style={{ color: '#8b949e' }}>
                      Tell me what you want to build and I&apos;ll create the complete codebase for you
                    </p>

                    {/* Example prompts in 2x2 grid */}
                    <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto mt-6">
                      {EXAMPLE_PROMPTS.map((example, i) => (
                        <motion.button
                          key={example.text}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                          className="flex items-start gap-2.5 text-left px-3 py-3 rounded-xl border transition-all duration-200 hover:bg-[#21262d] hover:border-[#58a6ff] hover:-translate-y-0.5 group"
                          style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}
                          onClick={() => sendMessage(example.text)}
                        >
                          <span className="text-lg shrink-0 mt-0.5">{example.icon}</span>
                          <div>
                            <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>{example.title}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>{example.desc}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Or try a template link */}
                    <button
                      className="mt-4 text-xs flex items-center gap-1.5 mx-auto transition-colors hover:text-[#58a6ff]"
                      style={{ color: '#8b949e' }}
                      onClick={() => setActiveTab('templates')}
                    >
                      <LayoutTemplate className="w-3.5 h-3.5" />
                      Or try a template
                    </button>
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
                        {/* Timestamp + Copy row */}
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

        {/* Build Progress — Card Wrapper with estimated time + cancel */}
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
                <div className="flex items-center justify-between mb-2">
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
                <ProgressDots current={buildProgress.current} total={buildProgress.total} />
                <div className="mt-2">
                  <Progress
                    value={(buildProgress.current / buildProgress.total) * 100}
                    className="h-1.5 progress-shimmer"
                  />
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
                    {/* File count with animated counter */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold" style={{ color: '#c9d1d9' }}>
                        <AnimatedCounter target={generatedFiles.length} />
                      </span>
                      <span className="text-xs" style={{ color: '#8b949e' }}>files built</span>
                    </div>
                    {/* Project summary with tech stack badges */}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Input — Enhanced with char count + better CTA */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#30363d' }}>
          <div className="flex gap-2 max-w-3xl mx-auto">
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
                boxShadow: input.trim() ? '0 0 20px rgba(88,166,255,0.3), 0 0 40px rgba(35,134,54,0.15)' : 'none',
              }}
              onClick={() => sendMessage(input)}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

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

          {/* File Tree */}
          {fileTreePaths.length > 0 && (
            <div>
              <h3 className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <FolderTree className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} /> File Structure
              </h3>
              <FileTree tree={buildTreeFromPaths(fileTreePaths)} maxHeight="300px" />
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
                      onClick={() => setSelectedFile({ path: file.path, content: file.content, purpose: file.purpose, sizeBytes: file.content.length })}
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
              {/* Steps */}
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
                        {/* Numbered circle */}
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
