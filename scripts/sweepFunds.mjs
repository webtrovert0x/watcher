import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const targetAddress = process.argv[2];

if (!targetAddress || !targetAddress.startsWith('0x') || targetAddress.length !== 42) {
  console.error('Usage: node scripts/sweepFunds.mjs <SAFE_DESTINATION_ADDRESS>');
  process.exit(1);
}

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error('PRIVATE_KEY not found in .env.local');
  process.exit(1);
}

const formattedPk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
const account = privateKeyToAccount(formattedPk);

const bohrChain = {
  id: 968,
  name: 'Bohr Chain',
  network: 'bohr',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.bohr.life'] },
    public: { http: ['https://rpc.bohr.life'] }
  }
};

const publicClient = createPublicClient({
  chain: bohrChain,
  transport: http('https://rpc.bohr.life')
});

const walletClient = createWalletClient({
  account,
  chain: bohrChain,
  transport: http('https://rpc.bohr.life')
});

const erc20Abi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)'
]);

async function sweep() {
  console.log(`[Sweeper] Compromised Address: ${account.address}`);
  console.log(`[Sweeper] Safe Destination:    ${targetAddress}`);

  // 1. Sweep USDT
  const usdtAddress = '0x75edc9335175fc0552d51d48439f229c10420fe3';
  try {
    const usdtBal = await publicClient.readContract({
      address: usdtAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log(`[USDT] Balance: ${Number(usdtBal) / 1e6} USDT (${usdtBal.toString()} units)`);
    if (usdtBal > 0n) {
      console.log(`[USDT] Sweeping to ${targetAddress}...`);
      const hash = await walletClient.writeContract({
        address: usdtAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [targetAddress, usdtBal]
      });
      console.log(`[USDT] SUCCESS! Tx Hash: https://scan.bohr.life/tx/${hash}`);
    }
  } catch (err) {
    console.error(`[USDT] Sweep error:`, err.message);
  }

  // 2. Sweep BCL Token
  const bclAddress = '0x13ad24fdf0843c9b3cc9adbe7c2ec55a48707086';
  try {
    const bclBal = await publicClient.readContract({
      address: bclAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log(`[BCL] Balance: ${Number(bclBal) / 1e18} BCL`);
    if (bclBal > 0n) {
      console.log(`[BCL] Sweeping to ${targetAddress}...`);
      const hash = await walletClient.writeContract({
        address: bclAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [targetAddress, bclBal]
      });
      console.log(`[BCL] SUCCESS! Tx Hash: https://scan.bohr.life/tx/${hash}`);
    }
  } catch (err) {
    console.error(`[BCL] Sweep error:`, err.message);
  }

  // 3. Sweep MDOGE
  const mdogeAddress = '0xf54395981de2c04e24ae348fbc8116e9736dfff7';
  try {
    const mdogeBal = await publicClient.readContract({
      address: mdogeAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log(`[MDOGE] Balance: ${mdogeBal.toString()}`);
    if (mdogeBal > 0n) {
      console.log(`[MDOGE] Sweeping to ${targetAddress}...`);
      const hash = await walletClient.writeContract({
        address: mdogeAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [targetAddress, mdogeBal]
      });
      console.log(`[MDOGE] SUCCESS! Tx Hash: https://scan.bohr.life/tx/${hash}`);
    }
  } catch (err) {
    console.error(`[MDOGE] Sweep error:`, err.message);
  }

  // 4. Sweep Native BOT
  try {
    const nativeBal = await publicClient.getBalance({ address: account.address });
    console.log(`[BOT Native] Balance: ${nativeBal.toString()} wei`);
    // Reserve ~0.02 BOT for gas buffer if needed, send the rest
    const reserve = 20000000000000000n; // 0.02 BOT
    if (nativeBal > reserve) {
      const amountToSend = nativeBal - reserve;
      console.log(`[BOT Native] Sweeping ${Number(amountToSend) / 1e18} BOT to ${targetAddress}...`);
      const hash = await walletClient.sendTransaction({
        to: targetAddress,
        value: amountToSend
      });
      console.log(`[BOT Native] SUCCESS! Tx Hash: https://scan.bohr.life/tx/${hash}`);
    }
  } catch (err) {
    console.error(`[BOT Native] Sweep error:`, err.message);
  }

  console.log(`[Sweeper] Sweep complete!`);
}

sweep();
