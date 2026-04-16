'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { SidebarNav } from '@/components/sidebar-nav';
import { DashboardView } from '@/components/dashboard-view';
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { BuilderView } from '@/components/builder-view';
import { DeployView } from '@/components/deploy-view';
import { HostingView } from '@/components/hosting-view';
import { ChatView } from '@/components/chat-view';
import { SettingsView } from '@/components/settings-view';

export default function GitDeployAI() {
  const { currentView, user, isGithubConnected } = useAppStore();

  // Auto-redirect to onboarding if no user or GitHub not connected
  useEffect(() => {
    if (!user && currentView !== 'onboarding') {
      // Don't override if already on onboarding
    }
  }, [user, currentView]);

  const renderView = () => {
    // If no user and not on onboarding, show onboarding
    if (!user && currentView !== 'onboarding') {
      // Show dashboard with onboarding prompt
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'onboarding':
        return <OnboardingWizard />;
      case 'builder':
        return <BuilderView />;
      case 'deploy':
        return <DeployView />;
      case 'hosting':
        return <HostingView />;
      case 'chat':
        return <ChatView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0d1117' }}>
      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <SidebarNav />

        {/* Content */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#0d1117' }}>
          <div className="p-6">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Sticky Footer */}
      <footer
        className="mt-auto border-t px-6 py-3"
        style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: '#484f58' }}>
            GitDeploy AI — Build any project with AI, deploy to GitHub, host for free
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: '#484f58' }}>
              Powered by z-ai-web-dev-sdk
            </span>
            <span className="text-xs" style={{ color: '#484f58' }}>
              © 2025 GitDeploy AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
