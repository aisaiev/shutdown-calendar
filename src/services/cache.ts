import { YasnoService } from './yasno';
import { generateICS } from './calendar';

const ALL_GROUPS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', '5.1', '5.2', '6.1', '6.2'];

export class CacheService {
  constructor(private kv: KVNamespace) {}

  /**
   * Get cached ICS file for a group
   */
  async getCachedICS(group: string): Promise<string | null> {
    const key = `ics:${group}`;
    return await this.kv.get(key);
  }

  /**
   * Store ICS file in cache
   */
  async setCachedICS(group: string, content: string): Promise<void> {
    const key = `ics:${group}`;
    // Cache for 24 hours
    await this.kv.put(key, content, {
      expirationTtl: 86400,
    });
  }

  /**
   * Get last update timestamp
   */
  async getLastUpdate(): Promise<string | null> {
    return await this.kv.get('last_update');
  }

  /**
   * Set last update timestamp
   */
  async setLastUpdate(timestamp: string): Promise<void> {
    await this.kv.put('last_update', timestamp);
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

      // Generate and cache ICS for each group
      for (const group of ALL_GROUPS) {
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
}
