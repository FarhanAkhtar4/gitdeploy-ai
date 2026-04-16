'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore, type ChatMessage, type RequirementsCard as RequirementsCardType } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RequirementsCard as RequirementsCardComponent } from '@/components/requirements-card';
import { FileTree, buildTreeFromPaths } from '@/components/file-tree';
import { StatusBadge } from '@/components/status-badge';
import { Progress } from '@/components/ui/progress';
import {
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle,
  Rocket,
  FolderTree,
  FileCode,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type BuilderPhase = 'describe' | 'requirements' | 'file_tree' | 'generating' | 'complete' | 'deploying';

export function BuilderView() {
  const {
    user,
    builderChat,
    addBuilderChat,
    clearBuilderChat,
    requirementsCard,
    setRequirementsCard,
    isBuilding,
    setIsBuilding,
    buildProgress,
    setBuildProgress,
    generatedFiles,
    setGeneratedFiles,
    fileTreeApproved,
    setFileTreeApproved,
    setCurrentView,
    setSelectedProject,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<BuilderPhase>('describe');
  const [isLoading, setIsLoading] = useState(false);
  const [fileTreePaths, setFileTreePaths] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [builderChat]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    addBuilderChat(userMsg);
    setInput('');
    setIsLoading(true);

    try {
      const chatMessages = [...builderChat, userMsg].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          mode: 'project-builder',
        }),
      });

      const data = await res.json();
      const aiContent = data.response || 'Sorry, I could not generate a response.';

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString(),
      };
      addBuilderChat(assistantMsg);

      // Try to parse requirements from AI response
      const reqMatch = aiContent.match(/Project Name\s*:\s*(.+)/i);
      if (reqMatch && phase === 'describe') {
        const parsed = parseRequirements(aiContent);
        if (parsed) {
          setRequirementsCard(parsed);
          setProjectName(parsed.projectName);
          setPhase('requirements');
        }
      }

      // Try to parse file tree
      if (phase === 'requirements' && aiContent.includes('├')) {
        const paths = parseFileTree(aiContent);
        if (paths.length > 0) {
          setFileTreePaths(paths);
          setPhase('file_tree');
        }
      }

      // Parse generated files
      if (phase === 'generating' || fileTreeApproved) {
        const files = parseCodeFiles(aiContent);
        if (files.length > 0) {
          setGeneratedFiles([...generatedFiles, ...files]);
          setBuildProgress({
            current: generatedFiles.length + files.length,
            total: fileTreePaths.length || files.length,
            section: 'Building project files',
          });
        }
      }
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Error: Could not reach AI service. Please try again.',
        timestamp: new Date().toISOString(),
      };
      addBuilderChat(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [builderChat, isLoading, phase, fileTreeApproved, generatedFiles, fileTreePaths.length, addBuilderChat, setRequirementsCard, setGeneratedFiles, setBuildProgress]);

  const handleConfirmRequirements = (card: RequirementsCardType) => {
    setRequirementsCard(card);
    setProjectName(card.projectName);
    sendMessage('✅ Requirements confirmed. Please generate the complete file tree for this project.');
    setPhase('file_tree');
  };

  const handleRejectRequirements = () => {
    sendMessage('🔄 I want to modify the requirements. Let me provide updates.');
  };

  const handleApproveFileTree = () => {
    setFileTreeApproved(true);
    setPhase('generating');
    setIsBuilding(true);
    sendMessage('✅ File tree approved. Please generate all the complete file contents now. Start with the database schema, then models, middleware, routes, and finally the frontend files. Output each file with 📄 FILE: path header.');
  };

  const handleDeploy = async () => {
    if (!user) {
      toast({ title: 'Please connect GitHub first', variant: 'destructive' });
      setCurrentView('onboarding');
      return;
    }

    // Save project and files
    try {
      const projectRes = await fetch('/api/projects/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: projectName || 'my-project',
          description: requirementsCard?.keyFeatures.join(', ') || '',
          framework: requirementsCard?.frontend?.toLowerCase().includes('next') ? 'nextjs' : 'react',
          stackJson: JSON.stringify(requirementsCard || {}),
        }),
      });
      const projectData = await projectRes.json();

      if (projectData.project) {
        setSelectedProject({
          id: projectData.project.id,
          name: projectData.project.name,
          description: projectData.project.description,
          githubRepoUrl: null,
          liveUrl: null,
          framework: projectData.project.framework,
          stackJson: projectData.project.stack_json,
          defaultBranch: 'main',
          status: 'not_deployed',
          createdAt: projectData.project.created_at,
          updatedAt: projectData.project.updated_at,
          files: [],
          deployments: [],
        });

        // Save files
        await fetch('/api/projects/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: projectData.project.id,
            files: generatedFiles.map((f) => ({
              path: f.path,
              content: f.content,
            })),
          }),
        });

        setCurrentView('deploy');
      }
    } catch (error) {
      toast({ title: 'Failed to save project', description: 'Please try again', variant: 'destructive' });
    }
  };

  const handleStartNew = () => {
    clearBuilderChat();
    setRequirementsCard(null);
    setGeneratedFiles([]);
    setFileTreeApproved(false);
    setPhase('describe');
    setFileTreePaths([]);
    setBuildProgress({ current: 0, total: 0, section: '' });
  };

  return (
    <div className="flex h-[calc(100vh-140px)]">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#30363d' }}>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" style={{ color: '#58a6ff' }} />
            <h2 className="text-sm font-medium" style={{ color: '#c9d1d9' }}>AI Project Builder</h2>
            <StatusBadge status={isBuilding ? 'building' : phase === 'complete' ? 'completed' : 'not_deployed'} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            style={{ color: '#8b949e' }}
            onClick={handleStartNew}
          >
            New Project
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {builderChat.length === 0 && (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 mx-auto mb-3" style={{ color: '#30363d' }} />
                <h3 className="text-lg font-medium" style={{ color: '#c9d1d9' }}>
                  Describe your project
                </h3>
                <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
                  Tell me what you want to build and I&apos;ll create it for you
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {[
                    'Build me a SaaS invoice management app',
                    'Create a REST API for a food delivery app',
                    'Build a full-stack todo app with auth',
                  ].map((example) => (
                    <button
                      key={example}
                      className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-[#21262d]"
                      style={{ borderColor: '#30363d', color: '#8b949e' }}
                      onClick={() => sendMessage(example)}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {builderChat.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: msg.role === 'user' ? '#30363d' : '#58a6ff20',
                  }}
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4" style={{ color: '#c9d1d9' }} />
                  ) : (
                    <Bot className="w-4 h-4" style={{ color: '#58a6ff' }} />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                    msg.role === 'user' ? 'text-right' : ''
                  }`}
                  style={{
                    backgroundColor: msg.role === 'user' ? '#30363d' : '#0d1117',
                    border: `1px solid ${msg.role === 'user' ? '#30363d' : '#21262d'}`,
                    color: '#c9d1d9',
                  }}
                >
                  <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#58a6ff20' }}>
                  <Bot className="w-4 h-4" style={{ color: '#58a6ff' }} />
                </div>
                <div className="rounded-lg px-4 py-3" style={{ backgroundColor: '#0d1117', border: '1px solid #21262d' }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#58a6ff' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Build Progress */}
        {isBuilding && buildProgress.total > 0 && (
          <div className="px-4 py-2 border-t" style={{ borderColor: '#30363d' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: '#8b949e' }}>
                📦 [BUILD PROGRESS: {buildProgress.current} of {buildProgress.total} files — {buildProgress.section}]
              </span>
            </div>
            <Progress
              value={(buildProgress.current / buildProgress.total) * 100}
              className="h-1.5"
            />
          </div>
        )}

        {/* Deploy Button */}
        {phase === 'generating' && generatedFiles.length > 0 && (
          <div className="px-4 py-3 border-t" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#3fb950' }}>
                <CheckCircle className="w-4 h-4 inline mr-1" />
                {generatedFiles.length} files generated
              </span>
              <Button
                className="gap-2"
                style={{ backgroundColor: '#238636', color: 'white' }}
                onClick={() => {
                  setPhase('complete');
                  setIsBuilding(false);
                }}
              >
                Review Build
              </Button>
            </div>
          </div>
        )}

        {phase === 'complete' && (
          <div className="px-4 py-3 border-t" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
            <Card style={{ backgroundColor: '#0d1117', borderColor: '#238636' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#3fb950' }}>
                      ✅ BUILD COMPLETE — REVIEW BEFORE DEPLOYMENT
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#8b949e' }}>
                      {generatedFiles.length} files built for {projectName}
                    </p>
                  </div>
                  <Button
                    className="gap-2"
                    style={{ backgroundColor: '#238636', color: 'white' }}
                    onClick={handleDeploy}
                  >
                    <Rocket className="w-4 h-4" /> DEPLOY APPROVED
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#30363d' }}>
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you want to build..."
              className="min-h-[40px] max-h-32 bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={1}
            />
            <Button
              size="icon"
              disabled={!input.trim() || isLoading}
              style={{ backgroundColor: '#238636', color: 'white' }}
              onClick={() => sendMessage(input)}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Side Panel — Requirements / File Tree / Files */}
      <div className="w-80 border-l hidden md:block overflow-y-auto" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
        <div className="p-4 space-y-4">
          {/* Requirements Card */}
          {requirementsCard && phase !== 'describe' && (
            <RequirementsCardComponent
              card={requirementsCard}
              onConfirm={handleConfirmRequirements}
              onReject={handleRejectRequirements}
            />
          )}

          {/* File Tree */}
          {fileTreePaths.length > 0 && (
            <div>
              <h3 className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <FolderTree className="w-3.5 h-3.5" /> File Structure
              </h3>
              <FileTree tree={buildTreeFromPaths(fileTreePaths)} maxHeight="300px" />
              {!fileTreeApproved && phase === 'file_tree' && (
                <Button
                  className="w-full mt-3 gap-2"
                  size="sm"
                  style={{ backgroundColor: '#238636', color: 'white' }}
                  onClick={handleApproveFileTree}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve & Generate Code
                </Button>
              )}
            </div>
          )}

          {/* Generated Files List */}
          {generatedFiles.length > 0 && (
            <div>
              <h3 className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: '#c9d1d9' }}>
                <FileCode className="w-3.5 h-3.5" /> Generated Files ({generatedFiles.length})
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {generatedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: '#0d1117' }}
                  >
                    <CheckCircle className="w-3 h-3 shrink-0" style={{ color: '#3fb950' }} />
                    <span className="font-mono truncate" style={{ color: '#8b949e' }}>
                      {file.path}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper parsers
function parseRequirements(content: string): RequirementsCardType | null {
  const nameMatch = content.match(/Project Name\s*:\s*(.+)/i);
  if (!nameMatch) return null;

  return {
    projectName: nameMatch[1].trim(),
    type: content.match(/Type\s*:\s*(.+)/i)?.[1]?.trim() || 'SaaS',
    frontend: content.match(/Frontend\s*:\s*(.+)/i)?.[1]?.trim() || 'Next.js',
    backend: content.match(/Backend\s*:\s*(.+)/i)?.[1]?.trim() || 'Node/Express',
    database: content.match(/Database\s*:\s*(.+)/i)?.[1]?.trim() || 'PostgreSQL',
    auth: content.match(/Auth\s*:\s*(.+)/i)?.[1]?.trim() || 'JWT',
    keyFeatures: content.match(/Key Features\s*:\s*(.+)/i)?.[1]?.split(',').map(f => f.trim()) || [],
    freeHosting: content.match(/Free Hosting\s*:\s*(.+)/i)?.[1]?.trim() || 'Vercel + Railway',
    estimatedFiles: parseInt(content.match(/Estimated Files\s*:\s*(\d+)/i)?.[1] || '20'),
    estimatedDirs: parseInt(content.match(/(\d+)\s+directories/i)?.[1] || '5'),
  };
}

function parseFileTree(content: string): string[] {
  const paths: string[] = [];
  const lines = content.split('\n');
  const dirStack: string[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/[│├└─┐┘┤┬┴┼]/g, '').trim();
    if (!trimmed || trimmed.endsWith('/')) {
      // Directory
      const dirName = trimmed.replace(/\/$/, '').trim();
      if (dirName) {
        const depth = (line.match(/[│]/g) || []).length;
        dirStack.length = depth;
        dirStack.push(dirName);
      }
    } else if (trimmed && trimmed.includes('.')) {
      // File with extension
      const depth = (line.match(/[│]/g) || []).length;
      const currentPath = dirStack.slice(0, depth).join('/');
      paths.push(currentPath ? `${currentPath}/${trimmed}` : trimmed);
    }
  }
  return paths;
}

function parseCodeFiles(content: string): Array<{ path: string; content: string; purpose: string }> {
  const files: Array<{ path: string; content: string; purpose: string }> = [];
  const regex = /📄\s*FILE:\s*(.+)\n\[PURPOSE\]:\s*(.+)\n```[\w]*\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    files.push({
      path: match[1].trim(),
      purpose: match[2].trim(),
      content: match[3].trim(),
    });
  }

  // Try alternate format
  const altRegex = /\*\*FILE:\*\*\s*(.+)\n\*\*PURPOSE\*\*:?\s*(.+)\n```[\w]*\n([\s\S]*?)```/g;
  while ((match = altRegex.exec(content)) !== null) {
    files.push({
      path: match[1].trim(),
      purpose: match[2].trim(),
      content: match[3].trim(),
    });
  }

  return files;
}
