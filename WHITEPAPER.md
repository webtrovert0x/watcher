# BOT Wallet Watcher Whitepaper
### Decentralized On-Chain Activity Monitoring & Real-Time Alert Infrastructure on BOT Chain
**Version 1.0 • October 2026**  
**Network:** BOT Chain Mainnet (Chain ID: `677`)  
**Mainnet Smart Contract:** [`0x78d6f5a35149798c7985090ebc01c58cae01429f`](https://scan.botchain.ai/address/0x78d6f5a35149798c7985090ebc01c58cae01429f)  
**Telegram Alert Bot:** [`@wallet_watcher_on_bot`](https://t.me/wallet_watcher_on_bot)

---

## 1. Executive Summary

As decentralized applications, treasuries, and freelance economies expand on **BOT Chain**, users and organizations face a critical blind spot: the lack of push-based observability for blockchain addresses. Blockchains are passive ledgers that do not push notifications when transactions occur. Users are forced to manually refresh block explorers, often discovering critical transactions—such as incoming client payments or unauthorized wallet drains—hours or days too late.

**BOT Wallet Watcher** introduces an autonomous, event-driven monitoring service that bridges on-chain registry contracts with off-chain indexing infrastructure and sub-second Telegram push notifications. By combining a verified registry smart contract (`BOTWalletWatcher.sol`) on BOT Chain with an off-chain block ingestion worker, users can subscribe to any wallet address, define fine-grained alert criteria (incoming, outgoing, ERC-20 token movements, and value thresholds), and receive instant notifications directly to Telegram and an interactive dashboard.

---

## 2. The Problem Statement

### 2.1 The Latency & Exploratory Burden
Block explorers such as BotScan (`scan.botchain.ai`) provide robust diagnostic interfaces, but they require active human polling. Users must remember to visit the website, paste an address, and review the recent block history.

### 2.2 Critical Risks for Web3 Stakeholders
1. **Freelancers & Service Providers**: Inability to immediately know when a client has fulfilled an on-chain milestone or escrow deposit.
2. **Project Treasuries & DAOs**: Teams overseeing marketing wallets, developer grants, and operational vaults need immediate visibility when funds move to prevent mismanagement or detect unauthorized multi-sig executions.
3. **Wallet Security & Drain Detection**: When private keys or approvals are compromised, rapid response within seconds is the only hope of revoking allowances or migrating remaining assets. Without instant push alerts, victims only notice losses when opening their wallet days later.
4. **Token & NFT Liquidity Tracking**: DeFi participants and collectors have no native mechanism to track token inflows or NFT transfers without third-party centralized trackers that frequently omit emerging networks like BOT Chain.

---

## 3. System Architecture

BOT Wallet Watcher is designed as a hybrid on-chain / off-chain reactive pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BOT Chain Mainnet (Chain ID: 677)                │
│                                                                             │
│   ┌────────────────────────┐                   ┌────────────────────────┐   │
│   │   Incoming / Outgoing  │                   │  BOTWalletWatcher.sol  │   │
│   │   Transactions & Logs  │                   │  (On-Chain Registry)   │   │
│   └───────────┬────────────┘                   └───────────┬────────────┘   │
└───────────────┼────────────────────────────────────────────┼────────────────┘
                │ Raw Blocks & Event Logs                    │ Emits: WalletWatched()
                │ (JSON-RPC https://rpc.botchain.ai)         │ Emits: PreferencesUpdated()
                ▼                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Off-Chain Indexing Worker                          │
│                                                                             │
│  - Continuous Block Poller (eth_getBlockByNumber)                           │
│  - Log Scraper (eth_getLogs for ERC-20 Transfer 0xddf252a...)               │
│  - Dynamic Rule Evaluator (Thresholds, Direction, Token Filters)            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         Sub-Second Push Notification
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│     Telegram Push Engine     │              │     Web App Dashboard        │
│   (@wallet_watcher_on_bot)   │              │   (Reown AppKit + Wagmi v2)  │
│ - Instant Mobile Delivery    │              │ - Live Block Activity Stream │
│ - Rich Markdown Card         │              │ - Real-Time BOT Balance Sync │
│ - Direct Explorer Deep-Links │              │ - Multi-Vault Treasury View  │
└──────────────────────────────┘              └──────────────────────────────┘
```

---

## 4. On-Chain Smart Contract: `BOTWalletWatcher.sol`

The smart contract serves as the decentralized source of truth for watchlist ownership and rule configuration.

### 4.1 Data Structure & State Layout
```solidity
struct WatchConfig {
    address target;           // Address monitored
    string label;             // User-assigned label (e.g. "Main Treasury")
    bool watchIncoming;       // Alert on received funds
    bool watchOutgoing;       // Alert on dispatched funds
    bool watchERC20;          // Alert on ERC-20 token movements
    bool watchNFT;            // Alert on NFT mints/transfers
    uint256 minThresholdWei;  // Value threshold (0 = all amounts)
    uint256 addedAt;          // Timestamp of subscription
    bool active;              // Subscription state
}
```

### 4.2 Core Interface Functions
* `watchWallet(address target, string label, bool watchIncoming, bool watchOutgoing, bool watchERC20, bool watchNFT, uint256 minThresholdWei)`: Registers a new address under `msg.sender`'s portfolio and emits `WalletWatched(...)`.
* `updatePreferences(address target, string label, ...)`: Modifies alert preferences with cryptographic authorization (`msg.sender` ownership validation).
* `unwatchWallet(address target)`: Deactivates monitoring and frees registry mappings.
* `getMyWatchlist(address subscriber)`: **Zero-gas view function** enabling frontends and external nodes to read the full portfolio state in milliseconds.
* `getAllMonitoredTargets()`: Master query function for indexer workers to ingest the complete set of network-monitored addresses.

### 4.3 Contract Details
* **Contract Address:** [`0x78d6f5a35149798c7985090ebc01c58cae01429f`](https://scan.botchain.ai/address/0x78d6f5a35149798c7985090ebc01c58cae01429f)
* **Compiler:** Solidity `v0.8.20+commit.a1b79de6`
* **Optimization:** Enabled (`1` run for minimal deployment gas fee)
* **EVM Target:** `paris`
* **Network:** BOT Chain Mainnet (Chain ID: 677)

---

## 5. Off-Chain Indexing & Real-Time Detection

Because EVM smart contracts cannot autonomously trigger network I/O or HTTP webhooks, the off-chain worker operates as an active sentinel:

### 5.1 Native BOT Ingestion
For every newly mined block on BOT Chain:
1. The engine queries `eth_getBlockByNumber(blockNumber, true)`.
2. Inspects all transactions within the block.
3. Checks if `tx.to` or `tx.from` matches any monitored address.
4. Validates direction flags (`watchIncoming` vs. `watchOutgoing`).
5. Checks against the user's defined minimum threshold (allowing sub-BOT amounts down to `0.0001 BOT` while filtering zero-value dust spam).

### 5.2 ERC-20 & Multi-Token Tracking
Standard EVM tokens emit event logs rather than native value transfers. BOT Wallet Watcher indexes logs matching the keccak256 hash of `Transfer(address,address,uint256)`:
```
Topic0: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
```
* Decodes `from = log.topics[1]` and `to = log.topics[2]`.
* Dynamically resolves token metadata (`symbol()` and `decimals()`) with in-memory caching to minimize RPC latency.
* Computes exact human-readable balances for tokens like `bUSDC`, `bUSDT`, and ecosystem governance tokens.

---

## 6. Telegram Alert Pipeline

Telegram is selected as the primary notification medium for its high uptime, global accessibility, and push delivery speed.

### 6.1 Dispatch Format
When activity is detected, the engine formats an HTML message with contextual badges:

```html
🚨 BOT Chain Transfer Detected

🏷️ Watched Wallet: Main Treasury (0x71C8...7890)
⚡ Event: 📥 Incoming Transfer Received
💰 Amount: 25.5000 BOT
👤 Sender (From): 0x88fA1230...17dE01
📦 Block: #26395120

🔗 View on BohrScan Explorer: https://scan.bohr.life/tx/0x...
⏱️ 19:30:15 UTC
```

### 6.2 Key Alert Guarantees
* **Clear Directional Clarity**: Explicitly distinguishes between sender (`From`) and recipient (`To`).
* **Sub-BOT Precision**: Captures small micro-transactions and token payouts without arbitrary minimum thresholds.
* **Explorer Integrity**: Generates direct, verifiable links to BotScan for immediate validation.

---

## 7. Tokenomics & BOT Chain Integration

| Parameter | Specification |
| :--- | :--- |
| **Network** | BOT Chain Mainnet |
| **Chain ID** | `677` |
| **Native Currency** | `BOT` (18 Decimals) |
| **Total Supply** | 150 Million BOT |
| **RPC Endpoint** | `https://rpc.botchain.ai` |
| **Explorer** | `https://scan.botchain.ai` |

* **Zero-Cost Consumption**: Reading watchlists, querying balances, and evaluating logs costs zero gas.
* **Micro-Gas Registry**: Adding, updating, or removing watchlists costs fractions of a cent on BOT Chain (~0.0001 BOT).
* **Future Staking / Utility**: Future protocol versions will enable staking BOT tokens to unlock higher API rate limits, multi-channel webhook dispatching (Discord, Slack, SMS), and automated security actions.

---

## 8. Security & Privacy Model

1. **Non-Custodial Architecture**: The protocol never requests private keys, signing phrases, or transfer permissions. It monitors public ledger state.
2. **Permissioned Mutations**: Only the address that added a target wallet can update its preferences or remove it from the on-chain registry (`msg.sender` validation).
3. **Dust Attack Mitigation**: User-defined minimum value thresholds prevent attackers from flooding Telegram chats with dust transactions.
4. **Resilient Redundancy**: If the web frontend is unavailable, the on-chain registry remains immutable on BOT Chain, allowing any node or alternate frontend to read subscriptions.

---

## 9. Product Roadmap

* **Phase 1: Foundation (Completed)**
  * [x] Design and deploy `BOTWalletWatcher.sol` on BOT Chain Testnet.
  * [x] Verify smart contract on BohrScan.
  * [x] Build modern glassmorphic dashboard with Reown AppKit and Wagmi v2.
  * [x] Integrate live Telegram Bot (`@wallet_watcher_on_bot`).
  * [x] Implement sub-BOT and ERC-20 transfer tracking.

* **Phase 2: Protocol Expansion (Q4 2026)**
  * [ ] Multi-channel notifications: Discord webhooks and Slack bot integration.
  * [ ] Automated Smart Contract Call decoding (tracking DEX swaps and DeFi approvals).
  * [ ] Email alert digest for enterprise compliance and auditor workflows.

* **Phase 3: Mainnet & Governance (2027)**
  * [ ] BOT Chain Mainnet deployment.
  * [ ] Decentralized keeper network for multi-node indexer redundancy.
  * [ ] Watchlist export / import across multi-chain ecosystems.

---

## 10. Conclusion

BOT Wallet Watcher transforms BOT Chain from a passive ledger into a proactive, event-driven ecosystem. By providing real-time visibility into incoming payments, treasury flows, and token transfers, the protocol empowers freelancers, DAO operators, and Web3 developers with the intelligence and speed needed to protect and manage on-chain assets.

* **Explore the Code**: [`contracts/BOTWalletWatcher.sol`](file:///Users/mac/Desktop/wallet%20watcher%20/contracts/BOTWalletWatcher.sol)  
* **Explorer Contract Link**: [BotScan Contract](https://scan.botchain.ai/address/0x78d6f5a35149798c7985090ebc01c58cae01429f)  
* **Telegram Bot**: [t.me/wallet_watcher_on_bot](https://t.me/wallet_watcher_on_bot)
