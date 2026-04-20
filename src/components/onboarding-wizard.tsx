'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore, type GitHubUser } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
  User,
  Rocket,
  ChevronDown,
  ChevronUp,
  Lock,
  Bot,
  Globe,
  MessageSquare,
  PartyPopper,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = ['Welcome', 'Account', 'GitHub', 'Validate', 'Ready'];
const STEP_ICONS = [Zap, User, Github, Shield, Check];

// Step gradient colors for illustration circles
const STEP_GRADIENTS = [
  'linear-gradient(135deg, rgba(88,166,255,0.25) 0%, rgba(88,166,255,0.05) 100%)',
  'linear-gradient(135deg, rgba(188,140,255,0.25) 0%, rgba(188,140,255,0.05) 100%)',
  'linear-gradient(135deg, rgba(139,148,158,0.25) 0%, rgba(139,148,158,0.05) 100%)',
  'linear-gradient(135deg, rgba(88,166,255,0.25) 0%, rgba(63,185,80,0.05) 100%)',
  'linear-gradient(135deg, rgba(63,185,80,0.25) 0%, rgba(227,179,65,0.05) 100%)',
];

export function OnboardingWizard() {
  const { setUser, setGithubUser, setIsGithubConnected, setCurrentView, githubUser } = useAppStore();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [tokenScopes, setTokenScopes] = useState<string[]>([]);
  const [showWhyNeeded, setShowWhyNeeded] = useState(false);
  const [validationSteps, setValidationSteps] = useState<{ text: string; done: boolean }[]>([]);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();

  const handleValidateToken = async () => {
    setValidating(true);
    setError('');
    setValidationSteps([]);

    const steps = [
      'Connecting to GitHub...',
      'Verifying token scopes...',
      'Fetching user profile...',
      'Encrypting token for storage...',
    ];

    // Animate validation steps one by one
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setValidationSteps((prev) => [...prev, { text: steps[i], done: true }]);
    }

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
        setValidationSteps([]);
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

      if (typeof window !== 'undefined' && data.user?.id) {
        localStorage.setItem('gitdeploy_user_id', data.user.id);
      }

      setStep(4);
      setShowCelebration(true);

      setTimeout(() => {
        setCurrentView('dashboard');
      }, 2500);

      toast({
        title: 'GitHub Connected!',
        description: `Connected as @${data.github.login}`,
      });
    } catch (err) {
      setError('Network error. Please try again.');
      setValidationSteps([]);
    } finally {
      setValidating(false);
    }
  };

  const requiredScopes = ['repo', 'workflow'];

  const isEmailValid = email.length > 0 && /\S+@\S+\.\S+/.test(email);

  // Confetti particles for the ready step
  const confettiColors = ['#58a6ff', '#3fb950', '#e3b341', '#f85149', '#bc8cff', '#ff7b72'];

  // Generate stable confetti particles
  const confettiParticles = useMemo(() => {
    return confettiColors.flatMap((color, i) =>
      Array.from({ length: 5 }).map((_, j) => ({
        color,
        width: 4 + ((i * 7 + j * 3) % 6),
        height: 4 + ((i * 5 + j * 9) % 6),
        left: 8 + ((i * 17 + j * 13) % 84),
        delay: (i * 0.15 + j * 0.2) % 1.5,
        duration: 2 + ((i * 3 + j * 2) % 2),
        rotation: (i * 120 + j * 60) % 720,
        shape: j % 3 === 0 ? 'rounded-full' : j % 3 === 1 ? 'rounded-sm' : '',
      }))
    );
  }, []);

  // Slide transition variants for steps
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 60 : -60,
      opacity: 0,
    }),
  };

  // Track direction of step navigation
  const [direction, setDirection] = useState(1);

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-xl">
        {/* Horizontal Progress Bar */}
        <div className="mb-6 px-4">
          <div className="h-1.5 rounded-full relative overflow-hidden" style={{ backgroundColor: '#21262d' }}>
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #58a6ff, #3fb950)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Enhanced Step Progress Indicators */}
        <div className="mb-8 px-4">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => {
              const Icon = STEP_ICONS[i];
              const isCompleted = i < step;
              const isActive = i === step;

              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className="relative flex items-center justify-center"
                      initial={false}
                      animate={{
                        scale: isActive ? 1.05 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {/* Pulsing glow ring for active step */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ border: '2px solid #58a6ff' }}
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.6, 0, 0.6],
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}

                      {/* Circle */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-all duration-300"
                        style={{
                          backgroundColor: isCompleted ? '#238636' : isActive ? '#58a6ff' : '#21262d',
                          boxShadow: isActive
                            ? '0 0 20px rgba(88, 166, 255, 0.3), 0 0 40px rgba(88, 166, 255, 0.1)'
                            : isCompleted
                            ? '0 0 12px rgba(35, 134, 54, 0.3)'
                            : 'none',
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {isCompleted ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                              <Check className="w-5 h-5 text-white" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="icon"
                              initial={{ scale: 0.8, opacity: 0.5 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Icon
                                className="w-5 h-5"
                                style={{ color: isActive ? 'white' : '#484f58' }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    {/* Step label */}
                    <span
                      className="text-[10px] mt-2 font-medium whitespace-nowrap"
                      style={{ color: isActive ? '#58a6ff' : isCompleted ? '#3fb950' : '#484f58' }}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Connecting line */}
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 mx-2 mt-[-16px]">
                      <div className="h-0.5 rounded-full relative overflow-hidden" style={{ backgroundColor: '#21262d' }}>
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ backgroundColor: '#3fb950' }}
                          initial={{ width: '0%' }}
                          animate={{ width: isCompleted ? '100%' : '0%' }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card with gradient border */}
        <div className="relative rounded-lg p-px" style={{ background: 'linear-gradient(135deg, rgba(88,166,255,0.2) 0%, rgba(63,185,80,0.1) 50%, rgba(227,179,65,0.1) 100%)' }}>
          <Card className="overflow-hidden" style={{ backgroundColor: '#161b22', borderColor: 'transparent' }}>
            <CardContent className="p-0">
              <AnimatePresence mode="wait" custom={direction}>
                {/* Step 0: Welcome */}
                {step === 0 && (
                  <motion.div
                    key="welcome"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <div className="relative p-8 text-center overflow-hidden">
                      {/* Gradient background */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.08) 0%, rgba(63, 185, 80, 0.05) 50%, rgba(227, 179, 65, 0.03) 100%)',
                        }}
                      />

                      {/* Animated gradient orb */}
                      <motion.div
                        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
                        style={{
                          background: 'radial-gradient(circle, rgba(88, 166, 255, 0.3), transparent 70%)',
                        }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.15, 0.25, 0.15],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-20"
                        style={{
                          background: 'radial-gradient(circle, rgba(63, 185, 80, 0.3), transparent 70%)',
                        }}
                        animate={{
                          scale: [1.2, 1, 1.2],
                          opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      />

                      <div className="relative z-10">
                        {/* Welcome icon with gradient circle */}
                        <motion.div
                          className="relative inline-flex items-center justify-center mb-6"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <motion.div
                            className="absolute inset-0 rounded-2xl"
                            style={{ border: '2px solid rgba(88, 166, 255, 0.3)' }}
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center"
                            style={{ background: STEP_GRADIENTS[0] }}
                          >
                            <Zap className="w-10 h-10" style={{ color: '#58a6ff' }} />
                          </div>
                        </motion.div>

                        <h2 className="text-2xl font-bold mb-2 gradient-text">
                          Welcome to GitDeploy AI
                        </h2>
                        <p className="text-sm mb-8" style={{ color: '#8b949e' }}>
                          Build any project with AI and deploy it to GitHub with one click. Free hosting included.
                        </p>

                        {/* Feature highlights */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                          {[
                            { emoji: '🤖', title: 'AI Builder', desc: 'Generate full projects from prompts' },
                            { emoji: '🚀', title: 'One-Click Deploy', desc: 'Push to GitHub automatically' },
                            { emoji: '🆓', title: 'Free Hosting', desc: 'Find the best free hosting' },
                          ].map((feature, i) => (
                            <motion.div
                              key={feature.title}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 + i * 0.1 }}
                              className="group relative p-3 rounded-xl border transition-all duration-200 hover-lift card-shine cursor-default"
                              style={{
                                backgroundColor: 'rgba(22, 27, 34, 0.8)',
                                borderColor: '#30363d',
                              }}
                            >
                              <div className="text-2xl mb-1.5">{feature.emoji}</div>
                              <div className="text-xs font-semibold mb-0.5" style={{ color: '#c9d1d9' }}>
                                {feature.title}
                              </div>
                              <div className="text-[10px]" style={{ color: '#8b949e' }}>
                                {feature.desc}
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* CTA button */}
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            className="w-full gap-2 h-12 text-base font-semibold"
                            style={{
                              backgroundColor: '#238636',
                              color: 'white',
                              boxShadow: '0 0 20px rgba(35, 134, 54, 0.3), 0 4px 12px rgba(0,0,0,0.3)',
                            }}
                            onClick={() => goToStep(1)}
                          >
                            <Rocket className="w-5 h-5" /> Get Started <ArrowRight className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Create Account */}
                {step === 1 && (
                  <motion.div
                    key="account"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <div className="p-6 md:p-8">
                      {/* Large animated icon area */}
                      <div className="text-center mb-6">
                        <motion.div
                          className="relative inline-flex items-center justify-center mb-3"
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        >
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{ border: '2px solid rgba(188, 140, 255, 0.2)' }}
                            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <div
                            className="w-20 h-20 rounded-full flex items-center justify-center"
                            style={{ background: STEP_GRADIENTS[1] }}
                          >
                            <User className="w-10 h-10" style={{ color: '#bc8cff' }} />
                          </div>
                        </motion.div>
                        <h3 className="text-lg font-semibold" style={{ color: '#c9d1d9' }}>
                          Create Your Account
                        </h3>
                        <p className="text-xs mt-1" style={{ color: '#8b949e' }}>
                          Just your email to get started. You can always add more later.
                        </p>
                      </div>

                      <div className="space-y-4 max-w-sm mx-auto">
                        {/* Email input with icon */}
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: '#8b949e' }}>
                            Email <span style={{ color: '#f85149' }}>*</span>
                          </Label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                              <svg className="w-4 h-4" style={{ color: '#484f58' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onBlur={() => setEmailTouched(true)}
                              className="pl-9 transition-colors duration-200"
                              style={{
                                backgroundColor: '#0d1117',
                                borderColor: emailTouched && !isEmailValid && email ? '#f85149' : isEmailValid ? '#3fb950' : '#30363d',
                                color: '#c9d1d9',
                              }}
                            />
                            {emailTouched && email && (
                              <motion.div
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                              >
                                {isEmailValid ? (
                                  <Check className="w-4 h-4" style={{ color: '#3fb950' }} />
                                ) : (
                                  <AlertCircle className="w-4 h-4" style={{ color: '#f85149' }} />
                                )}
                              </motion.div>
                            )}
                          </div>
                          {emailTouched && !isEmailValid && email && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-[11px]"
                              style={{ color: '#f85149' }}
                            >
                              Please enter a valid email address
                            </motion.p>
                          )}
                        </div>

                        {/* Name input with icon */}
                        <div className="space-y-2">
                          <Label className="text-xs" style={{ color: '#8b949e' }}>Name (optional)</Label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                              <User className="w-4 h-4" style={{ color: '#484f58' }} />
                            </div>
                            <Input
                              placeholder="Your name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="pl-9 transition-colors duration-200"
                              style={{ backgroundColor: '#0d1117', borderColor: '#30363d', color: '#c9d1d9' }}
                            />
                          </div>
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            className="focus-ring gap-1"
                            style={{ borderColor: '#30363d', color: '#8b949e', backgroundColor: 'transparent' }}
                            onClick={() => goToStep(0)}
                          >
                            <ArrowLeft className="w-4 h-4" /> Back
                          </Button>
                          <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Button
                              className="w-full gap-2 focus-ring"
                              style={{
                                backgroundColor: isEmailValid ? '#238636' : '#21262d',
                                color: isEmailValid ? 'white' : '#484f58',
                                cursor: isEmailValid ? 'pointer' : 'not-allowed',
                              }}
                              disabled={!isEmailValid}
                              onClick={() => goToStep(2)}
                            >
                              Next <ArrowRight className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </div>

                        {/* Skip for now */}
                        <div className="text-center">
                          <button
                            className="text-xs transition-colors duration-200 focus-ring rounded px-2 py-1"
                            style={{ color: '#58a6ff' }}
                            onClick={() => goToStep(2)}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#79c0ff')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#58a6ff')}
                          >
                            Skip for now →
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Connect GitHub Token */}
                {step === 2 && (
                  <motion.div
                    key="github"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <div className="relative p-6 md:p-8 overflow-hidden">
                      {/* GitHub logo watermark */}
                      <div
                        className="absolute -right-8 -top-8 opacity-[0.03] pointer-events-none"
                      >
                        <Github className="w-48 h-48" />
                      </div>

                      <div className="relative z-10">
                        {/* Large animated icon area */}
                        <div className="text-center mb-6">
                          <motion.div
                            className="relative inline-flex items-center justify-center mb-3"
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          >
                            <motion.div
                              className="absolute inset-0 rounded-full"
                              style={{ border: '2px solid rgba(139, 148, 158, 0.2)' }}
                              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <div
                              className="w-20 h-20 rounded-full flex items-center justify-center"
                              style={{ background: STEP_GRADIENTS[2] }}
                            >
                              <Github className="w-10 h-10" style={{ color: '#c9d1d9' }} />
                            </div>
                          </motion.div>
                          <h3 className="text-lg font-semibold" style={{ color: '#c9d1d9' }}>
                            Connect Your GitHub
                          </h3>
                          <p className="text-xs mt-1" style={{ color: '#8b949e' }}>
                            We need a Personal Access Token to deploy on your behalf.
                          </p>
                        </div>

                        <div className="max-w-sm mx-auto space-y-4">
                          {/* Token creation info */}
                          <div
                            className="p-3 rounded-lg border transition-colors duration-200"
                            style={{ backgroundColor: '#0d1117', borderColor: '#30363d' }}
                          >
                            <p className="text-xs mb-2" style={{ color: '#8b949e' }}>
                              Create a Personal Access Token (PAT) at:
                            </p>
                            <a
                              href="https://github.com/settings/tokens/new"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs flex items-center gap-1 transition-colors duration-200 focus-ring rounded px-1"
                              style={{ color: '#58a6ff' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#79c0ff')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#58a6ff')}
                            >
                              github.com/settings/tokens/new ↗
                            </a>

                            {/* Visual scope checklist */}
                            <div className="mt-3 space-y-2">
                              <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#8b949e' }}>
                                Required scopes
                              </p>
                              <div className="space-y-1.5">
                                {[
                                  { scope: 'repo', desc: 'Full control of private repositories', color: '#58a6ff', bgColor: 'rgba(88, 166, 255, 0.12)', borderColor: 'rgba(88, 166, 255, 0.2)' },
                                  { scope: 'workflow', desc: 'Update GitHub Actions workflows', color: '#3fb950', bgColor: 'rgba(63, 185, 80, 0.12)', borderColor: 'rgba(63, 185, 80, 0.2)' },
                                ].map((item, i) => (
                                  <motion.div
                                    key={item.scope}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="flex items-center gap-2 p-2 rounded-lg"
                                    style={{ backgroundColor: item.bgColor, border: `1px solid ${item.borderColor}` }}
                                  >
                                    {token && token.length > 10 ? (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 400, delay: 0.5 + i * 0.1 }}
                                      >
                                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                                      </motion.div>
                                    ) : (
                                      <div
                                        className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                                        style={{ border: `1.5px solid ${item.color}`, backgroundColor: 'transparent' }}
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color, opacity: 0.4 }} />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <code className="font-mono text-[11px] font-semibold" style={{ color: item.color }}>{item.scope}</code>
                                      <span className="text-[10px] ml-1.5" style={{ color: '#8b949e' }}>{item.desc}</span>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Token input */}
                          <div className="space-y-2">
                            <Label className="text-xs" style={{ color: '#8b949e' }}>
                              GitHub Personal Access Token
                            </Label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <Lock className="w-4 h-4" style={{ color: '#484f58' }} />
                              </div>
                              <Input
                                type={showToken ? 'text' : 'password'}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                value={token}
                                onChange={(e) => {
                                  setToken(e.target.value);
                                  setError('');
                                }}
                                className="pl-9 pr-20 transition-colors duration-200 font-mono"
                                style={{
                                  backgroundColor: '#0d1117',
                                  borderColor: error ? '#f85149' : token ? '#3fb950' : '#30363d',
                                  color: '#c9d1d9',
                                }}
                              />
                              {/* Show/hide toggle button */}
                              <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors duration-200 focus-ring"
                                onClick={() => setShowToken(!showToken)}
                                style={{ color: '#8b949e', backgroundColor: showToken ? 'rgba(88, 166, 255, 0.08)' : 'transparent' }}
                              >
                                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{showToken ? 'Hide' : 'Show'}</span>
                              </button>
                            </div>

                            {/* Token preview */}
                            {token && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 px-2"
                              >
                                <div
                                  className="text-[10px] font-mono px-2 py-1 rounded"
                                  style={{ backgroundColor: 'rgba(63, 185, 80, 0.08)', color: '#3fb950' }}
                                >
                                  ghp_{token.slice(4, 8)}...{token.slice(-4)}
                                </div>
                                <span className="text-[10px]" style={{ color: '#8b949e' }}>
                                  Token detected
                                </span>
                              </motion.div>
                            )}
                          </div>

                          {/* Error display */}
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 p-3 rounded-lg"
                              style={{ backgroundColor: 'rgba(248,81,73,0.1)' }}
                            >
                              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#f85149' }} />
                              <p className="text-xs" style={{ color: '#f85149' }}>{error}</p>
                            </motion.div>
                          )}

                          {/* Why do we need this? expandable section */}
                          <div
                            className="border rounded-lg overflow-hidden transition-colors duration-200"
                            style={{ borderColor: '#30363d' }}
                          >
                            <button
                              className="w-full flex items-center justify-between p-3 text-xs transition-colors duration-200 focus-ring"
                              style={{ color: '#8b949e', backgroundColor: 'rgba(13, 17, 23, 0.5)' }}
                              onClick={() => setShowWhyNeeded(!showWhyNeeded)}
                            >
                              <span className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} />
                                Why do we need this?
                              </span>
                              {showWhyNeeded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <AnimatePresence>
                              {showWhyNeeded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-3 space-y-2 text-[11px]" style={{ color: '#8b949e', backgroundColor: 'rgba(13, 17, 23, 0.3)' }}>
                                    <div className="flex items-start gap-2">
                                      <Lock className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#3fb950' }} />
                                      <span>Your token is <strong style={{ color: '#c9d1d9' }}>encrypted</strong> before storage. We never store it in plaintext.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Shield className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#3fb950' }} />
                                      <span>We only request <strong style={{ color: '#c9d1d9' }}>minimum scopes</strong> needed to deploy your projects.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Github className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#3fb950' }} />
                                      <span>You can <strong style={{ color: '#c9d1d9' }}>revoke access</strong> anytime from your GitHub settings.</span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Navigation buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              className="focus-ring gap-1"
                              style={{ borderColor: '#30363d', color: '#8b949e', backgroundColor: 'transparent' }}
                              onClick={() => goToStep(1)}
                            >
                              <ArrowLeft className="w-4 h-4" /> Back
                            </Button>
                            <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                              <Button
                                className="w-full gap-2 focus-ring"
                                style={{
                                  backgroundColor: token ? '#238636' : '#21262d',
                                  color: token ? 'white' : '#484f58',
                                  cursor: token ? 'pointer' : 'not-allowed',
                                }}
                                disabled={!token || validating}
                                onClick={handleValidateToken}
                              >
                                {validating ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    >
                                      <Loader2 className="w-4 h-4" />
                                    </motion.div>
                                    Verifying...
                                  </>
                                ) : (
                                  <><Shield className="w-4 h-4" /> Validate & Connect</>
                                )}
                              </Button>
                            </motion.div>
                          </div>

                          {/* Skip for now */}
                          <div className="text-center">
                            <button
                              className="text-xs transition-colors duration-200 focus-ring rounded px-2 py-1"
                              style={{ color: '#58a6ff' }}
                              onClick={() => setCurrentView('dashboard')}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#79c0ff')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#58a6ff')}
                            >
                              Skip for now →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Validation */}
                {step === 3 && (
                  <motion.div
                    key="validate"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <div className="p-8 text-center">
                      {/* Large animated icon area */}
                      <div className="relative inline-flex items-center justify-center mb-6">
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{ border: '2px solid rgba(88, 166, 255, 0.2)' }}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <div
                          className="w-24 h-24 rounded-full flex items-center justify-center"
                          style={{ background: STEP_GRADIENTS[3] }}
                        >
                          {/* Progress ring animation */}
                          <svg className="w-24 h-24 absolute -rotate-90" viewBox="0 0 96 96">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              fill="none"
                              stroke="#21262d"
                              strokeWidth="6"
                            />
                            <motion.circle
                              cx="48"
                              cy="48"
                              r="40"
                              fill="none"
                              stroke="#58a6ff"
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeDasharray={251.3}
                              initial={{ strokeDashoffset: 251.3 }}
                              animate={{
                                strokeDashoffset: validationSteps.length === 0
                                  ? 251.3
                                  : validationSteps.length === 1
                                  ? 188.5
                                  : validationSteps.length === 2
                                  ? 125.7
                                  : validationSteps.length === 3
                                  ? 62.8
                                  : 0,
                              }}
                              transition={{ duration: 0.6, ease: 'easeInOut' }}
                            />
                          </svg>
                          <div className="relative z-10">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            >
                              <Shield className="w-8 h-8" style={{ color: '#58a6ff' }} />
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold mb-4" style={{ color: '#c9d1d9' }}>
                        Validating Your Connection
                      </h3>

                      {/* Step-by-step validation checklist */}
                      <div className="max-w-xs mx-auto space-y-3 text-left">
                        {validationSteps.map((vs, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 p-2 rounded-lg"
                            style={{ backgroundColor: 'rgba(63, 185, 80, 0.05)' }}
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, delay: 0.3 + i * 0.1 }}
                            >
                              <Check className="w-4 h-4" style={{ color: '#3fb950' }} />
                            </motion.div>
                            <span className="text-xs" style={{ color: '#c9d1d9' }}>
                              {vs.text}
                            </span>
                          </motion.div>
                        ))}
                        {validationSteps.length < 4 && (
                          <div className="flex items-center gap-3 p-2">
                            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#58a6ff', borderTopColor: 'transparent' }} />
                            <span className="text-xs" style={{ color: '#8b949e' }}>
                              {['Connecting to GitHub...', 'Verifying token scopes...', 'Fetching user profile...', 'Encrypting token for storage...'][validationSteps.length] || 'Processing...'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Ready */}
                {step === 4 && (
                  <motion.div
                    key="ready"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <div className="relative p-8 text-center overflow-hidden">
                      {/* Celebration confetti */}
                      {showCelebration && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {confettiParticles.map((p, i) => (
                            <motion.div
                              key={`confetti-${i}`}
                              className={`absolute ${p.shape}`}
                              style={{
                                backgroundColor: p.color,
                                width: p.width,
                                height: p.height,
                                left: `${p.left}%`,
                                top: '-5%',
                              }}
                              initial={{ y: 0, rotate: 0, opacity: 1 }}
                              animate={{
                                y: 450,
                                rotate: p.rotation,
                                opacity: [1, 1, 0],
                              }}
                              transition={{
                                duration: p.duration,
                                delay: p.delay,
                                ease: 'easeOut',
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="relative z-10">
                        {/* Celebration icon with gradient circle */}
                        <motion.div
                          className="relative inline-flex items-center justify-center mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
                        >
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{ border: '3px solid rgba(63, 185, 80, 0.3)' }}
                            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <div
                            className="w-24 h-24 rounded-full flex items-center justify-center"
                            style={{ background: STEP_GRADIENTS[4] }}
                          >
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
                            >
                              <PartyPopper className="w-12 h-12" style={{ color: '#3fb950' }} />
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* User avatar with green ring */}
                        <motion.div
                          className="relative inline-block mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.4 }}
                        >
                          <div
                            className="w-16 h-16 rounded-full p-[3px]"
                            style={{ background: 'linear-gradient(135deg, #3fb950, #58a6ff)' }}
                          >
                            <Avatar className="w-full h-full" style={{ border: '3px solid #161b22' }}>
                              <AvatarImage src={githubUser?.avatar_url} />
                              <AvatarFallback
                                className="text-lg font-bold"
                                style={{ backgroundColor: '#21262d', color: '#c9d1d9' }}
                              >
                                {githubUser?.login?.charAt(0)?.toUpperCase() || <Github className="w-8 h-8" />}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          {/* Green check badge */}
                          <motion.div
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#238636', border: '2px solid #161b22' }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, delay: 0.7 }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        </motion.div>

                        {/* Welcome message */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <h3 className="text-xl font-bold gradient-text mb-1">
                            You&apos;re all set!
                          </h3>
                          {githubUser?.login && (
                            <p className="text-sm" style={{ color: '#8b949e' }}>
                              Welcome, <span style={{ color: '#58a6ff' }}>@{githubUser.login}</span>
                            </p>
                          )}
                        </motion.div>

                        {/* Quick stats */}
                        <motion.div
                          className="mt-6 max-w-xs mx-auto p-4 rounded-xl border text-left space-y-2.5"
                          style={{ backgroundColor: 'rgba(13, 17, 23, 0.5)', borderColor: '#30363d' }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <p className="text-xs font-medium" style={{ color: '#c9d1d9' }}>
                            You now have access to...
                          </p>
                          {[
                            { icon: Bot, text: 'AI Project Builder' },
                            { icon: Github, text: 'GitHub Deployment' },
                            { icon: Globe, text: 'Free Hosting Advisor' },
                            { icon: MessageSquare, text: 'AI Assistant' },
                          ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                              <motion.div
                                key={item.text}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + i * 0.1 }}
                                className="flex items-center gap-2.5"
                              >
                                <Check className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />
                                <Icon className="w-3.5 h-3.5" style={{ color: '#58a6ff' }} />
                                <span className="text-xs" style={{ color: '#c9d1d9' }}>
                                  {item.text}
                                </span>
                              </motion.div>
                            );
                          })}
                        </motion.div>

                        {/* CTA buttons */}
                        <motion.div
                          className="mt-6 space-y-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.0 }}
                        >
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              className="w-full gap-2 h-11 font-semibold"
                              style={{
                                backgroundColor: '#238636',
                                color: 'white',
                                boxShadow: '0 0 20px rgba(35, 134, 54, 0.3), 0 4px 12px rgba(0,0,0,0.3)',
                              }}
                              onClick={() => setCurrentView('builder')}
                            >
                              <Rocket className="w-4 h-4" /> Build Your First Project
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Button
                              variant="outline"
                              className="w-full gap-2 focus-ring"
                              style={{ borderColor: '#30363d', color: '#8b949e' }}
                              onClick={() => setCurrentView('dashboard')}
                            >
                              Go to Dashboard
                            </Button>
                          </motion.div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
