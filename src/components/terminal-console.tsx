'use client';

import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TerminalLine {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

interface TerminalConsoleProps {
  lines: TerminalLine[];
  maxHeight?: string;
  title?: string;
}

const TYPE_COLORS: Record<string, string> = {
  info: '#8b949e',
  error: '#f85149',
  success: '#3fb950',
  warning: '#e3b341',
};

const TYPE_PREFIX: Record<string, string> = {
  info: 'ℹ',
  error: '✗',
  success: '✓',
  warning: '⚠',
};

export function TerminalConsole({ lines, maxHeight = '400px', title = 'Terminal' }: TerminalConsoleProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}>
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f85149' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e3b341' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3fb950' }} />
        </div>
        <span className="text-xs font-mono ml-2" style={{ color: '#8b949e' }}>{title}</span>
      </div>

      {/* Terminal content */}
      <ScrollArea className="p-4" style={{ maxHeight }}>
        <div className="font-mono text-xs space-y-1">
          {lines.length === 0 ? (
            <div style={{ color: '#8b949e' }}>
              <span className="animate-pulse">▌</span> Waiting for output...
            </div>
          ) : (
            lines.map((line, i) => (
              <div key={i} className="flex gap-2">
                <span style={{ color: '#484f58' }} className="shrink-0 select-none">
                  {new Date(line.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ color: TYPE_COLORS[line.type] }}>
                  {TYPE_PREFIX[line.type]} {line.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
