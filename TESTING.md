# Local Testing Guide

## Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5173`

## Test the Caching System

### Setup (Optional - API Key)

For local development, you can optionally set an API key in `.dev.vars`:

```bash
echo "API_KEY=my-test-key-123" > .dev.vars
```

If no API key is set, the protected endpoints will work without authentication.

### 1. Check Cache Status

Open in browser or curl:

```bash
# Without API key (works if API_KEY not set)
curl http://localhost:5173/api/cache/status

# With API key
curl -H "x-api-key: my-test-key-123" http://localhost:5173/api/cache/status
```

Expected response:

```json
{
  "lastUpdate": "Never",
  "cacheEnabled": true,
  "cronSchedule": "*/30 * * * *"
}
```

### 2. Manually Regenerate All Calendars

Open in browser:

```
http://localhost:5173/api/cache/regenerate
```

Or use curl:

```bash
# Without API key (works if API_KEY not set)
curl http://localhost:5173/api/cache/regenerate

# With API key
curl -H "x-api-key: my-test-key-123" http://localhost:5173/api/cache/regenerate
```

Expected response:

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

This will:

- Fetch data from Yasno API
- Generate ICS files for all 12 groups (1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2)
- Store them in D1 database cache with 24-hour expiration

### 3. Check Cache Status Again

```bash
curl http://localhost:5173/api/cache/status
```

Now `lastUpdate` should show a recent timestamp:

```json
{
  "lastUpdate": "2025-11-12T14:52:30.123Z",
  "cacheEnabled": true,
  "cronSchedule": "*/30 * * * *"
}
```

### 4. Download a Calendar File

Open in browser or use curl:

```bash
curl http://localhost:5173/calendar/1.1.ics
```

This will return the cached ICS file. The first request after regeneration will be served from cache, which is much faster.

### 5. Test All Groups

You can test calendars for all groups:

- http://localhost:5173/calendar/1.1.ics
- http://localhost:5173/calendar/1.2.ics
- http://localhost:5173/calendar/2.1.ics
- etc.

### 6. Test Fallback (On-Demand Generation)

If you request a calendar that's not in cache, it will be generated on-demand and cached automatically.

## Verify D1 Storage

### Local Storage Location

When running `npm run dev`, the local cache is stored in:

```
.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
```

Your cached ICS files are stored in the D1 database:

- **SQLite database**: `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`

Note: the local Drizzle config auto-discovers the local SQLite file used by wrangler. It scans `.wrangler/state/v3/d1/miniflare-D1DatabaseObject` for `*.sqlite` file.

Each cached calendar file is stored in the `calendar_cache` table with its group key (e.g., `1.1`, `1.2`, etc.).

### View Cached Data

You can check what's stored in D1 using wrangler CLI:

```bash
# List all cached calendar entries (local)
npx wrangler d1 execute shutdown_calendar --local --command "SELECT group, createdAt, expiresAt FROM calendar_cache"

# Get a specific calendar entry
npx wrangler d1 execute shutdown_calendar --local --command "SELECT * FROM calendar_cache WHERE group='1.1'"

# View the last_update timestamp
npx wrangler d1 execute shutdown_calendar --local --command "SELECT * FROM metadata WHERE key='last_update'"

# View available groups
npx wrangler d1 execute shutdown_calendar --local --command "SELECT * FROM metadata WHERE key='available_groups'"
```

### Inspect Local Database with Drizzle Studio

To visually browse your local database:

```bash
npm run db:studio
```

This opens Drizzle Studio at `https://local.drizzle.studio` where you can:

- View all tables (`calendar_cache`, `metadata`)
- Browse data
- Run queries

### Clear Local Cache

To reset your local cache:

```bash
# Stop dev server first (Ctrl+C)
rm -rf .wrangler/state/v3/d1/
npm run db:migrate  # Recreate tables
npm run dev
```

Then regenerate the cache:

```
http://localhost:5173/api/cache/regenerate
```

## Testing Workflow

1. **Start server**: `npm run dev`
2. **Regenerate cache**: Visit `http://localhost:5173/api/cache/regenerate`
3. **Check status**: Visit `http://localhost:5173/api/cache/status`
4. **Download calendar**: Visit `http://localhost:5173/calendar/1.1.ics`
5. **Verify it's cached**: Second request should be instant (served from cache)

## What to Look For

✅ Cache regeneration completes successfully (all 12 groups)
✅ `lastUpdate` timestamp updates after regeneration
✅ Calendar files download correctly
✅ Subsequent requests are fast (served from cache)
✅ ICS files contain Ukrainian text: "Планове відключення"

## Production Testing

Once deployed:

```bash
# Replace with your worker URL and API key
WORKER_URL="https://shutdown-calendar.YOUR_SUBDOMAIN.workers.dev"
API_KEY="your-production-api-key"

# Check cache status (requires API key)
curl -H "x-api-key: $API_KEY" $WORKER_URL/api/cache/status

# Manually regenerate (requires API key)
curl -H "x-api-key: $API_KEY" $WORKER_URL/api/cache/regenerate

# Download calendar (public - no API key needed)
curl $WORKER_URL/calendar/1.1.ics
```

## Cron Testing

In production, the cron job runs automatically every 30 minutes. You can't trigger it manually in local dev, but you can test the regeneration logic using the `/api/cache/regenerate` endpoint.

To see cron logs in production:

```bash
npx wrangler tail
```

Then wait for the next scheduled run or manually trigger via the API endpoint.
