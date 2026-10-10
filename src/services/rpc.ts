import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { botTestnet } from '../config/chains';
import type { DetectedTransaction, WatchedWallet } from '../types';

export const botPublicClient = createPublicClient({
  chain: botTestnet,
  transport: http('https://rpc.bohr.life'),
});

// ERC-20 Transfer Event topic: Transfer(address indexed from, address indexed to, uint256 value)
const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Cache for token symbols and decimals to avoid redundant RPC calls
const tokenMetaCache = new Map<string, { symbol: string; decimals: number }>();

async function getTokenMetadata(tokenAddress: `0x${string}`): Promise<{ symbol: string; decimals: number }> {
  const lower = tokenAddress.toLowerCase();
  if (tokenMetaCache.has(lower)) {
    return tokenMetaCache.get(lower)!;
  }

  let symbol = 'TOKEN';
  let decimals = 18;

  try {
    const symbolRes = await botPublicClient.readContract({
      address: tokenAddress,
      abi: [{ name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] }],
      functionName: 'symbol',
    });
    if (symbolRes && typeof symbolRes === 'string') symbol = symbolRes;
  } catch {
    // fallback
  }

  try {
    const decimalsRes = await botPublicClient.readContract({
      address: tokenAddress,
      abi: [{ name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }],
      functionName: 'decimals',
    });
    if (typeof decimalsRes === 'number') decimals = decimalsRes;
  } catch {
    // fallback
  }

  const meta = { symbol, decimals };
  tokenMetaCache.set(lower, meta);
  return meta;
}

/**
 * Fetch real native BOT balance directly from BOT Chain RPC
 */
export async function getRealBotBalance(address: `0x${string}`): Promise<string> {
  try {
    const balanceWei = await botPublicClient.getBalance({ address });
    const formatted = parseFloat(formatEther(balanceWei));
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(formatted);
  } catch (error) {
    console.error(`Failed to fetch balance for ${address}:`, error);
    return '0.00';
  }
}

/**
 * Scan real blocks for BOTH native BOT transfers and ERC-20/NFT token transfers
 */
export async function scanRealBlocks(
  wallets: WatchedWallet[],
  fromBlockNumber?: bigint
): Promise<{ transactions: DetectedTransaction[]; latestBlock: bigint }> {
  try {
    const currentBlockNumber = await botPublicClient.getBlockNumber();
    if (wallets.length === 0) {
      return { transactions: [], latestBlock: currentBlockNumber };
    }

    const walletMap = new Map<string, WatchedWallet>();
    for (const w of wallets) {
      walletMap.set(w.target.toLowerCase(), w);
    }

    const startBlock = fromBlockNumber
      ? fromBlockNumber
      : currentBlockNumber > 4n
      ? currentBlockNumber - 4n
      : 1n;

    const detected: DetectedTransaction[] = [];

    // 1. Scan Blocks for Native BOT Transfers
    for (let b = startBlock; b <= currentBlockNumber; b++) {
      try {
        const block = await botPublicClient.getBlock({
          blockNumber: b,
          includeTransactions: true,
        });

        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (typeof tx === 'string') continue;

            const from = tx.from?.toLowerCase();
            const to = tx.to?.toLowerCase();
            const valNum = parseFloat(formatEther(tx.value || 0n));

            // Check if Watched Wallet is Recipient (Incoming)
            if (to && walletMap.has(to)) {
              const watched = walletMap.get(to)!;
              const threshold = parseFloat(watched.minThresholdBOT || '0');

              if (watched.watchIncoming && valNum >= threshold) {
                detected.push({
                  id: `tx-${tx.hash}-in`,
                  hash: tx.hash,
                  watchedAddress: watched.target,
                  label: watched.label,
                  counterparty: tx.from,
                  direction: 'INCOMING',
                  amount: valNum.toFixed(4),
                  tokenSymbol: 'BOT',
                  timestamp: new Date(Number(block.timestamp) * 1000).toLocaleTimeString(),
                  blockNumber: Number(block.number),
                  type: 'BOT',
                  status: 'CONFIRMED',
                });
              }
            }

            // Check if Watched Wallet is Sender (Outgoing)
            if (from && walletMap.has(from)) {
              const watched = walletMap.get(from)!;
              const threshold = parseFloat(watched.minThresholdBOT || '0');

              if (watched.watchOutgoing && valNum >= threshold) {
                detected.push({
                  id: `tx-${tx.hash}-out`,
                  hash: tx.hash,
                  watchedAddress: watched.target,
                  label: watched.label,
                  counterparty: tx.to || 'Contract Deployment',
                  direction: 'OUTGOING',
                  amount: valNum.toFixed(4),
                  tokenSymbol: 'BOT',
                  timestamp: new Date(Number(block.timestamp) * 1000).toLocaleTimeString(),
                  blockNumber: Number(block.number),
                  type: 'BOT',
                  status: 'CONFIRMED',
                });
              }
            }
          }
        }
      } catch (blockErr) {
        console.warn(`Error scanning block #${b}:`, blockErr);
      }
    }

    // 2. Scan Logs for ERC-20 / NFT Token Transfers
    try {
      const logs = await (botPublicClient as any).getLogs({
        fromBlock: startBlock,
        toBlock: currentBlockNumber,
        topics: [ERC20_TRANSFER_TOPIC],
      });

      for (const log of logs) {
        if (!log.topics[1] || !log.topics[2]) continue;

        const from = `0x${log.topics[1].slice(26)}`.toLowerCase();
        const to = `0x${log.topics[2].slice(26)}`.toLowerCase();

        const isToWatched = walletMap.has(to);
        const isFromWatched = walletMap.has(from);

        if (isToWatched || isFromWatched) {
          const watched = isToWatched ? walletMap.get(to)! : walletMap.get(from)!;

          if (watched.watchERC20) {
            const meta = await getTokenMetadata(log.address);
            let rawValue = 0n;
            try {
              rawValue = BigInt(log.data);
            } catch {
              rawValue = 0n;
            }

            const formattedTokenVal = parseFloat(formatUnits(rawValue, meta.decimals)).toFixed(4);

            detected.push({
              id: `log-${log.transactionHash}-${log.logIndex}`,
              hash: log.transactionHash,
              watchedAddress: watched.target,
              label: watched.label,
              counterparty: isToWatched ? (from as `0x${string}`) : (to as `0x${string}`),
              direction: isToWatched ? 'INCOMING' : 'OUTGOING',
              amount: formattedTokenVal,
              tokenSymbol: meta.symbol,
              timestamp: new Date().toLocaleTimeString(),
              blockNumber: Number(log.blockNumber),
              type: 'ERC20',
              status: 'CONFIRMED',
            });
          }
        }
      }
    } catch (logErr) {
      console.warn('Error fetching token logs:', logErr);
    }

    return { transactions: detected, latestBlock: currentBlockNumber };
  } catch (error) {
    console.error('Failed to scan BOT Chain blocks:', error);
    return { transactions: [], latestBlock: 0n };
  }
}

/**
 * Dispatch real Telegram message via Telegram Bot API with accurate labels
 */
export async function sendRealTelegramAlert({
  botToken,
  chatId,
  message,
}: {
  botToken: string;
  chatId: string;
  message: string;
}): Promise<{ ok: boolean; description?: string }> {
  if (!botToken || !chatId) {
    return { ok: false, description: 'Missing Bot Token or Chat ID' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}
