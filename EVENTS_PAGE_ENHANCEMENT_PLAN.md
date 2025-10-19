# Events Page Enhancement Plan

**Date**: October 19, 2025  
**Current Page**: http://localhost:5173/events  
**Status**: Analysis Complete

---

## 📊 Current State Analysis

### What's Working ✅

1. **Event Listing** - Displays all active events with cards
2. **Search & Filter** - SearchBar and FilterPanel components
3. **Event Cards** - Show name, description, date, venue, availability
4. **Status Badges** - Live, Upcoming, Ended, Inactive
5. **Sold Out Indicators** - Clear visual feedback
6. **Responsive Grid** - Works on mobile and desktop

### What's Available in Smart Contracts 🔧

The `TicketFactory.sol` contract provides:

- ✅ Event details (EventData struct)
- ✅ Ticket types/tiers (TicketType struct)
- ✅ Organizer information
- ✅ Sales statistics (sold/totalSupply)
- ✅ Royalty settings
- ✅ Active status
- ✅ Batch queries (getEventsBatch, getTicketTypesBatch)

---

## 🎯 Missing Features & Enhancements

### 1. **Ticket Price Information** ⭐ HIGH PRIORITY

**Issue**: Event cards don't show ticket prices

**What's Missing**:

- No "Starting from $X" display
- Users must click into event to see pricing
- Poor UX for price comparison

**Smart Contract Data Available**:

```solidity
struct TicketType {
    uint256 eventId;
    string name;     // "VIP", "General Admission"
    uint256 price;   // Price in native currency
    uint256 supply;
    uint256 sold;
}
```

**Solution**:

```typescript
// Add to EventCard component
interface EventCardProps {
  event: FormattedEvent;
  ticketTypes?: TicketType[]; // NEW
  showPurchaseButton?: boolean;
}

// Display:
// "Starting from 0.01 PC" (lowest price)
// Or "VIP: 0.05 PC | GA: 0.01 PC" (multiple tiers)
```

**Implementation**:

- Fetch ticket types for all events using `getTicketTypesBatch()`
- Display minimum price on event card
- Show "Multiple tiers available" badge if >1 type

---

### 2. **Ticket Categories/Tiers Display** ⭐ HIGH PRIORITY

**Issue**: No indication of ticket variety

**What's Missing**:

- Users don't know if VIP/GA options exist
- Can't see tier availability
- No "Selling Fast" indicators

**Solution**:

```tsx
// Show on event card:
<div className="flex gap-2">
  <span className="badge">3 ticket types</span>
  <span className="badge-warning">VIP: 2 left</span>
  <span className="badge-success">GA: 50 left</span>
</div>
```

---

### 3. **Revenue/Popularity Indicators** ⭐ MEDIUM PRIORITY

**Issue**: No social proof or popularity metrics

**What's Missing**:

- How many tickets sold
- Selling velocity ("50 sold in last hour")
- Trending events
- "Almost sold out" warnings

**Smart Contract Data Available**:

```solidity
event.sold        // Total tickets sold
event.totalSupply // Total capacity
```

**Solution**:

```tsx
// Popularity indicators:
{
  event.sold > event.totalSupply * 0.8 && (
    <div className="badge-warning">
      🔥 Almost Sold Out - {event.totalSupply - event.sold} left
    </div>
  );
}

{
  event.sold > 100 && (
    <div className="badge-success">⭐ Popular - {event.sold} tickets sold</div>
  );
}
```

---

### 4. **Quick Actions** ⭐ MEDIUM PRIORITY

**Issue**: Users must navigate to detail page for all actions

**What's Missing**:

- Quick "Add to Watchlist" button
- Share event button
- Quick purchase (bypass detail page)
- Favorite/bookmark functionality

**Solution**:

```tsx
<div className="flex gap-2">
  <button className="icon-btn" title="Add to Watchlist">
    <Star />
  </button>
  <button className="icon-btn" title="Share">
    <Share2 />
  </button>
  <button className="icon-btn" title="Calendar">
    <CalendarPlus />
  </button>
</div>
```

---

### 5. **Advanced Filters** ⭐ MEDIUM PRIORITY

**Issue**: Limited filtering options

**What's Currently Available**:

- Status filter (upcoming/live/ended)
- Sort options

**What's Missing**:

- **Price range filter**: "$0-$10", "$10-$50", "$50+"
- **Date range filter**: "This week", "This month", "Custom range"
- **Venue/Location filter**: Filter by venue or location
- **Availability filter**: "Has tickets", "Sold out", "Limited tickets"
- **Category/Genre**: Music, Sports, Conference, etc. (requires contract update)

**Implementation**:

```typescript
interface EventFilters {
  status: "all" | "upcoming" | "live" | "ended";
  priceRange: "all" | "0-0.01" | "0.01-0.1" | "0.1+";
  dateRange: "all" | "today" | "this-week" | "this-month" | "custom";
  availability: "all" | "available" | "limited" | "sold-out";
  venue?: string;
  startDate?: Date;
  endDate?: Date;
}
```

---

### 6. **Event Organizer Info** ⭐ LOW PRIORITY

**Issue**: Limited organizer information

**Current Display**:

```tsx
<div className="text-xs text-gray-500 mb-4">Organized by 0xBD15...a0d9</div>
```

**Enhancement Opportunities**:

- Organizer reputation badge ("Verified Organizer")
- Past events count
- Average rating
- Link to organizer profile
- ENS name resolution
- Push Chain Profile integration

**Solution**:

```tsx
<div className="flex items-center gap-2">
  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
    <Shield className="w-4 h-4 text-blue-600" />
  </div>
  <div>
    <p className="text-sm font-medium">0xBD15...a0d9</p>
    <p className="text-xs text-gray-500">✓ Verified • 12 events hosted</p>
  </div>
</div>
```

---

### 7. **Countdown Timers** ⭐ LOW PRIORITY

**Issue**: Static "Starts in X days" display

**Enhancement**:

- Live countdown timer for upcoming events
- "Event starting soon" alerts
- Time zones support

**Solution**:

```tsx
import { useEffect, useState } from "react";

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-2 text-sm">
      <span>{timeLeft.days}d</span>
      <span>{timeLeft.hours}h</span>
      <span>{timeLeft.minutes}m</span>
      <span>{timeLeft.seconds}s</span>
    </div>
  );
}
```

---

### 8. **Map View** ⭐ WISHLIST

**Issue**: No geographical visualization

**Enhancement**:

- Toggle between grid and map view
- Show events on interactive map
- Filter by location/radius
- Requires geocoding venue addresses

**Dependencies**:

- Venue must be geocoded (lat/lng)
- Map library (Leaflet, Google Maps)
- Contract update to store coordinates

---

### 9. **Royalty Information** ⭐ WISHLIST

**Issue**: No secondary market info

**Smart Contract Data Available**:

```solidity
uint96 royaltyBps;  // Royalty basis points (e.g., 250 = 2.5%)
```

**Enhancement**:

- Show "2.5% creator fee on resale"
- Help users understand secondary market
- Display on event card or detail page

---

### 10. **Batch Loading Optimization** ⭐ TECHNICAL

**Issue**: Potential performance issues with many events

**Current State**:

- Events loaded individually or in one large batch
- Ticket types not loaded on events page

**Enhancement**:

```typescript
// Use contract's batch functions:
const { data: ticketTypesBatch } = useReadContract({
  address: TICKET_FACTORY_ADDRESS,
  abi: TicketFactoryABI,
  functionName: "getTicketTypesBatch",
  args: [eventIds], // Array of all visible event IDs
});

// Benefits:
// - Single contract call for all ticket types
// - Show prices without clicking into event
// - Better UX with complete information
```

---

## 🚀 Implementation Priority

### Phase 1: Critical UX Improvements (1-2 days)

1. ✅ **Add ticket pricing display** - Show "From 0.01 PC" on cards
2. ✅ **Add ticket type count** - "3 ticket types available"
3. ✅ **Implement getTicketTypesBatch** - Fetch all ticket types efficiently
4. ✅ **Add popularity indicators** - "Almost sold out", "Popular"

### Phase 2: Enhanced Filtering (1 day)

1. ✅ **Price range filter** - Filter events by ticket price
2. ✅ **Date range filter** - Filter by event date
3. ✅ **Availability filter** - Show only available events

### Phase 3: Polish & Extras (1-2 days)

1. ✅ **Quick actions** - Watchlist, share, calendar
2. ✅ **Organizer badges** - Verified status, event count
3. ✅ **Live countdowns** - Real-time timers for upcoming events

### Phase 4: Advanced Features (Future)

1. 🔮 **Map view** - Geographical event browsing
2. 🔮 **Categories/genres** - Requires contract update
3. 🔮 **Recommendations** - ML-based suggestions

---

## 📝 Code Examples

### Example 1: Enhanced EventCard with Pricing

```tsx
interface EventCardProps {
  event: FormattedEvent;
  ticketTypes?: TicketType[];
  showPurchaseButton?: boolean;
}

export function EventCard({
  event,
  ticketTypes = [],
  showPurchaseButton = true,
}: EventCardProps) {
  // Get minimum price from ticket types
  const minPrice = useMemo(() => {
    if (!ticketTypes.length) return null;
    return Math.min(...ticketTypes.map((t) => Number(t.price)));
  }, [ticketTypes]);

  const ticketTypeCount = ticketTypes.length;
  const hasMultipleTiers = ticketTypeCount > 1;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* ...existing code... */}

      {/* NEW: Pricing Section */}
      <div className="px-6 pb-4">
        {minPrice !== null && (
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500">Starting from</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(minPrice)} PC
              </p>
            </div>
            {hasMultipleTiers && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {ticketTypeCount} tiers
              </span>
            )}
          </div>
        )}

        {/* NEW: Availability Indicators */}
        <div className="flex gap-2 mb-3">
          {event.sold > event.totalSupply * 0.8 && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Almost Sold Out
            </span>
          )}
          {event.sold > 50 && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Popular
            </span>
          )}
        </div>

        {/* Existing action buttons */}
        {/* ... */}
      </div>
    </div>
  );
}
```

### Example 2: Fetch Ticket Types for All Events

```typescript
// In EventsPage.tsx or a new hook
export function useEventsWithTicketTypes() {
  const { events, loading: eventsLoading } = useEvents();

  // Get all event IDs
  const eventIds = useMemo(
    () => events.map((e) => BigInt(e.eventId)),
    [events]
  );

  // Batch fetch all ticket types
  const { data: ticketTypesBatch, isLoading: ticketTypesLoading } =
    useReadContract({
      address: TICKET_FACTORY_ADDRESS,
      abi: TicketFactoryABI,
      functionName: "getTicketTypesBatch",
      args: [eventIds],
      query: { enabled: eventIds.length > 0 },
    });

  // Combine events with their ticket types
  const eventsWithTicketTypes = useMemo(() => {
    if (!ticketTypesBatch || !events.length) return [];

    return events.map((event, index) => ({
      ...event,
      ticketTypes: ticketTypesBatch[index] || [],
    }));
  }, [events, ticketTypesBatch]);

  return {
    events: eventsWithTicketTypes,
    loading: eventsLoading || ticketTypesLoading,
  };
}
```

### Example 3: Enhanced Filter Component

```typescript
interface EventFilters {
  status: StatusFilter;
  priceRange: PriceRangeFilter;
  dateRange: DateRangeFilter;
  availability: AvailabilityFilter;
}

export function EnhancedFilterPanel({ filters, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Status Filter - Existing */}
      {/* ... */}

      {/* NEW: Price Range Filter */}
      <div>
        <h3 className="font-semibold mb-2">Price Range</h3>
        <select
          value={filters.priceRange}
          onChange={(e) => onChange({ ...filters, priceRange: e.target.value })}
          className="w-full border rounded px-3 py-2"
        >
          <option value="all">All Prices</option>
          <option value="0-0.01">Under 0.01 PC</option>
          <option value="0.01-0.1">0.01 - 0.1 PC</option>
          <option value="0.1-1">0.1 - 1 PC</option>
          <option value="1+">1+ PC</option>
        </select>
      </div>

      {/* NEW: Date Range Filter */}
      <div>
        <h3 className="font-semibold mb-2">When</h3>
        <select
          value={filters.dateRange}
          onChange={(e) => onChange({ ...filters, dateRange: e.target.value })}
          className="w-full border rounded px-3 py-2"
        >
          <option value="all">Any Time</option>
          <option value="today">Today</option>
          <option value="this-week">This Week</option>
          <option value="this-month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {/* NEW: Availability Filter */}
      <div>
        <h3 className="font-semibold mb-2">Availability</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Available Now</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm">Selling Fast</span>
          </label>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 UI/UX Considerations

### Visual Hierarchy

1. **Event image** - Primary visual anchor
2. **Price** - Most important info for decision-making
3. **Status badges** - Quick status indication
4. **Popularity indicators** - Social proof
5. **Details button** - Secondary action

### Color Psychology

- 🟢 **Green** - Available, Popular, Success
- 🔴 **Red** - Sold Out, Almost Gone, Urgent
- 🔵 **Blue** - Upcoming, Information, Neutral
- 🟡 **Yellow** - Warning, Limited, Attention
- ⚫ **Gray** - Inactive, Ended, Disabled

### Mobile Optimization

- Stack information vertically on small screens
- Larger tap targets for buttons
- Swipe gestures for filtering
- Infinite scroll vs pagination

---

## 🔧 Technical Considerations

### Performance

- ✅ Use `getTicketTypesBatch()` for efficient data fetching
- ✅ Implement virtual scrolling for 100+ events
- ✅ Cache event data in localStorage
- ✅ Lazy load event images

### Accessibility

- ✅ Proper ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast compliance

### Error Handling

- ✅ Loading skeletons
- ✅ Empty states
- ✅ Error boundaries
- ✅ Retry mechanisms

---

## 📊 Success Metrics

### User Engagement

- Time spent on events page
- Click-through rate to event details
- Filter usage statistics
- Purchase conversion rate

### Technical Metrics

- Page load time < 2s
- API calls reduced by 50% with batch fetching
- Zero layout shifts (CLS)
- 90+ Lighthouse score

---

## 🎯 Summary

**Highest Priority Enhancements:**

1. ⭐⭐⭐ **Ticket pricing display** - Show "From X PC" on every card
2. ⭐⭐⭐ **Ticket types indicator** - Show how many tiers available
3. ⭐⭐ **Price range filter** - Let users filter by budget
4. ⭐⭐ **Popularity indicators** - Social proof (sold count, trending)
5. ⭐ **Quick actions** - Wishlist, share, calendar

**Quick Wins (< 1 hour each):**

- Display minimum ticket price from ticketTypes array
- Add "X ticket types" badge
- Show "Almost sold out" when >80% sold
- Add "Popular" badge when sold > 50 tickets

**These enhancements will significantly improve the user experience and make the Events page feel complete and professional! 🚀**
