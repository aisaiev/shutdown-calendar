import { vi } from 'vitest';
import type { Database } from '../src/db';

/**
 * Create a mock Drizzle database for testing
 */
export function createMockDb(): Database {
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => {
        return {
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        };
      }),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  } as unknown as Database;
}

/**
 * Mock data for testing
 */
export const mockScheduleData = {
  '1.1': {
    today: {
      slots: [
        { start: 0, end: 150, type: 'NotPlanned' as const },
        { start: 150, end: 390, type: 'Definite' as const },
        { start: 390, end: 780, type: 'NotPlanned' as const },
        { start: 780, end: 1020, type: 'Definite' as const },
        { start: 1020, end: 1440, type: 'NotPlanned' as const },
      ],
      date: '2026-02-10T00:00:00+02:00',
      status: 'ScheduleApplies' as const,
    },
    tomorrow: {
      slots: [],
      date: '2026-02-11T00:00:00+02:00',
      status: 'WaitingForSchedule' as const,
    },
    updatedOn: '2026-02-10T10:00:00+00:00',
  },
  '1.2': {
    today: {
      slots: [
        { start: 0, end: 360, type: 'NotPlanned' as const },
        { start: 360, end: 600, type: 'Definite' as const },
        { start: 600, end: 1440, type: 'NotPlanned' as const },
      ],
      date: '2026-02-10T00:00:00+02:00',
      status: 'ScheduleApplies' as const,
    },
    tomorrow: {
      slots: [],
      date: '2026-02-11T00:00:00+02:00',
      status: 'WaitingForSchedule' as const,
    },
    updatedOn: '2026-02-10T10:00:00+00:00',
  },
};

export const mockEmergencyScheduleData = {
  '1.1': {
    today: {
      slots: [],
      date: '2026-02-10T00:00:00+02:00',
      status: 'EmergencyShutdowns' as const,
    },
    tomorrow: {
      slots: [],
      date: '2026-02-11T00:00:00+02:00',
      status: 'EmergencyShutdowns' as const,
    },
    updatedOn: '2026-02-10T10:00:00+00:00',
  },
};
