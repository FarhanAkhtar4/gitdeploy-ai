'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  GitBranch,
  Settings,
  Package,
  SearchCheck,
  TestTube,
  Hammer,
  Rocket,
  Bell,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  GripVertical,
  Play,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  X,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Step type definitions
interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  icon: string;
  config: Record<string, string | boolean>;
  enabled: boolean;
  condition?: string;
}

const STEP_TYPES = [
  { type: 'checkout', name: 'Checkout', icon: 'git-branch', IconComponent: GitBranch, color: '#58a6ff', defaultConfig: { repository: '${{ github.repository }}', ref: '${{ github.ref }}' } },
  { type: 'setup', name: 'Setup Node', icon: 'settings', IconComponent: Settings, color: '#a371f7', defaultConfig: { 'node-version': '20', cache: 'npm' } },
  { type: 'install', name: 'Install', icon: 'package', IconComponent: Package, color: '#3fb950', defaultConfig: { command: 'npm ci' } },
  { type: 'lint', name: 'Lint', icon: 'search', IconComponent: SearchCheck, color: '#e3b341', defaultConfig: { command: 'npm run lint' } },
  { type: 'test', name: 'Test', icon: 'test-tube', IconComponent: TestTube, color: '#f0883e', defaultConfig: { command: 'npm test', coverage: 'true' } },
  { type: 'build', name: 'Build', icon: 'hammer', IconComponent: Hammer, color: '#58a6ff', defaultConfig: { command: 'npm run build' } },
  { type: 'deploy', name: 'Deploy', icon: 'rocket', IconComponent: Rocket, color: '#3fb950', defaultConfig: { platform: 'vercel', production: 'true' } },
  { type: 'notify', name: 'Notify', icon: 'bell', IconComponent: Bell, color: '#f85149', defaultConfig: { channel: '#deployments', 'on-failure': 'true' } },
];

const PRESETS = [
  {
    name: 'Basic CI',
    desc: 'Lint + Test + Build',
    steps: ['checkout', 'setup', 'install', 'lint', 'test', 'build'],
    color: '#58a6ff',
  },
  {
    name: 'Full Pipeline',
    desc: 'All steps included',
    steps: ['checkout', 'setup', 'install', 'lint', 'test', 'build', 'deploy', 'notify'],
    color: '#3fb950',
  },
  {
    name: 'Deploy Only',
    desc: 'Build + Deploy',
    steps: ['checkout', 'setup', 'install', 'build', 'deploy'],
    color: '#f0883e',
  },
  {
    name: 'Custom',
    desc: 'Start from scratch',
    steps: [],
    color: '#a371f7',
  },
];

const DEFAULT_STEPS: WorkflowStep[] = [
  { id: '1', name: 'Checkout', type: 'checkout', icon: 'git-branch', config: { repository: '${{ github.repository }}', ref: '${{ github.ref }}' }, enabled: true },
  { id: '2', name: 'Setup Node', type: 'setup', icon: 'settings', config: { 'node-version': '20', cache: 'npm' }, enabled: true },
  { id: '3', name: 'Install', type: 'install', icon: 'package', config: { command: 'npm ci' }, enabled: true },
  { id: '4', name: 'Lint', type: 'lint', icon: 'search', config: { command: 'npm run lint' }, enabled: true },
  { id: '5', name: 'Test', type: 'test', icon: 'test-tube', config: { command: 'npm test', coverage: 'true' }, enabled: true },
  { id: '6', name: 'Build', type: 'build', icon: 'hammer', config: { command: 'npm run build' }, enabled: true },
  { id: '7', name: 'Deploy', type: 'deploy', icon: 'rocket', config: { platform: 'vercel', production: 'true' }, enabled: true },
];

function getStepType(type: string) {
  return STEP_TYPES.find(s => s.type === type) || STEP_TYPES[0];
}

function generateYAML(steps: WorkflowStep[]): string {
  const enabledSteps = steps.filter(s => s.enabled);
  if (enabledSteps.length === 0) return '# No steps configured';

  let yaml = `name: CI/CD Pipeline\n\non:\n  push:\n    branches: [main]\n  workflow_dispatch:\n\njobs:\n  build-and-deploy:\n    runs-on: ubuntu-latest\n    permissions:\n      contents: read\n      deployments: write\n\n    steps:\n`;

  for (const step of enabledSteps) {
    yaml += `\n      - name: ${step.name}\n`;
    if (step.condition) {
      yaml += `        if: ${step.condition}\n`;
    }

    switch (step.type) {
      case 'checkout':
        yaml += `        uses: actions/checkout@v4\n`;
        if (step.config.ref && step.config.ref !== '${{ github.ref }}') {
          yaml += `        with:\n          ref: ${step.config.ref}\n`;
        }
        break;
      case 'setup':
        yaml += `        uses: actions/setup-node@v4\n`;
        yaml += `        with:\n`;
        yaml += `          node-version: '${step.config['node-version'] || '20'}'\n`;
        if (step.config.cache) yaml += `          cache: '${step.config.cache}'\n`;
        break;
      case 'install':
        yaml += `        run: ${step.config.command || 'npm ci'}\n`;
        break;
      case 'lint':
        yaml += `        run: ${step.config.command || 'npm run lint'}\n`;
        break;
      case 'test':
        yaml += `        run: ${step.config.command || 'npm test'}\n`;
        if (step.config.coverage === 'true') yaml += `        env:\n          CI: true\n`;
        break;
      case 'build':
        yaml += `        run: ${step.config.command || 'npm run build'}\n`;
        break;
      case 'deploy':
        yaml += `        run: echo "Deploying to ${step.config.platform || 'vercel'}"\n`;
        yaml += `        env:\n          DEPLOY_TOKEN: \${{ secrets.DEPLOY_TOKEN }}\n`;
        break;
      case 'notify':
        yaml += `        run: echo "Sending notification to ${step.config.channel || '#deployments'}"\n`;
        if (step.config['on-failure'] === 'true') {
          yaml += `        if: failure()\n`;
        }
        break;
      default:
        yaml += `        run: echo "Step: ${step.name}"\n`;
    }
  }

  return yaml;
}

// Syntax highlighting for YAML
function highlightYAML(yaml: string): React.ReactNode[] {
  return yaml.split('\n').map((line, i) => {
    let coloredLine: React.ReactNode = line;

    if (line.trim().startsWith('#')) {
      coloredLine = <span style={{ color: '#8b949e' }}>{line}</span>;
    } else if (line.includes(': ')) {
      const [key, ...rest] = line.split(': ');
      const value = rest.join(': ');
      let valueColor = '#a5d6ff';
      if (value.startsWith("'") || value.startsWith('"')) valueColor = '#a5d6ff';
      else if (value === 'true' || value === 'false') valueColor = '#79c0ff';
      else if (!isNaN(Number(value))) valueColor = '#79c0ff';
      else if (value.startsWith('${{')) valueColor = '#ffa657';
      else if (value.startsWith('echo')) valueColor = '#a5d6ff';
      coloredLine = (
        <>
          <span style={{ color: '#ff7b72' }}>{key}</span>
          <span style={{ color: '#c9d1d9' }}>: </span>
          <span style={{ color: valueColor }}>{value}</span>
        </>
      );
    } else if (line.trim().startsWith('- ')) {
      const content = line.trim().slice(2);
      coloredLine = (
        <>
          <span style={{ color: '#c9d1d9' }}>{line.substring(0, line.indexOf('- '))}</span>
          <span style={{ color: '#58a6ff' }}>- </span>
          <span style={{ color: '#a5d6ff' }}>{content}</span>
        </>
      );
    }

    return (
      <div key={i} className="flex">
        <span className="select-none shrink-0 w-8 text-right pr-3" style={{ color: '#484f58' }}>{i + 1}</span>
        <span>{coloredLine}</span>
      </div>
    );
  });
}

export function WorkflowEditor({ onClose }: { onClose?: () => void }) {
  const [steps, setSteps] = useState<WorkflowStep[]>(DEFAULT_STEPS);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [yamlView, setYamlView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validated, setValidated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const yamlOutput = useMemo(() => generateYAML(steps), [steps]);
  const selectedStep = steps.find(s => s.id === selectedStepId) || null;

  const addStep = useCallback((type: string) => {
    const stepType = getStepType(type);
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      name: stepType.name,
      type: stepType.type,
      icon: stepType.icon,
      config: { ...stepType.defaultConfig } as Record<string, string>,
      enabled: true,
    };
    setSteps(prev => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  }, []);

  const removeStep = useCallback((id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    if (selectedStepId === id) setSelectedStepId(null);
  }, [selectedStepId]);

  const updateStepConfig = useCallback((id: string, key: string, value: string | boolean) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s));
  }, []);

  const toggleStep = useCallback((id: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  }, []);

  const moveStep = useCallback((id: string, direction: 'up' | 'down') => {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const newSteps = [...prev];
      [newSteps[idx], newSteps[newIdx]] = [newSteps[newIdx], newSteps[idx]];
      return newSteps;
    });
  }, []);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    if (preset.steps.length === 0) {
      setSteps([]);
      setSelectedStepId(null);
      return;
    }
    const newSteps: WorkflowStep[] = preset.steps.map((type, i) => {
      const stepType = getStepType(type);
      return {
        id: (i + 1).toString(),
        name: stepType.name,
        type: stepType.type,
        icon: stepType.icon,
        config: { ...stepType.defaultConfig } as Record<string, string>,
        enabled: true,
      };
    });
    setSteps(newSteps);
    setSelectedStepId(null);
  }, []);

  const copyYAML = useCallback(() => {
    navigator.clipboard.writeText(yamlOutput);
    setCopied(true);
    toast({ title: 'YAML Copied!', description: 'Paste into .github/workflows/deploy.yml' });
    setTimeout(() => setCopied(false), 2000);
  }, [yamlOutput, toast]);

  const validateWorkflow = useCallback(() => {
    setValidated(true);
    const enabledSteps = steps.filter(s => s.enabled);
    const hasCheckout = enabledSteps.some(s => s.type === 'checkout');
    const hasBuild = enabledSteps.some(s => s.type === 'build');

    if (!hasCheckout) {
      toast({ title: 'Validation Warning', description: 'Missing Checkout step', variant: 'destructive' });
    } else if (!hasBuild) {
      toast({ title: 'Validation Warning', description: 'Missing Build step' });
    } else {
      toast({ title: 'Valid!', description: 'Workflow YAML looks good' });
    }
    setTimeout(() => setValidated(false), 3000);
  }, [steps, toast]);

  const filteredAddSteps = STEP_TYPES.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
            <Sparkles className="w-4 h-4" style={{ color: '#58a6ff' }} />
            Workflow CI/CD Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-[10px]"
              style={{ color: yamlView ? '#58a6ff' : '#8b949e' }}
              onClick={() => setYamlView(!yamlView)}
            >
              <Eye className="w-3 h-3" /> {yamlView ? 'Pipeline' : 'YAML'}
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" style={{ color: '#8b949e' }} onClick={onClose}>
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Templates */}
        <div>
          <p className="text-[10px] uppercase font-bold mb-2" style={{ color: '#8b949e' }}>Template Presets</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                className="text-left p-2.5 rounded-lg border transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: `${preset.color}08`,
                  borderColor: `${preset.color}20`,
                }}
                onClick={() => applyPreset(preset)}
              >
                <p className="text-[11px] font-semibold" style={{ color: preset.color }}>{preset.name}</p>
                <p className="text-[9px] mt-0.5" style={{ color: '#8b949e' }}>{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {yamlView ? (
          /* YAML Preview */
          <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono" style={{ color: '#8b949e' }}>
                  .github/workflows/deploy.yml
                </span>
                <Badge variant="outline" className="text-[8px] px-1.5 py-0" style={{ borderColor: validated ? '#3fb950' : '#30363d', color: validated ? '#3fb950' : '#8b949e' }}>
                  {validated ? '✓ Valid' : 'Draft'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-[10px]"
                  style={{ color: validated ? '#3fb950' : '#58a6ff' }}
                  onClick={validateWorkflow}
                >
                  {validated ? <Check className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {validated ? 'Valid' : 'Validate'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-[10px]"
                  style={{ color: copied ? '#3fb950' : '#58a6ff' }}
                  onClick={copyYAML}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            <ScrollArea className="max-h-80">
              <pre className="font-mono text-xs p-3 leading-relaxed">
                {highlightYAML(yamlOutput)}
              </pre>
            </ScrollArea>
          </div>
        ) : (
          /* Visual Pipeline Builder */
          <div className="flex gap-4">
            {/* Pipeline steps - main area */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase font-bold" style={{ color: '#8b949e' }}>
                  Pipeline Steps ({steps.filter(s => s.enabled).length})
                </p>
                {/* Add step dropdown */}
                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-[10px]"
                    style={{ color: '#3fb950' }}
                  >
                    <Plus className="w-3 h-3" /> Add Step
                  </Button>
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
                    <div className="p-2">
                      <Input
                        placeholder="Search steps..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-6 text-[10px] border-0"
                        style={{ backgroundColor: '#0d1117', color: '#c9d1d9' }}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredAddSteps.map((stepType) => (
                        <button
                          key={stepType.type}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#21262d] transition-colors"
                          onClick={() => addStep(stepType.type)}
                        >
                          <stepType.IconComponent className="w-3.5 h-3.5" style={{ color: stepType.color }} />
                          <span className="text-[11px]" style={{ color: '#c9d1d9' }}>{stepType.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Horizontal pipeline visualization */}
              <div className="overflow-x-auto pb-2 custom-scroll">
                <div className="flex items-center gap-0 min-w-max">
                  {steps.map((step, i) => {
                    const stepType = getStepType(step.type);
                    const IconComp = stepType.IconComponent;
                    const isSelected = selectedStepId === step.id;
                    return (
                      <React.Fragment key={step.id}>
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                          className="flex flex-col items-center cursor-pointer group"
                          onClick={() => setSelectedStepId(isSelected ? null : step.id)}
                        >
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center relative transition-all duration-200"
                            style={{
                              backgroundColor: step.enabled ? `${stepType.color}15` : '#0d1117',
                              border: `2px solid ${isSelected ? stepType.color : step.enabled ? `${stepType.color}30` : '#21262d'}`,
                              boxShadow: isSelected ? `0 0 15px ${stepType.color}40` : 'none',
                              opacity: step.enabled ? 1 : 0.4,
                            }}
                          >
                            <IconComp className="w-5 h-5" style={{ color: step.enabled ? stepType.color : '#484f58' }} />
                            {/* Enable/disable toggle on hover */}
                            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: step.enabled ? '#3fb950' : '#484f58' }}
                                onClick={(e) => { e.stopPropagation(); toggleStep(step.id); }}
                              >
                                {step.enabled ? <Check className="w-2.5 h-2.5" style={{ color: 'white' }} /> : <X className="w-2.5 h-2.5" style={{ color: 'white' }} />}
                              </button>
                            </div>
                          </div>
                          <span className="text-[9px] mt-1.5 font-medium max-w-[56px] truncate" style={{ color: step.enabled ? '#c9d1d9' : '#484f58' }}>
                            {step.name}
                          </span>
                          {/* Move/delete controls on hover */}
                          <div className="flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {i > 0 && (
                              <button className="text-[8px]" style={{ color: '#484f58' }} onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'up'); }}>▲</button>
                            )}
                            {i < steps.length - 1 && (
                              <button className="text-[8px]" style={{ color: '#484f58' }} onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'down'); }}>▼</button>
                            )}
                            <button className="text-[8px]" style={{ color: '#f85149' }} onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}>✕</button>
                          </div>
                        </motion.div>
                        {i < steps.length - 1 && (
                          <div className="flex items-center px-1">
                            <ArrowRight className="w-4 h-4" style={{ color: step.enabled ? '#30363d' : '#21262d' }} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Empty state */}
              {steps.length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: '#484f58' }} />
                  <p className="text-xs" style={{ color: '#8b949e' }}>No steps in pipeline</p>
                  <p className="text-[10px] mt-1" style={{ color: '#484f58' }}>Choose a preset above or add steps manually</p>
                </div>
              )}
            </div>

            {/* Step Configuration Panel */}
            <AnimatePresence>
              {selectedStep && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 280 }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 overflow-hidden"
                >
                  <div className="rounded-lg border p-3 space-y-3" style={{ backgroundColor: '#0d1117', borderColor: '#30363d' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>
                        Step Config
                      </p>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" style={{ color: '#8b949e' }} onClick={() => setSelectedStepId(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Step header */}
                    <div className="flex items-center gap-2">
                      {(() => {
                        const st = getStepType(selectedStep.type);
                        const IC = st.IconComponent;
                        return (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${st.color}15` }}>
                            <IC className="w-4 h-4" style={{ color: st.color }} />
                          </div>
                        );
                      })()}
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#c9d1d9' }}>{selectedStep.name}</p>
                        <p className="text-[9px]" style={{ color: '#8b949e' }}>{selectedStep.type} step</p>
                      </div>
                    </div>

                    {/* Step name edit */}
                    <div>
                      <label className="text-[10px] font-medium block mb-1" style={{ color: '#8b949e' }}>Step Name</label>
                      <Input
                        value={selectedStep.name}
                        onChange={(e) => setSteps(prev => prev.map(s => s.id === selectedStep.id ? { ...s, name: e.target.value } : s))}
                        className="h-7 text-xs"
                        style={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                      />
                    </div>

                    {/* Config fields */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium" style={{ color: '#8b949e' }}>Configuration</p>
                      {Object.entries(selectedStep.config).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-[9px] block mb-0.5 font-mono" style={{ color: '#484f58' }}>{key}</label>
                          {typeof value === 'boolean' ? (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={value}
                                onCheckedChange={(checked) => updateStepConfig(selectedStep.id, key, checked)}
                              />
                              <span className="text-[10px]" style={{ color: value ? '#3fb950' : '#8b949e' }}>{value ? 'Enabled' : 'Disabled'}</span>
                            </div>
                          ) : (
                            <Input
                              value={String(value)}
                              onChange={(e) => updateStepConfig(selectedStep.id, key, e.target.value)}
                              className="h-6 text-[10px] font-mono"
                              style={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="text-[10px] font-medium block mb-1" style={{ color: '#8b949e' }}>Condition (optional)</label>
                      <Input
                        placeholder="e.g. github.ref == 'refs/heads/main'"
                        value={selectedStep.condition || ''}
                        onChange={(e) => setSteps(prev => prev.map(s => s.id === selectedStep.id ? { ...s, condition: e.target.value } : s))}
                        className="h-6 text-[10px] font-mono"
                        style={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                      />
                    </div>

                    {/* YAML Preview for this step */}
                    <div>
                      <p className="text-[10px] font-medium mb-1" style={{ color: '#8b949e' }}>Step YAML</p>
                      <div className="rounded p-2 max-h-32 overflow-y-auto custom-scroll" style={{ backgroundColor: '#161b22', border: '1px solid #21262d' }}>
                        <pre className="font-mono text-[9px] leading-relaxed" style={{ color: '#8b949e' }}>
                          {generateYAML([selectedStep])}
                        </pre>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#21262d' }}>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] px-1.5" style={{ borderColor: '#30363d', color: '#8b949e' }}>
              {steps.filter(s => s.enabled).length} steps
            </Badge>
            <Badge variant="outline" className="text-[9px] px-1.5" style={{ borderColor: '#238636', color: '#3fb950' }}>
              GitHub Actions
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[10px]"
              style={{ borderColor: '#30363d', color: '#8b949e' }}
              onClick={validateWorkflow}
            >
              <Play className="w-3 h-3" /> Validate
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1.5 text-[10px]"
              style={{ background: 'linear-gradient(135deg, #238636, #2ea043)', color: 'white' }}
              onClick={copyYAML}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Workflow'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
