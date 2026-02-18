import { describe, it, expect, vi } from 'vitest';
import { generateICS } from '../src/services/calendar';
import type { GroupSchedule } from '../src/types';

describe('Calendar Generation', () => {
  it('should generate valid ICS content for a group with outages', () => {
    const schedule: GroupSchedule = {
      today: {
        slots: [
          { start: 0, end: 150, type: 'NotPlanned' },
          { start: 150, end: 390, type: 'Definite' },
          { start: 390, end: 1440, type: 'NotPlanned' },
        ],
        date: '2026-02-10T00:00:00+02:00',
        status: 'ScheduleApplies',
      },
      tomorrow: {
        slots: [],
        date: '2026-02-11T00:00:00+02:00',
        status: 'WaitingForSchedule',
      },
      updatedOn: '2026-02-10T10:00:00+00:00',
    };

    const ics = generateICS('1.1', schedule);

    // Check ICS structure
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//aisaiev.net//Electricity Outages//EN');
    expect(ics).toContain('X-WR-CALNAME:Відключення електроенергії');
    expect(ics).toContain('X-WR-CALDESC:Календар планових відключень електроенергії для черги 1.1');

    // Check event exists
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('SUMMARY:Планове відключення');
    expect(ics).toContain('DESCRIPTION:Планове відключення електроенергії для черги 1.1');
  });

  it('should handle emergency shutdowns status', () => {
    const schedule: GroupSchedule = {
      today: {
        slots: [],
        date: '2026-02-10T00:00:00+02:00',
        status: 'EmergencyShutdowns',
      },
      tomorrow: {
        slots: [],
        date: '2026-02-11T00:00:00+02:00',
        status: 'EmergencyShutdowns',
      },
      updatedOn: '2026-02-10T10:00:00+00:00',
    };

    const ics = generateICS('1.1', schedule);

    // Should create emergency event
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:⚠️ Аварійні відключення');
    expect(ics).toContain('DESCRIPTION:Аварійні відключення електроенергії для черги 1.1. Графік не діє.');
  });

  it('should handle WaitingForSchedule status', () => {
    const schedule: GroupSchedule = {
      today: {
        slots: [{ start: 360, end: 600, type: 'Definite' }],
        date: '2026-02-10T00:00:00+02:00',
        status: 'WaitingForSchedule',
      },
      tomorrow: {
        slots: [],
        date: '2026-02-11T00:00:00+02:00',
        status: 'WaitingForSchedule',
      },
      updatedOn: '2026-02-10T10:00:00+00:00',
    };

    const ics = generateICS('1.1', schedule);

    // Should create event with "Орієнтовно" suffix when there are Definite slots
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Планове відключення (Орієнтовно)');
    expect(ics).toContain('DESCRIPTION:Планове відключення електроенергії для черги 1.1');
  });

  it('should only create events for Definite slots', () => {
    const schedule: GroupSchedule = {
      today: {
        slots: [
          { start: 0, end: 360, type: 'NotPlanned' },
          { start: 360, end: 600, type: 'Definite' },
          { start: 600, end: 990, type: 'NotPlanned' },
          { start: 990, end: 1230, type: 'Definite' },
          { start: 1230, end: 1440, type: 'NotPlanned' },
        ],
        date: '2026-02-10T00:00:00+02:00',
        status: 'ScheduleApplies',
      },
      tomorrow: {
        slots: [],
        date: '2026-02-11T00:00:00+02:00',
        status: 'WaitingForSchedule',
      },
      updatedOn: '2026-02-10T10:00:00+00:00',
    };

    const ics = generateICS('1.1', schedule);

    // Count VEVENT blocks (should be 2 for 2 Definite slots)
    const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(eventCount).toBe(2);
  });

  it('should include unique UIDs for each event', () => {
    const schedule: GroupSchedule = {
      today: {
        slots: [
          { start: 360, end: 600, type: 'Definite' },
          { start: 990, end: 1230, type: 'Definite' },
        ],
        date: '2026-02-10T00:00:00+02:00',
        status: 'ScheduleApplies',
      },
      tomorrow: {
        slots: [],
        date: '2026-02-11T00:00:00+02:00',
        status: 'WaitingForSchedule',
      },
      updatedOn: '2026-02-10T10:00:00+00:00',
    };

    const ics = generateICS('1.1', schedule);

    // Extract all UIDs
    const uidMatches = ics.match(/UID:.+/g);
    expect(uidMatches).toBeTruthy();
    expect(uidMatches!.length).toBe(2);

    // Ensure UIDs are unique
    const uids = new Set(uidMatches);
    expect(uids.size).toBe(2);
  });

  it('should generate valid calendar structure', () => {
    const schedule: GroupSchedule = {
      today: {
        slots: [{ start: 360, end: 600, type: 'Definite' }],
        date: '2026-02-10T00:00:00+02:00',
        status: 'ScheduleApplies',
      },
      tomorrow: {
        slots: [],
        date: '2026-02-11T00:00:00+02:00',
        status: 'WaitingForSchedule',
      },
      updatedOn: '2026-02-10T10:00:00+00:00',
    };

    const ics = generateICS('1.1', schedule);

    // Validate basic ICS structure
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
  });

  it('should not create events for schedules dated yesterday', () => {
    // Use fake timers so "now" is deterministic and tests aren't flaky
    vi.useFakeTimers();
    const fixedNow = new Date('2026-02-18T12:00:00Z');
    vi.setSystemTime(fixedNow);

    const yesterdayDate = new Date(fixedNow.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayIso = new Date(
      Date.UTC(yesterdayDate.getUTCFullYear(), yesterdayDate.getUTCMonth(), yesterdayDate.getUTCDate(), 0, 0, 0),
    ).toISOString();

    const schedule: GroupSchedule = {
      today: {
        slots: [{ start: 360, end: 600, type: 'Definite' }],
        date: yesterdayIso,
        status: 'ScheduleApplies',
      },
      tomorrow: {
        slots: [],
        date: yesterdayIso,
        status: 'ScheduleApplies',
      },
      updatedOn: new Date().toISOString(),
    };

    const ics = generateICS('1.1', schedule);

    // There should be no VEVENT blocks because schedule is for yesterday
    const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(eventCount).toBe(0);

    // Restore real timers
    vi.useRealTimers();
  });
});
