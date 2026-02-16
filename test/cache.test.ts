import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from '../src/services/cache';
import { YasnoService } from '../src/services/yasno';
import { createMockDb } from './helpers';
import type { Database } from '../src/db';
import type { PlannedOutagesResponse } from '../src/types';

describe('CacheService', () => {
  let mockDb: Database;
  let cacheService: CacheService;

  beforeEach(() => {
    mockDb = createMockDb();
    cacheService = new CacheService(mockDb);
  });

  describe('getCachedICS', () => {
    it('should return null if no cached entry exists', async () => {
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const result = await cacheService.getCachedICS('1.1');
      expect(result).toBeNull();
    });

    it('should return cached content if entry exists and not expired', async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 3600 * 1000); // 1 hour from now

      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve([
                {
                  group: '1.1',
                  content: 'BEGIN:VCALENDAR\nEND:VCALENDAR',
                  createdAt: now,
                  expiresAt,
                },
              ]),
            ),
          })),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const result = await cacheService.getCachedICS('1.1');
      expect(result).toBe('BEGIN:VCALENDAR\nEND:VCALENDAR');
    });

    it('should delete and return null if entry is expired', async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() - 3600 * 1000); // 1 hour ago

      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve([
                {
                  group: '1.1',
                  content: 'BEGIN:VCALENDAR\nEND:VCALENDAR',
                  createdAt: new Date(now.getTime() - 7200 * 1000),
                  expiresAt,
                },
              ]),
            ),
          })),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const mockDelete = vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      }));
      vi.mocked(mockDb.delete).mockReturnValue(mockDelete() as unknown as ReturnType<typeof mockDb.delete>);

      const result = await cacheService.getCachedICS('1.1');
      expect(result).toBeNull();
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('setCachedICS', () => {
    it('should insert ICS content with expiration', async () => {
      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoUpdate: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(mockDb.insert).mockReturnValue(mockInsert() as unknown as ReturnType<typeof mockDb.insert>);

      await cacheService.setCachedICS('1.1', 'BEGIN:VCALENDAR\nEND:VCALENDAR');

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('getLastUpdate', () => {
    it('should return null if no last update exists', async () => {
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const result = await cacheService.getLastUpdate();
      expect(result).toBeNull();
    });

    it('should return last update timestamp', async () => {
      const timestamp = '2026-02-10T10:00:00.000Z';
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve([
                {
                  key: 'last_update',
                  value: timestamp,
                  updatedAt: new Date(),
                },
              ]),
            ),
          })),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const result = await cacheService.getLastUpdate();
      expect(result).toBe(timestamp);
    });
  });

  describe('getAvailableGroups', () => {
    it('should return empty array if no groups cached', async () => {
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const result = await cacheService.getAvailableGroups();
      expect(result).toEqual([]);
    });

    it('should return parsed groups array', async () => {
      const groups = ['1.1', '1.2', '2.1', '2.2'];
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve([
                {
                  key: 'available_groups',
                  value: JSON.stringify(groups),
                  updatedAt: new Date(),
                },
              ]),
            ),
          })),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const result = await cacheService.getAvailableGroups();
      expect(result).toEqual(groups);
    });

    it('should handle invalid JSON gracefully', async () => {
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve([
                {
                  key: 'available_groups',
                  value: 'invalid json',
                  updatedAt: new Date(),
                },
              ]),
            ),
          })),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const result = await cacheService.getAvailableGroups();
      expect(result).toEqual([]);
    });
  });

  describe('setAvailableGroups', () => {
    it('should store groups as JSON string', async () => {
      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoUpdate: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(mockDb.insert).mockReturnValue(mockInsert() as unknown as ReturnType<typeof mockDb.insert>);

      const groups = ['1.1', '1.2', '2.1'];
      await cacheService.setAvailableGroups(groups);

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('regenerateAllCalendars', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('skips regeneration when schedules are unchanged', async () => {
      const latest = '2026-02-10T10:00:00.000Z';

      // Mock Yasno API to return schedules with the same updatedOn
      const mockSchedules = {
        '1.1': {
          today: { slots: [], date: '2026-02-10T00:00:00+02:00', status: 'ScheduleApplies' },
          tomorrow: { slots: [], date: '2026-02-11T00:00:00+02:00', status: 'WaitingForSchedule' },
          updatedOn: latest,
        },
      } as unknown as PlannedOutagesResponse;

      const spyFetch = vi.spyOn(YasnoService.prototype, 'fetchPlannedOutages').mockResolvedValue(mockSchedules as unknown as PlannedOutagesResponse);

      // Mock DB to return stored schedules_updated_on equal to latest
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ key: 'schedules_updated_on', value: latest, updatedAt: new Date() }])),
          })),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const result = await cacheService.regenerateAllCalendars();
      expect(result.skipped).toBe(true);
      expect(mockDb.insert).not.toHaveBeenCalled();

      spyFetch.mockRestore();
    });

    it('persists schedules_updated_on after successful regeneration', async () => {
      const latest = '2026-02-10T11:00:00.000Z';

      // Mock Yasno API to return schedules with a new updatedOn
      const mockSchedules = {
        '1.1': {
          today: { slots: [], date: '2026-02-10T00:00:00+02:00', status: 'ScheduleApplies' },
          tomorrow: { slots: [], date: '2026-02-11T00:00:00+02:00', status: 'WaitingForSchedule' },
          updatedOn: latest,
        },
      } as unknown as PlannedOutagesResponse;

      const spyFetch = vi.spyOn(YasnoService.prototype, 'fetchPlannedOutages').mockResolvedValue(mockSchedules as unknown as PlannedOutagesResponse);

      // Mock DB to return no stored schedules_updated_on so regeneration proceeds
      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as unknown as ReturnType<typeof mockDb.select>);

      const setSchedulesSpy = vi.spyOn(cacheService as unknown as { setSchedulesUpdatedOn: (s: string) => Promise<void> }, 'setSchedulesUpdatedOn');

      const mockInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoUpdate: vi.fn(() => Promise.resolve()),
        })),
      }));
      vi.mocked(mockDb.insert).mockReturnValue(mockInsert() as unknown as ReturnType<typeof mockDb.insert>);

      const result = await cacheService.regenerateAllCalendars();
      expect(result.skipped).not.toBe(true);
      expect(setSchedulesSpy).toHaveBeenCalledWith(latest);

      spyFetch.mockRestore();
    });
  });
});
