import fs from 'fs';
import path from 'path';

const CONTRACT_ADDRESS = '0x663372fce3da4ef9f34fe4eefdedd5cbb2d01f8a';
const contractPath = path.resolve(process.cwd(), 'contracts/BOTWalletWatcher.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const standardJson = {
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
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

async function verify() {
  console.log('Submitting standard JSON verification for', CONTRACT_ADDRESS);

  const params = new URLSearchParams();
  params.append('module', 'contract');
  params.append('action', 'verifysourcecode');
  params.append('codeformat', 'solidity-standard-json-input');
  params.append('contractaddress', CONTRACT_ADDRESS);
  params.append('contractname', 'BOTWalletWatcher.sol:BOTWalletWatcher');
  params.append('compilerversion', 'v0.8.37+commit.f401782d');
  params.append('sourceCode', JSON.stringify(standardJson));

  try {
    const res = await fetch('https://scan.bohr.life/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();
    console.log('API Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

verify();
