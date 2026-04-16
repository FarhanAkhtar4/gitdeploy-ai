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
  const { currentView, user, isGithubConnected, sidebarOpen } = useAppStore();

  const renderView = () => {
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
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop: always visible, mobile: sheet */}
        <SidebarNav />

        {/* Content */}
        <main className="flex-1 overflow-y-auto min-w-0" style={{ backgroundColor: '#0d1117' }}>
          <div className="p-4 md:p-6 pb-24 md:pb-6">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Sticky Footer */}
      <footer
        className="mt-auto border-t px-4 md:px-6 py-3"
        style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3fb950' }} />
            <p className="text-xs" style={{ color: '#484f58' }}>
              GitDeploy AI — Build any project with AI, deploy to GitHub, host for free
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px]" style={{ color: '#484f58' }}>
              Powered by z-ai-web-dev-sdk
            </span>
            <span className="text-[10px]" style={{ color: '#484f58' }}>
              © 2025 GitDeploy AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
