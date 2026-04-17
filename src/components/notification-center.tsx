'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Bell,
  X,
  CheckCheck,
  Rocket,
  AlertTriangle,
  Shield,
  Settings,
  GitBranch,
  Circle,
  CheckCircle2,
  Search,
  Filter,
  Clock,
  Trash2,
  Hammer,
  Code2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type NotificationType = 'deployment_success' | 'deployment_failed' | 'project_created' | 'security_alert' | 'system_update' | 'build_complete' | 'code_review';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  deployment_success: { icon: Rocket, color: '#3fb950', bg: 'rgba(63,185,80,0.1)', label: 'Deployment' },
  deployment_failed: { icon: AlertTriangle, color: '#f85149', bg: 'rgba(248,81,73,0.1)', label: 'Deployment' },
  project_created: { icon: GitBranch, color: '#58a6ff', bg: 'rgba(88,166,255,0.1)', label: 'Project' },
  security_alert: { icon: Shield, color: '#e3b341', bg: 'rgba(227,179,65,0.1)', label: 'Security' },
  system_update: { icon: Settings, color: '#a371f7', bg: 'rgba(163,113,247,0.1)', label: 'System' },
  build_complete: { icon: CheckCircle2, color: '#3fb950', bg: 'rgba(63,185,80,0.1)', label: 'Build' },
  code_review: { icon: Code2, color: '#f778ba', bg: 'rgba(247,120,186,0.1)', label: 'Review' },
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'deployment_success', title: 'Deployment Successful', description: 'Task Manager deployed to production', timestamp: '2 min ago', read: false },
  { id: '2', type: 'deployment_failed', title: 'Deployment Failed', description: 'Invoice Manager failed to deploy — build error in src/api/stripe.ts', timestamp: '15 min ago', read: false },
  { id: '3', type: 'project_created', title: 'New Project Created', description: 'Analytics Dashboard was created with Next.js + Recharts', timestamp: '1h ago', read: false },
  { id: '4', type: 'security_alert', title: 'Security Vulnerability Found', description: 'lodash@4.17.20 has a prototype pollution vulnerability', timestamp: '2h ago', read: true },
  { id: '5', type: 'build_complete', title: 'Build Complete', description: 'Chat App built successfully in 45s (3 warnings)', timestamp: '3h ago', read: true },
  { id: '6', type: 'system_update', title: 'System Update Available', description: 'GitDeploy AI v2.4.0 — New AI models and faster deployments', timestamp: '5h ago', read: true },
  { id: '7', type: 'code_review', title: 'Code Review Suggestion', description: 'Consider adding error boundaries to your React components', timestamp: '6h ago', read: true },
  { id: '8', type: 'deployment_success', title: 'Deployment Successful', description: 'Blog CMS deployed to staging environment', timestamp: '8h ago', read: true },
  { id: '9', type: 'security_alert', title: 'API Key Expiring', description: 'Your GitHub token expires in 7 days — renew it now', timestamp: '12h ago', read: true },
  { id: '10', type: 'build_complete', title: 'Build Complete', description: 'Food Delivery API built in 32s', timestamp: '1d ago', read: true },
];

type FilterType = 'all' | 'deployments' | 'security' | 'system' | 'projects';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'deployments', label: 'Deployments' },
  { value: 'security', label: 'Security' },
  { value: 'system', label: 'System' },
  { value: 'projects', label: 'Projects' },
];

function matchesFilter(type: NotificationType, filter: FilterType): boolean {
  if (filter === 'all') return true;
  if (filter === 'deployments') return type === 'deployment_success' || type === 'deployment_failed' || type === 'build_complete';
  if (filter === 'security') return type === 'security_alert';
  if (filter === 'system') return type === 'system_update';
  if (filter === 'projects') return type === 'project_created' || type === 'code_review';
  return true;
}

/* ─── Notification Bell Button ─── */
interface NotificationBellProps {
  onClick: () => void;
  unreadCount?: number;
}

export function NotificationBell({ onClick, unreadCount = 0 }: NotificationBellProps) {
  return (
    <motion.button
      onClick={onClick}
      className="relative p-2 rounded-lg transition-colors"
      style={{ color: '#8b949e' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#c9d1d9';
        e.currentTarget.style.backgroundColor = 'rgba(88,166,255,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#8b949e';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{
            backgroundColor: unreadCount > 5 ? '#f85149' : '#58a6ff',
            color: 'white',
            boxShadow: '0 0 6px rgba(248,81,73,0.4)',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.span>
      )}
    </motion.button>
  );
}

/* ─── Notification Center Panel ─── */
interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesType = matchesFilter(n.type, filter);
      const matchesSearch = searchQuery.trim() === '' || 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [notifications, filter, searchQuery]);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => onOpenChange(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
            style={{ width: '400px', maxWidth: '100vw', backgroundColor: '#161b22', borderLeft: '1px solid #30363d', boxShadow: '-8px 0 30px rgba(0,0,0,0.4)' }}
          >
            {/* Header */}
            <div className="shrink-0 px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #30363d' }}>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: '#58a6ff' }} />
                <h2 className="text-sm font-semibold" style={{ color: '#e6edf3' }}>Notifications</h2>
                {unreadCount > 0 && (
                  <Badge className="h-5 px-1.5 text-[10px] font-semibold" style={{ backgroundColor: '#f85149', color: 'white' }}>
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
                    style={{ color: '#58a6ff' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(88,166,255,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded transition-colors"
                  style={{ color: '#8b949e' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#30363d'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="shrink-0 px-4 py-2 space-y-2" style={{ borderBottom: '1px solid #21262d' }}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#484f58' }} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="pl-8 h-8 text-xs"
                  style={{ backgroundColor: '#0d1117', borderColor: '#30363d', color: '#c9d1d9' }}
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto">
                <Filter className="w-3 h-3 shrink-0" style={{ color: '#484f58' }} />
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className="px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors"
                    style={{
                      backgroundColor: filter === opt.value ? 'rgba(88,166,255,0.15)' : 'transparent',
                      color: filter === opt.value ? '#58a6ff' : '#8b949e',
                      border: filter === opt.value ? '1px solid rgba(88,166,255,0.3)' : '1px solid transparent',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification List */}
            <ScrollArea className="flex-1">
              <div className="py-1">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notification, idx) => {
                    const config = TYPE_CONFIG[notification.type];
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className="group relative px-4 py-3 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: notification.read ? 'transparent' : 'rgba(88,166,255,0.04)',
                          borderBottom: '1px solid #21262d',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = notification.read ? 'rgba(33,38,45,0.3)' : 'rgba(88,166,255,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = notification.read ? 'transparent' : 'rgba(88,166,255,0.04)'; }}
                        onClick={() => markRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: config.bg }}
                          >
                            <Icon className="w-4 h-4" style={{ color: config.color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-medium leading-tight" style={{ color: notification.read ? '#8b949e' : '#e6edf3' }}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <Circle className="w-2 h-2 shrink-0 mt-1" style={{ color: '#58a6ff', fill: '#58a6ff' }} />
                              )}
                            </div>
                            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#8b949e' }}>
                              {notification.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Clock className="w-2.5 h-2.5" style={{ color: '#484f58' }} />
                              <span className="text-[10px]" style={{ color: '#484f58' }}>{notification.timestamp}</span>
                              <Badge
                                variant="outline"
                                className="h-4 px-1 text-[9px]"
                                style={{ borderColor: `${config.color}30`, color: config.color }}
                              >
                                {config.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Delete button on hover */}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all shrink-0"
                            style={{ color: '#484f58' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#f85149'; e.currentTarget.style.backgroundColor = 'rgba(248,81,73,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#484f58'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredNotifications.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-8 h-8 mx-auto mb-3" style={{ color: '#30363d' }} />
                    <p className="text-xs font-medium" style={{ color: '#8b949e' }}>
                      {searchQuery ? 'No notifications match your search' : 'No notifications'}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: '#484f58' }}>
                      {searchQuery ? 'Try a different search term' : "You're all caught up!"}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="shrink-0 px-4 py-2" style={{ borderTop: '1px solid #30363d' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-[10px] gap-1.5"
                  style={{ color: '#8b949e' }}
                  onClick={clearAll}
                >
                  <Trash2 className="w-3 h-3" /> Clear all notifications
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
