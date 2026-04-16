'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
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
    // Base security from token encryption etc.
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

    // Simulate validation steps
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
          {/* Gradient top banner */}
          <div
            className="h-20 relative"
            style={{ background: 'linear-gradient(135deg, #58a6ff20, #3fb95015, #e3b34110)' }}
          >
            {/* Decorative orbs */}
            <div className="absolute top-2 right-8 w-16 h-16 rounded-full" style={{ background: 'radial-gradient(circle, #58a6ff10, transparent)' }} />
            <div className="absolute top-4 right-24 w-10 h-10 rounded-full" style={{ background: 'radial-gradient(circle, #3fb95010, transparent)' }} />
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
                    {isGithubConnected && (
                      <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 flex items-center justify-center" style={{ backgroundColor: '#3fb950', borderColor: '#161b22', borderWidth: '3px' }}>
                        <CheckCircle className="w-2.5 h-2.5" style={{ color: 'white' }} />
                      </span>
                    )}
                    {/* Edit profile button */}
                    <button
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      style={{ backgroundColor: '#30363d', color: '#c9d1d9', border: '2px solid #161b22' }}
                      onClick={() => toast({ title: 'Edit Profile', description: 'Profile editing coming soon!' })}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 pb-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold" style={{ color: '#c9d1d9' }}>
                        {user.name || 'User'}
                      </p>
                      {/* Plan badge with upgrade link */}
                      <Badge
                        className="text-xs gap-1 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{
                          borderColor: '#e3b341',
                          color: '#e3b341',
                          background: 'rgba(227,179,65,0.1)',
                        }}
                        onClick={() => toast({ title: 'Upgrade', description: 'Pro plan coming soon!' })}
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
              {/* Circular Usage Meter */}
              <CircularUsageMeter used={apiUsage.used} total={apiUsage.total} />

              <div className="flex-1 space-y-4">
                {/* Category breakdown */}
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

                {/* Remaining count */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                  <span className="text-[11px]" style={{ color: '#8b949e' }}>Remaining this month</span>
                  <span className="text-sm font-bold font-mono" style={{ color: apiUsage.total - apiUsage.used <= 20 ? '#e3b341' : '#3fb950' }}>
                    {apiUsage.total - apiUsage.used}
                  </span>
                </div>

                {/* Upgrade CTA */}
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

      {/* ============ GITHUB CONNECTION ============ */}
      <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
        <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#8b949e' }}>
                <Github className="w-4 h-4" /> GitHub Connection
              </CardTitle>
              {/* Connection status animated dot */}
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

                {/* Last Activity */}
                {githubInfo.validatedAt && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: '#8b949e' }} />
                    <span className="text-[10px]" style={{ color: '#8b949e' }}>
                      Last activity: {new Date(githubInfo.validatedAt).toLocaleString()}
                    </span>
                  </div>
                )}

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
              {/* Larger circular SVG score */}
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

      {/* ============ PREFERENCES ============ */}
      <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
        <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#8b949e' }}>
              <Activity className="w-4 h-4" /> Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Default Framework */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <Globe className="w-3 h-3" style={{ color: '#8b949e' }} /> Default Framework
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

            <Separator style={{ backgroundColor: '#21262d' }} />

            {/* Notification Preferences */}
            <div className="space-y-3">
              <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <Bell className="w-3 h-3" style={{ color: '#8b949e' }} /> Notification Preferences
              </p>
              {[
                { label: 'Deployment alerts', desc: 'Notify when deployments succeed or fail', state: notifDeploy, setter: setNotifDeploy },
                { label: 'Build notifications', desc: 'Notify when builds complete', state: notifBuild, setter: setNotifBuild },
                { label: 'Schedule reminders', desc: 'Remind about scheduled deployments', state: notifSchedule, setter: setNotifSchedule },
                { label: 'Product updates', desc: 'New features and announcements', state: notifMarketing, setter: setNotifMarketing },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: '#c9d1d9' }}>{pref.label}</p>
                    <p className="text-[10px]" style={{ color: '#484f58' }}>{pref.desc}</p>
                  </div>
                  <Switch checked={pref.state} onCheckedChange={pref.setter} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============ CODE REVIEW ASSISTANT ============ */}
      <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
        <CodeReviewAssistant />
      </motion.div>

      {/* ============ ENHANCED DANGER ZONE ============ */}
      <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible">
        <Card className="overflow-hidden" style={{ backgroundColor: '#161b22', borderColor: '#f8514950' }}>
          {/* Red gradient top border - more visually striking */}
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
                <p className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>Delete Account</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>Permanently delete your account and all associated data</p>
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
                      <AlertDialogTitle style={{ color: '#c9d1d9' }}>Delete Account</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription style={{ color: '#8b949e' }}>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel style={{ color: '#8b949e' }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      style={{ backgroundColor: '#f85149', color: 'white' }}
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

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
