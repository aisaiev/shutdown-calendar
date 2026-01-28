import { YasnoService } from './yasno';
import { generateICS } from './calendar';

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
   * Get list of available groups from cache
   */
  async getAvailableGroups(): Promise<string[]> {
    const groupsJson = await this.kv.get('available_groups');
    if (!groupsJson) {
      return [];
    }
    try {
      return JSON.parse(groupsJson);
    } catch {
      return [];
    }
  }

  /**
   * Store list of available groups in cache
   */
  async setAvailableGroups(groups: string[]): Promise<void> {
    await this.kv.put('available_groups', JSON.stringify(groups));
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
