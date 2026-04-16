'use client';

import React, { useState } from 'react';
import { useAppStore, type GitHubUser } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Check,
  Github,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STEPS = ['Welcome', 'Create Account', 'Connect GitHub', 'Validate Token', 'Ready'];

export function OnboardingWizard() {
  const { setUser, setGithubUser, setIsGithubConnected, setCurrentView } = useAppStore();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [tokenScopes, setTokenScopes] = useState<string[]>([]);
  const { toast } = useToast();

  const handleValidateToken = async () => {
    setValidating(true);
    setError('');

    try {
      const res = await fetch('/api/auth/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Validation failed');
        if (data.missingScopes) {
          setTokenScopes(data.currentScopes || []);
        }
        return;
      }

      // Success
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        plan: data.user.plan,
      });

      setGithubUser({
        login: data.github.login,
        avatar_url: data.github.avatar_url,
        public_repos: data.github.public_repos,
        plan: { name: data.github.plan },
        scopes: data.github.scopes,
      });

      setTokenScopes(data.github.scopes);
      setIsGithubConnected(true);
      setStep(4); // Go to "Ready" step

      toast({
        title: 'GitHub Connected!',
        description: `Connected as @${data.github.login}`,
      });
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const requiredScopes = ['repo', 'workflow'];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-lg" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
        <CardHeader>
          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i <= step ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: i < step ? '#238636' : i === step ? '#58a6ff' : '#21262d',
                    color: i <= step ? 'white' : '#484f58',
                  }}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="w-8 h-0.5 mx-1"
                    style={{ backgroundColor: i < step ? '#238636' : '#21262d' }}
                  />
                )}
              </div>
            ))}
          </div>
          <CardTitle className="text-lg" style={{ color: '#c9d1d9' }}>
            {STEPS[step]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-4 text-center">
              <div className="py-8">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: '#58a6ff20' }}>
                  <Zap className="w-8 h-8" style={{ color: '#58a6ff' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: '#c9d1d9' }}>Welcome to GitDeploy AI</h2>
                <p className="text-sm" style={{ color: '#8b949e' }}>
                  Build any project with AI and deploy it to GitHub with one click.
                </p>
              </div>
              <Button
                className="w-full gap-2"
                style={{ backgroundColor: '#238636', color: 'white' }}
                onClick={() => setStep(1)}
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Create Account */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs" style={{ color: '#8b949e' }}>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs" style={{ color: '#8b949e' }}>Name (optional)</Label>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  style={{ borderColor: '#30363d', color: '#8b949e' }}
                  onClick={() => setStep(0)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  className="flex-1 gap-2"
                  style={{ backgroundColor: '#238636', color: 'white' }}
                  disabled={!email}
                  onClick={() => setStep(2)}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Connect GitHub Token */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border" style={{ backgroundColor: '#0d1117', borderColor: '#30363d' }}>
                <p className="text-xs mb-2" style={{ color: '#8b949e' }}>
                  Create a Personal Access Token (PAT) at:
                </p>
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1"
                  style={{ color: '#58a6ff' }}
                >
                  github.com/settings/tokens/new ↗
                </a>
                <p className="text-xs mt-2" style={{ color: '#8b949e' }}>
                  Required scopes: <code className="text-[#3fb950]">repo</code>, <code className="text-[#3fb950]">workflow</code>
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs" style={{ color: '#8b949e' }}>GitHub Personal Access Token</Label>
                <div className="relative">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] pr-10"
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="w-4 h-4" style={{ color: '#8b949e' }} />
                    ) : (
                      <Eye className="w-4 h-4" style={{ color: '#8b949e' }} />
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(248,81,73,0.1)' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#f85149' }} />
                  <p className="text-xs" style={{ color: '#f85149' }}>{error}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  style={{ borderColor: '#30363d', color: '#8b949e' }}
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  className="flex-1 gap-2"
                  style={{ backgroundColor: '#238636', color: 'white' }}
                  disabled={!token || validating}
                  onClick={handleValidateToken}
                >
                  {validating ? (
                    <><span className="animate-spin">⏳</span> Validating...</>
                  ) : (
                    <><Shield className="w-4 h-4" /> Validate & Connect</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Validate Token (auto-skipped to step 4 on success) */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: '#8b949e' }}>Validating your token...</p>
            </div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="py-4">
                <Github className="w-12 h-12 mx-auto mb-3" style={{ color: '#3fb950' }} />
                <h3 className="text-lg font-medium" style={{ color: '#3fb950' }}>You&apos;re all set!</h3>
                <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
                  Your GitHub account is connected and ready to deploy.
                </p>
              </div>

              {/* Scopes checklist */}
              <div className="space-y-2 text-left p-3 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
                <p className="text-xs font-medium mb-2" style={{ color: '#c9d1d9' }}>Token Scopes</p>
                {requiredScopes.map((scope) => {
                  const hasScope = tokenScopes.includes(scope) || tokenScopes.includes('repo');
                  return (
                    <div key={scope} className="flex items-center gap-2">
                      {hasScope ? (
                        <Check className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" style={{ color: '#f85149' }} />
                      )}
                      <span className="text-xs font-mono" style={{ color: hasScope ? '#3fb950' : '#f85149' }}>
                        {scope}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Button
                className="w-full gap-2"
                style={{ backgroundColor: '#238636', color: 'white' }}
                onClick={() => setCurrentView('builder')}
              >
                <Zap className="w-4 h-4" /> Build Your First Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
