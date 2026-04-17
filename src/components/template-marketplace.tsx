'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Star,
  Download,
  Globe,
  Server,
  LayoutGrid,
  Smartphone,
  Workflow,
  ArrowUpRight,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Code,
  Box,
  Layers,
  Users,
  TrendingUp,
  X,
  Clock,
  Zap,
  ShoppingBag,
  ChevronRight,
  Eye,
  FileCode,
  Database,
  Shield,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── Template Data (16 templates) ─── */
const TEMPLATES = [
  { id: '1', name: 'SaaS Starter', category: 'saas', author: 'GitDeploy', stars: 4.8, downloads: 2340, tech: ['Next.js', 'Prisma', 'Stripe'], description: 'Complete SaaS boilerplate with auth, billing, and dashboard', color: '#58a6ff', featured: true, difficulty: 'intermediate' as const, buildTime: '~15 min', recentlyUsed: true },
  { id: '2', name: 'REST API', category: 'devtools', author: 'GitDeploy', stars: 4.6, downloads: 1890, tech: ['Express', 'MongoDB', 'JWT'], description: 'Production-ready REST API with authentication and validation', color: '#3fb950', featured: false, difficulty: 'beginner' as const, buildTime: '~8 min', recentlyUsed: false },
  { id: '3', name: 'E-commerce Store', category: 'ecommerce', author: 'Community', stars: 4.5, downloads: 1560, tech: ['Next.js', 'Supabase', 'Stripe'], description: 'Full e-commerce with cart, checkout, and order management', color: '#e3b341', featured: true, difficulty: 'advanced' as const, buildTime: '~25 min', recentlyUsed: false },
  { id: '4', name: 'Blog CMS', category: 'dashboard', author: 'GitDeploy', stars: 4.7, downloads: 1230, tech: ['Next.js', 'MDX', 'Vercel'], description: 'Markdown-powered blog with CMS and SEO optimization', color: '#a371f7', featured: false, difficulty: 'beginner' as const, buildTime: '~10 min', recentlyUsed: true },
  { id: '5', name: 'Real-time Chat', category: 'social', author: 'Community', stars: 4.4, downloads: 980, tech: ['React', 'Socket.io', 'Redis'], description: 'WebSocket chat with rooms, DMs, and file sharing', color: '#f778ba', featured: false, difficulty: 'intermediate' as const, buildTime: '~18 min', recentlyUsed: false },
  { id: '6', name: 'Admin Dashboard', category: 'dashboard', author: 'GitDeploy', stars: 4.9, downloads: 3200, tech: ['Next.js', 'Recharts', 'Prisma'], description: 'Analytics dashboard with charts, tables, and export', color: '#58a6ff', featured: true, difficulty: 'intermediate' as const, buildTime: '~20 min', recentlyUsed: false },
  { id: '7', name: 'CI/CD Pipeline', category: 'devtools', author: 'GitDeploy', stars: 4.3, downloads: 760, tech: ['GitHub Actions', 'Docker', 'Terraform'], description: 'Complete CI/CD with staging, production, and rollback', color: '#8b949e', featured: false, difficulty: 'advanced' as const, buildTime: '~12 min', recentlyUsed: false },
  { id: '8', name: 'Social Network', category: 'social', author: 'Community', stars: 4.2, downloads: 650, tech: ['React', 'Firebase', 'Tailwind'], description: 'Social platform with profiles, feeds, and messaging', color: '#f778ba', featured: false, difficulty: 'advanced' as const, buildTime: '~30 min', recentlyUsed: false },
  { id: '9', name: 'AI Chatbot', category: 'saas', author: 'GitDeploy', stars: 4.8, downloads: 2100, tech: ['Next.js', 'OpenAI', 'Prisma'], description: 'AI-powered chatbot with streaming responses and memory', color: '#58a6ff', featured: true, difficulty: 'intermediate' as const, buildTime: '~15 min', recentlyUsed: true },
  { id: '10', name: 'Marketplace', category: 'ecommerce', author: 'Community', stars: 4.5, downloads: 890, tech: ['Next.js', 'Stripe', 'PostgreSQL'], description: 'Multi-vendor marketplace with escrow and reviews', color: '#e3b341', featured: false, difficulty: 'advanced' as const, buildTime: '~35 min', recentlyUsed: false },
  { id: '11', name: 'Auth Service', category: 'devtools', author: 'GitDeploy', stars: 4.7, downloads: 1450, tech: ['NextAuth', 'OAuth', 'JWT'], description: 'Complete auth microservice with OAuth providers', color: '#3fb950', featured: false, difficulty: 'beginner' as const, buildTime: '~8 min', recentlyUsed: false },
  { id: '12', name: 'Portfolio Site', category: 'dashboard', author: 'Community', stars: 4.3, downloads: 720, tech: ['Next.js', 'Framer Motion', 'MDX'], description: 'Animated portfolio with blog and project showcase', color: '#a371f7', featured: false, difficulty: 'beginner' as const, buildTime: '~10 min', recentlyUsed: false },
  { id: '13', name: 'Subscription App', category: 'saas', author: 'GitDeploy', stars: 4.6, downloads: 1100, tech: ['Next.js', 'Stripe', 'Supabase'], description: 'Subscription management with billing portal and webhooks', color: '#58a6ff', featured: false, difficulty: 'intermediate' as const, buildTime: '~18 min', recentlyUsed: false },
  { id: '14', name: 'Dev Tools CLI', category: 'devtools', author: 'Community', stars: 4.1, downloads: 540, tech: ['Node.js', 'Commander', 'Chalk'], description: 'CLI tool framework with plugins and auto-updates', color: '#8b949e', featured: false, difficulty: 'intermediate' as const, buildTime: '~12 min', recentlyUsed: false },
  { id: '15', name: 'Job Board', category: 'social', author: 'GitDeploy', stars: 4.4, downloads: 880, tech: ['Next.js', 'Prisma', 'Tailwind'], description: 'Job listing platform with search, filters, and applications', color: '#f778ba', featured: false, difficulty: 'intermediate' as const, buildTime: '~18 min', recentlyUsed: false },
  { id: '16', name: 'Analytics Platform', category: 'dashboard', author: 'GitDeploy', stars: 4.8, downloads: 1980, tech: ['Next.js', 'ClickHouse', 'Grafana'], description: 'Real-time analytics with custom dashboards and alerts', color: '#58a6ff', featured: true, difficulty: 'advanced' as const, buildTime: '~28 min', recentlyUsed: false },
];

/* ─── Enhanced Categories ─── */
const CATEGORIES = [
  { id: 'all', label: 'All', icon: Layers, count: TEMPLATES.length },
  { id: 'saas', label: 'SaaS', icon: Zap, count: TEMPLATES.filter(t => t.category === 'saas').length },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag, count: TEMPLATES.filter(t => t.category === 'ecommerce').length },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, count: TEMPLATES.filter(t => t.category === 'dashboard').length },
  { id: 'social', label: 'Social', icon: Users, count: TEMPLATES.filter(t => t.category === 'social').length },
  { id: 'devtools', label: 'Dev Tools', icon: Code, count: TEMPLATES.filter(t => t.category === 'devtools').length },
];

type SortOption = 'popular' | 'newest' | 'simplest';

/* ─── Tech badge color mapping ─── */
const TECH_COLORS: Record<string, string> = {
  'Next.js': '#c9d1d9', 'Prisma': '#58a6ff', 'Stripe': '#a371f7',
  'Express': '#3fb950', 'MongoDB': '#3fb950', 'JWT': '#e3b341',
  'Supabase': '#3fb950', 'MDX': '#a371f7', 'Vercel': '#c9d1d9',
  'React': '#58a6ff', 'Socket.io': '#f778ba', 'Redis': '#f85149',
  'Recharts': '#58a6ff', 'GitHub Actions': '#e3b341', 'Docker': '#58a6ff',
  'Terraform': '#a371f7', 'Firebase': '#e3b341', 'OpenAI': '#3fb950',
  'PostgreSQL': '#58a6ff', 'NextAuth': '#c9d1d9', 'OAuth': '#e3b341',
  'Framer Motion': '#f778ba', 'Tailwind': '#58a6ff', 'ClickHouse': '#e3b341',
  'Grafana': '#f778ba', 'Commander': '#3fb950', 'Chalk': '#58a6ff',
  'Node.js': '#3fb950',
};

/* ─── Difficulty config ─── */
const DIFFICULTY_CONFIG = {
  beginner: { color: '#3fb950', bg: 'rgba(63,185,80,0.12)', label: 'Beginner', bars: 1 },
  intermediate: { color: '#e3b341', bg: 'rgba(227,179,65,0.12)', label: 'Intermediate', bars: 2 },
  advanced: { color: '#f85149', bg: 'rgba(248,81,73,0.12)', label: 'Advanced', bars: 3 },
};

/* ─── Preview file data for quick preview ─── */
const PREVIEW_FILES: Record<string, Array<{ name: string; lines: number; purpose: string }>> = {
  '1': [{ name: 'src/app/page.tsx', lines: 45, purpose: 'Main entry with dashboard' }, { name: 'src/lib/stripe.ts', lines: 32, purpose: 'Stripe client setup' }, { name: 'prisma/schema.prisma', lines: 85, purpose: 'Database models' }, { name: 'src/app/api/billing/route.ts', lines: 28, purpose: 'Billing webhook handler' }, { name: 'src/middleware.ts', lines: 18, purpose: 'Auth middleware' }],
  '3': [{ name: 'src/app/page.tsx', lines: 60, purpose: 'Storefront homepage' }, { name: 'src/app/cart/page.tsx', lines: 75, purpose: 'Shopping cart page' }, { name: 'src/app/api/checkout/route.ts', lines: 45, purpose: 'Checkout API handler' }, { name: 'prisma/schema.prisma', lines: 110, purpose: 'Product & order models' }, { name: 'src/components/ProductCard.tsx', lines: 35, purpose: 'Product display component' }],
  '6': [{ name: 'src/app/page.tsx', lines: 50, purpose: 'Dashboard with charts' }, { name: 'src/components/RevenueChart.tsx', lines: 65, purpose: 'Revenue line chart' }, { name: 'src/app/api/analytics/route.ts', lines: 40, purpose: 'Analytics data API' }, { name: 'prisma/schema.prisma', lines: 70, purpose: 'Analytics models' }, { name: 'src/components/DataTable.tsx', lines: 55, purpose: 'Sortable data table' }],
  '9': [{ name: 'src/app/page.tsx', lines: 42, purpose: 'Chat interface' }, { name: 'src/app/api/chat/route.ts', lines: 55, purpose: 'Streaming chat API' }, { name: 'src/lib/openai.ts', lines: 25, purpose: 'OpenAI client setup' }, { name: 'prisma/schema.prisma', lines: 45, purpose: 'Conversation models' }, { name: 'src/components/ChatBubble.tsx', lines: 30, purpose: 'Chat message component' }],
  '16': [{ name: 'src/app/page.tsx', lines: 55, purpose: 'Analytics dashboard' }, { name: 'src/lib/clickhouse.ts', lines: 35, purpose: 'ClickHouse client' }, { name: 'src/app/api/events/route.ts', lines: 48, purpose: 'Event ingestion API' }, { name: 'src/components/RealTimeChart.tsx', lines: 70, purpose: 'Live updating chart' }, { name: 'docker-compose.yml', lines: 22, purpose: 'Service orchestration' }],
};

/* ─── Star Rating Display ─── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-3 h-3"
          style={{
            color: star <= Math.floor(rating) ? '#e3b341' : '#21262d',
            fill: star <= Math.floor(rating) ? '#e3b341' : 'none',
          }}
        />
      ))}
      <span className="text-[10px] font-mono ml-1" style={{ color: '#8b949e' }}>{rating}/5</span>
    </div>
  );
}

/* ─── Tech Badge ─── */
function TechBadge({ name, fallbackColor }: { name: string; fallbackColor: string }) {
  const badgeColor = TECH_COLORS[name] || fallbackColor;
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-medium"
      style={{
        backgroundColor: `${badgeColor}12`,
        color: badgeColor,
        border: `1px solid ${badgeColor}25`,
      }}
    >
      {name}
    </span>
  );
}

/* ─── Difficulty Indicator ─── */
function DifficultyIndicator({ difficulty }: { difficulty: 'beginner' | 'intermediate' | 'advanced' }) {
  const config = DIFFICULTY_CONFIG[difficulty];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((bar) => (
        <div
          key={bar}
          className="w-4 h-1.5 rounded-full"
          style={{
            backgroundColor: bar <= config.bars ? config.color : '#21262d',
          }}
        />
      ))}
      <span className="text-[9px] ml-0.5" style={{ color: config.color }}>{config.label}</span>
    </div>
  );
}

/* ─── Quick Preview Modal ─── */
function QuickPreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: typeof TEMPLATES[0];
  onClose: () => void;
  onUse: (template: typeof TEMPLATES[0]) => void;
}) {
  const files = PREVIEW_FILES[template.id] || [
    { name: 'src/app/page.tsx', lines: 40, purpose: 'Main entry page' },
    { name: 'src/lib/config.ts', lines: 15, purpose: 'Configuration' },
    { name: 'package.json', lines: 25, purpose: 'Dependencies' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#30363d' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${template.color}15` }}
            >
              <Sparkles className="w-5 h-5" style={{ color: template.color }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#c9d1d9' }}>{template.name}</h3>
              <p className="text-[10px]" style={{ color: '#8b949e' }}>Key files preview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#21262d] transition-colors"
            style={{ color: '#8b949e' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template info */}
        <div className="px-5 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid #21262d' }}>
          <DifficultyIndicator difficulty={template.difficulty} />
          <span className="flex items-center gap-1 text-[10px]" style={{ color: '#8b949e' }}>
            <Clock className="w-3 h-3" /> {template.buildTime}
          </span>
          <StarRating rating={template.stars} />
          <span className="flex items-center gap-1 text-[10px]" style={{ color: '#8b949e' }}>
            <Download className="w-3 h-3" /> {template.downloads >= 1000 ? `${(template.downloads / 1000).toFixed(1)}k` : template.downloads}
          </span>
        </div>

        {/* Tech stack */}
        <div className="px-5 py-3 flex flex-wrap gap-1.5" style={{ borderBottom: '1px solid #21262d' }}>
          {template.tech.map((t) => (
            <TechBadge key={t} name={t} fallbackColor={template.color} />
          ))}
        </div>

        {/* File list */}
        <div className="px-5 py-3 max-h-64 overflow-y-auto custom-scroll">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#484f58' }}>
            Key Files
          </h4>
          <div className="space-y-1.5">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors hover:bg-[#21262d]"
                style={{ border: '1px solid #21262d' }}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" style={{ color: template.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono truncate" style={{ color: '#c9d1d9' }}>{file.name}</p>
                  <p className="text-[9px]" style={{ color: '#484f58' }}>{file.purpose}</p>
                </div>
                <span className="text-[9px] font-mono shrink-0" style={{ color: '#484f58' }}>{file.lines}L</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: '#30363d' }}>
          <p className="text-[10px]" style={{ color: '#484f58' }}>
            {files.reduce((sum, f) => sum + f.lines, 0)} lines across {files.length} key files
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1"
              style={{ borderColor: '#30363d', color: '#8b949e' }}
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              size="sm"
              className="h-7 text-[10px] gap-1 font-medium"
              style={{
                background: `linear-gradient(135deg, ${template.color}, ${template.color}cc)`,
                color: 'white',
                boxShadow: `0 0 12px ${template.color}20`,
              }}
              onClick={() => onUse(template)}
            >
              <Sparkles className="w-3 h-3" /> Use Template
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Template Card ─── */
function TemplateCard({
  template,
  onSelect,
  onPreview,
  index,
}: {
  template: typeof TEMPLATES[0];
  onSelect: (template: typeof TEMPLATES[0]) => void;
  onPreview: (template: typeof TEMPLATES[0]) => void;
  index: number;
}) {
  const diffConfig = DIFFICULTY_CONFIG[template.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
      className="rounded-xl border transition-all duration-300 hover:-translate-y-1 group overflow-hidden"
      style={{
        backgroundColor: '#0d1117',
        borderColor: '#21262d',
        borderLeft: `3px solid ${template.color}`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `${template.color}50`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${template.color}20, 0 0 0 1px ${template.color}15`;
        (e.currentTarget as HTMLElement).style.borderLeftColor = template.color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#21262d';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderLeftColor = template.color;
      }}
    >
      {/* Preview thumbnail area with animated gradient */}
      <div
        className="h-24 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${template.color}12, ${template.color}05, #0d1117)`,
          borderBottom: '1px solid #21262d',
        }}
      >
        {/* Terminal dots */}
        <div className="absolute top-2.5 left-3">
          <div className="flex gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f8514950' }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#e3b34150' }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3fb95050' }} />
          </div>
          <div className="space-y-1">
            <div className="h-1 rounded" style={{ backgroundColor: `${template.color}20`, width: '65%' }} />
            <div className="h-1 rounded" style={{ backgroundColor: `${template.color}12`, width: '85%' }} />
            <div className="h-1 rounded" style={{ backgroundColor: `${template.color}12`, width: '50%' }} />
            <div className="h-1 rounded" style={{ backgroundColor: `${template.color}18`, width: '75%' }} />
          </div>
        </div>

        {/* Badges row */}
        <div className="absolute top-2.5 right-3 flex items-center gap-1">
          {template.featured && (
            <span className="text-[7px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
              style={{ backgroundColor: '#e3b34120', color: '#e3b341', border: '1px solid #e3b34130' }}>
              <Star className="w-2 h-2 fill-current" /> Featured
            </span>
          )}
          {template.downloads >= 2000 && (
            <span className="text-[7px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
              style={{ backgroundColor: '#3fb95020', color: '#3fb950', border: '1px solid #3fb95030' }}>
              <TrendingUp className="w-2 h-2" /> Popular
            </span>
          )}
        </div>

        {/* Category badge */}
        <span
          className="absolute bottom-2 left-3 text-[8px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${template.color}20`, color: template.color, border: `1px solid ${template.color}30` }}
        >
          {template.category}
        </span>

        {/* Downloads badge */}
        <div
          className="absolute bottom-2 right-3 flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: '#0d111780', color: '#8b949e' }}
        >
          <Download className="w-2.5 h-2.5" />
          {template.downloads >= 1000 ? `${(template.downloads / 1000).toFixed(1)}k` : template.downloads}
        </div>
      </div>

      {/* Card content */}
      <div className="p-4 space-y-3">
        {/* Header: name + author */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold group-hover:text-[#58a6ff] transition-colors" style={{ color: '#c9d1d9' }}>
              {template.name}
            </h3>
            <span className="text-[9px] flex items-center gap-1" style={{ color: '#484f58' }}>
              <Users className="w-2.5 h-2.5" />
              {template.author}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: '#8b949e' }}>{template.description}</p>
        </div>

        {/* Tech stack badges */}
        <div className="flex flex-wrap gap-1">
          {template.tech.map((t) => (
            <TechBadge key={t} name={t} fallbackColor={template.color} />
          ))}
        </div>

        {/* Difficulty + Build Time */}
        <div className="flex items-center justify-between">
          <DifficultyIndicator difficulty={template.difficulty} />
          <span className="flex items-center gap-1 text-[9px]" style={{ color: '#484f58' }}>
            <Clock className="w-2.5 h-2.5" /> {template.buildTime}
          </span>
        </div>

        {/* Rating row */}
        <div className="flex items-center justify-between pt-1">
          <StarRating rating={template.stars} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 gap-1.5 text-[11px] h-8 transition-all duration-200 font-medium"
            style={{
              background: `linear-gradient(135deg, ${template.color}, ${template.color}cc)`,
              color: 'white',
              boxShadow: `0 0 12px ${template.color}20`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${template.color}40`;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${template.color}20`;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
            onClick={() => onSelect(template)}
          >
            <Sparkles className="w-3 h-3" /> Use Template
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 transition-all duration-200"
            style={{ borderColor: '#30363d', color: '#8b949e' }}
            onClick={() => onPreview(template)}
            title="Quick Preview"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function TemplateMarketplace({ onSelectTemplate }: { onSelectTemplate: (prompt: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<typeof TEMPLATES[0] | null>(null);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let result = TEMPLATES;

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(t => t.category === activeCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tech.some(tech => tech.toLowerCase().includes(query)) ||
        t.category.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result = [...result].sort((a, b) => b.downloads - a.downloads);
        break;
      case 'newest':
        result = [...result].sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      case 'simplest':
        result = [...result].sort((a, b) => {
          const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        });
        break;
    }

    return result;
  }, [searchQuery, activeCategory, sortBy]);

  // Recently used templates
  const recentlyUsedTemplates = useMemo(() => {
    return TEMPLATES.filter(t => t.recentlyUsed);
  }, []);

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return TEMPLATES.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.tech.some(tech => tech.toLowerCase().includes(query))
    ).slice(0, 3);
  }, [searchQuery]);

  const handleUseTemplate = useCallback((template: typeof TEMPLATES[0]) => {
    const prompt = `Build a ${template.name} project using ${template.tech.join(', ')}. ${template.description}`;
    onSelectTemplate(prompt);
    setPreviewTemplate(null);
  }, [onSelectTemplate]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-bold"
            style={{
              backgroundImage: 'linear-gradient(135deg, #58a6ff, #3fb950)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Template Marketplace
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: '#8b949e' }}>Start with a pre-built template and customize it to your needs</p>
        </div>
        <span
          className="text-[10px] font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: '#58a6ff10', color: '#58a6ff', border: '1px solid #58a6ff20' }}
        >
          {filteredTemplates.length} templates
        </span>
      </div>

      {/* Recently Used Section */}
      {recentlyUsedTemplates.length > 0 && !searchQuery && activeCategory === 'all' && (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#484f58' }}>
            <Clock className="w-3 h-3" style={{ color: '#e3b341' }} /> Recently Used
          </h3>
          <div className="flex gap-2 overflow-x-auto custom-scroll pb-1">
            {recentlyUsedTemplates.map((template) => {
              const Icon = template.category === 'saas' ? Zap : template.category === 'dashboard' ? LayoutGrid : Code;
              return (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl border shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: '#0d1117',
                    borderColor: `${template.color}30`,
                    borderLeft: `2px solid ${template.color}`,
                  }}
                  onClick={() => handleUseTemplate(template)}
                >
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${template.color}15` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: template.color }} />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-medium" style={{ color: '#c9d1d9' }}>{template.name}</p>
                    <p className="text-[9px]" style={{ color: '#484f58' }}>{template.tech.slice(0, 2).join(', ')}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Bar with Autocomplete */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#484f58' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates by name, tech stack, or category..."
          className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:border-[#58a6ff] transition-colors"
          style={{ backgroundColor: '#0d1117', borderColor: '#21262d', color: '#c9d1d9' }}
        />
        {suggestions.length > 0 && searchQuery.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full mt-1 left-0 right-0 rounded-lg border shadow-xl z-20 overflow-hidden"
            style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
          >
            {suggestions.map((s) => (
              <button
                key={s.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#21262d]"
                onClick={() => {
                  setSearchQuery(s.name);
                }}
              >
                <Box className="w-4 h-4 shrink-0" style={{ color: s.color }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>{s.name}</p>
                  <p className="text-[10px]" style={{ color: '#484f58' }}>{s.tech.join(', ')}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Category Filter Tabs + Sort */}
      <div className="flex items-center gap-3 overflow-x-auto custom-scroll pb-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full shrink-0 transition-all duration-200"
                style={{
                  backgroundColor: isActive ? '#58a6ff15' : '#0d1117',
                  color: isActive ? '#58a6ff' : '#8b949e',
                  border: `1px solid ${isActive ? '#58a6ff30' : '#21262d'}`,
                  boxShadow: isActive ? '0 0 10px rgba(88,166,255,0.1)' : 'none',
                }}
                onClick={() => setActiveCategory(cat.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
                <span className="text-[9px] font-mono" style={{ color: isActive ? '#58a6ff80' : '#484f58' }}>
                  ({cat.count})
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div className="relative shrink-0">
          <button
            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors hover:border-[#58a6ff]"
            style={{ backgroundColor: '#0d1117', borderColor: '#21262d', color: '#8b949e' }}
            onClick={() => setShowSortMenu(!showSortMenu)}
          >
            <SlidersHorizontal className="w-3 h-3" />
            Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
          </button>
          {showSortMenu && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full mt-1 w-36 rounded-lg border shadow-xl z-20 overflow-hidden"
              style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
            >
              {(['popular', 'newest', 'simplest'] as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  className="w-full text-left px-3 py-2 text-[11px] transition-colors hover:bg-[#21262d]"
                  style={{ color: sortBy === opt ? '#58a6ff' : '#8b949e' }}
                  onClick={() => {
                    setSortBy(opt);
                    setShowSortMenu(false);
                  }}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Template Grid */}
      <AnimatePresence mode="wait">
        {filteredTemplates.length > 0 ? (
          <motion.div
            key={activeCategory + sortBy + searchQuery}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {filteredTemplates.map((template, i) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleUseTemplate}
                onPreview={setPreviewTemplate}
                index={i}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Code className="w-10 h-10 mx-auto mb-3" style={{ color: '#21262d' }} />
            <p className="text-sm" style={{ color: '#8b949e' }}>No templates found</p>
            <p className="text-[11px] mt-1" style={{ color: '#484f58' }}>Try adjusting your search or filters</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5"
              style={{ borderColor: '#30363d', color: '#58a6ff' }}
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              <Filter className="w-3 h-3" /> Clear Filters
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <QuickPreviewModal
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onUse={handleUseTemplate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
