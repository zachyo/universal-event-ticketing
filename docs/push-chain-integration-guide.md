# Push Chain Integration Guide

> Comprehensive reference for how TicketChain integrates Push Chain for wallet connectivity, cross-chain ticketing, and marketplace operations.

## 1. Architecture Snapshot

| Layer                      | Responsibility                                                       | Key Files                                                                                                        |
| -------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **UI Shell**               | Initializes Push Chain universal wallet, wraps React tree            | `frontend/ticketchain/src/main.tsx`, `src/providers/PushChainProvider.tsx`                                       |
| **Wallet Context**         | Exposes connection state, universal accounts, helper hooks           | `@pushchain/ui-kit` (`usePushWalletContext`, `usePushChainClient`, `usePushChain`, `PushUniversalAccountButton`) |
| **Read Operations**        | Uses wagmi + JSON RPC provider for contract reads                    | `src/lib/wagmi.ts`, `src/lib/pushchain.ts`, `src/hooks/useContracts.ts`                                          |
| **Write Operations**       | Sends cross-chain transactions through Push universal accounts       | `src/hooks/useContracts.ts`, `src/pages/MyTicketsPage.tsx`, `src/hooks/useMarkTicketAsUsed.ts`                   |
| **Batch / Legacy Flow**    | Direct EVM writes for features not yet ported to Push universal flow | `src/hooks/useBatchListing.ts`, `src/components/marketplace/BulkListingModal.tsx`                                |
| **Docs & Troubleshooting** | Historical fixes and configuration notes                             | `docs/push-executor-mapping-fix.md`, `docs/solana-devnet-universal-purchase-fix.md`                              |

## 2. Prerequisites & Environment

1. **Dependencies**
   - `@pushchain/ui-kit` provides the wallet provider, UI controls, and low-level helpers.
   - `wagmi`, `viem`, and `ethers` are used for contract reads and JSON-RPC access.
2. **Environment Variables** (in `frontend/ticketchain/.env.local` or similar):
   - `VITE_TICKET_FACTORY_ADDRESS`
   - `VITE_TICKET_NFT_ADDRESS`
   - `VITE_MARKETPLACE_ADDRESS`
   - `VITE_PUSH_RPC_URL` _(optional; defaults to `https://evm.rpc-testnet-donut-node1.push.org/`)_
3. **Network Configuration**
   - `PushChainProviders` sets `network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET`.
   - Custom RPCs for Ethereum Sepolia and Solana devnet are registered under `chainConfig.rpcUrls`.
   - `src/lib/wagmi.ts` defines the Push Chain testnet (chain id `111557560`) so wagmi reads point at the same network.
4. **Bootstrap**

   ```bash
   cd frontend/ticketchain
   npm install
   npm run dev
   ```

## 3. Provider & Context Setup

### 3.1 Root Wrapper

- `src/main.tsx` wraps the app with `PushChainProviders`, ensuring the push wallet is available everywhere.
- `PushChainProviders` (in `src/providers/PushChainProvider.tsx`) configures:
  - Login surface (email, Google, wallet)
  - Modal appearance
  - RPC overrides (Sepolia + Solana devnet)
  - App metadata (logo, title, description)

### 3.2 Wallet UI

- `PushUniversalAccountButton` renders in `Header.tsx` for both desktop and mobile. It opens the Push wallet modal and reflects connection status.
- Components use `usePushWalletContext()` to read `connectionStatus`, `handleConnectToPushWallet`, and the active `universalAccount`.

# Push Chain Integration Guide

> This document teaches an engineer how to recreate TicketChain’s Push Chain integration without needing the original repository. It explains the architecture, the smart contracts involved, required tooling, and the exact frontend wiring patterns to deliver cross-chain ticketing.

## 1. Solution Overview

Push Chain allows a single “universal” wallet session to orchestrate transactions on multiple chains. TicketChain uses it to sell NFT tickets, run a secondary marketplace, and validate entry at the venue. The system consists of three layers:

1. **Smart Contracts (Push Chain EVM testnet)**
   - `TicketFactory`: creates events, configures ticket tiers, handles on-chain purchases, and validates tickets.
   - `TicketNFT`: ERC-721 implementation storing ticket metadata, ownership history, and “used” status.
   - `TicketMarketplace`: escrow-based secondary market for listing and purchasing tickets.
2. **Frontend Application (React + Vite + TypeScript)**
   - Uses `@pushchain/ui-kit` for wallet UX and universal transaction APIs.
   - Uses `wagmi` + `viem` + `ethers` for on-chain reads and utility helpers.
3. **Off-chain services**
   - IPFS pinning (image + metadata uploads).
   - Optional analytics or search services (out of scope for this document).

The remainder of the guide assumes you are rebuilding the integration inside your own React application.

## 2. Getting Started From Scratch

1. **Clone or scaffold a React app** (Vite + TypeScript is recommended).
2. **Install dependencies**:

   ```bash
   npm install @pushchain/ui-kit wagmi viem ethers @tanstack/react-query react-hot-toast
   ```

3. **Obtain contract ABIs and addresses**:
   - Compile or export ABIs for the three contracts (`TicketFactory`, `TicketNFT`, `TicketMarketplace`).
   - Deploy to Push Chain testnet or reuse the latest known addresses (replace the placeholders below with yours).
   - Store addresses and ABI JSON files so the frontend can consume them.
4. **Configure environment variables** (e.g., in `.env.local`):

   - `VITE_TICKET_FACTORY_ADDRESS=0x...`
   - `VITE_TICKET_NFT_ADDRESS=0x...`
   - `VITE_MARKETPLACE_ADDRESS=0x...`
   - `VITE_PUSH_RPC_URL=https://evm.rpc-testnet-donut-node1.push.org/` _(optional override)_

5. **Create a Push Chain provider wrapper** (see section 4).
6. **Wire contract hooks and UI screens** following sections 5–7.

## 3. Contract Cheat Sheet

| Contract            | Network                                   | Key Functions                                                                                     | Notes                                               |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `TicketFactory`     | Push Chain testnet (Chain ID `111557560`) | `createEvent`, `addTicketType`, `purchaseTickets`, `validateTicket`, `getEvent`, `getTicketTypes` | Primary entry point for event organizers and buyers |
| `TicketNFT`         | Same                                      | `getUserTicketsWithDetails`, `ticketDetails`, `ownerOf`, `validateTicket` (internal)              | Stores ownership and metadata for each ticket NFT   |
| `TicketMarketplace` | Same                                      | `listTicket`, `buyTicket`, `cancelListing`, `getActiveListings`, `batchListTickets`               | Secondary market with custody escrow                |

**Cross-chain payments:** All primary and secondary purchases send value in Push Chain’s native token (PC). Push Chain’s universal account bridges from the user’s origin chain when necessary.

## 4. Wallet & Provider Integration

### 4.1 Wrap your app with Push Chain providers

Create a dedicated component (e.g., `PushChainProviders.tsx`) that exposes login options and app branding:

```tsx
import {
  PushUniversalWalletProvider,
  PushUI,
  type AppMetadata,
  type ProviderConfigProps,
} from "@pushchain/ui-kit";

const walletConfig: ProviderConfigProps = {
  network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET,
  login: {
    email: true,
    google: true,
    wallet: { enabled: true },
    appPreview: true,
  },
  modal: {
    loginLayout: PushUI.CONSTANTS.LOGIN.LAYOUT.SPLIT,
    connectedLayout: PushUI.CONSTANTS.CONNECTED.LAYOUT.HOVER,
    appPreview: true,
    connectedInteraction: PushUI.CONSTANTS.CONNECTED.INTERACTION.BLUR,
  },
  chainConfig: {
    rpcUrls: {
      "eip155:11155111": ["https://rpc.sepolia.org"],
      "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1": [
        "https://api.devnet.solana.com",
      ],
    },
  },
};

const appMetadata: AppMetadata = {
  title: "TicketChain",
  description: "Universal ticketing powered by Push Chain",
  logoUrl: "https://avatars.githubusercontent.com/u/64157541?v=4",
};

export function PushChainProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PushUniversalWalletProvider config={walletConfig} app={appMetadata}>
      {children}
    </PushUniversalWalletProvider>
  );
}
```

Wrap your React tree (e.g., in `main.tsx`) with `PushChainProviders`, `WagmiProvider`, and `QueryClientProvider`.

### 4.2 Expose wallet status in the UI

Add the Push wallet button to your navigation:

```tsx
import {
  PushUniversalAccountButton,
  usePushWalletContext,
} from "@pushchain/ui-kit";

function Header() {
  const { connectionStatus } = usePushWalletContext();

  return (
    <header>
      <PushUniversalAccountButton />
      {connectionStatus !== "connected" && <span>Please connect</span>}
    </header>
  );
}
```

`usePushWalletContext()` surfaces:

- `connectionStatus`: `"connected"`, `"connecting"`, etc.
- `handleConnectToPushWallet()`: programmatic trigger for the modal.
- `universalAccount`: object with origin address and namespace information.

### 4.3 Create a read-only provider

Some reads do not require wallet context. Reference the Push RPC with `ethers`:

```ts
import { ethers } from "ethers";

export const pushProvider = new ethers.JsonRpcProvider(
  import.meta.env.VITE_PUSH_RPC_URL ??
    "https://evm.rpc-testnet-donut-node1.push.org/"
);
```

Use this provider for background refresh tasks or server-side scripts.

## 5. Universal Account Lifecycle

1. **Connection** – When the user authenticates, `usePushChainClient()` becomes available and exposes `pushChainClient.universal` helpers.
2. **Origin vs. executor addresses** – A universal account may originate from another chain (e.g., Sepolia or Solana). Convert it to the Push executor address before querying contracts:

   ```ts
   const { PushChain } = usePushChain();
   const executor = await PushChain.utils.account.convertOriginToExecutor(
     universalAccount,
     {
       onlyCompute: true,
     }
   );
   ```

3. **Explorer links** – Use `pushChainClient.explorer.getTransactionUrl(hash)` to deep-link confirmations in UI toasts or receipts.

## 6. Contract Interaction Patterns

All write flows use `pushChainClient.universal.sendTransaction` so the universal wallet can manage cross-chain fees.

### 6.1 Create events & ticket tiers

```ts
const tx = await pushChainClient.universal.sendTransaction({
  to: TICKET_FACTORY_ADDRESS,
  data: PushChain.utils.helpers.encodeTxData({
    abi: TicketFactoryABI,
    functionName: "createEvent",
    args: [
      name,
      description,
      startTime,
      endTime,
      venue,
      eventImageHash,
      totalSupply,
      royaltyBps,
      ticketTypes,
    ],
  }),
});
await tx.wait();
```

- Upload event and ticket tier images to IPFS and pass the resulting hashes.
- Clear any cached drafts after success.

### 6.2 Purchase primary tickets

```ts
const tx = await pushChainClient.universal.sendTransaction({
  to: TICKET_FACTORY_ADDRESS,
  data: PushChain.utils.helpers.encodeTxData({
    abi: TicketFactoryABI,
    functionName: "purchaseTickets",
    args: [eventId, ticketTypeId, quantity],
  }),
  value: ticketPrice * quantity, // denominated in PC
});
await tx.wait();
```

- Block purchases if `connectionStatus !== "connected"`.
- Warn when the wallet’s origin chain differs from the selected payment chain.

### 6.3 Marketplace operations

- **List**: approve the marketplace to transfer the NFT, then call `TicketMarketplace.listTicket(tokenId, price)`.
- **Buy**: send `value` equal to the listing price when calling `buyTicket`.
- **Cancel**: call `cancelListing(listingId)`; no value required.
- **Batch list (optional)**: current implementation uses wagmi’s `writeContract` directly. Porting to `sendTransaction` is recommended for full universal support.

### 6.4 Ticket validation (organizers)

```ts
const tx = await pushChainClient.universal.sendTransaction({
  to: TICKET_FACTORY_ADDRESS,
  data: PushChain.utils.helpers.encodeTxData({
    abi: TicketFactoryABI,
    functionName: "validateTicket",
    args: [eventId, tokenId],
  }),
});
await tx.wait();
```

Use QR scanning to capture the tokenId and eventId, then verify ownership by reading `TicketNFT.ticketDetails` and `TicketFactory.getEvent` before sending the transaction.

## 7. Frontend Data Flow

1. **Events listing** – `useReadContract` + `TicketFactory.getEvent` for each id.
2. **Ticket types** – `TicketFactory.getTicketTypes(eventId)`; derive `ticketTypeId` from array index.
3. **User tickets** – Resolve executor address, then `TicketNFT.getUserTicketsWithDetails(executorAddress)`.
4. **Marketplace listings** – `TicketMarketplace.getActiveListings()`; join with ticket metadata for display.
5. **Caching** – After any successful write, invalidate cached data (e.g., clear `localStorage` or invoke `queryClient.invalidateQueries`).

## 8. Testing the Integration

1. **Local smoke test** – start the dev server, connect with both native Push wallet and a bridged wallet (Sepolia or Solana).
2. **Event creation** – create an event, confirm transaction on the Push explorer, and verify ticket tiers render.
3. **Primary purchase** – buy different ticket quantities, inspect toast lifecycle and explorer links.
4. **My tickets** – switch origin chains; ensure executor resolution succeeds and tickets appear.
5. **Marketplace** – list a ticket, buy it from another wallet, cancel a listing, and verify escrow transfers.
6. **Validation** – scan the ticket QR at the venue UI and mark it as used.
7. **Batch listing** – if you keep the wagmi implementation, connect an EVM wallet directly to Push testnet and try listing multiple tickets. Document this limitation for stakeholders.

## 9. Troubleshooting

| Symptom                          | Likely Cause                              | Fix                                                                |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Wallet button does nothing       | Provider wrapper missing                  | Ensure `PushChainProviders` wraps the React tree                   |
| Empty ticket list after purchase | Executor mapping failed                   | Retry `convertOriginToExecutor` or reconnect wallet                |
| `IncorrectPayment` revert        | Price mismatch or stale cache             | Refresh ticket data and resend transaction with correct PC value   |
| `executePayload` failure         | Origin chain mismatch or insufficient gas | Switch wallet to the chain selected in the UI, confirm balance     |
| Solana payments fail             | Wallet not on devnet or low SOL           | Switch to devnet and fund via faucet                               |
| Batch listing rejected           | Using universal account for wagmi write   | Use an EVM wallet on Push testnet or refactor to `sendTransaction` |

### Debugging tips

- Log transaction payloads before sending (ticket type IDs, payment values).
- Use the returned transaction hash with `pushChainClient.explorer.getTransactionUrl(hash)` to inspect execution.
- Leverage the read-only `pushProvider` for quick console scripts without requiring wallet connection.

## 10. Suggested Enhancements

- Extract executor resolution into a reusable hook (e.g., `usePushExecutorAddress`) to share logic across views.
- Replace the wagmi-only batch listing path with universal transactions for cross-chain parity.
- Add automated integration tests that simulate external wallets (Sepolia/Solana) to guard against regressions.
- Display a global banner when the wallet’s origin chain diverges from the required payment chain.

---

**Last updated:** 2025-10-19
