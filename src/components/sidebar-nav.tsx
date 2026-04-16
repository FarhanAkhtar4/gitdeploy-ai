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
} from 'lucide-react';
import { useAppStore, type AppView } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const NAV_ITEMS: Array<{ view: AppView; label: string; icon: React.ElementType; badge?: string; desc?: string }> = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & stats' },
  { view: 'builder', label: 'Project Builder', icon: Wrench, badge: 'AI', desc: 'Build with AI' },
  { view: 'deploy', label: 'Deploy', icon: Rocket, desc: 'Push to GitHub' },
  { view: 'hosting', label: 'Hosting', icon: Globe, badge: 'Free', desc: 'Free hosting options' },
  { view: 'chat', label: 'AI Assistant', icon: MessageSquare, desc: 'Ask anything' },
  { view: 'settings', label: 'Settings', icon: Settings, desc: 'Account & config' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen, githubUser, isGithubConnected } = useAppStore();

  const handleNav = (view: AppView) => {
    setCurrentView(view);
    onNavigate?.();
  };

  return (
    <div
      className="flex flex-col h-full border-r"
      style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b" style={{ borderColor: '#30363d' }}>
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shrink-0" style={{ background: 'linear-gradient(135deg, #58a6ff, #3fb950)' }}>
          <Image
            src="/logo-gitdeploy.png"
            alt="GitDeploy AI"
            width={36}
            height={36}
            className="object-cover"
          />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-[#58a6ff] to-[#3fb950] bg-clip-text text-transparent">
              GitDeploy AI
            </span>
            <span className="text-[10px]" style={{ color: '#8b949e' }}>
              Build · Deploy · Host
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;

          const navButton = (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group relative ${
                isActive
                  ? 'bg-[#30363d] text-[#58a6ff] shadow-sm shadow-[#58a6ff10]'
                  : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r" style={{ backgroundColor: '#58a6ff' }} />
              )}
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#58a6ff]' : 'group-hover:text-[#c9d1d9]'}`} />
              {sidebarOpen && (
                <>
                  <div className="flex-1 text-left">
                    <span>{item.label}</span>
                    {isActive && item.desc && (
                      <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>{item.desc}</p>
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
                </>
              )}
            </button>
          );

          if (!sidebarOpen) {
            return (
              <Tooltip key={item.view}>
                <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                <TooltipContent side="right" className="bg-[#161b22] text-[#c9d1d9] border-[#30363d] text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <React.Fragment key={item.view}>{navButton}</React.Fragment>;
        })}
      </nav>

      {/* GitHub Connection */}
      <div className="px-2 py-3 border-t" style={{ borderColor: '#30363d' }}>
        {isGithubConnected && githubUser ? (
          <button
            onClick={() => handleNav('settings')}
            className={`flex items-center gap-2 w-full rounded-lg px-2 py-2 transition-colors hover:bg-[#21262d] ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <Avatar className="w-8 h-8 ring-2 ring-[#238636]">
              <AvatarImage src={githubUser.avatar_url} alt={githubUser.login} />
              <AvatarFallback style={{ backgroundColor: '#30363d' }}>
                <Github className="w-3.5 h-3.5" style={{ color: '#c9d1d9' }} />
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#c9d1d9' }}>
                  {githubUser.login}
                </p>
                <p className="text-[10px]" style={{ color: '#8b949e' }}>
                  {githubUser.plan?.name || 'free'} plan • {githubUser.public_repos} repos
                </p>
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={() => handleNav('onboarding')}
            className={`flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-[#21262d] ${!sidebarOpen ? 'justify-center' : ''}`}
            style={{ color: '#8b949e' }}
          >
            <Github className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Connect GitHub</span>}
          </button>
        )}
      </div>

      {/* Collapse Toggle — desktop only */}
      <div className="hidden md:block px-2 py-2 border-t" style={{ borderColor: '#30363d' }}>
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-8 hover:bg-[#21262d]"
          style={{ color: '#8b949e' }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
            <button className="p-2 rounded-lg" style={{ backgroundColor: '#161b22', color: '#c9d1d9' }}>
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-[#30363d] bg-[#161b22]">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <TooltipProvider delayDuration={0}>
        <div
          className={`hidden md:flex transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          <SidebarContent />
        </div>
      </TooltipProvider>
    </>
  );
}
