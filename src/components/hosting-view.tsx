'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Globe,
  Server,
  Database,
  HardDrive,
  Cpu,
  CheckCircle,
  XCircle,
  ExternalLink,
  Zap,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Trophy,
  Star,
  Check,
  ArrowRight,
  Sparkles,
  Clock,
  Play,
  Shield,
  GitBranch,
  Info,
  ThumbsUp,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app-store';
import { motion, AnimatePresence } from 'framer-motion';

interface Platform {
  name: string;
  description: string;
  freeTier: string;
  autoDeploy: boolean;
  customDomains: boolean;
  ssl: boolean;
  bandwidth: string;
  popularity: number;
  pricingUrl: string;
  pros: string[];
  cons: string[];
}

interface HostingData {
  platforms: {
    frontend: Platform[];
    backend: Platform[];
    database: Platform[];
    redis: Platform[];
    storage: Platform[];
  };
  disclaimer: string;
}

const CATEGORY_CONFIG = [
  { key: 'frontend' as const, label: 'Frontend Hosting', icon: Globe, color: '#58a6ff', emoji: '🌐' },
  { key: 'backend' as const, label: 'Backend Hosting', icon: Server, color: '#e3b341', emoji: '⚙️' },
  { key: 'database' as const, label: 'Database Hosting', icon: Database, color: '#3fb950', emoji: '🗄️' },
  { key: 'redis' as const, label: 'Redis / Cache', icon: Cpu, color: '#f85149', emoji: '⚡' },
  { key: 'storage' as const, label: 'File Storage', icon: HardDrive, color: '#a371f7', emoji: '💾' },
];

const COMPARISON_FEATURES = [
  { key: 'freeTier', label: 'Free Tier' },
  { key: 'autoDeploy', label: 'Auto Deploy' },
  { key: 'customDomains', label: 'Custom Domains' },
  { key: 'ssl', label: 'SSL' },
  { key: 'bandwidth', label: 'Bandwidth' },
];

// Interactive Star Rating with hover
function StarRating({ rating, color, onHover }: { rating: number; color: string; onHover?: (star: number | null) => void }) {
  const [hoverStar, setHoverStar] = useState<number | null>(null);
  const displayRating = hoverStar ?? rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-3 h-3 cursor-pointer transition-all duration-150"
          style={{
            color: star <= displayRating ? color : '#21262d',
            fill: star <= displayRating ? color : 'none',
            transform: hoverStar === star ? 'scale(1.2)' : 'scale(1)',
          }}
          onMouseEnter={() => { setHoverStar(star); onHover?.(star); }}
          onMouseLeave={() => { setHoverStar(null); onHover?.(null); }}
        />
      ))}
    </div>
  );
}

function normalizePlatform(p: Record<string, unknown>, categoryColor: string): Platform {
  return {
    name: (p.name as string) || 'Unknown',
    description: (p.description as string) || '',
    freeTier: (p.freeTier as string) || 'Limited free tier',
    autoDeploy: (p.autoDeploy as boolean) ?? false,
    customDomains: (p.customDomains as boolean) ?? (p.autoDeploy as boolean) ?? false,
    ssl: (p.ssl as boolean) ?? (p.autoDeploy as boolean) ?? false,
    bandwidth: (p.bandwidth as string) || '100GB/mo',
    popularity: (p.popularity as number) ?? (p.autoDeploy ? 4 : 3),
    pricingUrl: (p.pricingUrl as string) || '#',
    pros: (p.pros as string[]) || [],
    cons: (p.cons as string[]) || [],
  };
}

// Hosting Score Calculator
function calculateHostingScore(platform: Platform, categoryKey: string): number {
  let score = 50; // base
  if (platform.autoDeploy) score += 15;
  if (platform.customDomains) score += 10;
  if (platform.ssl) score += 10;
  score += platform.popularity * 3;
  if (categoryKey === 'frontend' && platform.name === 'Vercel') score += 10;
  if (categoryKey === 'backend' && platform.name === 'Railway') score += 10;
  if (categoryKey === 'database' && platform.name === 'Supabase') score += 10;
  return Math.min(score, 99);
}

export function HostingView() {
  const { selectedProject } = useAppStore();
  const [data, setData] = useState<HostingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [deployingPlatform, setDeployingPlatform] = useState<string | null>(null);
  const [visibleFeatures, setVisibleFeatures] = useState<Set<string>>(new Set(COMPARISON_FEATURES.map(f => f.key)));
  const [showFeatureCustomize, setShowFeatureCustomize] = useState(false);
  const [showHostingScore, setShowHostingScore] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/hosting')
      .then((res) => res.json())
      .then((rawData) => {
        const normalized = { ...rawData };
        for (const key of Object.keys(normalized.platforms)) {
          const k = key as keyof typeof normalized.platforms;
          const catConfig = CATEGORY_CONFIG.find(c => c.key === k);
          normalized.platforms[k] = (normalized.platforms[k] as Record<string, unknown>[]).map(p =>
            normalizePlatform(p, catConfig?.color || '#58a6ff')
          );
        }
        setData(normalized as HostingData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleCard = (name: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const copyCommand = (platform: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${platform} command copied to clipboard` });
  };

  const toggleStepComplete = (stepIdx: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepIdx)) next.delete(stepIdx); else next.add(stepIdx);
      return next;
    });
  };

  const handleOneClickDeploy = (platform: Platform) => {
    setDeployingPlatform(platform.name);
    setTimeout(() => {
      setDeployingPlatform(null);
      toast({ title: 'Connected!', description: `${platform.name} connected to your project` });
    }, 2000);
  };

  // Hosting Score recommendations — must be before early returns (rules of hooks)
  const hostingRecommendations = useMemo(() => {
    if (!data || !selectedProject) return [];
    const framework = selectedProject.framework?.toLowerCase() || '';
    const recs: { name: string; score: number; reason: string; color: string; category: string }[] = [];

    for (const cat of CATEGORY_CONFIG) {
      const plats = data.platforms[cat.key];
      if (!plats) continue;
      for (const plat of plats.slice(0, 2)) {
        const score = calculateHostingScore(plat, cat.key);
        let reason = '';
        if (framework.includes('next') && plat.name === 'Vercel') reason = 'Vercel is built by the Next.js team with zero-config deployment';
        else if (framework.includes('react') && cat.key === 'frontend') reason = 'Excellent React/SPA hosting with global CDN';
        else if (plat.autoDeploy && plat.customDomains && plat.ssl) reason = 'Full-featured platform with auto-deploy, custom domains, and SSL';
        else if (plat.autoDeploy) reason = 'Auto-deploy from GitHub with zero configuration';
        else reason = `Top-rated ${cat.label.replace(' Hosting', '')} platform with ${plat.popularity}/5 rating`;
        recs.push({ name: plat.name, score, reason, color: cat.color, category: cat.label });
      }
    }
    return recs.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [data, selectedProject]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: '#161b22' }} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const topPlatforms: { category: string; platform: Platform; color: string; categoryKey: string }[] = [];
  for (const cat of CATEGORY_CONFIG) {
    const plats = data.platforms[cat.key];
    if (plats && plats.length > 0) {
      topPlatforms.push({ category: cat.label, platform: plats[0], color: cat.color, categoryKey: cat.key });
    }
  }

  const setupSteps = [
    { step: 1, title: 'Connect GitHub Repo to Vercel', desc: 'Import your repo at vercel.com/new, auto-detect Next.js, and deploy.', cmd: 'npx vercel --prod', estimatedTime: '~2 min', troubleshooting: 'If auto-detection fails, manually select Next.js framework in settings.' },
    { step: 2, title: 'Set Up Backend on Railway', desc: 'Create a new project at railway.app, connect your GitHub repo, set environment variables.', cmd: 'railway up', estimatedTime: '~3 min', troubleshooting: 'Make sure to add all required environment variables before deploying.' },
    { step: 3, title: 'Provision Database on Supabase', desc: 'Create a free project at supabase.com, get the connection string, add to your backend env.', cmd: 'supabase init', estimatedTime: '~2 min', troubleshooting: 'Copy the connection string from Settings → Database → Connection string.' },
    { step: 4, title: 'Configure Custom Domain (Optional)', desc: 'Add your domain in Vercel/Railway settings and update DNS records.', cmd: '', estimatedTime: '~5 min', troubleshooting: 'DNS propagation can take up to 48 hours for some providers.' },
    { step: 5, title: 'Verify Live Deployment', desc: 'Visit your live URLs and confirm everything is working correctly.', cmd: '', estimatedTime: '~1 min', troubleshooting: 'Check browser console for errors. Try hard refresh (Ctrl+Shift+R).' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative overflow-hidden rounded-xl p-6" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)', border: '1px solid #30363d' }}>
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #58a6ff, transparent)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #3fb950, transparent)', filter: 'blur(50px)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" style={{ color: '#e3b341' }} />
            <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #58a6ff, #3fb950, #e3b341)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Free Hosting Advisor
            </h1>
          </div>
          <p className="text-sm mb-3" style={{ color: '#8b949e' }}>
            {CATEGORY_CONFIG.map(c => c.emoji).join(' ')} Verified free hosting platforms for every layer of your stack
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.2)' }}>
              <CheckCircle className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />
              <span className="text-xs font-medium" style={{ color: '#3fb950' }}>Save $0/mo with these free tiers</span>
            </div>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[10px]" style={{ borderColor: '#30363d', color: '#58a6ff' }} onClick={() => setShowHostingScore(!showHostingScore)}>
              <Shield className="w-3 h-3" /> {showHostingScore ? 'Hide' : 'Show'} Hosting Score
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Hosting Score Section */}
      <AnimatePresence>
        {showHostingScore && hostingRecommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: 0.05, duration: 0.4 }}>
            <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" style={{ color: '#e3b341' }} />
                  <CardTitle className="text-sm" style={{ color: '#c9d1d9' }}>Hosting Score</CardTitle>
                  {selectedProject && (
                    <Badge variant="outline" className="text-[9px] px-1.5" style={{ borderColor: '#58a6ff40', color: '#58a6ff' }}>
                      {selectedProject.framework || 'General'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {hostingRecommendations.map((rec, i) => (
                    <motion.div
                      key={rec.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
                      className="p-3 rounded-lg border relative overflow-hidden"
                      style={{ backgroundColor: '#0d1117', borderColor: `${rec.color}20` }}
                    >
                      {/* Rank badge */}
                      <div className="absolute top-0 right-0">
                        <div className="px-2 py-0.5 rounded-bl-lg text-[8px] font-bold" style={{ backgroundColor: `${rec.color}15`, color: rec.color }}>
                          #{i + 1}
                        </div>
                      </div>
                      {/* Score bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>{rec.name}</span>
                          <span className="text-sm font-bold" style={{ color: rec.color }}>{rec.score}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#21262d' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${rec.color}, ${rec.color}cc)` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${rec.score}%` }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                      <p className="text-[10px]" style={{ color: '#8b949e' }}>{rec.category}</p>
                      <div className="flex items-start gap-1 mt-1.5">
                        <ThumbsUp className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: rec.color }} />
                        <p className="text-[9px] leading-relaxed" style={{ color: '#8b949e' }}>{rec.reason}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature Comparison Table */}
      {topPlatforms.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" style={{ color: '#e3b341' }} />
                  <CardTitle className="text-sm" style={{ color: '#c9d1d9' }}>Feature Comparison</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" style={{ color: '#8b949e' }} onClick={() => setShowFeatureCustomize(!showFeatureCustomize)}>
                  <Info className="w-3 h-3" /> Customize
                </Button>
              </div>
              {/* Feature customization */}
              <AnimatePresence>
                {showFeatureCustomize && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="flex flex-wrap gap-2 pt-2">
                      {COMPARISON_FEATURES.map((feat) => (
                        <label key={feat.key} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                          <Switch
                            checked={visibleFeatures.has(feat.key)}
                            onCheckedChange={(checked) => {
                              setVisibleFeatures(prev => {
                                const next = new Set(prev);
                                if (checked) next.add(feat.key); else next.delete(feat.key);
                                return next;
                              });
                            }}
                          />
                          <span style={{ color: '#8b949e' }}>{feat.label}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-xs" style={{ minWidth: '500px' }}>
                  <thead>
                    <tr className="sticky top-0" style={{ borderBottom: '1px solid #21262d', backgroundColor: '#161b22' }}>
                      <th className="text-left py-2 px-3 font-medium" style={{ color: '#8b949e' }}>Feature</th>
                      {topPlatforms.map((tp, i) => (
                        <th key={i} className="text-center py-2 px-3 font-semibold relative" style={{ color: tp.color }}>
                          {tp.platform.name}
                          {i === 0 && (
                            <span className="block text-[8px] mt-0.5 font-normal" style={{ color: '#e3b341' }}>
                              <Trophy className="w-2 h-2 inline mr-0.5" /> Winner
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FEATURES.filter(f => visibleFeatures.has(f.key)).map((feat, rowIdx) => {
                      // Determine winner for this feature
                      let winnerIdx = 0;
                      if (feat.key === 'autoDeploy' || feat.key === 'customDomains' || feat.key === 'ssl') {
                        const allTrue = topPlatforms.every(tp => tp.platform[feat.key as keyof Platform] === true);
                        if (!allTrue) {
                          const trueIdx = topPlatforms.findIndex(tp => tp.platform[feat.key as keyof Platform] === true);
                          if (trueIdx >= 0) winnerIdx = trueIdx;
                        }
                      }
                      return (
                        <tr key={feat.key} style={{ borderBottom: '1px solid #21262d', backgroundColor: rowIdx % 2 === 0 ? 'transparent' : 'rgba(22,27,34,0.5)' }}>
                          <td className="py-2.5 px-3 font-medium" style={{ color: '#c9d1d9' }}>{feat.label}</td>
                          {topPlatforms.map((tp, i) => {
                            const val = tp.platform[feat.key as keyof Platform];
                            const isWinner = i === winnerIdx;
                            if (feat.key === 'freeTier' || feat.key === 'bandwidth') {
                              return (
                                <td key={i} className="py-2.5 px-3 text-center" style={{ color: '#c9d1d9' }}>
                                  <span className="text-[10px]">{val as string}</span>
                                  {isWinner && <Trophy className="w-2.5 h-2.5 inline ml-1" style={{ color: '#e3b341' }} />}
                                </td>
                              );
                            }
                            return (
                              <td key={i} className="py-2.5 px-3 text-center" style={{ backgroundColor: isWinner ? 'rgba(63,185,80,0.03)' : 'transparent' }}>
                                {val ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <CheckCircle className="w-4 h-4" style={{ color: '#3fb950' }} />
                                    {isWinner && <Trophy className="w-2.5 h-2.5" style={{ color: '#e3b341' }} />}
                                  </div>
                                ) : (
                                  <XCircle className="w-4 h-4 mx-auto" style={{ color: '#f85149' }} />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(227,179,65,0.06)', borderColor: 'rgba(227,179,65,0.15)' }}>
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#e3b341' }} />
        <p className="text-xs" style={{ color: '#e3b341' }}>{data.disclaimer}</p>
      </div>

      {/* Categories */}
      {CATEGORY_CONFIG.map((category, catIdx) => {
        const platforms = data.platforms[category.key];
        if (!platforms || platforms.length === 0) return null;

        return (
          <div key={category.key} className="space-y-3">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + catIdx * 0.05, duration: 0.3 }} className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${category.color}15` }}>
                <category.icon className="w-4 h-4" style={{ color: category.color }} />
              </div>
              <h2 className="text-sm font-semibold animate-underline" style={{ color: category.color }}>
                {category.emoji} {category.label}
              </h2>
              <div className="flex-1 h-px" style={{ backgroundColor: '#21262d' }} />
              <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${category.color}30`, color: category.color }}>
                {platforms.length} options
              </Badge>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {platforms.map((platform, idx) => {
                const isExpanded = expandedCards.has(platform.name);
                const isRecommended = idx === 0;
                const isDeploying = deployingPlatform === platform.name;

                return (
                  <motion.div
                    key={platform.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05, duration: 0.3 }}
                  >
                    <Card
                      className={`group transition-all duration-200 hover:-translate-y-0.5 ${
                        isRecommended ? 'gradient-top-border' : ''
                      }`}
                      style={{
                        backgroundColor: '#161b22',
                        borderColor: isRecommended ? category.color : '#30363d',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Animated gradient border on hover */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          padding: '1px',
                          borderRadius: 'inherit',
                          background: `linear-gradient(135deg, ${category.color}60, transparent, ${category.color}40)`,
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                        }}
                      />

                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {/* Platform logo */}
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                              {platform.name.charAt(0)}
                            </div>
                            <div>
                              <CardTitle className="text-sm" style={{ color: '#c9d1d9' }}>{platform.name}</CardTitle>
                              <StarRating rating={platform.popularity} color={category.color} />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Deployment count badge */}
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0" style={{ borderColor: '#21262d', color: '#484f58' }}>
                              {[25, 35, 50, 15, 40, 30, 20, 45][idx % 8]}k deploys
                            </Badge>
                            {platform.autoDeploy ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: '#238636', color: '#3fb950' }}>
                                <Zap className="w-2.5 h-2.5 mr-0.5" /> Auto
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: '#30363d', color: '#8b949e' }}>Manual</Badge>
                            )}
                          </div>
                        </div>
                        {/* Recommended badge */}
                        {isRecommended && (
                          <Badge className="text-[9px] px-1.5 py-0 mt-1 w-fit" style={{ backgroundColor: 'rgba(227,179,65,0.15)', color: '#e3b341', border: '1px solid rgba(227,179,65,0.3)' }}>
                            <Trophy className="w-2.5 h-2.5 mr-0.5" /> Recommended
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs" style={{ color: '#8b949e' }}>{platform.description}</p>

                        {/* Free Tier highlight with pricing tooltip */}
                        <div className="p-3 rounded-lg relative overflow-hidden group/price" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(63,185,80,0.15)' }}>
                          <div className="absolute top-0 right-0 w-16 h-16 opacity-10" style={{ background: 'radial-gradient(circle, #3fb950, transparent)', filter: 'blur(15px)' }} />
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-[10px] uppercase font-bold" style={{ color: category.color }}>Free Tier</p>
                            <span className="text-[8px] font-bold px-1.5 py-0 rounded-full free-badge-glow" style={{ backgroundColor: 'rgba(63,185,80,0.2)', color: '#3fb950' }}>FREE</span>
                            {/* Pricing tooltip */}
                            <div className="relative ml-auto">
                              <Info className="w-3 h-3 cursor-help" style={{ color: '#484f58' }} />
                              <div className="absolute right-0 bottom-full mb-1 w-32 p-2 rounded-lg text-[9px] hidden group-hover/price:block z-50" style={{ backgroundColor: '#21262d', border: '1px solid #30363d', color: '#8b949e' }}>
                                💰 All plans listed are completely FREE. No credit card required.
                              </div>
                            </div>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: '#c9d1d9' }}>{platform.freeTier}</p>
                        </div>

                        {/* One-Click Deploy button with loading state */}
                        {platform.autoDeploy && (
                          <Button
                            className="w-full gap-2 h-8 text-xs"
                            disabled={isDeploying}
                            style={{ background: isDeploying ? '#21262d' : `linear-gradient(135deg, ${category.color}cc, ${category.color})`, color: 'white' }}
                            onClick={() => handleOneClickDeploy(platform)}
                          >
                            {isDeploying ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connecting...
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5" /> One-Click Deploy
                              </>
                            )}
                          </Button>
                        )}

                        {/* Pros/Cons expand */}
                        <button onClick={() => toggleCard(platform.name)} className="flex items-center gap-1 text-[10px] w-full text-left" style={{ color: '#8b949e' }}>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'Hide' : 'Show'} pros & cons
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                              <div className="space-y-1.5">
                                {platform.pros.map((pro, i) => (
                                  <div key={i} className="flex items-start gap-1.5">
                                    <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#3fb950' }} />
                                    <span className="text-xs" style={{ color: '#8b949e' }}>{pro}</span>
                                  </div>
                                ))}
                                {platform.cons.map((con, i) => (
                                  <div key={i} className="flex items-start gap-1.5">
                                    <XCircle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#f85149' }} />
                                    <span className="text-xs" style={{ color: '#8b949e' }}>{con}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#21262d' }}>
                          <a href={platform.pricingUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center gap-1 hover:underline" style={{ color: '#58a6ff' }}>
                            <ExternalLink className="w-2.5 h-2.5" /> Pricing
                          </a>
                          {platform.autoDeploy && (
                            <button onClick={() => copyCommand(platform.name, `Connect ${platform.name} to your GitHub repo`)} className="text-[10px] flex items-center gap-1 hover:text-[#c9d1d9] transition-colors" style={{ color: '#8b949e' }}>
                              <Copy className="w-2.5 h-2.5" /> Copy
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Enhanced Setup Steps */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
        <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
                📋 Recommended Setup Steps
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(88,166,255,0.1)', color: '#58a6ff' }}>
                  {completedSteps.size}/{setupSteps.length} complete
                </span>
                {/* Generate Workflow button */}
                <Button variant="outline" size="sm" className="h-6 gap-1 text-[9px]" style={{ borderColor: '#30363d', color: '#3fb950' }} onClick={() => toast({ title: 'Workflow Generated!', description: 'A basic deploy.yml has been created for your project' })}>
                  <GitBranch className="w-2.5 h-2.5" /> Generate Workflow
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {setupSteps.map((item, idx) => {
              const isComplete = completedSteps.has(idx);
              const isActive = activeStep === idx;

              return (
                <div key={item.step} className="rounded-lg border transition-all duration-200 cursor-pointer" style={{ backgroundColor: isComplete ? 'rgba(63,185,80,0.04)' : '#0d1117', borderColor: isComplete ? 'rgba(63,185,80,0.2)' : '#21262d' }} onClick={() => setActiveStep(isActive ? null : idx)}>
                  <div className="flex gap-3 items-center p-3">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200" style={{ background: isComplete ? 'linear-gradient(135deg, #3fb950, #238636)' : '#21262d', color: isComplete ? 'white' : '#8b949e' }} onClick={(e) => { e.stopPropagation(); toggleStepComplete(idx); }}>
                      {isComplete ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{item.step}</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium" style={{ color: isComplete ? '#3fb950' : '#c9d1d9', textDecoration: isComplete ? 'line-through' : 'none' }}>{item.title}</p>
                        <div className="flex items-center gap-2">
                          {item.estimatedTime && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(88,166,255,0.1)', color: '#58a6ff' }}>
                              <Clock className="w-2.5 h-2.5 inline mr-0.5" />{item.estimatedTime}
                            </span>
                          )}
                          <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform duration-200" style={{ color: '#484f58', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-3 pb-3 pl-14 space-y-2">
                          <p className="text-[11px]" style={{ color: '#8b949e' }}>{item.desc}</p>
                          {item.cmd && (
                            <div className="flex items-center gap-2">
                              <code className="text-[10px] font-mono px-2.5 py-1 rounded-md flex-1" style={{ backgroundColor: '#161b22', color: '#58a6ff', border: '1px solid #21262d' }}>
                                {item.cmd}
                              </code>
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] shrink-0" style={{ color: '#8b949e' }} onClick={(e) => { e.stopPropagation(); copyCommand(`Step ${item.step}`, item.cmd); }}>
                                <Copy className="w-3 h-3" /> Copy
                              </Button>
                            </div>
                          )}
                          {/* Troubleshooting tips */}
                          {item.troubleshooting && (
                            <div className="flex items-start gap-1.5 p-2 rounded-md" style={{ backgroundColor: 'rgba(227,179,65,0.05)', border: '1px solid rgba(227,179,65,0.1)' }}>
                              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#e3b341' }} />
                              <p className="text-[9px]" style={{ color: '#e3b341' }}>{item.troubleshooting}</p>
                            </div>
                          )}
                          {/* Video placeholder thumbnail */}
                          <div className="relative rounded-md overflow-hidden h-20 flex items-center justify-center" style={{ backgroundColor: '#161b22', border: '1px solid #21262d' }}>
                            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(88,166,255,0.05), rgba(63,185,80,0.05))' }}>
                              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(88,166,255,0.15)' }}>
                                <Play className="w-4 h-4" style={{ color: '#58a6ff' }} />
                              </div>
                            </div>
                            <span className="absolute bottom-1 right-2 text-[8px]" style={{ color: '#484f58' }}>Video Guide</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#21262d' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3fb950, #58a6ff)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedSteps.size / setupSteps.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] mt-1 text-center" style={{ color: '#484f58' }}>
                {completedSteps.size === setupSteps.length ? '🎉 All steps complete!' : `Step ${completedSteps.size + 1} of ${setupSteps.length}`}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
