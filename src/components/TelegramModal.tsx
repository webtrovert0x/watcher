import React, { useState } from 'react';
import { X, Send, CheckCircle2, Bell, AlertCircle } from 'lucide-react';
import { sendRealTelegramAlert } from '../services/rpc';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramLinked: boolean;
  chatId: string;
  botToken: string;
  onSave: (chatId: string, botToken: string, linked: boolean) => void;
  onAlertSent: (msg: string) => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({
  isOpen,
  onClose,
  telegramLinked,
  chatId: initialChatId,
  botToken: initialBotToken,
  onSave,
  onAlertSent,
}) => {
  const [chatId, setChatId] = useState(initialChatId || '');
  const [botToken, setBotToken] = useState(
    initialBotToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''
  );
  const [linked, setLinked] = useState(telegramLinked);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setFeedback(null);
    if (!botToken.trim() || !chatId.trim()) {
      setFeedback({
        type: 'error',
        msg: 'Please provide both your Telegram Bot Token and Chat ID to send a live test message.',
      });
      return;
    }

    setIsSending(true);
    const testMessage = `
🚨 <b>BOT Wallet Watcher Test Alert</b>

✅ Your Telegram bot is operational!
🤖 <b>Bot:</b> @wallet_watcher_on_bot
🌐 <b>Network:</b> BOT Chain Mainnet (ID: 677)
🔗 <b>Explorer:</b> <a href="https://scan.botchain.ai">https://scan.botchain.ai</a>
⏱️ <i>${new Date().toUTCString()}</i>
    `.trim();

    const res = await sendRealTelegramAlert({
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      message: testMessage,
    });

    setIsSending(false);

    if (res.ok) {
      setFeedback({ type: 'success', msg: 'Message delivered to your Telegram account!' });
      onAlertSent('Telegram message delivered!');
    } else {
      setFeedback({
        type: 'error',
        msg: `Telegram API error: ${res.description || 'Failed to send message.'}`,
      });
    }
  };

  const handleSave = () => {
    onSave(chatId.trim(), botToken.trim(), linked);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={18} />
            </div>
            <div>
              <h3>Telegram Notification Center</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Real-time alerts via @wallet_watcher_on_bot
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {feedback && (
          <div
            style={{
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: feedback.type === 'success' ? '#34d399' : '#fb7185',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.86rem',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Pairing Instructions */}
        <div
          style={{
            background: 'rgba(10, 15, 26, 0.6)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-main)' }}>
            Connect Your Bot:
          </h4>
          <ol style={{ fontSize: '0.82rem', color: 'var(--text-muted)', paddingLeft: '16px', lineHeight: '1.6' }}>
            <li>
              Open your bot in Telegram:{' '}
              <a
                href="https://t.me/wallet_watcher_on_bot"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}
              >
                @wallet_watcher_on_bot ↗
              </a>
            </li>
            <li>Press <strong>Start</strong> or send <code>/start</code>.</li>
            <li>Enter your numeric <strong>Chat ID</strong> (or channel handle like <code>@my_channel</code>) below.</li>
          </ol>
        </div>

        {/* Settings form */}
        <div className="form-group">
          <label className="form-label">Telegram Bot Token (HTTP API)</label>
          <input
            type="password"
            className="form-input"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Your Telegram Chat ID / Channel Username</label>
          <input
            type="text"
            className="form-input"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="e.g. 123456789 or @my_channel"
          />
        </div>

        <div className="form-group">
          <label className="checkbox-card">
            <input
              type="checkbox"
              checked={linked}
              onChange={(e) => setLinked(e.target.checked)}
            />
            <span>Enable real-time Telegram alerts for active watchlists</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTest}
            disabled={isSending}
            style={{ flex: 1 }}
            id="btn-test-telegram"
          >
            <Bell size={16} />
            <span>{isSending ? 'Sending Live...' : 'Send Live Test Alert'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            style={{ flex: 1 }}
          >
            <CheckCircle2 size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
