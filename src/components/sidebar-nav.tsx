'use client';

import React from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Rocket,
  Wrench,
  Globe,
  MessageSquare,
  Settings,
  Github,
  ChevronLeft,
  ChevronRight,
  Zap,
  Menu,
  Crown,
  Keyboard,
} from 'lucide-react';
import { useAppStore, type AppView } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationsPanel } from '@/components/notifications-panel';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS: Array<{ view: AppView; label: string; icon: React.ElementType; badge?: string; desc?: string; unread?: number; shortcut?: string }> = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Stats & activity', shortcut: '⌘1' },
  { view: 'builder', label: 'Project Builder', icon: Wrench, badge: 'AI', desc: 'Build with AI', shortcut: '⌘2' },
  { view: 'deploy', label: 'Deploy', icon: Rocket, desc: 'GitHub deploy', shortcut: '⌘3' },
  { view: 'hosting', label: 'Hosting', icon: Globe, badge: 'Free', desc: 'Free tiers', shortcut: '⌘4' },
  { view: 'chat', label: 'AI Assistant', icon: MessageSquare, desc: 'Get help', unread: 3, shortcut: '⌘5' },
  { view: 'settings', label: 'Settings', icon: Settings, desc: 'Account', shortcut: '⌘6' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen, githubUser, isGithubConnected } = useAppStore();

  const handleNav = (view: AppView) => {
    setCurrentView(view);
    onNavigate?.();
  };

  return (
    <div
      className="flex flex-col h-full border-r relative noise-bg"
      style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
    >
      {/* Gradient mesh background behind sidebar */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 300px 200px at 0% 0%, rgba(88, 166, 255, 0.04), transparent)',
            'radial-gradient(ellipse 250px 180px at 100% 100%, rgba(63, 185, 80, 0.03), transparent)',
            'radial-gradient(ellipse 200px 150px at 50% 50%, rgba(163, 113, 247, 0.02), transparent)',
          ].join(', '),
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b relative z-10" style={{ borderColor: '#30363d' }}>
        <div
          className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shrink-0 animate-float-gentle"
          style={{ background: 'linear-gradient(135deg, #58a6ff, #3fb950)' }}
        >
          <Image
            src="/logo_gitdeploy.jpg"
            alt="GitDeploy AI"
            width={36}
            height={36}
            className="object-cover w-full h-full"
          />
          {/* Subtle glow ring around logo */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              boxShadow: '0 0 12px rgba(88, 166, 255, 0.3), 0 0 24px rgba(63, 185, 80, 0.15)',
            }}
          />
        </div>
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <span
                className="font-bold text-sm tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #58a6ff, #3fb950)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                GitDeploy AI
              </span>
              <span className="text-[10px]" style={{ color: '#8b949e' }}>
                Build · Deploy · Host
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto custom-scrollbar relative z-10">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;

          const navButton = (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              aria-label={item.label}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group relative ${
                isActive
                  ? 'text-[#58a6ff]'
                  : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
              }`}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(88,166,255,0.12), rgba(63,185,80,0.06))',
              } : undefined}
            >
              {/* Animated active indicator — glowing bar on the left side */}
              {isActive && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                  style={{
                    width: 3,
                    background: 'linear-gradient(180deg, #58a6ff, #3fb950)',
                    boxShadow: '0 0 12px rgba(88, 166, 255, 0.5), 0 0 24px rgba(88, 166, 255, 0.2)',
                  }}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '60%', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {/* Pulsing glow overlay */}
                  <motion.div
                    className="absolute inset-0 rounded-r"
                    style={{
                      boxShadow: '0 0 8px rgba(88, 166, 255, 0.6)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 8px rgba(88, 166, 255, 0.6)',
                        '0 0 16px rgba(88, 166, 255, 0.3)',
                        '0 0 8px rgba(88, 166, 255, 0.6)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              )}

              {/* Nav icon with glow for active state */}
              <div className="relative">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#58a6ff]' : 'group-hover:text-[#c9d1d9]'
                  }`}
                />
                {/* Active icon glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-md"
                    style={{
                      background: 'radial-gradient(circle, rgba(88, 166, 255, 0.2), transparent)',
                    }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>

              {sidebarOpen && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                    {isActive && item.desc && (
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: '#8b949e' }}>{item.desc}</p>
                    )}
                  </div>
                  {item.badge && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: item.badge === 'AI' ? 'rgba(88,166,255,0.15)' : 'rgba(63,185,80,0.15)',
                        color: item.badge === 'AI' ? '#58a6ff' : '#3fb950',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {/* Keyboard shortcut hint — shown on hover */}
                  {item.shortcut && !isActive && (
                    <span
                      className="text-[9px] font-mono px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        backgroundColor: '#21262d',
                        color: '#484f58',
                        border: '1px solid #30363d',
                      }}
                    >
                      {item.shortcut}
                    </span>
                  )}
                  {/* Unread notification dot */}
                  {item.unread && !isActive ? (
                    <span className="relative flex items-center justify-center">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{ backgroundColor: 'rgba(248,81,73,0.15)', color: '#f85149' }}
                      >
                        {item.unread}
                      </span>
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: '#f85149' }}
                      />
                    </span>
                  ) : null}
                </>
              )}
              {/* Collapsed mode notification dot */}
              {!sidebarOpen && item.unread ? (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 animate-pulse"
                  style={{ backgroundColor: '#f85149', borderColor: '#161b22' }}
                />
              ) : null}
            </button>
          );

          if (!sidebarOpen) {
            return (
              <Tooltip key={item.view}>
                <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-[#1c2128] text-[#c9d1d9] border-[#30363d] text-xs flex items-center gap-3 px-3 py-2"
                  style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)' }}
                >
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#30363d', color: '#8b949e' }}>
                      {item.shortcut}
                    </span>
                  )}
                  {item.unread ? (
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                      style={{ backgroundColor: 'rgba(248,81,73,0.15)', color: '#f85149' }}
                    >
                      {item.unread}
                    </span>
                  ) : null}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <React.Fragment key={item.view}>{navButton}</React.Fragment>;
        })}
      </nav>

      {/* User Info & Plan */}
      <div className="px-2 py-3 border-t relative z-10" style={{ borderColor: '#30363d' }}>
        {/* Quick Actions Row */}
        {sidebarOpen && (
          <div className="flex items-center justify-end gap-1 mb-2">
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-1.5 rounded-lg transition-colors hover:bg-[#21262d] focus-ring-glow"
                  style={{ color: '#484f58' }}
                  onClick={() => useAppStore.getState().setCommandPaletteOpen(true)}
                  aria-label="Command Palette (⌘K)"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-[#1c2128] text-[#c9d1d9] border-[#30363d] text-[10px] px-2 py-1"
              >
                Command Palette · ⌘K
              </TooltipContent>
            </Tooltip>
            <NotificationsPanel />
          </div>
        )}
        {!sidebarOpen && (
          <div className="flex items-center justify-center gap-1 mb-2">
            <ThemeToggle />
            <NotificationsPanel />
          </div>
        )}
        {isGithubConnected && githubUser ? (
          <button
            onClick={() => handleNav('settings')}
            className={`flex items-center gap-2 w-full rounded-lg px-2 py-2 transition-colors hover:bg-[#21262d] focus-ring-glow ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <div className="relative">
              {/* Animated gradient ring around avatar — rotating */}
              <motion.div
                className="rounded-full p-[2.5px]"
                style={{ background: 'conic-gradient(from 0deg, #58a6ff, #3fb950, #e3b341, #f85149, #a371f7, #58a6ff)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                <Avatar className="w-8 h-8 border-2" style={{ borderColor: '#161b22' }}>
                  <AvatarImage src={githubUser.avatar_url} alt={githubUser.login} />
                  <AvatarFallback style={{ backgroundColor: '#30363d' }}>
                    <Github className="w-3.5 h-3.5" style={{ color: '#c9d1d9' }} />
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              {/* Online indicator — pulsing green */}
              <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center">
                <span
                  className="absolute w-3 h-3 rounded-full animate-ping"
                  style={{ backgroundColor: 'rgba(63, 185, 80, 0.4)' }}
                />
                <span
                  className="relative w-3 h-3 rounded-full border-2"
                  style={{ backgroundColor: '#3fb950', borderColor: '#161b22' }}
                />
              </span>
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium truncate" style={{ color: '#c9d1d9' }}>
                    {githubUser.login}
                  </p>
                  {/* PRO badge with shimmer animation */}
                  <span
                    className="text-[8px] font-bold px-1.5 py-0 rounded-full flex items-center gap-0.5 shrink-0 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(227,179,65,0.2), rgba(88,166,255,0.2))',
                      color: '#e3b341',
                      border: '1px solid rgba(227,179,65,0.3)',
                    }}
                  >
                    <Crown className="w-2.5 h-2.5" /> PRO
                    {/* Shimmer sweep */}
                    <span
                      className="absolute inset-0 pro-badge-shimmer"
                      style={{ borderRadius: 'inherit' }}
                    />
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {/* Animated green pulsing dot for GitHub connected */}
                  <span className="relative flex items-center justify-center">
                    <span
                      className="absolute w-1.5 h-1.5 rounded-full animate-ping"
                      style={{ backgroundColor: 'rgba(63, 185, 80, 0.5)' }}
                    />
                    <span
                      className="relative w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#3fb950' }}
                    />
                  </span>
                  <p className="text-[10px]" style={{ color: '#8b949e' }}>
                    GitHub Connected · {githubUser.public_repos} repos
                  </p>
                </div>
              </motion.div>
            )}
          </button>
        ) : (
          <button
            onClick={() => handleNav('onboarding')}
            className={`flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-[#21262d] focus-ring-glow ${!sidebarOpen ? 'justify-center' : ''}`}
            style={{ color: '#8b949e' }}
          >
            <Github className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Connect GitHub</span>}
          </button>
        )}
      </div>

      {/* Collapse Toggle — desktop only */}
      <div className="hidden md:block px-2 py-2 border-t relative z-10" style={{ borderColor: '#30363d' }}>
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-8 hover:bg-[#21262d] focus-ring-glow"
          style={{ color: '#8b949e' }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {sidebarOpen ? (
              <motion.div
                key="collapse"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div
                key="expand"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
}

export function SidebarNav() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              className="p-2 rounded-lg focus-ring-glow"
              style={{ backgroundColor: '#161b22', color: '#c9d1d9' }}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-[#30363d] bg-[#161b22]">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Main navigation sidebar</SheetDescription>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar — smooth collapse/expand animation */}
      <TooltipProvider delayDuration={0}>
        <motion.div
          className="hidden md:flex"
          animate={{ width: sidebarOpen ? 272 : 64 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ overflow: 'hidden' }}
        >
          <SidebarContent />
        </motion.div>
      </TooltipProvider>
    </>
  );
}
