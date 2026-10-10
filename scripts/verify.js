import fs from 'fs';
import path from 'path';

const CONTRACT_ADDRESS = '0x663372fce3da4ef9f34fe4eefdedd5cbb2d01f8a';
const contractPath = path.resolve(process.cwd(), 'contracts/BOTWalletWatcher.sol');
const sourceCode = fs.readFileSync(contractPath, 'utf8');

async function testVerification() {
  console.log('Testing Blockscout v2 verification endpoint for', CONTRACT_ADDRESS);

  const payload = {
    compiler_version: 'v0.8.37+commit.f401782d',
    contract_name: 'BOTWalletWatcher',
    source_code: sourceCode,
    is_optimization_enabled: true,
    optimization_runs: 200,
    evm_version: 'default',
    constructor_args: '',
  };

  const url = `https://scan.bohr.life/api/v2/smart-contracts/${CONTRACT_ADDRESS}/verification/via/flattened-code`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testVerification();
