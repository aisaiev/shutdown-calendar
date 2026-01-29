import { jsxRenderer } from 'hono/jsx-renderer';
import { Link, ViteClient } from 'vite-ssr-components/hono';

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="uk">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="https://fav.farm/🗓️" />
        <title>Календар відключень електроенергії у Києві</title>
        <meta
          name="description"
          content="Додайте графік планових відключень електроенергії у Києві до свого календаря. Підтримка iOS, Google Calendar, Outlook."
        />
        <meta name="keywords" content="відключення світла, графік відключень, Київ, ДТЕК, Yasno, календар, планові відключення" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Календар відключень електроенергії у Києві" />
        <meta
          property="og:description"
          content="Додайте графік планових відключень електроенергії у Києві до свого календаря. Підтримка iOS, Google Calendar, Outlook."
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Календар відключень електроенергії у Києві" />
        <meta
          name="twitter:description"
          content="Додайте графік планових відключень електроенергії у Києві до свого календаря. Підтримка iOS, Google Calendar, Outlook."
        />

        {/* Cloudflare Web Analytics */}
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "6e5b43af8c1f49358094b46eb2c32f04"}'
        ></script>

        <script
          type="module"
          dangerouslySetInnerHTML={{
            __html: `
          function copyToClipboard(groupId, event) {
            const input = document.getElementById('url-' + groupId);
            const button = event.target;
            const originalText = button.textContent;
            
            if (!input) {
              console.error('Input element not found for group ' + groupId);
              return;
            }
            
            navigator.clipboard.writeText(input.value)
              .then(() => {
                button.textContent = 'Скопійовано';
                setTimeout(() => {
                  button.textContent = originalText;
                }, 500);
              })
              .catch((err) => {
                console.error('Failed to copy:', err);
              });
          }
          window.copyToClipboard = copyToClipboard;
        `,
          }}
        ></script>

        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
});
