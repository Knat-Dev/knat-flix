import { Hono } from 'hono';
import { createBackup } from '../services/backup.js';
import { db } from '../db/index.js';
import fs from 'fs-extra';
import path from 'path';

const backups = new Hono();

backups.get('/', async (c) => {
  const list = await db
    .selectFrom('backups')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute();
  
  // Transform to match BackupJob schema
  const transformed = list.map((b) => ({
    id: b.id,
    filename: b.filename,
    sizeBytes: b.size_bytes,
    status: 'completed' as const,
    createdAt: b.created_at,
    location: b.location as 'local' | 's3',
    includesMediaConfig: Boolean(b.includes_media_config),
  }));
  
  return c.json(transformed);
});

backups.post('/', async (c) => {
  try {
    const result = await createBackup();
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

backups.get('/:filename/download', async (c) => {
  const filename = c.req.param('filename');
  const filePath = path.join('/data/backups', filename);
  
  if (!(await fs.pathExists(filePath))) {
    return c.json({ error: 'Backup not found' }, 404);
  }
  
  const stats = await fs.stat(filePath);
  const fileBuffer = await fs.readFile(filePath);
  
  c.header('Content-Type', 'application/gzip');
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  c.header('Content-Length', stats.size.toString());
  
  return c.body(fileBuffer);
});

export default backups;

