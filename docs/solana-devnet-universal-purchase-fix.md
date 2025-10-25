# Solana Devnet Universal Purchase Fix (October 2025)

## Overview

Universal ticket purchases that originate on Solana were consistently failing with `SimulateError` responses from the PushChain SDK. The failure occurred before the transaction was broadcast, so no on-chain trace existed. This document captures the investigation, the exact code changes applied, and the validation steps required to keep Solana cross-chain purchases working.

## Symptoms Observed

- Purchasing a ticket from the Solana quick-buy flow reverted with a generic `SimulateError` in the PushChain SDK logs.
- The error appeared even when sufficient SOL was available and the destination EVM chain completed purchases successfully.
- No Solana transactions were recorded in the explorer because the SDK aborted during preflight simulation.

## Root Cause

PushChain's universal transaction flow relies on a fee-locker and Pyth price account that currently live on **Solana devnet**. Our wallet provider configuration mapped the Push Solana chain ID `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` to the public **testnet** RPC (`https://api.testnet.solana.com`). When the SDK attempted to simulate the transaction on testnet, the locker and price accounts were missing, so preflight threw `AccountNotFound`, presented upstream as `SimulateError`.

## Fix Implementation

1. **Align RPC with Push metadata** – Updated `frontend/ticketchain/src/providers/PushChainProvider.tsx` so `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` now uses `https://api.devnet.solana.com`.
2. **Clarify chain labels** – Renamed Solana options in `frontend/ticketchain/src/types/chains.ts` to distinguish `Solana Devnet (Push)` from the canonical `Solana Devnet (Standard)` entry.
3. **Document operational steps** – Added a "Solana devnet configuration" section to `frontend/ticketchain/README.md` covering wallet network selection, faucet funding, and troubleshooting guidance.

## Validation Steps

1. Restart the frontend so the provider reads the new RPC map.
2. Connect a Solana wallet set to **Devnet** (e.g., Phantom → Settings → Change network → Devnet).
3. Use the [official Solana faucet](https://faucet.solana.com/) to fund the wallet with at least **0.01 SOL**.
4. Initiate a ticket purchase from the Solana quick-buy flow.
5. Confirm that the PushChain SDK logs show a successful preflight simulation, the fee-locker transaction executes on devnet, and the universal transaction completes without `SimulateError`.

## Operational Notes

- The Push fee-locker remains on devnet until PushChain provides a dedicated Solana testnet deployment. Keep the RPC configuration aligned with Push metadata to avoid regressions.
- If the SDK surfaces `SimulateError` again, capture the detailed simulation logs and verify:
  - The RPC endpoint is still set to a devnet URL you control.
  - The wallet is on devnet and holds sufficient SOL for both the fee lock and execution gas (~0.005 SOL minimum recommended).
  - No custom RPC middleware is filtering the locker or price accounts.

## Future Considerations

- Migrate to a dedicated Push-provided endpoint once available to benefit from higher rate limits and automatic metadata updates.
- Automate a preflight health check in CI to detect RPC drift (solana cluster vs. expected accounts) before deployments reach staging.
- Consider surfacing a UI hint when the connected Solana wallet is not on devnet to reduce user confusion.
