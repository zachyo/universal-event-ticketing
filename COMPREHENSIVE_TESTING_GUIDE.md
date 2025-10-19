# TicketChain DApp - Comprehensive Testing Guide 🎫

**Version:** 1.0  
**Last Updated:** October 19, 2025  
**Tester:** ********\_********  
**Testing Date:** ********\_********

---

## 📋 Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Core Features Testing](#core-features-testing)
3. [Advanced Features Testing](#advanced-features-testing)
4. [Security & Edge Cases](#security--edge-cases)
5. [Performance Testing](#performance-testing)
6. [Mobile & Responsive Testing](#mobile--responsive-testing)
7. [Integration Testing](#integration-testing)
8. [Bug Report Template](#bug-report-template)

---

## 🚀 Pre-Testing Setup

### 1. Environment Setup

```bash
# Start the frontend
cd frontend/ticketchain
npm install
npm run dev

# Verify server running
# Expected: http://localhost:5173/
```

**Checklist:**

- [ ] Dev server starts without errors
- [ ] No console errors on initial load
- [ ] Page loads with proper styling
- [ ] All assets (images, fonts) load correctly

### 2. Wallet Connection

**Steps:**

1. Click "Connect Wallet" button
2. Select Push Wallet (or MetaMask)
3. Approve connection

**Verify:**

- [ ] Wallet connects successfully
- [ ] Address displays in header (truncated: 0x1234...5678)
- [ ] Network shows "Push Chain Testnet"
- [ ] Balance displayed correctly

### 3. Get Test Tokens

**Faucet:** https://faucet-testnet.push.org/

**Get:**

- [ ] At least 1 PC for gas fees
- [ ] Test tokens in wallet
- [ ] Can view balance in wallet

---

## 🎯 Core Features Testing

### Feature 1: Homepage & Navigation

#### Test 1.1: Landing Page Display

**URL:** `http://localhost:5173/`

**Verify:**

- [ ] Hero section loads with title
- [ ] "Get Started" button visible
- [ ] Features section displays 3 cards:
  - [ ] Multi-Chain Freedom
  - [ ] True Ownership
  - [ ] Universal Marketplace
- [ ] "How It Works" section shows 3 steps
- [ ] Footer displays with links

**Pass/Fail:** \_\_\_

#### Test 1.2: Navigation Menu

**Steps:** Click each nav link

**Verify:**

- [ ] "Events" → Takes to /events
- [ ] "Marketplace" → Takes to /marketplace
- [ ] "Create Event" → Takes to /create-event
- [ ] "My Tickets" → Takes to /my-tickets
- [ ] "Verify" → Takes to /verify
- [ ] Back button works from each page
- [ ] Active route highlighted in nav

**Pass/Fail:** \_\_\_

---

### Feature 2: Browse Events

#### Test 2.1: Events List Page

**URL:** `/events`

**Verify:**

- [ ] Events grid displays (or empty state)
- [ ] Each event card shows:
  - [ ] Event image
  - [ ] Event name
  - [ ] Date & time
  - [ ] Venue
  - [ ] "View Details" button
- [ ] Loading state while fetching
- [ ] Empty state if no events

**Pass/Fail:** \_\_\_

#### Test 2.2: Event Detail Page

**URL:** `/events/:id`

**Steps:**

1. Click "View Details" on any event
2. Observe event detail page

**Verify:**

- [ ] Event banner image displays
- [ ] Event name, date, venue shown
- [ ] Description displays fully
- [ ] Ticket types listed with:
  - [ ] Type name (VIP, General, etc.)
  - [ ] Price in PC
  - [ ] Available quantity
  - [ ] "Buy Ticket" button
- [ ] Organizer address shown
- [ ] Event status (Active/Inactive)

**Pass/Fail:** \_\_\_

---

### Feature 3: Create Event (Organizer)

#### Test 3.1: Basic Event Creation

**URL:** `/create-event`

**Steps:**

1. Fill in all required fields:

   - Event Name: "Test Concert 2025"
   - Description: "An amazing live performance"
   - Venue: "Madison Square Garden"
   - Start Date: Tomorrow
   - Start Time: 18:00
   - End Time: (auto-filled to 21:00)
   - Total Supply: 100
   - Royalty: 5%

2. Upload event image (any PNG/JPG)

3. Add ticket type:

   - Name: "General Admission"
   - Price: 0.05 PC
   - Supply: 100

4. Click "Create Event"

**Verify:**

- [ ] All fields accept input
- [ ] Image preview shows after upload
- [ ] Character counter shows (0/2000) for description
- [ ] End time auto-calculates (+3 hours)
- [ ] Estimated revenue shows: "5 PC"
- [ ] Transaction modal appears
- [ ] Transaction succeeds
- [ ] Success message displays
- [ ] Redirect to event detail page
- [ ] Event appears in Events list

**Pass/Fail:** \_\_\_

#### Test 3.2: Multiple Ticket Tiers

**Steps:**

1. Create event as above
2. Add 3 ticket types:
   - VIP: 0.1 PC, 10 tickets
   - General: 0.05 PC, 50 tickets
   - Early Bird: 0.03 PC, 40 tickets

**Verify:**

- [ ] Can add multiple ticket types
- [ ] Revenue calculator shows: "7.7 PC"
- [ ] All ticket types created in single transaction
- [ ] All tiers visible on event detail page

**Pass/Fail:** \_\_\_

#### Test 3.3: Duplicate Ticket Type

**Steps:**

1. Add first ticket type: "VIP Gold", 0.1 PC, 20 tickets
2. Click "Duplicate" button (blue with Copy icon)
3. Edit duplicated ticket: "VIP Silver", 0.08 PC, 30 tickets

**Verify:**

- [ ] Duplicate button creates copy
- [ ] Duplicated ticket has "(Copy)" suffix
- [ ] Can edit duplicated ticket independently
- [ ] Revenue updates correctly (5 PC)

**Pass/Fail:** \_\_\_

#### Test 3.4: Draft Auto-Save

**Steps:**

1. Fill in partial event data:
   - Name: "Draft Test Event"
   - Description: "Testing auto-save"
   - Venue: "Test Venue"
2. Wait 30 seconds (or adjust code for faster testing)
3. Close browser tab
4. Reopen `/create-event`

**Verify:**

- [ ] "Draft saved at XX:XX:XX" indicator appears after 30s
- [ ] Blue banner shows "Continue from draft?" on return
- [ ] "Load Draft" button restores all data
- [ ] "Discard" button clears draft
- [ ] Draft cleared after successful event creation

**Pass/Fail:** \_\_\_

---

### Feature 4: Purchase Tickets

#### Test 4.1: Buy Ticket (Primary Market)

**URL:** `/events/:id` (on event detail page)

**Steps:**

1. Navigate to an active event
2. Select a ticket type (e.g., "General Admission")
3. Click "Buy Ticket"
4. Confirm purchase in modal
5. Approve transaction in wallet

**Verify:**

- [ ] Purchase modal displays with:
  - [ ] Ticket type name
  - [ ] Price
  - [ ] Quantity selector
  - [ ] Total cost
- [ ] Loading states display:
  - [ ] "Processing purchase..."
  - [ ] "Preparing your ticket..."
- [ ] Transaction succeeds
- [ ] Success message with "View in My Tickets" link
- [ ] NFT minted to your address
- [ ] Metadata auto-generated and uploaded to IPFS
- [ ] Ticket appears in My Tickets immediately

**Pass/Fail:** \_\_\_

#### Test 4.2: Multiple Ticket Purchase

**Steps:**

1. Select ticket type
2. Change quantity to 3
3. Complete purchase

**Verify:**

- [ ] Total cost updates (3 × price)
- [ ] 3 NFTs minted
- [ ] All 3 tickets appear in My Tickets
- [ ] Event's "sold" count increases by 3

**Pass/Fail:** \_\_\_

#### Test 4.3: Insufficient Funds

**Steps:**

1. Try to buy ticket with insufficient balance
2. Observe error handling

**Verify:**

- [ ] Clear error message: "Insufficient funds"
- [ ] Transaction reverts
- [ ] No partial state changes
- [ ] User can retry after adding funds

**Pass/Fail:** \_\_\_

---

### Feature 5: My Tickets (NFT Collection)

#### Test 5.1: View Owned Tickets

**URL:** `/my-tickets`

**Verify:**

- [ ] All owned tickets display
- [ ] Only 2 RPC calls made (check Network tab)
- [ ] Each ticket card shows:
  - [ ] Event image
  - [ ] Event name
  - [ ] Ticket type
  - [ ] Token ID
  - [ ] Purchase price
  - [ ] Status (Used/Unused)
  - [ ] "Show QR Code" button
  - [ ] "List on Marketplace" button
- [ ] Loading state while fetching
- [ ] Empty state if no tickets

**Performance:**

- [ ] Page loads in < 2 seconds
- [ ] Batch loading optimization working (2 calls vs 10-50)

**Pass/Fail:** \_\_\_

#### Test 5.2: QR Code Generation

**Steps:**

1. Click "Show QR Code" on any ticket
2. Observe QR modal

**Verify:**

- [ ] Modal opens instantly (no freeze)
- [ ] QR code displays within 100ms
- [ ] QR contains encoded data:
  - [ ] Token ID
  - [ ] Event ID
  - [ ] Owner address
  - [ ] Timestamp
  - [ ] Signature hash
- [ ] "Download QR Code" button works
- [ ] PNG downloads as `ticket-{tokenId}.png`
- [ ] Can close and reopen modal
- [ ] Page remains responsive

**Pass/Fail:** \_\_\_

---

### Feature 6: Secondary Marketplace

#### Test 6.1: List Ticket for Resale

**URL:** `/my-tickets`

**Steps:**

1. Click "List on Marketplace" on unused ticket
2. Enter listing price (e.g., 0.08 PC)
3. Confirm listing

**Verify:**

- [ ] Listing modal displays
- [ ] Can set custom price
- [ ] Transaction succeeds
- [ ] NFT transferred to marketplace contract
- [ ] Listing appears on Marketplace page
- [ ] Ticket shows "Listed" status in My Tickets

**Pass/Fail:** \_\_\_

#### Test 6.2: Browse Marketplace

**URL:** `/marketplace`

**Verify:**

- [ ] Active listings display
- [ ] Each listing shows:
  - [ ] Event details
  - [ ] Ticket type
  - [ ] Price
  - [ ] Seller address
  - [ ] "Buy Now" button
- [ ] Can filter by event (if implemented)
- [ ] Empty state if no listings

**Pass/Fail:** \_\_\_

#### Test 6.3: Buy from Marketplace

**Steps:**

1. Navigate to Marketplace
2. Click "Buy Now" on a listing
3. Confirm purchase

**Verify:**

- [ ] Purchase modal displays
- [ ] Shows price and details
- [ ] Transaction succeeds
- [ ] NFT transferred to buyer
- [ ] Payment split:
  - [ ] Seller receives (price - royalty)
  - [ ] Organizer receives royalty (5%)
- [ ] Listing removed from marketplace
- [ ] Ticket appears in buyer's My Tickets
- [ ] Previous owner loses ticket

**Pass/Fail:** \_\_\_

#### Test 6.4: Cancel Listing

**Steps:**

1. List a ticket
2. Go to My Tickets
3. Click "Cancel Listing" (if button exists)

**Verify:**

- [ ] NFT returned to owner
- [ ] Listing removed from marketplace
- [ ] Status changes to "Unlisted"

**Pass/Fail:** \_\_\_

---

### Feature 7: Ticket Verification (Organizer)

#### Test 7.1: QR Code Scanning

**URL:** `/organizer-scan`

**Requirements:**

- [ ] Must be event organizer (event creator)
- [ ] Need 2 devices (or mobile + desktop)
- [ ] Camera permission granted

**Steps:**

1. Generate QR code on My Tickets (Device A)
2. Download QR as PNG
3. Transfer to mobile device
4. Open `/organizer-scan` (Device B)
5. Click "Start Scanning"
6. Hold QR code in front of camera

**Verify:**

- [ ] Camera permission prompt appears
- [ ] Camera preview shows
- [ ] Blue scanning border visible
- [ ] QR automatically detected (1-2 seconds)
- [ ] Verification result displays:

**✅ Valid Ticket (Green Border):**

- [ ] "Valid ticket! Entry permitted" message
- [ ] Shows ticket details
- [ ] Shows verification checks:
  - [ ] ✅ Valid QR Format
  - [ ] ✅ Owner verification passed
  - [ ] ✅ Unused ticket
- [ ] "Scan Next Ticket" button works

**❌ Already Used (Red Border):**

- [ ] "Ticket has already been used!" message
- [ ] Shows used status

**⚠️ Owner Mismatch (Yellow Border):**

- [ ] "Owner mismatch" warning
- [ ] Suggests regenerating QR

**❌ Expired QR (Red Border):**

- [ ] "QR code expired" error (if > 24 hours old)

**Pass/Fail:** \_\_\_

#### Test 7.2: Mark Ticket as Used

**Steps:**

1. Scan valid ticket
2. After verification, system marks ticket as used
3. Rescan same QR code

**Verify:**

- [ ] First scan: ✅ Valid
- [ ] Ticket marked used on blockchain
- [ ] Second scan: ❌ Already used
- [ ] Cannot transfer used ticket
- [ ] Status updates in My Tickets

**Pass/Fail:** \_\_\_

---

### Feature 8: Event Analytics (Organizer)

#### Test 8.1: Analytics Dashboard

**URL:** `/event-analytics/:eventId`

**Requirements:**

- [ ] Must be event organizer
- [ ] Event must have some sales

**Verify:**

- [ ] Stats cards display:
  - [ ] Total Tickets Sold
  - [ ] Total Revenue
  - [ ] Active Listings (secondary market)
  - [ ] Tickets Scanned
- [ ] Attendance Tracker shows:
  - [ ] Progress bar (% scanned)
  - [ ] Scanned count
  - [ ] Not scanned count
- [ ] Secondary Market Stats show:
  - [ ] Active listings
  - [ ] Resold tickets
  - [ ] Price range (lowest, average, highest)
- [ ] Charts/graphs display (if implemented)
- [ ] Real-time updates (when new sales occur)

**Pass/Fail:** \_\_\_

---

## 🔒 Security & Edge Cases

### Security Test 1: Transfer Detection

**Scenario:** Ticket transferred after QR generation

**Steps:**

1. User A generates QR code
2. User A lists ticket on marketplace
3. User B buys ticket
4. User A tries to use old QR code

**Expected:**

- [ ] Scan shows ⚠️ "Owner mismatch"
- [ ] User B must generate new QR
- [ ] User A's old QR invalid

**Pass/Fail:** \_\_\_

### Security Test 2: Duplicate Prevention

**Steps:**

1. Mark ticket as used
2. Try to transfer used ticket

**Expected:**

- [ ] Transfer transaction reverts
- [ ] Error: "Ticket already used"
- [ ] NFT locked to current owner

**Pass/Fail:** \_\_\_

### Security Test 3: Tampered QR Code

**Steps:**

1. Generate valid QR
2. Manually edit JSON (change owner address)
3. Create QR from edited data
4. Scan tampered QR

**Expected:**

- [ ] ❌ "Invalid signature" error
- [ ] Scan rejected
- [ ] Clear fraud warning

**Pass/Fail:** \_\_\_

### Edge Case 1: Sold Out Event

**Steps:**

1. Create event with 5 ticket supply
2. Buy all 5 tickets
3. Try to buy 6th ticket

**Expected:**

- [ ] "Sold Out" status shown
- [ ] Buy button disabled
- [ ] Clear message: "No tickets available"

**Pass/Fail:** \_\_\_

### Edge Case 2: Event Not Started

**Steps:**

1. Create future event (start time tomorrow)
2. Try to validate ticket before start time

**Expected:**

- [ ] Warning message (if implemented)
- [ ] Allow validation (organizer decision)

**Pass/Fail:** \_\_\_

### Edge Case 3: Very Large Numbers

**Steps:**

1. Create ticket with price: 100 PC
2. Set supply: 999999

**Expected:**

- [ ] Revenue calculator: "99999900 PC"
- [ ] No JavaScript errors
- [ ] BigInt handles correctly

**Pass/Fail:** \_\_\_

---

## ⚡ Performance Testing

### Performance Test 1: Initial Load Time

**Measure:**

1. Open DevTools → Network tab
2. Hard refresh (Ctrl+Shift+R)
3. Check "Load" time

**Targets:**

- [ ] Initial HTML: < 100ms
- [ ] Total page load: < 2s
- [ ] First Contentful Paint: < 1s
- [ ] Time to Interactive: < 3s

**Pass/Fail:** \_\_\_

### Performance Test 2: My Tickets Optimization

**Measure:**

1. Own 10+ tickets
2. Open DevTools → Network
3. Navigate to My Tickets
4. Count RPC calls

**Targets:**

- [ ] Only 2 RPC calls (not 10-50)
- [ ] Page load: < 2 seconds
- [ ] 95% reduction in calls vs old method

**Pass/Fail:** \_\_\_

### Performance Test 3: Event Creation Gas Cost

**Measure:**

1. Create event with 3 ticket types
2. Check transaction receipt

**Target:**

- [ ] Gas used: < 300,000
- [ ] Single transaction (not 4 separate)

**Pass/Fail:** \_\_\_

### Performance Test 4: IPFS Upload Time

**Measure:**

1. Upload event image
2. Time from click to IPFS hash returned

**Target:**

- [ ] Upload time: < 5 seconds
- [ ] Progress indicator shown
- [ ] No UI freeze during upload

**Pass/Fail:** \_\_\_

---

## 📱 Mobile & Responsive Testing

### Mobile Test 1: iPhone (375px width)

**Test on:**

- [ ] iPhone SE / iPhone 12 Mini

**Verify:**

- [ ] All pages render correctly
- [ ] Navigation menu collapses to hamburger
- [ ] Cards stack vertically
- [ ] Forms remain usable
- [ ] Buttons accessible
- [ ] Images scale properly
- [ ] No horizontal scroll
- [ ] Touch targets > 44px

**Pass/Fail:** \_\_\_

### Mobile Test 2: Android (360px width)

**Test on:**

- [ ] Samsung Galaxy S21 / Pixel 5

**Verify:**

- [ ] Same checks as iPhone
- [ ] Camera works for QR scanning
- [ ] Wallet connects properly
- [ ] Transactions process

**Pass/Fail:** \_\_\_

### Tablet Test: iPad (768px width)

**Verify:**

- [ ] 2-column grid layouts
- [ ] Readable text sizes
- [ ] Navigation remains visible
- [ ] Forms comfortable to use

**Pass/Fail:** \_\_\_

### Desktop Test: Large Screen (1920px width)

**Verify:**

- [ ] Content doesn't stretch too wide
- [ ] Max-width containers work
- [ ] Images don't pixelate
- [ ] Readable from normal distance

**Pass/Fail:** \_\_\_

---

## 🔗 Integration Testing

### Integration Test 1: End-to-End Flow

**Complete User Journey:**

1. **Organizer Creates Event**

   - [ ] Create event: "E2E Test Concert"
   - [ ] Add 2 ticket types
   - [ ] Upload image
   - [ ] Submit transaction

2. **Buyer Purchases Ticket**

   - [ ] Browse events
   - [ ] Find "E2E Test Concert"
   - [ ] Buy General ticket
   - [ ] Transaction succeeds
   - [ ] Ticket appears in My Tickets

3. **Generate QR Code**

   - [ ] Open My Tickets
   - [ ] Click "Show QR Code"
   - [ ] Download PNG

4. **Organizer Verifies**

   - [ ] Open Organizer Verification
   - [ ] Scan buyer's QR
   - [ ] ✅ Valid ticket shown
   - [ ] Mark as used (if manual)

5. **Secondary Market**

   - [ ] Buyer lists ticket for 0.08 PC
   - [ ] Second buyer purchases from marketplace
   - [ ] Royalty paid to organizer
   - [ ] Ticket transfers to new owner

6. **Analytics Check**
   - [ ] Organizer views analytics
   - [ ] Stats show: 2 sold, 1 scanned, 1 resold
   - [ ] Revenue displays correctly

**All Steps Complete:** [ ] Yes [ ] No

**Pass/Fail:** \_\_\_

---

## 🐛 Bug Report Template

```markdown
### Bug #\_\_\_

**Title:** [Short description]

**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low

**Steps to Reproduce:**

1.
2.
3.

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Environment:**

- Browser: [Chrome 118 / Firefox 119 / Safari 16]
- Device: [Desktop / Mobile]
- OS: [Windows / macOS / Linux / iOS / Android]
- Wallet: [Push Wallet / MetaMask]

**Screenshots:**
[Attach if applicable]

**Console Errors:**
```

[Paste any error messages]

```

**Transaction Hash:**
[If applicable]

**Additional Notes:**
[Any other relevant information]
```

---

## ✅ Final Testing Checklist

### Functionality (Must Pass All)

- [ ] Home page displays correctly
- [ ] Can connect wallet
- [ ] Can browse events
- [ ] Can create event (organizer)
- [ ] Can purchase ticket (buyer)
- [ ] Tickets appear in My Tickets
- [ ] QR code generation works
- [ ] QR code verification works
- [ ] Can list ticket on marketplace
- [ ] Can buy from marketplace
- [ ] Analytics dashboard displays

### Performance (Targets)

- [ ] Page load < 2 seconds
- [ ] My Tickets uses only 2 RPC calls
- [ ] Event creation gas < 300k
- [ ] IPFS upload < 5 seconds

### Security (Must Pass All)

- [ ] Owner verification works
- [ ] Duplicate prevention works
- [ ] Tampered QR rejected
- [ ] Used tickets blocked from transfer

### UX/UI (Must Pass All)

- [ ] No console errors
- [ ] Loading states present
- [ ] Error messages clear
- [ ] Success feedback shown
- [ ] Mobile responsive
- [ ] Accessible (keyboard nav)

### Edge Cases (Should Handle Gracefully)

- [ ] Sold out events
- [ ] Insufficient funds
- [ ] Network errors
- [ ] Large numbers
- [ ] Empty states

---

## 📊 Testing Results Summary

**Total Tests:** **_  
**Passed:** _**  
**Failed:** **_  
**Blocked:** _**  
**Pass Rate:** \_\_\_%

**Critical Issues Found:** \_\_\_

**Overall Assessment:**
[ ] Ready for Production
[ ] Needs Minor Fixes
[ ] Needs Major Fixes
[ ] Not Ready

**Tester Signature:** ********\_********  
**Date:** ********\_********

**Reviewer Signature:** ********\_********  
**Date:** ********\_********

---

## 🚀 Production Deployment Checklist

Before going live:

- [ ] All critical tests passing
- [ ] No security vulnerabilities
- [ ] Performance targets met
- [ ] Mobile fully functional
- [ ] Error tracking implemented
- [ ] Analytics tracking setup
- [ ] User documentation complete
- [ ] Support channels ready
- [ ] Backup/recovery plan in place
- [ ] Monitoring/alerting configured

**Approved for Production:** [ ] Yes [ ] No

---

**Good luck with testing! 🎉**

**Questions or issues?** Open an issue on GitHub or contact the development team.
