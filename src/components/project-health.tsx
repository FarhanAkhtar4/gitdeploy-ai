'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/app-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  FileCode,
  Shield,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Wrench,
  RefreshCw,
  BarChart3,
  ArrowRight,
  Lock,
  Gauge,
  HeartPulse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── Health Score History (7 days mock) ─── */
const HEALTH_HISTORY = [
  { day: 'Mon', score: 65 },
  { day: 'Tue', score: 70 },
  { day: 'Wed', score: 68 },
  { day: 'Thu', score: 75 },
  { day: 'Fri', score: 80 },
  { day: 'Sat', score: 78 },
  { day: 'Sun', score: 85 },
];

/* ─── Trend Types ─── */
type TrendDirection = 'improving' | 'declining' | 'stable';

interface HealthMetric {
  label: string;
  value: number;
  maxValue: number;
  category: 'security' | 'performance' | 'reliability' | 'bestPractices';
  trend: TrendDirection;
  trendValue: string;
  icon: React.ElementType;
  description: string;
}

/* ─── Category Colors ─── */
const CATEGORY_CONFIG = {
  security: { color: '#f85149', bg: 'rgba(248,81,73,0.12)', label: 'Security', icon: Lock },
  performance: { color: '#58a6ff', bg: 'rgba(88,166,255,0.12)', label: 'Performance', icon: Gauge },
  reliability: { color: '#3fb950', bg: 'rgba(63,185,80,0.12)', label: 'Reliability', icon: HeartPulse },
  bestPractices: { color: '#e3b341', bg: 'rgba(227,179,65,0.12)', label: 'Best Practices', icon: Zap },
};

/* ─── Quick Fix Actions ─── */
interface QuickFix {
  id: string;
  label: string;
  description: string;
  category: 'security' | 'performance' | 'reliability' | 'bestPractices';
  impact: 'high' | 'medium' | 'low';
}

const QUICK_FIXES: QuickFix[] = [
  { id: 'qf1', label: 'Enable branch protection', description: 'Require PR reviews before merging to main', category: 'security', impact: 'high' },
  { id: 'qf2', label: 'Add CI/CD workflow', description: 'Automate testing and deployment pipeline', category: 'reliability', impact: 'high' },
  { id: 'qf3', label: 'Set up error monitoring', description: 'Track runtime errors with Sentry integration', category: 'reliability', impact: 'medium' },
  { id: 'qf4', label: 'Optimize bundle size', description: 'Enable tree-shaking and code splitting', category: 'performance', impact: 'medium' },
  { id: 'qf5', label: 'Add rate limiting', description: 'Protect API routes with rate limiting middleware', category: 'security', impact: 'medium' },
  { id: 'qf6', label: 'Configure CSP headers', description: 'Add Content Security Policy headers', category: 'security', impact: 'high' },
  { id: 'qf7', label: 'Add health check endpoint', description: 'Create /api/health for uptime monitoring', category: 'bestPractices', impact: 'low' },
  { id: 'qf8', label: 'Enable caching', description: 'Add Redis caching for API responses', category: 'performance', impact: 'medium' },
];

/* ─── Animated SVG Gauge ─── */
function AnimatedGauge({
  value,
  maxValue,
  size = 64,
  strokeWidth = 5,
  color,
  label,
  trend,
  trendValue,
}: {
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  trend: TrendDirection;
  trendValue: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(value / maxValue, 1);
  const offset = circumference - percentage * circumference;

  const getTrendIcon = () => {
    if (trend === 'improving') return <TrendingUp className="w-3 h-3" style={{ color: '#3fb950' }} />;
    if (trend === 'declining') return <TrendingDown className="w-3 h-3" style={{ color: '#f85149' }} />;
    return <Minus className="w-3 h-3" style={{ color: '#8b949e' }} />;
  };

  const getTrendColor = () => {
    if (trend === 'improving') return '#3fb950';
    if (trend === 'declining') return '#f85149';
    return '#8b949e';
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Glow filter */}
          <defs>
            <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#21262d"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc with glow */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            filter={`url(#glow-${label})`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{value}</span>
        </div>
      </div>
      {/* Label */}
      <div className="text-center">
        <p className="text-[10px] font-medium" style={{ color: '#8b949e' }}>{label}</p>
        <div className="flex items-center gap-0.5 justify-center mt-0.5">
          {getTrendIcon()}
          <span className="text-[9px] font-mono" style={{ color: getTrendColor() }}>{trendValue}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Mini History Chart ─── */
function MiniHistoryChart({ data, currentScore }: { data: typeof HEALTH_HISTORY; currentScore: number }) {
  const width = 200;
  const height = 40;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxScore = 100;
  const minScore = 0;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.score - minScore) / (maxScore - minScore)) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) / 3;
    const cpx2 = p.x - (p.x - prev.x) / 3;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  // Area path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="healthChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#58a6ff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <motion.path
          d={areaD}
          fill="url(#healthChartGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="#58a6ff"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* Current score dot */}
        <motion.circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill="#58a6ff"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 }}
        />
      </svg>
      {/* Day labels */}
      <div className="flex justify-between mt-0.5 px-1">
        {data.map((d) => (
          <span key={d.day} className="text-[7px] font-mono" style={{ color: '#484f58' }}>{d.day}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Quick Fix Card ─── */
function QuickFixCard({
  fix,
  onApply,
}: {
  fix: QuickFix;
  onApply: (id: string) => void;
}) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const catConfig = CATEGORY_CONFIG[fix.category];
  const impactColor = fix.impact === 'high' ? '#f85149' : fix.impact === 'medium' ? '#e3b341' : '#8b949e';

  const handleApply = () => {
    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      setApplied(true);
      onApply(fix.id);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2.5 p-2.5 rounded-lg transition-all duration-200 group"
      style={{
        backgroundColor: applied ? 'rgba(63,185,80,0.05)' : '#0d1117',
        border: `1px solid ${applied ? '#3fb95030' : '#21262d'}`,
        borderLeft: `2px solid ${catConfig.color}`,
      }}
    >
      <div className="p-1 rounded shrink-0 mt-0.5" style={{ backgroundColor: catConfig.bg }}>
        <Wrench className="w-3 h-3" style={{ color: catConfig.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-medium" style={{ color: applied ? '#3fb950' : '#c9d1d9' }}>
            {fix.label}
          </p>
          <span className="text-[8px] px-1 py-0 rounded-full" style={{ backgroundColor: `${impactColor}15`, color: impactColor }}>
            {fix.impact}
          </span>
        </div>
        <p className="text-[9px] mt-0.5" style={{ color: '#484f58' }}>{fix.description}</p>
      </div>
      {applied ? (
        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#3fb950' }} />
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[9px] shrink-0 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ borderColor: '#30363d', color: '#58a6ff' }}
          onClick={handleApply}
          disabled={applying}
        >
          {applying ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : 'Fix'}
        </Button>
      )}
    </motion.div>
  );
}

export function ProjectHealth() {
  const { projects, isGithubConnected } = useAppStore();
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [showAllFixes, setShowAllFixes] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Calculate health score
  const totalProjects = projects.length;
  const liveProjects = projects.filter((p) => p.status === 'live').length;
  const failedProjects = projects.filter((p) => p.status === 'failed').length;

  let healthScore = 50;
  if (isGithubConnected) healthScore += 15;
  if (totalProjects > 0) healthScore += 10;
  if (liveProjects > 0) healthScore += 15;
  if (failedProjects === 0 && totalProjects > 0) healthScore += 10;
  if (totalProjects === 0 && !isGithubConnected) healthScore = 25;
  healthScore = Math.min(100, healthScore);

  // Health metrics
  const metrics: HealthMetric[] = useMemo(() => [
    {
      label: 'Security',
      value: isGithubConnected ? 85 : 40,
      maxValue: 100,
      category: 'security',
      trend: isGithubConnected ? 'improving' : 'stable',
      trendValue: isGithubConnected ? '+5%' : '0%',
      icon: Shield,
      description: isGithubConnected ? 'OAuth & branch protection active' : 'Connect GitHub to enable security',
    },
    {
      label: 'Performance',
      value: liveProjects > 0 ? 78 : 45,
      maxValue: 100,
      category: 'performance',
      trend: liveProjects > 0 ? 'improving' : 'stable',
      trendValue: liveProjects > 0 ? '+3%' : '0%',
      icon: Gauge,
      description: liveProjects > 0 ? 'Optimized build & deploy pipeline' : 'No live deployments to measure',
    },
    {
      label: 'Reliability',
      value: failedProjects > 0 ? 35 : liveProjects > 0 ? 90 : 50,
      maxValue: 100,
      category: 'reliability',
      trend: failedProjects > 0 ? 'declining' : liveProjects > 0 ? 'improving' : 'stable',
      trendValue: failedProjects > 0 ? '-15%' : liveProjects > 0 ? '+8%' : '0%',
      icon: HeartPulse,
      description: failedProjects > 0 ? `${failedProjects} failed deployments` : liveProjects > 0 ? 'All deployments successful' : 'No deployment history',
    },
    {
      label: 'Best Practices',
      value: totalProjects > 2 ? 82 : totalProjects > 0 ? 65 : 30,
      maxValue: 100,
      category: 'bestPractices',
      trend: totalProjects > 2 ? 'improving' : 'stable',
      trendValue: totalProjects > 2 ? '+4%' : '0%',
      icon: Zap,
      description: totalProjects > 2 ? 'Good project organization' : 'Build more projects to improve',
    },
  ], [isGithubConnected, liveProjects, failedProjects, totalProjects]);

  const getLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Setup';
    return 'Getting Started';
  };

  const getColor = (v: number) => {
    if (v >= 80) return '#3fb950';
    if (v >= 50) return '#e3b341';
    return '#f85149';
  };

  const handleRunCheck = () => {
    setIsRunningCheck(true);
    setTimeout(() => setIsRunningCheck(false), 3000);
  };

  const handleApplyFix = (id: string) => {
    setAppliedFixes(prev => new Set(prev).add(id));
  };

  // Filter quick fixes
  const filteredFixes = QUICK_FIXES
    .filter(f => !appliedFixes.has(f.id))
    .filter(f => activeCategory === 'all' || f.category === activeCategory);

  const displayedFixes = showAllFixes ? filteredFixes : filteredFixes.slice(0, 4);

  return (
    <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
            <Activity className="w-4 h-4" style={{ color: '#58a6ff' }} />
            Project Health
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-1"
            style={{ borderColor: '#30363d', color: '#58a6ff' }}
            onClick={handleRunCheck}
            disabled={isRunningCheck}
          >
            {isRunningCheck ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3" />
                Run Check
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main score + History chart */}
        <div className="flex items-start gap-4">
          {/* Large circular score */}
          <div className="relative group/score" onMouseEnter={() => setShowBreakdown(true)} onMouseLeave={() => setShowBreakdown(false)}>
            <div className="relative" style={{ width: 80, height: 80 }}>
              <svg width={80} height={80} className="transform -rotate-90">
                <defs>
                  <filter id="healthGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle cx={40} cy={40} r={34} fill="none" stroke="#21262d" strokeWidth={6} />
                <motion.circle
                  cx={40} cy={40} r={34} fill="none"
                  stroke={getColor(healthScore)}
                  strokeWidth={6}
                  strokeLinecap="round"
                  filter="url(#healthGlow)"
                  initial={{ strokeDashoffset: 34 * 2 * Math.PI }}
                  animate={{ strokeDashoffset: 34 * 2 * Math.PI - (healthScore / 100) * 34 * 2 * Math.PI }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  strokeDasharray={34 * 2 * Math.PI}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold" style={{ color: getColor(healthScore) }}>{healthScore}</span>
              </div>
            </div>
            {/* Score breakdown tooltip */}
            <AnimatePresence>
              {showBreakdown && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 rounded-xl z-20"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #30363d', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                >
                  <p className="text-[10px] font-semibold mb-2" style={{ color: '#c9d1d9' }}>Score Breakdown</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px]" style={{ color: '#8b949e' }}>GitHub Connected</span>
                      <span className="text-[9px] font-mono" style={{ color: isGithubConnected ? '#3fb950' : '#f85149' }}>{isGithubConnected ? '+15' : '+0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px]" style={{ color: '#8b949e' }}>Has Projects</span>
                      <span className="text-[9px] font-mono" style={{ color: totalProjects > 0 ? '#3fb950' : '#f85149' }}>{totalProjects > 0 ? '+10' : '+0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px]" style={{ color: '#8b949e' }}>Live Deploys</span>
                      <span className="text-[9px] font-mono" style={{ color: liveProjects > 0 ? '#3fb950' : '#f85149' }}>{liveProjects > 0 ? '+15' : '+0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px]" style={{ color: '#8b949e' }}>No Failures</span>
                      <span className="text-[9px] font-mono" style={{ color: failedProjects === 0 && totalProjects > 0 ? '#3fb950' : '#f85149' }}>{failedProjects === 0 && totalProjects > 0 ? '+10' : '+0'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid #21262d' }}>
                      <span className="text-[9px] font-semibold" style={{ color: '#c9d1d9' }}>Base Score</span>
                      <span className="text-[9px] font-mono" style={{ color: '#8b949e' }}>+50</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#c9d1d9' }}>
              {getLabel(healthScore)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>
              {isGithubConnected
                ? 'Your setup looks good'
                : 'Connect GitHub to improve your score'}
            </p>
            {/* Mini history chart */}
            <div className="mt-2">
              <div className="flex items-center gap-1 mb-0.5">
                <BarChart3 className="w-3 h-3" style={{ color: '#484f58' }} />
                <span className="text-[9px] font-medium" style={{ color: '#484f58' }}>Last 7 days</span>
              </div>
              <MiniHistoryChart data={HEALTH_HISTORY} currentScore={healthScore} />
            </div>
          </div>
        </div>

        {/* Health Metrics Gauges */}
        <div className="pt-3 border-t" style={{ borderColor: '#21262d' }}>
          <div className="flex items-center gap-1 mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#484f58' }}>
              Health Metrics
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {metrics.map((metric, i) => {
              const catConfig = CATEGORY_CONFIG[metric.category];
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                >
                  <AnimatedGauge
                    value={metric.value}
                    maxValue={metric.maxValue}
                    size={58}
                    strokeWidth={4}
                    color={catConfig.color}
                    label={metric.label}
                    trend={metric.trend}
                    trendValue={metric.trendValue}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Color-coded Categories Summary */}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid #21262d' }}>
          {(Object.entries(CATEGORY_CONFIG) as [keyof typeof CATEGORY_CONFIG, typeof CATEGORY_CONFIG[keyof typeof CATEGORY_CONFIG]][]).map(([key, config]) => {
            const Icon = config.icon;
            const metric = metrics.find(m => m.category === key);
            const isActive = activeCategory === key || activeCategory === 'all';
            return (
              <motion.button
                key={key}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-all duration-200 ${isActive ? '' : 'opacity-50'}`}
                style={{
                  backgroundColor: config.bg,
                  color: config.color,
                  border: `1px solid ${activeCategory === key ? config.color + '40' : 'transparent'}`,
                }}
                onClick={() => setActiveCategory(activeCategory === key ? 'all' : key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-2.5 h-2.5" />
                {metric?.value || 0}%
              </motion.button>
            );
          })}
        </div>

        {/* Quick Fixes Section */}
        <div className="pt-3 border-t" style={{ borderColor: '#21262d' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#484f58' }}>
              <Wrench className="w-3 h-3" style={{ color: '#e3b341' }} /> Quick Fixes
            </span>
            {appliedFixes.size > 0 && (
              <span className="text-[9px] flex items-center gap-1" style={{ color: '#3fb950' }}>
                <CheckCircle className="w-2.5 h-2.5" /> {appliedFixes.size} applied
              </span>
            )}
          </div>

          {displayedFixes.length > 0 ? (
            <div className="space-y-1.5">
              {displayedFixes.map((fix) => (
                <QuickFixCard key={fix.id} fix={fix} onApply={handleApplyFix} />
              ))}
              {filteredFixes.length > 4 && (
                <button
                  className="w-full text-center text-[10px] py-1.5 rounded-lg transition-colors hover:bg-[#21262d]"
                  style={{ color: '#58a6ff' }}
                  onClick={() => setShowAllFixes(!showAllFixes)}
                >
                  {showAllFixes ? 'Show less' : `Show ${filteredFixes.length - 4} more fixes`}
                  <ArrowRight className="w-2.5 h-2.5 inline ml-1" style={{ transform: showAllFixes ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-3">
              <CheckCircle className="w-5 h-5 mx-auto mb-1" style={{ color: '#3fb950' }} />
              <p className="text-[10px]" style={{ color: '#8b949e' }}>All fixes applied!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
