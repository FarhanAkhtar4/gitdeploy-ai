'use client';

import React from 'react';

type StatusType = 'not_deployed' | 'building' | 'deploying' | 'live' | 'failed' | 'queued' | 'in_progress' | 'completed' | 'partial';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
  not_deployed: { label: 'Not Deployed', color: '#8b949e', bg: 'rgba(139,148,158,0.15)', pulse: false },
  building: { label: 'Building', color: '#58a6ff', bg: 'rgba(88,166,255,0.15)', pulse: true },
  deploying: { label: 'Deploying', color: '#58a6ff', bg: 'rgba(88,166,255,0.15)', pulse: true },
  queued: { label: 'Queued', color: '#e3b341', bg: 'rgba(227,179,65,0.15)', pulse: true },
  in_progress: { label: 'In Progress', color: '#58a6ff', bg: 'rgba(88,166,255,0.15)', pulse: true },
  live: { label: 'Live', color: '#3fb950', bg: 'rgba(63,185,80,0.15)', pulse: false },
  completed: { label: 'Completed', color: '#3fb950', bg: 'rgba(63,185,80,0.15)', pulse: false },
  partial: { label: 'Partial', color: '#e3b341', bg: 'rgba(227,179,65,0.15)', pulse: false },
  failed: { label: 'Failed', color: '#f85149', bg: 'rgba(248,81,73,0.15)', pulse: false },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_deployed;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: config.color }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ backgroundColor: config.color }}
        />
      </span>
      {config.label}
    </span>
  );
}
