import React from 'react';
import { X, FileText, Shield, Send, CheckCircle2 } from 'lucide-react';

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhitepaperModal: React.FC<WhitepaperModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', maxHeight: '88vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--blue-primary), var(--cyan-primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#030712',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3>BOT Wallet Watcher Whitepaper</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Decentralized On-Chain Activity Monitoring & Telegram Alert Infrastructure
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Contract & Bot Badges */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <a
            href="https://scan.botchain.ai/address/0x78d6f5a35149798c7985090ebc01c58cae01429f"
            target="_blank"
            rel="noopener noreferrer"
            className="tag-badge"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              textDecoration: 'none',
              padding: '6px 12px',
            }}
          >
            <CheckCircle2 size={13} />
            <span>Mainnet Contract: 0x78d6...429f ↗</span>
          </a>
          <a
            href={`https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'bot'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tag-badge"
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              textDecoration: 'none',
              padding: '6px 12px',
            }}
          >
            <Send size={13} />
            <span>Telegram Bot: @{import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'bot'} ↗</span>
          </a>
        </div>

        {/* Content Body */}
        <div style={{ fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--text-main)' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--cyan-primary)' }}>
            1. Executive Summary
          </h4>
          <p style={{ color: 'var(--text-muted)', marginBottom: '18px' }}>
            Blockchains are passive state machines that do not push notifications when events occur.
            Users and organizations are forced to manually refresh block explorers, frequently learning
            about crucial incoming payments or unauthorized wallet drains when it is too late.
            <strong> BOT Wallet Watcher</strong> provides an event-driven monitoring service that bridges
            an on-chain registry contract with an off-chain indexer worker and sub-second Telegram push notifications.
          </p>

          <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--cyan-primary)' }}>
            2. Core Capabilities
          </h4>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px', color: 'var(--text-muted)' }}>
            <li>
              <strong>📥 Incoming BOT Transfers:</strong> Instant alerts when freelance clients, grant programs, or customers transfer BOT.
            </li>
            <li>
              <strong>📤 Outgoing Drain Detection:</strong> Instant warnings the moment funds leave a wallet to detect compromise immediately.
            </li>
            <li>
              <strong>🪙 Multi-Token & ERC-20 Support:</strong> Real-time tracking of <code>Transfer(from, to, value)</code> event logs for stablecoins and tokens.
            </li>
            <li>
              <strong>⚖️ Precision Dust Filtering:</strong> Supports fine-grained micro-amounts down to 0.0001 BOT while filtering dust spam.
            </li>
            <li>
              <strong>🏛️ Multi-Vault Treasury Dashboards:</strong> Unified view of DAO, Marketing, and Grant pools with consolidated inflow/outflow metrics.
            </li>
          </ul>

          <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--cyan-primary)' }}>
            3. Network Specifications
          </h4>
          <div
            style={{
              background: 'rgba(10, 15, 26, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.84rem',
            }}
          >
            <div>• Network: BOT Chain Mainnet (ID: 677)</div>
            <div>• Native Currency: BOT (150 Million Total Supply)</div>
            <div>• RPC URL: https://rpc.botchain.ai</div>
            <div>• Explorer: https://scan.botchain.ai</div>
          </div>

          <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--cyan-primary)' }}>
            4. Non-Custodial Security Model
          </h4>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            BOT Wallet Watcher never requests private keys, signing phrases, or token approvals.
            It observes public ledger state and stores user notification preferences securely on-chain.
            Subscriptions are immutable, portable, and verifiable across any node.
          </p>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <a
            href="https://scan.botchain.ai/address/0x78d6f5a35149798c7985090ebc01c58cae01429f"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <Shield size={16} />
            <span>View Contract on BotScan ↗</span>
          </a>
        </div>
      </div>
    </div>
  );
};
