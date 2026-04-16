'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';

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
  { key: 'frontend' as const, label: 'Frontend Hosting', icon: Globe, color: '#58a6ff' },
  { key: 'backend' as const, label: 'Backend Hosting', icon: Server, color: '#e3b341' },
  { key: 'database' as const, label: 'Database Hosting', icon: Database, color: '#3fb950' },
  { key: 'redis' as const, label: 'Redis / Cache', icon: Cpu, color: '#f85149' },
  { key: 'storage' as const, label: 'File Storage', icon: HardDrive, color: '#a371f7' },
];

export function HostingView() {
  const [data, setData] = useState<HostingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hosting')
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
      <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(227,179,65,0.1)', border: '1px solid rgba(227,179,65,0.2)' }}>
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#e3b341' }} />
        <p className="text-xs" style={{ color: '#e3b341' }}>{data.disclaimer}</p>
      </div>

      {/* Categories */}
      {CATEGORY_CONFIG.map((category) => {
        const platforms = data.platforms[category.key];
        if (!platforms || platforms.length === 0) return null;

        return (
          <div key={category.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <category.icon className="w-4 h-4" style={{ color: category.color }} />
              <h2 className="text-sm font-medium" style={{ color: category.color }}>
                {category.label}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <Card key={platform.name} style={{ backgroundColor: '#161b22', borderColor: '#30363d' }} className="hover:border-[#58a6ff] transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm" style={{ color: '#c9d1d9' }}>
                        {platform.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {platform.autoDeploy ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: '#238636', color: '#3fb950' }}>
                            <Zap className="w-2.5 h-2.5 mr-0.5" /> Auto-deploy
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

                    <div className="p-2 rounded" style={{ backgroundColor: '#0d1117' }}>
                      <p className="text-[10px] uppercase font-medium mb-1" style={{ color: '#58a6ff' }}>Free Tier</p>
                      <p className="text-xs" style={{ color: '#c9d1d9' }}>{platform.freeTier}</p>
                    </div>

                    <div className="space-y-1">
                      {platform.pros.map((pro, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 shrink-0" style={{ color: '#3fb950' }} />
                          <span className="text-xs" style={{ color: '#8b949e' }}>{pro}</span>
                        </div>
                      ))}
                      {platform.cons.map((con, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <XCircle className="w-3 h-3 shrink-0" style={{ color: '#f85149' }} />
                          <span className="text-xs" style={{ color: '#8b949e' }}>{con}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={platform.pricingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 hover:underline"
                      style={{ color: '#58a6ff' }}
                    >
                      <ExternalLink className="w-3 h-3" /> Verify pricing
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Deployment Instructions */}
      <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
        <CardHeader>
          <CardTitle className="text-sm" style={{ color: '#c9d1d9' }}>📋 Recommended Setup Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { step: 1, title: 'Connect GitHub Repo to Vercel', desc: 'Import your repo at vercel.com/new, auto-detect Next.js, and deploy.' },
            { step: 2, title: 'Set Up Backend on Railway', desc: 'Create a new project at railway.app, connect your GitHub repo, set environment variables.' },
            { step: 3, title: 'Provision Database on Supabase', desc: 'Create a free project at supabase.com, get the connection string, add to your backend env.' },
            { step: 4, title: 'Configure Custom Domain (Optional)', desc: 'Add your domain in Vercel/Railway settings and update DNS records.' },
            { step: 5, title: 'Verify Live Deployment', desc: 'Visit your live URLs and confirm everything is working correctly.' },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: '#58a6ff20', color: '#58a6ff' }}
              >
                {item.step}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>{item.title}</p>
                <p className="text-xs" style={{ color: '#8b949e' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
