import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/2bd4ed7ae478636b69ecef3086425ea011e80206ffc7cbddae07ca62f11b64c5.sqlite',
  },
});
