# Phase 1 Testing Guide

## 🎯 Quick Start

### Prerequisites

- Push Wallet installed and connected
- Test tokens on Push Chain Testnet
- Frontend dev server running

### Step 1: Start the Frontend

```bash
cd frontend/ticketchain
npm install  # If not already done
npm run dev
```

The app should open at `http://localhost:5173`

### Step 2: Connect Your Wallet

1. Click "Connect Wallet" in the top right
2. Select Push Wallet
3. Approve the connection

### Step 3: Get Test Tokens

Visit the Push Chain Testnet Faucet:

- https://faucet-testnet.push.org/

Request test PC tokens for transaction fees.

## 🧪 Testing Scenarios

### Test 1: Create Event with Ticket Types (Single Transaction)

**What to test:** New single-transaction event creation

1. Navigate to "Create Event" page
2. Fill in event details:
   - Name: "Phase 1 Test Event"
   - Description: "Testing batch optimizations"
   - Venue: "Virtual"
   - Image URL: (any valid image URL or IPFS hash)
   - Start/End dates
3. Add multiple ticket types:
   - VIP: 0.1 PC, 10 tickets
   - General: 0.05 PC, 50 tickets
   - Early Bird: 0.03 PC, 20 tickets
4. Click "Create Event"
5. **Expected:** Single transaction creates event + all ticket types
6. **Verify:** Check transaction on explorer

**Success Criteria:**

- ✅ Event created with all ticket types in 1 transaction
- ✅ All ticket types visible on event detail page
- ✅ Transaction confirmed on Push Chain Explorer

---

### Test 2: Purchase Ticket with Auto-Metadata

**What to test:** Automatic NFT metadata generation and IPFS upload

1. Navigate to Events list
2. Click on your test event
3. Select a ticket type (e.g., "VIP")
4. Click "Buy Ticket"
5. Confirm purchase in modal
6. **Observe loading states:**
   - "Processing purchase..." (during transaction)
   - "Preparing your ticket..." (during metadata generation)
   - "Purchase successful!" (complete)
7. Click "View in My Tickets"

**Success Criteria:**

- ✅ Purchase transaction succeeds
- ✅ Metadata automatically generated and uploaded to IPFS
- ✅ Loading states displayed correctly
- ✅ Success message with link to My Tickets
- ✅ Transaction on explorer shows TicketMinted event

---

### Test 3: My Tickets Page (Batch Optimization)

**What to test:** Optimized batch loading (1 call vs 1+N+M calls)

1. Navigate to "My Tickets" page
2. **Open browser DevTools → Network tab**
3. Filter for RPC calls
4. Refresh the page

**Success Criteria:**

- ✅ Only **2 RPC calls** instead of many (1 for ticket IDs, 1 for batch details)
- ✅ All tickets load instantly
- ✅ Ticket details display correctly:
  - Event name
  - Ticket type
  - Purchase price
  - Status (used/unused)

**Performance Comparison:**

- **Before:** 1 + N (tickets) + M (events) calls = ~10-50 calls
- **After:** 2 calls = ~95% reduction ✨

---

### Test 4: Metadata Verification

**What to test:** IPFS metadata and on-chain tokenURI

1. From My Tickets, click on a ticket
2. **Check metadata:**

   - Ticket should have IPFS URI set
   - Click IPFS link (if displayed)
   - Verify JSON metadata structure

3. **Or use contract directly:**

```bash
# Get tokenURI for tokenId 1
cast call 0xFCc2128e81343B069EdaF6cE55b6471387AeDD77 \
  "tokenURI(uint256)" 1 \
  --rpc-url https://evm.rpc-testnet-donut-node1.push.org/
```

**Expected Metadata Structure:**

```json
{
  "name": "Phase 1 Test Event - VIP",
  "description": "Testing batch optimizations",
  "image": "ipfs://QmEventImageHash",
  "attributes": [
    { "trait_type": "Event Name", "value": "Phase 1 Test Event" },
    { "trait_type": "Venue", "value": "Virtual" },
    { "trait_type": "Ticket Type", "value": "VIP" },
    { "trait_type": "Token ID", "value": 1 },
    { "trait_type": "Purchase Price (wei)", "value": "100000000000000000" },
    { "trait_type": "Purchase Chain", "value": "Push Chain Universal" }
  ]
}
```

**Success Criteria:**

- ✅ TokenURI set on-chain (ipfs://...)
- ✅ IPFS JSON accessible via gateway
- ✅ Metadata includes all expected fields
- ✅ Event image properly referenced

---

### Test 5: Batch Event Loading

**What to test:** Efficient event listing with getEventsBatch

1. Create 3-5 test events
2. Navigate to Events list
3. **Open DevTools → Network**
4. Refresh page

**Success Criteria:**

- ✅ Single batch call to load all events
- ✅ No individual event calls
- ✅ Fast page load (<2 seconds)
- ✅ All events display correctly

---

### Test 6: Error Handling

**What to test:** Graceful metadata failure handling

**Scenario A: Metadata generation fails**

1. Disconnect internet after purchase transaction
2. Purchase should succeed but metadata may fail
3. **Expected:** Ticket still minted and owned
4. **Expected:** Error logged but no user-facing failure

**Scenario B: Insufficient funds**

1. Try to purchase with insufficient balance
2. **Expected:** Clear error message
3. **Expected:** No partial state changes

**Success Criteria:**

- ✅ Purchase failures don't leave inconsistent state
- ✅ Metadata failures don't break the purchase
- ✅ Clear error messages to user
- ✅ Ticket ownership always correct

---

## 📊 Performance Metrics to Track

| Metric                   | Target  | How to Measure             |
| ------------------------ | ------- | -------------------------- |
| My Tickets Load Time     | <2s     | DevTools Performance tab   |
| RPC Calls (My Tickets)   | 2 calls | DevTools Network tab       |
| Event Creation Gas       | <300k   | Transaction receipt        |
| Purchase + Metadata Time | <10s    | Time from click to success |
| IPFS Upload Time         | <3s     | Console logs               |

## 🐛 Known Issues / Expected Behavior

1. **Metadata generation takes 3-5 seconds**

   - This is expected due to IPFS upload time
   - Loading state clearly indicates progress

2. **First load may be slower**

   - Contract reads are cached after first call
   - Subsequent loads should be instant

3. **Events require refresh after creation**
   - Cache invalidation strategy can be improved in Phase 2
   - For now, manual refresh works

## 🔍 Debugging Tips

### Check Contract State

```bash
# Get event details
cast call 0xc234D947D5b3f7037C32a1f87e419BC03219325b \
  "events(uint256)" 1 \
  --rpc-url https://evm.rpc-testnet-donut-node1.push.org/

# Get user tickets
cast call 0xFCc2128e81343B069EdaF6cE55b6471387AeDD77 \
  "getUserTickets(address)" YOUR_ADDRESS \
  --rpc-url https://evm.rpc-testnet-donut-node1.push.org/
```

### Check Console Logs

- Open browser DevTools → Console
- Look for:
  - ✅ "Metadata generated and uploaded"
  - ✅ "TokenURI set successfully"
  - ❌ Any error messages

### Verify Transactions

- Visit https://explorer-testnet.push.org/
- Search for your transaction hash
- Check logs for events:
  - `EventCreated`
  - `TicketMinted`
  - `TicketURISet`

## ✅ Testing Checklist

Copy this checklist for your testing session:

```
Phase 1 Testing - [Date]

[ ] Frontend starts successfully
[ ] Wallet connects to Push Chain
[ ] Test tokens obtained from faucet

Event Creation:
[ ] Single-transaction event creation works
[ ] Multiple ticket types added in one transaction
[ ] Event appears in events list
[ ] Transaction confirmed on explorer

Ticket Purchase:
[ ] Ticket purchase successful
[ ] Loading states display correctly
[ ] Metadata auto-generated and uploaded
[ ] TokenURI set on-chain
[ ] IPFS metadata accessible
[ ] Success message and redirect work

My Tickets Page:
[ ] Only 2 RPC calls made (not 10-50)
[ ] All tickets load quickly (<2s)
[ ] Ticket details correct
[ ] Performance significantly improved

Error Handling:
[ ] Purchase errors handled gracefully
[ ] Metadata failures don't break purchase
[ ] Clear user feedback on errors

Overall:
[ ] No TypeScript errors
[ ] No console errors
[ ] Smooth user experience
[ ] Performance metrics met
```

## 📝 Report Issues

If you find bugs or issues, please report with:

1. What you were testing
2. Expected behavior
3. Actual behavior
4. Screenshots/console logs
5. Transaction hash (if applicable)

Create an issue at: https://github.com/zachyo/universal-event-ticketing/issues

---

**Happy Testing!** 🎉

If everything works as expected, we can move to Phase 2 enhancements! 🚀
