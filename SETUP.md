# Setup Instructions

## Cloudflare KV Namespace Setup

Before deploying, you need to create a KV namespace for caching calendar files.

### 1. Create Production KV Namespace

```bash
npx wrangler kv namespace create CALENDAR_CACHE
```

This will output something like:
```
🌀 Creating namespace with title "shutdown-calendar-CALENDAR_CACHE"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "CALENDAR_CACHE", id = "abc123def456" }
```

### 2. Create Preview KV Namespace (for development)

```bash
npx wrangler kv namespace create CALENDAR_CACHE --preview
```

This will output:
```
🌀 Creating namespace with title "shutdown-calendar-CALENDAR_CACHE_preview"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "CALENDAR_CACHE", preview_id = "xyz789abc123" }
```

### 3. Update wrangler.jsonc

Replace the placeholder in `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "CALENDAR_CACHE",
    "id": "your-production-id-here",
    "preview_id": "your-preview-id-here"
  }
]
```

### 4. Generate TypeScript Types (Optional)

After configuring KV namespaces, generate TypeScript type definitions:

```bash
npm run cf-typegen
```

This command:
- Reads your `wrangler.jsonc` configuration (KV namespaces, secrets, etc.)
- Generates TypeScript interfaces for all your bindings
- Provides autocomplete and type safety when accessing `c.env.CALENDAR_CACHE` or `c.env.API_KEY`

**When to run:**
- After initial project setup
- When you add/modify KV namespaces or secrets in wrangler.jsonc
- To sync TypeScript types with your Cloudflare configuration

## API Key Setup (Security)

The `/api/cache/status` and `/api/cache/regenerate` endpoints are protected with an API key.

### 1. Generate a Secure API Key

Generate a secure random key:
```bash
# macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Example output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6==`

### 2. Set API Key for Production

Add the API key as a Cloudflare Workers secret:
```bash
npx wrangler secret put API_KEY
```

You will be prompted to enter your API key:
```
Enter a secret value: › [paste your generated key here]
```

This stores the API key securely in Cloudflare and makes it available to your worker via `env.API_KEY`.

To verify it's set:
```bash
npx wrangler secret list
```

### 3. Set API Key for Local Development

Create a `.dev.vars` file in the project root:
```bash
echo "API_KEY=your-dev-api-key-here" > .dev.vars
```

Or manually create `.dev.vars`:
```
API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6==
```

**Important**: `.dev.vars` is already in `.gitignore` - never commit this file!

### 4. Using the API Key

When calling protected endpoints, include the API key in the `x-api-key` header:

```bash
# With API key
curl -H "x-api-key: your-api-key-here" https://your-worker.workers.dev/api/cache/status

# Without API key (will return 401 Unauthorized)
curl https://your-worker.workers.dev/api/cache/status
```

**Note**: If `API_KEY` is not set in the environment, the endpoints will be accessible without authentication (useful for local development without a key).

## How It Works

### Caching System

- **Scheduled Updates**: A cron job runs every hour to fetch data from the Yasno API and regenerate all ICS files
- **KV Storage**: Pre-generated ICS files are stored in Cloudflare KV with 24-hour expiration
- **Fallback**: If a cached file is missing, it will be generated on-demand and cached for future requests
- **Reduced API Calls**: Users download pre-generated files, minimizing external API requests

### Endpoints

- `GET /calendar/:group.ics` - Serves cached ICS file (generates on-demand if missing)
- `GET /api/cache/status` - Check when cache was last updated
- `GET /api/cache/regenerate` - Manually trigger cache regeneration for all groups

### Cron Schedule

The cron trigger is configured to run every hour:
```
0 * * * *
```

You can adjust this in `wrangler.jsonc` if needed.

## Development

For local development with `npm run dev`, the Cloudflare vite plugin will automatically create a temporary KV namespace.

## Deployment

Once KV namespaces and API key are configured:

### 1. Build and Deploy

```bash
npm run deploy
```

This command will:
1. Build your application with Vite
2. Upload the worker to Cloudflare
3. Deploy to your `*.workers.dev` subdomain

### 2. Deployment Output

You'll see output like:
```
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded shutdown-calendar (x.xx sec)
Published shutdown-calendar (x.xx sec)
  https://shutdown-calendar.your-subdomain.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3. Verify Deployment

Test your deployed worker:

```bash
# Set your worker URL
WORKER_URL="https://shutdown-calendar.your-subdomain.workers.dev"

# Download a calendar (public - no auth needed)
curl $WORKER_URL/calendar/1.1.ics

# Check cache status (requires API key)
curl -H "x-api-key: your-api-key" $WORKER_URL/api/cache/status

# Manually regenerate cache (requires API key)
curl -H "x-api-key: your-api-key" $WORKER_URL/api/cache/regenerate
```

### 4. Custom Domain (Optional)

To use a custom domain instead of `*.workers.dev`:

1. Go to your Cloudflare Dashboard
2. Navigate to Workers & Pages > Your Worker
3. Click "Triggers" tab
4. Add a custom domain or route

Or use wrangler CLI:
```bash
npx wrangler publish --route "calendar.yourdomain.com/*"
```

### 5. Monitor Your Worker

View live logs:
```bash
npx wrangler tail
```

This shows:
- Incoming requests
- Cron job executions (every hour)
- Console logs
- Errors

### 6. Update Deployment

To deploy updates after making changes:

```bash
npm run deploy
```

Cloudflare will automatically roll out the new version.

### 7. Check Cron Status

After deployment, the cron job will start running automatically every hour. You can verify it's working by:

```bash
# Check when cache was last updated
curl -H "x-api-key: your-api-key" $WORKER_URL/api/cache/status
```

The `lastUpdate` field should show a recent timestamp after the first cron run.

## Troubleshooting

### Login Required

If you see authentication errors:
```bash
npx wrangler login
```

### KV Namespace Not Found

Make sure the KV namespace ID in `wrangler.jsonc` matches your created namespace:
```bash
npx wrangler kv namespace list
```

### Secret Not Set

Verify your API key is configured:
```bash
npx wrangler secret list
```

### View Worker Settings

Check your worker configuration:
```bash
npx wrangler whoami
npx wrangler deployments list
```

## Manual Cache Regeneration

You can manually trigger cache regeneration:
```bash
curl -H "x-api-key: your-api-key" https://your-worker.workers.dev/api/cache/regenerate
```

Or visit the endpoint in your browser (will prompt for authentication if API key is in headers via browser extension).
