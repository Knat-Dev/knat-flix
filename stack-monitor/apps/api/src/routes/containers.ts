import { Hono } from 'hono';
import { getContainers, restartContainer, getContainerStats } from '../services/docker.js';

const containers = new Hono();

containers.get('/', async (c) => {
  const list = await getContainers();
  return c.json(list);
});

containers.get('/:id/stats', async (c) => {
  const id = c.req.param('id');
  const stats = await getContainerStats(id);
  if (!stats) {
    return c.json({ error: 'Container not found or stats unavailable' }, 404);
  }
  return c.json(stats);
});

containers.post('/:id/restart', async (c) => {
  const id = c.req.param('id');
  try {
    await restartContainer(id);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default containers;

