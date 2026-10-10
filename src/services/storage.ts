import type { WatchedWallet, DetectedTransaction } from '../types';

const STORAGE_KEY_WALLETS = 'bot_wallet_watcher_list_v2';
const STORAGE_KEY_TXS = 'bot_wallet_watcher_txs_v2';
const STORAGE_KEY_TELEGRAM = 'bot_wallet_watcher_telegram_v2';

export const INITIAL_WALLETS: WatchedWallet[] = [];
export const INITIAL_TRANSACTIONS: DetectedTransaction[] = [];

export function getStoredWallets(): WatchedWallet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WALLETS);
    return raw ? JSON.parse(raw) : INITIAL_WALLETS;
  } catch {
    return INITIAL_WALLETS;
  }
}

export function saveStoredWallets(wallets: WatchedWallet[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_WALLETS, JSON.stringify(wallets));
  } catch (err) {
    console.error('Failed to save wallets to storage:', err);
  }
}

export function getStoredTransactions(): DetectedTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TXS);
    return raw ? JSON.parse(raw) : INITIAL_TRANSACTIONS;
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export function saveStoredTransactions(txs: DetectedTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TXS, JSON.stringify(txs));
  } catch (err) {
    console.error('Failed to save transactions to storage:', err);
  }
}

export interface TelegramSettingsState {
  botToken: string;
  chatId: string;
  linked: boolean;
}

const DEFAULT_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';

export function getTelegramSettings(): TelegramSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TELEGRAM);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        botToken: parsed.botToken || DEFAULT_BOT_TOKEN,
      };
    }
    return { botToken: DEFAULT_BOT_TOKEN, chatId: '', linked: false };
  } catch {
    return { botToken: DEFAULT_BOT_TOKEN, chatId: '', linked: false };
  }
}

export function saveTelegramSettings(settings: TelegramSettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY_TELEGRAM, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save telegram settings:', err);
  }
}
