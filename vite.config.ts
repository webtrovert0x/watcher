import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'api-alert-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/api/alert', async (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => (body += chunk));
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body || '{}');
                  const token = data.botToken?.trim() || env.TELEGRAM_BOT_TOKEN?.trim();
                  if (!token) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(
                      JSON.stringify({
                        ok: false,
                        error: 'TELEGRAM_BOT_TOKEN not set in server environment.',
                      })
                    );
                    return;
                  }
                  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: data.chatId,
                      text: data.message,
                      parse_mode: 'HTML',
                      disable_web_page_preview: false,
                    }),
                  });
                  const tgData: any = await tgRes.json();
                  res.statusCode = tgData?.ok ? 200 : 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(tgData));
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: false, error: e.message }));
                }
              });
            } else {
              res.statusCode = 405;
              res.end('Method Not Allowed');
            }
          });
        },
      },
    ],
  };
});
