import { defineConfig } from 'drizzle-kit';
import path from 'path';
import fs from 'fs';

function resolveLocalSqlite(): string {
  const baseDir = path.join('.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');

  try {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    const sqliteFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith('.sqlite'))
      .map((e) => e.name)
      .sort();

    if (sqliteFiles.length > 0) {
      return path.join(baseDir, sqliteFiles[0]);
    } else {
      throw new Error(`No .sqlite files found in ${baseDir}. Make sure to run "npm run db:migrate" first.`);
    }
  } catch {
    throw new Error(`No .sqlite files found in ${baseDir}. Make sure to run "npm run db:migrate" first.`);
  }
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: resolveLocalSqlite(),
  },
});
