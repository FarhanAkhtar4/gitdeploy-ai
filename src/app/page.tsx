'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore, type AppView } from '@/store/app-store';
import { SidebarNav } from '@/components/sidebar-nav';
import { DashboardView } from '@/components/dashboard-view';
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { BuilderView } from '@/components/builder-view';
import { DeployView } from '@/components/deploy-view';
import { HostingView } from '@/components/hosting-view';
import { ChatView } from '@/components/chat-view';
import { SettingsView } from '@/components/settings-view';
import { CommandPalette } from '@/components/command-palette';
import { FileViewer } from '@/components/file-viewer';
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts';
import { NotificationCenter, NotificationBell } from '@/components/notification-center';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Hammer,
  Rocket,
  Globe,
  MessageCircle,
  Settings,
  ArrowLeft,
  Sparkles,
  Plus,
  X,
} from 'lucide-react';

/* ============================================================
   Floating Action Button (FAB) Component
   ============================================================ */
function FloatingActionButton({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  // Show FAB only when scrolled down past first viewport
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Also check initial scroll
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ⌘N keyboard shortcut to toggle FAB
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        // The global shortcut already handles ⌘N for navigation,
        // so we don't need to duplicate here
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const actions = [
    { label: 'New Project', icon: Hammer, color: '#58a6ff', view: 'builder' as AppView },
    { label: 'Quick Deploy', icon: Rocket, color: '#3fb950', view: 'deploy' as AppView },
    { label: 'Ask AI', icon: MessageCircle, color: '#a371f7', view: 'chat' as AppView },
    { label: 'View Hosting', icon: Globe, color: '#e3b341', view: 'hosting' as AppView },
  ];

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {expanded && actions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ delay: i * 0.05, duration: 0.2, ease: 'easeOut' }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-lg transition-colors"
            style={{
              backgroundColor: '#21262d',
              color: action.color,
              border: `1px solid ${action.color}30`,
            }}
            onClick={() => {
              onNavigate(action.view);
              setExpanded(false);
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#30363d';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#21262d';
            }}
          >
            <action.icon className="w-3.5 h-3.5" />
            {action.label}
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl"
        style={{
          background: expanded
            ? 'linear-gradient(135deg, #f85149, #da3633)'
            : 'linear-gradient(135deg, #58a6ff, #238636)',
          boxShadow: expanded
            ? '0 0 20px rgba(248,81,73,0.3)'
            : '0 0 20px rgba(88,166,255,0.25), 0 0 40px rgba(35,134,54,0.15)',
        }}
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: expanded ? 45 : 0 }}
        transition={{ duration: 0.2 }}
        aria-label={expanded ? 'Close quick actions' : 'Open quick actions'}
      >
        {expanded ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Plus className="w-5 h-5 text-white" />
        )}
      </motion.button>
    </div>
  );
}

/* ============================================================
   Main Application Component
   ============================================================ */
export default function GitDeployAI() {
  const {
    currentView,
    isGithubConnected,
    selectedProject,
    setKeyboardShortcutsOpen,
    setCommandPaletteOpen,
    setCurrentView,
    notifications,
    setUser,
    setGithubUser,
    setIsGithubConnected,
    setProjects,
    user,
  } = useAppStore();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // Session restore on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedUserId = localStorage.getItem('gitdeploy_user_id');
        if (!savedUserId) {
          setCurrentView('onboarding');
          setSessionLoading(false);
          return;
        }

        const res = await fetch('/api/user', {
          headers: { 'x-user-id': savedUserId },
        });

        if (res.status === 401 || res.status === 404) {
          localStorage.removeItem('gitdeploy_user_id');
          setCurrentView('onboarding');
          setSessionLoading(false);
          return;
        }

        const data = await res.json();

        if (data.error || !data.user) {
          localStorage.removeItem('gitdeploy_user_id');
          setCurrentView('onboarding');
          setSessionLoading(false);
          return;
        }

        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          plan: data.user.plan,
        });

        if (data.github?.connected) {
          setIsGithubConnected(true);
          setGithubUser({
            login: data.user.github_username || '',
            avatar_url: data.user.avatar_url || '',
            public_repos: 0,
            plan: { name: data.user.plan || 'free' },
            scopes: (data.github.scopes || '').split(',').filter(Boolean),
          });
        }

        // Fetch real projects
        try {
          const projRes = await fetch('/api/projects/list', {
            headers: { 'x-user-id': data.user.id },
          });
          const projData = await projRes.json();
          if (projData.projects) {
            setProjects(projData.projects.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              name: p.name as string,
              description: p.description as string,
              githubRepoUrl: p.github_repo_url as string | null,
              liveUrl: p.live_url as string | null,
              framework: p.framework as string,
              stackJson: p.stack_json as string,
              defaultBranch: (p.default_branch as string) || 'main',
              status: (p.status as string) || 'not_deployed',
              createdAt: p.created_at as string,
              updatedAt: p.updated_at as string,
              files: (p.files as Array<Record<string, unknown>>)?.map((f: Record<string, unknown>) => ({
                id: f.id as string,
                filePath: f.file_path as string,
                content: f.content as string,
                githubSha: f.github_sha as string | null,
                lastPushedAt: f.last_pushed_at as string | null,
                sizeBytes: f.size_bytes as number,
              })) || [],
              deployments: (p.deployments as Array<Record<string, unknown>>)?.map((d: Record<string, unknown>) => ({
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
            })));
          }
        } catch {
          // Project fetch failure is non-fatal
        }

        setCurrentView('dashboard');
      } catch {
        setCurrentView('onboarding');
      } finally {
        setSessionLoading(false);
      }
    }
    restoreSession();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // ? key — open keyboard shortcuts
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setKeyboardShortcutsOpen(true);
      }

      // Cmd/Ctrl + K — command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      // Cmd/Ctrl + N — new project
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setCurrentView('builder');
      }

      // Cmd/Ctrl + D — deploy
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedProject) {
          setCurrentView('deploy');
        }
      }

      // Cmd/Ctrl + 1-6 — navigate views
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const views: AppView[] = ['dashboard', 'builder', 'deploy', 'hosting', 'chat', 'settings'];
        const index = parseInt(e.key) - 1;
        if (views[index]) {
          setCurrentView(views[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setKeyboardShortcutsOpen, setCommandPaletteOpen, setCurrentView, selectedProject]);

  // Breadcrumb header view metadata
  const viewMeta: Record<AppView, { label: string; description: string; icon: React.ElementType; shortcut: string }> = {
    dashboard: { label: 'Dashboard', description: 'Stats & activity', icon: LayoutDashboard, shortcut: '⌘1' },
    onboarding: { label: 'Setup', description: 'Get started', icon: Sparkles, shortcut: '' },
    builder: { label: 'Builder', description: 'Build with AI', icon: Hammer, shortcut: '⌘2' },
    deploy: { label: 'Deploy', description: 'Ship to production', icon: Rocket, shortcut: '⌘3' },
    hosting: { label: 'Hosting', description: 'Find free hosting', icon: Globe, shortcut: '⌘4' },
    chat: { label: 'Chat', description: 'AI assistant', icon: MessageCircle, shortcut: '⌘5' },
    settings: { label: 'Settings', description: 'Configure account', icon: Settings, shortcut: '⌘6' },
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'onboarding':
        return <OnboardingWizard />;
      case 'builder':
        return <BuilderView />;
      case 'deploy':
        return <DeployView />;
      case 'hosting':
        return <HostingView />;
      case 'chat':
        return <ChatView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ backgroundColor: '#0d1117' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #58a6ff, #3fb950)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                   style={{ backgroundColor: '#58a6ff',
                            animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0d1117' }}>
      {/* Main Layout */}
      <div className="flex flex-1 min-h-0">
        <SidebarNav />

        {/* Right column: breadcrumb header + main content */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Breadcrumb Navigation Header */}
          <AnimatePresence mode="wait">
            <motion.header
              key={currentView}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex items-center justify-between px-4 md:px-6 py-3 relative shrink-0"
              style={{
                backgroundColor: '#161b22',
                borderBottom: '1px solid #30363d',
              }}
            >
              {/* Left: back link + view name + description */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Back link when not on dashboard */}
                {currentView !== 'dashboard' && currentView !== 'onboarding' && (
                  <motion.button
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setCurrentView('dashboard')}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors duration-150 shrink-0"
                    style={{ color: '#8b949e' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#58a6ff';
                      e.currentTarget.style.backgroundColor = 'rgba(88, 166, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#8b949e';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Back</span>
                  </motion.button>
                )}

                {/* Separator */}
                {currentView !== 'dashboard' && currentView !== 'onboarding' && (
                  <div className="w-px h-4 shrink-0" style={{ backgroundColor: '#30363d' }} />
                )}

                {/* View icon + name */}
                <div className="flex items-center gap-2 min-w-0">
                  {(() => {
                    const meta = viewMeta[currentView];
                    const Icon = meta.icon;
                    return (
                      <>
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: 'rgba(88, 166, 255, 0.1)' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: '#58a6ff' }} />
                        </div>
                        <div className="min-w-0">
                          <h1 className="text-sm font-semibold leading-tight" style={{ color: '#c9d1d9' }}>
                            {meta.label}
                          </h1>
                          <p className="text-[11px] leading-tight truncate" style={{ color: '#8b949e' }}>
                            {meta.description}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Right: notification bell + keyboard shortcut hints */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Notification Bell */}
                <NotificationBell
                  onClick={() => setNotificationOpen(true)}
                  unreadCount={unreadNotificationCount}
                />

                {/* Keyboard shortcut hints — hidden on mobile */}
                <div className="hidden md:flex items-center gap-3">
                  {viewMeta[currentView].shortcut && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]" style={{ color: '#484f58' }}>Navigate</span>
                      <kbd
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                        style={{ borderColor: '#30363d', backgroundColor: '#21262d', color: '#8b949e' }}
                      >
                        {viewMeta[currentView].shortcut}
                      </kbd>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: '#484f58' }}>Search</span>
                    <kbd
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                      style={{ borderColor: '#30363d', backgroundColor: '#21262d', color: '#8b949e' }}
                    >
                      ⌘K
                    </kbd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: '#484f58' }}>Shortcuts</span>
                    <kbd
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                      style={{ borderColor: '#30363d', backgroundColor: '#21262d', color: '#8b949e' }}
                    >
                      ?
                    </kbd>
                  </div>
                </div>
              </div>
            </motion.header>
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto min-w-0 gradient-mesh smooth-scroll" style={{ backgroundColor: '#0d1117' }}>
            <div className="p-4 md:p-6 pb-24 md:pb-6 relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* Sticky Footer */}
      <footer
        className="mt-auto px-4 md:px-6 py-3 relative"
        style={{ backgroundColor: '#161b22' }}
      >
        {/* Gradient top border */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #58a6ff, #3fb950, #e3b341, transparent)' }}
        />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3fb950' }} />
            <p className="text-xs" style={{ color: '#484f58' }}>
              GitDeploy AI — Build any project with AI, deploy to GitHub, host for free
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] hidden sm:inline" style={{ color: '#484f58' }}>
              Press <kbd className="px-1 py-0.5 rounded text-[9px] font-mono border" style={{ borderColor: '#30363d', backgroundColor: '#21262d' }}>⌘K</kbd> to search · <kbd className="px-1 py-0.5 rounded text-[9px] font-mono border" style={{ borderColor: '#30363d', backgroundColor: '#21262d' }}>?</kbd> for shortcuts
            </span>
            <span className="text-[10px]" style={{ color: '#484f58' }}>
              Powered by AI
            </span>
            <span className="text-[10px]" style={{ color: '#484f58' }}>
              © 2025 GitDeploy AI
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <FloatingActionButton onNavigate={setCurrentView} />

      {/* Global Overlays */}
      <CommandPalette />
      <FileViewer />
      <KeyboardShortcuts />
      <NotificationCenter open={notificationOpen} onOpenChange={setNotificationOpen} />
    </div>
  );
}
