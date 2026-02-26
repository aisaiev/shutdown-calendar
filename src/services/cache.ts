import { YasnoService } from './yasno';
import { generateICS } from './calendar';
import { Database } from '../db';
import { calendarCache, metadata, MetadataKeys } from '../db/schema';
import { eq } from 'drizzle-orm';
import { PlannedOutagesResponse } from '@/types';

export class CacheService {
  constructor(private db: Database) {}

  /**
   * Get cached ICS file for a group
   */
  async getCachedICS(group: string): Promise<string | null> {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    // Get cached entry if it exists and hasn't expired
    const cached = await this.db.select().from(calendarCache).where(eq(calendarCache.group, group)).limit(1);

    if (cached.length === 0) {
      return null;
    }

    const entry = cached[0];
    const expiresAtSeconds = Math.floor(entry.expiresAt.getTime() / 1000);

    // Check if expired
    if (expiresAtSeconds < now) {
      // Delete expired entry
      await this.db.delete(calendarCache).where(eq(calendarCache.group, group));
      return null;
    }

    return entry.content;
  }

  /**
   * Store ICS file in cache
   */
  async setCachedICS(group: string, content: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 86400 * 1000); // 24 hours from now

    // Upsert the cache entry
    await this.db
      .insert(calendarCache)
      .values({
        group,
        content,
        createdAt: now,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: calendarCache.group,
        set: {
          content,
          createdAt: now,
          expiresAt,
        },
      });
  }

  /**
   * Get last update timestamp
   */
  async getLastUpdate(): Promise<string | null> {
    const result = await this.db.select().from(metadata).where(eq(metadata.key, MetadataKeys.LAST_UPDATE)).limit(1);

    return result.length > 0 ? result[0].value : null;
  }

  /**
   * Set last update timestamp
   */
  async setLastUpdate(timestamp: string): Promise<void> {
    await this.db
      .insert(metadata)
      .values({
        key: MetadataKeys.LAST_UPDATE,
        value: timestamp,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: metadata.key,
        set: {
          value: timestamp,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Get stored schedules updatedOn timestamp from Yasno API
   */
  async getSchedulesUpdatedOn(): Promise<string | null> {
    const result = await this.db.select().from(metadata).where(eq(metadata.key, MetadataKeys.SCHEDULES_UPDATED_ON)).limit(1);

    return result.length > 0 ? result[0].value : null;
  }

  /**
   * Set schedules updatedOn timestamp from Yasno API
   */
  async setSchedulesUpdatedOn(timestamp: string): Promise<void> {
    await this.db
      .insert(metadata)
      .values({
        key: MetadataKeys.SCHEDULES_UPDATED_ON,
        value: timestamp,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: metadata.key,
        set: {
          value: timestamp,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Get stored latest schedule date (max of today/tomorrow dates)
   */
  async getSchedulesLatestDate(): Promise<string | null> {
    const result = await this.db.select().from(metadata).where(eq(metadata.key, MetadataKeys.SCHEDULES_LATEST_DATE)).limit(1);

    return result.length ? result[0].value : null;
  }

  /**
   * Set stored latest schedule date
   */
  async setSchedulesLatestDate(date: string): Promise<void> {
    await this.db
      .insert(metadata)
      .values({
        key: MetadataKeys.SCHEDULES_LATEST_DATE,
        value: date,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: metadata.key,
        set: {
          value: date,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Get the latest updatedOn timestamp from all group schedules
   */
  private getLatestUpdatedOn(schedules: PlannedOutagesResponse): string | null {
    const timestamps = Object.values(schedules)
      .map((schedule) => schedule.updatedOn)
      .filter(Boolean);

    if (!timestamps.length) {
      return null;
    }

    // Return the most recent timestamp
    return timestamps.sort().reverse()[0];
  }

  /**
   * Get the latest schedule date across all groups (considers today and tomorrow)
   */
  private getLatestScheduleDate(schedules: PlannedOutagesResponse): string | null {
    const dates = Object.values(schedules)
      .flatMap((schedule) => [schedule.today?.date, schedule.tomorrow?.date])
      .filter(Boolean);

    if (!dates.length) {
      return null;
    }

    // Return the most recent date
    return dates.sort().reverse()[0];
  }

  /**
   * Get list of available groups from cache
   */
  async getAvailableGroups(): Promise<string[]> {
    const result = await this.db.select().from(metadata).where(eq(metadata.key, MetadataKeys.AVAILABLE_GROUPS)).limit(1);

    if (!result.length) {
      return [];
    }

    try {
      return JSON.parse(result[0].value);
    } catch {
      return [];
    }
  }

  /**
   * Store list of available groups in cache
   */
  async setAvailableGroups(groups: string[]): Promise<void> {
    await this.db
      .insert(metadata)
      .values({
        key: MetadataKeys.AVAILABLE_GROUPS,
        value: JSON.stringify(groups),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: metadata.key,
        set: {
          value: JSON.stringify(groups),
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Regenerate all ICS files for all groups
   */
  async regenerateAllCalendars(): Promise<{
    success: number;
    failed: number;
    errors: string[];
    skipped?: boolean;
  }> {
    const yasnoService = new YasnoService();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      // Fetch all schedules once
      const allSchedules = await yasnoService.fetchPlannedOutages();

      // Check if schedules have changed since last update
      const latestUpdatedOn = this.getLatestUpdatedOn(allSchedules);
      const latestScheduleDate = this.getLatestScheduleDate(allSchedules);
      const storedUpdatedOn = await this.getSchedulesUpdatedOn();
      const storedScheduleDate = await this.getSchedulesLatestDate();

      if (latestUpdatedOn && latestScheduleDate && storedUpdatedOn === latestUpdatedOn && storedScheduleDate === latestScheduleDate) {
        // No changes detected, skip regeneration to save D1 writes
        return {
          success: 0,
          failed: 0,
          errors: [],
          skipped: true,
        };
      }

      // Get available groups dynamically from API response and sort naturally
      const availableGroups = this.sortGroupIds(Object.keys(allSchedules));

      // Store the list of available groups
      await this.setAvailableGroups(availableGroups);

      // Generate and cache ICS for each group
      for (const group of availableGroups) {
        try {
          const schedule = allSchedules[group];

          if (!schedule) {
            results.failed++;
            results.errors.push(`Group ${group}: Schedule not found`);
            continue;
          }

          const icsContent = generateICS(group, schedule);
          await this.setCachedICS(group, icsContent);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Group ${group}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update timestamps
      await this.setLastUpdate(new Date().toISOString());
      if (latestUpdatedOn) {
        await this.setSchedulesUpdatedOn(latestUpdatedOn);
      }
      if (latestScheduleDate) {
        await this.setSchedulesLatestDate(latestScheduleDate);
      }
    } catch (error) {
      results.errors.push(`Failed to fetch schedules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  /**
   * Natural sort for group IDs (e.g., 1.1, 1.2, 2.1, 10.1)
   */
  private sortGroupIds(ids: string[]): string[] {
    return ids.sort((a, b) => {
      const [majorA, minorA] = a.split('.').map(Number);
      const [majorB, minorB] = b.split('.').map(Number);

      if (majorA !== majorB) {
        return majorA - majorB;
      }
      return minorA - minorB;
    });
  }
}
