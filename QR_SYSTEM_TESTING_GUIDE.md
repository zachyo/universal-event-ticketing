# QR Code System - Complete Testing Guide 🎫

**Last Updated:** October 18, 2025  
**Feature:** Ticket QR Code Generation & Verification

---

## 🎯 Overview

The QR code system allows:

1. **Ticket Holders** - Download QR code to prove ticket ownership
2. **Event Organizers** - Scan QR codes to verify tickets and grant entry

---

## 📱 How The QR Code System Works

### 1. **QR Code Generation (Ticket Holder Side)**

When a user clicks "Show QR Code" on their ticket:

```typescript
// Data encoded in QR code:
{
  tokenId: "123",           // Unique ticket NFT ID
  eventId: "5",             // Event this ticket is for
  owner: "0xabc...def",     // Current owner address
  contract: "0x123...456",  // TicketNFT contract address
  chainId: 42101,           // Push Chain Testnet
  timestamp: 1697654400000, // When QR was generated
  signature: "abc123"       // Hash to prevent tampering
}
```

**Key Points:**

- QR contains ALL verification data
- Timestamp shows when generated (24hr validity)
- Signature prevents tampering
- Can work offline (once generated)

### 2. **QR Code Verification (Organizer Side)**

When organizer scans a QR code:

```typescript
// Verification Steps:
1. Parse QR code JSON data
2. Verify signature (not tampered)
3. Check timestamp (< 24 hours old)
4. Query blockchain for ticket details
5. Compare owner in QR vs blockchain
6. Check if ticket already used
7. Show PASS/FAIL result
```

**Verification Checks:**

- ✅ **Valid QR Format** - JSON parses correctly
- ✅ **Valid Signature** - Hash matches (not tampered)
- ✅ **Not Expired** - Generated < 24 hours ago
- ✅ **Owner Match** - Owner in QR = current owner on blockchain
- ✅ **Not Used** - Ticket status is not "used"
- ✅ **Correct Event** - EventId matches expected event

---

## 🧪 Testing Workflow

### **PART 1: Generate & Download QR Code (Ticket Holder)**

#### Step 1: Navigate to My Tickets

```
URL: http://localhost:5175
1. Connect your wallet
2. Click "My Tickets" in navigation
3. Find a ticket you own
```

#### Step 2: View QR Code

```
1. Click "Show QR Code" button on ticket card
2. ✅ Modal opens instantly (no freeze)
3. ✅ QR code displays within 100ms
4. ✅ Page remains responsive
```

#### Step 3: Download QR Code

```
1. Click "Download QR Code" button in modal
2. ✅ PNG file downloads
3. ✅ Filename: ticket-{tokenId}.png
4. ✅ File size: ~10-20KB
```

#### Step 4: Transfer to Mobile Device

```
Option A - Email:
1. Email the PNG to yourself
2. Open on mobile device
3. Save to photos

Option B - Cloud Storage:
1. Upload to Google Drive/Dropbox
2. Download on mobile device

Option C - Direct Transfer:
1. Use USB cable
2. Copy to phone storage

Option D - Messaging:
1. Send via WhatsApp/Telegram to yourself
2. Download on mobile device
```

---

### **PART 2: Scan & Verify QR Code (Event Organizer)**

#### Step 1: Navigate to Verification Page

```
URL: http://localhost:5175/organizer-verification
1. Connect wallet (must be event creator)
2. You should see "Ticket Verification" page
3. Scanner interface with "Start Scanning" button
```

#### Step 2: Start Camera Scanner

```
1. Click "Start Scanning" button
2. ✅ Browser asks for camera permission
3. Grant camera access
4. ✅ Camera preview appears in scanner box
5. ✅ Blue border indicates active scanning
```

#### Step 3: Scan QR Code

```
For Desktop Testing:
1. Open downloaded QR code image on mobile device
2. Hold mobile screen in front of webcam
3. Position QR code in the blue scanning box
4. Wait 1-2 seconds for automatic scan

For Mobile Testing:
1. Use a different mobile device
2. Open the app in browser
3. Start scanner (uses rear camera)
4. Point at QR code displayed on another device
```

#### Step 4: View Verification Result

**✅ Success (Green Border):**

```
Message: "Valid ticket! Entry permitted."

Shows:
- ✅ Valid QR Format
- ✅ Owner verification passed
- ✅ Unused ticket
- Ticket ID: #123
- Event ID: #5
- Owner: 0xabc...def

Action: Grant entry to event
```

**❌ Already Used (Red Border):**

```
Message: "Ticket has already been used!"

Shows:
- ✅ Valid QR Format
- ✅ Owner verification passed
- ❌ Ticket already used

Action: Deny entry (duplicate attempt)
```

**⚠️ Owner Mismatch (Yellow Border):**

```
Message: "Owner mismatch! Ticket may have been transferred."

Shows:
- ✅ Valid QR Format
- ❌ Owner verification failed
- ✅ Unused ticket

Reason:
- Ticket was sold/transferred after QR generated
- Old QR code being used

Action: Ask holder to generate new QR code
```

**❌ Expired QR (Red Border):**

```
Message: "QR code is expired (older than 24 hours)"

Shows:
- ✅ Valid QR Format
- ❌ Timestamp > 24 hours old

Action: Ask holder to generate fresh QR code
```

**❌ Invalid/Tampered (Red Border):**

```
Message: "Invalid signature - QR code may have been tampered with"

Shows:
- ❌ Signature mismatch

Action: Deny entry (fraud attempt)
```

#### Step 5: Scan Next Ticket

```
1. Click "Scan Next Ticket" button
2. Scanner reactivates
3. Repeat process for next attendee
```

---

## 🔧 Manual Testing Scenarios

### Scenario 1: Happy Path (Valid Ticket)

```
1. Generate QR code for owned ticket
2. Scan with organizer account
3. ✅ Should show "Valid ticket! Entry permitted"
```

### Scenario 2: Expired QR Code

```
1. Mock old timestamp in code (testing only)
2. Generate QR code
3. Scan QR code
4. ❌ Should show "QR code is expired"
```

### Scenario 3: Transferred Ticket

```
1. User A generates QR code
2. User A transfers ticket to User B
3. User A tries to use old QR code
4. ⚠️ Should show "Owner mismatch"
5. User B generates new QR code
6. ✅ User B's QR works
```

### Scenario 4: Already Used Ticket

```
1. Mark ticket as "used" via contract call
2. Scan valid QR code
3. ❌ Should show "Ticket has already been used"
```

### Scenario 5: Tampered QR Code

```
1. Generate valid QR code
2. Manually edit JSON data (change owner)
3. Create QR from edited data
4. Scan tampered QR
5. ❌ Should show "Invalid signature"
```

---

## 🎥 Camera Testing Tips

### Desktop (Webcam):

```
Best Practice:
1. Use good lighting
2. Hold mobile device 15-30cm from webcam
3. Keep QR code flat and steady
4. Ensure QR fills ~50% of scanner box
5. Don't move too quickly
```

### Mobile (Rear Camera):

```
Best Practice:
1. Use rear camera for better quality
2. Hold steady 15-30cm from QR code
3. Ensure adequate lighting
4. Let autofocus work (1-2 seconds)
5. Keep phone parallel to QR surface
```

### Troubleshooting Camera Issues:

```
If scanner doesn't start:
✅ Check browser permissions (chrome://settings/content/camera)
✅ Ensure no other app is using camera
✅ Try different browser (Chrome recommended)
✅ Check console for errors (F12)

If scan doesn't work:
✅ Increase QR code size on screen
✅ Improve lighting conditions
✅ Clean camera lens
✅ Reduce distance between camera and QR
✅ Hold steadier (2-3 seconds)
```

---

## 📊 What Gets Verified

### Blockchain Verification:

```typescript
1. ownerOf(tokenId)
   → Checks current owner on blockchain

2. ticketDetails(tokenId)
   → Gets: eventId, ticketTypeId, purchasePrice, isUsed, etc.

3. Compare QR Data vs Blockchain Data
   → Owner must match
   → Event must match
   → Status must be "unused"
```

### Security Features:

- ✅ **Signature Hash** - Prevents editing QR data
- ✅ **Timestamp Check** - 24hr validity prevents old QR reuse
- ✅ **Owner Verification** - Blockchain proof of ownership
- ✅ **Usage Check** - One-time entry enforcement
- ✅ **Event Check** - Can't use ticket for wrong event

---

## 🚨 Common Issues & Solutions

### Issue: QR Code Won't Scan

**Causes:**

- Low image quality
- Poor lighting
- QR too small/large
- Camera focus issues

**Solutions:**

- Download original PNG (don't screenshot)
- Increase screen brightness
- Use landscape mode for bigger display
- Wait for camera autofocus
- Move closer/further from camera

### Issue: "Owner Mismatch" Error

**Cause:** Ticket was transferred after QR generation

**Solution:**

1. Current owner must generate new QR
2. Old QR codes become invalid after transfer
3. This is by design for security

### Issue: Camera Permission Denied

**Solutions:**

```bash
Chrome: Settings → Privacy → Camera → Allow
Firefox: Permissions → Camera → Allow
Safari: Preferences → Websites → Camera → Allow
```

### Issue: QR Expired

**Solution:**

- QR codes valid for 24 hours only
- Generate fresh QR code on day of event
- This prevents fraud with old screenshots

---

## 🔐 Security Considerations

### Why 24 Hour Expiry?

```
Scenario without expiry:
1. User screenshots QR code
2. User sells/transfers ticket
3. Original user still has QR screenshot
4. Original user could enter with old QR

With 24hr expiry:
1. User must generate fresh QR on event day
2. If ticket transferred, old QR shows owner mismatch
3. New owner generates valid QR
```

### Why Owner Verification?

```
Prevents:
- Sharing screenshots of QR codes
- Selling fake tickets
- Using transferred tickets with old QRs
- Multiple entries with same ticket
```

### Why Signature Hash?

```
Prevents:
- Editing QR data (changing owner address)
- Creating fake QR codes
- Tampering with ticket details
```

---

## 📱 Real-World Usage Flow

### Day Before Event:

```
Ticket Holder:
1. Goes to My Tickets page
2. Views QR code to test
3. Downloads as backup
```

### Event Day (Ticket Holder):

```
1. Generates fresh QR code on event day
2. Keeps phone/device ready
3. Shows QR at entrance
4. Entry granted after scan
```

### Event Day (Organizer):

```
1. Opens Organizer Verification page
2. Starts scanner
3. Scans each attendee's QR
4. Grants entry if green ✅
5. Denies entry if red ❌
6. Asks to regenerate if yellow ⚠️
```

---

## 🧪 Quick Test Checklist

### QR Generation (My Tickets):

- [ ] Modal opens without freezing
- [ ] QR displays within 100ms
- [ ] Download button works
- [ ] PNG file is valid
- [ ] Can open/close modal multiple times

### QR Scanning (Organizer Verification):

- [ ] Page loads with scanner
- [ ] Camera permission prompt appears
- [ ] Camera preview shows
- [ ] QR scan triggers automatically
- [ ] Verification result displays
- [ ] Green border for valid tickets
- [ ] Red border for invalid tickets
- [ ] "Scan Next" resets properly

### Data Verification:

- [ ] Correct Ticket ID shown
- [ ] Correct Event ID shown
- [ ] Owner address matches
- [ ] Verification checks display
- [ ] Error messages are clear

---

## 🎓 Key Takeaways

1. **QR codes contain encrypted ticket data** - All info needed for offline verification
2. **24-hour validity** - Fresh QR required on event day (anti-fraud)
3. **Blockchain verification** - Cross-checks owner and status on-chain
4. **One device scans, other displays** - Need 2 devices for testing
5. **Camera quality matters** - Better camera = faster scans
6. **Works offline (partial)** - QR data is self-contained, but final verification needs blockchain

---

## 🚀 Production Deployment Notes

### For Production:

```
1. Use HTTPS (camera requires secure context)
2. Test on multiple devices/browsers
3. Provide clear user instructions
4. Have backup manual verification process
5. Train staff on error messages
6. Consider offline mode for poor connectivity
```

---

**Ready to Test?** 🎉

1. Generate QR on My Tickets page
2. Download to mobile device
3. Open Organizer Verification page
4. Scan QR code with camera
5. See verification result!

---

**Need Help?**

- Check browser console for errors
- Ensure camera permissions granted
- Try different browsers (Chrome works best)
- Use good lighting for scanning
- Keep QR code steady during scan

**Status:** ✅ Fully Functional  
**Last Tested:** October 18, 2025
