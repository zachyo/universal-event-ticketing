# Secondary Sales & Royalty Tracking Implementation

## Overview
This document explains how secondary sales tracking and royalty distribution work in the TicketChain platform.

## Smart Contract Flow (TicketMarketplace.sol)

### The Correct Royalty Payment Flow ✅

When a buyer purchases a ticket from the secondary marketplace, the payment flow is:

1. **Buyer pays the listing price** (line 182 in `buyTicket`)
2. **Royalty is calculated** using EIP-2981 standard (line 185)
3. **Royalty is paid to event organizer FIRST** (lines 189-194)
4. **Remaining amount is paid to seller** (lines 197-199)
5. **NFT is transferred to buyer** (line 202)
6. **Listing is marked inactive** (lines 205-206)

### Code Reference (TicketMarketplace.sol:178-209)

```solidity
function buyTicket(uint256 listingId) external payable nonReentrant {
    Listing storage lst = listings[listingId];
    if (lst.listingId == 0) revert NotListed();
    if (!lst.active) revert NotActive();
    if (msg.value != lst.price) revert InvalidInput();

    // Compute royalty, if any
    (address royaltyReceiver, uint256 royaltyAmount) = ticketNFT.royaltyInfo(lst.tokenId, lst.price);

    uint256 sellerAmount = lst.price;

    if (royaltyReceiver != address(0) && royaltyAmount > 0 && royaltyAmount <= lst.price) {
        sellerAmount = lst.price - royaltyAmount;

        // Pay royalty FIRST to organizer
        (bool okR, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
        if (!okR) revert TransferFailed();
    }

    // Pay seller (remaining amount after royalty)
    (bool okS, ) = payable(lst.seller).call{value: sellerAmount}("");
    if (!okS) revert TransferFailed();

    // Transfer NFT from escrow to buyer
    ticketNFT.transferFrom(address(this), msg.sender, lst.tokenId);

    // Close listing
    lst.active = false;
    tokenToListing[lst.tokenId] = 0;

    emit TicketPurchased(listingId, lst.tokenId, lst.seller, msg.sender, lst.price, royaltyReceiver, royaltyAmount);
}
```

### Key Event
The `TicketPurchased` event contains all the information needed for analytics:
- `listingId`: ID of the listing that was purchased
- `tokenId`: The NFT token ID
- `seller`: Original listing creator (gets remaining amount)
- `buyer`: New ticket owner
- `price`: Full sale price
- `royaltyReceiver`: Event organizer (receives royalty)
- `royaltyAmount`: Amount paid to organizer

## Frontend Implementation

### 1. Secondary Sales Tracking Hook (`useSecondarySales.ts`)

This hook accurately tracks completed sales by:

#### Step 1: Fetch Event-Specific Listings
```typescript
const { data: eventListings } = useReadContract({
  address: MARKETPLACE_ADDRESS,
  abi: TicketMarketplaceABI.abi,
  functionName: "getListingsByEvent",
  args: [BigInt(eventId)],
});
```

This uses the smart contract's `getListingsByEvent` function to only get listings for the current event.

#### Step 2: Query `TicketPurchased` Events
```typescript
const purchasedEvents = await publicClient.getLogs({
  address: MARKETPLACE_ADDRESS,
  event: {
    type: "event",
    name: "TicketPurchased",
    inputs: [
      { type: "uint256", indexed: true, name: "listingId" },
      { type: "uint256", indexed: true, name: "tokenId" },
      { type: "address", indexed: true, name: "seller" },
      { type: "address", indexed: false, name: "buyer" },
      { type: "uint256", indexed: false, name: "price" },
      { type: "address", indexed: false, name: "royaltyReceiver" },
      { type: "uint256", indexed: false, name: "royaltyAmount" },
    ],
  },
  fromBlock: BigInt(0),
  toBlock: "latest",
});
```

This queries the blockchain for **actual sale events** - not just inactive listings. This is crucial because inactive listings could be:
- ✅ Completed sales (what we want)
- ❌ Cancelled listings (what we DON'T want)

#### Step 3: Filter Events to Current Event
```typescript
const listingIds = new Set(
  (eventListings as any[]).map((l: any) => l.listingId.toString())
);

const eventSales = purchasedEvents
  .filter((log) => {
    const listingId = log.args.listingId?.toString();
    return listingId && listingIds.has(listingId);
  })
  .map((log) => ({
    listingId: log.args.listingId,
    tokenId: log.args.tokenId,
    seller: log.args.seller,
    buyer: log.args.buyer,
    price: log.args.price,
    royaltyAmount: log.args.royaltyAmount, // Already calculated by contract!
    royaltyReceiver: log.args.royaltyReceiver,
    completedAt: new Date(),
    blockNumber: log.blockNumber,
  }));
```

**Key Insight**: The `royaltyAmount` comes directly from the `TicketPurchased` event, which means it's the **exact amount that was paid to the organizer** on-chain. No estimation needed!

#### Step 4: Calculate Aggregated Analytics
```typescript
const analytics = useMemo((): SecondarySalesData => {
  if (!sales.length) {
    return {
      sales: [],
      totalSales: 0,
      totalVolume: BigInt(0),
      totalRoyalties: BigInt(0),
      avgPrice: BigInt(0),
      avgRoyalty: BigInt(0),
    };
  }

  const totalVolume = sales.reduce((sum, sale) => sum + sale.price, BigInt(0));
  const totalRoyalties = sales.reduce((sum, sale) => sum + sale.royaltyAmount, BigInt(0));
  const avgPrice = totalVolume / BigInt(sales.length);
  const avgRoyalty = totalRoyalties / BigInt(sales.length);

  return {
    sales,
    totalSales: sales.length,
    totalVolume,
    totalRoyalties,
    avgPrice,
    avgRoyalty,
  };
}, [sales]);
```

### 2. Event Analytics Integration (`useEventAnalytics.ts`)

The analytics hook integrates secondary sales data:

```typescript
const { analytics: secondarySalesData, loading: secondarySalesLoading } = useSecondarySales(eventId);

// Extract data
const secondarySales = secondarySalesData.totalSales;
const secondaryVolume = secondarySalesData.totalVolume;
const royaltyRevenue = secondarySalesData.totalRoyalties; // Total royalties earned!
const royaltyBps = Number(event.royaltyBps || 0);
const royaltyPercentage = royaltyBps / 100; // Convert to percentage (e.g., 2.5)
const avgRoyaltyPerSale = secondarySalesData.avgRoyalty;

// Include in analytics
const analyticsData: EventAnalytics = {
  // ... other fields

  // Secondary Market
  activeListings,
  avgResalePrice,
  lowestPrice,
  highestPrice,
  secondarySales,
  secondaryVolume,

  // Royalty Revenue
  royaltyRevenue,
  royaltyPercentage,
  avgRoyaltyPerSale,
};
```

### 3. Analytics Display (`EventAnalyticsPage.tsx` & `SecondaryMarketStats.tsx`)

The analytics page displays the royalty data in the `SecondaryMarketStats` component:

```tsx
<SecondaryMarketStats
  activeListings={analytics.activeListings}
  avgResalePrice={analytics.avgResalePrice}
  lowestPrice={analytics.lowestPrice}
  highestPrice={analytics.highestPrice}
  secondarySales={analytics.secondarySales}
  secondaryVolume={analytics.secondaryVolume}
  royaltyRevenue={analytics.royaltyRevenue}
  royaltyPercentage={analytics.royaltyPercentage}
/>
```

The component shows:
- **Total Royalty Earned**: Sum of all royalties from secondary sales
- **Royalty Rate**: The percentage set when creating the event
- **Market Volume**: Total value of all secondary sales
- **Number of Resold Tickets**: Count of completed secondary sales

## Example Flow

### Creating an Event
```
Organizer creates event with 2.5% royalty (250 basis points)
```

### Primary Sale
```
Buyer A purchases ticket for 100 PC
→ Organizer receives: 100 PC
→ NFT minted with royaltyReceiver = Organizer address
```

### Secondary Sale
```
Buyer A lists ticket for 150 PC
Buyer B purchases ticket for 150 PC

Smart Contract Execution:
1. Calculate royalty: 150 PC × 2.5% = 3.75 PC
2. Pay organizer: 3.75 PC ✅
3. Pay Buyer A (seller): 146.25 PC ✅
4. Transfer NFT to Buyer B ✅
5. Emit TicketPurchased event with royaltyAmount = 3.75 PC
```

### Analytics Display
```
Event Analytics Page shows:
- Secondary Sales: 1
- Secondary Volume: 150 PC
- Royalty Revenue: 3.75 PC ← This is what organizer earned!
- Royalty Rate: 2.5%
- Average Royalty/Sale: 3.75 PC
```

## Verification

### Debug Components
Two debug components help verify the implementation:

1. **DebugRoyaltyInfo** (bottom-left): Shows detailed breakdown of:
   - Event royalty settings
   - All marketplace listings
   - Secondary sales tracked
   - Individual sale details with royalty amounts

2. **DebugOrganizerButton** (bottom-right): Shows:
   - Address matching for organizer verification
   - UEA resolution status

### Console Logging
The implementation includes comprehensive logging:
- `🔍 Secondary Sales Analysis`: Shows sales detection and calculation
- `📊 Found X TicketPurchased events`: Event query results
- `🔍 Enhanced Analytics Debug`: Full analytics breakdown

## Key Features

### ✅ Accurate Sales Tracking
- Uses `TicketPurchased` events, not inactive listings
- Filters by event ID to show only relevant sales
- No false positives from cancelled listings

### ✅ Exact Royalty Amounts
- Royalty amounts come from blockchain events
- No estimation or client-side calculation errors
- Matches exactly what was paid on-chain

### ✅ Comprehensive Analytics
- Total royalties earned across all secondary sales
- Average royalty per sale
- Royalty percentage display
- Integration with existing analytics dashboard

### ✅ Real-time Updates
- Fetches latest blockchain events
- Updates automatically on page refresh
- Shows current active listings + historical sales

## Testing Checklist

To verify the complete flow works:

1. ✅ Create an event with royalty percentage (e.g., 2.5%)
2. ✅ Buy a ticket (primary sale)
3. ✅ List the ticket on marketplace
4. ✅ Buy the listed ticket (secondary sale)
5. ✅ Check Event Analytics page:
   - [ ] Shows 1 secondary sale
   - [ ] Shows correct secondary volume
   - [ ] Shows correct royalty revenue
   - [ ] Royalty percentage matches event settings
6. ✅ Check Debug Info:
   - [ ] TicketPurchased event is captured
   - [ ] Royalty receiver is event organizer
   - [ ] Royalty amount is correct

## Future Enhancements

### Possible Improvements
1. **Block Timestamp Fetching**: Currently using `new Date()` for completion time. Could fetch actual block timestamp.
2. **Event Indexer**: For very large numbers of sales, consider using The Graph or similar indexer.
3. **Real-time Updates**: Add WebSocket listeners for live updates without page refresh.
4. **Sales History Chart**: Visualize royalty revenue over time.

## Summary

The implementation ensures that:
1. **Smart contract correctly pays royalties** to event organizers BEFORE paying sellers
2. **Frontend accurately tracks sales** using blockchain events (not assumptions)
3. **Analytics display the exact royalty amounts** earned by organizers
4. **Event filtering works correctly** to show only relevant sales

The flow is: **Buyer pays → Organizer receives royalty → Seller receives remainder → Analytics show accurate data** ✅
