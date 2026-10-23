/**
 * Vercel Serverless Function: Secure Telegram Alert Dispatcher
 * Runs server-side on Node.js. Keeps TELEGRAM_BOT_TOKEN 100% private.
 * The browser client never sees the Telegram Bot API token.
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { chatId, message, botToken: customToken } = body;

    if (!chatId) {
      return res.status(400).json({ ok: false, error: 'Missing required field: chatId' });
    }

    if (!message) {
      return res.status(400).json({ ok: false, error: 'Missing required field: message' });
    }

    // Use custom token if user provided one, otherwise use the server-side environment variable
    const activeToken = customToken?.trim() || process.env.TELEGRAM_BOT_TOKEN?.trim();

    if (!activeToken) {
      return res.status(500).json({
        ok: false,
        error: 'Telegram Bot Token is not configured on the server (TELEGRAM_BOT_TOKEN missing).',
      });
    }

    const telegramApiUrl = `https://api.telegram.org/bot${activeToken}/sendMessage`;

    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return res.status(400).json({
        ok: false,
        error: data.description || 'Failed to send Telegram message',
      });
    }

    return res.status(200).json({
      ok: true,
      messageId: data.result?.message_id,
    });
  } catch (err) {
    console.error('Telegram alert dispatch error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal server error dispatching alert',
    });
  }
}
