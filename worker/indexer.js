/**
 * BOT Wallet Watcher - Off-Chain Indexer & Block Worker
 * Monitors BOT Chain Testnet (Chain ID: 968, RPC: https://rpc.bohr.life)
 * Detects native BOT transfers, ERC-20 transfers (any amount), and sends real-time Telegram alerts.
 */

import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { TelegramNotifier } from './telegramBot.js';

const RPC_URL = process.env.BOT_RPC_URL || 'https://rpc.bohr.life';
const CHAIN_ID = 968;

const client = createPublicClient({
  transport: http(RPC_URL),
});

const telegram = new TelegramNotifier(
  process.env.TELEGRAM_BOT_TOKEN || '',
  process.env.TELEGRAM_CHAT_ID
);

const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Dynamic watchlist populated from on-chain contract or configured addresses
export const watchlist = new Map();

console.log('--------------------------------------------------');
console.log('🤖 BOT Wallet Watcher Worker Initialized');
console.log(`🌐 Connected RPC: ${RPC_URL} (Chain ID: ${CHAIN_ID})`);
console.log('--------------------------------------------------');

let lastCheckedBlock = null;

/**
 * Scan a specific block for transactions matching the watchlist
 */
export async function processBlock(blockNumber) {
  try {
    const block = await client.getBlock({
      blockNumber,
      includeTransactions: true,
    });

    if (!block || !block.transactions) return [];

    const matches = [];

    // 1. Check Native Transfers (Any amount >= minThreshold, default 0.0)
    for (const tx of block.transactions) {
      if (typeof tx === 'string') continue;

      const from = tx.from?.toLowerCase();
      const to = tx.to?.toLowerCase();
      const valNum = parseFloat(formatEther(tx.value || 0n));

      // Incoming to Watched Wallet
      if (to && watchlist.has(to)) {
        const config = watchlist.get(to);
        const threshold = parseFloat(config.minThresholdEth || '0');

        if (config.watchIncoming !== false && valNum >= threshold) {
          const alert = {
            chatId: config.chatId,
            label: config.label || 'Watched Wallet',
            watchedAddress: tx.to,
            direction: 'INCOMING',
            tokenSymbol: 'BOT',
            amountFormatted: valNum.toFixed(4),
            counterparty: tx.from,
            txHash: tx.hash,
            blockNumber: block.number.toString(),
          };
          matches.push(alert);
          await telegram.sendTransferAlert(alert);
        }
      }

      // Outgoing from Watched Wallet
      if (from && watchlist.has(from)) {
        const config = watchlist.get(from);
        const threshold = parseFloat(config.minThresholdEth || '0');

        if (config.watchOutgoing !== false && valNum >= threshold) {
          const alert = {
            chatId: config.chatId,
            label: config.label || 'Watched Wallet',
            watchedAddress: tx.from,
            direction: 'OUTGOING',
            tokenSymbol: 'BOT',
            amountFormatted: valNum.toFixed(4),
            counterparty: tx.to || 'Contract Deployment',
            txHash: tx.hash,
            blockNumber: block.number.toString(),
          };
          matches.push(alert);
          await telegram.sendTransferAlert(alert);
        }
      }
    }

    // 2. Check ERC-20 / NFT Logs in this Block
    try {
      const logs = await client.getLogs({
        blockHash: block.hash,
        topics: [ERC20_TRANSFER_TOPIC],
      });

      for (const log of logs) {
        if (!log.topics[1] || !log.topics[2]) continue;

        const from = `0x${log.topics[1].slice(26)}`.toLowerCase();
        const to = `0x${log.topics[2].slice(26)}`.toLowerCase();

        const isToWatched = watchlist.has(to);
        const isFromWatched = watchlist.has(from);

        if (isToWatched || isFromWatched) {
          const config = isToWatched ? watchlist.get(to) : watchlist.get(from);

          if (config.watchERC20 !== false) {
            let rawVal = 0n;
            try { rawVal = BigInt(log.data); } catch { rawVal = 0n; }
            const formattedAmount = parseFloat(formatUnits(rawVal, 18)).toFixed(4);

            const alert = {
              chatId: config.chatId,
              label: config.label || 'Watched Wallet',
              watchedAddress: isToWatched ? `0x${log.topics[2].slice(26)}` : `0x${log.topics[1].slice(26)}`,
              direction: isToWatched ? 'INCOMING' : 'OUTGOING',
              tokenSymbol: 'TOKEN',
              amountFormatted: formattedAmount,
              counterparty: isToWatched ? `0x${log.topics[1].slice(26)}` : `0x${log.topics[2].slice(26)}`,
              txHash: log.transactionHash,
              blockNumber: block.number.toString(),
            };
            matches.push(alert);
            await telegram.sendTransferAlert(alert);
          }
        }
      }
    } catch (logErr) {
      // ignore empty logs
    }

    return matches;
  } catch (error) {
    console.error(`Error processing block ${blockNumber}:`, error.message);
    return [];
  }
}

/**
 * Main polling loop
 */
export async function startWorker() {
  console.log('🚀 Worker polling started. Listening for blocks on BOT Chain...');

  setInterval(async () => {
    try {
      const currentBlockNumber = await client.getBlockNumber();

      if (!lastCheckedBlock) {
        lastCheckedBlock = currentBlockNumber - 1n;
      }

      while (lastCheckedBlock < currentBlockNumber) {
        lastCheckedBlock++;
        const found = await processBlock(lastCheckedBlock);
        if (found.length > 0) {
          console.log(`🚨 Detected ${found.length} transfer(s) in block #${lastCheckedBlock}!`);
        }
      }
    } catch (err) {
      console.warn('Block check retry in next tick:', err.message);
    }
  }, 4000);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startWorker();
}
