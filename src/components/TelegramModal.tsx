import React, { useState, useEffect } from 'react';
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
  const [botToken, setBotToken] = useState(initialBotToken || '');
  const [linked, setLinked] = useState(telegramLinked);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'bot';

  useEffect(() => {
    if (initialBotToken) {
      setBotToken(initialBotToken);
    }
  }, [initialBotToken]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setFeedback(null);
    if (!chatId.trim()) {
      setFeedback({
        type: 'error',
        msg: 'Please enter your Telegram Chat ID (e.g. 123456789 or @my_channel) to send a test message.',
      });
      return;
    }

    setIsSending(true);
    const testMessage = `
🚨 <b>BOT Wallet Watcher Test Alert</b>

✅ Your Telegram alerts are working!
🤖 <b>Bot:</b> @${botUsername}
🌐 <b>Network:</b> BOT Chain Mainnet (ID: 677)
🔗 <b>Explorer:</b> <a href="https://scan.botchain.ai">https://scan.botchain.ai</a>
⏱️ <i>${new Date().toUTCString()}</i>
    `.trim();

    const res = await sendRealTelegramAlert({
      botToken: botToken.trim() || undefined,
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
        msg: `Telegram dispatch error: ${res.description || 'Failed to send message.'}`,
      });
    }
  };

  const handleSave = () => {
    if (!chatId.trim()) {
      setFeedback({
        type: 'error',
        msg: 'Please provide your Telegram Chat ID or channel username.',
      });
      return;
    }
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
                Real-time alerts via @{botUsername}
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
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}
              >
                @{botUsername} ↗
              </a>
            </li>
            <li>Press <strong>Start</strong> or send <code>/start</code>.</li>
            <li>Enter your numeric <strong>Chat ID</strong> (or channel handle like <code>@my_channel</code>) below.</li>
          </ol>
        </div>

        {/* Settings form */}
        <div className="form-group">
          <label className="form-label">Your Telegram Chat ID / Channel Username *</label>
          <input
            type="text"
            className="form-input"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="e.g. 123456789 or @my_channel"
          />
        </div>

        <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" style={{ margin: 0 }}>
              Custom Bot Token <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
            </label>
            {botToken && (
              <button
                type="button"
                onClick={() => {
                  setBotToken('');
                  setLinked(false);
                  try {
                    localStorage.removeItem('bot_watcher_tg_settings');
                  } catch {}
                  onSave(chatId, '', false);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                }}
                title="Wipe saved bot token"
              >
                Clear Token
              </button>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
            🔒 <strong>Serverless Relay:</strong> The official bot token is managed securely server-side in Vercel. Leave this blank to use the server bot.
          </p>
          <input
            type="password"
            className="form-input"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="Leave blank to use server bot, or paste custom token"
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
