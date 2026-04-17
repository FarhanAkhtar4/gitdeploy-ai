'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Code,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Eye,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Severity = 'critical' | 'warning' | 'info' | 'suggestion';

interface CodeIssue {
  id: string;
  file: string;
  line: number;
  severity: Severity;
  title: string;
  description: string;
  suggestion: string;
  category: string;
}

const MOCK_ISSUES: CodeIssue[] = [
  {
    id: '1',
    file: 'src/middleware/auth.ts',
    line: 23,
    severity: 'critical',
    title: 'Missing authentication check',
    description: 'The /admin route is accessible without authentication verification.',
    suggestion: 'Add requireAuth() middleware to the /admin route handler.',
    category: 'Security',
  },
  {
    id: '2',
    file: 'src/utils/database.ts',
    line: 45,
    severity: 'warning',
    title: 'SQL injection vulnerability',
    description: 'String interpolation used in SQL query instead of parameterized query.',
    suggestion: 'Use parameterized queries: db.query("SELECT * FROM users WHERE id = $1", [userId])',
    category: 'Security',
  },
  {
    id: '3',
    file: 'src/components/Dashboard.tsx',
    line: 12,
    severity: 'suggestion',
    title: 'Consider using React.memo',
    description: 'This component re-renders on every parent update without prop changes.',
    suggestion: 'Wrap with React.memo() or use useMemo for expensive computations.',
    category: 'Performance',
  },
  {
    id: '4',
    file: 'src/api/routes.ts',
    line: 67,
    severity: 'warning',
    title: 'Missing error handling',
    description: 'Async handler has no try-catch block. Unhandled promise rejections may crash the server.',
    suggestion: 'Wrap async handlers with try-catch and return proper error responses.',
    category: 'Reliability',
  },
  {
    id: '5',
    file: 'src/lib/config.ts',
    line: 5,
    severity: 'info',
    title: 'Hardcoded configuration value',
    description: 'API timeout is hardcoded to 5000ms instead of using environment variable.',
    suggestion: 'Use process.env.API_TIMEOUT || 5000 for configurable values.',
    category: 'Best Practices',
  },
  {
    id: '6',
    file: 'src/hooks/useData.ts',
    line: 18,
    severity: 'suggestion',
    title: 'Missing cleanup in useEffect',
    description: 'WebSocket connection is not closed on component unmount.',
    suggestion: 'Return a cleanup function from useEffect that calls ws.close().',
    category: 'Reliability',
  },
];

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  critical: { color: '#f85149', bg: '#f8514915', icon: XCircle, label: 'Critical' },
  warning: { color: '#e3b341', bg: '#e3b34115', icon: AlertTriangle, label: 'Warning' },
  info: { color: '#58a6ff', bg: '#58a6ff15', icon: Info, label: 'Info' },
  suggestion: { color: '#3fb950', bg: '#3fb95015', icon: Lightbulb, label: 'Suggestion' },
};

const CATEGORIES = ['All', 'Security', 'Performance', 'Reliability', 'Best Practices'];

export function CodeReviewAssistant() {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(true);

  const filteredIssues =
    selectedCategory === 'All'
      ? MOCK_ISSUES
      : MOCK_ISSUES.filter((issue) => issue.category === selectedCategory);

  const counts = {
    critical: MOCK_ISSUES.filter((i) => i.severity === 'critical').length,
    warning: MOCK_ISSUES.filter((i) => i.severity === 'warning').length,
    info: MOCK_ISSUES.filter((i) => i.severity === 'info').length,
    suggestion: MOCK_ISSUES.filter((i) => i.severity === 'suggestion').length,
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
              <Shield className="w-4 h-4" style={{ color: '#a371f7' }} />
              AI Code Review
            </CardTitle>
            <Button
              size="sm"
              className="gap-1.5 h-7 text-[10px]"
              style={{ backgroundColor: '#238636', color: 'white' }}
              disabled={isScanning}
              onClick={handleScan}
            >
              {isScanning ? (
                <><Zap className="w-3 h-3 animate-pulse" /> Scanning...</>
              ) : (
                <><Eye className="w-3 h-3" /> Re-scan</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scanComplete && (
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(counts) as [Severity, number][]).map(([severity, count]) => {
                const config = SEVERITY_CONFIG[severity];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={severity}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg"
                    style={{ backgroundColor: config.bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                    <span className="text-lg font-bold" style={{ color: config.color }}>
                      {count}
                    </span>
                    <span className="text-[9px]" style={{ color: '#8b949e' }}>
                      {config.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex items-center gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="text-[10px] px-2.5 py-1 rounded-full transition-colors"
            style={{
              backgroundColor: selectedCategory === cat ? '#58a6ff15' : 'transparent',
              color: selectedCategory === cat ? '#58a6ff' : '#484f58',
              border: `1px solid ${selectedCategory === cat ? '#58a6ff30' : 'transparent'}`,
            }}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1 font-mono">
                {MOCK_ISSUES.filter((i) => i.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
        <CardContent className="p-0">
          <ScrollArea className="max-h-80">
            <div className="divide-y" style={{ borderColor: '#21262d' }}>
              <AnimatePresence>
                {filteredIssues.map((issue, i) => {
                  const config = SEVERITY_CONFIG[issue.severity];
                  const Icon = config.icon;
                  const isExpanded = expandedIssue === issue.id;

                  return (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                      className="p-3 cursor-pointer hover:bg-[#21262d] transition-colors"
                      style={{ borderColor: '#21262d' }}
                      onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: config.bg }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium truncate" style={{ color: '#c9d1d9' }}>
                              {issue.title}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[8px] h-4 px-1 shrink-0"
                              style={{ borderColor: `${config.color}30`, color: config.color }}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: '#0d1117', color: '#8b949e' }}
                            >
                              {issue.file}:{issue.line}
                            </code>
                            <Badge
                              variant="outline"
                              className="text-[8px] h-4 px-1"
                              style={{ borderColor: '#30363d', color: '#484f58' }}
                            >
                              {issue.category}
                            </Badge>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 space-y-2">
                                  <p className="text-[11px] leading-relaxed" style={{ color: '#8b949e' }}>
                                    {issue.description}
                                  </p>
                                  <div
                                    className="p-2.5 rounded-lg"
                                    style={{
                                      backgroundColor: '#0d1117',
                                      borderLeft: `2px solid ${config.color}`,
                                    }}
                                  >
                                    <p className="text-[10px] font-medium" style={{ color: config.color }}>
                                      Suggested Fix
                                    </p>
                                    <p className="text-[11px] font-mono mt-1 leading-relaxed" style={{ color: '#c9d1d9' }}>
                                      {issue.suggestion}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      className="h-6 text-[10px] gap-1"
                                      style={{ backgroundColor: '#238636', color: 'white' }}
                                    >
                                      <CheckCircle className="w-3 h-3" /> Apply Fix
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-[10px] gap-1"
                                      style={{ borderColor: '#30363d', color: '#8b949e' }}
                                    >
                                      Dismiss
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="shrink-0 mt-1">
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" style={{ color: '#484f58' }} />
                          ) : (
                            <ChevronDown className="w-3 h-3" style={{ color: '#484f58' }} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
