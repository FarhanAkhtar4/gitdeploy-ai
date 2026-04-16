'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Keyboard,
  Search,
  Navigation,
  Zap,
  Info,
} from 'lucide-react';

interface ShortcutGroup {
  title: string;
  icon: React.ElementType;
  color: string;
  shortcuts: Array<{ keys: string; description: string }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    icon: Navigation,
    color: '#58a6ff',
    shortcuts: [
      { keys: '⌘ 1', description: 'Go to Dashboard' },
      { keys: '⌘ 2', description: 'Open Project Builder' },
      { keys: '⌘ 3', description: 'Open Deploy' },
      { keys: '⌘ 4', description: 'Open Hosting Advisor' },
      { keys: '⌘ 5', description: 'Open AI Assistant' },
      { keys: '⌘ 6', description: 'Open Settings' },
      { keys: '⌘ K', description: 'Open Command Palette' },
    ],
  },
  {
    title: 'Actions',
    icon: Zap,
    color: '#3fb950',
    shortcuts: [
      { keys: '⌘ N', description: 'Create New Project' },
      { keys: '⌘ D', description: 'Quick Deploy' },
      { keys: '⌘ E', description: 'Manage Env Variables' },
      { keys: '⌘ ⇧ A', description: 'Ask AI Assistant' },
      { keys: '⌘ ⇧ S', description: 'Toggle Sidebar' },
    ],
  },
  {
    title: 'General',
    icon: Info,
    color: '#e3b341',
    shortcuts: [
      { keys: '?', description: 'Show Keyboard Shortcuts' },
      { keys: 'Esc', description: 'Close Dialog / Modal' },
      { keys: 'Enter', description: 'Submit / Confirm' },
    ],
  },
];

export function KeyboardShortcuts() {
  const { keyboardShortcutsOpen, setKeyboardShortcutsOpen } = useAppStore();
  const [search, setSearch] = useState('');

  // Listen for ? key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setKeyboardShortcutsOpen(!keyboardShortcutsOpen);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcutsOpen, setKeyboardShortcutsOpen]);

  const filteredGroups = search.trim()
    ? SHORTCUT_GROUPS.map((group) => ({
        ...group,
        shortcuts: group.shortcuts.filter(
          (s) =>
            s.description.toLowerCase().includes(search.toLowerCase()) ||
            s.keys.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((g) => g.shortcuts.length > 0)
    : SHORTCUT_GROUPS;

  return (
    <Dialog open={keyboardShortcutsOpen} onOpenChange={setKeyboardShortcutsOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 border-[#30363d] rounded-xl overflow-hidden" style={{ backgroundColor: '#161b22' }}>
        <DialogHeader className="px-4 py-3 border-b" style={{ borderColor: '#30363d' }}>
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" style={{ color: '#58a6ff' }} />
            <DialogTitle className="text-sm" style={{ color: '#c9d1d9' }}>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription className="sr-only">All available keyboard shortcuts for GitDeploy AI</DialogDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#484f58' }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts..."
              className="pl-8 h-8 text-xs bg-[#0d1117] border-[#30363d] text-[#c9d1d9]"
              autoFocus
            />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-80">
          <div className="p-4 space-y-5">
            {filteredGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: group.color }} />
                    <h3 className="text-xs font-semibold" style={{ color: group.color }}>{group.title}</h3>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4" style={{ borderColor: '#30363d', color: '#8b949e' }}>
                      {group.shortcuts.length}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.keys}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-[#21262d] transition-colors"
                      >
                        <span className="text-xs" style={{ color: '#8b949e' }}>{shortcut.description}</span>
                        <kbd className="flex items-center gap-0.5">
                          {shortcut.keys.split(' ').map((key, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-[10px]" style={{ color: '#484f58' }}>+</span>}
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded border min-w-[20px] text-center"
                                style={{
                                  backgroundColor: '#0d1117',
                                  borderColor: '#30363d',
                                  color: '#c9d1d9',
                                  boxShadow: '0 1px 0 #30363d',
                                }}
                              >
                                {key}
                              </span>
                            </React.Fragment>
                          ))}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: '#30363d' }}>
          <p className="text-[10px]" style={{ color: '#484f58' }}>
            Press <kbd className="px-1 py-0.5 rounded text-[9px] font-mono border" style={{ borderColor: '#30363d', backgroundColor: '#0d1117', color: '#c9d1d9' }}>?</kbd> anytime to toggle this panel
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
