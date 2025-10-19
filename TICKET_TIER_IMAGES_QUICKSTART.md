# Ticket Tier Images - Quick Start Guide

## ✅ What's Complete

**Smart Contract**:

- ✅ TicketType struct includes `imageIpfsHash`
- ✅ TicketTypeInput struct includes `imageIpfsHash`
- ✅ createEvent accepts tier images
- ✅ addTicketType accepts tier image
- ✅ Contract compiled successfully

**Backend Hooks**:

- ✅ useCreateEvent uploads tier images to IPFS in parallel
- ✅ useAddTicketType uploads tier image to IPFS
- ✅ Both hooks pass IPFS hashes to contract

**Frontend UI**:

- ✅ ImageUpload component for tier images
- ✅ CreateEventPage validates tier images
- ✅ Draft save/load works with tier images
- ✅ Zero TypeScript errors

---

## 🚀 How to Test

### 1. Start the Dev Server

```bash
cd /home/praise/Projects/GUD/universal-event-ticketing/frontend/ticketchain
npm run dev
```

### 2. Create Event with Tier Images

1. Navigate to: `http://localhost:5173/create-event`
2. Fill out event details:
   - Name: "Test Concert"
   - Description: "Testing tier images"
   - Venue: "Test Arena"
   - Dates: Set start and end times
   - Upload event image
3. Add ticket tiers (each requires unique image):
   - **VIP**: Price: 0.1 PC, Supply: 50, Upload: `vip.jpg`
   - **General**: Price: 0.05 PC, Supply: 100, Upload: `general.jpg`
   - **Student**: Price: 0.02 PC, Supply: 75, Upload: `student.jpg`
4. Click "Create Event"
5. Watch console for IPFS upload progress:
   ```
   Uploading 3 tier images to IPFS...
   Uploading tier 1: VIP
   Uploading tier 2: General
   Uploading tier 3: Student
   Tier 1 uploaded: QmXxx...
   Tier 2 uploaded: QmYyy...
   Tier 3 uploaded: QmZzz...
   Creating event with ticket types...
   Event created successfully!
   ```

### 3. Verify Contract State

Open browser console and run:

```javascript
// Get the event ID from the transaction
const eventId = 1; // or whatever ID was assigned

// Check ticket types
const ticketTypes = await ticketFactoryContract.getTicketTypes(eventId);
console.log(ticketTypes);

// Expected output:
// [
//   { name: "VIP", price: 100000000000000000n, supply: 50n, sold: 0n, imageIpfsHash: "QmXxx..." },
//   { name: "General", price: 50000000000000000n, supply: 100n, sold: 0n, imageIpfsHash: "QmYyy..." },
//   { name: "Student", price: 20000000000000000n, supply: 75n, sold: 0n, imageIpfsHash: "QmZzz..." }
// ]
```

---

## 📋 What's Next

### Phase 4: Display Tier Images

You need to update these pages to display tier-specific images:

#### 1. EventDetailPage.tsx

- Show tier images in ticket purchase section
- Display tier image thumbnails next to price/supply
- Use tier image in ticket type cards

#### 2. MyTicketsPage.tsx

- Display tier image on each ticket card
- Replace event image with tier-specific image
- Add helper function to get tier image with fallback

#### 3. Marketplace Pages

- Show tier images in marketplace listings
- Display tier image in purchase modal
- Update MarketplaceCard component

#### 4. NFT Metadata (Optional)

- Update ticket minting to use tier image in NFT metadata
- Modify tokenURI generation to include tier imageIpfsHash
- Ensure external NFT viewers show tier-specific images

---

## 🔧 Helper Functions Needed

### Get Tier Image URL

```typescript
// Add to utils or hooks
export function getTierImageUrl(
  ticketTypeId: bigint,
  eventTicketTypes: TicketType[],
  fallbackEventImageHash: string
): string {
  const ticketType = eventTicketTypes.find(
    (tt) => tt.ticketTypeId === ticketTypeId
  );

  const imageHash = ticketType?.imageIpfsHash || fallbackEventImageHash;
  return `https://gateway.pinata.cloud/ipfs/${imageHash}`;
}
```

### Get Tier Details

```typescript
// Add to hooks/useContracts.ts
export function useTicketTypeDetails(eventId: number, ticketTypeId: number) {
  const { ticketTypes } = useTicketTypes(eventId);

  const ticketType = ticketTypes?.find(
    (tt) => tt.ticketTypeId === BigInt(ticketTypeId)
  );

  return {
    ticketType,
    imageUrl: ticketType?.imageIpfsHash
      ? `https://gateway.pinata.cloud/ipfs/${ticketType.imageIpfsHash}`
      : null,
  };
}
```

---

## 🐛 Debugging Tips

### If IPFS Upload Fails

Check browser console for errors:

```javascript
// Common issues:
// 1. Missing Pinata credentials
console.log(import.meta.env.VITE_PINATA_API_KEY); // Should not be undefined

// 2. CORS issues
// Ensure Pinata API allows your origin

// 3. File size too large
// Max 5MB (enforced by validation)

// 4. Network timeout
// Retry the upload or check network connection
```

### If Contract Transaction Fails

```javascript
// Check transaction revert reason
try {
  await createEvent(eventData);
} catch (error) {
  console.error("Transaction failed:", error);

  // Look for specific errors:
  // - "InvalidInput" - Missing or empty imageIpfsHash
  // - "NotOrganizer" - Wrong account
  // - "InvalidEvent" - Event doesn't exist
}
```

### If Tier Images Don't Display

```javascript
// Verify ticket type has imageIpfsHash
const ticketTypes = await ticketFactoryContract.getTicketTypes(eventId);
console.log(
  "Tier images:",
  ticketTypes.map((tt) => tt.imageIpfsHash)
);

// Check IPFS gateway
const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`;
console.log("Image URL:", imageUrl);
// Try opening in browser - should show image

// Fallback to event image if tier image missing
if (!ticketType.imageIpfsHash) {
  imageUrl = event.imageUrl; // Use event image as fallback
}
```

---

## 📊 Performance Monitoring

### Log Upload Times

```typescript
// In useCreateEvent hook
console.time("Event image upload");
const eventIpfsHash = await uploadToIPFS(eventData.image);
console.timeEnd("Event image upload");

console.time("Tier images upload (parallel)");
const tierImageHashes = await Promise.all(
  initialTicketTypes.map((tt) => uploadToIPFS(tt.image!))
);
console.timeEnd("Tier images upload (parallel)");

// Expected results:
// Event image upload: ~2000ms
// Tier images upload (parallel): ~2000ms (not 6000ms!)
```

---

## 🎯 Success Criteria

Before considering this feature complete, verify:

- [x] Smart contract compiles without errors
- [x] TypeScript has zero errors
- [x] Tier images upload to IPFS in parallel
- [x] Contract stores imageIpfsHash for each tier
- [ ] Event detail page shows tier images
- [ ] My tickets page shows tier images
- [ ] Marketplace shows tier images
- [ ] NFT metadata uses tier-specific image
- [ ] Backward compatibility (old events work without tier images)

---

## 🚀 Ready to Continue

The foundation is complete! Now you just need to update the display pages to show tier images throughout the app.

**Next Step**: Update EventDetailPage.tsx to show tier images in the ticket purchase section.

Would you like me to help with that next?
