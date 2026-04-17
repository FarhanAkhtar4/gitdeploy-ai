'use client';

import React, { useEffect } from 'react';
import { useAppStore, type AppView } from '@/store/app-store';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Wrench,
  Rocket,
  Globe,
  MessageSquare,
  Settings,
  Plus,
  Github,
  LayoutTemplate,
  Clock,
  FileCode,
  Search,
} from 'lucide-react';

const NAV_ITEMS: Array<{ view: AppView; label: string; icon: React.ElementType; shortcut?: string }> = [
  { view: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, shortcut: '⌘1' },
  { view: 'builder', label: 'Open Project Builder', icon: Wrench, shortcut: '⌘2' },
  { view: 'deploy', label: 'Open Deploy', icon: Rocket, shortcut: '⌘3' },
  { view: 'hosting', label: 'Open Hosting Advisor', icon: Globe, shortcut: '⌘4' },
  { view: 'chat', label: 'Open AI Assistant', icon: MessageSquare, shortcut: '⌘5' },
  { view: 'settings', label: 'Open Settings', icon: Settings, shortcut: '⌘6' },
];

const ACTIONS = [
  { id: 'new-project', label: 'Create New Project', icon: Plus, desc: 'Start building with AI' },
  { id: 'connect-github', label: 'Connect GitHub', icon: Github, desc: 'Set up your GitHub token' },
  { id: 'templates', label: 'Browse Templates', icon: LayoutTemplate, desc: 'Quick start with a template' },
  { id: 'schedule', label: 'Schedule Deployment', icon: Clock, desc: 'Set up automated deploys' },
  { id: 'workflow', label: 'View Workflow Template', icon: FileCode, desc: 'GitHub Actions YAML' },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setCurrentView, projects } = useAppStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const runAction = (actionId: string) => {
    setCommandPaletteOpen(false);
    switch (actionId) {
      case 'new-project':
        setCurrentView('builder');
        break;
      case 'connect-github':
        setCurrentView('onboarding');
        break;
      case 'templates':
        setCurrentView('builder');
        break;
      case 'schedule':
        setCurrentView('deploy');
        break;
      case 'workflow':
        setCurrentView('deploy');
        break;
    }
  };

  const navigateTo = (view: AppView) => {
    setCommandPaletteOpen(false);
    setCurrentView(view);
  };

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <CommandInput placeholder="Search views, actions, projects..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.view}
                onSelect={() => navigateTo(item.view)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: '#58a6ff' }} />
                <span className="flex-1 text-sm">{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut className="text-xs">{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup heading="Actions">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.id}
                onSelect={() => runAction(action.id)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: '#3fb950' }} />
                <div className="flex-1">
                  <span className="text-sm">{action.label}</span>
                  <p className="text-xs" style={{ color: '#8b949e' }}>{action.desc}</p>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* Recent Projects */}
        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Projects">
              {projects.slice(0, 5).map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => {
                    setCommandPaletteOpen(false);
                    setCurrentView('builder');
                  }}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <FileCode className="w-4 h-4 shrink-0" style={{ color: '#e3b341' }} />
                  <div className="flex-1">
                    <span className="text-sm">{project.name}</span>
                    <p className="text-xs" style={{ color: '#8b949e' }}>
                      {project.framework} • {project.status}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Help */}
        <CommandGroup heading="Help">
          <CommandItem
            onSelect={() => {
              setCommandPaletteOpen(false);
              setCurrentView('chat');
            }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: '#8b949e' }} />
            <span className="text-sm">Ask AI Assistant</span>
            <CommandShortcut>⌘⇧A</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
