# QR Code System - Quick Visual Guide 📸

## 🎫 The Complete Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TICKET HOLDER (User Side)                       │
└─────────────────────────────────────────────────────────────────────┘

Step 1: My Tickets Page
┌──────────────┐
│  [My Tickets]│ ← Navigate here
└──────────────┘
        ↓
┌────────────────────────────┐
│   🎫 Your Ticket Card      │
│   Event: Rock Concert      │
│   Date: Oct 20, 2025       │
│   [Show QR Code] ←─────────┼─── Click this button
└────────────────────────────┘
        ↓
┌────────────────────────────┐
│   📱 QR Modal Opens        │
│   ┌──────────────────┐    │
│   │  ████████████    │    │
│   │  ██  ▄▄  ██      │    │  ← QR Code displays instantly
│   │  ████████████    │    │
│   └──────────────────┘    │
│   [Download QR Code] ←─────┼─── Click to download
└────────────────────────────┘
        ↓
📥 ticket-123.png saved
        ↓
📧 Transfer to mobile:
   • Email yourself
   • WhatsApp/Telegram
   • USB transfer
   • Cloud storage


┌─────────────────────────────────────────────────────────────────────┐
│                  EVENT ORGANIZER (Scanner Side)                     │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Organizer Verification Page
┌──────────────────────────┐
│  /organizer-verification │ ← Navigate here
└──────────────────────────┘
        ↓
┌────────────────────────────┐
│  📷 Ticket Verification    │
│  ┌──────────────────┐     │
│  │                  │     │
│  │  Camera Preview  │     │
│  │                  │     │
│  └──────────────────┘     │
│  [Start Scanning] ←───────┼─── Click to start camera
└────────────────────────────┘
        ↓
┌────────────────────────────┐
│  📷 Camera Active          │
│  ┌──────────────────┐     │
│  │  🔵🔵🔵🔵🔵  │     │  ← Blue border = scanning
│  │  Live Camera     │     │
│  │  🔵🔵🔵🔵🔵  │     │
│  └──────────────────┘     │
│  Point at QR code →        │
└────────────────────────────┘
        ↓
┌────────────────────────────┐
│  ✅ VERIFICATION RESULT    │
│  ┌──────────────────┐     │
│  │   ✅ SUCCESS     │     │  ← Green border = Valid
│  │ Entry Permitted  │     │
│  │                  │     │
│  │ Ticket ID: #123  │     │
│  │ Event ID: #5     │     │
│  │ Owner: 0xabc...  │     │
│  └──────────────────┘     │
│  [Scan Next Ticket]        │
└────────────────────────────┘
```

---

## 🔄 QR Code Data Flow

```
┌──────────────┐
│   GENERATE   │  My Tickets Page
└──────┬───────┘
       │
       ▼
┌─────────────────────────────┐
│  QR Code Data (JSON)        │
├─────────────────────────────┤
│  tokenId: "123"             │  ← Unique ticket NFT ID
│  eventId: "5"               │  ← Event this ticket is for
│  owner: "0xabc...def"       │  ← Current owner address
│  contract: "0x123...456"    │  ← Smart contract address
│  chainId: 42101             │  ← Push Chain Testnet
│  timestamp: 1697654400000   │  ← When generated (24hr valid)
│  signature: "abc123"        │  ← Tamper protection hash
└─────────────────────────────┘
       │
       ▼
┌──────────────┐
│  PNG Image   │  Downloaded to device
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   DISPLAY    │  Show on mobile screen
└──────┬───────┘
       │
       ▼
┌──────────────┐
│     SCAN     │  Camera captures
└──────┬───────┘
       │
       ▼
┌─────────────────────────────┐
│     VERIFY (Step by Step)   │
├─────────────────────────────┤
│  1. ✓ Parse JSON            │
│  2. ✓ Check signature       │
│  3. ✓ Check timestamp       │
│  4. ✓ Query blockchain      │
│  5. ✓ Compare owner         │
│  6. ✓ Check if used         │
│  7. ✓ Verify event match    │
└─────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│        RESULT                │
├──────────────────────────────┤
│  ✅ Valid → Grant Entry      │
│  ❌ Invalid → Deny Entry     │
│  ⚠️  Warning → Check Again   │
└──────────────────────────────┘
```

---

## 📱 Device Setup for Testing

```
OPTION 1: Two Devices (Recommended)
┌─────────────┐              ┌─────────────┐
│   Device A  │              │   Device B  │
│  (Laptop)   │              │  (Mobile)   │
├─────────────┤              ├─────────────┤
│             │              │             │
│  Generate   │    Transfer  │   Display   │
│  QR Code    │─────────────→│   QR Code   │
│             │     via      │             │
│  [Scanner]  │     email    │             │
│     📷      │←─────────────│             │
│             │    Scan      │             │
└─────────────┘              └─────────────┘

OPTION 2: Three Devices (Best)
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Device A │    │ Device B │    │ Device C │
│ (Laptop) │    │ (Mobile) │    │ (Tablet) │
├──────────┤    ├──────────┤    ├──────────┤
│          │    │          │    │          │
│ Generate │───→│ Display  │    │  Scan    │
│ QR Code  │    │ QR Code  │←───│    📷    │
│          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘
```

---

## ✅ Verification Results Explained

```
┌─────────────────────────────────────────────────┐
│  ✅ VALID TICKET (Green Border)                 │
├─────────────────────────────────────────────────┤
│  Message: "Valid ticket! Entry permitted."      │
│                                                  │
│  Checks Passed:                                 │
│  ✓ QR format valid                              │
│  ✓ Signature matches (not tampered)            │
│  ✓ Timestamp < 24 hours                         │
│  ✓ Owner matches blockchain                     │
│  ✓ Ticket not used                              │
│  ✓ Event ID matches                             │
│                                                  │
│  Action: GRANT ENTRY ✅                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ❌ ALREADY USED (Red Border)                   │
├─────────────────────────────────────────────────┤
│  Message: "Ticket has already been used!"       │
│                                                  │
│  Checks Passed:                                 │
│  ✓ QR format valid                              │
│  ✓ Signature matches                            │
│  ✓ Timestamp valid                              │
│  ✓ Owner matches                                │
│  ✗ Ticket already marked as used                │
│                                                  │
│  Reason: Duplicate scan / Already entered       │
│  Action: DENY ENTRY ❌                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ⚠️  OWNER MISMATCH (Yellow Border)             │
├─────────────────────────────────────────────────┤
│  Message: "Owner mismatch! Ticket transferred." │
│                                                  │
│  Checks Passed:                                 │
│  ✓ QR format valid                              │
│  ✓ Signature matches                            │
│  ✓ Timestamp valid                              │
│  ✗ Owner in QR ≠ Owner on blockchain            │
│  ✓ Ticket not used                              │
│                                                  │
│  Reason: Ticket was sold/transferred            │
│  Action: Ask for NEW QR code from current owner │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ❌ EXPIRED QR (Red Border)                     │
├─────────────────────────────────────────────────┤
│  Message: "QR code expired (>24 hours old)"     │
│                                                  │
│  Checks Passed:                                 │
│  ✓ QR format valid                              │
│  ✓ Signature matches                            │
│  ✗ Timestamp > 24 hours old                     │
│                                                  │
│  Reason: Old QR code / Screenshot from past     │
│  Action: Ask for FRESH QR code                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ❌ TAMPERED QR (Red Border)                    │
├─────────────────────────────────────────────────┤
│  Message: "Invalid signature - tampered!"       │
│                                                  │
│  Checks Passed:                                 │
│  ✓ QR format valid (JSON parses)               │
│  ✗ Signature mismatch                           │
│                                                  │
│  Reason: Someone edited the QR data             │
│  Action: DENY ENTRY - FRAUD ATTEMPT ❌          │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Quick Testing Steps

### For Ticket Holder:

```
1. Go to: http://localhost:5175
2. Click: "My Tickets"
3. Click: "Show QR Code"
4. Click: "Download QR Code"
5. Transfer PNG to mobile device
6. Open PNG on mobile
```

### For Event Organizer:

```
1. Go to: http://localhost:5175/organizer-verification
2. Click: "Start Scanning"
3. Allow camera access
4. Point camera at QR on mobile screen
5. Wait 1-2 seconds
6. View result (green/red/yellow)
```

---

## 🔐 Security Features

```
┌──────────────────────────────────────────┐
│          SECURITY LAYERS                 │
├──────────────────────────────────────────┤
│  1. Signature Hash                       │
│     Prevents: Editing QR data            │
│     Method: Hash(tokenId+owner+event)    │
│                                          │
│  2. Timestamp Expiry (24hr)              │
│     Prevents: Old screenshot reuse       │
│     Method: Compare Date.now()           │
│                                          │
│  3. Blockchain Owner Check               │
│     Prevents: Using transferred tickets  │
│     Method: Query ownerOf(tokenId)       │
│                                          │
│  4. Usage Status Check                   │
│     Prevents: Duplicate entries          │
│     Method: Query ticketDetails.isUsed   │
│                                          │
│  5. Event ID Verification                │
│     Prevents: Wrong event tickets        │
│     Method: Compare eventId values       │
└──────────────────────────────────────────┘
```

---

## 📸 Camera Tips

```
✅ DO:
• Use good lighting (overhead or natural)
• Hold QR 15-30cm from camera
• Keep QR flat and steady (2-3 seconds)
• Fill ~50% of scanner box with QR
• Use landscape mode for bigger QR display

❌ DON'T:
• Don't use in very dark rooms
• Don't move while scanning
• Don't hold too close (<10cm)
• Don't hold too far (>50cm)
• Don't use low-quality screenshots
```

---

## 🚀 Summary

```
1. Ticket holders generate QR with all ticket data
2. QR is valid for 24 hours (anti-fraud)
3. Download PNG and display on mobile
4. Organizers scan QR with camera
5. System verifies against blockchain
6. Green = entry granted
7. Red/Yellow = entry denied
```

**It's that simple!** 🎉

---

**Status:** ✅ Ready to Test  
**URL:** http://localhost:5175  
**Dev Server:** Running on port 5175
