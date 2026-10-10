/**
 * Telegram Notification Dispatcher for BOT Wallet Watcher
 * Dispatches rich Markdown alerts to configured Telegram users/channels via Telegram Bot API.
 */

export class TelegramNotifier {
  constructor(botToken, defaultChatId) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
    this.defaultChatId = defaultChatId || process.env.TELEGRAM_CHAT_ID;
  }

  /**
   * Send a formatted Telegram message
   */
  async sendMessage(chatId, text, inlineKeyboard = null) {
    const targetChat = chatId || this.defaultChatId;
    if (!this.botToken || !targetChat) {
      console.log('[Telegram Simulated Dispatch]', {
        chatId: targetChat || 'SIMULATED_CHAT',
        text,
      });
      return { success: true, simulated: true };
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const payload = {
        chat_id: targetChat,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      };

      if (inlineKeyboard) {
        payload.reply_markup = { inline_keyboard: inlineKeyboard };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) {
        console.error('Telegram API error:', data.description);
        return { success: false, error: data.description };
      }
      return { success: true, data };
    } catch (err) {
      console.error('Failed to send Telegram message:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Dispatch an on-chain transfer alert
   */
  async sendTransferAlert({
    chatId,
    label,
    watchedAddress,
    direction, // 'INCOMING' | 'OUTGOING'
    tokenSymbol = 'BOT',
    amountFormatted,
    counterparty,
    txHash,
    blockNumber,
  }) {
    const isIncoming = direction === 'INCOMING';
    const icon = isIncoming ? '📥' : '📤';
    const dirText = isIncoming ? 'Incoming Funds Received' : 'Outgoing Funds Sent';
    const explorerTxUrl = `https://scan.bohr.life/tx/${txHash}`;
    const explorerAddrUrl = `https://scan.bohr.life/address/${watchedAddress}`;

    const shortWatched = `${watchedAddress.slice(0, 6)}...${watchedAddress.slice(-4)}`;
    const shortCounter = `${counterparty.slice(0, 6)}...${counterparty.slice(-4)}`;

    const htmlMessage = `
🚨 <b>BOT Chain Activity Alert</b>

<b>Event:</b> ${icon} <b>${dirText}</b>
<b>Label:</b> <code>${label || 'Watched Wallet'}</code>
<b>Target:</b> <a href="${explorerAddrUrl}">${shortWatched}</a>

💰 <b>Amount:</b> <code>${amountFormatted} ${tokenSymbol}</code>
👥 <b>${isIncoming ? 'From' : 'To'}:</b> <code>${shortCounter}</code>
📦 <b>Block:</b> #${blockNumber}

🔗 <a href="${explorerTxUrl}">View on BohrScan Explorer</a>
⏱️ <i>${new Date().toUTCString()}</i>
    `.trim();

    const inlineKeyboard = [
      [
        { text: '🔍 View on Explorer', url: explorerTxUrl },
        { text: '🛡️ Manage Alerts', url: 'https://walletwatcher.bohr.life' }
      ]
    ];

    return this.sendMessage(chatId, htmlMessage, inlineKeyboard);
  }

  /**
   * Dispatch test notification to verify connection
   */
  async sendTestAlert(chatId, testAddress = '0x9b3a4c10c88e9e9ada68fc84d05123456789abcd') {
    return this.sendTransferAlert({
      chatId,
      label: 'Main Treasury (Test)',
      watchedAddress: testAddress,
      direction: 'INCOMING',
      tokenSymbol: 'BOT',
      amountFormatted: '125.50',
      counterparty: '0x71C8fb866fcC595F2468656114256A3A0c567890',
      txHash: '0x3a4b92c4815a9992b10a12e3456789abcdef0123456789abcdef0123456789ab',
      blockNumber: '1948201',
    });
  }
}
