import type { Street, House, AddressGroup } from '../types';

const YASNO_API_BASE = 'https://app.yasno.ua/api/blackout-service/public/shutdowns';
const REGION_ID = '25';
const DSO_ID = '902';

export class YasnoAddressService {
  /**
   * Search for streets by query
   */
  async searchStreets(query: string): Promise<Street[]> {
    const url = `${YASNO_API_BASE}/addresses/v2/streets?regionId=${REGION_ID}&query=${encodeURIComponent(query)}&dsoId=${DSO_ID}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search streets: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as Street[];
      return data;
    } catch (error) {
      console.error('Error searching streets:', error);
      throw error;
    }
  }

  /**
   * Search for houses by street ID and query
   */
  async searchHouses(streetId: number, query: string): Promise<House[]> {
    const url = `${YASNO_API_BASE}/addresses/v2/houses?regionId=${REGION_ID}&streetId=${streetId}&query=${encodeURIComponent(query)}&dsoId=${DSO_ID}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search houses: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as House[];
      return data;
    } catch (error) {
      console.error('Error searching houses:', error);
      throw error;
    }
  }

  /**
   * Get group by street ID and house ID
   */
  async getGroup(streetId: number, houseId: number): Promise<AddressGroup> {
    const url = `${YASNO_API_BASE}/addresses/v2/group?regionId=${REGION_ID}&streetId=${streetId}&houseId=${houseId}&dsoId=${DSO_ID}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get group: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as AddressGroup;
      return data;
    } catch (error) {
      console.error('Error getting group:', error);
      throw error;
    }
  }
}
