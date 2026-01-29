# Shutdown Calendar

A Cloudflare Workers application that provides electricity outage schedules for Kyiv, Ukraine in ICS calendar format.

## Purpose

This app fetches planned electricity outage schedules from the [Yasno API](https://yasno.ua) and converts them into standard ICS calendar files that users can subscribe to in their calendar applications (iOS Calendar, Google Calendar, Outlook, etc.).

### Key Features

- **Automatic Updates**: Cron job runs every hour to fetch the latest outage schedules
- **Dynamic Group Support**: Automatically fetches all available outage groups from Yasno
- **Address Lookup**: Find your outage group by entering your street address and building number
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

### Public Endpoints
- `GET /` - Main page with group selection and address lookup
- `GET /calendar/{group}.ics` - Download ICS file for a specific group
- `GET /api/streets/search?query={text}` - Search for streets by name
- `GET /api/houses/search?streetId={id}&query={text}` - Search for houses on a street
- `GET /api/address/group?streetId={id}&houseId={id}` - Get outage group for an address

### Protected Endpoints
- `GET /api/cache/status` - Check cache status
- `GET /api/cache/regenerate` - Manually trigger cache regeneration

## Documentation

- [SETUP.md](SETUP.md) - Detailed setup and deployment instructions
- [TESTING.md](TESTING.md) - Testing guidelines
- [agents.md](agents.md) - Project overview and API documentation
