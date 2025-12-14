import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import fs from 'fs-extra';

interface DB {
  backups: {
    id: string;
    filename: string;
    size_bytes: number;
    created_at: string;
    location: string;
    includes_media_config: number; // SQLite uses 0/1 for boolean
  };
  settings: {
    key: string;
    value: string;
  };
}

fs.ensureDirSync('/data');

export const db = new Kysely<DB>({
  dialect: new SqliteDialect({
    database: new Database('/data/stack.db'),
  }),
});

// Auto-migration
export const initDB = async () => {
  await db.schema
    .createTable('backups')
    .ifNotExists()
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('filename', 'text', (c) => c.notNull())
    .addColumn('size_bytes', 'integer', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('location', 'text', (c) => c.notNull())
    .addColumn('includes_media_config', 'integer', (c) => c.notNull().defaultTo(0))
    .execute();

  await db.schema
    .createTable('settings')
    .ifNotExists()
    .addColumn('key', 'text', (c) => c.primaryKey())
    .addColumn('value', 'text', (c) => c.notNull())
    .execute();
};

