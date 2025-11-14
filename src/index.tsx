import { Hono } from "hono";
import { renderer } from "./renderer";
import { YasnoService } from "./services/yasno";
import { generateICS } from "./services/calendar";
import { CacheService } from "./services/cache";
import { GROUPS } from "./config";

type Bindings = {
  CALENDAR_CACHE: KVNamespace;
  API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
const yasnoService = new YasnoService();

// Middleware to check API key for protected endpoints
const requireApiKey = async (c: any, next: any) => {
  const apiKey = c.req.header("x-api-key");
  const expectedKey = c.env.API_KEY;

  // If API_KEY is not set in environment, allow access (for development)
  if (!expectedKey) {
    return next();
  }

  if (!apiKey || apiKey !== expectedKey) {
    return c.json({ error: "Unauthorized - Invalid or missing API key" }, 401);
  }

  return next();
};

app.use(renderer);

app.get("/", (c) => {
  const baseUrl = new URL(c.req.url).origin;
  
  return c.render(
    <main class="container">
      <h1>Календар відключень електроенергії у Києві</h1>
      <p>
        <ul>
          <li>
            Знайдіть свою чергу на сайті{" "}
            <a href="https://static.yasno.ua/kyiv/outages">Yasno</a> або{" "}
            <a href="https://www.dtek-kem.com.ua/ua/shutdowns">ДТЕК</a>.
          </li>
          <li>
            Додайте посилання у свій календар — підтримуються{" "}
            <a href="https://support.apple.com/uk-ua/guide/iphone/iph3d1110d4/26/ios/26">
              iOS
            </a>
            ,{" "}
            <a href="https://support.google.com/calendar/answer/37118">
              Google Calendar
            </a>{" "}
            і{" "}
            <a href="https://support.microsoft.com/uk-ua/office/імпорт-календарів-до-outlook-8e8364e1-400e-4c0f-a573-fe76b5a2d379">
              Outlook
            </a>
            .
          </li>
          <li>
            У будь-якому іншому застосунку просто імпортуйте календар за URL або
            .ics-файлом.
          </li>
        </ul>
      </p>
      <p>
        💡 Якщо ви завантажуєте файл вручну, то він не оновлюватиметься
        автоматично.
      </p>
      <p>
        ❗Календар не з'явився? Перевірте, чи він увімкнений у списку
        календарів у вашому застосунку.
      </p>
      {GROUPS.map((group) => (
        <section key={group.id}>
          <h2>{group.name}</h2>
          <div class="grid calendar-grid">
            <input type="text" disabled value={`${baseUrl}${group.icsUrl}`} id={`url-${group.id}`}/>
            <button type="button" onclick={`copyToClipboard('${group.id}', event)`}>Копіювати</button>
            <a href={group.icsUrl} download role="button">Завантажити</a>
          </div>
        </section>
      ))}
    </main>
  );
});

// Calendar endpoint: Download ICS for specific group
app.get("/calendar/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");

    if (!filename || !filename.endsWith(".ics")) {
      return c.text("Invalid calendar filename", 400);
    }

    // Extract group from filename (e.g., "1.2.ics" -> "1.2")
    const group = filename.slice(0, -4);

    if (!group) {
      return c.text("Group parameter is required", 400);
    }

    const cacheService = new CacheService(c.env.CALENDAR_CACHE);

    // Try to get cached ICS file
    let icsContent = await cacheService.getCachedICS(group);

    // If not cached, generate on-demand and cache it
    if (!icsContent) {
      const schedule = await yasnoService.getGroupSchedule(group);

      if (!schedule) {
        return c.text("Group not found", 404);
      }

      icsContent = generateICS(group, schedule);

      // Cache the generated content
      await cacheService.setCachedICS(group, icsContent);
    }

    return c.body(icsContent, 200, {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=calendar.ics",
      "Access-Control-Allow-Origin": "*",
    });
  } catch (error) {
    return c.text("Failed to generate calendar", 500);
  }
});

// API endpoint: Get cache status
app.get("/api/cache/status", requireApiKey, async (c) => {
  try {
    const cacheService = new CacheService(c.env.CALENDAR_CACHE);
    const lastUpdate = await cacheService.getLastUpdate();

    return c.json({
      lastUpdate: lastUpdate || "Never",
      cacheEnabled: true,
      cronSchedule: "0 */1 * * *", // Every hour
    });
  } catch (error) {
    return c.json({ error: "Failed to get cache status" }, 500);
  }
});

// API endpoint: Manually trigger cache regeneration
app.get("/api/cache/regenerate", requireApiKey, async (c) => {
  try {
    const cacheService = new CacheService(c.env.CALENDAR_CACHE);
    const results = await cacheService.regenerateAllCalendars();

    return c.json({
      message: "Cache regeneration completed",
      results,
    });
  } catch (error) {
    return c.json({ error: "Failed to regenerate cache" }, 500);
  }
});

// Catch-all route: Redirect to home page for non-existing routes
app.all("*", (c) => {
  return c.redirect("/");
});

export default {
  fetch: app.fetch,

  // Scheduled cron handler - runs every hour
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    const cacheService = new CacheService(env.CALENDAR_CACHE);

    // Regenerate all calendars
    ctx.waitUntil(
      cacheService
        .regenerateAllCalendars()
        .then((results) => {
          console.log("Scheduled cache regeneration completed:", results);
        })
        .catch((error) => {
          console.error("Scheduled cache regeneration failed:", error);
        })
    );
  },
};

