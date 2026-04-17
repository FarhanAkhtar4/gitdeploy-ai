'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Code,
  Clock,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

/* ============================================================
   Sample Data
   ============================================================ */
const deploymentActivity = [
  { day: 'Mon', deployments: 3, successful: 3, failed: 0 },
  { day: 'Tue', deployments: 5, successful: 4, failed: 1 },
  { day: 'Wed', deployments: 2, successful: 2, failed: 0 },
  { day: 'Thu', deployments: 7, successful: 6, failed: 1 },
  { day: 'Fri', deployments: 4, successful: 4, failed: 0 },
  { day: 'Sat', deployments: 1, successful: 1, failed: 0 },
  { day: 'Sun', deployments: 3, successful: 2, failed: 1 },
];

const frameworkDistribution = [
  { name: 'Next.js', value: 45, color: '#58a6ff' },
  { name: 'React', value: 25, color: '#61dafb' },
  { name: 'Vue', value: 15, color: '#42b883' },
  { name: 'Express', value: 10, color: '#8b949e' },
  { name: 'FastAPI', value: 5, color: '#009688' },
];

const durationTrend = [
  { day: 'Mon', avg: 145 },
  { day: 'Tue', avg: 132 },
  { day: 'Wed', avg: 168 },
  { day: 'Thu', avg: 120 },
  { day: 'Fri', avg: 155 },
  { day: 'Sat', avg: 98 },
  { day: 'Sun', avg: 142 },
];

/* ============================================================
   Computed Summary Values
   ============================================================ */
const totalDeploys = deploymentActivity.reduce((a, d) => a + d.deployments, 0);
const totalSuccessful = deploymentActivity.reduce((a, d) => a + d.successful, 0);
const totalFailed = deploymentActivity.reduce((a, d) => a + d.failed, 0);
const successRate = Math.round((totalSuccessful / totalDeploys) * 100);
const avgDuration = Math.round(durationTrend.reduce((a, d) => a + d.avg, 0) / durationTrend.length);

/* ============================================================
   Custom Tooltip Components
   ============================================================ */
function DeploymentTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs shadow-2xl"
      style={{
        backgroundColor: '#1c2128',
        border: '1px solid #30363d',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <p className="font-semibold mb-1.5 text-sm" style={{ color: '#e6edf3' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: '#8b949e' }}>{entry.dataKey}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs shadow-2xl"
      style={{
        backgroundColor: '#1c2128',
        border: '1px solid #30363d',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <p className="font-semibold mb-1.5 text-sm" style={{ color: '#e6edf3' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: '#8b949e' }}>{entry.dataKey === 'successful' ? 'Success' : 'Failed'}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function DurationTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0].value;
  const mins = Math.floor(val / 60);
  const secs = val % 60;
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs shadow-2xl"
      style={{
        backgroundColor: '#1c2128',
        border: '1px solid #30363d',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <p className="font-semibold mb-1 text-sm" style={{ color: '#e6edf3' }}>{label}</p>
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3" style={{ color: '#e3b341' }} />
        <span style={{ color: '#e3b341' }} className="font-semibold">
          {mins > 0 ? `${mins}m ` : ''}{secs}s
        </span>
      </div>
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const total = frameworkDistribution.reduce((a, b) => a + b.value, 0);
  const pct = Math.round((item.value / total) * 100);
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs shadow-2xl"
      style={{
        backgroundColor: '#1c2128',
        border: '1px solid #30363d',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="font-semibold text-sm" style={{ color: item.payload.color }}>{item.name}</span>
      </div>
      <p style={{ color: '#c9d1d9' }}>
        {item.value} projects <span style={{ color: '#8b949e' }}>({pct}%)</span>
      </p>
    </div>
  );
}

/* ============================================================
   Custom Pie Label
   ============================================================ */
const RADIAN = Math.PI / 180;
function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; name: string }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="#8b949e" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={500}>
      {name} {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* ============================================================
   Animation Variants
   ============================================================ */
const chartCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.1 + i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

/* ============================================================
   Main Component
   ============================================================ */
export function ProjectAnalytics() {
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#161b22',
    borderColor: '#30363d',
    borderRadius: '12px',
  };

  const onPieEnter = (_: unknown, index: number) => {
    setActivePieIndex(index);
  };

  const onPieLeave = () => {
    setActivePieIndex(null);
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(88, 166, 255, 0.12)' }}
          >
            <BarChart3 className="w-4 h-4" style={{ color: '#58a6ff' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#e6edf3' }}>Project Analytics</h2>
            <p className="text-[10px]" style={{ color: '#484f58' }}>Deployment insights and performance metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] px-2 py-1 rounded-md font-medium"
            style={{ backgroundColor: 'rgba(88, 166, 255, 0.1)', color: '#58a6ff' }}
          >
            Last 7 days
          </span>
        </div>
      </motion.div>

      {/* Summary Stats Row */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {[
          { label: 'Total Deploys', value: totalDeploys, color: '#58a6ff', icon: Activity, trend: '+18%', up: true },
          { label: 'Success Rate', value: `${successRate}%`, color: '#3fb950', icon: Zap, trend: '+3%', up: true },
          { label: 'Failed', value: totalFailed, color: '#f85149', icon: ArrowDownRight, trend: '-25%', up: false },
          { label: 'Avg Duration', value: `${avgDuration}s`, color: '#e3b341', icon: Clock, trend: '-8%', up: true },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.3, ease: 'easeOut' }}
          >
            <div
              className="rounded-lg p-3 relative overflow-hidden group cursor-default"
              style={{
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                borderTop: `2px solid ${stat.color}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: stat.up ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)',
                    color: stat.up ? '#3fb950' : '#f85149',
                  }}
                >
                  {stat.trend}
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>{stat.label}</p>
              {/* Hover glow */}
              <div
                className="absolute bottom-0 left-0 right-0 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `linear-gradient(to top, ${stat.color}08, transparent)` }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ===== LEFT COLUMN ===== */}
        <div className="space-y-5">
          {/* Deployment Activity - Area Chart */}
          <motion.div
            custom={0}
            variants={chartCardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card style={cardStyle}>
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#e6edf3' }}>
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(63,185,80,0.12)' }}
                  >
                    <TrendingUp className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />
                  </div>
                  Deployment Activity
                  <span className="text-[10px] font-normal ml-auto" style={{ color: '#484f58' }}>7 day trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-5 pb-5">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deploymentActivity} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="deployGradientNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3fb950" stopOpacity={0.35} />
                          <stop offset="50%" stopColor="#3fb950" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#3fb950" stopOpacity={0.01} />
                        </linearGradient>
                        <linearGradient id="successGradientNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#58a6ff" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#58a6ff" stopOpacity={0.01} />
                        </linearGradient>
                        <filter id="glowGreen">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: '#8b949e', fontSize: 11 }}
                        axisLine={{ stroke: '#30363d' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#8b949e', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip content={<DeploymentTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="deployments"
                        stroke="#3fb950"
                        strokeWidth={2.5}
                        fill="url(#deployGradientNew)"
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationBegin={200}
                        dot={{ r: 3, fill: '#0d1117', stroke: '#3fb950', strokeWidth: 2 }}
                        activeDot={{
                          r: 6,
                          fill: '#3fb950',
                          stroke: '#0d1117',
                          strokeWidth: 2,
                          style: { filter: 'drop-shadow(0 0 6px rgba(63,185,80,0.5))' },
                        }}
                        style={{ filter: 'url(#glowGreen)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="successful"
                        stroke="#58a6ff"
                        strokeWidth={2}
                        fill="url(#successGradientNew)"
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationBegin={400}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-5 mt-3 pt-2" style={{ borderTop: '1px solid #21262d' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-[2px] rounded-full" style={{ backgroundColor: '#3fb950' }} />
                    <span className="text-[10px]" style={{ color: '#8b949e' }}>Total Deployments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-[2px] rounded-full" style={{ backgroundColor: '#58a6ff', borderStyle: 'dashed' }} />
                    <span className="text-[10px]" style={{ color: '#8b949e' }}>Successful</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-[10px]" style={{ color: '#8b949e' }}>Total:</span>
                    <span className="text-xs font-bold" style={{ color: '#3fb950' }}>{totalDeploys}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Deployment Duration Trend - Line Chart */}
          <motion.div
            custom={2}
            variants={chartCardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card style={cardStyle}>
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#e6edf3' }}>
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(227,179,65,0.12)' }}
                  >
                    <Clock className="w-3.5 h-3.5" style={{ color: '#e3b341' }} />
                  </div>
                  Deployment Duration
                  <span className="text-[10px] font-normal ml-auto" style={{ color: '#484f58' }}>Avg time (seconds)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-5 pb-5">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={durationTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="durationGradientNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e3b341" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#e3b341" stopOpacity={0.01} />
                        </linearGradient>
                        <filter id="glowYellow">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: '#8b949e', fontSize: 11 }}
                        axisLine={{ stroke: '#30363d' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#8b949e', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip content={<DurationTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="avg"
                        stroke="#e3b341"
                        strokeWidth={2.5}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationBegin={300}
                        dot={{
                          r: 4,
                          fill: '#0d1117',
                          stroke: '#e3b341',
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 7,
                          fill: '#e3b341',
                          stroke: '#0d1117',
                          strokeWidth: 2,
                          style: { filter: 'drop-shadow(0 0 8px rgba(227,179,65,0.6))' },
                        }}
                        style={{ filter: 'url(#glowYellow)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Duration Summary */}
                <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: '1px solid #21262d' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-[2px] rounded-full" style={{ backgroundColor: '#e3b341' }} />
                    <span className="text-[10px]" style={{ color: '#8b949e' }}>Average Duration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" style={{ color: '#3fb950' }} />
                      <span className="text-[10px]" style={{ color: '#3fb950' }}>Fastest: {Math.min(...durationTrend.map(d => d.avg))}s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px]" style={{ color: '#8b949e' }}>Avg:</span>
                      <span className="text-xs font-bold" style={{ color: '#e3b341' }}>{avgDuration}s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="space-y-5">
          {/* Framework Distribution - Donut Chart */}
          <motion.div
            custom={1}
            variants={chartCardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card style={cardStyle}>
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#e6edf3' }}>
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(163,113,247,0.12)' }}
                  >
                    <PieChartIcon className="w-3.5 h-3.5" style={{ color: '#a371f7' }} />
                  </div>
                  Framework Distribution
                  <span className="text-[10px] font-normal ml-auto" style={{ color: '#484f58' }}>By project count</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-5 pb-5">
                <div className="h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={frameworkDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={72}
                        innerRadius={42}
                        paddingAngle={3}
                        dataKey="value"
                        isAnimationActive={true}
                        animationBegin={200}
                        animationDuration={1000}
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                      >
                        {frameworkDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke={activePieIndex === index ? entry.color : '#161b22'}
                            strokeWidth={activePieIndex === index ? 3 : 1}
                            style={{
                              filter: activePieIndex === index ? `drop-shadow(0 0 10px ${entry.color}60)` : 'none',
                              transform: activePieIndex === index ? 'scale(1.06)' : 'scale(1)',
                              transformOrigin: 'center',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
                    style={{ marginTop: '-4px' }}
                  >
                    <p className="text-2xl font-bold" style={{ color: '#e6edf3' }}>
                      {frameworkDistribution.reduce((a, b) => a + b.value, 0)}
                    </p>
                    <p className="text-[9px]" style={{ color: '#8b949e' }}>PROJECTS</p>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 pt-2" style={{ borderTop: '1px solid #21262d' }}>
                  {frameworkDistribution.map((fw) => (
                    <div
                      key={fw.name}
                      className="flex items-center gap-1.5 group cursor-default"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-sm transition-transform group-hover:scale-125"
                        style={{ backgroundColor: fw.color }}
                      />
                      <span className="text-[10px]" style={{ color: '#8b949e' }}>{fw.name}</span>
                      <span className="text-[10px] font-bold" style={{ color: fw.color }}>{fw.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Build Success Rate - Bar Chart */}
          <motion.div
            custom={3}
            variants={chartCardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card style={cardStyle}>
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#e6edf3' }}>
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(63,185,80,0.12)' }}
                  >
                    <Code className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />
                  </div>
                  Build Success Rate
                  <span className="text-[10px] font-normal ml-auto" style={{ color: '#484f58' }}>Per day</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-5 pb-5">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deploymentActivity} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barGap={2}>
                      <defs>
                        <linearGradient id="successBarGradNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3fb950" stopOpacity={1} />
                          <stop offset="100%" stopColor="#238636" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="failedBarGradNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f85149" stopOpacity={1} />
                          <stop offset="100%" stopColor="#da3633" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: '#8b949e', fontSize: 11 }}
                        axisLine={{ stroke: '#30363d' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#8b949e', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip content={<BarTooltip />} />
                      <Bar
                        dataKey="successful"
                        fill="url(#successBarGradNew)"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationBegin={300}
                        maxBarSize={28}
                      />
                      <Bar
                        dataKey="failed"
                        fill="url(#failedBarGradNew)"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationBegin={500}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend + Success Rate */}
                <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: '1px solid #21262d' }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#3fb950' }} />
                      <span className="text-[10px]" style={{ color: '#8b949e' }}>Successful</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#f85149' }} />
                      <span className="text-[10px]" style={{ color: '#8b949e' }}>Failed</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]" style={{ color: '#8b949e' }}>Overall:</span>
                    <span
                      className="text-sm font-bold px-2 py-0.5 rounded-md"
                      style={{
                        color: successRate >= 90 ? '#3fb950' : successRate >= 70 ? '#e3b341' : '#f85149',
                        backgroundColor: successRate >= 90 ? 'rgba(63,185,80,0.12)' : successRate >= 70 ? 'rgba(227,179,65,0.12)' : 'rgba(248,81,73,0.12)',
                      }}
                    >
                      {successRate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
