# Secondary Sales Tracking - Contract Update

## Problem Solved

Instead of fetching events from the blockchain (which has a 10,000 block limit on Push Chain), we now **store secondary sales data directly in the contract**.

## Contract Changes

### New Storage Variables

Added two public mappings to `TicketMarketplace.sol`:

```solidity
/// @notice Track secondary sales count per event
/// @dev eventId => number of completed secondary sales
mapping(uint256 => uint256) public eventSecondarySales;

/// @notice Track total royalties collected per event
/// @dev eventId => total royalty amount collected in wei
mapping(uint256 => uint256) public eventRoyaltiesCollected;
```

### Updated Functions

#### 1. `buyTicket()` (lines 192-226)
- Gets `eventId` from the ticket NFT
- Increments `eventSecondarySales[eventId]` by 1
- Adds `royaltyAmount` to `eventRoyaltiesCollected[eventId]`

#### 2. `acceptOffer()` (lines 384-417)
- Same tracking for offer-based sales
- Gets `eventId` from ticket
- Increments counters

### New View Function

```solidity
function getEventSecondaryMarketStats(uint256 eventId)
    external
    view
    returns (uint256 salesCount, uint256 royaltiesCollected)
{
    return (eventSecondarySales[eventId], eventRoyaltiesCollected[eventId]);
}
```

## How It Works

### When a Secondary Sale Happens:

1. **User buys from marketplace** (`buyTicket` or `acceptOffer` called)
2. **Contract gets eventId** from the ticket's NFT metadata
3. **Royalty is paid** to organizer
4. **Counters are updated**:
   ```solidity
   eventSecondarySales[eventId] += 1;
   eventRoyaltiesCollected[eventId] += royaltyAmount;
   ```

### Reading the Data (Frontend):

Instead of fetching thousands of events, just call:

```typescript
const { salesCount, royaltiesCollected } = await contract.read.getEventSecondaryMarketStats([eventId]);
```

**Single contract call. Instant. No block limits. Always accurate.** ✅

## Deployment Steps

### 1. Deploy New Contract

```bash
npx hardhat ignition deploy ignition/modules/DeployTicketChain.ts --network push_testnet
```

This will deploy:
- New TicketNFT
- New TicketFactory
- New TicketMarketplace (with tracking)

### 2. Update Frontend Environment Variables

Update `frontend/ticketchain/.env`:

```env
VITE_TICKET_NFT_ADDRESS=<new_address>
VITE_TICKET_FACTORY_ADDRESS=<new_address>
VITE_MARKETPLACE_ADDRESS=<new_address>
```

### 3. Update Frontend ABI

The ABI will be updated automatically after deployment, but make sure to:
- Copy new `TicketMarketplace.json` to `frontend/ticketchain/src/lib/abi/`

## Frontend Integration

### Create New Hook: `useMarketplaceStats.ts`

```typescript
import { useReadContract } from "wagmi";
import TicketMarketplaceABI from "../lib/abi/TicketMarketplace.json";

const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS;

export function useMarketplaceStats(eventId: number) {
  const { data, isLoading, error } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI.abi,
    functionName: "getEventSecondaryMarketStats",
    args: [BigInt(eventId)],
    query: {
      enabled: eventId > 0,
    },
  });

  return {
    secondarySales: data ? Number(data[0]) : 0,
    royaltiesCollected: data ? data[1] : BigInt(0),
    isLoading,
    error,
  };
}
```

### Update `useEventAnalytics.ts`

Replace the complex event-fetching logic with:

```typescript
import { useMarketplaceStats } from "./useMarketplaceStats";

export function useEventAnalytics(eventId: number) {
  // ... existing code ...

  // Get secondary market stats directly from contract
  const { secondarySales, royaltiesCollected, isLoading: statsLoading } =
    useMarketplaceStats(eventId);

  // Use in analytics calculation
  const analyticsData: EventAnalytics = {
    // ... other fields ...
    secondarySales,
    secondaryVolume: BigInt(0), // Can calculate from listings if needed
    royaltyRevenue: royaltiesCollected,
    royaltyPercentage: royaltyBps / 100,
    avgRoyaltyPerSale: secondarySales > 0
      ? royaltiesCollected / BigInt(secondarySales)
      : BigInt(0),
  };
}
```

## Benefits Over Event Fetching

| Aspect | Event Fetching | Contract Storage |
|--------|---------------|------------------|
| **Speed** | Slow (chunked requests) | Instant (single call) |
| **Reliability** | RPC limits (10k blocks) | Always works |
| **Accuracy** | 100% (if works) | 100% |
| **Complexity** | High | Low |
| **Gas Cost** | Free | Small increment per sale |
| **Code** | ~200 lines | ~20 lines |

## Migration Notes

### Existing Events

The new contract starts tracking from deployment. **Previous secondary sales won't be counted**.

### Options:
1. **Accept fresh start** - Simplest, tracking starts from now
2. **Initialize with historical data** - Would require indexing old events and calling a setter (need to add admin function)
3. **Keep old analytics for historical events** - Use event-based for old, contract-based for new

### Recommended Approach:

**Fresh start** - Since you're in testnet, just redeploy and test the full flow again.

## Testing Checklist

After deployment:

- [ ] Deploy new contracts
- [ ] Update frontend `.env` with new addresses
- [ ] Update ABI files
- [ ] Create event with royalty (e.g., 2.5%)
- [ ] Buy ticket (primary sale)
- [ ] List ticket on marketplace
- [ ] Buy listed ticket (secondary sale)
- [ ] Check analytics page shows:
  - [ ] Secondary Sales: 1
  - [ ] Royalty Revenue: correct amount
  - [ ] Royalty Rate: 2.5%
- [ ] Do another resale
- [ ] Check analytics shows:
  - [ ] Secondary Sales: 2
  - [ ] Royalty Revenue: sum of both sales

## Gas Cost Analysis

Each secondary sale now costs:
- 2 x SSTORE (for the two counters)
- Approximately 40,000-60,000 additional gas

**This is negligible** compared to the transfer costs and royalty payments already happening.

## Summary

The solution is:
- **Simpler**: No complex event chunking
- **Faster**: Single contract call
- **More reliable**: No RPC limits
- **More accurate**: Direct source of truth
- **Gas efficient**: Minimal overhead

The trade-off is slightly higher gas per sale, but the UX improvement is massive!

Perfect for on-chain analytics. ✅
