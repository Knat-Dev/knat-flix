import { io, type Socket } from 'socket.io-client';
import type { ContainerInfo, BackupJob } from '@arr/shared';

class SystemState {
  containers = $state<ContainerInfo[]>([]);
  backups = $state<BackupJob[]>([]);
  connection = $state<'connected' | 'disconnecting' | 'disconnected'>('disconnected');
  stats = $state<Record<string, { cpu: number; memory: number }>>({});
  hasInitialData = $state(false); // Track if we received initial container data
  socket: Socket | null = null;

  constructor() {
    this.connect();
  }

  connect() {
    // Detect API URL from current hostname or use env var
    let API_URL: string;
    if (import.meta.env.PUBLIC_API_URL) {
      API_URL = import.meta.env.PUBLIC_API_URL;
    } else if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // If we're on stack.domain, use api.domain
      if (hostname.startsWith('stack.')) {
        API_URL = `https://api.${hostname.substring(6)}`;
      } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        API_URL = 'http://localhost:3006';
      } else {
        API_URL = 'http://localhost:3006';
      }
    } else {
      API_URL = 'http://localhost:3006';
    }
    
    this.socket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.connection = 'connected';
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      this.connection = 'disconnected';
      console.log('Disconnected from server');
    });

    this.socket.on('containers:sync', (data: ContainerInfo[]) => {
      this.containers = data;
      if (!this.hasInitialData && data.length > 0) {
        this.hasInitialData = true;
      }
    });

    this.socket.on('stats:tick', (data: Record<string, { cpu: number; memory: number }>) => {
      this.stats = data;
    });

    this.socket.on('backup:progress', (job: BackupJob) => {
      // Update backup in list or add if new
      const index = this.backups.findIndex((b) => b.id === job.id);
      if (index >= 0) {
        this.backups[index] = job;
      } else {
        this.backups = [job, ...this.backups];
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connection = 'disconnected';
    }
  }

  get runningCount() {
    return this.containers.filter((c) => c.state === 'running').length;
  }

  get offlineCount() {
    return this.containers.filter((c) => c.state !== 'running').length;
  }

  getContainerStats(containerId: string) {
    return this.stats[containerId] || { cpu: 0, memory: 0 };
  }
}

export const sys = new SystemState();

