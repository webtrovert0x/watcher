export interface WatchedWallet {
  id: string;
  target: `0x${string}`;
  label: string;
  watchIncoming: boolean;
  watchOutgoing: boolean;
  watchERC20: boolean;
  watchNFT: boolean;
  minThresholdWei: string;
  minThresholdBOT: string;
  addedAt: number;
  isTreasury?: boolean;
  balanceBOT?: string;
  isOnChain?: boolean;
}

export interface DetectedTransaction {
  id: string;
  hash: string;
  watchedAddress: `0x${string}`;
  label: string;
  counterparty: string;
  direction: 'INCOMING' | 'OUTGOING';
  amount: string;
  tokenSymbol: string;
  timestamp: string;
  blockNumber: number;
  type: 'BOT' | 'ERC20' | 'NFT';
  status: 'CONFIRMED' | 'DISPATCHED_TO_TELEGRAM';
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  linkedWallet?: string;
  notificationsEnabled: boolean;
}
