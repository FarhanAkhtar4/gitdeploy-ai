'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Platform {
  name: string;
  description: string;
  freeTier: string;
  autoDeploy: boolean;
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
  { key: 'frontend' as const, label: 'Frontend Hosting', icon: Globe, color: '#58a6ff', gradient: 'from-[#58a6ff] to-[#79c0ff]' },
  { key: 'backend' as const, label: 'Backend Hosting', icon: Server, color: '#e3b341', gradient: 'from-[#e3b341] to-[#f0c050]' },
  { key: 'database' as const, label: 'Database Hosting', icon: Database, color: '#3fb950', gradient: 'from-[#3fb950] to-[#56d364]' },
  { key: 'redis' as const, label: 'Redis / Cache', icon: Cpu, color: '#f85149', gradient: 'from-[#f85149] to-[#ff7b72]' },
  { key: 'storage' as const, label: 'File Storage', icon: HardDrive, color: '#a371f7', gradient: 'from-[#a371f7] to-[#bc8cff]' },
];

export function HostingView() {
  const [data, setData] = useState<HostingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/hosting')
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleCard = (name: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const copyCommand = (platform: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${platform} command copied to clipboard` });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: '#c9d1d9' }}>Free Hosting Advisor</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: '#161b22' }} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#c9d1d9' }}>
          🆓 Free Hosting Recommendations
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
          Verified free hosting platforms for every layer of your stack
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(227,179,65,0.06)', borderColor: 'rgba(227,179,65,0.15)' }}>
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#e3b341' }} />
        <p className="text-xs" style={{ color: '#e3b341' }}>{data.disclaimer}</p>
      </div>

      {/* Categories */}
      {CATEGORY_CONFIG.map((category) => {
        const platforms = data.platforms[category.key];
        if (!platforms || platforms.length === 0) return null;

        return (
          <div key={category.key} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${category.color}15` }}>
                <category.icon className="w-4 h-4" style={{ color: category.color }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: category.color }}>
                {category.label}
              </h2>
              <div className="flex-1 h-px" style={{ backgroundColor: '#21262d' }} />
              <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${category.color}30`, color: category.color }}>
                {platforms.length} options
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {platforms.map((platform, idx) => {
                const isExpanded = expandedCards.has(platform.name);
                const isRecommended = idx === 0;

                return (
                  <Card
                    key={platform.name}
                    className={`group transition-all duration-200 hover:-translate-y-0.5 ${
                      isRecommended ? 'border-2' : ''
                    }`}
                    style={{
                      backgroundColor: '#161b22',
                      borderColor: isRecommended ? category.color : '#30363d',
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm" style={{ color: '#c9d1d9' }}>
                            {platform.name}
                          </CardTitle>
                          {isRecommended && (
                            <Badge className="text-[9px] px-1.5 py-0" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {platform.autoDeploy ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: '#238636', color: '#3fb950' }}>
                              <Zap className="w-2.5 h-2.5 mr-0.5" /> Auto
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: '#30363d', color: '#8b949e' }}>
                              Manual
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs" style={{ color: '#8b949e' }}>{platform.description}</p>

                      <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
                        <p className="text-[10px] uppercase font-bold mb-1" style={{ color: category.color }}>Free Tier</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#c9d1d9' }}>{platform.freeTier}</p>
                      </div>

                      {/* Pros/Cons */}
                      <button
                        onClick={() => toggleCard(platform.name)}
                        className="flex items-center gap-1 text-[10px] w-full text-left"
                        style={{ color: '#8b949e' }}
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isExpanded ? 'Hide' : 'Show'} pros & cons
                      </button>

                      {isExpanded && (
                        <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-1">
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
                      )}

                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#21262d' }}>
                        <a
                          href={platform.pricingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] flex items-center gap-1 hover:underline"
                          style={{ color: '#58a6ff' }}
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> Pricing
                        </a>
                        {platform.autoDeploy && (
                          <button
                            onClick={() => copyCommand(platform.name, `Connect ${platform.name} to your GitHub repo`)}
                            className="text-[10px] flex items-center gap-1 hover:text-[#c9d1d9] transition-colors"
                            style={{ color: '#8b949e' }}
                          >
                            <Copy className="w-2.5 h-2.5" /> Copy
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Deployment Instructions */}
      <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
            📋 Recommended Setup Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { step: 1, title: 'Connect GitHub Repo to Vercel', desc: 'Import your repo at vercel.com/new, auto-detect Next.js, and deploy.', cmd: 'npx vercel --prod' },
            { step: 2, title: 'Set Up Backend on Railway', desc: 'Create a new project at railway.app, connect your GitHub repo, set environment variables.', cmd: 'railway up' },
            { step: 3, title: 'Provision Database on Supabase', desc: 'Create a free project at supabase.com, get the connection string, add to your backend env.', cmd: 'supabase init' },
            { step: 4, title: 'Configure Custom Domain (Optional)', desc: 'Add your domain in Vercel/Railway settings and update DNS records.', cmd: '' },
            { step: 5, title: 'Verify Live Deployment', desc: 'Visit your live URLs and confirm everything is working correctly.', cmd: '' },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 items-start">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #58a6ff, #3fb950)', color: 'white' }}
              >
                {item.step}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>{item.title}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#8b949e' }}>{item.desc}</p>
                {item.cmd && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <code className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: '#0d1117', color: '#58a6ff' }}>
                      {item.cmd}
                    </code>
                    <button
                      onClick={() => copyCommand(`Step ${item.step}`, item.cmd)}
                      className="text-[10px] flex items-center gap-0.5 hover:text-[#c9d1d9] transition-colors"
                      style={{ color: '#484f58' }}
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
