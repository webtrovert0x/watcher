export const BOT_WALLET_WATCHER_ABI = [
  {
    "type": "error",
    "name": "AlreadyWatching",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyLabel",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotWatching",
    "inputs": []
  },
  {
    "type": "event",
    "name": "PreferencesUpdated",
    "inputs": [
      { "name": "subscriber", "type": "address", "indexed": true },
      { "name": "target", "type": "address", "indexed": true },
      { "name": "label", "type": "string", "indexed": false },
      { "name": "minThresholdWei", "type": "uint256", "indexed": false },
      { "name": "watchIncoming", "type": "bool", "indexed": false },
      { "name": "watchOutgoing", "type": "bool", "indexed": false },
      { "name": "watchERC20", "type": "bool", "indexed": false },
      { "name": "watchNFT", "type": "bool", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "WalletUnwatched",
    "inputs": [
      { "name": "subscriber", "type": "address", "indexed": true },
      { "name": "target", "type": "address", "indexed": true },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "WalletWatched",
    "inputs": [
      { "name": "subscriber", "type": "address", "indexed": true },
      { "name": "target", "type": "address", "indexed": true },
      { "name": "label", "type": "string", "indexed": false },
      { "name": "minThresholdWei", "type": "uint256", "indexed": false },
      { "name": "watchIncoming", "type": "bool", "indexed": false },
      { "name": "watchOutgoing", "type": "bool", "indexed": false },
      { "name": "watchERC20", "type": "bool", "indexed": false },
      { "name": "watchNFT", "type": "bool", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "function",
    "name": "getAllMonitoredTargets",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMyWatchlist",
    "inputs": [{ "name": "subscriber", "type": "address" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "components": [
          { "name": "target", "type": "address" },
          { "name": "label", "type": "string" },
          { "name": "watchIncoming", "type": "bool" },
          { "name": "watchOutgoing", "type": "bool" },
          { "name": "watchERC20", "type": "bool" },
          { "name": "watchNFT", "type": "bool" },
          { "name": "minThresholdWei", "type": "uint256" },
          { "name": "addedAt", "type": "uint256" },
          { "name": "active", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSubscribers",
    "inputs": [{ "name": "target", "type": "address" }],
    "outputs": [{ "name": "", "type": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWatchConfig",
    "inputs": [
      { "name": "subscriber", "type": "address" },
      { "name": "target", "type": "address" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "target", "type": "address" },
          { "name": "label", "type": "string" },
          { "name": "watchIncoming", "type": "bool" },
          { "name": "watchOutgoing", "type": "bool" },
          { "name": "watchERC20", "type": "bool" },
          { "name": "watchNFT", "type": "bool" },
          { "name": "minThresholdWei", "type": "uint256" },
          { "name": "addedAt", "type": "uint256" },
          { "name": "active", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWatchCount",
    "inputs": [{ "name": "subscriber", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isWatching",
    "inputs": [
      { "name": "subscriber", "type": "address" },
      { "name": "target", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "unwatchWallet",
    "inputs": [{ "name": "target", "type": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updatePreferences",
    "inputs": [
      { "name": "target", "type": "address" },
      { "name": "label", "type": "string" },
      { "name": "watchIncoming", "type": "bool" },
      { "name": "watchOutgoing", "type": "bool" },
      { "name": "watchERC20", "type": "bool" },
      { "name": "watchNFT", "type": "bool" },
      { "name": "minThresholdWei", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "watchWallet",
    "inputs": [
      { "name": "target", "type": "address" },
      { "name": "label", "type": "string" },
      { "name": "watchIncoming", "type": "bool" },
      { "name": "watchOutgoing", "type": "bool" },
      { "name": "watchERC20", "type": "bool" },
      { "name": "watchNFT", "type": "bool" },
      { "name": "minThresholdWei", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;

// Default deployed address on BOT Chain Testnet (configurable via env / settings)
export const BOT_WALLET_WATCHER_ADDRESS = "0x78d6f5a35149798c7985090ebc01c58cae01429f" as `0x${string}`;
