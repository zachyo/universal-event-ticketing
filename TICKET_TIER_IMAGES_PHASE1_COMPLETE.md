# Ticket Tier NFT Images - Phase 1 Complete ✅

## 🎉 Frontend Implementation Complete!

Successfully implemented the frontend for tier-specific NFT images. Each ticket tier now has its own unique image that will become the NFT metadata image when purchased.

**Implementation Date**: October 19, 2025  
**Phase**: Frontend UI Complete  
**Next Phase**: Smart Contract Updates & IPFS Integration

---

## ✅ Completed Features

### 1. **TypeScript Type Updates** ✅

**File**: `types/index.ts`

**Changes**:

```typescript
// Updated TicketType interface
export interface TicketType {
  eventId: bigint;
  ticketTypeId: bigint;
  name: string;
  price: bigint;
  supply: bigint;
  sold: bigint;
  imageIpfsHash?: string; // NEW: Optional for backward compatibility
}

// Updated TicketTypeInput interface
export interface TicketTypeInput {
  name: string;
  price: bigint;
  supply: bigint;
  image: File | null; // NEW: Tier-specific image file
  imagePreview?: string; // NEW: Preview URL for UI
}
```

---

### 2. **Reusable ImageUpload Component** ✅

**File**: `components/ImageUpload.tsx`

**Features**:

- ✅ Drag-and-drop file upload
- ✅ Image preview with thumbnail
- ✅ Remove image button (X icon in corner)
- ✅ Visual feedback (green border when uploaded, red on error)
- ✅ Error message display
- ✅ Required field indicator
- ✅ Customizable help text
- ✅ Accessible (ARIA labels)
- ✅ Responsive design

**Props**:

```typescript
interface ImageUploadProps {
  label: string;
  imagePreview: string | null | undefined;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
  error?: string;
  required?: boolean;
  helpText?: string;
}
```

**Usage**:

```tsx
<ImageUpload
  label="Ticket Tier Image"
  imagePreview={ticketType.imagePreview}
  onImageChange={(file) => handleTicketTypeImageChange(index, file)}
  onImageRemove={() => handleTicketTypeImageRemove(index)}
  error={errors[`ticketType${index}Image`]}
  required
  helpText="Upload a unique image for this ticket tier..."
/>
```

---

### 3. **CreateEventPage Updates** ✅

**File**: `pages/CreateEventPage.tsx`

#### **State Management**

```typescript
const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
  {
    name: "General Admission",
    price: BigInt(0),
    supply: BigInt(0),
    image: null, // NEW
    imagePreview: "", // NEW
  },
]);
```

#### **New Functions**

1. **handleTicketTypeImageChange**

   - Validates file (size, type)
   - Compresses image
   - Creates preview using FileReader
   - Updates state with compressed file and preview
   - Handles errors gracefully

2. **handleTicketTypeImageRemove**
   - Clears image and preview for specific tier
   - Maintains other tier data

#### **Updated Functions**

1. **addTicketTypeField**

   - Initializes new ticket type with `image: null` and `imagePreview: ''`

2. **duplicateTicketType**

   - Copies name, price, supply
   - Does NOT copy image (forces new upload for uniqueness)

3. **validateForm**

   - Added validation: `if (!type.image) { newErrors[...] = "Required" }`

4. **saveDraft**

   - Saves `imagePreview` as data URL
   - Doesn't save File object (not serializable)

5. **loadDraft**
   - Restores `imagePreview` from localStorage
   - Sets `image: null` (File can't be restored)

#### **UI Changes**

Added ImageUpload component to each ticket type card:

```tsx
{
  /* Ticket Tier Image Upload */
}
<div className="mt-4 md:col-span-3">
  <ImageUpload
    label="Ticket Tier Image"
    imagePreview={ticketType.imagePreview}
    onImageChange={(file) => handleTicketTypeImageChange(index, file)}
    onImageRemove={() => handleTicketTypeImageRemove(index)}
    error={errors[`ticketType${index}Image`]}
    required
    helpText="Upload a unique image for this ticket tier. This will be the NFT image for purchasers. PNG, JPG, GIF up to 5MB"
  />
</div>;
```

**Location**: After Name, Price, Supply fields in each ticket type card

---

## 📱 UI/UX Features

### Visual Hierarchy

```
┌─────────────────────────────────────────────┐
│ Ticket Type 1              [Duplicate] [X]  │
├─────────────────────────────────────────────┤
│ Name:   [VIP Gold                         ] │
│ Price:  [0.1 PC                           ] │
│ Supply: [50                               ] │
│                                             │
│ Ticket Tier Image *                         │
│ ┌─────────────────────────────────────┐    │
│ │  📷 Image Preview                   │    │
│ │  [Remove Image (X)]                 │    │
│ └─────────────────────────────────────┘    │
│ Upload a unique image for this tier...     │
└─────────────────────────────────────────────┘
```

### Image Upload States

1. **Empty State** (no image uploaded)

   - Upload icon
   - "Click to upload or drag and drop"
   - Help text: "PNG, JPG, GIF up to 5MB"
   - Gray dashed border

2. **Uploaded State** (image present)

   - Image preview thumbnail (max-h-32)
   - Green border
   - X button in top-right corner
   - "Image uploaded" text

3. **Error State** (validation failed)
   - Red border
   - Red background tint
   - Error message below
   - Upload icon still visible

### Validation Messages

- ✅ "Ticket tier image is required" - Missing image
- ✅ "Invalid file" - Wrong file type or too large
- ✅ "Failed to process image" - Compression error

---

## 🔄 Draft Save Integration

### LocalStorage Schema (Updated)

```json
{
  "ticketchain_draft_event": {
    "timestamp": 1729339200000,
    "formData": {...},
    "ticketTypes": [
      {
        "name": "VIP Gold",
        "price": "100000000000000000",
        "supply": "50",
        "image": null,
        "imagePreview": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Data URL
      },
      {
        "name": "General Admission",
        "price": "10000000000000000",
        "supply": "100",
        "image": null,
        "imagePreview": "data:image/png;base64,iVBORw0KGgoAAAANS..."
      }
    ],
    "imageDataUrl": "data:image/jpeg;base64,..."
  }
}
```

### Draft Save Behavior

1. **Auto-Save** (every 30 seconds)

   - Saves image previews as data URLs
   - File objects not saved (not serializable)

2. **Load Draft**

   - Restores image previews
   - Shows "Image uploaded" state
   - User can remove and re-upload if needed

3. **Important Note**
   - If user loads draft, they still have the image preview
   - But File object is gone
   - Need to re-upload image to actually submit
   - Consider: Convert data URL back to File on load (future enhancement)

---

## ⚠️ Important Considerations

### 1. **File Size & LocalStorage**

- Each tier image stored as data URL can be ~1-2MB
- LocalStorage limit: ~5-10MB (browser dependent)
- With 5+ tiers, could exceed limit
- **Solution**: Show warning if > 5 tiers with images

### 2. **Image Validation**

- Same validation as event image:
  - Max 5MB file size
  - Allowed types: JPG, PNG, GIF, WebP
  - Compression applied automatically

### 3. **Duplicate Function**

- Does NOT copy image
- Forces user to upload unique image for each tier
- Prevents accidental image reuse

### 4. **Form Submission**

- Currently validates that all tiers have images
- Will fail submission if any tier missing image
- Good UX: prevents incomplete data

---

## 🚧 Next Steps (Backend Integration)

### Step 1: Update Smart Contract ⏳

**File**: `contracts/TicketFactory.sol`

```solidity
struct TicketType {
    string name;
    uint256 price;
    uint256 supply;
    uint256 sold;
    bool active;
    string imageIpfsHash;  // ADD THIS
}

struct InitialTicketType {
    string name;
    uint256 price;
    uint256 supply;
    string imageIpfsHash;  // ADD THIS
}

function createEvent(
    // ... existing params ...
    InitialTicketType[] memory initialTicketTypes_
) external returns (uint256 eventId) {
    // ... existing code ...

    // Add ticket types with images
    for (uint256 i = 0; i < initialTicketTypes_.length; i++) {
        ticketTypes[eventId].push(
            TicketType({
                name: initialTicketTypes_[i].name,
                price: initialTicketTypes_[i].price,
                supply: initialTicketTypes_[i].supply,
                sold: 0,
                active: true,
                imageIpfsHash: initialTicketTypes_[i].imageIpfsHash  // NEW
            })
        );
    }
}

function mintTicket(...) internal returns (uint256 tokenId) {
    // Use ticketType.imageIpfsHash instead of eventData.imageIpfsHash
    string memory tokenURI = _generateTokenURI(
        eventId_,
        ticketTypeIndex_,
        tokenId,
        eventData.name,
        ticketType.name,
        ticketType.imageIpfsHash  // Use tier-specific image
    );
}
```

### Step 2: Update useCreateEvent Hook ⏳

**File**: `hooks/useContracts.ts`

```typescript
const createEvent = async (eventData: EventInput) => {
  // 1. Upload event image
  const eventIpfsHash = await uploadToIPFS(eventData.image);

  // 2. Upload all tier images in parallel
  const tierImageHashes = await Promise.all(
    (eventData.initialTicketTypes || []).map(async (tt) => {
      if (!tt.image) {
        throw new Error(`Image required for tier: ${tt.name}`);
      }
      return await uploadToIPFS(tt.image);
    })
  );

  // 3. Prepare ticket types with IPFS hashes
  const initialTicketTypes = (eventData.initialTicketTypes || []).map(
    (tt, index) => ({
      name: tt.name,
      price: tt.price,
      supply: tt.supply,
      imageIpfsHash: tierImageHashes[index],
    })
  );

  // 4. Send transaction with tier images
  const tx = await pushChainClient.universal.sendTransaction({
    to: TICKET_FACTORY_ADDRESS,
    data: PushChain.utils.helpers.encodeTxData({
      abi: Array.from(TicketFactoryABI),
      functionName: "createEvent",
      args: [
        // ... existing args ...
        initialTicketTypes, // Now includes imageIpfsHash
      ],
    }),
  });

  await tx.wait();
  return tx;
};
```

### Step 3: Update ABI ⏳

After contract deployment, update:

- `TicketFactoryABI` to include new struct fields
- Event emissions to include imageIpfsHash

### Step 4: Display Tier Images ⏳

**Where to Show**:

1. EventDetailPage - Ticket purchase section
2. MyTicketsPage - Ticket cards
3. Marketplace - Listings
4. EventCard - Tier previews (optional)

**Example**:

```tsx
// In EventDetailPage.tsx
{
  ticketTypes.map((type, index) => (
    <div key={index} className="flex items-center gap-4 border p-4 rounded-lg">
      <img
        src={`https://ipfs.io/ipfs/${type.imageIpfsHash}`}
        alt={type.name}
        className="w-20 h-20 object-cover rounded-lg"
      />
      <div className="flex-1">
        <h4 className="font-medium">{type.name}</h4>
        <p className="text-gray-600">{formatPrice(type.price)}</p>
        <p className="text-sm text-gray-500">
          {type.supply - type.sold} available
        </p>
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
        Buy Ticket
      </button>
    </div>
  ));
}
```

---

## 📊 Testing Checklist

### Frontend Testing ✅

- [x] ImageUpload component renders correctly
- [x] File upload triggers correctly
- [x] Image preview shows after upload
- [x] Remove button clears image
- [x] Error messages display properly
- [x] Validation prevents form submission without images
- [x] Duplicate function doesn't copy images
- [x] Draft save includes image previews
- [x] Draft load restores image previews

### Backend Testing ⏳ (After contract updates)

- [ ] Contract accepts imageIpfsHash in createEvent
- [ ] IPFS upload succeeds for all tiers
- [ ] Transaction includes correct image hashes
- [ ] NFT metadata uses tier-specific image
- [ ] getTicketTypes returns imageIpfsHash
- [ ] Marketplace displays tier images

### End-to-End Testing ⏳

- [ ] Create event with 3 different tier images
- [ ] Purchase ticket from each tier
- [ ] Verify NFT has correct tier image
- [ ] List ticket on marketplace
- [ ] Verify marketplace shows tier image
- [ ] View ticket in My Tickets page
- [ ] Verify My Tickets shows tier image

---

## 🎯 Expected Benefits

1. **Visual Differentiation** ✅

   - Users see exactly what each tier looks like
   - VIP tickets can have exclusive artwork
   - Clear visual hierarchy

2. **NFT Collectibility** 🔜

   - Each tier becomes a unique collectible
   - Different tiers = different NFT art
   - Increases perceived value

3. **Marketing Opportunity** 🔜

   - Tier images can be promotional/branded
   - Premium tiers get premium artwork
   - Social media sharing potential

4. **User Clarity** ✅
   - Buyers know exactly what they're getting
   - No confusion about tier benefits
   - Professional presentation

---

## 📁 Files Modified

### Created

- ✅ `components/ImageUpload.tsx` - Reusable component
- ✅ `TICKET_TIER_IMAGES_PLAN.md` - Implementation plan
- ✅ `TICKET_TIER_IMAGES_PHASE1_COMPLETE.md` - This document

### Modified

- ✅ `types/index.ts` - Added image fields to TicketType and TicketTypeInput
- ✅ `pages/CreateEventPage.tsx` - Added image upload, handlers, validation

### Pending

- ⏳ `contracts/TicketFactory.sol` - Add imageIpfsHash field
- ⏳ `hooks/useContracts.ts` - Upload tier images to IPFS
- ⏳ `pages/EventDetailPage.tsx` - Display tier images
- ⏳ `pages/MyTicketsPage.tsx` - Display tier images on tickets
- ⏳ `components/MarketplaceCard.tsx` - Display tier images in listings

---

## 🚀 Ready for Testing!

The frontend is complete and ready for testing. Navigate to:

- `http://localhost:5173/create-event`
- Fill in event details
- Add multiple ticket types
- Upload unique image for each tier
- See image previews
- Test validation (try submitting without images)
- Test draft save/load with images

**Next**: Update smart contract to accept and store tier images, then integrate IPFS uploads in useCreateEvent hook.
