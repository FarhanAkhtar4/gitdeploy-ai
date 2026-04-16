'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TerminalConsole } from '@/components/terminal-console';
import { StatusBadge } from '@/components/status-badge';
import { DeploymentScheduler } from '@/components/deployment-scheduler';
import { Progress } from '@/components/ui/progress';
import {
  Rocket,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeployStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
}

export function DeployView() {
  const { user, selectedProject, isGithubConnected, setCurrentView } = useAppStore();
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'error' | 'success' | 'warning' }>>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [steps, setSteps] = useState<DeployStep[]>([
    { id: 'd1', label: 'D1 — Repository Setup', description: 'Create or verify GitHub repository', status: 'pending' },
    { id: 'd2', label: 'D2 — File Upload', description: 'Push all project files to GitHub', status: 'pending' },
    { id: 'd3', label: 'D3 — Workflow Deployment', description: 'Push GitHub Actions workflow', status: 'pending' },
    { id: 'd4', label: 'D4 — Trigger Deployment', description: 'Dispatch the deployment workflow', status: 'pending' },
    { id: 'd5', label: 'D5 — Status Polling', description: 'Monitor deployment run status', status: 'pending' },
    { id: 'd6', label: 'D6 — Confirmation', description: 'Verify deployment success', status: 'pending' },
  ]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

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

    return () => {
      socket.disconnect();
    };
  }, [selectedProject]);

  const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    setLogs((prev) => [...prev, { timestamp: new Date().toISOString(), message, type }]);
  }, []);

  const updateStep = useCallback((stepId: string, status: DeployStep['status']) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, status } : s)));
  }, []);

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
    setLogs([]);
    setDeployResult(null);
    addLog('🚀 Starting deployment process...', 'info');

    try {
      updateStep('d1', 'in_progress');
      setProgress(10);
      addLog('Checking if repository exists on GitHub...', 'info');

      const res = await fetch('/api/projects/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

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

      // Step D5 - Poll status
      updateStep('d5', 'in_progress');
      addLog('🔄 Checking deployment status...', 'info');

      if (data.deploymentId) {
        let pollCount = 0;
        const maxPolls = 12;
        const pollInterval = setInterval(async () => {
          pollCount++;
          try {
            const statusRes = await fetch(
              `/api/deploy/status?deploymentId=${data.deploymentId}&projectId=${selectedProject.id}`,
              { headers: { 'x-user-id': user.id } }
            );
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
              }
            }

            if (pollCount >= maxPolls) {
              clearInterval(pollInterval);
              updateStep('d5', 'complete');
              updateStep('d6', 'complete');
              addLog('⏳ Status polling timed out. Check GitHub Actions manually.', 'warning');
              setDeploying(false);
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
      }

      setDeployResult(data);
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      updateStep('d1', 'error');
      setDeploying(false);
      toast({ title: 'Deployment failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    }
  };

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: '#21262d' }}>
          <Rocket className="w-10 h-10" style={{ color: '#30363d' }} />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: '#c9d1d9' }}>No project to deploy</h3>
        <p className="text-sm mt-2 max-w-sm text-center" style={{ color: '#8b949e' }}>
          Build a project first, then deploy it to GitHub
        </p>
        <Button
          className="gap-2 mt-5"
          style={{ background: 'linear-gradient(135deg, #238636, #2ea043)', color: 'white' }}
          onClick={() => setCurrentView('builder')}
        >
          <ArrowRight className="w-4 h-4" /> Go to Builder
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#c9d1d9' }}>Deploy to GitHub</h1>
          <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
            Deploying: <span className="font-medium" style={{ color: '#58a6ff' }}>{selectedProject.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Socket status indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: socketConnected ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)' }}>
            {socketConnected ? (
              <Wifi className="w-3 h-3" style={{ color: '#3fb950' }} />
            ) : (
              <WifiOff className="w-3 h-3" style={{ color: '#f85149' }} />
            )}
            <span style={{ color: socketConnected ? '#3fb950' : '#f85149' }}>
              {socketConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <StatusBadge status={deployResult ? (deployResult.errors?.length > 0 ? 'failed' : 'live') : 'not_deployed'} size="md" />
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: '#8b949e' }}>Deployment Progress</span>
          <span className="text-xs font-mono font-bold" style={{ color: '#58a6ff' }}>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps & Terminal - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Steps */}
          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#8b949e' }}>Deployment Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300"
                  style={{
                    backgroundColor: step.status === 'in_progress' ? '#58a6ff08' : 'transparent',
                    borderLeft: step.status === 'in_progress' ? '2px solid #58a6ff' : '2px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono w-5" style={{ color: '#484f58' }}>{index + 1}</span>
                    {step.status === 'complete' ? (
                      <CheckCircle className="w-4 h-4" style={{ color: '#3fb950' }} />
                    ) : step.status === 'error' ? (
                      <AlertCircle className="w-4 h-4" style={{ color: '#f85149' }} />
                    ) : step.status === 'in_progress' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#58a6ff' }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: '#30363d' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: step.status === 'pending' ? '#8b949e' : '#c9d1d9' }}>
                      {step.label}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>{step.description}</p>
                  </div>
                  <StatusBadge status={step.status === 'in_progress' ? 'building' : step.status === 'complete' ? 'live' : step.status === 'error' ? 'failed' : 'not_deployed'} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Terminal Console */}
          <TerminalConsole lines={logs} title="Deployment Log" maxHeight="300px" />

          {/* Deploy Button */}
          <div className="flex gap-3">
            <Button
              className="gap-2 flex-1"
              size="lg"
              disabled={deploying}
              style={{
                background: deploying ? '#21262d' : 'linear-gradient(135deg, #238636, #2ea043)',
                color: deploying ? '#8b949e' : 'white',
              }}
              onClick={handleDeploy}
            >
              {deploying ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Deploying...</>
              ) : (
                <><Rocket className="w-4 h-4" /> Deploy to GitHub</>
              )}
            </Button>

            {deployResult?.repoUrl && (
              <Button
                variant="outline"
                className="gap-2"
                style={{ borderColor: '#30363d', color: '#58a6ff' }}
                onClick={() => window.open(deployResult.repoUrl as string, '_blank')}
              >
                <ExternalLink className="w-4 h-4" /> Open Repo
              </Button>
            )}
          </div>

          {/* Success Card */}
          {deployResult && deployResult.repoUrl && !deploying && (
            <Card style={{ backgroundColor: '#0d1117', borderColor: '#238636' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: '#3fb95015' }}>
                    <CheckCircle className="w-6 h-6" style={{ color: '#3fb950' }} />
                  </div>
                  <div>
                    <p className="text-base font-semibold" style={{ color: '#3fb950' }}>✅ DEPLOYMENT SUCCESSFUL</p>
                    <p className="text-xs mt-1" style={{ color: '#8b949e' }}>
                      Repository: <a href={deployResult.repoUrl as string} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#58a6ff' }}>{deployResult.repoUrl as string}</a>
                    </p>
                  </div>
                </div>
                <Button
                  className="gap-2"
                  style={{ backgroundColor: '#58a6ff15', color: '#58a6ff' }}
                  onClick={() => setCurrentView('hosting')}
                >
                  👇 Choose a Free Hosting Platform
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — Scheduler & Info */}
        <div className="space-y-4">
          <DeploymentScheduler
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            onSaveSchedule={(config) => {
              toast({ title: 'Schedule saved', description: `${config.cron} in ${config.timezone}` });
            }}
          />

          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: '#8b949e' }}>Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-[10px] uppercase font-medium" style={{ color: '#484f58' }}>Name</p>
                <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>{selectedProject.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-medium" style={{ color: '#484f58' }}>Framework</p>
                <p className="text-xs" style={{ color: '#c9d1d9' }}>{selectedProject.framework}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-medium" style={{ color: '#484f58' }}>Files</p>
                <p className="text-xs" style={{ color: '#c9d1d9' }}>{selectedProject.files?.length || 0} files</p>
              </div>
              {selectedProject.description && (
                <div>
                  <p className="text-[10px] uppercase font-medium" style={{ color: '#484f58' }}>Description</p>
                  <p className="text-xs" style={{ color: '#8b949e' }}>{selectedProject.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
