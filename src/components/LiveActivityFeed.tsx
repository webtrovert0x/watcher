import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, RefreshCw, Radio } from 'lucide-react';
import type { DetectedTransaction } from '../types';

interface LiveActivityFeedProps {
  transactions: DetectedTransaction[];
  onRefreshScan: () => void;
  isScanning: boolean;
  currentBlock: number;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  transactions,
  onRefreshScan,
  isScanning,
  currentBlock,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');

  const filtered = transactions.filter((tx) => {
    if (filter === 'INCOMING') return tx.direction === 'INCOMING';
    if (filter === 'OUTGOING') return tx.direction === 'OUTGOING';
    return true;
  });

  return (
    <div className="content-card">
      <div className="section-header">
        <div className="section-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2>Live Transaction Feed</h2>
            <span
              className="tag-badge"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Radio size={12} className="pulse-dot" />
              <span>
                {currentBlock > 0 ? `Block #${currentBlock} Live` : 'Listening to RPC...'}
              </span>
            </span>
          </div>
          <p className="section-subtitle">
            Transfers verified on BOT Chain Testnet (Chain ID: 968, https://rpc.bohr.life).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={onRefreshScan}
            disabled={isScanning}
            title="Scan latest blocks from Bohr RPC"
            id="btn-scan-blocks"
          >
            <RefreshCw size={15} className={isScanning ? 'pulse-dot' : ''} />
            <span>{isScanning ? 'Scanning RPC...' : 'Scan Latest Blocks'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          onClick={() => setFilter('ALL')}
        >
          All Activity ({transactions.length})
        </button>
        <button
          className={`btn ${filter === 'INCOMING' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          onClick={() => setFilter('INCOMING')}
        >
          📥 Incoming
        </button>
        <button
          className={`btn ${filter === 'OUTGOING' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          onClick={() => setFilter('OUTGOING')}
        >
          📤 Outgoing
        </button>
      </div>

      {/* Stream list */}
      <div className="feed-stream">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
              No transactions detected for your active watchlist yet
            </p>
            <p style={{ fontSize: '0.84rem' }}>
              The indexer is actively polling blocks from <code>https://rpc.bohr.life</code>.
              When transactions touch any of your watched addresses, they will appear here in real time.
            </p>
          </div>
        ) : (
          filtered.map((tx) => {
            const isInc = tx.direction === 'INCOMING';
            return (
              <div key={tx.id} className="feed-item">
                <div className="feed-left">
                  <div className={`feed-icon ${isInc ? 'incoming' : 'outgoing'}`}>
                    {isInc ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div className="feed-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0 }}>{tx.label}</h4>
                      <span className={`tag-badge ${isInc ? 'tag-incoming' : 'tag-outgoing'}`}>
                        {isInc ? '📥 Received' : '📤 Sent'}
                      </span>
                      {tx.type === 'ERC20' && (
                        <span className="tag-badge tag-erc20">🪙 {tx.tokenSymbol}</span>
                      )}
                    </div>
                    <p style={{ marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {isInc ? 'Sender: ' : 'Recipient: '}
                      </span>
                      <code>{`${tx.counterparty.slice(0, 8)}...${tx.counterparty.slice(-6)}`}</code>
                      {' • '}
                      <span>Block #{tx.blockNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="feed-right">
                  <div className={`feed-amount ${isInc ? 'pos' : 'neg'}`}>
                    {isInc ? '+' : '-'}
                    {tx.amount} {tx.tokenSymbol}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <span className="feed-time">{tx.timestamp}</span>
                    <a
                      href={`https://scan.bohr.life/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="copy-btn"
                      title="View on BohrScan Explorer"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
