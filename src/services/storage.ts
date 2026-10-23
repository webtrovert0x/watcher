import type { WatchedWallet, DetectedTransaction } from '../types';

const STORAGE_KEY_WALLETS = 'bot_watcher_wallets_v2';
const STORAGE_KEY_TXS = 'bot_watcher_txs_v2';
const STORAGE_KEY_TELEGRAM = 'bot_watcher_tg_settings';

export function getStoredWallets(): WatchedWallet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WALLETS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredWallets(wallets: WatchedWallet[]) {
  try {
    localStorage.setItem(STORAGE_KEY_WALLETS, JSON.stringify(wallets));
  } catch (err) {
    console.error('Failed to save wallets to storage:', err);
  }
}

export function getStoredTransactions(): DetectedTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TXS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredTransactions(txs: DetectedTransaction[]) {
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

export function getTelegramSettings(): TelegramSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TELEGRAM);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        botToken: parsed.botToken || '',
        chatId: parsed.chatId || '',
        linked: Boolean(parsed.linked),
      };
    }
    return { botToken: '', chatId: '', linked: false };
  } catch {
    return { botToken: '', chatId: '', linked: false };
  }
}

export function saveTelegramSettings(settings: TelegramSettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY_TELEGRAM, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save telegram settings:', err);
  }
}

export function clearTelegramSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY_TELEGRAM);
  } catch (err) {
    console.error('Failed to clear telegram settings:', err);
  }
}
