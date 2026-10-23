import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Trash2, Plus, Search } from 'lucide-react';
import type { WatchedWallet } from '../types';

interface WatchlistTableProps {
  wallets: WatchedWallet[];
  onAddClick: () => void;
  onRemove: (id: string, target: string) => void;
}

export const WatchlistTable: React.FC<WatchlistTableProps> = ({
  wallets,
  onAddClick,
  onRemove,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'TREASURY' | 'ONCHAIN'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = wallets.filter((w) => {
    const matchesSearch =
      w.label.toLowerCase().includes(search.toLowerCase()) ||
      w.target.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'TREASURY') return w.isTreasury;
    if (filterType === 'ONCHAIN') return w.isOnChain;
    return true;
  });

  return (
    <div className="content-card">
      <div className="section-header">
        <div className="section-title-wrap">
          <h2>Active Watchlist</h2>
          <p className="section-subtitle">
            Wallets registered for real-time BOT Chain transfer tracking and Telegram alerts.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onAddClick} id="btn-add-wallet">
          <Plus size={16} />
          <span>Add New Wallet</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', minWidth: '280px', flex: '1' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search by label or 0x address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '42px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            onClick={() => setFilterType('ALL')}
          >
            All ({wallets.length})
          </button>
          <button
            className={`btn ${filterType === 'TREASURY' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            onClick={() => setFilterType('TREASURY')}
          >
            Treasuries ({wallets.filter((w) => w.isTreasury).length})
          </button>
          <button
            className={`btn ${filterType === 'ONCHAIN' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            onClick={() => setFilterType('ONCHAIN')}
          >
            On-Chain ({wallets.filter((w) => w.isOnChain).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Wallet Label & Type</th>
              <th>Address (BOT Chain)</th>
              <th>Balance (BOT)</th>
              <th>Active Triggers</th>
              <th>Min Threshold</th>
              <th>Registry</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No watched wallets found. Click <strong>"Add New Wallet"</strong> to begin monitoring.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>
                        {item.label}
                      </strong>
                      {item.isTreasury && <span className="tag-badge tag-treasury">Treasury</span>}
                    </div>
                  </td>

                  <td>
                    <div className="wallet-address-cell">
                      <span>{`${item.target.slice(0, 6)}...${item.target.slice(-4)}`}</span>
                      <button
                        className="copy-btn"
                        onClick={() => handleCopy(item.target, item.id)}
                        title="Copy Address"
                      >
                        {copiedId === item.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      </button>
                      <a
                        href={`https://scan.botchain.ai/address/${item.target}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on BotScan Explorer"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </td>

                  <td>
                    <strong style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>
                      {item.balanceBOT || '0.00'} BOT
                    </strong>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {item.watchIncoming && <span className="tag-badge tag-incoming">📥 In</span>}
                      {item.watchOutgoing && <span className="tag-badge tag-outgoing">📤 Out</span>}
                      {item.watchERC20 && <span className="tag-badge tag-erc20">🪙 ERC20</span>}
                      {item.watchNFT && <span className="tag-badge tag-nft">🖼️ NFT</span>}
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ≥ {item.minThresholdBOT || '0.0'} BOT
                    </span>
                  </td>

                  <td>
                    {item.isOnChain ? (
                      <span
                        className="tag-badge"
                        style={{ background: 'rgba(0, 242, 254, 0.1)', color: 'var(--cyan-primary)' }}
                        title="Recorded in BOTWalletWatcher.sol on BOT Chain"
                      >
                        ⚡ Smart Contract
                      </span>
                    ) : (
                      <span
                        className="tag-badge"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)' }}
                      >
                        Local Worker
                      </span>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-danger-subtle"
                      onClick={() => onRemove(item.id, item.target)}
                      title="Unwatch and delete alert subscription"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
