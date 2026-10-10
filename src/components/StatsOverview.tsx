import React from 'react';
import { Eye, BellRing, Activity, Coins } from 'lucide-react';
import type { WatchedWallet, DetectedTransaction } from '../types';

interface StatsOverviewProps {
  wallets: WatchedWallet[];
  transactions: DetectedTransaction[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ wallets, transactions }) => {
  const totalVolume = wallets.reduce((acc, w) => {
    const raw = parseFloat((w.balanceBOT || '0').replace(/,/g, ''));
    return acc + (isNaN(raw) ? 0 : raw);
  }, 0);

  const formattedVolume = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(totalVolume);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Monitored Wallets</span>
          <div className="stat-icon">
            <Eye size={17} />
          </div>
        </div>
        <div className="stat-value">{wallets.length}</div>
        <div className="stat-subtext">
          <span>●</span>
          <span>{wallets.filter((w) => w.isOnChain).length} synced on BOT Chain</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Tracked BOT Holdings</span>
          <div className="stat-icon">
            <Coins size={17} />
          </div>
        </div>
        <div className="stat-value">{formattedVolume} BOT</div>
        <div className="stat-subtext">
          <span>●</span>
          <span>Across watched treasuries</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Activity Detected</span>
          <div className="stat-icon">
            <Activity size={17} />
          </div>
        </div>
        <div className="stat-value">{transactions.length}</div>
        <div className="stat-subtext">
          <span>●</span>
          <span>Last 24 hours on Chain 968</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Telegram Alerts</span>
          <div className="stat-icon">
            <BellRing size={17} />
          </div>
        </div>
        <div className="stat-value">100%</div>
        <div className="stat-subtext">
          <span>●</span>
          <span>Worker active & listening</span>
        </div>
      </div>
    </div>
  );
};
