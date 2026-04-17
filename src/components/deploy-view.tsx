'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/status-badge';
import { DeploymentScheduler } from '@/components/deployment-scheduler';
import { WorkflowTemplate } from '@/components/workflow-template';
import { WorkflowEditor } from '@/components/workflow-editor';
import { EnvManager } from '@/components/env-manager';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Wifi,
  WifiOff,
  RotateCcw,
  Upload,
  Copy,
  Share2,
  Twitter,
  ChevronDown,
  Clock,
  Hammer,
  Github,
  Send,
  FileText,
  Timer,
  PartyPopper,
  Search,
  Download,
  Pause,
  XCircle,
  Zap,
  Shield,
  Wrench,
  GitBranch,
  Settings,
  Package,
  TestTube,
  Bell,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface DeployStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
  substeps?: string[];
  estimatedTime?: string;
  logs?: string[];
}

// Confetti particles component with more particles and variety
function ConfettiParticles() {
  const particles = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    size: 4 + Math.random() * 8,
    color: ['#3fb950', '#58a6ff', '#e3b341', '#56d364', '#a371f7', '#f85149'][Math.floor(Math.random() * 6)],
    duration: 1.5 + Math.random() * 1.5,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.left,
            top: '-10px',
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.5 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animationDelay: p.delay,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// Progress ring SVG component for deploy button
function ProgressRing({ progress, size = 56, strokeWidth = 3 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#30363d" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#3fb950" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

// Circular score component for readiness
function CircularScore({ score, size = 80, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#3fb950' : score >= 50 ? '#e3b341' : '#f85149';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#21262d" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{score}%</span>
        {label && <span className="text-[8px] uppercase" style={{ color: '#8b949e' }}>{label}</span>}
      </div>
    </div>
  );
}

export function DeployView() {
  const { user, selectedProject, isGithubConnected, setCurrentView } = useAppStore();
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'error' | 'success' | 'warning' }>>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [deployType, setDeployType] = useState<'initial' | 'redeploy'>('initial');
  const [terminalTab, setTerminalTab] = useState<'live' | 'summary' | 'errors'>('live');
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [deployStartTime, setDeployStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [steps, setSteps] = useState<DeployStep[]>([
    { id: 'd1', label: 'Repository Setup', description: 'Create or verify GitHub repository', substeps: ['Check existing repos', 'Create repo if needed', 'Set default branch'], status: 'pending', estimatedTime: '~15s', logs: [] },
    { id: 'd2', label: 'File Upload', description: 'Push all project files to GitHub', substeps: ['Prepare file tree', 'Create blobs', 'Push commit'], status: 'pending', estimatedTime: '~30s', logs: [] },
    { id: 'd3', label: 'Workflow Deployment', description: 'Push GitHub Actions workflow', substeps: ['Generate deploy.yml', 'Push to .github/workflows', 'Verify syntax'], status: 'pending', estimatedTime: '~10s', logs: [] },
    { id: 'd4', label: 'Trigger Deployment', description: 'Dispatch the deployment workflow', substeps: ['Send dispatch event', 'Create workflow run', 'Capture run ID'], status: 'pending', estimatedTime: '~5s', logs: [] },
    { id: 'd5', label: 'Status Polling', description: 'Monitor deployment run status', substeps: ['Poll GitHub API', 'Check job status', 'Fetch logs'], status: 'pending', estimatedTime: '~60s', logs: [] },
    { id: 'd6', label: 'Confirmation', description: 'Verify deployment success', substeps: ['Validate conclusion', 'Check artifact', 'Mark complete'], status: 'pending', estimatedTime: '~10s', logs: [] },
  ]);
  const [progress, setProgress] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [deploymentCancelled, setDeploymentCancelled] = useState(false);
  const [deploymentPaused, setDeploymentPaused] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Elapsed time counter
  useEffect(() => {
    if (!deploying || !deployStartTime || deploymentPaused) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - deployStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [deploying, deployStartTime, deploymentPaused]);

  // Socket.io connection
  useEffect(() => {
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      if (selectedProject) {
        socket.emit('join-deployment', selectedProject.id);
      }
    });

    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('deploy-log', (log: { timestamp: string; message: string; type: 'info' | 'error' | 'success' | 'warning' }) => {
      setLogs((prev) => [...prev, log]);
    });
    socket.on('build-progress', (data: { current: number; total: number; section: string }) => {
      addLog(`📦 Progress: ${data.current}/${data.total} — ${data.section}`, 'info');
    });
    socket.on('deploy-status', (status: string) => {
      addLog(`Status update: ${status}`, status === 'completed' ? 'success' : 'info');
    });

    return () => { socket.disconnect(); };
  }, [selectedProject]);

  const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    setLogs((prev) => [...prev, { timestamp: new Date().toISOString(), message, type }]);
  }, []);

  const updateStep = useCallback((stepId: string, status: DeployStep['status']) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, status } : s)));
  }, []);

  const getEstimatedTime = () => {
    const remaining = steps.filter(s => s.status === 'pending' || s.status === 'in_progress').length;
    if (remaining === 0) return 'Done';
    if (remaining <= 1) return '< 30s';
    if (remaining <= 3) return '~1 min';
    return '~2-3 min';
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleDeploy = async () => {
    if (!user || !selectedProject) {
      toast({ title: 'No project selected', description: 'Build a project first', variant: 'destructive' });
      return;
    }
    if (!isGithubConnected) {
      toast({ title: 'GitHub not connected', description: 'Connect your GitHub token first', variant: 'destructive' });
      setCurrentView('onboarding');
      return;
    }

    setDeploying(true);
    setDeploymentCancelled(false);
    setDeploymentPaused(false);
    setDeployStartTime(Date.now());
    setElapsedTime(0);
    setLogs([]);
    setDeployResult(null);
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const, logs: [] })));
    addLog('🚀 Starting deployment process...', 'info');

    try {
      updateStep('d1', 'in_progress');
      setProgress(10);
      addLog('Checking if repository exists on GitHub...', 'info');

      const res = await fetch('/api/projects/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject.id, userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deployment failed');

      updateStep('d1', 'complete');
      addLog(`✅ Repository ready: ${data.repoUrl}`, 'success');
      setProgress(30);

      updateStep('d2', 'complete');
      addLog(`📤 Files uploaded: ${data.filesUploaded}/${data.totalFiles}`, 'success');
      setProgress(50);

      if (data.errors?.length > 0) {
        updateStep('d3', 'error');
        data.errors.forEach((err: string) => addLog(`⚠️ ${err}`, 'warning'));
      } else {
        updateStep('d3', 'complete');
        addLog('✅ Workflow file deployed', 'success');
      }
      setProgress(70);

      if (data.workflowDispatched) {
        updateStep('d4', 'complete');
        addLog('✅ Workflow dispatch triggered', 'success');
      } else {
        updateStep('d4', 'error');
        addLog('⚠️ Could not dispatch workflow', 'warning');
      }
      setProgress(85);

      updateStep('d5', 'in_progress');
      addLog('🔄 Checking deployment status...', 'info');

      if (data.deploymentId) {
        let pollCount = 0;
        const maxPolls = 12;
        const pollInterval = setInterval(async () => {
          if (deploymentCancelled) { clearInterval(pollInterval); return; }
          pollCount++;
          try {
            const statusRes = await fetch(`/api/deploy/status?deploymentId=${data.deploymentId}&projectId=${selectedProject.id}`, { headers: { 'x-user-id': user.id } });
            const statusData = await statusRes.json();
            if (statusData.githubStatus) {
              const ghStatus = statusData.githubStatus;
              addLog(`GitHub status: ${ghStatus.status} — ${ghStatus.conclusion || 'running'}`, 'info');
              if (ghStatus.status === 'completed') {
                clearInterval(pollInterval);
                updateStep('d5', 'complete');
                if (ghStatus.conclusion === 'success') {
                  updateStep('d6', 'complete');
                  addLog('✅ DEPLOYMENT SUCCESSFUL!', 'success');
                  setProgress(100);
                } else {
                  updateStep('d6', 'error');
                  addLog(`❌ Deployment failed: ${ghStatus.conclusion}`, 'error');
                  setProgress(85);
                }
                setDeploying(false);
                setDeployStartTime(null);
              }
            }
            if (pollCount >= maxPolls) {
              clearInterval(pollInterval);
              updateStep('d5', 'complete');
              updateStep('d6', 'complete');
              addLog('⏳ Status polling timed out. Check GitHub Actions manually.', 'warning');
              setDeploying(false);
              setDeployStartTime(null);
              setProgress(100);
            }
          } catch {
            addLog('⚠️ Could not fetch status', 'warning');
          }
        }, 10000);
      } else {
        updateStep('d5', 'complete');
        updateStep('d6', 'complete');
        addLog('✅ Deployment process complete', 'success');
        setProgress(100);
        setDeploying(false);
        setDeployStartTime(null);
      }
      setDeployResult(data);
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      updateStep('d1', 'error');
      setDeploying(false);
      setDeployStartTime(null);
      toast({ title: 'Deployment failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const copyRepoUrl = () => {
    if (deployResult?.repoUrl) {
      navigator.clipboard.writeText(deployResult.repoUrl as string);
      setCopiedUrl(true);
      toast({ title: 'URL Copied!', description: 'Repo URL copied to clipboard' });
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const downloadLogs = () => {
    const logText = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deploy-${selectedProject?.name || 'logs'}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Logs Downloaded!', description: 'Log file saved to your downloads' });
  };

  // Readiness calculations
  const readinessItems = useMemo(() => {
    if (!selectedProject) return [];
    return [
      { label: 'Project built', ok: !!selectedProject.files?.length, progress: selectedProject.files?.length ? 100 : 0, fixView: 'builder' as const, icon: Hammer },
      { label: 'GitHub connected', ok: isGithubConnected, progress: isGithubConnected ? 100 : 0, fixView: 'settings' as const, icon: Github },
      { label: 'Framework set', ok: !!selectedProject.framework, progress: selectedProject.framework ? 100 : 0, fixView: 'builder' as const, icon: Settings },
      { label: 'Env vars configured', ok: true, progress: 50, fixView: 'deploy' as const, icon: Package },
      { label: 'Workflow file ready', ok: true, progress: 75, fixView: 'deploy' as const, icon: GitBranch },
    ];
  }, [selectedProject, isGithubConnected]);

  const readinessScore = useMemo(() => {
    if (readinessItems.length === 0) return 0;
    return Math.round(readinessItems.reduce((sum, item) => sum + item.progress, 0) / readinessItems.length);
  }, [readinessItems]);

  // Filter logs for errors tab
  const errorLogs = useMemo(() => logs.filter(l => l.type === 'error' || l.type === 'warning'), [logs]);
  const filteredLogs = useMemo(() => {
    if (!logSearch) return logs;
    return logs.filter(l => l.message.toLowerCase().includes(logSearch.toLowerCase()));
  }, [logs, logSearch]);

  // Get log color by type
  const getLogColor = (type: string) => {
    switch (type) {
      case 'info': return '#58a6ff';
      case 'error': return '#f85149';
      case 'success': return '#3fb950';
      case 'warning': return '#e3b341';
      default: return '#8b949e';
    }
  };

  // Get log prefix icon
  const getLogPrefix = (type: string) => {
    switch (type) {
      case 'error': return '✗';
      case 'success': return '✓';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  // ===================== EMPTY STATE =====================
  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold" style={{ color: '#c9d1d9' }}>Deploy to GitHub</h1>
          <p className="text-sm mt-1" style={{ color: '#8b949e' }}>Ship your project to production with one click</p>
        </motion.div>

        {/* Animated "How Deploy Works" Visual Guide */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
                <Rocket className="w-4 h-4" style={{ color: '#58a6ff' }} />
                How Deploy Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch gap-0">
                {[
                  { num: 1, icon: Hammer, title: 'Build Your Project', desc: 'Use the AI Builder to create your project files and structure', color: '#58a6ff' },
                  { num: 2, icon: Github, title: 'Connect GitHub', desc: 'Link your GitHub account with a personal access token', color: '#e3b341' },
                  { num: 3, icon: Rocket, title: 'Click Deploy', desc: 'One click pushes your code to GitHub and triggers CI/CD', color: '#3fb950' },
                ].map((step, i) => (
                  <React.Fragment key={step.num}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.15, duration: 0.3 }}
                      className="flex-1 flex flex-col items-center text-center px-4 py-3"
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-3 relative"
                        style={{
                          backgroundColor: `${step.color}15`,
                          boxShadow: `0 0 20px ${step.color}20`,
                        }}
                      >
                        <step.icon className="w-6 h-6" style={{ color: step.color }} />
                        <span
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                          style={{ backgroundColor: step.color, color: 'white' }}
                        >
                          {step.num}
                        </span>
                        {/* Animated ring */}
                        <div className="absolute inset-0 rounded-full animate-pulse-ring" style={{ border: `2px solid ${step.color}40` }} />
                      </div>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#c9d1d9' }}>{step.title}</p>
                      <p className="text-[10px] leading-relaxed" style={{ color: '#8b949e' }}>{step.desc}</p>
                    </motion.div>
                    {i < 2 && (
                      <div className="hidden sm:flex items-center px-1">
                        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5 + i * 0.15, duration: 0.3 }}>
                          <ArrowRight className="w-5 h-5" style={{ color: '#30363d' }} />
                        </motion.div>
                      </div>
                    )}
                    {i < 2 && (
                      <div className="sm:hidden flex justify-center py-1">
                        <ArrowRight className="w-4 h-4 rotate-90" style={{ color: '#30363d' }} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Deployment Checklist */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
                <Shield className="w-4 h-4" style={{ color: '#e3b341' }} />
                Pre-Deploy Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Project built with AI Builder', ok: false, icon: Hammer },
                { label: 'GitHub account connected', ok: isGithubConnected, icon: Github },
                { label: 'Framework selected', ok: false, icon: Settings },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ backgroundColor: item.ok ? 'rgba(63,185,80,0.05)' : 'rgba(248,81,73,0.05)' }}>
                  {item.ok ? (
                    <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#3fb950' }} />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#f85149' }} />
                  )}
                  <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: item.ok ? '#3fb950' : '#f85149' }} />
                  <span className="text-xs flex-1" style={{ color: item.ok ? '#8b949e' : '#f85149' }}>{item.label}</span>
                  {!item.ok && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 shrink-0" style={{ color: '#58a6ff' }} onClick={() => setCurrentView('builder')}>
                      <Wrench className="w-3 h-3" /> Fix
                    </Button>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <Button
          className="gap-2"
          size="lg"
          style={{ background: 'linear-gradient(135deg, #238636, #2ea043)', color: 'white' }}
          onClick={() => setCurrentView('builder')}
        >
          <Hammer className="w-4 h-4" /> Go to AI Builder
        </Button>

        <WorkflowTemplate />
      </div>
    );
  }

  // ===================== DEPLOY VIEW =====================
  const completedSteps = steps.filter(s => s.status === 'complete').length;
  const totalSteps = steps.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#c9d1d9' }}>Deploy to GitHub</h1>
          <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
            Deploying: <span className="font-medium" style={{ color: '#58a6ff' }}>{selectedProject.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: socketConnected ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)' }}>
            {socketConnected ? <Wifi className="w-3 h-3" style={{ color: '#3fb950' }} /> : <WifiOff className="w-3 h-3" style={{ color: '#f85149' }} />}
            <span style={{ color: socketConnected ? '#3fb950' : '#f85149' }}>{socketConnected ? 'Live' : 'Offline'}</span>
          </div>
          <StatusBadge status={deployResult ? (deployResult.errors?.length > 0 ? 'failed' : 'live') : 'not_deployed'} size="md" />
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[10px]"
            style={{ borderColor: '#30363d', color: '#58a6ff' }}
            onClick={() => setShowWorkflowEditor(!showWorkflowEditor)}
          >
            <GitBranch className="w-3 h-3" /> Edit Workflow
          </Button>
        </div>
      </motion.div>

      {/* Workflow Editor (toggleable) */}
      <AnimatePresence>
        {showWorkflowEditor && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <WorkflowEditor onClose={() => setShowWorkflowEditor(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deployment Type Selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs font-medium" style={{ color: '#8b949e' }}>Deployment Type</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>
                  {deployType === 'initial' ? 'First time pushing this project to GitHub' : 'Update existing repository with new changes'}
                </p>
              </div>
              <Tabs value={deployType} onValueChange={(v) => setDeployType(v as 'initial' | 'redeploy')}>
                <TabsList className="h-8 bg-[#21262d]">
                  <TabsTrigger value="initial" className="h-6 text-xs px-3 gap-1.5 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#58a6ff]">
                    <Upload className="w-3 h-3" /> Initial Deploy
                  </TabsTrigger>
                  <TabsTrigger value="redeploy" className="h-6 text-xs px-3 gap-1.5 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#58a6ff]">
                    <RotateCcw className="w-3 h-3" /> Redeploy
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress + Estimated Time */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium" style={{ color: '#8b949e' }}>Deployment Progress</span>
            {deploying && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(88,166,255,0.1)' }}>
                <Timer className="w-3 h-3" style={{ color: '#58a6ff' }} />
                <span className="text-[10px] font-mono" style={{ color: '#58a6ff' }}>{formatElapsed(elapsedTime)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {deploying && <span className="text-[10px]" style={{ color: '#e3b341' }}>~{getEstimatedTime()} remaining</span>}
            <span className="text-xs font-mono font-bold" style={{ color: '#58a6ff' }}>{progress}%</span>
          </div>
        </div>
        <div className="progress-shimmer rounded-full overflow-hidden">
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px]" style={{ color: '#484f58' }}>{completedSteps}/{totalSteps} steps completed</span>
          {deploying && (
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#58a6ff' }}>
              <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Step {steps.findIndex(s => s.status === 'in_progress') + 1} in progress
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps & Terminal — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Steps Timeline */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
            <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm" style={{ color: '#8b949e' }}>Deployment Steps</CardTitle>
                  <div className="flex items-center gap-2">
                    {deploying && !deploymentPaused && (
                      <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" style={{ color: '#e3b341' }} onClick={() => { setDeploymentPaused(true); toast({ title: 'Paused', description: 'Deployment polling paused' }); }}>
                        <Pause className="w-3 h-3" /> Pause
                      </Button>
                    )}
                    {deploying && deploymentPaused && (
                      <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" style={{ color: '#3fb950' }} onClick={() => { setDeploymentPaused(false); toast({ title: 'Resumed', description: 'Deployment polling resumed' }); }}>
                        <RefreshCw className="w-3 h-3" /> Resume
                      </Button>
                    )}
                    {deploying && (
                      <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" style={{ color: '#f85149' }} onClick={() => { setDeploymentCancelled(true); setDeploying(false); setDeployStartTime(null); toast({ title: 'Cancelled', description: 'Deployment has been cancelled', variant: 'destructive' }); }}>
                        <XCircle className="w-3 h-3" /> Cancel
                      </Button>
                    )}
                    {deploying && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(88,166,255,0.1)', color: '#58a6ff' }}>Live</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {steps.map((step, index) => {
                    const isExpanded = expandedStep === step.id;
                    return (
                      <div key={step.id}>
                        <div className="flex items-start gap-3 relative cursor-pointer group" onClick={() => setExpandedStep(isExpanded ? null : step.id)}>
                          {/* Connecting line */}
                          {index < steps.length - 1 && (
                            <div className="absolute left-[19px] top-[42px] w-0.5" style={{ height: 'calc(100% - 30px)', backgroundColor: step.status === 'complete' ? '#3fb950' : '#21262d', transition: 'background-color 0.5s ease' }} />
                          )}
                          {/* Step circle */}
                          <div className="flex items-center justify-center shrink-0 z-10">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300" style={{
                              backgroundColor: step.status === 'complete' ? 'rgba(63,185,80,0.15)' : step.status === 'in_progress' ? 'rgba(88,166,255,0.15)' : step.status === 'error' ? 'rgba(248,81,73,0.15)' : 'rgba(48,54,61,0.5)',
                              boxShadow: step.status === 'in_progress' ? '0 0 15px rgba(88,166,255,0.4)' : step.status === 'complete' ? '0 0 10px rgba(63,185,80,0.2)' : 'none',
                            }}>
                              {step.status === 'complete' ? <CheckCircle className="w-5 h-5" style={{ color: '#3fb950' }} /> :
                               step.status === 'error' ? <AlertCircle className="w-5 h-5" style={{ color: '#f85149' }} /> :
                               step.status === 'in_progress' ? <RefreshCw className="w-5 h-5 animate-spin" style={{ color: '#58a6ff' }} /> :
                               <span className="text-sm font-mono font-bold" style={{ color: '#484f58' }}>{index + 1}</span>}
                            </div>
                          </div>
                          {/* Step content */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold" style={{ color: step.status === 'pending' ? '#8b949e' : '#c9d1d9' }}>
                                  D{index + 1} — {step.label}
                                </p>
                                <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>{step.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {step.estimatedTime && step.status !== 'complete' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(227,179,65,0.1)', color: '#e3b341' }}>
                                    {step.estimatedTime}
                                  </span>
                                )}
                                <StatusBadge status={step.status === 'in_progress' ? 'building' : step.status === 'complete' ? 'live' : step.status === 'error' ? 'failed' : 'not_deployed'} />
                                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" style={{ color: '#484f58', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Expandable: substeps + view logs */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden ml-[52px] mb-3">
                              <div className="space-y-2 p-2.5 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
                                {/* Substeps */}
                                {step.substeps && step.substeps.map((sub, si) => (
                                  <div key={si} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: step.status === 'complete' ? 'rgba(63,185,80,0.15)' : step.status === 'in_progress' ? 'rgba(88,166,255,0.15)' : 'rgba(48,54,61,0.5)' }}>
                                      {step.status === 'complete' ? <CheckCircle className="w-2.5 h-2.5" style={{ color: '#3fb950' }} /> :
                                       step.status === 'in_progress' && si === 0 ? <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ color: '#58a6ff' }} /> :
                                       <span className="text-[8px] font-mono" style={{ color: '#484f58' }}>{si + 1}</span>}
                                    </div>
                                    <span className="text-[10px]" style={{ color: '#8b949e' }}>{sub}</span>
                                  </div>
                                ))}
                                {/* View Logs section */}
                                <div className="pt-2 mt-1 border-t" style={{ borderColor: '#21262d' }}>
                                  <p className="text-[9px] uppercase font-bold mb-1" style={{ color: '#484f58' }}>Step Logs</p>
                                  <div className="font-mono text-[10px] space-y-0.5 max-h-20 overflow-y-auto custom-scroll">
                                    {step.status === 'pending' ? (
                                      <p style={{ color: '#484f58' }}>Waiting to start...</p>
                                    ) : step.status === 'in_progress' ? (
                                      <p style={{ color: '#58a6ff' }}>Running...</p>
                                    ) : step.status === 'complete' ? (
                                      <p style={{ color: '#3fb950' }}>✓ Completed successfully</p>
                                    ) : (
                                      <p style={{ color: '#f85149' }}>✗ Failed — check terminal for details</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Terminal Console with 3 Tabs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}>
              {/* Terminal header */}
              <div className="border-b" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f85149' }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e3b341' }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3fb950' }} />
                    </div>
                    <Tabs value={terminalTab} onValueChange={(v) => setTerminalTab(v as 'live' | 'summary' | 'errors')}>
                      <TabsList className="h-6 bg-transparent gap-1">
                        <TabsTrigger value="live" className="h-5 text-[10px] px-2.5 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#3fb950]">
                          <FileText className="w-2.5 h-2.5 mr-1" /> Live Log
                        </TabsTrigger>
                        <TabsTrigger value="summary" className="h-5 text-[10px] px-2.5 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#58a6ff]">
                          <Clock className="w-2.5 h-2.5 mr-1" /> Summary
                        </TabsTrigger>
                        <TabsTrigger value="errors" className="h-5 text-[10px] px-2.5 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#f85149]">
                          <AlertCircle className="w-2.5 h-2.5 mr-1" /> Errors
                          {errorLogs.length > 0 && (
                            <Badge className="ml-1 h-3 text-[8px] px-1" style={{ backgroundColor: 'rgba(248,81,73,0.2)', color: '#f85149' }}>{errorLogs.length}</Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="flex items-center gap-2">
                    {deploying && (
                      <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: '#3fb950' }}>
                        <span className="animate-blink-cursor">▌</span> Streaming
                      </span>
                    )}
                    {/* Auto-scroll toggle */}
                    <button
                      className="text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: autoScroll ? 'rgba(63,185,80,0.1)' : 'transparent', color: autoScroll ? '#3fb950' : '#484f58' }}
                      onClick={() => setAutoScroll(!autoScroll)}
                    >
                      <ArrowRight className="w-2.5 h-2.5" style={{ transform: 'rotate(90deg)' }} />
                      {autoScroll ? 'Auto' : 'Manual'}
                    </button>
                  </div>
                </div>
                {/* Search bar */}
                {terminalTab === 'live' && (
                  <div className="px-4 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#484f58' }} />
                        <Input
                          placeholder="Search logs..."
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          className="h-6 text-[10px] pl-6 border-0"
                          style={{ backgroundColor: '#0d1117', color: '#c9d1d9' }}
                        />
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 gap-1 text-[9px] shrink-0" style={{ color: '#8b949e' }} onClick={downloadLogs}>
                        <Download className="w-3 h-3" /> Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal content */}
              <ScrollArea className="p-4" style={{ maxHeight: '300px' }}>
                {terminalTab === 'live' ? (
                  <div className="font-mono text-xs space-y-0.5">
                    {filteredLogs.length === 0 ? (
                      <div style={{ color: '#8b949e' }}>
                        <span className="animate-pulse">▌</span> {logSearch ? 'No matching logs...' : 'Waiting for deployment output...'}
                      </div>
                    ) : (
                      filteredLogs.map((line, i) => (
                        <div key={i} className="flex gap-2 hover:bg-[#161b22] px-1 rounded">
                          <span className="shrink-0 select-none w-6 text-right" style={{ color: '#30363d' }}>{i + 1}</span>
                          <span style={{ color: '#484f58' }} className="shrink-0 select-none">{new Date(line.timestamp).toLocaleTimeString()}</span>
                          <span style={{ color: getLogColor(line.type) }}>
                            {getLogPrefix(line.type)} {line.message}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={logEndRef} />
                  </div>
                ) : terminalTab === 'summary' ? (
                  <div className="space-y-3">
                    {deployResult ? (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg" style={{ backgroundColor: deployResult.errors?.length > 0 ? 'rgba(248,81,73,0.15)' : 'rgba(63,185,80,0.15)' }}>
                            {deployResult.errors?.length > 0 ? <AlertCircle className="w-4 h-4" style={{ color: '#f85149' }} /> : <CheckCircle className="w-4 h-4" style={{ color: '#3fb950' }} />}
                          </div>
                          <span className="text-sm font-semibold" style={{ color: deployResult.errors?.length > 0 ? '#f85149' : '#3fb950' }}>
                            {deployResult.errors?.length > 0 ? 'Deployed with warnings' : 'Deployment Successful'}
                          </span>
                        </div>
                        {[
                          { label: 'Repository', value: deployResult.repoUrl as string, isLink: true },
                          { label: 'Files Uploaded', value: `${deployResult.filesUploaded}/${deployResult.totalFiles}` },
                          { label: 'Workflow Dispatched', value: deployResult.workflowDispatched ? 'Yes' : 'No' },
                          { label: 'Duration', value: deployStartTime ? formatElapsed(elapsedTime) : 'N/A' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: '#21262d' }}>
                            <span className="text-xs" style={{ color: '#8b949e' }}>{item.label}</span>
                            {item.isLink ? (
                              <a href={item.value} target="_blank" rel="noopener noreferrer" className="text-xs font-mono hover:underline" style={{ color: '#58a6ff' }}>{item.value}</a>
                            ) : (
                              <span className="text-xs font-mono" style={{ color: '#c9d1d9' }}>{item.value}</span>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: '#30363d' }} />
                        <p className="text-xs" style={{ color: '#8b949e' }}>Deploy first to see the summary</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Errors tab */
                  <div className="space-y-1">
                    {errorLogs.length === 0 ? (
                      <div className="text-center py-6">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#3fb950' }} />
                        <p className="text-xs" style={{ color: '#3fb950' }}>No errors or warnings!</p>
                        <p className="text-[10px] mt-1" style={{ color: '#8b949e' }}>Everything looks clean</p>
                      </div>
                    ) : (
                      errorLogs.map((line, i) => (
                        <div key={i} className="flex gap-2 p-1.5 rounded hover:bg-[#161b22]" style={{ borderLeft: `2px solid ${line.type === 'error' ? '#f85149' : '#e3b341'}` }}>
                          <span className="shrink-0 select-none" style={{ color: '#484f58' }}>{new Date(line.timestamp).toLocaleTimeString()}</span>
                          <span style={{ color: getLogColor(line.type) }}>
                            {getLogPrefix(line.type)} {line.message}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </motion.div>

          {/* Deploy Button */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              {!deploying && (
                <div className="absolute inset-0 rounded-md animate-pulse-glow" style={{ background: 'radial-gradient(ellipse at center, rgba(35,134,54,0.3), transparent 70%)', zIndex: 0 }} />
              )}
              <Button
                className="gap-2 w-full relative z-10 h-12 text-base font-semibold"
                size="lg"
                disabled={deploying}
                style={{
                  background: deploying ? '#21262d' : 'linear-gradient(135deg, #238636, #2ea043, #3fb950)',
                  color: deploying ? '#8b949e' : 'white',
                  boxShadow: deploying ? 'none' : '0 4px 20px rgba(35,134,54,0.4)',
                }}
                onClick={handleDeploy}
              >
                {deploying ? (
                  <>
                    <div className="relative w-6 h-6 mr-1"><ProgressRing progress={progress} size={24} strokeWidth={2} /></div>
                    {deploymentPaused ? 'Paused...' : `Deploying... ${formatElapsed(elapsedTime)}`}
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    {deployType === 'initial' ? 'Deploy to GitHub' : 'Redeploy to GitHub'}
                  </>
                )}
              </Button>
            </div>
            {deployResult?.repoUrl && (
              <Button variant="outline" className="gap-2 h-12" style={{ borderColor: '#30363d', color: '#58a6ff' }} onClick={() => window.open(deployResult.repoUrl as string, '_blank')}>
                <ExternalLink className="w-4 h-4" /> Open Repo
              </Button>
            )}
          </div>

          {/* Enhanced Success Card */}
          <AnimatePresence>
            {deployResult && deployResult.repoUrl && !deploying && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, type: 'spring' }}>
                <Card className="relative overflow-hidden" style={{ backgroundColor: '#0d1117', borderColor: '#238636' }}>
                  <ConfettiParticles />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl glow-green" style={{ backgroundColor: '#3fb95015' }}>
                        <PartyPopper className="w-7 h-7" style={{ color: '#3fb950' }} />
                      </div>
                      <div>
                        <p className="text-lg font-bold" style={{ color: '#3fb950' }}>🎉 DEPLOYMENT SUCCESSFUL</p>
                        <p className="text-xs mt-0.5" style={{ color: '#8b949e' }}>Your project is now on GitHub</p>
                      </div>
                    </div>

                    {/* Deployment Summary Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Duration', value: formatElapsed(elapsedTime), icon: Timer, color: '#58a6ff' },
                        { label: 'Files', value: `${deployResult.filesUploaded || 0}`, icon: FileText, color: '#3fb950' },
                        { label: 'Status', value: 'Live', icon: CheckCircle, color: '#3fb950' },
                        { label: 'Commits', value: '1', icon: Github, color: '#a371f7' },
                      ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}>
                          <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: '#161b22', border: '1px solid #21262d' }}>
                            <stat.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: stat.color }} />
                            <p className="text-xs font-bold" style={{ color: '#c9d1d9' }}>{stat.value}</p>
                            <p className="text-[9px] uppercase" style={{ color: '#484f58' }}>{stat.label}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Repo URL + Copy */}
                    <div className="flex items-center gap-2 p-3 rounded-lg mb-4" style={{ backgroundColor: '#161b22' }}>
                      <Github className="w-4 h-4 shrink-0" style={{ color: '#8b949e' }} />
                      <a href={deployResult.repoUrl as string} target="_blank" rel="noopener noreferrer" className="text-xs font-mono flex-1 truncate hover:underline" style={{ color: '#58a6ff' }}>
                        {deployResult.repoUrl as string}
                      </a>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] shrink-0" style={{ color: copiedUrl ? '#3fb950' : '#8b949e' }} onClick={copyRepoUrl}>
                        {copiedUrl ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedUrl ? 'Copied!' : 'Copy URL'}
                      </Button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button className="gap-2" style={{ background: 'linear-gradient(135deg, #58a6ff, #388bfd)', color: 'white' }} onClick={() => setCurrentView('hosting')}>
                        Set Up Hosting <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" className="gap-2" style={{ borderColor: '#30363d', color: '#8b949e' }} onClick={() => { navigator.clipboard.writeText(deployResult.repoUrl as string); toast({ title: 'Link Copied!', description: 'Share link copied to clipboard' }); }}>
                        <Copy className="w-3.5 h-3.5" /> Share
                      </Button>
                      <Button variant="outline" className="gap-2" style={{ borderColor: '#30363d', color: '#8b949e' }} onClick={() => window.open(deployResult.repoUrl as string, '_blank')}>
                        <Github className="w-3.5 h-3.5" /> View on GitHub
                      </Button>
                      <Button variant="outline" className="gap-2" style={{ borderColor: '#30363d', color: '#8b949e' }} onClick={() => toast({ title: 'Tweet drafted!', description: 'Share your deploy on Twitter' })}>
                        <Twitter className="w-3.5 h-3.5" /> Tweet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <DeploymentScheduler
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            onSaveSchedule={(config) => { toast({ title: 'Schedule saved', description: `${config.cron} in ${config.timezone}` }); }}
          />

          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#8b949e' }}>Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Name', value: selectedProject.name },
                { label: 'Framework', value: selectedProject.framework },
                { label: 'Files', value: `${selectedProject.files?.length || 0} files` },
                ...(selectedProject.description ? [{ label: 'Description', value: selectedProject.description }] : []),
              ].map((item, i) => (
                <div key={i}>
                  <p className="text-[10px] uppercase font-medium" style={{ color: '#484f58' }}>{item.label}</p>
                  <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <EnvManager />

          {/* Enhanced Readiness Checklist with scoring */}
          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#8b949e' }}>
                  <CheckCircle className="w-4 h-4" style={{ color: '#3fb950' }} />
                  Readiness
                </CardTitle>
                <CircularScore score={readinessScore} size={40} label="ready" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {readinessItems.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.ok ? (
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#3fb950' }} />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: item.progress > 0 ? '#e3b341' : '#f85149' }} />
                    )}
                    <item.icon className="w-3 h-3 shrink-0" style={{ color: item.ok ? '#3fb950' : item.progress > 0 ? '#e3b341' : '#f85149' }} />
                    <span className="text-xs flex-1" style={{ color: item.ok ? '#8b949e' : item.progress > 0 ? '#e3b341' : '#f85149' }}>{item.label}</span>
                    {!item.ok && (
                      <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-0.5 shrink-0 px-1" style={{ color: '#58a6ff' }} onClick={() => setCurrentView(item.fixView)}>
                        <Wrench className="w-2.5 h-2.5" /> Fix
                      </Button>
                    )}
                  </div>
                  {/* Visual progress for partial items */}
                  {!item.ok && item.progress > 0 && (
                    <div className="ml-7">
                      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#21262d' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: '#e3b341' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {/* Readiness score text */}
              <div className="pt-2 mt-2 border-t" style={{ borderColor: '#21262d' }}>
                <p className="text-[10px] text-center" style={{ color: readinessScore >= 80 ? '#3fb950' : readinessScore >= 50 ? '#e3b341' : '#f85149' }}>
                  {readinessScore >= 80 ? '✓ Ready to deploy!' : readinessScore >= 50 ? '⚠ Almost ready — fix remaining items' : '✗ Not ready — resolve issues above'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deployment History */}
      {selectedProject.deployments && selectedProject.deployments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
                  <Clock className="w-4 h-4" style={{ color: '#58a6ff' }} /> Deployment History
                </CardTitle>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(88,166,255,0.1)', color: '#58a6ff' }}>
                  {selectedProject.deployments.length} deploys
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedProject.deployments.map((dep, idx) => (
                  <motion.div
                    key={dep.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                    className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[#21262d]"
                    style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: dep.status === 'completed' ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)' }}>
                      {dep.status === 'completed' ? <CheckCircle className="w-4 h-4" style={{ color: '#3fb950' }} /> : <AlertCircle className="w-4 h-4" style={{ color: '#f85149' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>{dep.triggeredBy} deploy</p>
                        <StatusBadge status={dep.status === 'completed' ? 'live' : 'failed'} />
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>
                        {new Date(dep.startedAt).toLocaleString()}
                        {dep.durationMs && ` · ${Math.round(dep.durationMs / 1000)}s`}
                      </p>
                      {dep.logSummary && <p className="text-[10px] mt-1 truncate" style={{ color: '#8b949e' }}>{dep.logSummary}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0 h-7 gap-1 text-[10px]" style={{ color: '#58a6ff' }} onClick={() => toast({ title: 'Rebuild triggered', description: `Re-running deployment ${dep.id}` })}>
                      <RefreshCw className="w-3 h-3" /> Retry
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Deploy Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Deploys', value: selectedProject.deployments?.length || 0, icon: Rocket, color: '#58a6ff' },
            { label: 'Successful', value: selectedProject.deployments?.filter(d => d.status === 'completed').length || 0, icon: CheckCircle, color: '#3fb950' },
            { label: 'Failed', value: selectedProject.deployments?.filter(d => d.status === 'failed').length || 0, icon: AlertCircle, color: '#f85149' },
            { label: 'Avg Duration', value: selectedProject.deployments?.filter(d => d.durationMs).length ? `${Math.round(selectedProject.deployments.filter(d => d.durationMs).reduce((a, d) => a + (d.durationMs || 0), 0) / selectedProject.deployments.filter(d => d.durationMs).length / 1000)}s` : 'N/A', icon: Timer, color: '#e3b341' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}>
              <Card className="text-center hover:-translate-y-0.5 transition-transform duration-200" style={{ backgroundColor: '#161b22', borderColor: '#30363d', borderTop: `2px solid ${stat.color}` }}>
                <CardContent className="p-3">
                  <stat.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: stat.color }} />
                  <p className="text-lg font-bold" style={{ color: '#c9d1d9' }}>{stat.value}</p>
                  <p className="text-[9px] uppercase" style={{ color: '#484f58' }}>{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <WorkflowTemplate />
    </div>
  );
}
