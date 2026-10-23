import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { QueryClient } from '@tanstack/react-query';
import { botMainnet } from './chains';

// 1. Get ProjectId from env or use public placeholder
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'b8e96bf71b308e7df59265f04b2b1a6a';

export const queryClient = new QueryClient();

// 2. Define networks
export const networks = [botMainnet] as const;

// 3. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId,
  networks: [botMainnet],
});

// 4. Create AppKit modal instance
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botMainnet],
  projectId,
  metadata: {
    name: 'BOT Wallet Watcher',
    description: 'On-chain wallet monitoring and Telegram alert service on BOT Chain Mainnet',
    url: 'https://scan.botchain.ai',
    icons: ['https://scan.botchain.ai/favicon.ico'],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00f2fe',
    '--w3m-border-radius-master': '12px',
  },
  defaultNetwork: botMainnet,
});

export const config = wagmiAdapter.wagmiConfig;
