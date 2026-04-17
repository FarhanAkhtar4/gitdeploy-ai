'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore, type Notification } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Rocket,
  Wrench,
  Clock,
  GitBranch,
  Info,
  CheckCheck,
  X,
  Volume2,
  VolumeX,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Notification Priority ─── */
type NotificationPriority = 'urgent' | 'normal' | 'low';

interface EnhancedNotification extends Notification {
  priority: NotificationPriority;
  snoozedUntil?: string;
}

/* ─── Assign priorities to notifications ─── */
function getNotificationPriority(notification: Notification): NotificationPriority {
  const title = notification.title.toLowerCase();
  const desc = notification.description.toLowerCase();
  if (title.includes('failed') || title.includes('error') || title.includes('critical') || desc.includes('failed')) return 'urgent';
  if (title.includes('upcoming') || title.includes('suggestion') || title.includes('info')) return 'low';
  return 'normal';
}

/* ─── Notification Icons with animated backgrounds ─── */
const NOTIFICATION_ICONS: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string; glowColor: string }> = {
  deployment: { icon: Rocket, color: '#3fb950', bg: 'rgba(63,185,80,0.15)', glowColor: 'rgba(63,185,80,0.4)' },
  build: { icon: Wrench, color: '#58a6ff', bg: 'rgba(88,166,255,0.15)', glowColor: 'rgba(88,166,255,0.4)' },
  schedule: { icon: Clock, color: '#e3b341', bg: 'rgba(227,179,65,0.15)', glowColor: 'rgba(227,179,65,0.4)' },
  workflow: { icon: GitBranch, color: '#a371f7', bg: 'rgba(163,113,247,0.15)', glowColor: 'rgba(163,113,247,0.4)' },
  info: { icon: Info, color: '#8b949e', bg: 'rgba(139,148,158,0.15)', glowColor: 'rgba(139,148,158,0.4)' },
};

const PRIORITY_CONFIG: Record<NotificationPriority, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  urgent: { color: '#f85149', bg: 'rgba(248,81,73,0.12)', label: 'Urgent', icon: AlertTriangle },
  normal: { color: '#58a6ff', bg: 'rgba(88,166,255,0.12)', label: 'Normal', icon: Bell },
  low: { color: '#8b949e', bg: 'rgba(139,148,158,0.08)', label: 'Low', icon: Info },
};

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ─── Group notifications by time ─── */
function groupNotifications(notifications: EnhancedNotification[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 86400000);

  const groups: { label: string; notifications: EnhancedNotification[] }[] = [
    { label: 'Today', notifications: [] },
    { label: 'Yesterday', notifications: [] },
    { label: 'This Week', notifications: [] },
    { label: 'Earlier', notifications: [] },
  ];

  for (const n of notifications) {
    const d = new Date(n.timestamp);
    if (d >= today) groups[0].notifications.push(n);
    else if (d >= yesterday) groups[1].notifications.push(n);
    else if (d >= thisWeekStart) groups[2].notifications.push(n);
    else groups[3].notifications.push(n);
  }

  return groups.filter(g => g.notifications.length > 0);
}

export function NotificationsPanel() {
  const { notifications, markNotificationRead, markAllNotificationsRead, setCurrentView } = useAppStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());
  const [snoozeMenuId, setSnoozeMenuId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Today', 'Yesterday']));

  // Enhance notifications with priority and filter out snoozed
  const enhancedNotifications = useMemo(() => {
    return notifications
      .map(n => ({ ...n, priority: getNotificationPriority(n) }))
      .filter(n => {
        if (snoozedIds.has(n.id)) {
          return false;
        }
        return true;
      });
  }, [notifications, snoozedIds]);

  const unreadCount = enhancedNotifications.filter((n) => !n.read).length;

  const groups = useMemo(() => groupNotifications(enhancedNotifications), [enhancedNotifications]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const handleSnooze = (id: string) => {
    setSnoozedIds(prev => new Set(prev).add(id));
    // Auto-unsnooze after 1 hour (visual only)
    setTimeout(() => {
      setSnoozedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 3600000);
    setSnoozeMenuId(null);
  };

  const handleNotificationClick = (notification: EnhancedNotification) => {
    markNotificationRead(notification.id);
    // Navigate based on notification type
    switch (notification.type) {
      case 'deployment':
        setCurrentView('deploy');
        break;
      case 'build':
        setCurrentView('builder');
        break;
      case 'schedule':
        setCurrentView('deploy');
        break;
      case 'workflow':
        setCurrentView('deploy');
        break;
      default:
        break;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg transition-colors hover:bg-[#21262d]" style={{ color: '#8b949e' }}>
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="relative flex">
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ backgroundColor: '#f85149' }}
              >
                {unreadCount}
              </span>
              {/* Animated pulse ring */}
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping"
                style={{ backgroundColor: '#f8514940' }}
              />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 p-0 border-[#30363d] rounded-xl shadow-2xl"
        style={{ backgroundColor: '#161b22' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#30363d' }}>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: '#58a6ff' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#c9d1d9' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(248,81,73,0.15)', color: '#f85149' }}
              >
                {unreadCount} new
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Sound toggle */}
            <button
              className="p-1.5 rounded-lg transition-colors hover:bg-[#21262d]"
              style={{ color: soundEnabled ? '#58a6ff' : '#484f58' }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Sound on' : 'Sound off'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            {/* Mark all as read */}
            {unreadCount > 0 && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] gap-1 hover:bg-[#21262d]"
                  style={{ color: '#58a6ff' }}
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="w-8 h-8 mb-2" style={{ color: '#30363d' }} />
              <p className="text-xs" style={{ color: '#8b949e' }}>No notifications yet</p>
            </div>
          ) : (
            <div>
              {groups.map((group) => (
                <div key={group.label}>
                  {/* Group header */}
                  <button
                    className="w-full flex items-center gap-1.5 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors hover:bg-[#21262d]"
                    style={{ color: '#484f58', borderBottom: '1px solid #21262d' }}
                    onClick={() => toggleGroup(group.label)}
                  >
                    {expandedGroups.has(group.label) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    {group.label}
                    <span className="ml-1 font-mono" style={{ color: '#30363d' }}>
                      ({group.notifications.length})
                    </span>
                    {/* Show unread count in group */}
                    {group.notifications.filter(n => !n.read).length > 0 && (
                      <span
                        className="ml-auto text-[9px] px-1.5 py-0 rounded-full"
                        style={{ backgroundColor: '#f8514915', color: '#f85149' }}
                      >
                        {group.notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>

                  {/* Group items */}
                  <AnimatePresence>
                    {expandedGroups.has(group.label) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        {group.notifications.map((notification) => {
                          const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.info;
                          const Icon = config.icon;
                          const priorityConfig = PRIORITY_CONFIG[notification.priority];
                          const PriorityIcon = priorityConfig.icon;

                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#21262d] cursor-pointer group relative"
                              style={{
                                backgroundColor: notification.read ? 'transparent' : 'rgba(88,166,255,0.03)',
                                borderLeft: notification.read ? '2px solid transparent' : `2px solid ${config.color}`,
                                borderBottom: '1px solid #21262d',
                              }}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              {/* Icon with animated glow for urgent */}
                              <div className="relative shrink-0 mt-0.5">
                                <div
                                  className="p-1.5 rounded-lg"
                                  style={{ backgroundColor: config.bg }}
                                >
                                  <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                                </div>
                                {notification.priority === 'urgent' && !notification.read && (
                                  <motion.div
                                    className="absolute inset-0 rounded-lg"
                                    animate={{
                                      boxShadow: [`0 0 0px ${config.glowColor}`, `0 0 8px ${config.glowColor}`, `0 0 0px ${config.glowColor}`],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                  />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p
                                    className="text-xs font-medium truncate"
                                    style={{ color: notification.read ? '#8b949e' : '#c9d1d9' }}
                                  >
                                    {notification.title}
                                  </p>
                                  {/* Priority badge */}
                                  {notification.priority === 'urgent' && (
                                    <span
                                      className="text-[8px] font-bold px-1 py-0 rounded-full shrink-0 flex items-center gap-0.5"
                                      style={{ backgroundColor: priorityConfig.bg, color: priorityConfig.color }}
                                    >
                                      <PriorityIcon className="w-2 h-2" />
                                      {priorityConfig.label}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] mt-0.5 truncate" style={{ color: '#8b949e' }}>
                                  {notification.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[10px]" style={{ color: '#484f58' }}>
                                    {formatTimeAgo(notification.timestamp)}
                                  </p>
                                  {notification.priority !== 'urgent' && (
                                    <span
                                      className="text-[8px] px-1 py-0 rounded-full"
                                      style={{ backgroundColor: priorityConfig.bg, color: priorityConfig.color }}
                                    >
                                      {priorityConfig.label}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right side: unread dot + snooze */}
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {!notification.read && (
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: config.color }}
                                  />
                                )}
                                {/* Snooze button */}
                                <div className="relative">
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[#30363d]"
                                    style={{ color: '#484f58' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSnoozeMenuId(snoozeMenuId === notification.id ? null : notification.id);
                                    }}
                                    title="Snooze notification"
                                  >
                                    <EyeOff className="w-3 h-3" />
                                  </button>
                                  {/* Snooze dropdown */}
                                  {snoozeMenuId === notification.id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      className="absolute right-0 top-full mt-1 w-40 rounded-lg border shadow-xl z-30 overflow-hidden"
                                      style={{ backgroundColor: '#0d1117', borderColor: '#30363d' }}
                                    >
                                      <div className="px-3 py-1.5 text-[9px] font-semibold uppercase" style={{ color: '#484f58', borderBottom: '1px solid #21262d' }}>
                                        Snooze for...
                                      </div>
                                      {[
                                        { label: '1 hour', ms: 3600000 },
                                        { label: '2 hours', ms: 7200000 },
                                        { label: 'Until tomorrow', ms: 86400000 },
                                      ].map((opt) => (
                                        <button
                                          key={opt.label}
                                          className="w-full text-left px-3 py-1.5 text-[11px] transition-colors hover:bg-[#21262d]"
                                          style={{ color: '#8b949e' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSnooze(notification.id);
                                          }}
                                        >
                                          <Clock className="w-3 h-3 inline mr-1.5" style={{ color: '#e3b341' }} />
                                          {opt.label}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Snoozed indicator */}
              {snoozedIds.size > 0 && (
                <div
                  className="px-4 py-2 text-[10px] flex items-center gap-1.5"
                  style={{ color: '#484f58', backgroundColor: '#0d1117', borderTop: '1px solid #21262d' }}
                >
                  <EyeOff className="w-3 h-3" />
                  {snoozedIds.size} notification{snoozedIds.size > 1 ? 's' : ''} snoozed
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: '#30363d' }}>
          <p className="text-[10px]" style={{ color: '#484f58' }}>
            Click a notification to navigate · Snooze to dismiss temporarily
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
