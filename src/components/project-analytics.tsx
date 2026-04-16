'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Hammer,
  Clock,
  CheckCircle,
  Radio,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Code,
  Shield,
  Zap,
} from 'lucide-react';

/* ============================================================
   Mock Data
   ============================================================ */
const BUILD_DATA = [
  { day: 'Mon', success: 8, failed: 1 },
  { day: 'Tue', success: 12, failed: 0 },
  { day: 'Wed', success: 6, failed: 2 },
  { day: 'Thu', success: 15, failed: 1 },
  { day: 'Fri', success: 10, failed: 0 },
  { day: 'Sat', success: 3, failed: 0 },
  { day: 'Sun', success: 7, failed: 1 },
];

const DEPLOYMENT_TREND = [
  { week: 'W1', value: 4 },
  { week: 'W2', value: 7 },
  { week: 'W3', value: 5 },
  { week: 'W4', value: 9 },
];

const TECH_DISTRIBUTION = [
  { name: 'Next.js', percent: 45, color: '#58a6ff' },
  { name: 'React', percent: 30, color: '#61dafb' },
  { name: 'Express', percent: 15, color: '#8b949e' },
  { name: 'FastAPI', percent: 10, color: '#3fb950' },
];

const PERFORMANCE_METRICS = [
  { label: 'Build Speed', value: 78, icon: Zap },
  { label: 'Code Quality', value: 92, icon: Code },
  { label: 'Security Score', value: 85, icon: Shield },
];

/* ============================================================
   Overview Stats
   ============================================================ */
const OVERVIEW_STATS = [
  {
    label: 'Total Builds',
    value: 64,
    trend: 12,
    trendUp: true,
    icon: Hammer,
    color: '#58a6ff',
  },
  {
    label: 'Avg Build Time',
    value: '2.4m',
    trend: 8,
    trendUp: false,
    icon: Clock,
    color: '#a371f7',
  },
  {
    label: 'Success Rate',
    value: '94%',
    trend: 3,
    trendUp: true,
    icon: CheckCircle,
    color: '#3fb950',
  },
  {
    label: 'Active Deploys',
    value: 3,
    trend: 0,
    trendUp: true,
    icon: Radio,
    color: '#e3b341',
  },
];

/* ============================================================
   Circular Progress Component (for Performance Metrics)
   ============================================================ */
function CircleProgress({
  value,
  size = 90,
  strokeWidth = 6,
  color,
  label,
  icon: Icon,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  icon: React.ElementType;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#21262d"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="text-center">
        <motion.span
          className="text-lg font-bold block"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {value}/100
        </motion.span>
        <span className="text-[11px]" style={{ color: '#8b949e' }}>{label}</span>
      </div>
    </div>
  );
}

/* ============================================================
   Main Component
   ============================================================ */
export function ProjectAnalytics() {
  /* ----- Computed Values ----- */
  const maxBuild = Math.max(...BUILD_DATA.map((d) => d.success + d.failed));
  const chartWidth = 440;
  const chartHeight = 160;
  const barWidth = 36;
  const barGap = (chartWidth - BUILD_DATA.length * barWidth) / (BUILD_DATA.length + 1);

  /* Deployment trend SVG */
  const trendW = 360;
  const trendH = 120;
  const trendPadX = 40;
  const trendPadY = 20;
  const trendMaxVal = Math.max(...DEPLOYMENT_TREND.map((d) => d.value));
  const trendPoints = DEPLOYMENT_TREND.map((d, i) => ({
    x: trendPadX + (i / (DEPLOYMENT_TREND.length - 1)) * (trendW - trendPadX * 2),
    y: trendPadY + (1 - d.value / trendMaxVal) * (trendH - trendPadY * 2),
  }));

  // Build smooth bezier path
  const trendPath = trendPoints.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = trendPoints[i - 1];
    const cpx = (prev.x + point.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  // Area fill path (close the shape)
  const areaPath = `${trendPath} L ${trendPoints[trendPoints.length - 1].x} ${trendH - trendPadY} L ${trendPoints[0].x} ${trendH - trendPadY} Z`;

  const cardStyle = {
    backgroundColor: '#161b22',
    borderColor: '#30363d',
  };

  return (
    <div className="space-y-6">
      {/* ================================================
          Overview Stats Row (4 cards)
          ================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {OVERVIEW_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card
              className="overflow-hidden"
              style={{
                ...cardStyle,
                borderTop: `3px solid ${stat.color}`,
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium mb-1" style={{ color: '#8b949e' }}>
                      {stat.label}
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${stat.color}, ${stat.color}bb)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {stat.value}
                    </p>
                    {stat.trend > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        {stat.trendUp ? (
                          <TrendingUp className="w-3 h-3" style={{ color: '#3fb950' }} />
                        ) : (
                          <TrendingDown className="w-3 h-3" style={{ color: '#3fb950' }} />
                        )}
                        <span className="text-[10px] font-medium" style={{ color: '#3fb950' }}>
                          {stat.trend}% {stat.trendUp ? 'up' : 'down'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className="p-2 rounded-lg relative"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    {/* Pulse for active deploys */}
                    {stat.label === 'Active Deploys' && stat.value > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                        style={{ backgroundColor: stat.color }}
                      >
                        <span
                          className="absolute inset-0 rounded-full animate-ping"
                          style={{ backgroundColor: stat.color, opacity: 0.6 }}
                        />
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ================================================
          Charts Row: Build Activity + Deployment Trend
          ================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Build Activity Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <Card style={cardStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
                <BarChart3 className="w-4 h-4" style={{ color: '#58a6ff' }} />
                Build Activity
                <span className="text-[10px] font-normal ml-auto" style={{ color: '#484f58' }}>Last 7 days</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Legend */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#3fb950' }} />
                  <span className="text-[10px]" style={{ color: '#8b949e' }}>Successful</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#f85149' }} />
                  <span className="text-[10px]" style={{ color: '#8b949e' }}>Failed</span>
                </div>
              </div>

              {/* SVG Bar Chart */}
              <svg
                width="100%"
                viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
                className="overflow-visible"
              >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                  <line
                    key={ratio}
                    x1={0}
                    y1={chartHeight * (1 - ratio)}
                    x2={chartWidth}
                    y2={chartHeight * (1 - ratio)}
                    stroke="#21262d"
                    strokeWidth={1}
                    strokeDasharray={ratio === 0 ? '0' : '4 4'}
                  />
                ))}

                {BUILD_DATA.map((d, i) => {
                  const x = barGap + i * (barWidth + barGap);
                  const successH = (d.success / maxBuild) * (chartHeight - 20);
                  const failedH = (d.failed / maxBuild) * (chartHeight - 20);
                  const totalH = successH + failedH;
                  const yBase = chartHeight;
                  const failedY = yBase - totalH;
                  const successY = yBase - successH;

                  return (
                    <g key={d.day}>
                      {/* Success bar */}
                      <motion.rect
                        x={x}
                        y={successY}
                        width={barWidth}
                        rx={4}
                        fill="#3fb950"
                        initial={{ y: yBase, height: 0 }}
                        animate={{ y: successY, height: successH }}
                        transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                        style={{ filter: 'drop-shadow(0 0 4px rgba(63,185,80,0.3))' }}
                      />
                      {/* Failed bar (stacked on top) */}
                      {d.failed > 0 && (
                        <motion.rect
                          x={x}
                          y={failedY}
                          width={barWidth}
                          rx={4}
                          fill="#f85149"
                          initial={{ y: successY, height: 0 }}
                          animate={{ y: failedY, height: failedH }}
                          transition={{ delay: 0.5 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                          style={{ filter: 'drop-shadow(0 0 4px rgba(248,81,73,0.3))' }}
                        />
                      )}
                      {/* Value label on top */}
                      <motion.text
                        x={x + barWidth / 2}
                        y={failedY - 6}
                        textAnchor="middle"
                        fill="#c9d1d9"
                        fontSize={11}
                        fontWeight={600}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 + i * 0.06 }}
                      >
                        {d.success + d.failed}
                      </motion.text>
                      {/* Day label */}
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight + 20}
                        textAnchor="middle"
                        fill="#8b949e"
                        fontSize={11}
                      >
                        {d.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>
        </motion.div>

        {/* Deployment Trend Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <Card style={cardStyle}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
                <TrendingUp className="w-4 h-4" style={{ color: '#3fb950' }} />
                Deployment Trend
                <span className="text-[10px] font-normal ml-auto" style={{ color: '#484f58' }}>Last 4 weeks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <svg
                width="100%"
                viewBox={`0 0 ${trendW} ${trendH}`}
                className="overflow-visible"
              >
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3fb950" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3fb950" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3fb950" />
                    <stop offset="100%" stopColor="#58a6ff" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 0.5, 1].map((ratio) => (
                  <line
                    key={ratio}
                    x1={trendPadX}
                    y1={trendPadY + (1 - ratio) * (trendH - trendPadY * 2)}
                    x2={trendW - trendPadX}
                    y2={trendPadY + (1 - ratio) * (trendH - trendPadY * 2)}
                    stroke="#21262d"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Gradient fill under line */}
                <motion.path
                  d={areaPath}
                  fill="url(#trendGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />

                {/* Line with animated drawing */}
                <motion.path
                  d={trendPath}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 1.5, ease: 'easeInOut' }}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(63,185,80,0.4))' }}
                />

                {/* Data points */}
                {trendPoints.map((point, i) => (
                  <g key={i}>
                    <motion.circle
                      cx={point.x}
                      cy={point.y}
                      r={5}
                      fill="#0d1117"
                      stroke={i === trendPoints.length - 1 ? '#58a6ff' : '#3fb950'}
                      strokeWidth={2.5}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1 + i * 0.15, type: 'spring', stiffness: 300 }}
                    />
                    {/* Value label */}
                    <motion.text
                      x={point.x}
                      y={point.y - 12}
                      textAnchor="middle"
                      fill="#c9d1d9"
                      fontSize={11}
                      fontWeight={600}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 + i * 0.15 }}
                    >
                      {DEPLOYMENT_TREND[i].value}
                    </motion.text>
                    {/* Week label */}
                    <text
                      x={point.x}
                      y={trendH - 4}
                      textAnchor="middle"
                      fill="#8b949e"
                      fontSize={11}
                    >
                      {DEPLOYMENT_TREND[i].week}
                    </text>
                  </g>
                ))}
              </svg>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ================================================
          Bottom Row: Tech Distribution + Performance Metrics
          ================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technology Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          <Card style={cardStyle}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
                <Code className="w-4 h-4" style={{ color: '#a371f7' }} />
                Technology Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TECH_DISTRIBUTION.map((tech, i) => (
                  <div key={tech.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium" style={{ color: '#c9d1d9' }}>
                        {tech.name}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: tech.color }}>
                        {tech.percent}%
                      </span>
                    </div>
                    <div
                      className="h-2.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: '#21262d' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: tech.color,
                          boxShadow: `0 0 8px ${tech.color}40`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${tech.percent}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
        >
          <Card style={cardStyle}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
                <Zap className="w-4 h-4" style={{ color: '#e3b341' }} />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around">
                {PERFORMANCE_METRICS.map((metric) => {
                  const color =
                    metric.value >= 90 ? '#3fb950' : metric.value >= 75 ? '#e3b341' : '#f85149';
                  return (
                    <CircleProgress
                      key={metric.label}
                      value={metric.value}
                      color={color}
                      label={metric.label}
                      icon={metric.icon}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
