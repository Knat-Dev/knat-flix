import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import { db } from '../db/index.js';
import { randomUUID } from 'crypto';

export const createBackup = async (): Promise<{ id: string; filename: string }> => {
  const id = randomUUID();
  const filename = `backup-${Date.now()}.tar.gz`;
  const outputPath = `/data/backups/${filename}`;

  // Ensure backups directory exists
  await fs.ensureDir('/data/backups');

  // Create write stream
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('tar', {
    gzip: true,
    zlib: { level: 6 }, // Level 6 = Good balance for Gamer PC
  });

  archive.pipe(output);

  // Add Configs (Mounted at /manage)
  const configRoot = '/manage';
  if (await fs.pathExists(configRoot)) {
    // Exclude heavy media folders if they accidentally exist in config root
    archive.glob(
      '**/*',
      {
        cwd: configRoot,
        ignore: ['**/transcode/**', '**/prometheus/data/**'],
        dot: true,
      },
      { prefix: 'configs' }
    );
  }

  // Add docker-compose.yml if it exists
  const composePath = '/manage/docker-compose.yml';
  if (await fs.pathExists(composePath)) {
    archive.file(composePath, { name: 'docker-compose.yml' });
  }

  // Add .env if it exists
  const envPath = '/manage/.env';
  if (await fs.pathExists(envPath)) {
    archive.file(envPath, { name: '.env' });
  }

  // Generate restore script
  const restoreScript = `#!/bin/bash
# Auto-generated restore script
# Generated at: ${new Date().toISOString()}

set -e

echo "📦 Extracting backup..."
tar -xzf "${filename}" -C .

echo "📋 Restoring configuration..."
if [ -d "configs" ]; then
  echo "Copying configs to current directory..."
  cp -r configs/* .
  rm -rf configs
fi

if [ -f "docker-compose.yml" ]; then
  echo "✅ docker-compose.yml restored"
fi

if [ -f ".env" ]; then
  echo "✅ .env restored"
fi

echo "🎉 Restore complete! Run 'docker compose up -d' to start your stack."
`;

  archive.append(restoreScript, { name: 'restore.sh' });

  return new Promise((resolve, reject) => {
    output.on('close', async () => {
      const stats = await fs.stat(outputPath);
      const sizeBytes = stats.size;

      // Save to DB
      await db
        .insertInto('backups')
        .values({
          id,
          filename,
          size_bytes: sizeBytes,
          created_at: new Date().toISOString(),
          location: 'local',
          includes_media_config: 0,
        })
        .execute();

      resolve({ id, filename });
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.finalize();
  });
};

