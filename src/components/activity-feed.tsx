'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Rocket,
  Hammer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  Shield,
  GitBranch,
  Clock,
  Search,
  Filter,
  ArrowLeft,
  User,
  Globe,
  Code2,
  Package,
  Database,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ActivityType = 'deployment' | 'build' | 'settings' | 'security' | 'project' | 'api';

interface Activity {
  id: string;
  type: ActivityType;
  actor: string;
  actorAvatar: string;
  action: string;
  target: string;
  timestamp: string;
  dateGroup: string;
  status: 'success' | 'failed' | 'pending' | 'info';
}

const TYPE_CONFIG: Record<ActivityType, { icon: React.ElementType; color: string; bg: string }> = {
  deployment: { icon: Rocket, color: '#3fb950', bg: 'rgba(63,185,80,0.1)' },
  build: { icon: Hammer, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)' },
  settings: { icon: Settings, color: '#a371f7', bg: 'rgba(163,113,247,0.1)' },
  security: { icon: Shield, color: '#e3b341', bg: 'rgba(227,179,65,0.1)' },
  project: { icon: GitBranch, color: '#f778ba', bg: 'rgba(247,120,186,0.1)' },
  api: { icon: Code2, color: '#79c0ff', bg: 'rgba(121,192,255,0.1)' },
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  success: { icon: CheckCircle2, color: '#3fb950' },
  failed: { icon: XCircle, color: '#f85149' },
  pending: { icon: Clock, color: '#e3b341' },
  info: { icon: Globe, color: '#58a6ff' },
};

const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', type: 'deployment', actor: 'Alex Chen', actorAvatar: 'AC', action: 'deployed to production', target: 'Task Manager', timestamp: '2 min ago', dateGroup: 'Today', status: 'success' },
  { id: '2', type: 'build', actor: 'Alex Chen', actorAvatar: 'AC', action: 'built project successfully', target: 'Invoice Manager', timestamp: '25 min ago', dateGroup: 'Today', status: 'success' },
  { id: '3', type: 'deployment', actor: 'Alex Chen', actorAvatar: 'AC', action: 'deployment failed — build error', target: 'Chat App', timestamp: '1h ago', dateGroup: 'Today', status: 'failed' },
  { id: '4', type: 'project', actor: 'Alex Chen', actorAvatar: 'AC', action: 'created new project', target: 'Analytics Dashboard', timestamp: '2h ago', dateGroup: 'Today', status: 'info' },
  { id: '5', type: 'security', actor: 'System', actorAvatar: 'SY', action: 'detected vulnerability in', target: 'lodash@4.17.20', timestamp: '3h ago', dateGroup: 'Today', status: 'failed' },
  { id: '6', type: 'api', actor: 'Alex Chen', actorAvatar: 'AC', action: 'generated API endpoint for', target: 'Food Delivery API', timestamp: '4h ago', dateGroup: 'Today', status: 'success' },
  { id: '7', type: 'settings', actor: 'Alex Chen', actorAvatar: 'AC', action: 'updated environment variables for', target: 'Task Manager', timestamp: '5h ago', dateGroup: 'Today', status: 'info' },
  { id: '8', type: 'deployment', actor: 'Alex Chen', actorAvatar: 'AC', action: 'deployed to staging', target: 'Blog CMS', timestamp: '8h ago', dateGroup: 'Yesterday', status: 'success' },
  { id: '9', type: 'build', actor: 'Alex Chen', actorAvatar: 'AC', action: 'rebuilt project after fix', target: 'Chat App', timestamp: '10h ago', dateGroup: 'Yesterday', status: 'success' },
  { id: '10', type: 'project', actor: 'Alex Chen', actorAvatar: 'AC', action: 'forked project from template', target: 'E-commerce Store', timestamp: '14h ago', dateGroup: 'Yesterday', status: 'info' },
  { id: '11', type: 'security', actor: 'System', actorAvatar: 'SY', action: 'rotated API key for', target: 'GitHub Integration', timestamp: '18h ago', dateGroup: 'Yesterday', status: 'success' },
  { id: '12', type: 'deployment', actor: 'Alex Chen', actorAvatar: 'AC', action: 'deployed with CI/CD pipeline', target: 'Portfolio Site', timestamp: '1d ago', dateGroup: 'This Week', status: 'success' },
  { id: '13', type: 'build', actor: 'System', actorAvatar: 'SY', action: 'auto-rebuild triggered for', target: 'Analytics Dashboard', timestamp: '2d ago', dateGroup: 'This Week', status: 'success' },
  { id: '14', type: 'settings', actor: 'Alex Chen', actorAvatar: 'AC', action: 'configured webhooks for', target: 'Task Manager', timestamp: '3d ago', dateGroup: 'This Week', status: 'info' },
  { id: '15', type: 'project', actor: 'Alex Chen', actorAvatar: 'AC', action: 'archived project', target: 'Old Blog', timestamp: '4d ago', dateGroup: 'Earlier', status: 'info' },
  { id: '16', type: 'deployment', actor: 'Alex Chen', actorAvatar: 'AC', action: 'rolled back deployment for', target: 'Invoice Manager', timestamp: '5d ago', dateGroup: 'Earlier', status: 'pending' },
  { id: '17', type: 'api', actor: 'System', actorAvatar: 'SY', action: 'rate limit warning for', target: 'AI Chat Service', timestamp: '6d ago', dateGroup: 'Earlier', status: 'failed' },
  { id: '18', type: 'security', actor: 'System', actorAvatar: 'SY', action: 'enabled 2FA for account', target: 'Security Settings', timestamp: '7d ago', dateGroup: 'Earlier', status: 'success' },
];

type DateFilter = 'all' | 'today' | '7days' | '30days';
type TypeFilter = 'all' | ActivityType;

interface ActivityFeedProps {
  onBack?: () => void;
  onClose?: () => void;
}

export function ActivityFeed({ onBack, onClose }: ActivityFeedProps) {
  const [activities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      // Type filter
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!a.action.toLowerCase().includes(q) && !a.target.toLowerCase().includes(q) && !a.actor.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [activities, typeFilter, searchQuery]);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    for (const a of filteredActivities) {
      if (!groups[a.dateGroup]) groups[a.dateGroup] = [];
      groups[a.dateGroup].push(a);
    }
    return groups;
  }, [filteredActivities]);

  const shownActivities = filteredActivities.slice(0, visibleCount);
  const hasMore = visibleCount < filteredActivities.length;

  const stats = useMemo(() => ({
    total: activities.length,
    deployments: activities.filter((a) => a.type === 'deployment').length,
    failed: activities.filter((a) => a.status === 'failed').length,
    today: activities.filter((a) => a.dateGroup === 'Today').length,
  }), [activities]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#8b949e' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#30363d'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#e6edf3' }}>Activity Feed</h2>
            <p className="text-xs" style={{ color: '#8b949e' }}>Track all actions across your projects</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: stats.total, icon: Zap, color: '#58a6ff' },
          { label: 'Deployments', value: stats.deployments, icon: Rocket, color: '#3fb950' },
          { label: 'Failed', value: stats.failed, icon: AlertTriangle, color: '#f85149' },
          { label: 'Today', value: stats.today, icon: Clock, color: '#e3b341' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-lg p-3"
            style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderTop: `2px solid ${stat.color}` }}
          >
            <div className="flex items-center gap-2">
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              <span className="text-lg font-bold" style={{ color: '#e6edf3' }}>{stat.value}</span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: '#8b949e' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#484f58' }} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="pl-8 h-8 text-xs"
            style={{ backgroundColor: '#0d1117', borderColor: '#30363d', color: '#c9d1d9' }}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-3 h-3 shrink-0" style={{ color: '#484f58' }} />
          {(['all', 'deployment', 'build', 'security', 'project', 'settings', 'api'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
              style={{
                backgroundColor: typeFilter === t ? 'rgba(88,166,255,0.15)' : 'transparent',
                color: typeFilter === t ? '#58a6ff' : '#8b949e',
                border: typeFilter === t ? '1px solid rgba(88,166,255,0.3)' : '1px solid transparent',
              }}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <ScrollArea className="max-h-[calc(100vh-320px)]">
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([group, items]) => (
            <div key={group}>
              {/* Date Group Header */}
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold" style={{ color: '#8b949e' }}>{group}</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: '#21262d' }} />
                <Badge variant="outline" className="text-[9px] h-4 px-1.5" style={{ borderColor: '#30363d', color: '#484f58' }}>
                  {items.length}
                </Badge>
              </div>

              {/* Activity Items */}
              <div className="space-y-0">
                {items.slice(0, items === groupedActivities[group] ? visibleCount : undefined).map((activity, idx) => {
                  const typeConfig = TYPE_CONFIG[activity.type];
                  const statusConfig = STATUS_CONFIG[activity.status];
                  const TypeIcon = typeConfig.icon;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group relative flex gap-3 py-2.5 px-3 rounded-lg transition-colors"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(33,38,45,0.3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* Timeline line */}
                      {idx < items.length - 1 && (
                        <div
                          className="absolute left-[27px] top-[44px] bottom-0 w-px"
                          style={{ backgroundColor: '#21262d' }}
                        />
                      )}

                      {/* Actor Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 relative z-10"
                        style={{
                          backgroundColor: typeConfig.bg,
                          color: typeConfig.color,
                          border: `2px solid #161b22`,
                        }}
                      >
                        {activity.actorAvatar}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start gap-2">
                          <p className="text-xs leading-snug" style={{ color: '#c9d1d9' }}>
                            <span className="font-semibold" style={{ color: '#e6edf3' }}>{activity.actor}</span>
                            {' '}{activity.action}{' '}
                            <span className="font-mono font-medium" style={{ color: '#58a6ff' }}>{activity.target}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <TypeIcon className="w-3 h-3" style={{ color: typeConfig.color }} />
                          <span className="text-[10px]" style={{ color: '#484f58' }}>{activity.timestamp}</span>
                          <StatusIcon className="w-3 h-3" style={{ color: statusConfig.color }} />
                          <Badge
                            variant="outline"
                            className="h-4 px-1 text-[9px]"
                            style={{ borderColor: `${statusConfig.color}30`, color: statusConfig.color }}
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-8 h-8 mx-auto mb-3" style={{ color: '#30363d' }} />
              <p className="text-xs font-medium" style={{ color: '#8b949e' }}>No activities found</p>
              <p className="text-[10px] mt-1" style={{ color: '#484f58' }}>
                {searchQuery ? 'Try a different search term' : 'Activities will appear here as you use the platform'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] gap-1"
            style={{ color: '#58a6ff' }}
            onClick={() => setVisibleCount((c) => c + 10)}
          >
            Load More ({filteredActivities.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
