# TicketChain — Universal Cross‑Chain NFT Ticketing on Push Chain

TicketChain is a full‑stack, production‑ready ticketing platform built on Push Chain testnet. It enables organizers to create events and sell NFT tickets, buyers to purchase and manage tickets, and communities to trade safely on a secondary marketplace — all with a single universal wallet session that works across EVM and Solana.

This README provides:
- Product overview and the business problems TicketChain solves
- Technical architecture and cross‑chain execution model
- Smart contracts and frontend integration points
- QR code verification system
- Deployment, environment, and troubleshooting guidance

---

## TL;DR

- One wallet session, many chains: Perform purchases and validations on Push while originating from Sepolia or Solana devnet.
- Primary sales + secondary market: List, buy, make offers, and batch list with escrow and royalties.
- Verifiable entry: QR generation, scanning, and on‑chain validation for venues.
- Modern UX: Search, filters, analytics, and real‑time explorer links.

---

## Business Problems Solved

- Fragmented wallet experience: Users typically must switch networks and juggle multiple wallets. TicketChain uses Push’s universal account to bridge and execute seamlessly on Push Chain.
- Fraud and re‑use risk: Tickets are NFTs with on‑chain validation and organizer workflows to mark usage, reducing counterfeit and duplicate entry.
- Opaque secondary sales: Marketplace with custody escrow, royalty enforcement, offers, and batch listing improves liquidity and fairness.
- Operational friction: Organizer tools for event setup, tiers, pricing, royalties, and QR scanning streamline the end‑to‑end flow.
- Discovery and conversions: Search and filter features reduce buyer friction and increase event visibility.

Outcomes:
- Higher conversion due to frictionless wallet onboarding
- Lower fraud and improved entry experience
- Better liquidity with transparent fees and enforced royalties
- Reduced support overhead via deterministic executor addresses

---

## Capabilities & User Journeys

Organizers:
- Create events and ticket tiers, set prices and royalties
- Validate tickets at entry with QR scanning and on‑chain checks
- Analyze sales and secondary market performance (stats components included)

Buyers:
- Purchase primary tickets on Push (bridging from origin when needed)
- Manage “My Tickets”, view QR codes, transfer or list for sale
- Make and accept offers in the secondary market

Power users:
- Batch list multiple tickets in a single transaction
- Use universal account for cross‑chain payments without network switching

---

## System Architecture

Smart Contracts (Push Chain testnet):
- [`contract TicketFactory`](contracts/TicketFactory.sol:17): event creation, ticket tiers, purchases, validation, batch functions
- [`contract TicketMarketplace`](contracts/TicketMarketplace.sol:17): escrow listings, buys, offers, batch list/cancel, per‑event stats
- [`contract TicketNFT`](contracts/TicketNFT.sol:16): ERC‑721 with metadata, “used” status, royalty via ERC2981

Frontend (React + Vite + TypeScript):
- Wallet & providers: [`PushChainProviders`](frontend/ticketchain/src/providers/PushChainProvider.tsx)
- Universal transactions and explorer links via `@pushchain/ui-kit`
- Reads via `wagmi` + `viem` + `ethers` with Push RPC
- UI features: search, filters, marketplace modals, QR generator/scanner

Docs & integration references:
- Push integration: [`push-chain-integration-guide.md`](docs/push-chain-integration-guide.md)
- Marketplace updates: [`enhanced-marketplace-implementation.md`](docs/enhanced-marketplace-implementation.md)
- Search features: [`event-search-implementation.md`](docs/event-search-implementation.md)
- QR system: [`qr-code-implementation.md`](docs/qr-code-implementation.md)

---

## Cross‑Chain Model: Origin vs UEA

- Origin address: user wallet on source chain (e.g., Sepolia EOA or Solana pubkey)
- UEA (Universal Executor Account): deterministic executor on Push; contracts see `msg.sender = UEA`
- Always resolve UEA for user‑specific reads and organizer checks; compare executor addresses stored on Push to enforce permissions and show correct ticket ownership

EVM origin (e.g., Sepolia):
- Universal writes work without forcing a Push‑native wallet switch
- Use `value` in PC for payments, or `funds` to bridge origin native within the call

Solana origin (devnet):
- Use the same `sendTransaction` API; the SDK handles fee‑locker and execution
- Ensure CAIP mapping to devnet RPC and sufficient SOL balance

---

## Features Overview

Primary sales:
- Create events and tiers, price in PC
- Purchase single or multiple tickets with universal transactions
- On‑chain validation of tickets by organizer accounts

Secondary market:
- Escrow listings with fair transfer and royalty enforcement
- Offers (make/cancel/accept) with optional expirations
- Batch list/cancel to reduce gas and clicks

Discovery & UX:
- Full‑text search, filters (status, date, sort), and result counts
- “My Tickets” management with QR codes and details
- Explorer links for instant transaction verification

Organizer tooling:
- QR scanning page and verification result cards
- Recommended workflows to prevent fraud and ensure smooth entry

---

## QR Code System

- Generation: `useQRCode` produces signed payloads with tokenId, eventId, owner, contract, chainId, and timestamp
- Display: `QRCodeDisplay` (size variants, download button, loading/error states)
- Scan: `QRScanner` (html5‑qrcode, mobile‑friendly) with real‑time feedback
- Verification: Organizer page confirms owner, usage status, and event match; highlight success/warn/error

Security note:
- Current implementation uses a simple hash; production should upgrade to cryptographic signing (ECDSA) and server‑side verification with rate limiting

Details: [`qr-code-implementation.md`](docs/qr-code-implementation.md)

---

## Search & Discovery

- Debounced search across names, descriptions, venues, organizers
- Status filters (upcoming/live/ended), date range, sort options
- Autocomplete and search history for better UX

Details: [`event-search-implementation.md`](docs/event-search-implementation.md)

---

## Secondary Marketplace Enhancements

- Offers: make, cancel, accept with expirations and refund paths
- Batch operations: list/cancel multiple tickets in one transaction (~90% gas savings for 10 tickets)
- Per‑event and per‑seller stats with view functions

Details: [`enhanced-marketplace-implementation.md`](docs/enhanced-marketplace-implementation.md)

---

## Deployment & Integration (Push Testnet)

Prerequisites
- Node.js LTS and npm
- Push Testnet wallet private key with PC for gas
- `.env` at repo root with `PRIVATE_KEY=...` (never commit secrets)

Network
- Chain ID: `42101`
- RPCs: `https://evm.rpc-testnet-donut-node1.push.org/`, `https://evm.rpc-testnet-donut-node2.push.org/`
- Explorer: `https://donut.push.network/`

Install & Compile
```
npm install
npx hardhat compile
```

Deploy with Hardhat Script
```
npx hardhat run scripts/deploy.js --network push_testnet
```
Order & setup:
- Deploy `TicketNFT`, then `TicketFactory`, then `TicketMarketplace`
- Call `TicketNFT.setFactory(<TicketFactory>)`

Deploy with Ignition (alternative)
```
npx hardhat ignition deploy ignition/modules/DeployTicketChain.ts --network push_testnet
```

Verify on Push Scan (Blockscout)
```
npx hardhat verify --network push_testnet <TicketNFT>
npx hardhat verify --network push_testnet <TicketFactory> <TicketNFT>
npx hardhat verify --network push_testnet <TicketMarketplace> <TicketNFT>
```

Frontend Bootstrap
```
cd frontend/ticketchain
npm install
npm run dev
```

Provider & Wallet
- Wrap React tree with `PushUniversalWalletProvider`, `WagmiProvider`, `QueryClientProvider`
- Keep login surface and modal layouts consistent with this repo
- Register Sepolia and Solana devnet RPC overrides where needed

Universal Transactions
- Use `pushChainClient.universal.sendTransaction`
- Encode calldata with `PushChain.utils.helpers.encodeTxData`
- Deep‑link confirmations via `pushChainClient.explorer.getTransactionUrl(hash)`

---

## Environment & RPC

Frontend Env (dynamic)
- `VITE_TICKET_FACTORY_ADDRESS`
- `VITE_TICKET_NFT_ADDRESS`
- `VITE_MARKETPLACE_ADDRESS`
- `VITE_PUSH_RPC_URL` (optional override; defaults to donut node1)

CAIP Mappings
- `eip155:11155111` → `https://rpc.sepolia.org`
- `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` → `https://api.devnet.solana.com`

---

## Troubleshooting

- Solana `SimulateError`: ensure devnet RPC mapping and sufficient SOL; reconnect wallet
- Empty “My Tickets”: resolve executor with `convertOriginToExecutor`; compare UEA, not origin
- `IncorrectPayment`: refresh price; ensure `value` equals ticket price in PC
- Batch listing rejected: current batch path may be EVM‑direct; connect Push testnet EVM wallet or migrate to universal writes
- Explorer/chain mismatch: use chain ID `42101` consistently across wagmi/Hardhat

---

## Roadmap & Notes

Near‑term
- Replace wagmi‑only batch listing with universal transactions
- Add “mark ticket as used” organizer flow
- Global banner when origin chain diverges from required payment chain

Production hardening
- ECDSA signing and backend verification for QR payloads
- Rate limiting and audit trail for scans
- Offline verification modes with sync

---

## References

- Integration: [`docs/push-chain-integration-guide.md`](docs/push-chain-integration-guide.md)
- Marketplace: [`docs/enhanced-marketplace-implementation.md`](docs/enhanced-marketplace-implementation.md)
- Search: [`docs/event-search-implementation.md`](docs/event-search-implementation.md)
- QR code system: [`docs/qr-code-implementation.md`](docs/qr-code-implementation.md)
- Contracts: [`contracts/TicketFactory.sol`](contracts/TicketFactory.sol), [`contracts/TicketMarketplace.sol`](contracts/TicketMarketplace.sol), [`contracts/TicketNFT.sol`](contracts/TicketNFT.sol)
- Frontend provider: [`frontend/ticketchain/src/providers/PushChainProvider.tsx`](frontend/ticketchain/src/providers/PushChainProvider.tsx)

---

