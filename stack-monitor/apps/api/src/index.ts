import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { initDB } from './db/index.js';
import { getContainers, getContainerStats } from './services/docker.js';
import containers from './routes/containers.js';
import backups from './routes/backups.js';
import Docker from 'dockerode';

const app = new Hono();

app.use('/*', cors({
  origin: (origin, c) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return '*';
    // Allow localhost for development
    if (origin.includes('localhost')) return origin;
    // Allow the stack domain (PWA)
    if (origin.includes('stack.')) return origin;
    // Allow the API domain itself
    if (origin.includes('api.')) return origin;
    return null;
  },
  credentials: true,
}));

// Routes
app.route('/api/containers', containers);
app.route('/api/backups', backups);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Create HTTP server
const server = createServer(async (req, res) => {
  // Read request body if present
  let body: Uint8Array | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    body = new Uint8Array(Buffer.concat(chunks));
  }

  // Convert Node.js request to Web API Request
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost';
  const url = `${protocol}://${host}${req.url}`;
  
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: body,
  });

  const response = await app.fetch(request);
  
  // Copy response headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.statusCode = response.status;
  
  // Stream response body
  if (response.body) {
    const reader = response.body.getReader();
    const pump = async () => {
      try {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(Buffer.from(value));
        pump();
      } catch (error) {
        console.error('Error streaming response:', error);
        res.end();
      }
    };
    pump();
  } else {
    res.end();
  }
});

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      // Allow localhost for development
      if (origin.includes('localhost')) return callback(null, true);
      // Allow the stack domain (PWA)
      if (origin.includes('stack.')) return callback(null, true);
      // Allow the API domain itself
      if (origin.includes('api.')) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize database
await initDB();

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial container list
  getContainers().then((containers) => {
    socket.emit('containers:sync', containers);
  });

  // Handle log subscriptions
  socket.on('logs:subscribe', (containerId: string) => {
    // TODO: Implement log streaming
    console.log('Log subscription requested for:', containerId);
  });

  socket.on('logs:unsubscribe', (containerId: string) => {
    // TODO: Implement log unsubscription
    console.log('Log unsubscription requested for:', containerId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Periodic stats updates (every 2 seconds)
const statsInterval = setInterval(async () => {
  try {
    const containers = await getContainers();
    const statsMap: Record<string, { cpu: number; memory: number }> = {};

    // Get stats for running containers only
    const runningContainers = containers.filter((c) => c.state === 'running');
    
    await Promise.all(
      runningContainers.map(async (container) => {
        const stats = await getContainerStats(container.id);
        if (stats) {
          statsMap[container.id] = stats;
        }
      })
    );

    io.emit('stats:tick', statsMap);
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}, 2000);

// Watch for Docker events and sync containers
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

try {
  const stream = await docker.getEvents({});
  stream.on('data', async () => {
    // On any Docker event, sync containers to all clients
    try {
      const containers = await getContainers();
      io.emit('containers:sync', containers);
    } catch (error) {
      console.error('Error syncing containers after event:', error);
    }
  });
  stream.on('error', (err) => {
    console.error('Docker event stream error:', err);
  });
} catch (error) {
  console.error('Error setting up Docker event stream:', error);
}

// Start server
const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Brain is running on ${PORT}`);
});

// Export type for Frontend RPC
export type AppType = typeof app;

