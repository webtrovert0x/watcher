import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import type { WatchedWallet } from '../types';
import { BOT_WALLET_WATCHER_ABI, BOT_WALLET_WATCHER_ADDRESS } from '../contracts/BOTWalletWatcherABI';
import { getRealBotBalance } from '../services/rpc';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (wallet: WatchedWallet) => void;
}

export const AddWalletModal: React.FC<AddWalletModalProps> = ({ isOpen, onClose, onAdd }) => {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [isTreasury, setIsTreasury] = useState(false);
  const [watchIncoming, setWatchIncoming] = useState(true);
  const [watchOutgoing, setWatchOutgoing] = useState(true);
  const [watchERC20, setWatchERC20] = useState(true);
  const [watchNFT, setWatchNFT] = useState(false);
  const [thresholdBOT, setThresholdBOT] = useState('0.0');
  const [recordOnChain, setRecordOnChain] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanAddress = address.trim() as `0x${string}`;
    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
      setError('Please provide a valid 42-character Ethereum address (0x...)');
      return;
    }

    if (!label.trim()) {
      setError('Please provide a label for this wallet.');
      return;
    }

    setLoading(true);

    try {
      let isOnChainSuccess = false;

      // 1. Fetch real on-chain balance directly from BOT Chain Testnet RPC
      const realBalance = await getRealBotBalance(cleanAddress);

      // 2. If user chooses to record on-chain and is connected
      if (recordOnChain && isConnected) {
        try {
          const minWei = parseEther(thresholdBOT || '0');
          await (writeContractAsync as any)({
            address: BOT_WALLET_WATCHER_ADDRESS,
            abi: BOT_WALLET_WATCHER_ABI,
            functionName: 'watchWallet',
            args: [
              cleanAddress,
              label.trim(),
              watchIncoming,
              watchOutgoing,
              watchERC20,
              watchNFT,
              minWei,
            ],
          });
          isOnChainSuccess = true;
        } catch (contractErr: any) {
          console.warn('Smart contract transaction skipped or cancelled:', contractErr);
        }
      }

      const newWallet: WatchedWallet = {
        id: 'w-' + Date.now(),
        target: cleanAddress,
        label: label.trim(),
        watchIncoming,
        watchOutgoing,
        watchERC20,
        watchNFT,
        minThresholdWei: '0',
        minThresholdBOT: thresholdBOT || '0',
        addedAt: Date.now(),
        isTreasury,
        balanceBOT: realBalance,
        isOnChain: isOnChainSuccess,
      };

      onAdd(newWallet);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add wallet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Wallet to Watchlist</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.86rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">BOT Chain Address to Watch</label>
            <input
              type="text"
              className="form-input"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custom Label</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Treasury, Cold Wallet, Client Escrow"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Alert Trigger Preferences</label>
            <div className="form-checkbox-grid">
              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={watchIncoming}
                  onChange={(e) => setWatchIncoming(e.target.checked)}
                />
                <span>📥 Incoming BOT</span>
              </label>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={watchOutgoing}
                  onChange={(e) => setWatchOutgoing(e.target.checked)}
                />
                <span>📤 Outgoing BOT</span>
              </label>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={watchERC20}
                  onChange={(e) => setWatchERC20(e.target.checked)}
                />
                <span>🪙 ERC-20 Tokens</span>
              </label>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={watchNFT}
                  onChange={(e) => setWatchNFT(e.target.checked)}
                />
                <span>🖼️ NFT Activity</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Minimum Transfer Threshold (BOT)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0.0"
              value={thresholdBOT}
              onChange={(e) => setThresholdBOT(e.target.value)}
            />
            <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Transfers smaller than this amount will be ignored to prevent dust spam.
            </span>
          </div>

          <div className="form-group">
            <label className="checkbox-card" style={{ marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={isTreasury}
                onChange={(e) => setIsTreasury(e.target.checked)}
              />
              <span>Mark as Project / Organization Treasury</span>
            </label>

            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={recordOnChain}
                onChange={(e) => setRecordOnChain(e.target.checked)}
              />
              <span>Record subscription on BOT Chain Smart Contract</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              <ShieldCheck size={16} />
              <span>{loading ? 'Querying Chain...' : 'Start Watching'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
