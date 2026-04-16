import { Server } from 'socket.io';

const PORT = 3003;

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

interface DeployLog {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

interface BuildProgress {
  current: number;
  total: number;
  section: string;
}

// Store active deployment states
const activeDeployments = new Map<string, {
  logs: DeployLog[];
  progress: BuildProgress;
  status: string;
}>();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join a deployment room
  socket.on('join-deployment', (deploymentId: string) => {
    socket.join(`deployment-${deploymentId}`);
    const state = activeDeployments.get(deploymentId);
    if (state) {
      socket.emit('deployment-state', state);
    }
  });

  // Leave a deployment room
  socket.on('leave-deployment', (deploymentId: string) => {
    socket.leave(`deployment-${deploymentId}`);
  });

  // Receive deployment log
  socket.on('deploy-log', (data: { deploymentId: string; log: DeployLog }) => {
    const { deploymentId, log } = data;
    if (!activeDeployments.has(deploymentId)) {
      activeDeployments.set(deploymentId, { logs: [], progress: { current: 0, total: 0, section: '' }, status: 'in_progress' });
    }
    const state = activeDeployments.get(deploymentId)!;
    state.logs.push(log);
    io.to(`deployment-${deploymentId}`).emit('deploy-log', log);
  });

  // Receive build progress
  socket.on('build-progress', (data: { deploymentId: string; progress: BuildProgress }) => {
    const { deploymentId, progress } = data;
    if (!activeDeployments.has(deploymentId)) {
      activeDeployments.set(deploymentId, { logs: [], progress, status: 'in_progress' });
    }
    const state = activeDeployments.get(deploymentId)!;
    state.progress = progress;
    io.to(`deployment-${deploymentId}`).emit('build-progress', progress);
  });

  // Deployment status update
  socket.on('deploy-status', (data: { deploymentId: string; status: string }) => {
    const { deploymentId, status } = data;
    if (!activeDeployments.has(deploymentId)) {
      activeDeployments.set(deploymentId, { logs: [], progress: { current: 0, total: 0, section: '' }, status });
    }
    activeDeployments.get(deploymentId)!.status = status;
    io.to(`deployment-${deploymentId}`).emit('deploy-status', status);
  });

  // Chat message relay
  socket.on('chat-message', (data: { roomId: string; message: unknown }) => {
    io.to(data.roomId).emit('chat-message', data.message);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

console.log(`🚀 Deploy service (Socket.io) running on port ${PORT}`);
