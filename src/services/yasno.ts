import type { PlannedOutagesResponse } from '../types';

const YASNO_API_BASE = 'https://app.yasno.ua/api/blackout-service/public/shutdowns';
const REGION_ID = '25';
const DSO_ID = '902';

export class YasnoService {
  /**
   * Fetch planned outages from Yasno API
   */
  async fetchPlannedOutages(): Promise<PlannedOutagesResponse> {
    const url = `${YASNO_API_BASE}/regions/${REGION_ID}/dsos/${DSO_ID}/planned-outages`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch outages: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as PlannedOutagesResponse;
      return data;
    } catch (error) {
      console.error('Error fetching planned outages:', error);
      throw error;
    }
  }

  /**
   * Get schedule for a specific group
   */
  async getGroupSchedule(group: string): Promise<PlannedOutagesResponse[string] | null> {
    const allOutages = await this.fetchPlannedOutages();
    return allOutages[group] || null;
  }

  /**
   * Get all available groups
   */
  async getAvailableGroups(): Promise<string[]> {
    const allOutages = await this.fetchPlannedOutages();
    return Object.keys(allOutages).sort();
  }
}
