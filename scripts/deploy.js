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

const botTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.BOT_RPC_URL || 'https://rpc.bohr.life'] },
  },
});

const publicClient = createPublicClient({
  chain: botTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: botTestnet,
  transport: http(),
});

async function main() {
  console.log('--------------------------------------------------');
  console.log('🚀 Deploying & Verifying BOTWalletWatcher on BOT Chain (ID: 968)');
  console.log('👤 Deployer Address:', account.address);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Deployer Balance: ${Number(balance) / 1e18} BOT`);

  console.log('🔨 Compiling BOTWalletWatcher.sol with solc 0.8.20 (evmVersion: paris)...');
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
        runs: 200,
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

  console.log('📡 Broadcasting deployment transaction to BOT Chain...');
  const txHash = await walletClient.deployContract({
    abi,
    bytecode,
  });

  console.log('⏳ Tx Hash:', txHash);
  console.log('Waiting for block confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const contractAddress = receipt.contractAddress;

  console.log('--------------------------------------------------');
  console.log('🎉 CONTRACT DEPLOYED!');
  console.log('📍 Contract Address:', contractAddress);
  console.log('🔍 Explorer Link:', `https://scan.bohr.life/address/${contractAddress}`);
  console.log('--------------------------------------------------');

  // Update ABI file
  const abiFilePath = path.resolve(process.cwd(), 'src/contracts/BOTWalletWatcherABI.ts');
  let abiFileContent = fs.readFileSync(abiFilePath, 'utf8');
  abiFileContent = abiFileContent.replace(
    /export const BOT_WALLET_WATCHER_ADDRESS = "0x[a-fA-F0-9]{40}" as `0x\$\{string\}`;/,
    `export const BOT_WALLET_WATCHER_ADDRESS = "${contractAddress}" as \`0x\${string}\`;`
  );
  fs.writeFileSync(abiFilePath, abiFileContent, 'utf8');

  // Update .env.local
  let envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent = envContent.replace(/VITE_CONTRACT_ADDRESS=.*/g, `VITE_CONTRACT_ADDRESS=${contractAddress}`);
  envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${contractAddress}`);
  if (!envContent.includes('VITE_CONTRACT_ADDRESS')) {
    envContent += `\nVITE_CONTRACT_ADDRESS=${contractAddress}\nCONTRACT_ADDRESS=${contractAddress}\n`;
  }
  fs.writeFileSync(envLocalPath, envContent, 'utf8');

  console.log('⏳ Waiting 5 seconds for block indexer before verification...');
  await new Promise((r) => setTimeout(r, 5000));

  console.log('📡 Submitting verification request to BohrScan (Blockscout API)...');
  const verifyParams = new URLSearchParams();
  verifyParams.append('module', 'contract');
  verifyParams.append('action', 'verifysourcecode');
  verifyParams.append('codeformat', 'solidity-standard-json-input');
  verifyParams.append('contractaddress', contractAddress);
  verifyParams.append('contractname', 'BOTWalletWatcher.sol:BOTWalletWatcher');
  verifyParams.append('compilerversion', 'v0.8.20+commit.a1b79de6');
  verifyParams.append('sourceCode', JSON.stringify(input));

  const verifyRes = await fetch('https://scan.bohr.life/api', {
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
        `https://scan.bohr.life/api?module=contract&action=checkverifystatus&guid=${guid}`
      );
      const statusData = await statusRes.json();
      console.log(`[Attempt ${i + 1}] Status:`, statusData.result);
      if (statusData.result && statusData.result.includes('Pass')) {
        console.log('--------------------------------------------------');
        console.log('🏆 VERIFICATION SUCCESSFUL!');
        console.log('🔗 Verified Contract:', `https://scan.bohr.life/address/${contractAddress}#code`);
        console.log('--------------------------------------------------');
        return;
      }
    }
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
