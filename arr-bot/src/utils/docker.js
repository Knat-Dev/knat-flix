import Dockerode from 'dockerode';

const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

/**
 * Get list of all containers with their status
 */
export async function getContainers() {
  const containers = await docker.listContainers({ all: true });

  return containers.map((container) => ({
    id: container.Id.substring(0, 12),
    name: container.Names[0]?.replace(/^\//, '') || 'unknown',
    image: container.Image,
    state: container.State,
    status: container.Status,
    created: new Date(container.Created * 1000),
  }));
}

/**
 * Get container by name
 */
export async function getContainer(name) {
  const containers = await getContainers();
  return containers.find((c) => c.name === name);
}

/**
 * Format uptime from container status string
 */
export function formatStatus(status) {
  return status || 'Unknown';
}

/**
 * Get status emoji based on container state
 */
export function getStateEmoji(state) {
  switch (state?.toLowerCase()) {
    case 'running':
      return '🟢';
    case 'exited':
      return '🔴';
    case 'paused':
      return '🟡';
    case 'restarting':
      return '🔄';
    default:
      return '⚪';
  }
}

