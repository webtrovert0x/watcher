import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import solc from 'solc';
import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const rawPrivateKey = process.env.PRIVATE_KEY;
if (!rawPrivateKey) {
  console.error('❌ Error: PRIVATE_KEY not found in .env.local');
  process.exit(1);
}

const privateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`;
const account = privateKeyToAccount(privateKey);

const botMainnet = defineChain({
  id: 677,
  name: 'BOT Chain Mainnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.botchain.ai'] },
    public: { http: ['https://rpc.botchain.ai'] },
  },
  blockExplorers: {
    default: { name: 'BotScan', url: 'https://scan.botchain.ai' },
  },
});

const publicClient = createPublicClient({
  chain: botMainnet,
  transport: http('https://rpc.botchain.ai'),
});

const walletClient = createWalletClient({
  account,
  chain: botMainnet,
  transport: http('https://rpc.botchain.ai'),
});

async function main() {
  console.log('--------------------------------------------------');
  console.log('🚀 Deploying BOTWalletWatcher to BOT Chain Mainnet');
  console.log('🌐 Chain ID: 677 | RPC: https://rpc.botchain.ai');
  console.log('👤 Deployer Address:', account.address);

  const balance = await publicClient.getBalance({ address: account.address });
  const balanceBOT = Number(balance) / 1e18;
  console.log(`💰 Deployer Balance: ${balanceBOT.toFixed(6)} BOT`);

  const gasPrice = await publicClient.getGasPrice();
  console.log(`⛽ Current Network Gas Price: ${Number(gasPrice) / 1e9} Gwei (${gasPrice.toString()} wei)`);

  console.log('🔨 Compiling BOTWalletWatcher.sol with solc 0.8.20 (optimized for minimum deployment gas)...');
  const contractPath = path.resolve(process.cwd(), 'contracts/BOTWalletWatcher.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'BOTWalletWatcher.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 1, // lowest bytecode size for minimum deployment gas fee
      },
      evmVersion: 'paris',
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    for (const err of output.errors) {
      if (err.severity === 'error') {
        console.error('Compile error:', err.formattedMessage);
        hasError = true;
      }
    }
    if (hasError) process.exit(1);
  }

  const compiled = output.contracts['BOTWalletWatcher.sol']['BOTWalletWatcher'];
  const abi = compiled.abi;
  const bytecode = `0x${compiled.evm.bytecode.object}`;

  console.log(`📦 Bytecode Size: ${bytecode.length / 2} bytes`);

  // Estimate gas
  const gasEstimate = await publicClient.estimateGas({
    account: account.address,
    data: bytecode,
  });
  console.log(`📊 Estimated Gas: ${gasEstimate.toString()} units`);
  
  const estimatedCostWei = gasEstimate * gasPrice;
  const estimatedCostBOT = Number(estimatedCostWei) / 1e18;
  console.log(`💵 Estimated Total Gas Fee: ~${estimatedCostBOT.toFixed(6)} BOT`);

  if (balance < estimatedCostWei) {
    console.error(`❌ Insufficient funds! Needed ~${estimatedCostBOT.toFixed(6)} BOT, have ${balanceBOT.toFixed(6)} BOT`);
    process.exit(1);
  }

  // Safety buffer of 5% on gas limit
  const gasLimit = (gasEstimate * 105n) / 100n;

  console.log('📡 Broadcasting optimized deployment transaction...');
  const txHash = await walletClient.deployContract({
    abi,
    bytecode,
    gas: gasLimit,
    gasPrice,
  });

  console.log('⏳ Tx Hash:', txHash);
  console.log('Waiting for block confirmation on BOT Chain Mainnet...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const contractAddress = receipt.contractAddress;
  const actualGasUsed = receipt.gasUsed;
  const actualFeeBOT = Number(actualGasUsed * gasPrice) / 1e18;

  console.log('--------------------------------------------------');
  console.log('🎉 CONTRACT DEPLOYED ON MAINNET!');
  console.log('📍 Contract Address:', contractAddress);
  console.log(`⚡ Gas Used: ${actualGasUsed.toString()} units`);
  console.log(`💸 Actual Gas Fee Paid: ${actualFeeBOT.toFixed(6)} BOT`);
  console.log('🔍 Explorer Link:', `https://scan.botchain.ai/address/${contractAddress}`);
  console.log('--------------------------------------------------');

  // Update ABI file
  const abiFilePath = path.resolve(process.cwd(), 'src/contracts/BOTWalletWatcherABI.ts');
  if (fs.existsSync(abiFilePath)) {
    let abiFileContent = fs.readFileSync(abiFilePath, 'utf8');
    abiFileContent = abiFileContent.replace(
      /export const BOT_WALLET_WATCHER_ADDRESS = "0x[a-fA-F0-9]{40}" as `0x\$\{string\}`;/,
      `export const BOT_WALLET_WATCHER_ADDRESS = "${contractAddress}" as \`0x\${string}\`;`
    );
    fs.writeFileSync(abiFilePath, abiFileContent, 'utf8');
  }

  // Update .env.local
  let envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent = envContent.replace(/BOT_RPC_URL=.*/g, 'BOT_RPC_URL=https://rpc.botchain.ai');
  envContent = envContent.replace(/BOT_CHAIN_ID=.*/g, 'BOT_CHAIN_ID=677');
  envContent = envContent.replace(/BOT_EXPLORER_URL=.*/g, 'BOT_EXPLORER_URL=https://scan.botchain.ai');
  envContent = envContent.replace(/VITE_CONTRACT_ADDRESS=.*/g, `VITE_CONTRACT_ADDRESS=${contractAddress}`);
  envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${contractAddress}`);
  fs.writeFileSync(envLocalPath, envContent, 'utf8');

  console.log('⏳ Waiting 5s before submitting verification to scan.botchain.ai...');
  await new Promise((r) => setTimeout(r, 5000));

  try {
    const verifyParams = new URLSearchParams();
    verifyParams.append('module', 'contract');
    verifyParams.append('action', 'verifysourcecode');
    verifyParams.append('codeformat', 'solidity-standard-json-input');
    verifyParams.append('contractaddress', contractAddress);
    verifyParams.append('contractname', 'BOTWalletWatcher.sol:BOTWalletWatcher');
    verifyParams.append('compilerversion', 'v0.8.20+commit.a1b79de6');
    verifyParams.append('sourceCode', JSON.stringify(input));

    const verifyRes = await fetch('https://scan.botchain.ai/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });

    const verifyData = await verifyRes.json();
    console.log('Verification Submission:', verifyData);

    if (verifyData.result) {
      const guid = verifyData.result;
      console.log(`Checking verification GUID (${guid})...`);
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const statusRes = await fetch(
          `https://scan.botchain.ai/api?module=contract&action=checkverifystatus&guid=${guid}`
        );
        const statusData = await statusRes.json();
        console.log(`[Attempt ${i + 1}] Status:`, statusData.result);
        if (statusData.result && statusData.result.includes('Pass')) {
          console.log('🏆 VERIFICATION SUCCESSFUL ON BOTSCAN!');
          console.log('🔗 Verified Contract:', `https://scan.botchain.ai/address/${contractAddress}#code`);
          return;
        }
      }
    }
  } catch (err) {
    console.warn('Verification attempt note:', err.message);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
