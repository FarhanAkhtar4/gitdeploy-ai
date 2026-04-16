'use client';

import React, { useEffect } from 'react';
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
} from 'lucide-react';

export default function GitDeployAI() {
  const {
    currentView,
    isGithubConnected,
    selectedProject,
    setKeyboardShortcutsOpen,
    setCommandPaletteOpen,
    setCurrentView,
  } = useAppStore();

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

              {/* Right: keyboard shortcut hints */}
              <div className="hidden md:flex items-center gap-3 shrink-0">
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
              Powered by z-ai-web-dev-sdk
            </span>
            <span className="text-[10px]" style={{ color: '#484f58' }}>
              © 2025 GitDeploy AI
            </span>
          </div>
        </div>
      </footer>

      {/* Global Overlays */}
      <CommandPalette />
      <FileViewer />
      <KeyboardShortcuts />
    </div>
  );
}
