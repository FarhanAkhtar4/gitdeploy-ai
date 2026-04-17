'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, AlertTriangle } from 'lucide-react';

interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
  lineNumber?: number;
}

interface DiffViewerProps {
  title: string;
  diff: string;
  onApprove: () => void;
  onReject: () => void;
  language?: string;
}

function parseDiff(diffText: string): DiffLine[] {
  const lines: DiffLine[] = [];
  const rawLines = diffText.split('\n');

  for (const line of rawLines) {
    if (line.startsWith('@@')) {
      lines.push({ type: 'header', content: line });
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      lines.push({ type: 'add', content: line.substring(1) });
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      lines.push({ type: 'remove', content: line.substring(1) });
    } else {
      lines.push({ type: 'context', content: line.startsWith(' ') ? line.substring(1) : line });
    }
  }

  return lines;
}

export function DiffViewer({ title, diff, onApprove, onReject, language }: DiffViewerProps) {
  const [approved, setApproved] = useState(false);
  const parsedLines = parseDiff(diff);

  const addCount = parsedLines.filter((l) => l.type === 'add').length;
  const removeCount = parsedLines.filter((l) => l.type === 'remove').length;

  const handleApprove = () => {
    setApproved(true);
    onApprove();
  };

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium" style={{ color: '#c9d1d9' }}>{title}</span>
          {language && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#21262d', color: '#8b949e' }}>
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(63,185,80,0.15)', color: '#3fb950' }}>
            +{addCount}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(248,81,73,0.15)', color: '#f85149' }}>
            -{removeCount}
          </span>
        </div>
      </div>

      {/* Diff Content */}
      <ScrollArea className="max-h-96">
        <div className="font-mono text-xs">
          {parsedLines.map((line, i) => (
            <div
              key={i}
              className="flex"
              style={{
                backgroundColor:
                  line.type === 'add'
                    ? 'rgba(63,185,80,0.08)'
                    : line.type === 'remove'
                    ? 'rgba(248,81,73,0.08)'
                    : line.type === 'header'
                    ? 'rgba(88,166,255,0.06)'
                    : 'transparent',
              }}
            >
              <span
                className="w-8 shrink-0 text-right pr-2 select-none border-r"
                style={{
                  color: '#484f58',
                  borderColor: '#21262d',
                  borderRightWidth: '1px',
                }}
              >
                {line.type !== 'header' ? i + 1 : ''}
              </span>
              <span className="px-2" style={{ color: line.type === 'add' ? '#3fb950' : line.type === 'remove' ? '#f85149' : line.type === 'header' ? '#58a6ff' : '#8b949e' }}>
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>
              <span style={{ color: line.type === 'context' ? '#8b949e' : line.type === 'header' ? '#58a6ff' : '#c9d1d9' }}>
                {line.content}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" style={{ color: '#e3b341' }} />
          <span className="text-[10px]" style={{ color: '#8b949e' }}>
            Review changes before applying
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            style={{ borderColor: '#30363d', color: '#8b949e' }}
            onClick={onReject}
          >
            <X className="w-3 h-3" /> Reject
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1 text-xs"
            style={{
              backgroundColor: approved ? '#238636' : '#238636',
              color: 'white',
            }}
            onClick={handleApprove}
            disabled={approved}
          >
            <Check className="w-3 h-3" /> {approved ? 'Approved' : 'APPROVE CHANGE'}
          </Button>
        </div>
      </div>
    </div>
  );
}
