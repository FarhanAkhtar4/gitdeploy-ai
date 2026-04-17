'use client';

import React, { useState } from 'react';
import { useAppStore, type SelectedFile } from '@/store/app-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  Check,
  FileCode,
  Download,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
    html: 'html', css: 'css', scss: 'scss', json: 'json', yaml: 'yaml',
    yml: 'yaml', md: 'markdown', sql: 'sql', prisma: 'prisma',
    graphql: 'graphql', sh: 'bash', bash: 'bash',
  };
  return langMap[ext] || 'text';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function simpleSyntaxHighlight(code: string, language: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, i) => {
    let highlighted = line;
    // Comments
    if (language === 'typescript' || language === 'javascript') {
      highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span style="color:#8b949e">$1</span>');
      highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#8b949e">$1</span>');
      highlighted = highlighted.replace(/\b(import|from|export|default|const|let|var|function|return|if|else|async|await|new|class|extends|implements|interface|type|enum|try|catch|throw|typeof|instanceof)\b/g,
        '<span style="color:#ff7b72">$1</span>');
      highlighted = highlighted.replace(/\b(true|false|null|undefined|this|super)\b/g,
        '<span style="color:#79c0ff">$1</span>');
      highlighted = highlighted.replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g,
        '<span style="color:#a5d6ff">$&</span>');
      highlighted = highlighted.replace(/\b(\d+)\b/g,
        '<span style="color:#79c0ff">$1</span>');
    } else if (language === 'yaml') {
      highlighted = highlighted.replace(/^(\s*[\w-]+)(:)/gm, '<span style="color:#7ee787">$1</span>$2');
      highlighted = highlighted.replace(/(#.*$)/gm, '<span style="color:#8b949e">$1</span>');
      highlighted = highlighted.replace(/(["'])(?:(?!\1|\\).|\\.)*\1/g,
        '<span style="color:#a5d6ff">$&</span>');
    } else if (language === 'prisma') {
      highlighted = highlighted.replace(/\b(model|enum|datasource|generator|field|type|enum|id|updatedAt|createdAt|map|unique|default|relation|String|Int|Boolean|DateTime|Float|Json)\b/g,
        '<span style="color:#ff7b72">$1</span>');
      highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span style="color:#8b949e">$1</span>');
    } else if (language === 'json') {
      highlighted = highlighted.replace(/(["'])(?:(?!\1|\\).|\\.)*\1\s*:/g,
        '<span style="color:#7ee787">$&</span>');
      highlighted = highlighted.replace(/:\s*(["'])(?:(?!\1|\\).|\\.)*\1/g,
        '<span style="color:#a5d6ff">$&</span>');
      highlighted = highlighted.replace(/:\s*(\d+)\b/g,
        ': <span style="color:#79c0ff">$1</span>');
      highlighted = highlighted.replace(/:\s*(true|false|null)\b/g,
        ': <span style="color:#79c0ff">$1</span>');
    }

    return (
      <div key={i} className="flex">
        <span
          className="w-10 shrink-0 text-right pr-3 select-none border-r"
          style={{ color: '#484f58', borderColor: '#21262d', borderRightWidth: '1px' }}
        >
          {i + 1}
        </span>
        <span
          className="pl-3 flex-1"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    );
  });
}

export function FileViewer() {
  const { selectedFile, setSelectedFile } = useAppStore();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!selectedFile) return null;

  const language = getLanguageFromPath(selectedFile.path);
  const lineCount = selectedFile.content.split('\n').length;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    toast({ title: 'Copied!', description: `${selectedFile.path} copied to clipboard` });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.path.split('/').pop() || 'file';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
      <DialogContent
        className="max-w-4xl max-h-[85vh] p-0 gap-0 border-[#30363d] rounded-xl overflow-hidden"
        style={{ backgroundColor: '#0d1117' }}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(88,166,255,0.15)' }}>
                <FileCode className="w-4 h-4" style={{ color: '#58a6ff' }} />
              </div>
              <div>
                <DialogTitle className="text-sm font-mono" style={{ color: '#c9d1d9' }}>
                  {selectedFile.path}
                </DialogTitle>
                <DialogDescription className="text-[10px] mt-0.5" style={{ color: '#8b949e' }}>
                  {selectedFile.purpose} • {lineCount} lines • {language}
                  {selectedFile.sizeBytes && ` • ${formatFileSize(selectedFile.sizeBytes)}`}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]" style={{ borderColor: '#30363d', color: '#8b949e' }}>
                {language}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs hover:bg-[#21262d]"
                style={{ color: '#58a6ff' }}
                onClick={handleCopy}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs hover:bg-[#21262d]"
                style={{ color: '#3fb950' }}
                onClick={handleDownload}
              >
                <Download className="w-3 h-3" /> Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Code Content */}
        <ScrollArea className="max-h-[70vh]">
          <div className="font-mono text-xs leading-relaxed p-4" style={{ color: '#c9d1d9' }}>
            {simpleSyntaxHighlight(selectedFile.content, language)}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
