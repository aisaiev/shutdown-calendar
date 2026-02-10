import { YasnoService } from './yasno';
import { generateICS } from './calendar';
import { Database } from '../db';
import { calendarCache, metadata } from '../db/schema';
import { eq } from 'drizzle-orm';

export class CacheService {
  constructor(private db: Database) {}

  /**
   * Get cached ICS file for a group
   */
  async getCachedICS(group: string): Promise<string | null> {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    // Get cached entry if it exists and hasn't expired
    const cached = await this.db
      .select()
      .from(calendarCache)
      .where(eq(calendarCache.group, group))
      .limit(1);

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
    const result = await this.db
      .select()
      .from(metadata)
      .where(eq(metadata.key, 'last_update'))
      .limit(1);

    return result.length > 0 ? result[0].value : null;
  }

  /**
   * Set last update timestamp
   */
  async setLastUpdate(timestamp: string): Promise<void> {
    await this.db
      .insert(metadata)
      .values({
        key: 'last_update',
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
   * Get list of available groups from cache
   */
  async getAvailableGroups(): Promise<string[]> {
    const result = await this.db
      .select()
      .from(metadata)
      .where(eq(metadata.key, 'available_groups'))
      .limit(1);

    if (result.length === 0) {
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
        key: 'available_groups',
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

      // Update last update timestamp
      await this.setLastUpdate(new Date().toISOString());
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
