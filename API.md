# Shutdown Calendar API Documentation

This document describes the backend API endpoints for retrieving electricity outage schedules and downloading ICS calendar files.

## Base URL

Development: `http://localhost:5173`
Production: `https://your-domain.workers.dev`

## Endpoints

### 1. Get Group Schedule (JSON)

**Endpoint:** `GET /api/schedule/:group`

Returns the schedule for a specific group.

**Parameters:**
- `group` (path parameter): Group identifier (e.g., "1.1", "2.1")

**Example:** `GET /api/schedule/1.1`

**Response:**
```json
{
  "today": {
    "slots": [
      {
        "start": 150,
        "end": 390,
        "type": "Definite"
      },
      ...
    ],
    "date": "2025-11-12T00:00:00+02:00",
    "status": "ScheduleApplies"
  },
  "tomorrow": {
    "slots": [],
    "date": "2025-11-13T00:00:00+02:00",
    "status": "WaitingForSchedule"
  },
  "updatedOn": "2025-11-11T19:00:50+00:00"
}
```

### 2. Download Calendar for Specific Group

**Endpoint:** `GET /calendar/:group.ics`

Downloads a pre-generated ICS calendar file for a specific group.

**Parameters:**
- `group` (path parameter): Group identifier (e.g., "1.1", "2.1")

**Example:** `GET /calendar/1.1.ics`

**Response:** ICS file (text/calendar)

**Filename:** `{group}.ics` (e.g., `1.1.ics`, `2.2.ics`)

**Caching:** Files are pre-generated every 2 hours. If a cached file is not available, it will be generated on-demand.

**Usage:**
- Download and import into calendar applications (Google Calendar, Apple Calendar, Outlook, etc.)
- Subscribe to the URL for automatic updates

### 3. Get Cache Status

**Endpoint:** `GET /api/cache/status`

Returns information about the cache system.

**Authentication:** Requires `x-api-key` header (if `API_KEY` environment variable is set)

**Headers:**
```
x-api-key: your-api-key-here
```

**Response:**
```json
{
  "lastUpdate": "2025-11-12T16:00:00.000Z",
  "cacheEnabled": true,
  "cronSchedule": "0 */2 * * *"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized - Invalid or missing API key"
}
```

### 4. Manual Cache Regeneration

**Endpoint:** `GET /api/cache/regenerate`

Manually triggers regeneration of all calendar files.

**Authentication:** Requires `x-api-key` header (if `API_KEY` environment variable is set)

**Headers:**
```
x-api-key: your-api-key-here
```

**Response:**
```json
{
  "message": "Cache regeneration completed",
  "results": {
    "success": 12,
    "failed": 0,
    "errors": []
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized - Invalid or missing API key"
}
```

## Calendar Event Details

Each calendar event includes:
- **Summary:** `Планове відключення` (with "(Орієнтовно)" suffix if schedule is not confirmed)
- **Start Time:** Calculated from the slot's start time in minutes
- **End Time:** Calculated from the slot's end time in minutes  
- **Status:** `CONFIRMED` for ScheduleApplies, `TENTATIVE` for WaitingForSchedule
- **Description:** Information about the outage in Ukrainian with status notes if applicable

## Event Types

Only `Definite` type slots are converted to calendar events. `NotPlanned` slots are ignored.

## Schedule Statuses

- **ScheduleApplies:** Events are confirmed and will occur as scheduled
- **WaitingForSchedule:** Events are tentative and may change
- **EmergencyShutdowns:** No events are created (emergency situation)

## Time Slot Format

API returns time slots as minutes from start of day:
- `start`: 0-1440 (minutes from midnight)
- `end`: 0-1440 (minutes from midnight)

Example: `start: 150, end: 390` = 2:30 AM to 6:30 AM

## Subscribing to Calendars

**Note:** Calendar endpoints (`/calendar/:group.ics`) are **public** and do not require authentication.

### Google Calendar
1. Copy the calendar URL (e.g., `https://your-domain.workers.dev/calendar/1.1.ics`)
2. Open Google Calendar
3. Click "+" next to "Other calendars"
4. Select "From URL"
5. Paste the URL and click "Add calendar"

### Apple Calendar
1. Open Calendar app
2. File → New Calendar Subscription
3. Paste the URL
4. Configure update frequency
5. Click "OK"

### Outlook
1. Open Outlook Calendar
2. Add calendar → Subscribe from web
3. Paste the URL
4. Click "Import"

## Development

Run the development server:
```bash
npm run dev
```

The server will start at `http://localhost:5173`

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Technical Details

- Built with Hono framework for Cloudflare Workers
- Fetches data from Yasno API: `https://app.yasno.ua/api/blackout-service/public/shutdowns`
- Currently supports Region 25, DSO 902
- Generates ICS calendar format (RFC 5545 compliant)
- Timezone: Europe/Kyiv
- **Caching:** Uses Cloudflare KV to store pre-generated ICS files
- **Scheduled Updates:** Cron job runs every 2 hours to regenerate calendars
- **Cache TTL:** 24 hours

## Caching System

To minimize API calls to the external Yasno API:

1. **Scheduled Generation**: A cron job runs every 2 hours (`0 */2 * * *`) to fetch schedules and regenerate all ICS files
2. **KV Storage**: Pre-generated files are stored in Cloudflare KV with 24-hour expiration
3. **Fallback**: If a requested file is not in cache, it's generated on-demand and cached
4. **Cache Status**: Check `/api/cache/status` to see when files were last updated
5. **Manual Regeneration**: Use `/api/cache/regenerate` to manually trigger cache updates

This approach ensures:
- Fast response times (serving from cache)
- Reduced load on the external API
- Always-available calendars (fallback generation)
- Regular updates without user interaction

## Available Groups

Groups are identified by format `X.Y` where X is the main group (1-6) and Y is the subgroup (1-2):
- 1.1, 1.2
- 2.1, 2.2
- 3.1, 3.2
- 4.1, 4.2
- 5.1, 5.2
- 6.1, 6.2
