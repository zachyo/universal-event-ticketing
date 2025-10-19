# Phase 2 Quick Start Guide

## 🎯 Current Status

**Phase 1:** ✅ Complete - Deployed and tested  
**Phase 2:** 🚀 Ready to begin - Phase 2A (Core Features)

## 📋 Phase 2A Sprint (Core Features)

### Features to Implement

1. **Event Search & Filters** - Find events easily
2. **Enhanced Marketplace** - Batch operations + offers
3. **Mobile QR Codes** - Ticket verification

### Estimated Timeline: 1-2 weeks

## 🛠️ Getting Started

### Step 1: Install New Dependencies

```bash
cd frontend/ticketchain

npm install qrcode.react html5-qrcode recharts date-fns @tanstack/react-query
```

### Step 2: Contract Updates

Priority contracts to update:

1. `TicketMarketplace.sol` - Add batch operations and offers
2. `TicketFactory.sol` (optional) - Add category support

### Step 3: Frontend Structure

New directories to create:

```
src/
  components/
    search/
      SearchBar.tsx
      FilterPanel.tsx
      SearchResults.tsx
    marketplace/
      BulkListingModal.tsx
      OfferCard.tsx
      OfferManagement.tsx
    qr/
      QRDisplay.tsx
      QRScanner.tsx
      VerificationResult.tsx
  hooks/
    useEventSearch.ts
    useOffers.ts
    useQRCode.ts
  services/
    searchService.ts
    qrService.ts
```

## 📝 Implementation Order

### Week 1: Search & Marketplace

1. **Day 1-2:** Event search backend + UI
2. **Day 3-4:** Marketplace batch operations
3. **Day 5:** Offer system contracts

### Week 2: Mobile & Testing

1. **Day 6-7:** QR code generation + scanning
2. **Day 8-9:** Mobile optimization
3. **Day 10:** Testing and deployment

## 🎨 Design Considerations

### Search UX

- Instant search results (debounced 300ms)
- Clear filter indicators
- Mobile-friendly filter drawer
- Empty state with suggestions

### Marketplace UX

- Bulk selection with checkboxes
- Price preview before listing
- Offer notifications
- Transaction pending states

### Mobile UX

- Large touch targets (44px min)
- Bottom navigation
- Swipe gestures
- Offline mode for tickets

## 🧪 Testing Checklist

### Search & Filters

- [ ] Search finds events by name
- [ ] Search finds events by description
- [ ] Date filter works correctly
- [ ] Price filter works correctly
- [ ] Category filter works correctly
- [ ] Multiple filters combine properly
- [ ] Clear filters button works
- [ ] Search is performant (<300ms)

### Marketplace

- [ ] Batch list 5 tickets at once
- [ ] Batch delist works
- [ ] Make offer on listed ticket
- [ ] Accept offer
- [ ] Reject offer
- [ ] Offer expires correctly
- [ ] Royalties calculated correctly
- [ ] Gas costs reasonable

### QR Codes

- [ ] QR generates for ticket
- [ ] QR is unique per ticket
- [ ] Scanner reads QR correctly
- [ ] Verification checks on-chain status
- [ ] Offline verification works
- [ ] Animated QR displays properly
- [ ] Works on iOS and Android

## 📊 Success Metrics

Track these metrics during Phase 2A:

| Metric               | Target         | How to Measure              |
| -------------------- | -------------- | --------------------------- |
| Search Response Time | <300ms         | DevTools Network tab        |
| Bulk List 10 Tickets | <5s            | Time from submit to confirm |
| QR Generation        | <1s            | Console.time()              |
| QR Scan → Verify     | <2s            | End-to-end timing           |
| Mobile Performance   | Lighthouse >85 | Chrome DevTools             |

## 🚨 Common Issues & Solutions

### Issue: Search is slow

**Solution:** Implement debouncing, add indices, use memoization

### Issue: Batch operations fail

**Solution:** Reduce batch size, add gas estimation, implement chunking

### Issue: QR doesn't scan on some devices

**Solution:** Increase QR size, improve contrast, add manual entry fallback

### Issue: Mobile layout breaks

**Solution:** Use responsive breakpoints, test on real devices, add viewport meta tag

## 📚 Resources

### Documentation

- **Phase 2 Plan:** [`PHASE2_PLAN.md`](./PHASE2_PLAN.md)
- **Phase 1 Complete:** [`PHASE1_COMPLETE.md`](./PHASE1_COMPLETE.md)
- **Deployment Guide:** [`DEPLOYMENT_PHASE1.md`](./DEPLOYMENT_PHASE1.md)

### Useful Libraries

- **QR Codes:** https://github.com/zpao/qrcode.react
- **QR Scanner:** https://github.com/mebjas/html5-qrcode
- **Charts:** https://recharts.org/
- **Date Handling:** https://date-fns.org/

### Contract Standards

- **EIP-2981 (Royalties):** https://eips.ethereum.org/EIPS/eip-2981
- **ERC-721 (NFTs):** https://eips.ethereum.org/EIPS/eip-721
- **Gas Optimization:** https://www.alchemy.com/overviews/solidity-gas-optimization

## 🎯 Next Steps

Choose your starting point:

**Option A: Start with Search (Recommended)**

- Most visible to users
- No contract changes needed initially
- Can be done purely frontend

**Option B: Start with Marketplace**

- High value for power users
- Requires contract deployment
- Unlocks offer system

**Option C: Start with QR Codes**

- Quick win for mobile users
- Independent of other features
- Great for demos

### Recommended: Start with Search

```bash
# Create search components
mkdir -p frontend/ticketchain/src/components/search
mkdir -p frontend/ticketchain/src/hooks/search

# Start with SearchBar component
# Then add FilterPanel
# Finally integrate with EventsPage
```

---

**Ready to build Phase 2A!** 🚀

Which feature would you like to start with?
