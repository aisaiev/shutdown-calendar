# Shutdown Calendar

A Cloudflare Workers application that provides electricity outage schedules for Kyiv, Ukraine in ICS calendar format.

## Purpose

This app fetches planned electricity outage schedules from the [Yasno API](https://yasno.ua) and converts them into standard ICS calendar files that users can subscribe to in their calendar applications (iOS Calendar, Google Calendar, Outlook, etc.).

### Key Features

- **Automatic Updates**: Cron job runs every 30 minutes to fetch the latest outage schedules
- **12 Group Support**: Provides separate calendar feeds for all outage groups
- **Smart Caching**: Pre-generates and caches ICS files in Cloudflare KV for fast delivery
- **Emergency Status Handling**: Properly handles emergency shutdown situations
- **Calendar Subscription**: Users can subscribe to dynamic calendars that update automatically
- **Downloadable Files**: Also supports one-time manual downloads

## Quick Start

### Development

```bash
npm install
npm run dev
```

### Deployment

```bash
npm run deploy
```

See [SETUP.md](SETUP.md) for detailed setup instructions including KV namespace and API key configuration.

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Storage**: Cloudflare KV
- **UI**: Tailwind CSS
- **Build Tool**: Vite

## API Endpoints

- `GET /calendar/{group}.ics` - Download ICS file for a specific group
- `GET /api/cache/status` - Check cache status (requires API key)
- `GET /api/cache/regenerate` - Manually trigger cache regeneration (requires API key)

## Documentation

- [SETUP.md](SETUP.md) - Detailed setup and deployment instructions
- [TESTING.md](TESTING.md) - Testing guidelines
- [agents.md](agents.md) - Project overview and API documentation
