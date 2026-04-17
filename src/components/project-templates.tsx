'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Zap,
  ShoppingCart,
  CheckSquare,
  Utensils,
  BarChart3,
  MessageCircle,
  BookOpen,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  prompt: string;
  framework: string;
  features: string[];
}

const TEMPLATES: Template[] = [
  {
    id: 'saas-invoice',
    name: 'Invoice Manager',
    description: 'SaaS invoice management with PDF generation, client portal, and payment tracking',
    icon: ShoppingCart,
    color: '#58a6ff',
    prompt: 'Build me a SaaS invoice management app with PDF generation, client portal, payment tracking, dashboard with charts, and Stripe integration',
    framework: 'nextjs',
    features: ['PDF invoices', 'Client portal', 'Payment tracking', 'Dashboard'],
  },
  {
    id: 'todo-app',
    name: 'Task Manager',
    description: 'Full-stack todo app with user auth, teams, and real-time collaboration',
    icon: CheckSquare,
    color: '#3fb950',
    prompt: 'Build a full-stack todo app with user authentication, team workspaces, real-time collaboration, drag-and-drop boards, and activity history',
    framework: 'nextjs',
    features: ['User auth', 'Teams', 'Real-time', 'Drag & drop'],
  },
  {
    id: 'food-delivery',
    name: 'Food Delivery API',
    description: 'REST API for food delivery with restaurant management, orders, and delivery tracking',
    icon: Utensils,
    color: '#e3b341',
    prompt: 'Create a REST API for a food delivery app with restaurant management, menu system, order processing, delivery tracking, and admin dashboard',
    framework: 'express',
    features: ['Restaurant CRUD', 'Order system', 'Delivery tracking', 'Admin'],
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Real-time analytics dashboard with charts, filters, and data export',
    icon: BarChart3,
    color: '#a371f7',
    prompt: 'Build a real-time analytics dashboard with interactive charts, date range filters, data export to CSV, user segmentation, and email reports',
    framework: 'nextjs',
    features: ['Real-time charts', 'Filters', 'CSV export', 'Email reports'],
  },
  {
    id: 'chat-app',
    name: 'Chat Application',
    description: 'Real-time chat app with rooms, file sharing, and message search',
    icon: MessageCircle,
    color: '#f778ba',
    prompt: 'Build a real-time chat application with chat rooms, direct messages, file sharing, message search, user presence, and notifications',
    framework: 'nextjs',
    features: ['Chat rooms', 'File sharing', 'Search', 'Notifications'],
  },
  {
    id: 'blog-cms',
    name: 'Blog / CMS',
    description: 'Content management system with markdown editor, SEO, and publishing workflow',
    icon: BookOpen,
    color: '#79c0ff',
    prompt: 'Build a blog CMS with markdown editor, SEO optimization, publishing workflow, categories, tags, comments system, and RSS feed',
    framework: 'nextjs',
    features: ['Markdown editor', 'SEO', 'Publishing flow', 'RSS'],
  },
];

interface ProjectTemplatesProps {
  onSelectTemplate: (prompt: string) => void;
}

export function ProjectTemplates({ onSelectTemplate }: ProjectTemplatesProps) {
  const { setCurrentView } = useAppStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#c9d1d9' }}>
            🚀 Quick Start Templates
          </h2>
          <p className="text-xs mt-1" style={{ color: '#8b949e' }}>
            Pick a template and let AI build the complete project for you
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Card
              key={template.id}
              className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-[#58a6ff] hover:-translate-y-0.5"
              style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
              onClick={() => onSelectTemplate(template.prompt)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="p-2.5 rounded-xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${template.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: template.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium" style={{ color: '#c9d1d9' }}>
                      {template.name}
                    </h3>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: '#8b949e' }}>
                      {template.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {template.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${template.color}10`, color: template.color }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: '#21262d' }}>
                  <span className="text-[10px] font-mono" style={{ color: '#484f58' }}>
                    {template.framework}
                  </span>
                  <span className="text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#58a6ff' }}>
                    <Zap className="w-3 h-3" /> Build now
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export { TEMPLATES };
export type { Template };
