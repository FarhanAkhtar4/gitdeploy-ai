import { create } from 'zustand';

export type AppView = 'dashboard' | 'onboarding' | 'builder' | 'deploy' | 'hosting' | 'chat' | 'settings';

export type ProjectStatus = 'not_deployed' | 'building' | 'deploying' | 'live' | 'failed' | 'queued';

export interface Project {
  id: string;
  name: string;
  description: string;
  githubRepoUrl: string | null;
  liveUrl: string | null;
  framework: string;
  stackJson: string;
  defaultBranch: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  files: ProjectFile[];
  deployments: Deployment[];
}

export interface ProjectFile {
  id: string;
  filePath: string;
  content: string;
  githubSha: string | null;
  lastPushedAt: string | null;
  sizeBytes: number;
}

export interface Deployment {
  id: string;
  triggeredBy: string;
  githubRunId: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  logSummary: string | null;
  errorMessage: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  public_repos: number;
  plan: { name: string };
  scopes: string[];
}

export interface Notification {
  id: string;
  type: 'deployment' | 'build' | 'schedule' | 'workflow' | 'info';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  icon?: string;
}

export interface SelectedFile {
  path: string;
  content: string;
  purpose: string;
  sizeBytes?: number;
}

export interface RequirementsCard {
  projectName: string;
  type: string;
  frontend: string;
  backend: string;
  database: string;
  auth: string;
  keyFeatures: string[];
  freeHosting: string;
  estimatedFiles: number;
  estimatedDirs: number;
}

interface AppState {
  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // User
  user: { id: string; email: string; name: string; plan: string } | null;
  setUser: (user: AppState['user']) => void;

  // GitHub
  githubUser: GitHubUser | null;
  setGithubUser: (user: GitHubUser | null) => void;
  isGithubConnected: boolean;
  setIsGithubConnected: (connected: boolean) => void;

  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;

  // Builder
  builderChat: ChatMessage[];
  addBuilderChat: (message: ChatMessage) => void;
  clearBuilderChat: () => void;
  requirementsCard: RequirementsCard | null;
  setRequirementsCard: (card: RequirementsCard | null) => void;
  isBuilding: boolean;
  setIsBuilding: (building: boolean) => void;
  buildProgress: { current: number; total: number; section: string };
  setBuildProgress: (progress: AppState['buildProgress']) => void;
  generatedFiles: Array<{ path: string; content: string; purpose: string }>;
  setGeneratedFiles: (files: AppState['generatedFiles']) => void;
  fileTreeApproved: boolean;
  setFileTreeApproved: (approved: boolean) => void;

  // Deployment
  isDeploying: boolean;
  setIsDeploying: (deploying: boolean) => void;
  deploymentLogs: Array<{ timestamp: string; message: string; type: 'info' | 'error' | 'success' | 'warning' }>;
  addDeploymentLog: (log: AppState['deploymentLogs'][0]) => void;
  clearDeploymentLogs: () => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Keyboard Shortcuts
  keyboardShortcutsOpen: boolean;
  setKeyboardShortcutsOpen: (open: boolean) => void;

  // File Viewer
  selectedFile: SelectedFile | null;
  setSelectedFile: (file: SelectedFile | null) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  // User
  user: { id: 'demo-user-1', email: 'demo@gitdeploy.ai', name: 'Alex Chen', plan: 'pro' },
  setUser: (user) => set({ user }),

  // GitHub
  githubUser: { login: 'alexchen', avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4', public_repos: 12, plan: { name: 'pro' }, scopes: ['repo', 'workflow'] },
  setGithubUser: (user) => set({ githubUser: user }),
  isGithubConnected: true,
  setIsGithubConnected: (connected) => set({ isGithubConnected: connected }),

  // Projects
  projects: [
    {
      id: 'proj-1',
      name: 'Invoice Manager',
      description: 'Full-stack invoice management with PDF export',
      githubRepoUrl: 'https://github.com/alexchen/invoice-manager',
      liveUrl: 'https://invoice-mgr.vercel.app',
      framework: 'nextjs',
      stackJson: '{"frontend":"Next.js","backend":"Express","database":"PostgreSQL"}',
      defaultBranch: 'main',
      status: 'live' as ProjectStatus,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      files: [],
      deployments: [
        { id: 'dep-1', triggeredBy: 'Manual', githubRunId: 'run-101', status: 'completed', startedAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date(Date.now() - 86400000 + 154000).toISOString(), durationMs: 154000, logSummary: 'Build completed. 18 files uploaded. All checks passed.', errorMessage: null }
      ],
    },
    {
      id: 'proj-2',
      name: 'Task Manager',
      description: 'Kanban-style task management with real-time sync',
      githubRepoUrl: 'https://github.com/alexchen/task-manager',
      liveUrl: null,
      framework: 'react',
      stackJson: '{"frontend":"React","backend":"Node.js","database":"MongoDB"}',
      defaultBranch: 'main',
      status: 'building' as ProjectStatus,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      files: [],
      deployments: [],
    },
    {
      id: 'proj-3',
      name: 'Analytics Dashboard',
      description: 'Real-time analytics with Chart.js and WebSocket',
      githubRepoUrl: null,
      liveUrl: null,
      framework: 'nextjs',
      stackJson: '{"frontend":"Next.js","backend":"FastAPI","database":"Supabase"}',
      defaultBranch: 'main',
      status: 'not_deployed' as ProjectStatus,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      files: [],
      deployments: [],
    },
  ],
  setProjects: (projects) => set({ projects }),
  selectedProject: {
    id: 'proj-1',
    name: 'Invoice Manager',
    description: 'Full-stack invoice management with PDF export',
    githubRepoUrl: 'https://github.com/alexchen/invoice-manager',
    liveUrl: 'https://invoice-mgr.vercel.app',
    framework: 'nextjs',
    stackJson: '{"frontend":"Next.js","backend":"Express","database":"PostgreSQL"}',
    defaultBranch: 'main',
    status: 'live' as ProjectStatus,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    files: [],
    deployments: [
      { id: 'dep-1', triggeredBy: 'Manual', githubRunId: 'run-101', status: 'completed', startedAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date(Date.now() - 86400000 + 154000).toISOString(), durationMs: 154000, logSummary: 'Build completed. 18 files uploaded. All checks passed.', errorMessage: null }
    ],
  },
  setSelectedProject: (project) => set({ selectedProject: project }),

  // Builder
  builderChat: [
    { id: 'builder-1', role: 'user' as const, content: 'Build me a SaaS invoice management app with Stripe integration', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'builder-2', role: 'assistant' as const, content: 'I\'ll help you build a SaaS invoice management app! Here\'s what I\'m planning:\n\n**Project Name:** Invoice Manager\n**Type:** SaaS\n**Frontend:** Next.js with Tailwind CSS\n**Backend:** Node.js/Express\n**Database:** PostgreSQL with Prisma\n**Auth:** NextAuth.js\n**Key Features:** Invoice CRUD, Stripe payment integration, PDF export, client portal, recurring billing\n**Free Hosting:** Vercel + Railway + Supabase\n**Estimated Files:** 22 files across 8 directories\n\nWould you like me to proceed with this plan?', timestamp: new Date(Date.now() - 3580000).toISOString() },
  ],
  addBuilderChat: (message) => set((state) => ({ builderChat: [...state.builderChat, message] })),
  clearBuilderChat: () => set({ builderChat: [] }),
  requirementsCard: null,
  setRequirementsCard: (card) => set({ requirementsCard: card }),
  isBuilding: false,
  setIsBuilding: (building) => set({ isBuilding: building }),
  buildProgress: { current: 4, total: 22, section: 'Building API routes' },
  setBuildProgress: (progress) => set({ buildProgress: progress }),
  generatedFiles: [
    { path: 'src/app/page.tsx', content: 'export default function Home() { return <Dashboard />; }', purpose: 'Main entry page' },
    { path: 'src/lib/stripe.ts', content: 'import Stripe from "stripe";\nexport const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);', purpose: 'Stripe client initialization' },
    { path: 'prisma/schema.prisma', content: 'model Invoice { id String @id @default(cuid()) ... }', purpose: 'Database schema' },
    { path: 'src/app/api/invoices/route.ts', content: 'export async function GET() { ... }', purpose: 'Invoice API endpoint' },
  ],
  setGeneratedFiles: (files) => set({ generatedFiles: files }),
  fileTreeApproved: false,
  setFileTreeApproved: (approved) => set({ fileTreeApproved: approved }),

  // Deployment
  isDeploying: false,
  setIsDeploying: (deploying) => set({ isDeploying: deploying }),
  deploymentLogs: [],
  addDeploymentLog: (log) => set((state) => ({ deploymentLogs: [...state.deploymentLogs, log] })),
  clearDeploymentLogs: () => set({ deploymentLogs: [] }),

  // Chat
  chatMessages: [
    { id: 'chat-1', role: 'user' as const, content: 'How do I set up CI/CD for my Next.js project?', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'chat-2', role: 'assistant' as const, content: 'Great question! Here\'s how to set up CI/CD for Next.js:\n\n1. **Create `.github/workflows/deploy.yml`** in your repo\n2. Add this workflow that triggers on push to main:\n   - Installs dependencies with `npm ci`\n   - Runs linting and tests\n   - Builds the project\n   - Deploys to Vercel\n\n3. **Add secrets** in GitHub Settings → Secrets:\n   - `VERCEL_TOKEN` - your Vercel deployment token\n   - `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`\n\nWould you like me to generate the complete workflow file?', timestamp: new Date(Date.now() - 7180000).toISOString() },
  ],
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),

  // Notifications
  notifications: [
    {
      id: 'n1',
      type: 'deployment',
      title: 'Deployment completed',
      description: 'my-project deployed successfully to GitHub',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      read: false,
    },
    {
      id: 'n2',
      type: 'build',
      title: 'Build ready for review',
      description: 'Invoice Manager has 18 files generated and ready',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      read: false,
    },
    {
      id: 'n3',
      type: 'schedule',
      title: 'Scheduled deployment upcoming',
      description: 'Task Manager scheduled deploy in 2 hours',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
    {
      id: 'n4',
      type: 'workflow',
      title: 'New workflow suggestion',
      description: 'AI suggests adding CI/CD workflow for your project',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
    },
  ],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { ...notification, id: `n${Date.now()}`, read: false },
        ...state.notifications,
      ],
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  // Command Palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Keyboard Shortcuts
  keyboardShortcutsOpen: false,
  setKeyboardShortcutsOpen: (open) => set({ keyboardShortcutsOpen: open }),

  // File Viewer
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),

  // Theme
  theme: 'dark' as 'dark' | 'light',
  setTheme: (theme) => set({ theme }),

  // UI
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
