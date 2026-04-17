'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore, type AppView } from '@/store/app-store';
import {
  Plus,
  Hammer,
  Rocket,
  MessageCircle,
  Globe,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FABAction {
  icon: React.ElementType;
  label: string;
  view: AppView;
  color: string;
  shortcut: string;
}

const ACTIONS: FABAction[] = [
  { icon: Hammer, label: 'New Project', view: 'builder', color: '#58a6ff', shortcut: '⌘N' },
  { icon: Rocket, label: 'Quick Deploy', view: 'deploy', color: '#3fb950', shortcut: '⌘3' },
  { icon: MessageCircle, label: 'Ask AI', view: 'chat', color: '#a371f7', shortcut: '⌘5' },
  { icon: Globe, label: 'View Hosting', view: 'hosting', color: '#e3b341', shortcut: '⌘4' },
];

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { setCurrentView } = useAppStore();

  // Show FAB only when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAction = (view: AppView) => {
    setCurrentView(view);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-6 z-30"
        >
          {/* Action Items */}
          <AnimatePresence>
            {isOpen && (
              <motion.div className="flex flex-col gap-2 mb-3">
                {ACTIONS.map((action, idx) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.8 }}
                    transition={{ delay: idx * 0.05, duration: 0.15 }}
                    className="flex items-center justify-end gap-2"
                  >
                    <div
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: '#161b22',
                        color: '#c9d1d9',
                        border: '1px solid #30363d',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      {action.label}
                      <span className="ml-1.5 text-[9px]" style={{ color: '#484f58' }}>{action.shortcut}</span>
                    </div>
                    <button
                      onClick={() => handleAction(action.view)}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{
                        backgroundColor: `${action.color}20`,
                        color: action.color,
                        border: `1px solid ${action.color}40`,
                        boxShadow: `0 2px 12px ${action.color}30`,
                      }}
                    >
                      <action.icon className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-shadow"
            style={{
              backgroundColor: isOpen ? '#21262d' : '#58a6ff',
              color: isOpen ? '#c9d1d9' : 'white',
              border: isOpen ? '1px solid #30363d' : '1px solid rgba(88,166,255,0.5)',
              boxShadow: isOpen ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 16px rgba(88,166,255,0.3)',
            }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
