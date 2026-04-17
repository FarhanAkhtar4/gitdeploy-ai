'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Filter,
  User,
  Calendar,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeploymentRecord {
  id: string;
  project: string;
  status: 'success' | 'failed' | 'pending' | 'rolling_back';
  commitMessage: string;
  triggeredBy: string;
  triggeredAt: string;
  duration: string;
  logSummary: string;
}

const MOCK_DEPLOYMENTS: DeploymentRecord[] = [
  {
    id: 'dep-1',
    project: 'Invoice Manager',
    status: 'success',
    commitMessage: 'feat: add PDF export for invoices',
    triggeredBy: 'Manual — @alex',
    triggeredAt: new Date(Date.now() - 1800000).toISOString(),
    duration: '2m 34s',
    logSummary: 'Build completed. 12 files uploaded. GitHub Actions workflow #45 passed all checks.',
  },
  {
    id: 'dep-2',
    project: 'Task Manager',
    status: 'success',
    commitMessage: 'fix: resolve drag-and-drop bug on mobile',
    triggeredBy: 'Scheduled — Daily 9AM',
    triggeredAt: new Date(Date.now() - 7200000).toISOString(),
    duration: '1m 58s',
    logSummary: 'Auto-deploy triggered. All tests passed. Deployed to production.',
  },
  {
    id: 'dep-3',
    project: 'Chat Application',
    status: 'failed',
    commitMessage: 'feat: add file sharing support',
    triggeredBy: 'Manual — @sarah',
    triggeredAt: new Date(Date.now() - 14400000).toISOString(),
    duration: '4m 12s',
    logSummary: 'Build step failed: TypeScript compilation error in src/components/FileUpload.tsx line 42.',
  },
  {
    id: 'dep-4',
    project: 'Analytics Dashboard',
    status: 'success',
    commitMessage: 'chore: update dependencies',
    triggeredBy: 'Manual — @alex',
    triggeredAt: new Date(Date.now() - 28800000).toISOString(),
    duration: '3m 05s',
    logSummary: 'Dependency updates applied. No breaking changes detected. All checks passed.',
  },
  {
    id: 'dep-5',
    project: 'Blog CMS',
    status: 'failed',
    commitMessage: 'feat: add markdown preview',
    triggeredBy: 'Manual — @mike',
    triggeredAt: new Date(Date.now() - 43200000).toISOString(),
    duration: '1m 22s',
    logSummary: 'Lint check failed: 3 ESLint errors in markdown-editor component.',
  },
  {
    id: 'dep-6',
    project: 'Food Delivery API',
    status: 'success',
    commitMessage: 'feat: add delivery tracking endpoint',
    triggeredBy: 'Scheduled — Every 6h',
    triggeredAt: new Date(Date.now() - 86400000).toISOString(),
    duration: '1m 45s',
    logSummary: 'API endpoints deployed. Health check passed. Response time < 200ms.',
  },
  {
    id: 'dep-7',
    project: 'Invoice Manager',
    status: 'success',
    commitMessage: 'fix: correct tax calculation for EU',
    triggeredBy: 'Manual — @alex',
    triggeredAt: new Date(Date.now() - 172800000).toISOString(),
    duration: '2m 10s',
    logSummary: 'Tax logic updated. All integration tests passed. Deployed successfully.',
  },
  {
    id: 'dep-8',
    project: 'Task Manager',
    status: 'pending',
    commitMessage: 'feat: add team workspaces',
    triggeredBy: 'Manual — @sarah',
    triggeredAt: new Date(Date.now() - 60000).toISOString(),
    duration: 'In progress...',
    logSummary: 'Build started. Awaiting GitHub Actions workflow completion.',
  },
];

type StatusFilter = 'all' | 'success' | 'failed' | 'pending';

function StatusIcon({ status }: { status: DeploymentRecord['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-4 h-4" style={{ color: '#3fb950' }} />;
    case 'failed':
      return <XCircle className="w-4 h-4" style={{ color: '#f85149' }} />;
    case 'pending':
      return <Clock className="w-4 h-4 animate-pulse" style={{ color: '#e3b341' }} />;
    case 'rolling_back':
      return <RotateCw className="w-4 h-4 animate-spin" style={{ color: '#f85149' }} />;
  }
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const STATUS_CONFIG = {
  all: { label: 'All', color: '#8b949e' },
  success: { label: 'Successful', color: '#3fb950' },
  failed: { label: 'Failed', color: '#f85149' },
  pending: { label: 'Pending', color: '#e3b341' },
};

export function DeploymentHistory() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === 'all'
    ? MOCK_DEPLOYMENTS
    : MOCK_DEPLOYMENTS.filter((d) => d.status === filter);

  const counts = {
    all: MOCK_DEPLOYMENTS.length,
    success: MOCK_DEPLOYMENTS.filter((d) => d.status === 'success').length,
    failed: MOCK_DEPLOYMENTS.filter((d) => d.status === 'failed').length,
    pending: MOCK_DEPLOYMENTS.filter((d) => d.status === 'pending').length,
  };

  return (
    <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
            <History className="w-4 h-4" style={{ color: '#a371f7' }} />
            Deployment History
          </CardTitle>
          <Badge variant="outline" className="text-[10px] h-5 px-1.5" style={{ borderColor: '#30363d', color: '#8b949e' }}>
            {MOCK_DEPLOYMENTS.length} total
          </Badge>
        </div>
        {/* Filter tabs */}
        <div className="flex items-center gap-1 mt-2">
          <Filter className="w-3 h-3 mr-1" style={{ color: '#484f58' }} />
          {(Object.entries(STATUS_CONFIG) as [StatusFilter, { label: string; color: string }][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-colors"
              style={{
                backgroundColor: filter === key ? `${config.color}15` : 'transparent',
                color: filter === key ? config.color : '#484f58',
                border: filter === key ? `1px solid ${config.color}30` : '1px solid transparent',
              }}
            >
              {config.label}
              <span className="font-mono">{counts[key]}</span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-80">
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((deployment, i) => (
                <motion.div
                  key={deployment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <div
                    className="rounded-lg border p-3 hover:bg-[#21262d] transition-colors cursor-pointer"
                    style={{ backgroundColor: '#0d1117', borderColor: '#21262d' }}
                    onClick={() => setExpandedId(expandedId === deployment.id ? null : deployment.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div className="mt-0.5 shrink-0">
                        <StatusIcon status={deployment.status} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium truncate" style={{ color: '#c9d1d9' }}>
                            {deployment.commitMessage}
                          </p>
                          {expandedId === deployment.id ? (
                            <ChevronUp className="w-3 h-3 shrink-0" style={{ color: '#484f58' }} />
                          ) : (
                            <ChevronDown className="w-3 h-3 shrink-0" style={{ color: '#484f58' }} />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5" style={{ borderColor: '#30363d', color: '#58a6ff' }}>
                            {deployment.project}
                          </Badge>
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: '#8b949e' }}>
                            <User className="w-2.5 h-2.5" /> {deployment.triggeredBy}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: '#484f58' }}>
                            <Calendar className="w-2.5 h-2.5" /> {formatTimeAgo(deployment.triggeredAt)}
                          </span>
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: '#484f58' }}>
                            <Timer className="w-2.5 h-2.5" /> {deployment.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Expanded log */}
                    <AnimatePresence>
                      {expandedId === deployment.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-2.5 border-t" style={{ borderColor: '#21262d' }}>
                            <div className="rounded-lg p-3" style={{ backgroundColor: '#0d1117' }}>
                              <p className="text-[10px] font-mono leading-relaxed" style={{ color: '#8b949e' }}>
                                {deployment.logSummary}
                              </p>
                            </div>
                            {deployment.status === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-7 gap-1.5 text-[10px]"
                                style={{ borderColor: '#f8514940', color: '#f85149' }}
                              >
                                <RotateCw className="w-3 h-3" /> Redeploy
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
