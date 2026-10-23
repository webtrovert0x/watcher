import React from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';
import type { WatchedWallet, DetectedTransaction } from '../types';

interface TreasuryMonitorProps {
  wallets: WatchedWallet[];
  transactions: DetectedTransaction[];
  onAddTreasury: () => void;
}

export const TreasuryMonitor: React.FC<TreasuryMonitorProps> = ({
  wallets,
  transactions,
  onAddTreasury,
}) => {
  const treasuries = wallets.filter((w) => w.isTreasury);

  const totalTreasuryBalance = treasuries.reduce((sum, w) => {
    const raw = parseFloat((w.balanceBOT || '0').replace(/,/g, ''));
    return sum + (isNaN(raw) ? 0 : raw);
  }, 0);

  // Inflow vs Outflow calculations from recent txs
  const treasuryAddresses = new Set(treasuries.map((t) => t.target.toLowerCase()));
  const treasuryTxs = transactions.filter((tx) =>
    treasuryAddresses.has(tx.watchedAddress.toLowerCase())
  );

  const totalInflow = treasuryTxs
    .filter((tx) => tx.direction === 'INCOMING' && tx.tokenSymbol === 'BOT')
    .reduce((sum, tx) => sum + parseFloat(tx.amount.replace(/,/g, '') || '0'), 0);

  const totalOutflow = treasuryTxs
    .filter((tx) => tx.direction === 'OUTGOING' && tx.tokenSymbol === 'BOT')
    .reduce((sum, tx) => sum + parseFloat(tx.amount.replace(/,/g, '') || '0'), 0);

  return (
    <div className="content-card">
      <div className="section-header">
        <div className="section-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2>Project Treasury Dashboard</h2>
            <span className="tag-badge tag-treasury">Multi-Wallet Shield</span>
          </div>
          <p className="section-subtitle">
            Consolidated oversight for DAO, Foundation, Marketing, and Grant pools on BOT Chain.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onAddTreasury}>
          <Landmark size={15} />
          <span>Add Treasury Wallet</span>
        </button>
      </div>

      {/* Aggregate Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="stat-card" style={{ padding: '18px' }}>
          <span className="stat-title">Combined Treasury Holdings</span>
          <div className="stat-value" style={{ color: 'var(--cyan-primary)' }}>
            {new Intl.NumberFormat('en-US').format(totalTreasuryBalance)} BOT
          </div>
          <div className="stat-subtext">
            <span>●</span>
            <span>Across {treasuries.length} monitored wallets</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '18px' }}>
          <span className="stat-title">24h Recorded Inflow</span>
          <div className="stat-value" style={{ color: 'var(--emerald-accent)' }}>
            +{new Intl.NumberFormat('en-US').format(totalInflow)} BOT
          </div>
          <div className="stat-subtext" style={{ color: 'var(--emerald-accent)' }}>
            <ArrowDownLeft size={13} />
            <span>Incoming funds / grant fees</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '18px' }}>
          <span className="stat-title">24h Recorded Outflow</span>
          <div className="stat-value" style={{ color: 'var(--rose-danger)' }}>
            -{new Intl.NumberFormat('en-US').format(totalOutflow)} BOT
          </div>
          <div className="stat-subtext" style={{ color: 'var(--rose-danger)' }}>
            <ArrowUpRight size={13} />
            <span>Disbursements / payouts</span>
          </div>
        </div>
      </div>

      {/* Treasury Wallets Breakdown */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', fontFamily: 'var(--font-display)' }}>
        Monitored Treasury Vaults
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {treasuries.map((t) => (
          <div
            key={t.id}
            style={{
              background: 'rgba(13, 18, 30, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{t.label}</h4>
                <div className="wallet-address-cell">
                  <span>{`${t.target.slice(0, 8)}...${t.target.slice(-6)}`}</span>
                  <a
                    href={`https://scan.botchain.ai/address/${t.target}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on BotScan Explorer"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
              <span className="tag-badge tag-treasury">Protected</span>
            </div>

            <div style={{ margin: '14px 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Treasury Reserve</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)' }}>
                  {t.balanceBOT} BOT
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Alert Threshold</span>
                <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                  ≥ {t.minThresholdBOT} BOT
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="tag-badge tag-incoming">Inflow Alerts</span>
              <span className="tag-badge tag-outgoing">Drain Alerts</span>
              <span className="tag-badge tag-erc20">Tokens</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
