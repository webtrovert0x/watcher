import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { WatchlistTable } from './components/WatchlistTable';
import { LiveActivityFeed } from './components/LiveActivityFeed';
import { TreasuryMonitor } from './components/TreasuryMonitor';
import { AddWalletModal } from './components/AddWalletModal';
import { TelegramModal } from './components/TelegramModal';
import { WhitepaperModal } from './components/WhitepaperModal';
import type { WatchedWallet, DetectedTransaction } from './types';
import {
  getStoredWallets,
  saveStoredWallets,
  getStoredTransactions,
  saveStoredTransactions,
  getTelegramSettings,
  saveTelegramSettings,
} from './services/storage';
import {
  botPublicClient,
  scanRealBlocks,
  getRealBotBalance,
  sendRealTelegramAlert,
} from './services/rpc';
import { ListFilter, Radio, Landmark, Send, Bell, RefreshCw, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const [wallets, setWallets] = useState<WatchedWallet[]>([]);
  const [transactions, setTransactions] = useState<DetectedTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'WATCHLIST' | 'FEED' | 'TREASURY'>('WATCHLIST');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isWhitepaperOpen, setIsWhitepaperOpen] = useState(false);
  const [telegramSettings, setTelegramSettings] = useState(getTelegramSettings());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const lastScannedBlockRef = useRef<bigint>(0n);

  // Load state on mount
  useEffect(() => {
    setWallets(getStoredWallets());
    setTransactions(getStoredTransactions());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Refresh all balances from BOT Chain RPC
  const refreshBalances = useCallback(async (walletList: WatchedWallet[]) => {
    if (walletList.length === 0) return;
    const updated = await Promise.all(
      walletList.map(async (w) => {
        const balance = await getRealBotBalance(w.target);
        return { ...w, balanceBOT: balance };
      })
    );
    setWallets(updated);
    saveStoredWallets(updated);
  }, []);

  // Real Block Scanner against active watchlist
  const executeBlockScan = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      const fromBlock = lastScannedBlockRef.current > 0n ? lastScannedBlockRef.current + 1n : undefined;

      const { transactions: newTxs, latestBlock } = await scanRealBlocks(wallets, fromBlock);

      if (latestBlock > 0n) {
        setCurrentBlock(Number(latestBlock));
        lastScannedBlockRef.current = latestBlock;
      }

      if (newTxs.length > 0) {
        setTransactions((prev) => {
          const combined = [...newTxs, ...prev];
          saveStoredTransactions(combined);
          return combined;
        });

        // Trigger real Telegram alert if configured
        if (telegramSettings.linked && telegramSettings.botToken && telegramSettings.chatId) {
          for (const tx of newTxs) {
            const isInc = tx.direction === 'INCOMING';
            const shortWatched = `${tx.watchedAddress.slice(0, 6)}...${tx.watchedAddress.slice(-4)}`;
            const shortCounter = `${tx.counterparty.slice(0, 8)}...${tx.counterparty.slice(-6)}`;

            const alertText = `
🚨 <b>BOT Chain Transfer Detected</b>

🏷️ <b>Watched Wallet:</b> <code>${tx.label}</code> (${shortWatched})
⚡ <b>Event:</b> ${isInc ? '📥 Incoming Transfer Received' : '📤 Outgoing Transfer Sent'}
💰 <b>Amount:</b> <code>${tx.amount} ${tx.tokenSymbol}</code>
👤 <b>${isInc ? 'Sender (From)' : 'Recipient (To)'}:</b> <code>${shortCounter}</code>
📦 <b>Block:</b> #${tx.blockNumber}

🔗 <a href="https://scan.botchain.ai/tx/${tx.hash}">View on BotScan Explorer</a>
⏱️ <i>${new Date().toLocaleTimeString()}</i>
            `.trim();

            sendRealTelegramAlert({
              botToken: telegramSettings.botToken,
              chatId: telegramSettings.chatId,
              message: alertText,
            });
          }
        }

        showToast(`🚨 Detected ${newTxs.length} real transfer(s) on watched addresses!`);
        refreshBalances(wallets);
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  }, [wallets, isScanning, telegramSettings, refreshBalances]);

  // Initial block scan & interval
  useEffect(() => {
    botPublicClient.getBlockNumber().then((bn) => {
      setCurrentBlock(Number(bn));
      lastScannedBlockRef.current = bn;
    });

    const interval = setInterval(() => {
      executeBlockScan();
    }, 6000); // Poll every 6 seconds

    return () => clearInterval(interval);
  }, [executeBlockScan]);

  const handleAddWallet = async (newWallet: WatchedWallet) => {
    const updated = [newWallet, ...wallets];
    setWallets(updated);
    saveStoredWallets(updated);
    showToast(`✅ Added ${newWallet.label} to watchlist.`);
    refreshBalances(updated);
  };

  const handleRemoveWallet = (id: string, target: string) => {
    const updated = wallets.filter((w) => w.id !== id);
    setWallets(updated);
    saveStoredWallets(updated);
    showToast(`🗑️ Removed ${target.slice(0, 6)}...${target.slice(-4)}`);
  };

  const handleSaveTelegram = (chatId: string, botToken: string, linked: boolean) => {
    const newSettings = { chatId, botToken, linked };
    setTelegramSettings(newSettings);
    saveTelegramSettings(newSettings);
    showToast(`✈️ Telegram settings updated.`);
  };

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <Navbar
        onOpenTelegram={() => setIsTelegramModalOpen(true)}
        onOpenWhitepaper={() => setIsWhitepaperOpen(true)}
        telegramLinked={telegramSettings.linked}
      />

      {/* Top Banner */}
      <div className="telegram-banner">
        <div className="telegram-banner-info">
          <h3>⚡ Real-Time On-Chain Monitor Active</h3>
          <p>
            Connected directly to BOT Chain Mainnet RPC (<code>https://rpc.botchain.ai</code>, Chain ID: 677).
            Current Block: <strong>#{currentBlock > 0 ? currentBlock : 'Syncing...'}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => refreshBalances(wallets)}
            id="btn-refresh-balances"
            title="Query real on-chain balances"
          >
            <RefreshCw size={14} />
            <span>Refresh Balances</span>
          </button>
          <button
            className="btn btn-telegram"
            onClick={() => setIsTelegramModalOpen(true)}
          >
            <Send size={15} />
            <span>{telegramSettings.linked ? 'Telegram Active' : 'Configure Telegram'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <StatsOverview wallets={wallets} transactions={transactions} />

      {/* Navigation Tabs */}
      <div className="nav-tabs-wrapper">
        <div className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'WATCHLIST' ? 'active' : ''}`}
            onClick={() => setActiveTab('WATCHLIST')}
            id="tab-watchlist"
          >
            <ListFilter size={16} />
            <span>My Watchlist</span>
            <span className="tab-badge">{wallets.length}</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'FEED' ? 'active' : ''}`}
            onClick={() => setActiveTab('FEED')}
            id="tab-feed"
          >
            <Radio size={16} />
            <span>Live Activity Feed</span>
            <span className="tab-badge">{transactions.length}</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'TREASURY' ? 'active' : ''}`}
            onClick={() => setActiveTab('TREASURY')}
            id="tab-treasury"
          >
            <Landmark size={16} />
            <span>Treasury & Org Monitor</span>
            <span className="tab-badge">{wallets.filter((w) => w.isTreasury).length}</span>
          </button>
        </div>

        <div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            RPC: <code>https://rpc.botchain.ai</code>
          </span>
        </div>
      </div>

      {/* Main Tab Panels */}
      {activeTab === 'WATCHLIST' && (
        <WatchlistTable
          wallets={wallets}
          onAddClick={() => setIsAddModalOpen(true)}
          onRemove={handleRemoveWallet}
        />
      )}

      {activeTab === 'FEED' && (
        <LiveActivityFeed
          transactions={transactions}
          onRefreshScan={executeBlockScan}
          isScanning={isScanning}
          currentBlock={currentBlock}
        />
      )}

      {activeTab === 'TREASURY' && (
        <TreasuryMonitor
          wallets={wallets}
          transactions={transactions}
          onAddTreasury={() => setIsAddModalOpen(true)}
        />
      )}

      {/* Add Wallet Modal */}
      <AddWalletModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddWallet}
      />

      {/* Telegram Setup Modal */}
      <TelegramModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        telegramLinked={telegramSettings.linked}
        chatId={telegramSettings.chatId}
        botToken={telegramSettings.botToken}
        onSave={handleSaveTelegram}
        onAlertSent={(msg) => showToast(msg)}
      />

      {/* Whitepaper Modal */}
      <WhitepaperModal
        isOpen={isWhitepaperOpen}
        onClose={() => setIsWhitepaperOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            color: '#f8fafc',
            padding: '14px 20px',
            borderRadius: '14px',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 242, 254, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.9rem',
            zIndex: 9999,
            maxWidth: '440px',
            animation: 'modal-appear 0.25s ease-out',
          }}
        >
          <Bell size={18} style={{ color: 'var(--cyan-primary)', flexShrink: 0 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer & Ecosystem Showcase */}
      <footer
        style={{
          marginTop: '60px',
          padding: '28px 0 36px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          {/* Brand & Network */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/botchain-logo.png"
              alt="BOT Chain"
              style={{ width: '28px', height: '28px', borderRadius: '6px' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>BOT Chain Ecosystem</span>
                <span className="tag-badge" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '2px 8px', fontSize: '0.72rem' }}>Mainnet (ID: 677)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Decentralized on-chain watchlist & real-time alert protocol
              </p>
            </div>
          </div>

          {/* BOT Chain Showcase Links with logo in front */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cyan-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <img src="/botchain-logo.png" alt="BOT Chain" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
              <span>BOT Chain website</span>
              <ExternalLink size={13} style={{ opacity: 0.6 }} />
            </a>

            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cyan-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <img src="/botchain-logo.png" alt="BOT Chain" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
              <span>BOT Chain explorer</span>
              <ExternalLink size={13} style={{ opacity: 0.6 }} />
            </a>
          </div>
        </div>

        {/* Bottom meta row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.82rem',
            color: 'var(--text-dim)',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <div>
            <span>BOT Wallet Watcher • Verified on-chain at </span>
            <a
              href="https://scan.botchain.ai/address/0x78d6f5a35149798c7985090ebc01c58cae01429f"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--cyan-primary)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
            >
              0x78d6...429f
            </a>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setIsWhitepaperOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cyan-primary)',
                cursor: 'pointer',
                fontSize: 'inherit',
                padding: 0,
              }}
            >
              Whitepaper ↗
            </button>
            <a
              href={`https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'bot'}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'none' }}
            >
              Telegram Bot ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
