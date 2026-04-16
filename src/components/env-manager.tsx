'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnvVar {
  id: string;
  key: string;
  value: string;
  revealed: boolean;
}

const SAMPLE_ENV_VARS: EnvVar[] = [
  { id: '1', key: 'DATABASE_URL', value: 'postgresql://user:pass@localhost:5432/mydb', revealed: false },
  { id: '2', key: 'JWT_SECRET', value: 'super-secret-jwt-key-2025', revealed: false },
  { id: '3', key: 'API_KEY_STRIPE', value: 'sk_test_example_placeholder_key', revealed: false },
  { id: '4', key: 'NEXT_PUBLIC_APP_URL', value: 'https://myapp.vercel.app', revealed: false },
  { id: '5', key: 'REDIS_URL', value: 'redis://default:password@redis-12345.c1.us-east-1.ec2.cloud.redislabs.com:12345', revealed: false },
  { id: '6', key: 'SMTP_PASSWORD', value: 'smtp-email-password-123', revealed: false },
];

function isSensitiveKey(key: string): boolean {
  const sensitive = ['secret', 'password', 'token', 'key', 'private', 'auth'];
  return sensitive.some((s) => key.toLowerCase().includes(s));
}

export function EnvManager() {
  const [vars, setVars] = useState<EnvVar[]>(SAMPLE_ENV_VARS);
  const [search, setSearch] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const { toast } = useToast();

  const filteredVars = search.trim()
    ? vars.filter((v) => v.key.toLowerCase().includes(search.toLowerCase()))
    : vars;

  const sensitiveCount = vars.filter((v) => isSensitiveKey(v.key)).length;

  const addVar = () => {
    if (!newKey.trim()) return;
    setVars([...vars, { id: Date.now().toString(), key: newKey.trim(), value: newValue, revealed: false }]);
    setNewKey('');
    setNewValue('');
    toast({ title: 'Variable added', description: `${newKey} has been added` });
  };

  const removeVar = (id: string) => {
    setVars(vars.filter((v) => v.id !== id));
  };

  const toggleReveal = (id: string) => {
    setVars(vars.map((v) => (v.id === id ? { ...v, revealed: !v.revealed } : v)));
  };

  const copyEnv = () => {
    const text = vars.map((v) => `${v.key}=${v.value}`).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${vars.length} variables copied as .env format` });
  };

  const downloadEnv = () => {
    const text = vars.map((v) => `${v.key}=${v.value}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  };

  const pasteEnv = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
      const parsed = lines.map((line) => {
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) return null;
        return {
          id: Date.now().toString() + Math.random(),
          key: line.slice(0, eqIndex).trim(),
          value: line.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, ''),
          revealed: false,
        };
      }).filter(Boolean) as EnvVar[];

      if (parsed.length > 0) {
        setVars([...vars, ...parsed]);
        toast({ title: 'Variables imported', description: `${parsed.length} variables pasted from clipboard` });
      } else {
        toast({ title: 'No valid variables found', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Could not read clipboard', variant: 'destructive' });
    }
  };

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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search + Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#484f58' }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter variables..."
              className="pl-7 h-7 text-xs bg-[#0d1117] border-[#30363d] text-[#c9d1d9]"
            />
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] hover:bg-[#21262d]" style={{ color: '#8b949e' }} onClick={copyEnv}>
            <Copy className="w-3 h-3" /> Copy
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] hover:bg-[#21262d]" style={{ color: '#8b949e' }} onClick={downloadEnv}>
            <Download className="w-3 h-3" /> .env
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] hover:bg-[#21262d]" style={{ color: '#8b949e' }} onClick={pasteEnv}>
            <Upload className="w-3 h-3" /> Paste
          </Button>
        </div>

        {/* Variable List */}
        <ScrollArea className="max-h-48">
          <div className="space-y-1.5">
            {filteredVars.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg group hover:bg-[#21262d] transition-colors"
                style={{ backgroundColor: '#0d1117' }}
              >
                {isSensitiveKey(v.key) && (
                  <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: '#e3b341' }} />
                )}
                <span className="text-xs font-mono flex-1 truncate" style={{ color: '#58a6ff' }}>
                  {v.key}
                </span>
                <span className="text-xs font-mono flex-1 truncate" style={{ color: v.revealed ? '#c9d1d9' : '#484f58' }}>
                  {v.revealed ? v.value : '••••••••••••'}
                </span>
                <button
                  onClick={() => toggleReveal(v.id)}
                  className="p-1 rounded hover:bg-[#30363d] transition-colors opacity-0 group-hover:opacity-100"
                >
                  {v.revealed ? (
                    <EyeOff className="w-3 h-3" style={{ color: '#8b949e' }} />
                  ) : (
                    <Eye className="w-3 h-3" style={{ color: '#8b949e' }} />
                  )}
                </button>
                <button
                  onClick={() => removeVar(v.id)}
                  className="p-1 rounded hover:bg-[#f8514920] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3 h-3" style={{ color: '#f85149' }} />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Add New Variable */}
        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: '#21262d' }}>
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="KEY"
            className="h-7 text-xs font-mono bg-[#0d1117] border-[#30363d] text-[#58a6ff] flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addVar()}
          />
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="value"
            className="h-7 text-xs font-mono bg-[#0d1117] border-[#30363d] text-[#c9d1d9] flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addVar()}
          />
          <Button
            size="sm"
            className="h-7 gap-1 text-[10px] shrink-0"
            style={{ backgroundColor: '#238636', color: 'white' }}
            onClick={addVar}
            disabled={!newKey.trim()}
          >
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
