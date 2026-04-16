'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore, type Project, type ProjectStatus } from '@/store/app-store';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  Rocket,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Zap,
  GitBranch,
  Activity,
  Clock,
  ArrowUpRight,
  GitCommit,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { ProjectHealth } from '@/components/project-health';
import { DeploymentHistory } from '@/components/deployment-history';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function MiniSparkline({ color, values }: { color: string; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[2px] h-6">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all duration-300"
          style={{
            height: `${(v / max) * 100}%`,
            minHeight: '2px',
            backgroundColor: color,
            opacity: 0.5 + (i / values.length) * 0.5,
          }}
        />
      ))}
    </div>
  );
}

// Sample activity data
const SAMPLE_ACTIVITIES = [
  { id: '1', type: 'project_created' as const, message: 'Project "Invoice Manager" created', time: '2 minutes ago', color: '#58a6ff' },
  { id: '2', type: 'deploy_started' as const, message: 'Deployment started for "Task Manager"', time: '15 minutes ago', color: '#e3b341' },
  { id: '3', type: 'deploy_completed' as const, message: 'Deployment completed for "Chat App"', time: '1 hour ago', color: '#3fb950' },
  { id: '4', type: 'file_pushed' as const, message: '12 files pushed to "Analytics Dashboard"', time: '2 hours ago', color: '#58a6ff' },
  { id: '5', type: 'deploy_failed' as const, message: 'Deployment failed for "Blog CMS"', time: '3 hours ago', color: '#f85149' },
  { id: '6', type: 'project_created' as const, message: 'Project "Food Delivery API" created', time: '5 hours ago', color: '#58a6ff' },
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

export function DashboardView() {
  const { projects, setProjects, user, setCurrentView, setSelectedProject, setIsLoading, isGithubConnected } = useAppStore();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      if (data.projects) {
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
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, [user, setProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: FolderOpen, color: '#58a6ff', bg: '#58a6ff', sparkline: [2, 4, 3, 5, 4, projects.length] },
    { label: 'Live', value: liveCount, icon: Zap, color: '#3fb950', bg: '#3fb950', sparkline: [0, 1, 1, 2, 1, liveCount] },
    { label: 'Building', value: buildingCount, icon: Activity, color: '#e3b341', bg: '#e3b341', sparkline: [0, 0, 1, 0, 1, buildingCount] },
    { label: 'Failed', value: failedCount, icon: Rocket, color: '#f85149', bg: '#f85149', sparkline: [0, 0, 0, 1, 0, failedCount] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#c9d1d9' }}>
            {getGreeting()} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
            Manage your projects and deployments
          </p>
        </div>
        <Button
          className="gap-2"
          style={{ backgroundColor: '#238636', color: 'white' }}
          onClick={() => setCurrentView('builder')}
        >
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </motion.div>

      {/* Setup Guide (shown when GitHub not connected) */}
      {!isGithubConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="hover:shadow-lg transition-all duration-300 glow-hover-blue group"
              style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8b949e' }}>{stat.label}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${stat.bg}15` }}>
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <MiniSparkline color={stat.color} values={stat.sparkline} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Projects Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: '#161b22' }} />
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ color: '#8b949e' }}>Your Projects</CardTitle>
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
            </CardHeader>
            <CardContent>
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
                    {projects.map((project) => {
                      const badge = FRAMEWORK_BADGES[project.framework] || FRAMEWORK_BADGES.express;
                      const lastDeployment = project.deployments?.[0];
                      return (
                        <TableRow key={project.id} style={{ borderColor: '#21262d' }} className="hover:bg-[#21262d] transition-colors">
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
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Tips */}
      {projects.length === 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              title: 'Connect GitHub',
              desc: 'Link your GitHub account with a Personal Access Token',
              icon: Rocket,
              color: '#58a6ff',
              action: 'onboarding' as AppView,
            },
            {
              step: '2',
              title: 'Build with AI',
              desc: 'Describe your project and let AI generate the complete codebase',
              icon: Zap,
              color: '#e3b341',
              action: 'builder' as AppView,
            },
            {
              step: '3',
              title: 'Deploy & Host Free',
              desc: 'Push to GitHub and get free hosting recommendations',
              icon: ExternalLink,
              color: '#3fb950',
              action: 'hosting' as AppView,
            },
          ].map((tip, i) => (
            <motion.div
              key={tip.step}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card
                className="hover:border-[#58a6ff] transition-all duration-300 cursor-pointer group hover:scale-[1.02] hover:shadow-lg"
                style={{
                  backgroundColor: '#161b22',
                  borderColor: '#30363d',
                  borderLeft: `3px solid transparent`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderLeftColor = tip.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent';
                }}
                onClick={() => setCurrentView(tip.action)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${tip.color}15`, color: tip.color }}
                    >
                      {tip.step}
                    </div>
                    <tip.icon className="w-4 h-4" style={{ color: tip.color }} />
                  </div>
                  <h4 className="text-sm font-medium" style={{ color: '#c9d1d9' }}>{tip.title}</h4>
                  <p className="text-xs mt-1" style={{ color: '#8b949e' }}>{tip.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Project Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-1"
        >
          <ProjectHealth />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="lg:col-span-2"
        >
          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" style={{ color: '#58a6ff' }} />
                <CardTitle className="text-sm" style={{ color: '#8b949e' }}>Recent Activity</CardTitle>
              </div>
            </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {SAMPLE_ACTIVITIES.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.06, duration: 0.3 }}
                  className="flex items-start gap-3 relative"
                >
                  {/* Timeline line and dot */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                      style={{ backgroundColor: `${activity.color}15` }}
                    >
                      <ActivityIcon type={activity.type} color={activity.color} />
                    </div>
                    {i < SAMPLE_ACTIVITIES.length - 1 && (
                      <div className="w-px flex-1 min-h-[20px]" style={{ backgroundColor: '#21262d' }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`flex-1 pb-4 ${i < SAMPLE_ACTIVITIES.length - 1 ? '' : ''}`}>
                    <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>{activity.message}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#484f58' }}>{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </div>
  );
}
