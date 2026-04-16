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

const NAV_ITEMS: Array<{ view: AppView; label: string; icon: React.ElementType; badge?: string }> = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'builder', label: 'Project Builder', icon: Wrench, badge: 'AI' },
  { view: 'deploy', label: 'Deploy', icon: Rocket },
  { view: 'hosting', label: 'Hosting', icon: Globe, badge: 'Free' },
  { view: 'chat', label: 'AI Assistant', icon: MessageSquare },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export function SidebarNav() {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen, githubUser, isGithubConnected } = useAppStore();

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={`flex flex-col h-full border-r transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
        style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-4 border-b" style={{ borderColor: '#30363d' }}>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shrink-0" style={{ backgroundColor: '#58a6ff' }}>
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
              <span className="font-bold text-sm tracking-tight" style={{ color: '#c9d1d9' }}>
                GitDeploy AI
              </span>
              <span className="text-[10px]" style={{ color: '#8b949e' }}>
                Build · Deploy · Host
              </span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            const button = (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-[#30363d] text-[#58a6ff] shadow-sm'
                    : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#58a6ff]' : ''}`} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
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
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#161b22] text-[#c9d1d9] border-[#30363d] text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <React.Fragment key={item.view}>{button}</React.Fragment>;
          })}
        </nav>

        {/* Quick Actions */}
        {sidebarOpen && (
          <div className="px-3 py-2">
            <button
              onClick={() => setCurrentView('builder')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: '#238636', color: 'white' }}
            >
              <Zap className="w-3.5 h-3.5" /> New Project
            </button>
          </div>
        )}

        {/* GitHub Connection */}
        <div className="px-2 py-3 border-t" style={{ borderColor: '#30363d' }}>
          {isGithubConnected && githubUser ? (
            <div className={`flex items-center gap-2 ${sidebarOpen ? 'px-2' : 'justify-center'}`}>
              <Avatar className="w-8 h-8 ring-2 ring-[#30363d]">
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
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={`w-full ${sidebarOpen ? 'gap-2' : 'px-0 justify-center'}`}
              style={{ color: '#8b949e' }}
              onClick={() => setCurrentView('onboarding')}
            >
              <Github className="w-4 h-4" />
              {sidebarOpen && <span>Connect GitHub</span>}
            </Button>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="px-2 py-2 border-t" style={{ borderColor: '#30363d' }}>
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
    </TooltipProvider>
  );
}
