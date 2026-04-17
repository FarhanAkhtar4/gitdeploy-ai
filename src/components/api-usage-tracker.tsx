'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Zap,
  MessageSquare,
  Code,
  Rocket,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface UsageCategory {
  name: string;
  icon: React.ElementType;
  used: number;
  limit: number;
  unit: string;
  color: string;
  description: string;
}

const USAGE_CATEGORIES: UsageCategory[] = [
  {
    name: 'AI Chat Messages',
    icon: MessageSquare,
    used: 47,
    limit: 100,
    unit: 'messages',
    color: '#58a6ff',
    description: 'Questions and conversations with AI assistant',
  },
  {
    name: 'Code Generation',
    icon: Code,
    used: 12,
    limit: 50,
    unit: 'files',
    color: '#3fb950',
    description: 'AI-generated project files and code',
  },
  {
    name: 'Deployments',
    icon: Rocket,
    used: 3,
    limit: 10,
    unit: 'deploys',
    color: '#e3b341',
    description: 'GitHub deployments this billing period',
  },
  {
    name: 'Project Builds',
    icon: Zap,
    used: 5,
    limit: 20,
    unit: 'builds',
    color: '#a371f7',
    description: 'Full project generation sessions',
  },
];

const DAILY_USAGE = [
  { day: 'Mon', value: 8 },
  { day: 'Tue', value: 12 },
  { day: 'Wed', value: 6 },
  { day: 'Thu', value: 15 },
  { day: 'Fri', value: 10 },
  { day: 'Sat', value: 3 },
  { day: 'Sun', value: 7 },
];

function MiniBarChart() {
  const maxVal = Math.max(...DAILY_USAGE.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 h-16">
      {DAILY_USAGE.map((d, i) => (
        <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / maxVal) * 100}%` }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
            className="w-full rounded-t-sm min-h-[4px]"
            style={{
              backgroundColor: d.value === maxVal ? '#58a6ff' : '#21262d',
              opacity: d.value === maxVal ? 1 : 0.7,
            }}
          />
          <span className="text-[8px] font-mono" style={{ color: '#484f58' }}>
            {d.day}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ApiUsageTracker() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const totalUsed = USAGE_CATEGORIES.reduce((sum, c) => sum + c.used, 0);
  const totalLimit = USAGE_CATEGORIES.reduce((sum, c) => sum + c.limit, 0);
  const overallPercentage = Math.round((totalUsed / totalLimit) * 100);

  const remainingDays = 14; // Mock: days until billing reset
  const projectedUsage = Math.round((totalUsed / (30 - remainingDays)) * 30);

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
              <BarChart3 className="w-4 h-4" style={{ color: '#58a6ff' }} />
              API Usage Overview
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{
                borderColor: overallPercentage > 80 ? '#f8514940' : '#3fb95040',
                color: overallPercentage > 80 ? '#f85149' : '#3fb950',
              }}
            >
              {overallPercentage > 80 ? 'High Usage' : 'Normal'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: '#8b949e' }}>
                Overall Usage
              </span>
              <span className="text-xs font-mono font-bold" style={{ color: '#58a6ff' }}>
                {totalUsed} / {totalLimit}
              </span>
            </div>
            <Progress value={overallPercentage} className="h-2" />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px]" style={{ color: '#484f58' }}>
                {overallPercentage}% used
              </span>
              <span className="text-[10px] flex items-center gap-1" style={{ color: '#8b949e' }}>
                <Clock className="w-2.5 h-2.5" /> Resets in {remainingDays} days
              </span>
            </div>
          </div>

          {/* Projected Usage Warning */}
          {projectedUsage > totalLimit * 0.8 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-2.5 rounded-lg"
              style={{
                backgroundColor: 'rgba(227,179,65,0.08)',
                border: '1px solid rgba(227,179,65,0.2)',
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#e3b341' }} />
              <div>
                <p className="text-[10px] font-medium" style={{ color: '#e3b341' }}>
                  Projected to exceed limit
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>
                  At current pace, you&apos;ll use ~{projectedUsage} of {totalLimit} this period
                </p>
              </div>
            </motion.div>
          )}

          {/* Daily Usage Chart */}
          <div>
            <p className="text-[10px] font-medium mb-2" style={{ color: '#8b949e' }}>
              Daily Usage This Week
            </p>
            <MiniBarChart />
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs" style={{ color: '#8b949e' }}>
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {USAGE_CATEGORIES.map((category, i) => {
            const percentage = Math.round((category.used / category.limit) * 100);
            const isHovered = hoveredCategory === category.name;
            const Icon = category.icon;

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="rounded-lg p-3 transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: isHovered ? '#21262d' : '#0d1117',
                  border: `1px solid ${isHovered ? category.color + '30' : '#21262d'}`,
                }}
                onMouseEnter={() => setHoveredCategory(category.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: category.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>
                        {category.name}
                      </p>
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{
                          color: percentage > 80 ? '#f85149' : percentage > 60 ? '#e3b341' : category.color,
                        }}
                      >
                        {category.used}/{category.limit}
                      </span>
                    </div>
                    {isHovered && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] mt-0.5"
                        style={{ color: '#8b949e' }}
                      >
                        {category.description}
                      </motion.p>
                    )}
                    <div className="mt-1.5">
                      <Progress
                        value={percentage}
                        className="h-1.5"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      <Card
        className="overflow-hidden"
        style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
      >
        <div
          className="h-1"
          style={{
            background: 'linear-gradient(90deg, #58a6ff, #3fb950, #e3b341)',
          }}
        />
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #58a6ff20, #3fb95020)',
              }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: '#58a6ff' }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>
                Need more capacity?
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>
                Upgrade to Pro for 10x limits and priority AI access
              </p>
            </div>
            <button
              className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #58a6ff, #3fb950)',
                color: 'white',
              }}
            >
              Upgrade
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
