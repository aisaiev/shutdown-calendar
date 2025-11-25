import type { GroupSchedule, OutageSlot, CalendarEvent, DaySchedule } from '../types';

/**
 * Convert minutes from start of day to Date object
 * Uses the original date parser and adds minutes correctly
 */
function minutesToDate(baseDate: string, minutes: number): Date {
  // Parse the ISO date string - this handles timezone correctly
  // "2025-11-12T00:00:00+02:00" is parsed as midnight in Kyiv timezone
  const date = new Date(baseDate);
  
  // Add the minutes offset
  // getTime() gives us the timestamp, add minutes in milliseconds
  const timestamp = date.getTime() + (minutes * 60 * 1000);
  
  return new Date(timestamp);
}

/**
 * Format date for ICS (YYYYMMDDTHHMMSS)
 * Uses UTC to match how we created the dates
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a unique ID for an event using UUID
 */
function generateEventId(group: string, date: Date, index: number): string {
  return crypto.randomUUID();
}

/**
 * Convert schedule to calendar events
 */
function scheduleToEvents(
  group: string,
  daySchedule: DaySchedule,
  day: 'today' | 'tomorrow'
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Handle emergency shutdowns - create an all-day event
  if (daySchedule.status === 'EmergencyShutdowns') {
    const start = minutesToDate(daySchedule.date, 0);
    const end = minutesToDate(daySchedule.date, 1440);
    
    events.push({
      group,
      start,
      end,
      date: daySchedule.date,
      status: daySchedule.status,
    });
    
    return events;
  }

  // Only create events for "Definite" slots when status is ScheduleApplies or WaitingForSchedule
  for (const slot of daySchedule.slots) {
    if (slot.type === 'Definite') {
      const start = minutesToDate(daySchedule.date, slot.start);
      const end = minutesToDate(daySchedule.date, slot.end);

      events.push({
        group,
        start,
        end,
        date: daySchedule.date,
        status: daySchedule.status,
      });
    }
  }

  return events;
}

/**
 * Generate ICS calendar content from group schedule
 */
export function generateICS(group: string, schedule: GroupSchedule): string {
  const events: CalendarEvent[] = [
    ...scheduleToEvents(group, schedule.today, 'today'),
    ...scheduleToEvents(group, schedule.tomorrow, 'tomorrow'),
  ];

  // Build ICS file
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//aisaiev.net//Electricity Outages//EN',
    'NAME:Відключення електроенергії',
    `X-WR-CALNAME:Відключення електроенергії`,
    `X-WR-CALDESC:Календар планових відключень електроенергії для черги ${group}`,
  ];

  events.forEach((event, index) => {
    const eventId = generateEventId(event.group, event.start, index);
    const dtstamp = formatICSDate(new Date());
    const dtstart = formatICSDate(event.start);
    const dtend = formatICSDate(event.end);
    
    let summary = 'Планове відключення';
    let description = `Планове відключення електроенергії для черги ${event.group}`;
    
    if (event.status === 'EmergencyShutdowns') {
      summary = '⚠️ Аварійні відключення';
      description = `Аварійні відключення електроенергії для черги ${event.group}. Графік не діє.`;
    } else if (event.status === 'WaitingForSchedule') {
      summary += ' (Орієнтовно)';
    }

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${eventId}`);
    lines.push('SEQUENCE:0');
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push('URL;VALUE=URI:https://static.yasno.ua/kyiv/outages');
    lines.push(`LAST-MODIFIED:${dtstamp}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}
