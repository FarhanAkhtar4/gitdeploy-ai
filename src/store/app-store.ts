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

  // Keyboard Shortcuts
  keyboardShortcutsOpen: boolean;
  setKeyboardShortcutsOpen: (open: boolean) => void;

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
  user: null,
  setUser: (user) => set({ user }),

  // GitHub
  githubUser: null,
  setGithubUser: (user) => set({ githubUser: user }),
  isGithubConnected: false,
  setIsGithubConnected: (connected) => set({ isGithubConnected: connected }),

  // Projects
  projects: [],
  setProjects: (projects) => set({ projects }),
  selectedProject: null,
  setSelectedProject: (project) => set({ selectedProject: project }),

  // Builder
  builderChat: [],
  addBuilderChat: (message) => set((state) => ({ builderChat: [...state.builderChat, message] })),
  clearBuilderChat: () => set({ builderChat: [] }),
  requirementsCard: null,
  setRequirementsCard: (card) => set({ requirementsCard: card }),
  isBuilding: false,
  setIsBuilding: (building) => set({ isBuilding: building }),
  buildProgress: { current: 0, total: 0, section: '' },
  setBuildProgress: (progress) => set({ buildProgress: progress }),
  generatedFiles: [],
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
  chatMessages: [],
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

  // Keyboard Shortcuts
  keyboardShortcutsOpen: false,
  setKeyboardShortcutsOpen: (open) => set({ keyboardShortcutsOpen: open }),

  // UI
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
