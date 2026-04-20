'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload,
  Search,
  AlertTriangle,
  Variable,
  Shield,
  FileText,
  Pencil,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Key,
  Circle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EnvVar {
  id: string;
  key: string;
  value: string;
  revealed: boolean;
  required?: boolean;
  editing?: boolean;
  editKey?: string;
  editValue?: string;
  confirmDelete?: boolean;
}

// Required variables that must be set for deployment
const REQUIRED_VARS = ['DATABASE_URL', 'NEXTAUTH_SECRET'];

const SAMPLE_ENV_VARS: EnvVar[] = [
  { id: '1', key: 'DATABASE_URL', value: 'postgresql://user:pass@localhost:5432/mydb', revealed: false, required: true },
  { id: '2', key: 'NEXTAUTH_SECRET', value: '', revealed: false, required: true },
  { id: '3', key: 'JWT_SECRET', value: 'super-secret-jwt-key-2025', revealed: false },
  { id: '4', key: 'API_KEY_STRIPE', value: 'sk_test_example_placeholder_key', revealed: false },
  { id: '5', key: 'NEXT_PUBLIC_APP_URL', value: 'https://myapp.vercel.app', revealed: false },
  { id: '6', key: 'REDIS_URL', value: 'redis://default:password@redis-12345.c1.us-east-1.ec2.cloud.redislabs.com:12345', revealed: false },
  { id: '7', key: 'SMTP_PASSWORD', value: 'smtp-email-password-123', revealed: false },
  { id: '8', key: 'EMPTY_VAR', value: '', revealed: false },
];

function isSensitiveKey(key: string): boolean {
  const sensitive = ['secret', 'password', 'token', 'key', 'private', 'auth'];
  return sensitive.some((s) => key.toLowerCase().includes(s));
}

function isValidEnvKey(key: string): boolean {
  // Must start with a letter or underscore, followed by letters, digits, or underscores
  return /^[A-Z_][A-Z0-9_]*$/.test(key);
}

function getVarStatus(v: EnvVar): 'set' | 'empty' | 'missing' {
  if (v.required && !v.value) return 'missing';
  if (!v.value) return 'empty';
  return 'set';
}

function getBorderColor(status: 'set' | 'empty' | 'missing'): string {
  switch (status) {
    case 'set': return '#3fb950';
    case 'empty': return '#e3b341';
    case 'missing': return '#f85149';
  }
}

export function EnvManager() {
  const [vars, setVars] = useState<EnvVar[]>(SAMPLE_ENV_VARS);
  const [search, setSearch] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showNewValue, setShowNewValue] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const { toast } = useToast();

  const filteredVars = search.trim()
    ? vars.filter((v) => v.key.toLowerCase().includes(search.toLowerCase()))
    : vars;

  const sensitiveCount = vars.filter((v) => isSensitiveKey(v.key)).length;
  const missingRequired = vars.filter((v) => v.required && !v.value);
  const allRequiredSet = missingRequired.length === 0;

  const addVar = useCallback(() => {
    const upperKey = newKey.trim().toUpperCase();
    if (!upperKey) return;

    if (!isValidEnvKey(upperKey)) {
      toast({ title: 'Invalid key name', description: 'Must start with a letter or underscore, and contain only uppercase letters, digits, or underscores.', variant: 'destructive' });
      return;
    }

    if (vars.some((v) => v.key === upperKey)) {
      toast({ title: 'Duplicate key', description: `${upperKey} already exists`, variant: 'destructive' });
      return;
    }

    const isRequired = REQUIRED_VARS.includes(upperKey);
    setVars([...vars, { id: crypto.randomUUID(), key: upperKey, value: newValue, revealed: false, required: isRequired }]);
    setNewKey('');
    setNewValue('');
    toast({ title: 'Variable added', description: `${upperKey} has been added` });
  }, [newKey, newValue, vars, toast]);

  const removeVar = useCallback((id: string) => {
    setVars(vars.filter((v) => v.id !== id));
    toast({ title: 'Variable removed', description: 'Environment variable deleted' });
  }, [vars, toast]);

  const confirmDeleteVar = useCallback((id: string) => {
    setVars(vars.map((v) => (v.id === id ? { ...v, confirmDelete: !v.confirmDelete } : { ...v, confirmDelete: false })));
  }, [vars]);

  const toggleReveal = useCallback((id: string) => {
    setVars(vars.map((v) => (v.id === id ? { ...v, revealed: !v.revealed } : v)));
  }, [vars]);

  const startEdit = useCallback((id: string) => {
    setVars(vars.map((v) => (v.id === id ? { ...v, editing: true, editKey: v.key, editValue: v.value, confirmDelete: false } : { ...v, editing: false, confirmDelete: false })));
  }, [vars]);

  const cancelEdit = useCallback((id: string) => {
    setVars(vars.map((v) => (v.id === id ? { ...v, editing: false, editKey: undefined, editValue: undefined } : v)));
  }, [vars]);

  const saveEdit = useCallback((id: string) => {
    setVars(vars.map((v) => {
      if (v.id !== id) return v;
      const editKey = (v.editKey || v.key).trim().toUpperCase();
      if (!isValidEnvKey(editKey)) {
        toast({ title: 'Invalid key name', description: 'Must use uppercase letters, digits, or underscores starting with a letter/underscore.', variant: 'destructive' });
        return v;
      }
      return { ...v, key: editKey, value: v.editValue ?? v.value, editing: false, editKey: undefined, editValue: undefined, required: REQUIRED_VARS.includes(editKey) };
    }));
    toast({ title: 'Variable updated', description: 'Changes saved' });
  }, [vars, toast]);

  const updateEditField = useCallback((id: string, field: 'editKey' | 'editValue', val: string) => {
    setVars(vars.map((v) => (v.id === id ? { ...v, [field]: val } : v)));
  }, [vars]);

  const copyValue = useCallback((value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: 'Copied!', description: 'Value copied to clipboard' });
  }, [toast]);

  const copyEnv = useCallback(() => {
    const text = vars.map((v) => `${v.key}=${v.value}`).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${vars.length} variables copied as .env format` });
  }, [vars, toast]);

  const downloadEnv = useCallback(() => {
    const text = vars.map((v) => `${v.key}=${v.value}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  }, [vars]);

  const handleImport = useCallback(() => {
    if (!importText.trim()) return;
    const lines = importText.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    const parsed: EnvVar[] = [];
    let duplicates = 0;

    for (const line of lines) {
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) continue;
      const key = line.slice(0, eqIndex).trim().toUpperCase();
      const value = line.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
      if (!isValidEnvKey(key)) continue;
      if (vars.some((v) => v.key === key) || parsed.some((p) => p.key === key)) {
        duplicates++;
        continue;
      }
      parsed.push({
        id: crypto.randomUUID(),
        key,
        value,
        revealed: false,
        required: REQUIRED_VARS.includes(key),
      });
    }

    if (parsed.length > 0) {
      setVars([...vars, ...parsed]);
      setImportText('');
      setShowImport(false);
      const msg = duplicates > 0
        ? `${parsed.length} variables imported (${duplicates} duplicates skipped)`
        : `${parsed.length} variables imported`;
      toast({ title: 'Import successful', description: msg });
    } else {
      toast({ title: 'No valid variables found', description: 'Ensure format is KEY=VALUE per line', variant: 'destructive' });
    }
  }, [importText, vars, toast]);

  return (
    <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
            <Variable className="w-4 h-4" style={{ color: '#e3b341' }} />
            Environment Variables
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] h-5 px-1.5" style={{ borderColor: '#30363d', color: '#8b949e' }}>
              {vars.length} vars
            </Badge>
            {sensitiveCount > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5" style={{ borderColor: '#f8514940', color: '#f85149' }}>
                <Shield className="w-2.5 h-2.5 mr-0.5" /> {sensitiveCount}
              </Badge>
            )}
            {!allRequiredSet && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5" style={{ borderColor: '#f8514960', color: '#f85149' }}>
                <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> {missingRequired.length} missing
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search + Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#484f58' }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter variables..."
              className="pl-7 h-8 text-xs"
              style={{ backgroundColor: '#0d1117', borderColor: '#30363d', color: '#c9d1d9' }}
            />
          </div>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-[10px] min-w-[44px] min-h-[44px] sm:min-h-0" style={{ color: '#8b949e' }} onClick={copyEnv}>
            <Copy className="w-3 h-3" /> <span className="hidden sm:inline">Copy</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-[10px] min-w-[44px] min-h-[44px] sm:min-h-0" style={{ color: '#8b949e' }} onClick={downloadEnv}>
            <Download className="w-3 h-3" /> <span className="hidden sm:inline">.env</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-[10px] min-w-[44px] min-h-[44px] sm:min-h-0"
            style={{ color: showImport ? '#58a6ff' : '#8b949e', borderColor: showImport ? '#58a6ff' : 'transparent', borderWidth: '1px' }}
            onClick={() => { setShowImport(!showImport); setImportText(''); }}
          >
            <FileText className="w-3 h-3" /> <span className="hidden sm:inline">Import .env</span>
          </Button>
        </div>

        {/* Import .env textarea */}
        <AnimatePresence>
          {showImport && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                <p className="text-[10px] font-medium" style={{ color: '#8b949e' }}>
                  Paste your .env content below (one KEY=VALUE per line, # comments supported)
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`DATABASE_URL=postgresql://...\nNEXTAUTH_SECRET=my-secret-key\n# This is a comment\nAPI_KEY=sk_test_123`}
                  className="w-full h-28 text-xs font-mono p-2.5 rounded-md resize-none focus:outline-none"
                  style={{ backgroundColor: '#161b22', border: '1px solid #21262d', color: '#c9d1d9' }}
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    style={{ color: '#8b949e' }}
                    onClick={() => { setShowImport(false); setImportText(''); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-[10px] gap-1"
                    style={{ background: 'linear-gradient(135deg, #238636, #2ea043)', color: 'white' }}
                    onClick={handleImport}
                    disabled={!importText.trim()}
                  >
                    <Upload className="w-3 h-3" /> Import Variables
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation warning */}
        {!allRequiredSet && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f85149' }} />
            <span className="text-[10px]" style={{ color: '#f85149' }}>
              Missing required: {missingRequired.map((v) => v.key).join(', ')}
            </span>
          </motion.div>
        )}

        {/* Variable List */}
        <ScrollArea className="max-h-72" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {filteredVars.map((v, idx) => {
                const status = getVarStatus(v);
                const borderColor = getBorderColor(status);
                return (
                  <motion.div
                    key={v.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="group rounded-lg transition-colors relative"
                    style={{
                      backgroundColor: '#0d1117',
                      borderLeft: `3px solid ${borderColor}`,
                      borderTop: '1px solid #21262d',
                      borderRight: '1px solid #21262d',
                      borderBottom: '1px solid #21262d',
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                      style={{ backgroundColor: 'rgba(33, 38, 45, 0.4)' }}
                    />

                    {v.editing ? (
                      /* Inline editing mode */
                      <div className="flex items-center gap-2 px-3 py-2 relative z-10">
                        <Input
                          value={v.editKey ?? v.key}
                          onChange={(e) => updateEditField(v.id, 'editKey', e.target.value.toUpperCase())}
                          className="h-7 text-xs font-mono flex-1"
                          style={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#58a6ff' }}
                        />
                        <div className="relative flex-1">
                          <Input
                            value={v.editValue ?? v.value}
                            onChange={(e) => updateEditField(v.id, 'editValue', e.target.value)}
                            type={showNewValue ? 'text' : 'password'}
                            className="h-7 text-xs font-mono pr-8"
                            style={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                          />
                          <button
                            onClick={() => setShowNewValue(!showNewValue)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[#30363d]"
                          >
                            {showNewValue ? (
                              <EyeOff className="w-3 h-3" style={{ color: '#8b949e' }} />
                            ) : (
                              <Eye className="w-3 h-3" style={{ color: '#8b949e' }} />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => saveEdit(v.id)}
                          className="p-1.5 rounded hover:bg-[#23863630] min-w-[28px] min-h-[28px] flex items-center justify-center"
                        >
                          <Check className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />
                        </button>
                        <button
                          onClick={() => cancelEdit(v.id)}
                          className="p-1.5 rounded hover:bg-[#f8514920] min-w-[28px] min-h-[28px] flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" style={{ color: '#f85149' }} />
                        </button>
                      </div>
                    ) : v.confirmDelete ? (
                      /* Delete confirmation mode */
                      <div className="flex items-center gap-2 px-3 py-2 relative z-10">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f85149' }} />
                        <span className="text-[10px] flex-1" style={{ color: '#f85149' }}>
                          Delete <span className="font-mono font-semibold">{v.key}</span>?
                        </span>
                        <button
                          onClick={() => removeVar(v.id)}
                          className="px-2 py-1 rounded text-[10px] font-medium min-w-[44px] min-h-[28px] flex items-center justify-center"
                          style={{ backgroundColor: '#f8514920', color: '#f85149' }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => confirmDeleteVar(v.id)}
                          className="px-2 py-1 rounded text-[10px] font-medium min-w-[44px] min-h-[28px] flex items-center justify-center"
                          style={{ backgroundColor: '#21262d', color: '#8b949e' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      /* Normal display mode */
                      <div className="flex items-center gap-2 px-3 py-2 relative z-10">
                        {/* Key */}
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          {status === 'missing' ? (
                            <AlertCircle className="w-3 h-3 shrink-0" style={{ color: '#f85149' }} />
                          ) : status === 'empty' ? (
                            <Circle className="w-3 h-3 shrink-0" style={{ color: '#e3b341', fill: '#e3b34120' }} />
                          ) : isSensitiveKey(v.key) ? (
                            <Key className="w-3 h-3 shrink-0" style={{ color: '#e3b341' }} />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: '#3fb950' }} />
                          )}
                          <span className="text-xs font-mono truncate" title={v.key} style={{ color: '#58a6ff' }}>
                            {v.key}
                          </span>
                        </div>

                        {/* Value — masked or revealed */}
                        <span
                          className="text-xs font-mono flex-1 truncate"
                          style={{ color: v.revealed ? '#c9d1d9' : '#484f58' }}
                        >
                          {v.revealed ? (v.value || <span style={{ color: '#e3b341', fontStyle: 'italic', opacity: 0.9 }}>empty</span>) : (v.value ? '••••••••••••' : <span style={{ color: '#e3b341', fontStyle: 'italic', opacity: 0.9 }}>empty</span>)}
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => toggleReveal(v.id)}
                            className="p-1.5 rounded hover:bg-[#30363d] min-w-[28px] min-h-[28px] flex items-center justify-center"
                            title={v.revealed ? 'Hide value' : 'Reveal value'}
                          >
                            {v.revealed ? (
                              <EyeOff className="w-3 h-3" style={{ color: '#8b949e' }} />
                            ) : (
                              <Eye className="w-3 h-3" style={{ color: '#8b949e' }} />
                            )}
                          </button>
                          <button
                            onClick={() => copyValue(v.value)}
                            className="p-1.5 rounded hover:bg-[#30363d] min-w-[28px] min-h-[28px] flex items-center justify-center"
                            title="Copy value"
                            disabled={!v.value}
                          >
                            <Copy className="w-3 h-3" style={{ color: v.value ? '#8b949e' : '#30363d' }} />
                          </button>
                          <button
                            onClick={() => startEdit(v.id)}
                            className="p-1.5 rounded hover:bg-[#30363d] min-w-[28px] min-h-[28px] flex items-center justify-center"
                            title="Edit variable"
                          >
                            <Pencil className="w-3 h-3" style={{ color: '#8b949e' }} />
                          </button>
                          <button
                            onClick={() => confirmDeleteVar(v.id)}
                            className="p-1.5 rounded hover:bg-[#f8514920] min-w-[28px] min-h-[28px] flex items-center justify-center"
                            title="Delete variable"
                          >
                            <Trash2 className="w-3 h-3" style={{ color: '#f85149' }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredVars.length === 0 && (
              <div className="text-center py-6">
                <Variable className="w-6 h-6 mx-auto mb-2" style={{ color: '#30363d' }} />
                <p className="text-xs" style={{ color: '#8b949e' }}>
                  {search ? 'No variables match your search' : 'No environment variables configured'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Add New Variable Form */}
        <div className="pt-3 border-t space-y-2" style={{ borderColor: '#21262d' }}>
          <p className="text-[10px] font-medium" style={{ color: '#484f58' }}>Add Variable</p>
          <div className="flex items-center gap-2">
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toUpperCase())}
              placeholder="KEY_NAME"
              className="h-8 text-xs font-mono flex-1 min-w-0"
              style={{ backgroundColor: '#0d1117', borderColor: newKey && !isValidEnvKey(newKey) ? '#f85149' : '#30363d', color: '#58a6ff' }}
              onKeyDown={(e) => e.key === 'Enter' && addVar()}
            />
            <div className="relative flex-1 min-w-0">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="value"
                type={showNewValue ? 'text' : 'password'}
                className="h-8 text-xs font-mono pr-8"
                style={{ backgroundColor: '#0d1117', borderColor: '#30363d', color: '#c9d1d9' }}
                onKeyDown={(e) => e.key === 'Enter' && addVar()}
              />
              <button
                onClick={() => setShowNewValue(!showNewValue)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[#30363d] min-w-[28px] min-h-[28px] flex items-center justify-center"
              >
                {showNewValue ? (
                  <EyeOff className="w-3 h-3" style={{ color: '#8b949e' }} />
                ) : (
                  <Eye className="w-3 h-3" style={{ color: '#8b949e' }} />
                )}
              </button>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1 text-[10px] shrink-0 min-w-[44px] min-h-[44px] sm:min-h-0"
              style={{
                background: newKey.trim() && isValidEnvKey(newKey)
                  ? 'linear-gradient(135deg, #238636, #2ea043, #3fb950)'
                  : '#21262d',
                color: newKey.trim() && isValidEnvKey(newKey) ? 'white' : '#484f58',
                boxShadow: newKey.trim() && isValidEnvKey(newKey) ? '0 2px 10px rgba(35,134,54,0.3)' : 'none',
              }}
              onClick={addVar}
              disabled={!newKey.trim() || !isValidEnvKey(newKey)}
            >
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
          {newKey && !isValidEnvKey(newKey) && (
            <p className="text-[10px]" style={{ color: '#f85149' }}>
              Key must start with a letter or underscore, and contain only uppercase letters, digits, or underscores
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
