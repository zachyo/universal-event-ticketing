# Analytics Dashboard - Smart Contract Data Assessment

**Date:** October 19, 2025  
**Status:** ✅ Contracts Support Comprehensive Analytics

---

## 🎯 Summary

**YES! The smart contracts provide excellent support for an analytics dashboard.**

The TicketChain contracts expose rich data through events and view functions that enable comprehensive analytics for event organizers.

---

## 📊 Available Analytics Data

### **1. Event Metrics** ✅

**From TicketFactory.sol:**

```solidity
struct EventData {
    uint256 eventId;
    address organizer;
    string name;
    string description;
    uint256 startTime;
    uint256 endTime;
    string venue;
    string imageIpfsHash;
    uint256 totalSupply;     // Total capacity
    uint256 sold;            // Total tickets sold ✅
    bool active;
    uint96 royaltyBps;
}
```

**Available Metrics:**

- ✅ **Total Tickets Sold**: `events[eventId].sold`
- ✅ **Sales Percentage**: `(sold / totalSupply) * 100`
- ✅ **Remaining Capacity**: `totalSupply - sold`
- ✅ **Event Status**: Active/Inactive
- ✅ **Event Timeline**: Start/End times

---

### **2. Ticket Type Analytics** ✅

**From TicketFactory.sol:**

```solidity
struct TicketType {
    uint256 eventId;
    string name;              // e.g., "VIP", "General"
    uint256 price;            // Price in native currency
    uint256 supply;           // Max supply for this tier
    uint256 sold;             // Number sold ✅
    string imageIpfsHash;
}
```

**Available Metrics:**

- ✅ **Sales by Tier**: Which ticket types are selling best
- ✅ **Tier Capacity**: Supply vs Sold for each tier
- ✅ **Price Points**: Revenue per tier (price × sold)
- ✅ **Popular Tiers**: Most/least popular ticket types

**View Function:**

```solidity
function getTicketTypes(uint256 eventId)
    external view returns (TicketType[] memory)
```

---

### **3. Revenue Analytics** ✅

**From TicketFactory.sol:**

```solidity
mapping(uint256 => uint256) public eventProceedsNative;
```

**Available Metrics:**

- ✅ **Total Primary Revenue**: `eventProceedsNative[eventId]`
- ✅ **Revenue by Tier**: Sum of (price × sold) per ticket type
- ✅ **Average Ticket Price**: Total revenue / total sold
- ✅ **Pending Withdrawals**: Proceeds not yet withdrawn

**Calculation:**

```typescript
const primaryRevenue = await ticketFactory.eventProceedsNative(eventId);
const revenueByTier = ticketTypes.map((tt) => tt.price * tt.sold);
const totalRevenue = revenueByTier.reduce((a, b) => a + b, 0n);
```

---

### **4. Secondary Market Analytics** ✅

**From TicketMarketplace.sol:**

```solidity
struct Listing {
    uint256 listingId;
    uint256 tokenId;
    address seller;
    uint256 price;
    bool active;
    uint256 createdAt;
}
```

**Available Metrics:**

- ✅ **Active Listings Count**: Filter `active == true`
- ✅ **Average Resale Price**: Sum of listing prices / count
- ✅ **Lowest/Highest Resale Price**: Min/Max of active listings
- ✅ **Secondary Market Volume**: Total sold on marketplace
- ✅ **Royalty Revenue**: From EIP-2981 on secondary sales

**Events to Track:**

```solidity
event TicketPurchased(
    uint256 indexed listingId,
    uint256 indexed tokenId,
    address indexed seller,
    address buyer,
    uint256 price,
    address royaltyReceiver,
    uint256 royaltyAmount  // ✅ Royalty earned
);
```

---

### **5. Attendance/Usage Analytics** ✅

**From TicketNFT.sol:**

```solidity
struct TicketMetadata {
    uint256 eventId;
    uint256 ticketTypeId;
    address originalOwner;
    uint256 purchasePrice;
    string purchaseChain;
    bool used;              // ✅ Ticket was scanned
    string qrCodeHash;
}
```

**Available Metrics:**

- ✅ **Tickets Scanned**: Count where `used == true`
- ✅ **Scan Rate**: `(scanned / sold) * 100`
- ✅ **No-Show Rate**: `100 - scanRate`
- ✅ **Attendance by Tier**: Scanned tickets per ticket type

**View Functions:**

```solidity
// Get all tickets for an event (loop through all tokens)
mapping(uint256 => TicketMetadata) public ticketDetails;

// Validation events
event TicketValidated(uint256 indexed tokenId, uint256 timestamp);
```

---

### **6. Time-Based Analytics** ✅

**From Events:**

```solidity
event TicketPurchased(
    uint256 indexed eventId,
    uint256 indexed ticketTypeId,
    uint256 indexed tokenId,
    address buyer,
    uint256 price
);

event TicketValidated(
    uint256 indexed tokenId,
    uint256 timestamp  // ✅ When scanned
);

// Marketplace events
event TicketListed(...);
event TicketPurchased(..., createdAt);
```

**Available Metrics:**

- ✅ **Sales Over Time**: Track TicketPurchased events by block timestamp
- ✅ **Sales Velocity**: Tickets sold per day/hour
- ✅ **Peak Sales Periods**: When most tickets were sold
- ✅ **Check-in Timeline**: When attendees arrived (TicketValidated events)
- ✅ **Listing Activity**: Secondary market activity over time

---

## 🔧 How to Fetch Analytics Data

### **Method 1: Direct Contract Calls** (Current State)

```typescript
// 1. Get event data
const event = await ticketFactory.getEvent(eventId);
const totalSold = event.sold;
const capacity = event.totalSupply;
const primaryRevenue = await ticketFactory.eventProceedsNative(eventId);

// 2. Get ticket types
const ticketTypes = await ticketFactory.getTicketTypes(eventId);
const tierAnalytics = ticketTypes.map(tt => ({
  name: tt.name,
  sold: Number(tt.sold),
  supply: Number(tt.supply),
  revenue: tt.price * tt.sold,
  sellRate: (Number(tt.sold) / Number(tt.supply)) * 100
}));

// 3. Get all tickets (for attendance tracking)
const allTokens = await ticketNFT.tokenCounter();
let scannedCount = 0;
for (let tokenId = 1; tokenId <= allTokens; tokenId++) {
  const ticket = await ticketNFT.ticketDetails(tokenId);
  if (ticket.eventId === eventId && ticket.used) {
    scannedCount++;
  }
}

// 4. Get marketplace data
const listings = await marketplace.getAllListings();
const eventListings = listings.filter(l =>
  // Get ticket's eventId and match
);
```

### **Method 2: Event Logs** (Better for Historical Data)

```typescript
// Fetch TicketPurchased events for sales over time
const purchaseEvents = await ticketFactory.queryFilter(
  ticketFactory.filters.TicketPurchased(eventId)
);

const salesByDay = purchaseEvents.reduce((acc, event) => {
  const block = await event.getBlock();
  const date = new Date(block.timestamp * 1000).toDateString();
  acc[date] = (acc[date] || 0) + 1;
  return acc;
}, {});

// Fetch TicketValidated events for attendance
const validatedEvents = await ticketNFT.queryFilter(
  ticketNFT.filters.TicketValidated()
);
```

### **Method 3: The Graph (Recommended for Production)**

_Not currently implemented, but recommended for scaling_

```graphql
query EventAnalytics($eventId: ID!) {
  event(id: $eventId) {
    totalSold
    totalSupply
    revenue
    ticketTypes {
      name
      sold
      supply
      price
    }
    tickets {
      used
      purchasePrice
      purchaseTimestamp
    }
    marketplace {
      listings {
        price
        active
      }
      sales {
        price
        timestamp
        royaltyAmount
      }
    }
  }
}
```

---

## 📈 Analytics Dashboard - Feasible Metrics

### **✅ Can Implement Now:**

1. **Sales Metrics:**

   - Total tickets sold
   - Revenue by tier
   - Total primary revenue
   - Sales percentage (sold/supply)

2. **Ticket Type Analysis:**

   - Best-selling tiers
   - Tier capacity utilization
   - Revenue per tier
   - Average price per tier

3. **Secondary Market:**

   - Active listings count
   - Average resale price
   - Lowest/highest prices
   - Royalty revenue earned

4. **Attendance (Partial):**
   - Total tickets scanned
   - Scan rate percentage
   - Scanned by tier (requires iteration)

### **⏳ Limited (Requires Optimization):**

5. **Sales Over Time:**

   - Needs event log parsing
   - Can be expensive to fetch all events
   - Better with The Graph or indexer

6. **Detailed Attendance:**
   - Requires iterating all tokens
   - Expensive for large events (1000+ tickets)
   - Better with indexed events

### **❌ Not Available (Would Need Contract Changes):**

7. **User Demographics**: Not tracked
8. **Marketing Attribution**: Not tracked
9. **Refunds/Cancellations**: Not implemented
10. **Transfer History**: Would need to parse all Transfer events

---

## 🎯 Recommended Analytics Dashboard Implementation

### **Phase 1: Basic Metrics** (2-3 hours)

**Easy to implement, fast queries:**

```typescript
interface EventAnalytics {
  // Sales
  totalSold: number;
  totalCapacity: number;
  sellRate: number;
  primaryRevenue: bigint;

  // By Tier
  tierBreakdown: {
    name: string;
    sold: number;
    supply: number;
    revenue: bigint;
    sellRate: number;
  }[];

  // Secondary Market
  activeListings: number;
  avgResalePrice: bigint;
  lowestPrice: bigint;
  highestPrice: bigint;

  // Attendance (basic)
  ticketsScanned: number;
  scanRate: number;
}
```

**Data Sources:**

- `ticketFactory.getEvent(eventId)`
- `ticketFactory.getTicketTypes(eventId)`
- `ticketFactory.eventProceedsNative(eventId)`
- `marketplace.getAllListings()` + filter by event

### **Phase 2: Advanced Analytics** (Future)

**Requires event indexing or The Graph:**

- Sales timeline charts
- Peak sales periods
- Check-in timeline
- Historical pricing trends
- Royalty tracking over time

---

## 💡 Implementation Strategy

### **Option A: Client-Side (Simple)**

```typescript
// hooks/useEventAnalytics.ts
export function useEventAnalytics(eventId: number) {
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      // Fetch all data in parallel
      const [event, ticketTypes, revenue, listings] = await Promise.all([
        ticketFactory.getEvent(eventId),
        ticketFactory.getTicketTypes(eventId),
        ticketFactory.eventProceedsNative(eventId),
        marketplace.getAllListings(),
      ]);

      // Calculate metrics
      const analytics = computeAnalytics(event, ticketTypes, revenue, listings);
      setAnalytics(analytics);
      setLoading(false);
    }

    fetchAnalytics();
  }, [eventId]);

  return { analytics, loading };
}
```

### **Option B: Backend + Caching (Better)**

```typescript
// Cache analytics data, refresh every 5 minutes
// Avoids repeated RPC calls
// Faster load times
```

### **Option C: The Graph (Production)**

```typescript
// Index all events and compute analytics off-chain
// Sub-second query times
// Historical data readily available
```

---

## 🚀 Next Steps for Analytics Dashboard

**Recommended Approach:**

1. ✅ **Start with Phase 1** (Basic metrics, client-side)

   - Fast to implement (2-3 hours)
   - Covers 80% of use cases
   - Works with existing contracts

2. ⏳ **Add Event Scanning** (If needed)

   - Parse TicketPurchased events for sales timeline
   - Parse TicketValidated events for attendance timeline
   - Implement with RPC batching

3. 🔮 **Future: The Graph Integration**
   - For production scale
   - When event has 1000+ tickets
   - When real-time updates needed

---

## ✅ Conclusion

**YES - The contracts fully support an analytics dashboard!**

**Available Data:**

- ✅ Sales metrics (total, by tier, revenue)
- ✅ Ticket type performance
- ✅ Secondary market stats
- ✅ Basic attendance tracking
- ✅ Royalty revenue
- ⏳ Sales over time (via events)
- ⏳ Detailed attendance (via iteration)

**Recommended Implementation:**

- **Start with basic metrics** using view functions
- **Add charts** with recharts library
- **Phase 2**: Event log parsing for timelines
- **Future**: The Graph for scale

**Effort Estimate:**

- Basic Dashboard: 2-3 hours ✅
- With Charts: +1 hour
- Event Timeline: +1-2 hours
- **Total**: 4-6 hours for complete analytics

---

**Ready to build the analytics dashboard!** 📊🚀
