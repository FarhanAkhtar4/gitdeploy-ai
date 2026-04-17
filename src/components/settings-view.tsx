'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
  User as UserIcon,
  Github,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Unplug,
  CheckCircle,
  AlertCircle,
  Mail,
  Calendar,
  Trash2,
  AlertTriangle,
  Pencil,
  Crown,
  Activity,
  FolderKanban,
  Rocket,
  MessageSquare,
  TestTube,
  Clock,
  Bell,
  Moon,
  Sun,
  Globe,
  GitBranch,
  Zap,
  Eye,
  EyeOff,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  Flame,
  Lock,
  Fingerprint,
  Key,
  Scan,
  Monitor,
  Palette,
  Type,
  SidebarOpen,
  Download,
  ChevronRight,
  ArrowRight,
  Webhook,
  Gauge,
  Copy,
  Check,
  RefreshCw,
  Server,
  Code,
  LayoutGrid,
  Workflow,
  Terminal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CodeReviewAssistant } from '@/components/code-review-assistant';

/* ─── Circular Progress for API Usage ─── */
function CircularUsageMeter({ used, total, size = 100, strokeWidth = 7 }: { used: number; total: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((used / total) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 90 ? '#f85149' : percentage >= 70 ? '#e3b341' : '#58a6ff';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#21262d" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{used}</span>
        <span className="text-[9px] uppercase font-medium" style={{ color: '#8b949e' }}>/ {total} requests</span>
      </div>
    </div>
  );
}

// Circular progress for security score
function SecurityScoreRing({ score }: { score: number }) {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#3fb950' : score >= 50 ? '#e3b341' : '#f85149';
  const label = score >= 80 ? 'Strong' : score >= 50 ? 'Fair' : 'Weak';
  const emoji = score >= 80 ? '🛡️' : score >= 50 ? '⚠️' : '🔴';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#21262d" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px]">{emoji}</span>
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[8px] uppercase font-semibold tracking-wider" style={{ color: '#8b949e' }}>{label}</span>
      </div>
    </div>
  );
}

export function SettingsView() {
  const { user, setUser, githubUser, setGithubUser, isGithubConnected, setIsGithubConnected, setCurrentView } = useAppStore();
  const [githubInfo, setGithubInfo] = useState<{ connected: boolean; tokenHint?: string; scopes?: string; validatedAt?: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'idle' | 'success' | 'fail'>('idle');
  const [tokenValidationProgress, setTokenValidationProgress] = useState(0);
  const { toast } = useToast();

  // Preferences state
  const [defaultFramework, setDefaultFramework] = useState('nextjs');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [notifDeploy, setNotifDeploy] = useState(true);
  const [notifBuild, setNotifBuild] = useState(true);
  const [notifSchedule, setNotifSchedule] = useState(false);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [notifWorkflow, setNotifWorkflow] = useState(true);

  // Profile state
  const [emailNotif, setEmailNotif] = useState(true);
  const [emailWeekly, setEmailWeekly] = useState(false);

  // Appearance state
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');

  // API Config state
  const [apiKey, setApiKey] = useState('gdeploy_sk_••••••••••••••••');
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://api.example.com/webhook');
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Danger zone state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteCountdown, setDeleteCountdown] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // API usage mock data
  const apiUsage = {
    used: 73,
    total: 100,
    categories: [
      { name: 'Chat', value: 45, color: '#58a6ff' },
      { name: 'Builder', value: 28, color: '#a371f7' },
    ],
    period: 'This month',
  };

  // Security score calculation
  const securityScore = (() => {
    let score = 0;
    if (isGithubConnected) score += 30;
    if (githubInfo?.scopes?.includes('repo')) score += 20;
    if (githubInfo?.scopes?.includes('workflow')) score += 15;
    if (githubInfo?.validatedAt) score += 15;
    score += 20;
    return Math.min(score, 100);
  })();

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/user`, { headers: { 'x-user-id': user.id } })
        .then((res) => res.json())
        .then((data) => {
          if (data.github) {
            setGithubInfo(data.github as typeof githubInfo);
          }
        })
        .catch(console.error);
    }
  }, [user?.id]);

  const handleDisconnect = async () => {
    if (!user) return;
    try {
      await fetch('/api/auth/github', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      setGithubUser(null);
      setIsGithubConnected(false);
      setGithubInfo({ connected: false });
      toast({ title: 'GitHub disconnected', description: 'Your token has been removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to disconnect', variant: 'destructive' });
    }
  };

  const handleDeleteAccount = () => {
    toast({ title: 'Account deletion', description: 'This feature is not available in the demo.', variant: 'destructive' });
  };

  const handleDeleteAllData = () => {
    toast({ title: 'Data deletion', description: 'This feature is not available in the demo.', variant: 'destructive' });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult('idle');
    setTokenValidationProgress(0);

    const steps = [20, 40, 60, 80, 100];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 400));
      setTokenValidationProgress(step);
    }

    if (isGithubConnected) {
      setConnectionTestResult('success');
      toast({ title: 'Connection OK', description: 'GitHub token is valid and working' });
    } else {
      setConnectionTestResult('fail');
      toast({ title: 'Connection Failed', description: 'Could not verify GitHub connection', variant: 'destructive' });
    }
    setTestingConnection(false);
  };

  const handleSecurityAudit = () => {
    toast({ title: 'Security Audit', description: 'All checks passed! Your account is secure.' });
  };

  const handleGenerateApiKey = () => {
    const newKey = `gdeploy_sk_${Math.random().toString(36).substring(2, 18)}`;
    setApiKey(newKey);
    setShowApiKey(true);
    toast({ title: 'API Key Generated', description: 'New API key has been generated. Store it safely!' });
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const handleRevokeApiKey = () => {
    setApiKey('gdeploy_sk_••••••••••••••••');
    setShowApiKey(false);
    toast({ title: 'API Key Revoked', description: 'The API key has been revoked.' });
  };

  const handleExportData = () => {
    toast({ title: 'Export Data', description: 'Your data export has been started. You will receive an email when it is ready.' });
  };

  // Delete countdown handler
  const startDeleteCountdown = useCallback(() => {
    if (deleteConfirmation !== 'DELETE') return;
    setDeleteCountdown(5);
    setIsDeleting(true);
    const interval = setInterval(() => {
      setDeleteCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsDeleting(false);
          setDeleteCountdown(0);
          setDeleteConfirmation('');
          toast({ title: 'Account deletion', description: 'This feature is not available in the demo.', variant: 'destructive' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [deleteConfirmation, toast]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
    }),
  };

  // Scope checklist data
  const requiredScopes = [
    { name: 'repo', desc: 'Full repository access', granted: githubInfo?.scopes?.includes('repo') ?? false },
    { name: 'workflow', desc: 'GitHub Actions access', granted: githubInfo?.scopes?.includes('workflow') ?? false },
    { name: 'read:org', desc: 'Read org membership', granted: githubInfo?.scopes?.includes('read:org') ?? false },
    { name: 'user:email', desc: 'Read email address', granted: githubInfo?.scopes?.includes('user:email') ?? false },
  ];

  // Security recommendations with icons
  const securityRecommendations = [
    { text: 'Token encrypted with AES-256-GCM', ok: true, icon: Lock },
    { text: 'Only masked hints shown in UI', ok: true, icon: Eye },
    { text: 'Tokens never logged or returned in API', ok: true, icon: Key },
    { text: 'All GitHub API calls server-side only', ok: true, icon: Fingerprint },
    { text: 'GitHub connected', ok: isGithubConnected, icon: Github },
    { text: 'All required scopes granted', ok: requiredScopes.every(s => s.granted), icon: Shield },
    { text: 'Token recently validated', ok: !!githubInfo?.validatedAt, icon: Scan },
  ];

  // Usage stats (mock)
  const usageStats = [
    { label: 'Projects', value: 3, icon: FolderKanban, color: '#58a6ff' },
    { label: 'Deployments', value: 12, icon: Rocket, color: '#3fb950' },
    { label: 'Messages', value: 47, icon: MessageSquare, color: '#e3b341' },
  ];

  // API usage bar chart data (mock daily)
  const dailyUsage = [
    { day: 'Mon', value: 12 },
    { day: 'Tue', value: 18 },
    { day: 'Wed', value: 8 },
    { day: 'Thu', value: 22 },
    { day: 'Fri', value: 15 },
    { day: 'Sat', value: 5 },
    { day: 'Sun', value: 3 },
  ];

  // Accent colors
  const accentColors = [
    { name: 'Blue', value: '#58a6ff' },
    { name: 'Green', value: '#3fb950' },
    { name: 'Purple', value: '#a371f7' },
    { name: 'Yellow', value: '#e3b341' },
    { name: 'Pink', value: '#f778ba' },
    { name: 'Red', value: '#f85149' },
  ];
  const [accentColor, setAccentColor] = useState('#58a6ff');

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-2xl font-bold"
        style={{ color: '#c9d1d9' }}
      >
        Settings
      </motion.h1>

      {/* ============ ENHANCED PROFILE CARD ============ */}
      <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
        <Card className="overflow-hidden" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          {/* Cover banner image area */}
          <div
            className="h-24 relative"
            style={{ background: 'linear-gradient(135deg, #58a6ff30, #3fb95020, #e3b34115, #a371f710)' }}
          >
            {/* Decorative orbs */}
            <div className="absolute top-2 right-8 w-20 h-20 rounded-full" style={{ background: 'radial-gradient(circle, #58a6ff15, transparent)' }} />
            <div className="absolute top-6 right-32 w-12 h-12 rounded-full" style={{ background: 'radial-gradient(circle, #3fb95012, transparent)' }} />
            <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full" style={{ background: 'radial-gradient(circle, #e3b34110, transparent)' }} />
          </div>

          <CardContent className="pt-0 pb-6 px-6">
            {user ? (
              <>
                {/* Profile section with bigger avatar + animated gradient ring */}
                <div className="flex items-end gap-5 -mt-10 mb-5">
                  <div className="relative shrink-0">
                    {/* Animated gradient ring around avatar */}
                    <motion.div
                      className="rounded-full p-[3px]"
                      style={{ background: 'linear-gradient(135deg, #58a6ff, #3fb950, #e3b341, #f85149)' }}
                      animate={{
                        background: [
                          'linear-gradient(135deg, #58a6ff, #3fb950, #e3b341, #f85149)',
                          'linear-gradient(225deg, #f85149, #e3b341, #3fb950, #58a6ff)',
                          'linear-gradient(315deg, #3fb950, #58a6ff, #f85149, #e3b341)',
                          'linear-gradient(135deg, #58a6ff, #3fb950, #e3b341, #f85149)',
                        ],
                      }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    >
                      <Avatar className="w-20 h-20 border-4" style={{ borderColor: '#161b22' }}>
                        <AvatarImage src={githubUser?.avatar_url} alt={user.name || user.email} />
                        <AvatarFallback
                          className="text-2xl font-bold"
                          style={{ backgroundColor: '#0d1117', color: '#c9d1d9' }}
                        >
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    {/* Account Status indicator */}
                    <span className="absolute bottom-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#3fb950', borderWidth: '3px', borderColor: '#161b22' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'white' }} />
                    </span>
                    {/* Edit profile button */}
                    <button
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      style={{ backgroundColor: '#30363d', color: '#c9d1d9', border: '2px solid #161b22' }}
                      onClick={() => toast({ title: 'Edit Profile', description: 'Profile editor opened. Update your name and email in the form.' })}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 pb-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold" style={{ color: '#c9d1d9' }}>
                        {user.name || 'User'}
                      </p>
                      {/* Account Status */}
                      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#3fb95015', color: '#3fb950', border: '1px solid #3fb95025' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3fb950' }} /> Active
                      </span>
                      {/* Plan badge with upgrade link */}
                      <Badge
                        className="text-xs gap-1 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{
                          borderColor: '#e3b341',
                          color: '#e3b341',
                          background: 'rgba(227,179,65,0.1)',
                        }}
                        onClick={() => toast({ title: 'PRO Plan', description: 'You already have PRO! Enjoy unlimited AI requests, priority support, and advanced features.' })}
                      >
                        <Crown className="w-3 h-3" /> {user.plan}
                      </Badge>
                      <a
                        className="text-[10px] flex items-center gap-0.5 cursor-pointer hover:underline"
                        style={{ color: '#58a6ff' }}
                        onClick={() => toast({ title: 'Upgrade', description: 'Unlock unlimited requests, priority support, and more!' })}
                      >
                        Upgrade <ArrowUpRight className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="w-3 h-3" style={{ color: '#8b949e' }} />
                      <span className="text-xs" style={{ color: '#8b949e' }}>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3 h-3" style={{ color: '#8b949e' }} />
                      <span className="text-xs" style={{ color: '#8b949e' }}>
                        Member since January 2025
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Preferences */}
                <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                  <p className="text-xs font-medium mb-2.5 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                    <Mail className="w-3 h-3" style={{ color: '#8b949e' }} /> Email Preferences
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px]" style={{ color: '#c9d1d9' }}>Email notifications</p>
                        <p className="text-[9px]" style={{ color: '#484f58' }}>Receive important updates via email</p>
                      </div>
                      <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px]" style={{ color: '#c9d1d9' }}>Weekly digest</p>
                        <p className="text-[9px]" style={{ color: '#484f58' }}>Summary of activity each week</p>
                      </div>
                      <Switch checked={emailWeekly} onCheckedChange={setEmailWeekly} />
                    </div>
                  </div>
                </div>

                {/* Notification Preferences (inline) */}
                <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                  <p className="text-xs font-medium mb-2.5 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                    <Bell className="w-3 h-3" style={{ color: '#8b949e' }} /> Notification Preferences
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Deploy', state: notifDeploy, setter: setNotifDeploy, icon: Rocket, color: '#3fb950' },
                      { label: 'Build', state: notifBuild, setter: setNotifBuild, icon: Zap, color: '#e3b341' },
                      { label: 'Schedule', state: notifSchedule, setter: setNotifSchedule, icon: Clock, color: '#58a6ff' },
                      { label: 'Workflow', state: notifWorkflow, setter: setNotifWorkflow, icon: Workflow, color: '#a371f7' },
                    ].map((pref, i) => (
                      <div key={i} className="flex items-center justify-between px-2.5 py-2 rounded-lg" style={{ backgroundColor: '#161b22' }}>
                        <div className="flex items-center gap-1.5">
                          <pref.icon className="w-3 h-3" style={{ color: pref.color }} />
                          <span className="text-[11px]" style={{ color: '#c9d1d9' }}>{pref.label}</span>
                        </div>
                        <Switch checked={pref.state} onCheckedChange={pref.setter} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Usage Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {usageStats.map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                      className="p-4 rounded-xl text-center transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
                      style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = `${stat.color}40`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#21262d';
                      }}
                    >
                      <div className="mx-auto mb-2 w-fit p-1.5 rounded-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: `${stat.color}15` }}>
                        <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                      </div>
                      <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="text-[9px] uppercase font-semibold tracking-wider mt-0.5" style={{ color: '#484f58' }}>{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <UserIcon className="w-10 h-10 mx-auto mb-2" style={{ color: '#30363d' }} />
                <p className="text-sm" style={{ color: '#8b949e' }}>Not logged in</p>
                <Button
                  size="sm"
                  className="mt-3 gap-1"
                  style={{ backgroundColor: '#238636', color: 'white' }}
                  onClick={() => setCurrentView('onboarding')}
                >
                  Get Started
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============ API USAGE SECTION ============ */}
      <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
        <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#8b949e' }}>
                <BarChart3 className="w-4 h-4" style={{ color: '#58a6ff' }} /> API Usage
              </CardTitle>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#58a6ff15', color: '#58a6ff', border: '1px solid #58a6ff25' }}>
                {apiUsage.period}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <CircularUsageMeter used={apiUsage.used} total={apiUsage.total} />
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-medium mb-3" style={{ color: '#c9d1d9' }}>Usage by Category</p>
                  <div className="space-y-3">
                    {apiUsage.categories.map((cat) => (
                      <div key={cat.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium" style={{ color: '#8b949e' }}>{cat.name}</span>
                          <span className="text-[11px] font-mono font-medium" style={{ color: cat.color }}>{cat.value} requests</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#21262d' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: cat.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(cat.value / apiUsage.total) * 100}%` }}
                            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                  <span className="text-[11px]" style={{ color: '#8b949e' }}>Remaining this month</span>
                  <span className="text-sm font-bold font-mono" style={{ color: apiUsage.total - apiUsage.used <= 20 ? '#e3b341' : '#3fb950' }}>
                    {apiUsage.total - apiUsage.used}
                  </span>
                </div>
                <Button
                  className="w-full gap-1.5 text-xs"
                  style={{
                    background: 'linear-gradient(135deg, #58a6ff, #238636)',
                    color: 'white',
                    boxShadow: '0 0 15px rgba(88,166,255,0.2)',
                  }}
                  onClick={() => toast({ title: 'Upgrade Plan', description: 'Unlock unlimited API requests, priority support, and more!' })}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Upgrade for More Requests
                  <ArrowUpRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============ GITHUB CONNECTION ENHANCED ============ */}
      <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
        <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#8b949e' }}>
                <Github className="w-4 h-4" /> GitHub Connection
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  {isGithubConnected && (
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: '#3fb950' }}
                    />
                  )}
                  <span
                    className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ backgroundColor: isGithubConnected ? '#3fb950' : '#f85149' }}
                  />
                </span>
                <span className="text-[10px] font-medium" style={{ color: isGithubConnected ? '#3fb950' : '#f85149' }}>
                  {isGithubConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGithubConnected && githubInfo ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#3fb95015' }}>
                    <CheckCircle className="w-6 h-6" style={{ color: '#3fb950' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#3fb950' }}>Connected</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8b949e' }}>
                      {githubUser?.login && `@${githubUser.login}`}
                      {githubInfo.tokenHint && ` · Token: ${githubInfo.tokenHint}`}
                    </p>
                  </div>
                </div>

                {/* Visual Connection Flow Diagram */}
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#30363d' }}>
                    <Github className="w-3.5 h-3.5" style={{ color: '#c9d1d9' }} />
                    <span className="text-[10px] font-medium" style={{ color: '#c9d1d9' }}>GitHub</span>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: '#3fb950' }} />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#58a6ff15', border: '1px solid #58a6ff25' }}>
                    <Zap className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} />
                    <span className="text-[10px] font-medium" style={{ color: '#58a6ff' }}>GitDeploy</span>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: '#3fb950' }} />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#3fb95015', border: '1px solid #3fb95025' }}>
                    <Globe className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />
                    <span className="text-[10px] font-medium" style={{ color: '#3fb950' }}>Hosting</span>
                  </div>
                </div>

                {/* Last Sync + Sync Status */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                    <p className="text-[9px] uppercase font-semibold" style={{ color: '#484f58' }}>Last Sync</p>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: '#8b949e' }}>
                      {githubInfo.validatedAt ? new Date(githubInfo.validatedAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                    <p className="text-[9px] uppercase font-semibold" style={{ color: '#484f58' }}>Sync Status</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <RefreshCw className="w-3 h-3" style={{ color: '#3fb950' }} />
                      <span className="text-[11px]" style={{ color: '#3fb950' }}>Up to date</span>
                    </div>
                  </div>
                </div>

                {/* Repository count */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                  <span className="text-[11px]" style={{ color: '#8b949e' }}>Repositories</span>
                  <span className="text-[11px] font-mono font-medium" style={{ color: '#58a6ff' }}>5 repos</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                  <span className="text-[11px]" style={{ color: '#8b949e' }}>Most Active</span>
                  <span className="text-[11px] font-mono font-medium" style={{ color: '#e3b341' }}>my-nextjs-app</span>
                </div>

                {/* Token Validation Progress Bar */}
                {(testingConnection || connectionTestResult !== 'idle') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium" style={{ color: '#8b949e' }}>Token Validation</span>
                      <span className="text-[10px] font-mono" style={{ color: connectionTestResult === 'success' ? '#3fb950' : connectionTestResult === 'fail' ? '#f85149' : '#58a6ff' }}>
                        {connectionTestResult === 'success' ? '✓ Valid' : connectionTestResult === 'fail' ? '✗ Failed' : `${tokenValidationProgress}%`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#21262d' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: connectionTestResult === 'success' ? '#3fb950' : connectionTestResult === 'fail' ? '#f85149' : '#58a6ff' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${tokenValidationProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Scope Checklist */}
                <div className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>Token Scopes</p>
                  <div className="space-y-1.5">
                    {requiredScopes.map((scope) => (
                      <div key={scope.name} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md" style={{ backgroundColor: '#0d1117' }}>
                        {scope.granted ? (
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#3fb950' }} />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f85149' }} />
                        )}
                        <code className="text-[10px] font-mono" style={{ color: scope.granted ? '#3fb950' : '#f85149' }}>
                          {scope.name}
                        </code>
                        <span className="text-[10px] ml-auto" style={{ color: '#484f58' }}>{scope.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    style={{ borderColor: '#30363d', color: '#58a6ff' }}
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                  >
                    <TestTube className="w-3.5 h-3.5" />
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    style={{ borderColor: '#30363d', color: '#8b949e' }}
                    onClick={() => setCurrentView('onboarding')}
                  >
                    Reconnect Token
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 ml-auto"
                    style={{ borderColor: '#f8514950', color: '#f85149' }}
                    onClick={handleDisconnect}
                  >
                    <Unplug className="w-3.5 h-3.5" /> Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#f8514915' }}>
                  <AlertCircle className="w-6 h-6" style={{ color: '#f85149' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#f85149' }}>Not Connected</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8b949e' }}>
                    Connect your GitHub token to enable deployments
                  </p>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5"
                  style={{ backgroundColor: '#238636', color: 'white' }}
                  onClick={() => setCurrentView('onboarding')}
                >
                  <Github className="w-3.5 h-3.5" /> Connect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============ ENHANCED SECURITY CARD ============ */}
      <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
        <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#8b949e' }}>
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <ShieldCheck className="w-4 h-4" style={{ color: securityScore >= 80 ? '#3fb950' : securityScore >= 50 ? '#e3b341' : '#f85149' }} />
                </motion.div>
                Security Score
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px]"
                style={{
                  borderColor: securityScore >= 80 ? '#3fb950' : securityScore >= 50 ? '#e3b341' : '#f85149',
                  color: securityScore >= 80 ? '#3fb950' : securityScore >= 50 ? '#e3b341' : '#f85149',
                }}
              >
                {securityScore >= 80 ? 'Strong' : securityScore >= 50 ? 'Fair' : 'Needs Attention'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-6">
              <SecurityScoreRing score={securityScore} />
              <div className="flex-1 space-y-2.5">
                {securityRecommendations.map((rec, i) => {
                  const Icon = rec.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-[#0d1117]"
                    >
                      {rec.ok ? (
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#3fb950' }} />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: '#e3b341' }} />
                      )}
                      <span className="text-[11px]" style={{ color: rec.ok ? '#8b949e' : '#e3b341' }}>{rec.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 w-full"
              style={{ borderColor: '#30363d', color: '#58a6ff' }}
              onClick={handleSecurityAudit}
            >
              <Shield className="w-3.5 h-3.5" /> Run Security Audit
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============ API CONFIGURATION ============ */}
      <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
        <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#8b949e' }}>
              <Key className="w-4 h-4" style={{ color: '#58a6ff' }} /> API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* API Key Management */}
            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-2" style={{ color: '#c9d1d9' }}>
                <Key className="w-3 h-3" style={{ color: '#8b949e' }} /> API Key
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={showApiKey ? apiKey : apiKey.replace(/./g, '•').slice(0, 24)}
                    readOnly
                    className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] font-mono text-xs pr-10"
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#30363d] transition-colors"
                    style={{ color: '#8b949e' }}
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? 'Hide' : 'Show'}
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 shrink-0"
                  style={{ borderColor: '#30363d', color: '#58a6ff' }}
                  onClick={handleCopyApiKey}
                >
                  {apiKeyCopied ? <Check className="w-3 h-3" style={{ color: '#3fb950' }} /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 shrink-0"
                  style={{ borderColor: '#30363d', color: '#3fb950' }}
                  onClick={handleGenerateApiKey}
                >
                  <RefreshCw className="w-3 h-3" /> Generate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 shrink-0"
                  style={{ borderColor: '#f8514950', color: '#f85149' }}
                  onClick={handleRevokeApiKey}
                >
                  Revoke
                </Button>
              </div>
            </div>

            {/* Webhook URL */}
            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-2" style={{ color: '#c9d1d9' }}>
                <Webhook className="w-3 h-3" style={{ color: '#8b949e' }} /> Webhook URL
              </Label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] font-mono text-xs"
                placeholder="https://api.example.com/webhook"
              />
            </div>

            {/* Rate Limit Display */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4" style={{ color: '#e3b341' }} />
                <div>
                  <p className="text-[11px] font-medium" style={{ color: '#c9d1d9' }}>Rate Limit</p>
                  <p className="text-[9px]" style={{ color: '#484f58' }}>100 requests per minute</p>
                </div>
              </div>
              <span className="text-[10px] font-mono" style={{ color: '#3fb950' }}>73/min remaining</span>
            </div>

            {/* Usage Statistics Bar Chart */}
            <div>
              <p className="text-xs font-medium mb-2.5 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <BarChart3 className="w-3 h-3" style={{ color: '#8b949e' }} /> Usage This Week
              </p>
              <div className="flex items-end gap-1.5 h-20 px-1">
                {dailyUsage.map((d, i) => {
                  const maxVal = Math.max(...dailyUsage.map(x => x.value));
                  const heightPct = (d.value / maxVal) * 100;
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        className="w-full rounded-t"
                        style={{ backgroundColor: '#58a6ff', minHeight: 2 }}
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                      />
                      <span className="text-[8px]" style={{ color: '#484f58' }}>{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============ APPEARANCE & PREFERENCES ============ */}
      <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
        <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#8b949e' }}>
              <Palette className="w-4 h-4" style={{ color: '#a371f7' }} /> Appearance & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Theme Selector */}
            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-2" style={{ color: '#c9d1d9' }}>
                <Monitor className="w-3 h-3" style={{ color: '#8b949e' }} /> Theme
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'dark' as const, label: 'Dark', icon: Moon, preview: '#0d1117' },
                  { value: 'light' as const, label: 'Light', icon: Sun, preview: '#ffffff' },
                  { value: 'system' as const, label: 'System', icon: Monitor, preview: 'linear-gradient(135deg, #0d1117 50%, #ffffff 50%)' },
                ].map((t) => (
                  <button
                    key={t.value}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200"
                    style={{
                      borderColor: theme === t.value ? '#58a6ff' : '#21262d',
                      backgroundColor: theme === t.value ? '#58a6ff08' : '#0d1117',
                    }}
                    onClick={() => setTheme(t.value)}
                  >
                    <div
                      className="w-10 h-7 rounded-md border"
                      style={{
                        background: t.preview,
                        borderColor: '#30363d',
                      }}
                    />
                    <div className="flex items-center gap-1">
                      <t.icon className="w-3 h-3" style={{ color: theme === t.value ? '#58a6ff' : '#8b949e' }} />
                      <span className="text-[10px] font-medium" style={{ color: theme === t.value ? '#58a6ff' : '#8b949e' }}>{t.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-2" style={{ color: '#c9d1d9' }}>
                <Type className="w-3 h-3" style={{ color: '#8b949e' }} /> Font Size
              </Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d]">
                  <SelectItem value="small" className="text-xs text-[#c9d1d9]">Small (12px)</SelectItem>
                  <SelectItem value="medium" className="text-xs text-[#c9d1d9]">Medium (14px)</SelectItem>
                  <SelectItem value="large" className="text-xs text-[#c9d1d9]">Large (16px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator style={{ backgroundColor: '#21262d' }} />

            {/* Compact Mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>Compact Mode</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>Reduce spacing and show more content</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>

            {/* Sidebar Position */}
            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-2" style={{ color: '#c9d1d9' }}>
                <SidebarOpen className="w-3 h-3" style={{ color: '#8b949e' }} /> Sidebar Position
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(['left', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all duration-200"
                    style={{
                      borderColor: sidebarPosition === pos ? '#58a6ff' : '#21262d',
                      backgroundColor: sidebarPosition === pos ? '#58a6ff08' : '#0d1117',
                      color: sidebarPosition === pos ? '#58a6ff' : '#8b949e',
                    }}
                    onClick={() => setSidebarPosition(pos)}
                  >
                    <ChevronRight className={`w-3 h-3 ${pos === 'right' ? 'rotate-180' : ''}`} />
                    <span className="text-[11px] font-medium capitalize">{pos}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color Picker */}
            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-2" style={{ color: '#c9d1d9' }}>
                <Palette className="w-3 h-3" style={{ color: '#8b949e' }} /> Accent Color
              </Label>
              <div className="flex items-center gap-2">
                {accentColors.map((c) => (
                  <button
                    key={c.name}
                    className="w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110"
                    style={{
                      backgroundColor: c.value,
                      borderColor: accentColor === c.value ? 'white' : 'transparent',
                      boxShadow: accentColor === c.value ? `0 0 10px ${c.value}50` : 'none',
                    }}
                    onClick={() => setAccentColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============ PROJECT DEFAULTS ============ */}
      <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible">
        <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#8b949e' }}>
              <LayoutGrid className="w-4 h-4" style={{ color: '#3fb950' }} /> Project Defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Default Framework */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <Code className="w-3 h-3" style={{ color: '#8b949e' }} /> Default Framework
              </Label>
              <Select value={defaultFramework} onValueChange={setDefaultFramework}>
                <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d]">
                  <SelectItem value="nextjs" className="text-xs text-[#c9d1d9]">Next.js</SelectItem>
                  <SelectItem value="react" className="text-xs text-[#c9d1d9]">React (Vite)</SelectItem>
                  <SelectItem value="express" className="text-xs text-[#c9d1d9]">Express.js</SelectItem>
                  <SelectItem value="fastapi" className="text-xs text-[#c9d1d9]">FastAPI</SelectItem>
                  <SelectItem value="flask" className="text-xs text-[#c9d1d9]">Flask</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default Branch */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <GitBranch className="w-3 h-3" style={{ color: '#8b949e' }} /> Default Branch Name
              </Label>
              <Input
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] font-mono text-xs"
                placeholder="main"
              />
            </div>

            <Separator style={{ backgroundColor: '#21262d' }} />

            {/* Auto-Deploy Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>Auto-deploy on push</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>Automatically deploy when changes are pushed to GitHub</p>
              </div>
              <Switch checked={autoDeploy} onCheckedChange={setAutoDeploy} />
            </div>

            {/* Default Hosting Platform */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <Globe className="w-3 h-3" style={{ color: '#8b949e' }} /> Default Hosting Platform
              </Label>
              <Select defaultValue="vercel">
                <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d]">
                  <SelectItem value="vercel" className="text-xs text-[#c9d1d9]">Vercel</SelectItem>
                  <SelectItem value="netlify" className="text-xs text-[#c9d1d9]">Netlify</SelectItem>
                  <SelectItem value="railway" className="text-xs text-[#c9d1d9]">Railway</SelectItem>
                  <SelectItem value="render" className="text-xs text-[#c9d1d9]">Render</SelectItem>
                  <SelectItem value="flyio" className="text-xs text-[#c9d1d9]">Fly.io</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Build Command Template */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <Terminal className="w-3 h-3" style={{ color: '#8b949e' }} /> Build Command Template
              </Label>
              <Input
                defaultValue="npm run build"
                className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] font-mono text-xs"
                placeholder="npm run build"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============ CODE REVIEW ASSISTANT ============ */}
      <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible">
        <CodeReviewAssistant />
      </motion.div>

      {/* ============ ENHANCED DANGER ZONE ============ */}
      <motion.div custom={8} variants={cardVariants} initial="hidden" animate="visible">
        <Card className="overflow-hidden" style={{ backgroundColor: '#161b22', borderColor: '#f8514950' }}>
          {/* Red gradient top border */}
          <div
            className="h-1.5 relative"
            style={{ background: 'linear-gradient(90deg, #f85149, #da3633, #b62324, #da3633, #f85149)' }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#f85149' }}>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              >
                <AlertTriangle className="w-4 h-4" />
              </motion.div>
              Danger Zone
            </CardTitle>
            <p className="text-[10px] mt-1" style={{ color: '#8b949e' }}>
              These actions are irreversible. Please proceed with caution.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Export Data button */}
            <div
              className="flex items-center justify-between p-4 rounded-xl transition-all duration-200"
              style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}
            >
              <div>
                <p className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>Export Data</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>Download all your data before taking destructive actions</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 shrink-0"
                style={{ borderColor: '#30363d', color: '#58a6ff' }}
                onClick={handleExportData}
              >
                <Download className="w-3 h-3" /> Export
              </Button>
            </div>

            {/* Delete Account - 2-step confirmation */}
            <div
              className="p-4 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: '#0d1117',
                border: '1px solid #f8514920',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#f8514950';
                (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #f8514908, #0d1117)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#f8514920';
                (e.currentTarget as HTMLElement).style.background = '#0d1117';
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>Delete Account</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>Permanently delete your account and all associated data</p>
                </div>
              </div>
              {/* 2-step confirmation input */}
              <div className="space-y-2">
                <p className="text-[10px]" style={{ color: '#f85149' }}>
                  Type <strong>DELETE</strong> to confirm:
                </p>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="bg-[#161b22] border-[#f8514930] text-[#c9d1d9] text-xs font-mono"
                />
                {deleteConfirmation === 'DELETE' && !isDeleting && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 w-full"
                    style={{ borderColor: '#f85149', color: '#f85149', backgroundColor: '#f8514910' }}
                    onClick={startDeleteCountdown}
                  >
                    <Trash2 className="w-3 h-3" /> Delete Account
                  </Button>
                )}
                {isDeleting && (
                  <div className="space-y-2">
                    {/* Progress indicator */}
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#21262d' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: '#f85149' }}
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: deleteCountdown, ease: 'linear' }}
                      />
                    </div>
                    {/* Countdown timer */}
                    <div className="flex items-center justify-center gap-2 py-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: '#f85149' }} />
                      <span className="text-sm font-bold" style={{ color: '#f85149' }}>
                        Deleting in {deleteCountdown}s...
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      style={{ borderColor: '#30363d', color: '#8b949e' }}
                      onClick={() => {
                        setIsDeleting(false);
                        setDeleteCountdown(0);
                        setDeleteConfirmation('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Delete All Data */}
            <div
              className="flex items-center justify-between p-4 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: '#0d1117',
                border: '1px solid #f8514920',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#f8514950';
                (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #f8514908, #0d1117)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#f8514920';
                (e.currentTarget as HTMLElement).style.background = '#0d1117';
              }}
            >
              <div>
                <p className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>Delete All Data</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>Remove all projects, deployments, and files from GitDeploy AI</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 shrink-0"
                    style={{ borderColor: '#f85149', color: '#f85149' }}
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ backgroundColor: '#161b22', borderColor: '#f85149' }}>
                  <AlertDialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-5 h-5" style={{ color: '#f85149' }} />
                      <AlertDialogTitle style={{ color: '#c9d1d9' }}>Delete All Data</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription style={{ color: '#8b949e' }}>
                      This will remove all projects, deployments, and files from GitDeploy AI. Your GitHub repositories will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel style={{ color: '#8b949e' }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      style={{ backgroundColor: '#f85149', color: 'white' }}
                      onClick={handleDeleteAllData}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete All Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
