# Ticket Tier NFT Images - Implementation Plan

## 🎨 Feature Overview

**Requirement**: Each ticket tier should have its own unique image that becomes the NFT metadata image when purchased.

**Current State**:

- Only event-level image exists (uploaded once for the entire event)
- All tickets from the same event share the same NFT image

**Desired State**:

- Each ticket tier (VIP, General, Student, etc.) has its own unique image
- When a ticket is minted, the NFT uses the tier-specific image
- Tier images are uploaded to IPFS separately
- Tier images are stored in the smart contract

---

## 🔍 Smart Contract Analysis

### Current TicketType Structure

```solidity
struct TicketType {
    string name;          // "VIP", "General Admission"
    uint256 price;        // Price in wei
    uint256 supply;       // Total supply for this tier
    uint256 sold;         // Number sold
    bool active;          // Whether tier is available
}
```

### Required Changes

```solidity
struct TicketType {
    string name;
    uint256 price;
    uint256 supply;
    uint256 sold;
    bool active;
    string imageIpfsHash;  // NEW: IPFS hash for tier-specific image
}
```

### Contract Functions to Update

1. **createEvent()** - Add imageIpfsHash parameter for initial ticket types
2. **addTicketType()** - Add imageIpfsHash parameter
3. **mintTicket()** - Use tier imageIpfsHash in NFT metadata
4. **getTicketTypes()** - Return imageIpfsHash in results

---

## 🎨 Frontend Implementation Plan

### Phase 2A: UI Changes (Ticket Type Image Upload)

#### 1. Update CreateEventPage.tsx

**Location**: Ticket Type card in form

**Current Fields**:

- Name
- Price (PC)
- Supply

**Add**:

- Image Upload field (similar to event image)
- Image preview thumbnail
- Remove image button
- File validation (same as event image)
- Image compression before save

**UI Layout**:

```
┌─────────────────────────────────────────────┐
│ Ticket Type 1              [Duplicate] [X]  │
├─────────────────────────────────────────────┤
│ Name: [VIP Gold                          ]  │
│ Price: [0.1 PC                           ]  │
│ Supply: [50                              ]  │
│                                             │
│ Ticket Image *                              │
│ ┌─────────────────────────────────────┐    │
│ │  [Upload Image]                     │    │
│ │  or                                 │    │
│ │  [📷 Preview Image]                 │    │
│ └─────────────────────────────────────┘    │
│ PNG, JPG, GIF up to 5MB                    │
└─────────────────────────────────────────────┘
```

#### 2. Update TicketTypeInput Interface

```typescript
interface TicketTypeInput {
  name: string;
  price: bigint;
  supply: bigint;
  image: File | null; // NEW
  imagePreview?: string; // NEW
}
```

#### 3. Update State Management

```typescript
const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
  {
    name: "General Admission",
    price: BigInt(0),
    supply: BigInt(0),
    image: null,
    imagePreview: "",
  },
]);
```

#### 4. Add Image Upload Handler

```typescript
const handleTicketTypeImageChange = async (index: number, file: File) => {
  // Validate file
  const validation = validateFileForUpload(file);
  if (!validation.valid) {
    setErrors((prev) => ({
      ...prev,
      [`ticketType${index}Image`]: validation.error,
    }));
    return;
  }

  // Compress image
  const compressedFile = await compressImage(file);

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    setTicketTypes((prev) =>
      prev.map((type, i) =>
        i === index
          ? {
              ...type,
              image: compressedFile,
              imagePreview: e.target?.result as string,
            }
          : type
      )
    );
  };
  reader.readAsDataURL(compressedFile);
};
```

#### 5. Update Form Validation

```typescript
ticketTypes.forEach((type, index) => {
  if (!type.name.trim()) {
    newErrors[`ticketType${index}Name`] = "Ticket type name is required";
  }
  if (Number(type.price) < 0) {
    newErrors[`ticketType${index}Price`] = "Price cannot be negative";
  }
  if (Number(type.supply) <= 0) {
    newErrors[`ticketType${index}Supply`] = "Supply must be greater than 0";
  }
  // NEW: Image validation
  if (!type.image) {
    newErrors[`ticketType${index}Image`] = "Ticket tier image is required";
  }
});
```

---

### Phase 2B: Smart Contract Integration

#### 1. Update Smart Contract (Backend)

**File**: `contracts/TicketFactory.sol`

```solidity
struct TicketType {
    string name;
    uint256 price;
    uint256 supply;
    uint256 sold;
    bool active;
    string imageIpfsHash;  // Add this field
}

// Update createEvent to accept initialTicketTypes with images
function createEvent(
    string memory name_,
    string memory description_,
    uint256 startTime_,
    uint256 endTime_,
    string memory venue_,
    string memory imageIpfsHash_,
    uint256 totalSupply_,
    uint96 royaltyBps_,
    InitialTicketType[] memory initialTicketTypes_
) external returns (uint256 eventId) {
    // ... existing code ...

    // Add initial ticket types with images
    for (uint256 i = 0; i < initialTicketTypes_.length; i++) {
        _addTicketType(
            eventId,
            initialTicketTypes_[i].name,
            initialTicketTypes_[i].price,
            initialTicketTypes_[i].supply,
            initialTicketTypes_[i].imageIpfsHash  // NEW
        );
    }
}

// Update addTicketType to include imageIpfsHash
function addTicketType(
    uint256 eventId_,
    string memory name_,
    uint256 price_,
    uint256 supply_,
    string memory imageIpfsHash_  // NEW
) external onlyEventOrganizer(eventId_) {
    _addTicketType(eventId_, name_, price_, supply_, imageIpfsHash_);
}

// Internal function
function _addTicketType(
    uint256 eventId_,
    string memory name_,
    uint256 price_,
    uint256 supply_,
    string memory imageIpfsHash_
) internal {
    if (bytes(name_).length == 0 || bytes(imageIpfsHash_).length == 0) {
        revert InvalidInput();
    }

    ticketTypes[eventId_].push(
        TicketType({
            name: name_,
            price: price_,
            supply: supply_,
            sold: 0,
            active: true,
            imageIpfsHash: imageIpfsHash_  // NEW
        })
    );

    emit TicketTypeAdded(eventId_, ticketTypes[eventId_].length - 1, name_, price_, supply_, imageIpfsHash_);
}

// Update mintTicket to use tier-specific image
function mintTicket(
    uint256 eventId_,
    uint256 ticketTypeIndex_,
    address buyer_
) internal returns (uint256 tokenId) {
    // ... existing validation ...

    TicketType storage ticketType = ticketTypes[eventId_][ticketTypeIndex_];
    EventData storage eventData = events[eventId_];

    tokenId = _nextTokenId++;

    // Mint NFT with tier-specific metadata
    _mint(buyer_, tokenId);

    // Use ticketType.imageIpfsHash instead of eventData.imageIpfsHash
    string memory tokenURI = _generateTokenURI(
        eventId_,
        ticketTypeIndex_,
        tokenId,
        eventData.name,
        ticketType.name,
        ticketType.imageIpfsHash  // NEW: Use tier image
    );

    _setTokenURI(tokenId, tokenURI);

    // ... rest of the function ...
}
```

#### 2. Update Frontend Hook (useCreateEvent)

**File**: `hooks/useContracts.ts`

```typescript
export function useCreateEvent() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const [isPending, setIsPending] = useState(false);

  const createEvent = async (eventData: EventInput) => {
    if (!pushChainClient || !PushChain) {
      throw new Error("Push Chain client not available");
    }

    try {
      setIsPending(true);

      // Upload main event image to IPFS
      const eventIpfsHash = await uploadToIPFS(eventData.image);

      // Upload all ticket type images to IPFS in parallel
      const ticketTypeIpfsHashes = await Promise.all(
        (eventData.initialTicketTypes || []).map(async (tt) => {
          if (!tt.image) {
            throw new Error(`Image required for ticket type: ${tt.name}`);
          }
          return await uploadToIPFS(tt.image);
        })
      );

      // Prepare initial ticket types with IPFS hashes
      const initialTicketTypes = (eventData.initialTicketTypes || []).map(
        (tt, index) => ({
          name: tt.name,
          price: tt.price,
          supply: tt.supply,
          imageIpfsHash: ticketTypeIpfsHashes[index],
        })
      );

      const tx = await pushChainClient.universal.sendTransaction({
        to: TICKET_FACTORY_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketFactoryABI),
          functionName: "createEvent",
          args: [
            eventData.name,
            eventData.description,
            eventData.startTime,
            eventData.endTime,
            eventData.venue,
            eventIpfsHash,
            eventData.totalSupply,
            eventData.royaltyBps,
            initialTicketTypes,
          ],
        }),
      });

      await tx.wait();
      localStorage.removeItem("ticketchain_cache");
      return tx;
    } finally {
      setIsPending(false);
    }
  };

  return { createEvent, isPending };
}
```

#### 3. Update TypeScript Types

**File**: `types/index.ts`

```typescript
// Update TicketTypeInput
export interface TicketTypeInput {
  name: string;
  price: bigint;
  supply: bigint;
  image: File | null; // NEW
  imagePreview?: string; // NEW (for UI state)
}

// Update EventInput to ensure initialTicketTypes include images
export interface EventInput {
  name: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  venue: string;
  image: File;
  totalSupply: bigint;
  royaltyBps: bigint;
  initialTicketTypes?: TicketTypeInput[]; // Now includes images
}

// Update TicketType (from contract)
export interface TicketType {
  name: string;
  price: bigint;
  supply: bigint;
  sold: bigint;
  active: boolean;
  imageIpfsHash: string; // NEW
}
```

---

## 📱 UI/UX Enhancements

### Image Upload Component (Reusable)

Create a shared component for image upload:

```typescript
// components/ImageUpload.tsx
interface ImageUploadProps {
  label: string;
  imagePreview: string | null;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
  error?: string;
  required?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  imagePreview,
  onImageChange,
  onImageRemove,
  error,
  required = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && "*"}
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
        {imagePreview ? (
          <div className="space-y-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-32 mx-auto rounded-lg"
            />
            <button
              type="button"
              onClick={onImageRemove}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove Image
            </button>
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm mb-1">Click to upload</p>
            <p className="text-gray-500 text-xs">PNG, JPG up to 5MB</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageChange(file);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
```

### Visual Distinction Between Tiers

Show tier images in the EventCard and EventDetailPage:

```typescript
// In EventDetailPage.tsx - Ticket Purchase Section
{
  ticketTypes.map((type, index) => (
    <div key={index} className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-4">
        {/* NEW: Show tier image */}
        <img
          src={`https://ipfs.io/ipfs/${type.imageIpfsHash}`}
          alt={type.name}
          className="w-20 h-20 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h4 className="font-medium">{type.name}</h4>
          <p className="text-gray-600">{formatPrice(type.price)}</p>
        </div>
        <button>Buy Ticket</button>
      </div>
    </div>
  ));
}
```

---

## 🎯 Implementation Steps

### Step 1: Update Smart Contract ⏳

1. Add `imageIpfsHash` field to `TicketType` struct
2. Update `createEvent()` function signature
3. Update `addTicketType()` function signature
4. Update `_addTicketType()` internal function
5. Update `mintTicket()` to use tier-specific image
6. Update events to include `imageIpfsHash`
7. Compile and test contract
8. Deploy updated contract (or migration script)

### Step 2: Update Frontend Types ⏳

1. Update `TicketTypeInput` interface in `types/index.ts`
2. Update `EventInput` interface
3. Update `TicketType` interface
4. Update ABI file (after contract deployment)

### Step 3: Create ImageUpload Component ⏳

1. Create `components/ImageUpload.tsx`
2. Add props for label, preview, handlers, error
3. Style to match existing upload UI
4. Export component

### Step 4: Update CreateEventPage ⏳

1. Update `ticketTypes` state to include `image` and `imagePreview`
2. Add `handleTicketTypeImageChange` function
3. Add image upload to each ticket type card
4. Update validation to require images
5. Update duplicate function to NOT copy image (force new upload)
6. Update form submission to upload images before creating event

### Step 5: Update useCreateEvent Hook ⏳

1. Upload ticket type images to IPFS in parallel
2. Pass IPFS hashes to contract
3. Handle upload errors gracefully
4. Show upload progress (optional)

### Step 6: Display Tier Images ⏳

1. Update EventDetailPage to show tier images
2. Update MyTicketsPage to show tier image on ticket card
3. Update marketplace listings to show tier image
4. Cache tier images in localStorage

### Step 7: Testing ⏳

1. Test image upload for each tier
2. Test validation (missing images)
3. Test IPFS upload success/failure
4. Test NFT minting with correct image
5. Test viewing NFT metadata
6. Test marketplace with tier images

---

## 📊 Expected Benefits

1. **Visual Differentiation**: Users can see what each tier looks like
2. **Premium Feel**: VIP tickets can have exclusive artwork
3. **NFT Collectibility**: Each tier becomes a unique collectible
4. **Marketing**: Tier images can be promotional/branded
5. **User Clarity**: Buyers know exactly what they're getting

---

## ⚠️ Important Considerations

### 1. Storage Costs

- More IPFS uploads = more time during event creation
- Consider batch upload optimization
- Show progress indicator for multiple uploads

### 2. Image Guidelines

- Recommend square images (1:1 ratio) for NFTs
- Suggest 1000x1000px minimum
- Enforce max 5MB per image
- Consider image quality requirements per tier

### 3. Backward Compatibility

- Existing events don't have tier images
- Need migration strategy or fallback to event image
- Update getTicketTypes to handle missing imageIpfsHash

### 4. Draft Save

- Tier images stored as data URLs in localStorage
- Could exceed localStorage quota with many tiers
- Consider warning if > 5 ticket types with images

---

## 🚀 Quick Start Implementation

I'll start by updating the CreateEventPage to add image upload for each ticket tier. Shall I proceed?
