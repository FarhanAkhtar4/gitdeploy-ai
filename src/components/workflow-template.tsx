'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileCode,
  Copy,
  Check,
  Rocket,
  Play,
  Shield,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WORKFLOW_YAML = `name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build project
        run: npm run build

      - name: Deploy
        run: echo "Deploy step - customize for your platform"
        env:
          DEPLOY_TOKEN: \${{ secrets.DEPLOY_TOKEN }}`;

const WORKFLOW_STEPS = [
  {
    name: 'Checkout code',
    desc: 'Clones your repository to the runner',
    icon: FileCode,
    tip: 'Uses actions/checkout@v4 for reliable cloning',
  },
  {
    name: 'Setup Node.js',
    desc: 'Installs the specified Node.js version',
    icon: Package,
    tip: 'Caching npm dependencies speeds up builds',
  },
  {
    name: 'Install dependencies',
    desc: 'Runs npm ci for clean, reproducible installs',
    icon: Package,
    tip: 'npm ci is preferred over npm install in CI',
  },
  {
    name: 'Run linter',
    desc: 'Checks code quality with ESLint',
    icon: Shield,
    tip: 'Catches errors before they reach production',
  },
  {
    name: 'Run tests',
    desc: 'Executes your test suite',
    icon: Check,
    tip: 'Fails the build if any test fails',
  },
  {
    name: 'Build project',
    desc: 'Compiles and bundles your application',
    icon: Rocket,
    tip: 'Produces optimized production build',
  },
  {
    name: 'Deploy',
    desc: 'Deploys to your hosting platform',
    icon: Play,
    tip: 'Customize this step for Vercel, Railway, etc.',
  },
];

export function WorkflowTemplate() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('yaml');
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(WORKFLOW_YAML);
    setCopied(true);
    toast({ title: 'Workflow copied!', description: 'Paste into .github/workflows/deploy.yml' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
            <FileCode className="w-4 h-4" style={{ color: '#58a6ff' }} />
            GitHub Actions Workflow
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: '#238636', color: '#3fb950' }}>
              Ready to deploy
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-7 bg-[#0d1117] mb-3">
            <TabsTrigger
              value="yaml"
              className="h-5 text-xs px-3 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#58a6ff]"
            >
              YAML
            </TabsTrigger>
            <TabsTrigger
              value="steps"
              className="h-5 text-xs px-3 data-[state=active]:bg-[#30363d] data-[state=active]:text-[#58a6ff]"
            >
              Step Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="yaml" className="mt-0">
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}>
              {/* File header */}
              <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
                <div className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5" style={{ color: '#8b949e' }} />
                  <span className="text-xs font-mono" style={{ color: '#8b949e' }}>
                    .github/workflows/deploy.yml
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-[10px] hover:bg-[#21262d]"
                  style={{ color: copied ? '#3fb950' : '#58a6ff' }}
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {/* YAML content */}
              <ScrollArea className="max-h-64">
                <pre className="font-mono text-xs p-3 leading-relaxed" style={{ color: '#c9d1d9' }}>
                  {WORKFLOW_YAML}
                </pre>
              </ScrollArea>
            </div>

            <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(227,179,65,0.06)' }}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#e3b341' }} />
              <p className="text-[10px]" style={{ color: '#e3b341' }}>
                Customize the Deploy step for your hosting platform (Vercel, Railway, etc.). Add DEPLOY_TOKEN to your repository secrets.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="steps" className="mt-0">
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {WORKFLOW_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#21262d]"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: 'rgba(88,166,255,0.15)' }}
                      >
                        <span className="text-[10px] font-bold" style={{ color: '#58a6ff' }}>
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>
                          {step.name}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>
                          {step.desc}
                        </p>
                        <p className="text-[10px] mt-1 italic" style={{ color: '#484f58' }}>
                          💡 {step.tip}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
