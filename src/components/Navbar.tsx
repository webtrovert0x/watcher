import React from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Send, Wallet, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onOpenTelegram: () => void;
  onOpenWhitepaper: () => void;
  telegramLinked: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenTelegram, onOpenWhitepaper, telegramLinked }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo-badge" style={{ overflow: 'hidden', padding: '2px' }}>
          <img src="/logo.png" alt="BOT Wallet Watcher Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
        </div>
        <div className="brand-text">
          <h1>BOT Wallet Watcher</h1>
          <p className="brand-tagline">On-Chain Monitoring & Telegram Alerts on BOT Chain</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Whitepaper Button */}
        <button
          className="btn btn-secondary"
          onClick={onOpenWhitepaper}
          title="Read the BOT Wallet Watcher Whitepaper"
          id="btn-whitepaper"
        >
          <span>Whitepaper</span>
        </button>

        {/* Network indicator */}
        <a
          href="https://scan.botchain.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="network-badge"
          title="Chain ID: 677 (https://rpc.botchain.ai)"
          style={{ textDecoration: 'none' }}
        >
          <span className="pulse-dot" />
          <span>BOT Mainnet (677)</span>
          <ExternalLink size={12} style={{ opacity: 0.7 }} />
        </a>

        {/* Telegram alerts button */}
        <button
          className={`btn ${telegramLinked ? 'btn-telegram' : 'btn-secondary'}`}
          onClick={onOpenTelegram}
          id="btn-telegram-settings"
        >
          <Send size={15} />
          <span>{telegramLinked ? 'Telegram Active' : 'Link Telegram'}</span>
        </button>

        {/* Wallet Connection via Reown AppKit */}
        {isConnected ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => open()}
              id="btn-wallet-connected"
            >
              <Wallet size={15} style={{ color: 'var(--cyan-primary)' }} />
              <span>{shortAddress}</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => disconnect()}
              title="Disconnect Wallet"
              style={{ padding: '10px 12px' }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => open()}
            id="btn-connect-wallet"
          >
            <Wallet size={15} />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
};
