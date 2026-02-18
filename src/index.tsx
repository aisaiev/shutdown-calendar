import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { renderer } from './renderer';
import { YasnoService } from './services/yasno';
import { YasnoAddressService } from './services/yasno-address';
import { generateICS } from './services/calendar';
import { CacheService } from './services/cache';
import type { GroupConfig } from './types';
import { AddressLookup } from './components/AddressLookup';
import { AddressLookupScript } from './components/AddressLookupScript';
import { createDb } from './db';
import * as z from 'zod';
import { zValidator } from '@hono/zod-validator';

type Bindings = {
  shutdown_calendar: D1Database;
  API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
const yasnoService = new YasnoService();
const yasnoAddressService = new YasnoAddressService();

// Zod schemas for endpoint validation
const filenameParamsSchema = z.object({ filename: z.string().regex(/^[^./][^/]*\.ics$/) });

const streetsQuerySchema = z.object({ query: z.string().min(2) });

const housesQuerySchema = z.object({ streetId: z.coerce.number().min(1), query: z.string().min(1) });

const addressGroupQuerySchema = z.object({ streetId: z.coerce.number().min(1), houseId: z.coerce.number().min(1) });

// Middleware to check API key for protected endpoints
const requireApiKey = async (c: Context, next: Next) => {
  const apiKey = c.req.header('x-api-key');
  const expectedKey = c.env.API_KEY;

  // If API_KEY is not set in environment, allow access (for development)
  if (!expectedKey) {
    return next();
  }

  if (!apiKey || apiKey !== expectedKey) {
    return c.json({ error: 'Unauthorized - Invalid or missing API key' }, 401);
  }

  return next();
};

app.use(renderer);

// Serve robots.txt
app.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin;
  return c.text(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml`, 200, { 'Content-Type': 'text/plain' });
});

app.get('/', async (c) => {
  const baseUrl = new URL(c.req.url).origin;
  const db = createDb(c.env.shutdown_calendar);
  const cacheService = new CacheService(db);

  // Get available groups from database cache
  const cachedGroups = await cacheService.getAvailableGroups();
  const groups: GroupConfig[] = cachedGroups.map((id) => ({
    id,
    name: `Черга ${id}`,
    icsUrl: `/calendar/${id}.ics`,
  }));

  return c.render(
    <div class="min-h-screen bg-background">
      <main class="container mx-auto px-4 py-8 max-w-4xl">
        <div class="space-y-6">
          <div>
            <h1 class="text-4xl text-center font-bold tracking-tight mb-8">Календар відключень електроенергії у Києві</h1>

            <div class="rounded-xl border bg-card text-card-foreground shadow mb-6">
              <div class="flex flex-col space-y-1.5 p-6">
                <h2 class="font-semibold leading-none tracking-tight text-lg">Як користуватися:</h2>
              </div>
              <div class="p-6 pt-0">
                <ul class="space-y-2 text-sm text-muted-foreground">
                  <li class="flex items-start gap-2">
                    <span class="text-primary mt-0.5">•</span>
                    <span>
                      Знайдіть свою чергу на сайті{' '}
                      <a href="https://static.yasno.ua/kyiv/outages" class="text-primary hover:underline">
                        Yasno
                      </a>{' '}
                      або{' '}
                      <a href="https://www.dtek-kem.com.ua/ua/shutdowns" class="text-primary hover:underline">
                        ДТЕК
                      </a>
                      , або скористайтеся формою нижче, щоб визначити її за адресою.
                    </span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-primary mt-0.5">•</span>
                    <span>
                      Додайте посилання у свій календар — підтримуються{' '}
                      <a href="https://support.apple.com/uk-ua/guide/iphone/iph3d1110d4/26/ios/26" class="text-primary hover:underline">
                        iOS
                      </a>
                      ,{' '}
                      <a href="https://support.google.com/calendar/answer/37118" class="text-primary hover:underline">
                        Google Calendar
                      </a>{' '}
                      і{' '}
                      <a
                        href="https://support.microsoft.com/uk-ua/office/імпорт-календарів-до-outlook-8e8364e1-400e-4c0f-a573-fe76b5a2d379"
                        class="text-primary hover:underline"
                      >
                        Outlook
                      </a>
                      .
                    </span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-primary mt-0.5">•</span>
                    <span>У будь-якому іншому застосунку просто імпортуйте календар за URL або .ics-файлом.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="flex flex-col gap-2 text-sm">
              <p class="flex items-center gap-2">
                <span class="text-xl leading-none">💡</span>
                <span class="text-muted-foreground">Якщо ви завантажуєте файл вручну, то він не оновлюватиметься автоматично.</span>
              </p>
              <p class="flex items-center gap-2">
                <span class="text-xl leading-none">❗</span>
                <span class="text-muted-foreground">Календар не з'явився? Перевірте, чи він увімкнений у списку календарів у вашому застосунку.</span>
              </p>
            </div>
          </div>

          <AddressLookup />

          <div class="space-y-4">
            {groups.length === 0 ? (
              <div class="rounded-xl border bg-card text-card-foreground shadow">
                <div class="flex flex-col space-y-1.5 p-6">
                  <h3 class="font-semibold leading-none tracking-tight text-xl">Немає доступних черг для відображення</h3>
                </div>
                <div class="p-6 pt-0">
                  <p class="text-sm text-muted-foreground">Календарі ще не згенеровані.</p>
                </div>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.id} class="rounded-xl border bg-card text-card-foreground shadow">
                  <div class="flex flex-col space-y-1.5 p-6">
                    <h3 class="font-semibold leading-none tracking-tight text-xl">{group.name}</h3>
                  </div>
                  <div class="p-6 pt-0">
                    <div class="flex flex-col sm:flex-row gap-2">
                      <label for={`url-${group.id}`} class="sr-only">
                        URL календаря для {group.name}
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`${baseUrl}${group.icsUrl}`}
                        id={`url-${group.id}`}
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm flex-1"
                      />
                      <div class="flex gap-2">
                        <button
                          type="button"
                          onclick={`copyToClipboard('${group.id}', event)`}
                          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 flex-1 sm:flex-none"
                        >
                          Копіювати
                        </button>
                        <a
                          href={group.icsUrl}
                          download
                          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 flex-1 sm:flex-none"
                        >
                          Завантажити
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <AddressLookupScript />
    </div>,
  );
});

// Calendar endpoint: Download ICS for specific group
app.get(
  '/calendar/:filename',
  zValidator('param', filenameParamsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Invalid calendar filename' }, 400);
    }
  }),
  async (c) => {
    try {
      const { filename } = c.req.valid('param');
      console.log(`[Calendar] Request for: ${filename}`);

      // Extract group from filename (e.g., "1.2.ics" -> "1.2")
      const group = filename.slice(0, -4);

      if (!group) {
        return c.json({ error: 'Group parameter is required' }, 400);
      }

      const db = createDb(c.env.shutdown_calendar);
      const cacheService = new CacheService(db);

      // Try to get cached ICS file
      let icsContent = await cacheService.getCachedICS(group);

      // If not cached, generate on-demand and cache it
      if (!icsContent) {
        const schedule = await yasnoService.getGroupSchedule(group);

        if (!schedule) {
          return c.json({ error: 'Group not found' }, 404);
        }

        icsContent = generateICS(group, schedule);

        // Cache the generated content
        await cacheService.setCachedICS(group, icsContent);
      }

      return c.body(icsContent, 200, {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename=calendar.ics',
        'Access-Control-Allow-Origin': '*',
      });
    } catch {
      return c.json({ error: 'Failed to generate calendar' }, 500);
    }
  },
);

// API endpoint: Get cache status
app.get('/api/cache/status', requireApiKey, async (c) => {
  try {
    console.log('[API] Cache status requested');
    const db = createDb(c.env.shutdown_calendar);
    const cacheService = new CacheService(db);
    const lastUpdate = await cacheService.getLastUpdate();

    return c.json({
      lastUpdate: lastUpdate || 'Never',
      cacheEnabled: true,
      cronSchedule: '*/30 * * * *', // Every 30 minutes
    });
  } catch {
    return c.json({ error: 'Failed to get cache status' }, 500);
  }
});

// API endpoint: Manually trigger cache regeneration
app.get('/api/cache/regenerate', requireApiKey, async (c) => {
  try {
    console.log('[API] Manual cache regeneration triggered');
    const db = createDb(c.env.shutdown_calendar);
    const cacheService = new CacheService(db);
    const results = await cacheService.regenerateAllCalendars();
    console.log('[API] Cache regeneration completed:', JSON.stringify(results));

    return c.json({
      message: 'Cache regeneration completed',
      results,
    });
  } catch {
    return c.json({ error: 'Failed to regenerate cache' }, 500);
  }
});

// API endpoint: Search streets
app.get(
  '/api/streets/search',
  zValidator('query', streetsQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Query must be at least 2 characters' }, 400);
    }
  }),
  async (c) => {
    try {
      const { query } = c.req.valid('query');

      const streets = await yasnoAddressService.searchStreets(query);
      return c.json(streets);
    } catch (error) {
      console.error('[API] Street search failed:', error);
      return c.json({ error: 'Failed to search streets' }, 500);
    }
  },
);
app.get(
  '/api/houses/search',
  zValidator('query', housesQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'streetId and query are required' }, 400);
    }
  }),
  async (c) => {
    try {
      const { streetId, query } = c.req.valid('query');

      const houses = await yasnoAddressService.searchHouses(streetId, query);
      return c.json(houses);
    } catch (error) {
      console.error('[API] House search failed:', error);
      return c.json({ error: 'Failed to search houses' }, 500);
    }
  },
);

// API endpoint: Get group by address
app.get(
  '/api/address/group',
  zValidator('query', addressGroupQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'streetId and houseId are required' }, 400);
    }
  }),
  async (c) => {
    try {
      const { streetId, houseId } = c.req.valid('query');

      const group = await yasnoAddressService.getGroup(streetId, houseId);
      return c.json(group);
    } catch (error) {
      console.error('[API] Get group failed:', error);
      return c.json({ error: 'Failed to get group' }, 500);
    }
  },
);

// Catch-all route: Redirect to home page for non-existing routes
app.all('*', (c) => {
  return c.redirect('/');
});

export default {
  fetch: app.fetch,

  // Scheduled cron handler
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log('[CRON] Starting scheduled cache regeneration');
    const db = createDb(env.shutdown_calendar);
    const cacheService = new CacheService(db);

    // Regenerate all calendars
    ctx.waitUntil(
      cacheService
        .regenerateAllCalendars()
        .then((results) => {
          console.log('[CRON] Cache regeneration completed:', JSON.stringify(results));
        })
        .catch((error) => {
          console.error('[CRON] Cache regeneration failed:', String(error));
        }),
    );
  },
};
