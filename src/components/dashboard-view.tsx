'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore, type Project, type ProjectStatus } from '@/store/app-store';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  Rocket,
  Pencil,
  Trash2,
  RefreshCw,
  FolderOpen,
  Zap,
  GitBranch,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowRight,
  GitCommit,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Timer,
  MessageSquare,
  Globe,
  Hammer,
  ChevronRight,
  Lightbulb,
  Shield,
  FileCode,
  Search,
  Filter,
  LayoutGrid,
  List,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Wifi,
  CalendarDays,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectHealth } from '@/components/project-health';
import { DeploymentHistory } from '@/components/deployment-history';
import { ApiUsageTracker } from '@/components/api-usage-tracker';
import { ProjectAnalytics } from '@/components/project-analytics';

/* ============================================================
   Animation Variants
   ============================================================ */
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ============================================================
   Helper: Time-of-day greeting
   ============================================================ */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '\uD83C\uDF05';  // 🌅 sunrise
  if (hour < 18) return '\u2600\uFE0F';  // ☀️ sun
  return '\uD83C\uDF19';  // 🌙 moon
}

/* ============================================================
   Relative Time Helper
   ============================================================ */
function getRelativeTime(timeStr: string): string {
  const map: Record<string, number> = {
    '2m ago': 2, '15m ago': 15, '1h ago': 60, '2h ago': 120, '3h ago': 180, '5h ago': 300,
  };
  const minutes = map[timeStr];
  if (!minutes) return timeStr;
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ============================================================
   Mini Sparkline Component — Rounded tops
   ============================================================ */
function MiniSparkline({ color, values }: { color: string; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[3px] h-9">
      {values.map((v, i) => {
        const heightPct = (v / max) * 100;
        return (
          <motion.div
            key={i}
            className="relative"
            style={{ width: 6, height: `${Math.max(heightPct, 8)}%` }}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(heightPct, 8)}%` }}
            transition={{ delay: 0.3 + i * 0.04, duration: 0.4, ease: 'easeOut' }}
          >
            {/* Rounded top cap */}
            <div
              className="absolute inset-0 rounded-t-full"
              style={{
                backgroundColor: color,
                opacity: 0.35 + (i / values.length) * 0.65,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Animated Counter Component — With number counting effect
   ============================================================ */
function AnimatedNumber({ value, color, trendUp }: { value: number; color: string; trendUp: boolean }) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    if (hasAnimated) return;
    const duration = 1200;
    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (endValue - startValue) * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    };
    requestAnimationFrame(animate);
  }, [value, hasAnimated]);

  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        className="text-3xl font-bold tabular-nums"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}bb)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {displayValue}
      </motion.span>
      {/* Pulsing delta arrow */}
      <motion.div
        className="flex items-center justify-center w-5 h-5 rounded-full"
        style={{
          backgroundColor: trendUp ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)',
        }}
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {trendUp ? (
          <ArrowUp className="w-2.5 h-2.5" style={{ color: '#3fb950' }} />
        ) : (
          <ArrowDown className="w-2.5 h-2.5" style={{ color: '#f85149' }} />
        )}
      </motion.div>
    </div>
  );
}

/* ============================================================
   Sample Activity Data
   ============================================================ */
const SAMPLE_ACTIVITIES = [
  { id: '1', type: 'project_created' as const, message: 'Project "Invoice Manager" created', time: '2m ago', color: '#58a6ff', view: 'builder' as const },
  { id: '2', type: 'deploy_started' as const, message: 'Deployment started for "Task Manager"', time: '15m ago', color: '#e3b341', view: 'deploy' as const },
  { id: '3', type: 'deploy_completed' as const, message: 'Deployment completed for "Chat App"', time: '1h ago', color: '#3fb950', view: 'deploy' as const },
  { id: '4', type: 'file_pushed' as const, message: '12 files pushed to "Analytics Dashboard"', time: '2h ago', color: '#58a6ff', view: 'builder' as const },
  { id: '5', type: 'deploy_failed' as const, message: 'Deployment failed for "Blog CMS"', time: '3h ago', color: '#f85149', view: 'deploy' as const },
  { id: '6', type: 'project_created' as const, message: 'Project "Food Delivery API" created', time: '5h ago', color: '#58a6ff', view: 'builder' as const },
  { id: '7', type: 'deploy_completed' as const, message: 'Deployment completed for "Portfolio Site"', time: '6h ago', color: '#3fb950', view: 'deploy' as const },
  { id: '8', type: 'file_pushed' as const, message: '5 files pushed to "E-commerce API"', time: '8h ago', color: '#58a6ff', view: 'builder' as const },
  { id: '9', type: 'deploy_started' as const, message: 'Deployment started for "Docs Generator"', time: '10h ago', color: '#e3b341', view: 'deploy' as const },
  { id: '10', type: 'deploy_completed' as const, message: 'Deployment completed for "CRM Tool"', time: '12h ago', color: '#3fb950', view: 'deploy' as const },
];

function ActivityIcon({ type, color }: { type: string; color: string }) {
  switch (type) {
    case 'project_created':
      return <Sparkles className="w-3.5 h-3.5" style={{ color }} />;
    case 'deploy_started':
      return <Rocket className="w-3.5 h-3.5" style={{ color }} />;
    case 'deploy_completed':
      return <CheckCircle className="w-3.5 h-3.5" style={{ color }} />;
    case 'deploy_failed':
      return <AlertCircle className="w-3.5 h-3.5" style={{ color }} />;
    case 'file_pushed':
      return <GitCommit className="w-3.5 h-3.5" style={{ color }} />;
    default:
      return <Activity className="w-3.5 h-3.5" style={{ color }} />;
  }
}

/* ============================================================
   Quick Actions Config — With shortcuts
   ============================================================ */
const QUICK_ACTIONS = [
  {
    id: 'build',
    title: 'Build New Project',
    description: 'Describe your idea and let AI generate the codebase',
    icon: Hammer,
    color: '#58a6ff',
    view: 'builder' as const,
    shortcut: '⌘N',
  },
  {
    id: 'deploy',
    title: 'View Deployments',
    description: 'Deploy to GitHub with real-time status tracking',
    icon: Rocket,
    color: '#3fb950',
    view: 'deploy' as const,
    shortcut: '⌘3',
  },
  {
    id: 'hosting',
    title: 'Free Hosting',
    description: 'Find the best free hosting for your project',
    icon: Globe,
    color: '#e3b341',
    view: 'hosting' as const,
    shortcut: '⌘4',
  },
  {
    id: 'chat',
    title: 'Ask AI',
    description: 'Get deployment help and workflow suggestions',
    icon: MessageSquare,
    color: '#a371f7',
    view: 'chat' as const,
    shortcut: '⌘5',
  },
];

/* ============================================================
   Circular Progress for Health (enhanced version)
   ============================================================ */
function CircularProgress({ value, size = 100, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (v: number) => {
    if (v >= 80) return '#3fb950';
    if (v >= 50) return '#e3b341';
    return '#f85149';
  };

  const color = getColor(value);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#21262d"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
          style={{
            filter: `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-2xl font-bold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4, type: 'spring' }}
        >
          {value}
        </motion.span>
      </div>
    </div>
  );
}

/* ============================================================
   Health Factor Bar
   ============================================================ */
function HealthFactorBar({
  label,
  value,
  percent,
  status,
  icon: Icon,
}: {
  label: string;
  value: string;
  percent: number;
  status: 'good' | 'warning' | 'bad';
  icon: React.ElementType;
}) {
  const colors = {
    good: '#3fb950',
    warning: '#e3b341',
    bad: '#f85149',
  };
  const color = colors[status];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs font-medium" style={{ color: '#c9d1d9' }}>{label}</span>
        </div>
        <span className="text-xs" style={{ color: '#8b949e' }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#21262d' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Improvement Suggestion
   ============================================================ */
function ImprovementSuggestion({
  text,
  actionLabel,
  color,
  onClick,
}: {
  text: string;
  actionLabel: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors"
      style={{ backgroundColor: '#0d1117' }}
      onClick={onClick}
    >
      <Lightbulb className="w-3.5 h-3.5 shrink-0" style={{ color }} />
      <p className="text-xs flex-1" style={{ color: '#8b949e' }}>{text}</p>
      <span className="text-[10px] font-medium shrink-0 flex items-center gap-0.5" style={{ color }}>
        {actionLabel} <ChevronRight className="w-2.5 h-2.5" />
      </span>
    </div>
  );
}

/* ============================================================
   Dot Grid Pattern for Hero Background
   ============================================================ */
function DotGridPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#c9d1d9" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotGrid)" />
    </svg>
  );
}

/* ============================================================
   Floating Orbs — Animated background particles
   ============================================================ */
function FloatingOrbs() {
  const orbs = React.useMemo(() => [
    { x: '10%', y: '20%', size: 80, color: 'rgba(88,166,255,0.06)', delay: 0, duration: 7 },
    { x: '75%', y: '15%', size: 60, color: 'rgba(63,185,80,0.05)', delay: 1.5, duration: 9 },
    { x: '50%', y: '60%', size: 50, color: 'rgba(163,113,247,0.04)', delay: 3, duration: 11 },
    { x: '85%', y: '70%', size: 40, color: 'rgba(227,179,65,0.04)', delay: 2, duration: 8 },
    { x: '25%', y: '80%', size: 35, color: 'rgba(88,166,255,0.03)', delay: 4, duration: 10 },
  ], []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
          }}
          animate={{
            y: [0, -12, 0, 8, 0],
            x: [0, 6, 0, -4, 0],
            scale: [1, 1.1, 1, 0.95, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   Shimmer Skeleton Loader — Enhanced with shimmer-slide
   ============================================================ */
function ShimmerSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden shimmer-slide" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #30363d, #484f58, #30363d)', backgroundSize: '200% 100%' }} />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl skeleton-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded skeleton-shimmer" />
            <div className="h-2 w-1/2 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full skeleton-shimmer" />
          <div className="h-6 w-16 rounded-full skeleton-shimmer" />
        </div>
        <div className="h-8 w-full rounded-lg skeleton-shimmer" />
      </div>
    </div>
  );
}

/* ============================================================
   Activity Timeline Skeleton Loader
   ============================================================ */
function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded skeleton-shimmer" />
            <div className="h-2 w-1/3 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Dashboard View (Main Component)
   ============================================================ */
export function DashboardView() {
  const { projects, setProjects, user, setCurrentView, setSelectedProject, setIsLoading, isGithubConnected } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'status'>('recent');
  const [showAllActivities, setShowAllActivities] = useState(false);
  const { toast } = useToast();

  /* ----- Fetch Projects ----- */
  const fetchProjects = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/list`, {
        headers: { 'x-user-id': user.id },
      });
      const data = await res.json();
      if (data.projects && data.projects.length > 0) {
        setProjects(
          data.projects.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            description: p.description as string,
            githubRepoUrl: p.github_repo_url as string | null,
            liveUrl: p.live_url as string | null,
            framework: p.framework as string,
            stackJson: p.stack_json as string,
            defaultBranch: p.default_branch as string,
            status: (p.status as ProjectStatus) || 'not_deployed',
            createdAt: p.created_at as string,
            updatedAt: p.updated_at as string,
            files: (p.files as Array<Record<string, unknown>>)?.map((f) => ({
              id: f.id as string,
              filePath: f.file_path as string,
              content: f.content as string,
              githubSha: f.github_sha as string | null,
              lastPushedAt: f.last_pushed_at as string | null,
              sizeBytes: f.size_bytes as number,
            })) || [],
            deployments: (p.deployments as Array<Record<string, unknown>>)?.map((d) => ({
              id: d.id as string,
              triggeredBy: d.triggered_by as string,
              githubRunId: d.github_run_id as string | null,
              status: d.status as string,
              startedAt: d.started_at as string,
              completedAt: d.completed_at as string | null,
              durationMs: d.duration_ms as number | null,
              logSummary: d.log_summary as string | null,
              errorMessage: d.error_message as string | null,
            })) || [],
          }))
        );
      }
      // If API returns empty, keep the store's demo/seed data — don't overwrite with []
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, [user, setProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /* ----- Handlers ----- */
  const handleRebuild = async (projectId: string) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Rebuild triggered', description: 'Your deployment has been re-triggered.' });
        fetchProjects();
      } else {
        toast({ title: 'Rebuild failed', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to trigger rebuild', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await fetch(`/api/projects/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      setProjects(projects.filter((p) => p.id !== projectId));
      toast({ title: 'Project removed', description: 'Local record deleted. GitHub repository is untouched.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
    }
  };

  /* ----- Computed Values ----- */
  const FRAMEWORK_BADGES: Record<string, { label: string; color: string }> = {
    nextjs: { label: 'Next.js', color: '#58a6ff' },
    react: { label: 'React', color: '#61dafb' },
    vue: { label: 'Vue', color: '#42b883' },
    express: { label: 'Express', color: '#8b949e' },
    fastapi: { label: 'FastAPI', color: '#009688' },
  };

  const liveCount = projects.filter((p) => p.status === 'live').length;
  const buildingCount = projects.filter((p) => ['building', 'deploying'].includes(p.status)).length;
  const failedCount = projects.filter((p) => p.status === 'failed').length;

  /* ----- Stats Config with Trend Indicators ----- */
  const stats = [
    { label: 'Total Projects', value: projects.length, icon: FolderOpen, color: '#58a6ff', sparkline: [2, 4, 3, 5, 4, projects.length], trend: '+12%', trendUp: true, tooltip: `${liveCount} live, ${buildingCount} building, ${failedCount} failed` },
    { label: 'Live', value: liveCount, icon: Zap, color: '#3fb950', sparkline: [0, 1, 1, 2, 1, liveCount], trend: '+8%', trendUp: true, tooltip: `${liveCount} of ${projects.length} projects deployed` },
    { label: 'Building', value: buildingCount, icon: Activity, color: '#e3b341', sparkline: [0, 0, 1, 0, 1, buildingCount], trend: '-3%', trendUp: false, tooltip: `${buildingCount} active build jobs` },
    { label: 'Failed', value: failedCount, icon: Rocket, color: '#f85149', sparkline: [0, 0, 0, 1, 0, failedCount], trend: '-15%', trendUp: false, tooltip: `${failedCount} deployment${failedCount !== 1 ? 's' : ''} need attention` },
  ];

  /* ----- Filtered & Sorted Projects ----- */
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((p) => {
      const matchesSearch = searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFramework = frameworkFilter === 'all' || p.framework === frameworkFilter;
      return matchesSearch && matchesFramework;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          const statusOrder: Record<string, number> = { live: 0, building: 1, deploying: 2, failed: 3, not_deployed: 4 };
          return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [projects, searchQuery, frameworkFilter, sortBy]);

  /* ----- Health Score ----- */
  let healthScore = 50;
  if (isGithubConnected) healthScore += 15;
  if (projects.length > 0) healthScore += 10;
  if (liveCount > 0) healthScore += 15;
  if (failedCount === 0 && projects.length > 0) healthScore += 10;
  if (projects.length === 0 && !isGithubConnected) healthScore = 25;
  healthScore = Math.min(100, healthScore);

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Setup';
    return 'Getting Started';
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#3fb950';
    if (score >= 50) return '#e3b341';
    return '#f85149';
  };

  /* ----- Footer Stats ----- */
  const totalDeployments = projects.reduce((acc, p) => acc + (p.deployments?.length || 0), 0);

  /* ----- Visible Activities ----- */
  const visibleActivities = showAllActivities ? SAMPLE_ACTIVITIES : SAMPLE_ACTIVITIES.slice(0, 6);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-6">

      {/* ================================================
          1. HERO SECTION — ENHANCED
          ================================================ */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div
          className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
            border: '1px solid #30363d',
          }}
        >
          {/* Dot grid background pattern */}
          <DotGridPattern />

          {/* Animated floating orbs — background particles */}
          <FloatingOrbs />

          {/* Gradient mesh behind main content */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                'radial-gradient(ellipse 600px 400px at 20% 10%, rgba(88,166,255,0.05), transparent)',
                'radial-gradient(ellipse 500px 350px at 80% 80%, rgba(63,185,80,0.04), transparent)',
                'radial-gradient(ellipse 400px 300px at 50% 50%, rgba(227,179,65,0.03), transparent)',
              ].join(', '),
            }}
          />

          <div className="relative z-10">
            {/* Greeting + Tagline */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                  <motion.span
                    style={{
                      background: 'linear-gradient(135deg, #58a6ff, #3fb950, #e3b341)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: 'gradient-shift 3s ease-in-out infinite',
                    }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {getGreeting()}
                  </motion.span>
                  {/* Animated emoji with gentle float */}
                  <motion.span
                    className="text-3xl inline-block"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {getGreetingEmoji()}
                  </motion.span>
                </h1>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#8b949e' }}>
                  Build, deploy, and host — all in one place
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  className="gap-2 rounded-lg font-medium sparkle-effect relative"
                  style={{
                    backgroundColor: '#238636',
                    color: 'white',
                    boxShadow: '0 0 15px rgba(35, 134, 54, 0.3), 0 0 30px rgba(35, 134, 54, 0.1)',
                  }}
                  onClick={() => setCurrentView('builder')}
                >
                  <Plus className="w-4 h-4" /> New Project
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 rounded-lg font-medium"
                  style={{ borderColor: '#30363d', color: '#c9d1d9', backgroundColor: '#21262d' }}
                  onClick={() => setCurrentView('onboarding')}
                >
                  <GitBranch className="w-4 h-4" /> Connect GitHub
                </Button>
              </div>
            </div>

            {/* Quick Stats Row — Icon-based mini metrics */}
            <motion.div
              className="mt-6 rounded-xl p-3 flex items-center justify-around flex-wrap gap-3"
              style={{
                backgroundColor: 'rgba(22, 27, 34, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(48, 54, 61, 0.5)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {[
                { label: 'Builds today', value: 7, color: '#58a6ff', icon: Hammer },
                { label: 'Deploys this week', value: 25, color: '#3fb950', icon: Rocket },
                { label: 'AI Messages', value: 142, color: '#a371f7', icon: MessageSquare },
                { label: 'Uptime', value: '99.9%', color: '#e3b341', icon: Wifi },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  {i > 0 && (
                    <div className="w-px h-8 mx-1 hidden sm:block" style={{ backgroundColor: '#30363d' }} />
                  )}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}12` }}
                  >
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <span className="text-base font-bold block leading-tight" style={{ color: item.color }}>
                      {item.value}
                    </span>
                    <span className="text-[10px]" style={{ color: '#8b949e' }}>{item.label}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Setup Guide (shown when GitHub not connected) */}
      {!isGithubConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Card className="border-2" style={{ borderColor: '#58a6ff40', backgroundColor: '#161b22' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#58a6ff15' }}>
                  <Rocket className="w-6 h-6" style={{ color: '#58a6ff' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold" style={{ color: '#c9d1d9' }}>
                    Get Started with GitDeploy AI
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#8b949e' }}>
                    Connect your GitHub account to start building and deploying projects
                  </p>
                </div>
                <Button
                  className="gap-2"
                  style={{ backgroundColor: '#238636', color: 'white' }}
                  onClick={() => setCurrentView('onboarding')}
                >
                  <Zap className="w-4 h-4" /> Connect GitHub
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ================================================
          2. GLASSMORPHISM STATS CARDS — ENHANCED
          ================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, boxShadow: `0 8px 30px ${stat.color}20` }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Card
                  className="relative overflow-hidden cursor-default group"
                  style={{
                    backgroundColor: 'rgba(22, 27, 34, 0.6)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderColor: '#30363d',
                    borderTop: `3px solid ${stat.color}`,
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <AnimatedNumber value={stat.value} color={stat.color} trendUp={stat.trendUp} />
                        <p className="text-xs" style={{ color: '#8b949e' }}>{stat.label}</p>
                        <MiniSparkline color={stat.color} values={stat.sparkline} />
                      </div>
                      <div
                        className="p-2.5 rounded-xl relative"
                        style={{ backgroundColor: `${stat.color}15` }}
                      >
                        <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                        {/* Pulsing glow behind icon */}
                        <div
                          className="absolute inset-0 rounded-xl animate-pulse-glow"
                          style={{ backgroundColor: `${stat.color}10` }}
                        />
                      </div>
                    </div>
                    {/* Trend badge */}
                    <div className="mt-2 flex items-center gap-1">
                      <motion.span
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: stat.trendUp ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)',
                          color: stat.trendUp ? '#3fb950' : '#f85149',
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                      >
                        {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {stat.trend}
                      </motion.span>
                    </div>
                  </CardContent>
                  {/* Glassmorphism reflection effect at bottom */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(to top, ${stat.color}08, transparent)`,
                    }}
                  />
                </Card>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="text-xs"
                style={{ backgroundColor: '#1c2128', border: '1px solid #30363d', color: '#c9d1d9' }}
              >
                {stat.tooltip}
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </div>

      {/* ================================================
          PROJECT ANALYTICS — Between Stats and Projects
          ================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <ProjectAnalytics />
      </motion.div>

      {/* ================================================
          PROJECT SECTION — ENHANCED GRID/TABLE
          ================================================ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <ShimmerSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: '#21262d' }}>
                <GitBranch className="w-10 h-10" style={{ color: '#30363d' }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: '#c9d1d9' }}>No projects yet</h3>
              <p className="text-sm mt-2 max-w-sm text-center" style={{ color: '#8b949e' }}>
                Describe your first project and let AI build it for you. We&apos;ll handle the code, deployment, and hosting.
              </p>
              <div className="flex gap-3 mt-5">
                <Button
                  className="gap-2"
                  style={{ backgroundColor: '#238636', color: 'white' }}
                  onClick={() => setCurrentView('builder')}
                >
                  <Plus className="w-4 h-4" /> Create Your First Project
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  style={{ borderColor: '#30363d', color: '#8b949e' }}
                  onClick={() => setCurrentView('onboarding')}
                >
                  Connect GitHub First
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#8b949e' }}>
                  <FolderOpen className="w-4 h-4" />
                  Your Projects
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 ml-1" style={{ borderColor: '#30363d', color: '#58a6ff' }}>
                    {filteredProjects.length}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Sort by dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'status')}
                      className="pl-3 pr-7 py-1.5 rounded-lg text-xs outline-none appearance-none cursor-pointer transition-colors"
                      style={{
                        backgroundColor: '#0d1117',
                        border: '1px solid #30363d',
                        color: '#8b949e',
                      }}
                    >
                      <option value="recent" style={{ backgroundColor: '#161b22' }}>Sort: Recent</option>
                      <option value="name" style={{ backgroundColor: '#161b22' }}>Sort: Name</option>
                      <option value="status" style={{ backgroundColor: '#161b22' }}>Sort: Status</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: '#484f58' }} />
                  </div>
                  {/* View Toggle */}
                  <div
                    className="flex items-center rounded-lg overflow-hidden"
                    style={{ border: '1px solid #30363d' }}
                  >
                    <button
                      className="p-1.5 transition-colors"
                      style={{
                        backgroundColor: viewMode === 'grid' ? '#30363d' : 'transparent',
                        color: viewMode === 'grid' ? '#c9d1d9' : '#484f58',
                      }}
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 transition-colors"
                      style={{
                        backgroundColor: viewMode === 'table' ? '#30363d' : 'transparent',
                        color: viewMode === 'table' ? '#c9d1d9' : '#484f58',
                      }}
                      onClick={() => setViewMode('table')}
                      title="Table View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    style={{ color: '#8b949e' }}
                    onClick={fetchProjects}
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search & Filter Bar */}
              <div
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 p-3 rounded-lg"
                style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#484f58' }} />
                  <input
                    type="text"
                    placeholder="Search projects by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-md text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: '#161b22',
                      border: '1px solid #30363d',
                      color: '#c9d1d9',
                    }}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#58a6ff'; }}
                    onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#30363d'; }}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#484f58' }} />
                  <select
                    value={frameworkFilter}
                    onChange={(e) => setFrameworkFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 rounded-md text-sm outline-none appearance-none cursor-pointer transition-colors"
                    style={{
                      backgroundColor: '#161b22',
                      border: '1px solid #30363d',
                      color: '#c9d1d9',
                    }}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#58a6ff'; }}
                    onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#30363d'; }}
                  >
                    <option value="all" style={{ backgroundColor: '#161b22' }}>All Frameworks</option>
                    <option value="nextjs" style={{ backgroundColor: '#161b22' }}>Next.js</option>
                    <option value="react" style={{ backgroundColor: '#161b22' }}>React</option>
                    <option value="vue" style={{ backgroundColor: '#161b22' }}>Vue</option>
                    <option value="express" style={{ backgroundColor: '#161b22' }}>Express</option>
                    <option value="fastapi" style={{ backgroundColor: '#161b22' }}>FastAPI</option>
                  </select>
                  <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 pointer-events-none" style={{ color: '#484f58' }} />
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-center py-10">
                  <Search className="w-8 h-8 mx-auto mb-3" style={{ color: '#30363d' }} />
                  <p className="text-sm" style={{ color: '#8b949e' }}>No projects match your search or filter</p>
                  <button
                    className="text-xs mt-2 hover:underline"
                    style={{ color: '#58a6ff' }}
                    onClick={() => { setSearchQuery(''); setFrameworkFilter('all'); }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                /* GRID VIEW — Default, modern grid layout */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project, idx) => {
                    const badge = FRAMEWORK_BADGES[project.framework] || FRAMEWORK_BADGES.express;
                    const lastDeployment = project.deployments?.[0];
                    const statusColor = project.status === 'live' ? '#3fb950' : project.status === 'failed' ? '#f85149' : project.status === 'building' || project.status === 'deploying' ? '#e3b341' : '#8b949e';
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: idx * 0.06, duration: 0.35, ease: 'easeOut' }}
                        whileHover={{ y: -4, scale: 1.02, boxShadow: `0 12px 40px ${badge.color}20` }}
                      >
                        <Card
                          className="overflow-hidden cursor-default transition-all duration-300 group relative"
                          style={{
                            backgroundColor: '#161b22',
                            borderColor: '#30363d',
                            borderLeft: `3px solid ${badge.color}`,
                          }}
                        >
                          {/* Gradient top border per framework */}
                          <div
                            className="h-1"
                            style={{
                              background: `linear-gradient(90deg, ${badge.color}, ${badge.color}80, transparent)`,
                            }}
                          />
                          <CardContent className="p-4">
                            {/* Header: Framework badge + Status dot */}
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5"
                                style={{ backgroundColor: `${badge.color}18`, color: badge.color }}
                              >
                                <FileCode className="w-3 h-3" />
                                {badge.label}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: statusColor,
                                    boxShadow: `0 0 6px ${statusColor}60`,
                                  }}
                                />
                                <span className="text-[10px] font-medium" style={{ color: statusColor }}>
                                  {project.status === 'not_deployed' ? 'Not Deployed' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                </span>
                              </div>
                            </div>

                            {/* Project Name & Description */}
                            <h3 className="text-sm font-semibold truncate" style={{ color: '#c9d1d9' }}>{project.name}</h3>
                            {project.description && (
                              <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: '#8b949e' }}>
                                {project.description}
                              </p>
                            )}

                            {/* Last Deployed + Repo Info — revealed on hover */}
                            <div className="mt-3 space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" style={{ color: '#484f58' }} />
                                <span className="text-[11px]" style={{ color: '#8b949e' }}>
                                  {lastDeployment?.completedAt
                                    ? new Date(lastDeployment.completedAt).toLocaleDateString()
                                    : 'Never deployed'}
                                </span>
                              </div>
                              {/* Extra info revealed on hover */}
                              <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                                {project.githubRepoUrl && (
                                  <a
                                    href={project.githubRepoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[11px] hover:underline"
                                    style={{ color: '#58a6ff' }}
                                  >
                                    <ArrowUpRight className="w-3 h-3" />
                                    {project.githubRepoUrl.replace('https://github.com/', '')}
                                  </a>
                                )}
                                <div className="flex items-center gap-1.5 mt-1">
                                  <GitBranch className="w-3 h-3" style={{ color: '#484f58' }} />
                                  <span className="text-[11px]" style={{ color: '#8b949e' }}>
                                    {project.defaultBranch || 'main'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Quick Action Buttons */}
                            <div
                              className="flex items-center gap-2 mt-4 pt-3"
                              style={{ borderTop: '1px solid #21262d' }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 h-7 text-[11px] flex-1 hover:bg-[#21262d]"
                                style={{ color: '#58a6ff' }}
                                onClick={() => { setSelectedProject(project); setCurrentView('builder'); }}
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 h-7 text-[11px] flex-1 hover:bg-[#21262d]"
                                style={{ color: '#3fb950' }}
                                onClick={() => { setSelectedProject(project); setCurrentView('deploy'); }}
                              >
                                <Rocket className="w-3 h-3" /> Deploy
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 h-7 text-[11px] hover:bg-[#21262d]"
                                    style={{ color: '#f85149' }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle style={{ color: '#c9d1d9' }}>Delete Project</AlertDialogTitle>
                                    <AlertDialogDescription style={{ color: '#8b949e' }}>
                                      This will NOT delete your GitHub repository. Only the GitDeploy AI project record will be removed. Confirm?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel style={{ color: '#8b949e' }}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      style={{ backgroundColor: '#f85149', color: 'white' }}
                                      onClick={() => handleDelete(project.id)}
                                    >
                                      Delete Record Only
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* TABLE VIEW */
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderColor: '#30363d' }}>
                        <TableHead className="text-xs" style={{ color: '#8b949e' }}>Project</TableHead>
                        <TableHead className="text-xs" style={{ color: '#8b949e' }}>Framework</TableHead>
                        <TableHead className="text-xs hidden md:table-cell" style={{ color: '#8b949e' }}>Repository</TableHead>
                        <TableHead className="text-xs" style={{ color: '#8b949e' }}>Status</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell" style={{ color: '#8b949e' }}>Last Deployed</TableHead>
                        <TableHead className="text-xs text-right" style={{ color: '#8b949e' }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => {
                        const badge = FRAMEWORK_BADGES[project.framework] || FRAMEWORK_BADGES.express;
                        const lastDeployment = project.deployments?.[0];
                        return (
                          <TableRow key={project.id} style={{ borderColor: '#21262d', borderLeft: `3px solid ${badge.color}` }} className="hover:bg-[#21262d] transition-colors">
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium" style={{ color: '#c9d1d9' }}>{project.name}</p>
                                {project.description && (
                                  <p className="text-xs mt-0.5 truncate max-w-48" style={{ color: '#8b949e' }}>
                                    {project.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: `${badge.color}15`, color: badge.color }}
                              >
                                {badge.label}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {project.githubRepoUrl ? (
                                <a
                                  href={project.githubRepoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs flex items-center gap-1 hover:underline"
                                  style={{ color: '#58a6ff' }}
                                >
                                  <ArrowUpRight className="w-3 h-3" />
                                  {project.githubRepoUrl.replace('https://github.com/', '')}
                                </a>
                              ) : (
                                <span className="text-xs" style={{ color: '#484f58' }}>—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={project.status} />
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" style={{ color: '#484f58' }} />
                                <span className="text-xs" style={{ color: '#8b949e' }}>
                                  {lastDeployment?.completedAt
                                    ? new Date(lastDeployment.completedAt).toLocaleDateString()
                                    : 'Never'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-[#21262d]"
                                  style={{ color: '#58a6ff' }}
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setCurrentView('builder');
                                  }}
                                  title="Edit with AI"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-[#21262d]"
                                  style={{ color: '#3fb950' }}
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setCurrentView('deploy');
                                  }}
                                  title="Deploy"
                                >
                                  <Rocket className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-[#21262d]"
                                  style={{ color: '#8b949e' }}
                                  onClick={() => handleRebuild(project.id)}
                                  title="Rebuild"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-[#21262d]"
                                      style={{ color: '#f85149' }}
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle style={{ color: '#c9d1d9' }}>Delete Project</AlertDialogTitle>
                                      <AlertDialogDescription style={{ color: '#8b949e' }}>
                                        This will NOT delete your GitHub repository. Only the GitDeploy AI project record will be removed. Confirm?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel style={{ color: '#8b949e' }}>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        style={{ backgroundColor: '#f85149', color: 'white' }}
                                        onClick={() => handleDelete(project.id)}
                                      >
                                        Delete Record Only
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ================================================
          3. ENHANCED ACTIVITY TIMELINE + PROJECT HEALTH
          ================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Project Health — Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-1"
        >
          <Card
            className="overflow-hidden"
            style={{ backgroundColor: '#161b22', borderColor: '#30363d', borderTop: `3px solid ${getHealthColor(healthScore)}` }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
                <Shield className="w-4 h-4" style={{ color: getHealthColor(healthScore) }} />
                Project Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-5">
                <CircularProgress value={healthScore} />
                <div className="flex-1">
                  <p className="text-base font-semibold" style={{ color: '#c9d1d9' }}>
                    {getHealthLabel(healthScore)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#8b949e' }}>
                    {isGithubConnected
                      ? 'Your setup looks good'
                      : 'Connect GitHub to improve your score'}
                  </p>
                </div>
              </div>

              {/* Health Factor Bars */}
              <div className="mt-5 space-y-3.5 pt-4 border-t" style={{ borderColor: '#21262d' }}>
                <HealthFactorBar
                  label="GitHub Connected"
                  value={isGithubConnected ? 'Active' : 'Not connected'}
                  percent={isGithubConnected ? 100 : 0}
                  status={isGithubConnected ? 'good' : 'bad'}
                  icon={CheckCircle}
                />
                <HealthFactorBar
                  label="Projects"
                  value={`${projects.length} total · ${liveCount} live`}
                  percent={projects.length > 0 ? Math.min(100, (liveCount / Math.max(projects.length, 1)) * 100) : 0}
                  status={projects.length > 0 ? (liveCount > 0 ? 'good' : 'warning') : 'bad'}
                  icon={FileCode}
                />
                <HealthFactorBar
                  label="Deployments"
                  value={failedCount > 0 ? `${failedCount} failed` : liveCount > 0 ? 'All successful' : 'No deployments'}
                  percent={failedCount > 0 ? Math.max(20, 100 - failedCount * 30) : liveCount > 0 ? 100 : 20}
                  status={failedCount > 0 ? 'bad' : liveCount > 0 ? 'good' : 'warning'}
                  icon={Activity}
                />
              </div>

              {/* Improvement Suggestions */}
              <div className="mt-4 space-y-2 pt-3 border-t" style={{ borderColor: '#21262d' }}>
                <p className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: '#484f58' }}>
                  Suggestions
                </p>
                {!isGithubConnected && (
                  <ImprovementSuggestion
                    text="Connect GitHub to unlock deployment features"
                    actionLabel="Connect"
                    color="#e3b341"
                    onClick={() => setCurrentView('onboarding')}
                  />
                )}
                {projects.length === 0 && (
                  <ImprovementSuggestion
                    text="Create your first project to get started"
                    actionLabel="Build"
                    color="#58a6ff"
                    onClick={() => setCurrentView('builder')}
                  />
                )}
                {projects.length > 0 && liveCount === 0 && (
                  <ImprovementSuggestion
                    text="Deploy a project to go live"
                    actionLabel="Deploy"
                    color="#3fb950"
                    onClick={() => setCurrentView('deploy')}
                  />
                )}
                {failedCount > 0 && (
                  <ImprovementSuggestion
                    text="Fix failed deployments to improve health"
                    actionLabel="View"
                    color="#f85149"
                    onClick={() => setCurrentView('deploy')}
                  />
                )}
                {isGithubConnected && projects.length > 0 && liveCount > 0 && failedCount === 0 && (
                  <ImprovementSuggestion
                    text="Ask AI for optimization suggestions"
                    actionLabel="Chat"
                    color="#a371f7"
                    onClick={() => setCurrentView('chat')}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity — Enhanced with connecting lines & View All */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="lg:col-span-2"
        >
          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" style={{ color: '#58a6ff' }} />
                  <CardTitle className="text-sm" style={{ color: '#c9d1d9' }}>Recent Activity</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5" style={{ borderColor: '#30363d', color: '#8b949e' }}>
                    {SAMPLE_ACTIVITIES.length} events
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1"
                    style={{ color: '#58a6ff' }}
                    onClick={() => setShowAllActivities(!showAllActivities)}
                  >
                    {showAllActivities ? 'Show Less' : 'View All'}
                    <ChevronDown
                      className="w-3 h-3 transition-transform duration-200"
                      style={{ transform: showAllActivities ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0 max-h-96 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {visibleActivities.map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15, height: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.35, ease: 'easeOut' }}
                      className="flex items-start gap-3 relative cursor-pointer group rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                      onClick={() => setCurrentView(activity.view)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = `${activity.color}08`; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      {/* Connecting line and dot */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-transform duration-200 group-hover:scale-110"
                          style={{ backgroundColor: `${activity.color}18` }}
                        >
                          <ActivityIcon type={activity.type} color={activity.color} />
                        </div>
                        {i < visibleActivities.length - 1 && (
                          <div
                            className="w-0.5 flex-1 min-h-[20px]"
                            style={{
                              background: `linear-gradient(to bottom, ${activity.color}40, #21262d)`,
                            }}
                          />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-3 group-hover:translate-x-0.5 transition-transform duration-200">
                        <p className="text-sm font-medium" style={{ color: '#c9d1d9' }}>{activity.message}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: activity.color }}
                          >
                            {getRelativeTime(activity.time)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${activity.color}10`, color: '#8b949e' }}>
                            {activity.type.replace('_', ' ')}
                          </span>
                          <ChevronRight
                            className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-auto"
                            style={{ color: '#484f58' }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {/* View All Link */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #21262d' }}>
                <button
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                  style={{ color: '#58a6ff' }}
                  onClick={() => setCurrentView('deploy')}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#79c0ff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#58a6ff'; }}
                >
                  View All Activity <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ================================================
          4. QUICK ACTIONS GRID — ENHANCED WITH GRADIENT + SHORTCUTS
          ================================================ */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        transition={{ delayChildren: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4" style={{ color: '#e3b341' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#c9d1d9' }}>Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <motion.div
              key={action.id}
              variants={staggerItem}
              whileHover={{ y: -6, scale: 1.03, boxShadow: `0 12px 40px ${action.color}30` }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Card
                className="cursor-pointer transition-all duration-300 relative overflow-hidden group"
                style={{
                  backgroundColor: '#161b22',
                  borderColor: '#30363d',
                }}
                onClick={() => setCurrentView(action.view)}
              >
                {/* Gradient top accent with cycling animation */}
                <div
                  className="h-1"
                  style={{
                    background: `linear-gradient(90deg, ${action.color}, ${action.color}80, transparent)`,
                    animation: 'gradient-cycle 3s ease-in-out infinite',
                  }}
                />
                <CardContent className="p-5">
                  {/* Larger icon area with gradient background */}
                  <div className="flex items-start justify-between">
                    <div
                      className="p-4 rounded-2xl relative"
                      style={{
                        background: `linear-gradient(135deg, ${action.color}20, ${action.color}08)`,
                      }}
                    >
                      <action.icon className="w-6 h-6" style={{ color: action.color }} />
                      {/* Subtle glow */}
                      <div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${action.color}10, transparent 70%)`,
                        }}
                      />
                    </div>
                    <ArrowRight
                      className="w-4 h-4 mt-1 transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: '#484f58' }}
                    />
                  </div>
                  <h3 className="text-sm font-semibold mt-4" style={{ color: '#c9d1d9' }}>{action.title}</h3>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#8b949e' }}>{action.description}</p>
                  {/* Keyboard shortcut label */}
                  <div className="mt-3 pt-2.5 flex items-center justify-between" style={{ borderTop: '1px solid #21262d' }}>
                    <kbd
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                      style={{ borderColor: '#30363d', backgroundColor: '#21262d', color: '#8b949e' }}
                    >
                      {action.shortcut}
                    </kbd>
                    <span className="text-[10px]" style={{ color: '#484f58' }}>Click to open</span>
                  </div>
                </CardContent>
                {/* Hover glow effect */}
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(ellipse at center, ${action.color}08, transparent 70%)`,
                  }}
                />
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ================================================
          5. API USAGE TRACKER + DEPLOYMENT HISTORY
          ================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <ApiUsageTracker />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <DeploymentHistory />
        </motion.div>
      </div>

      {/* ================================================
          6. FOOTER STATS BAR
          ================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div
          className="rounded-xl px-5 py-3 flex items-center justify-center flex-wrap gap-x-8 gap-y-2"
          style={{
            backgroundColor: '#0d1117',
            border: '1px solid #21262d',
          }}
        >
          {[
            { label: 'projects built this week', value: projects.length, color: '#58a6ff', icon: Hammer },
            { label: 'deployments completed', value: totalDeployments, color: '#3fb950', icon: Rocket },
            { label: 'AI messages sent', value: 142, color: '#a371f7', icon: MessageSquare },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
              <span className="text-xs font-semibold" style={{ color: item.color }}>{item.value}</span>
              <span className="text-xs" style={{ color: '#484f58' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
    </TooltipProvider>
  );
}
