import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Calendar cache table - stores generated ICS files for each group
 */
export const calendarCache = sqliteTable('calendar_cache', {
  group: text('group').primaryKey().notNull(), // e.g., "1.1", "2.1", etc.
  content: text('content').notNull(), // ICS file content
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(), // Unix timestamp for expiration
});

/**
 * Metadata table - stores system-wide metadata like last update time and available groups
 */
export const metadata = sqliteTable('metadata', {
  key: text('key').primaryKey().notNull(), // e.g., "last_update", "available_groups"
  value: text('value').notNull(), // Can be JSON string for complex data
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Typed metadata keys
 */
export const MetadataKeys = {
  LAST_UPDATE: 'last_update',
  SCHEDULES_UPDATED_ON: 'schedules_updated_on',
  SCHEDULES_LATEST_DATE: 'schedules_latest_date',
  AVAILABLE_GROUPS: 'available_groups',
} as const;

export type MetadataKey = (typeof MetadataKeys)[keyof typeof MetadataKeys];
