# TicketChain - Universal Event Ticketing Platform (Simplified)

## Project Overview
TicketChain is a Universal App built on Push Chain that enables users to buy, sell, and manage event tickets using any token from any blockchain. Pure blockchain + frontend architecture - no traditional backend needed.

## Core Features
1. **Multi-Chain Ticket Purchase** - Buy tickets with tokens from any chain
2. **NFT Ticket System** - ERC-721 based tickets with metadata and QR codes
3. **Universal Secondary Marketplace** - Resell tickets with payments in any token/chain
4. **Event Management Dashboard** - Create and manage events
5. **QR Code Verification** - Client-side ticket validation
6. **Dynamic Pricing** - Optional surge pricing and tiered ticket types

## Tech Stack

### Smart Contracts
- Solidity 0.8.x
- OpenZeppelin Contracts (ERC-721, Ownable, ReentrancyGuard)
- Push Chain SDK

### Frontend (Complete Solution)
- React TS
- TypeScript
- TailwindCSS
- Push Chain UI Kit (`@pushchain/ui-kit`)
- Viem for blockchain interactions
- Connectkit for wallet interactions
- Wagmi for wallet connections
- qrcode.react for QR generation

### Data Layer (No Backend Required)
- **Blockchain**: Direct contract reads via RPC
- **IPFS**: Pinata/NFT.Storage for metadata (free tier)
- **The Graph**: Optional subgraph for event indexing
- **localStorage**: Cache user data client-side

## Smart Contract Architecture

### 1. TicketFactory.sol
Main contract for creating and managing events.

```solidity
struct Event {
    uint256 eventId;
    address organizer;
    string name;
    string description;
    uint256 startTime;
    uint256 endTime;
    string venue;
    string imageIpfsHash;
    uint256 totalSupply;
    uint256 sold;
    bool active;
}

struct TicketType {
    uint256 eventId;
    string name;
    uint256 price;
    uint256 supply;
    uint256 sold;
}

// Mappings for data storage
mapping(uint256 => Event) public events;
mapping(uint256 => TicketType[]) public ticketTypes;
mapping(address => uint256[]) public organizerEvents;
uint256 public eventCounter;
```

**Key Functions:**
- `createEvent()` - Create new event
- `addTicketType()` - Add ticket tiers (VIP, General, etc.)
- `purchaseTicket()` - Buy ticket with payment routing
- `toggleEventStatus()` - Activate/deactivate event
- `withdrawFunds()` - Organizer withdrawal
- `getEvent()` - Get event details
- `getTicketTypes()` - Get all ticket types for event
- `getOrganizerEvents()` - Get events by organizer

### 2. TicketNFT.sol
ERC-721 contract for ticket NFTs.

```solidity
struct TicketMetadata {
    uint256 eventId;
    uint256 ticketTypeId;
    address originalOwner;
    uint256 purchasePrice;
    string purchaseChain;
    bool used;
    string qrCodeHash;
}

mapping(uint256 => TicketMetadata) public ticketDetails;
mapping(uint256 => string) public tokenURIs; // IPFS links
uint256 public tokenCounter;
```

**Key Functions:**
- `mint()` - Mint ticket NFT (called by TicketFactory)
- `validateTicket()` - Mark ticket as used
- `transferTicket()` - Safe transfer with checks
- `getTicketDetails()` - Retrieve full ticket info
- `getUserTickets()` - Get all tickets owned by address
- `tokenURI()` - Return IPFS metadata link

### 3. TicketMarketplace.sol
Secondary marketplace for ticket resale.

```solidity
struct Listing {
    uint256 listingId;
    uint256 tokenId;
    address seller;
    uint256 price;
    bool active;
    uint256 createdAt;
}

mapping(uint256 => Listing) public listings;
mapping(uint256 => uint256) public tokenToListing; // tokenId => listingId
uint256 public listingCounter;
```

**Key Functions:**
- `listTicket()` - Create listing
- `buyTicket()` - Purchase from marketplace
- `cancelListing()` - Remove listing
- `updatePrice()` - Change listing price
- `getActiveListings()` - Get all active listings
- `getListingsByEvent()` - Filter by event

## Data Fetching Strategy (No Backend)

### Reading Events
```typescript
// Direct contract read
import { useReadContract } from 'wagmi';

function useEvent(eventId: number) {
  const { data: event } = useReadContract({
    address: TICKET_FACTORY_ADDRESS,
    abi: TicketFactoryABI,
    functionName: 'events',
    args: [eventId],
  });
  
  return event;
}

// Get all events by looping through eventCounter
function useAllEvents() {
  const { data: eventCounter } = useReadContract({
    address: TICKET_FACTORY_ADDRESS,
    abi: TicketFactoryABI,
    functionName: 'eventCounter',
  });
  
  // Fetch events 0 to eventCounter
  // Cache in localStorage for performance
}
```

### Reading User Tickets
```typescript
function useUserTickets(address: string) {
  const { data: balance } = useReadContract({
    address: TICKET_NFT_ADDRESS,
    abi: TicketNFTABI,
    functionName: 'balanceOf',
    args: [address],
  });
  
  // Loop through and get tokenOfOwnerByIndex
  // Or use getUserTickets() if implemented
}
```

### IPFS Metadata
```typescript
async function uploadMetadata(eventData: any) {
  const metadata = {
    name: eventData.name,
    description: eventData.description,
    image: eventData.imageUrl,
    attributes: [
      { trait_type: "Venue", value: eventData.venue },
      { trait_type: "Date", value: eventData.date },
    ],
  };
  
  // Upload to Pinata
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify(metadata),
  });
  
  const { IpfsHash } = await response.json();
  return `ipfs://${IpfsHash}`;
}
```

## Frontend Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page - featured events
│   ├── events/
│   │   ├── page.tsx            # Browse all events
│   │   └── [id]/
│   │       └── page.tsx        # Event detail & purchase
│   ├── marketplace/
│   │   └── page.tsx            # Secondary marketplace
│   ├── my-tickets/
│   │   └── page.tsx            # User's ticket collection
│   ├── create-event/
│   │   └── page.tsx            # Event creation (organizers)
│   └── verify/
│       └── page.tsx            # Ticket validation with QR scanner
├── components/
│   ├── EventCard.tsx           # Display event info
│   ├── TicketCard.tsx          # Display ticket NFT
│   ├── PurchaseModal.tsx       # Purchase flow modal
│   ├── ChainSelector.tsx       # Select payment chain
│   ├── QRScanner.tsx           # Scan QR codes
│   ├── QRDisplay.tsx           # Show ticket QR code
│   └── WalletConnect.tsx       # Connect wallet button
├── hooks/
│   ├── useContracts.ts         # Contract read/write hooks
│   ├── usePushChain.ts         # Push Chain SDK integration
│   ├── useEvents.ts            # Fetch and cache events
│   ├── useTickets.ts           # User tickets management
│   └── useLocalStorage.ts      # Client-side caching
├── lib/
│   ├── pushchain.ts            # Push Chain SDK setup
│   ├── contracts.ts            # Contract ABIs & addresses
│   ├── ipfs.ts                 # IPFS upload/fetch utilities
│   └── cache.ts                # localStorage caching logic
└── types/
    └── index.ts
```

## Client-Side Caching Strategy

### Cache Structure (localStorage)
```typescript
interface CacheStructure {
  events: {
    [eventId: string]: {
      data: Event;
      timestamp: number;
    };
  };
  tickets: {
    [address: string]: {
      tokens: TicketNFT[];
      timestamp: number;
    };
  };
  listings: {
    data: Listing[];
    timestamp: number;
  };
}

// Cache for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

function getCachedEvents() {
  const cached = localStorage.getItem('events_cache');
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) return null;
  
  return data;
}
```

## Push Chain Integration

### Setup
```typescript
import { createPushClient } from '@pushchain/core';

const pushClient = createPushClient({
  chain: 'donut',
  rpcUrl: process.env.NEXT_PUBLIC_PUSH_RPC,
});
```

### Purchase Flow
```typescript
import { usePushTransaction } from '@pushchain/core';

function usePurchaseTicket() {
  const { sendTransaction } = usePushTransaction();

  const purchase = async (eventId: number, ticketTypeId: number, chain: string) => {
    // User selects their preferred chain for payment
    const tx = await sendTransaction({
      to: TICKET_FACTORY_ADDRESS,
      data: encodeFunctionData({
        abi: TicketFactoryABI,
        functionName: 'purchaseTicket',
        args: [eventId, ticketTypeId]
      }),
      chain, // Ethereum, Solana, Base, etc.
    });
    
    // Clear cache to refresh data
    localStorage.removeItem('events_cache');
    
    return tx;
  };

  return { purchase };
}
```

## QR Code System (Client-Side)

### Generate QR Code
```typescript
import QRCode from 'qrcode.react';

function TicketQRCode({ tokenId, eventId }: Props) {
  // Create unique hash for ticket
  const qrData = JSON.stringify({
    tokenId,
    eventId,
    timestamp: Date.now(),
    signature: hashTicketData(tokenId, eventId) // keccak256 hash
  });

  return (
    <QRCode
      value={qrData}
      size={256}
      level="H"
      includeMargin={true}
    />
  );
}
```

### Validate Ticket (Organizer View)
```typescript
import { useQRScanner } from '@/hooks/useQRScanner';
import { useWriteContract } from 'wagmi';

function TicketValidator() {
  const { scanQR } = useQRScanner();
  const { writeContract } = useWriteContract();

  const validateTicket = async () => {
    const qrData = await scanQR(); // Scan QR code
    const { tokenId } = JSON.parse(qrData);
    
    // Check if already used
    const ticket = await readContract({
      address: TICKET_NFT_ADDRESS,
      abi: TicketNFTABI,
      functionName: 'ticketDetails',
      args: [tokenId],
    });
    
    if (ticket.used) {
      alert('Ticket already used!');
      return;
    }
    
    // Mark as used on-chain
    await writeContract({
      address: TICKET_NFT_ADDRESS,
      abi: TicketNFTABI,
      functionName: 'validateTicket',
      args: [tokenId],
    });
    
    alert('Ticket validated successfully!');
  };

  return <button onClick={validateTicket}>Scan Ticket</button>;
}
```

## Step-by-Step Implementation Guide

### Phase 1: Smart Contract Development (Week 1)

**Step 1.1** - Environment setup
```bash
mkdir ticketchain-contracts && cd ticketchain-contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts @pushchain/core
npx hardhat init
```

**Step 1.2** - Configure Push Chain Testnet
```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    pushTestnet: {
      url: "https://evm.rpc-testnet-donut-node1.push.org/",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 42101, // Push Chain Testnet
    },
  },
};

export default config;
```

**Step 1.3** - Develop TicketNFT.sol
```solidity
// contracts/TicketNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, Ownable {
    // Implementation here
    // Include all structs and functions from architecture section
}
```

**Step 1.4** - Develop TicketFactory.sol
```solidity
// contracts/TicketFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./TicketNFT.sol";

contract TicketFactory is ReentrancyGuard {
    // Implementation here
}
```

**Step 1.5** - Develop TicketMarketplace.sol
```solidity
// contracts/TicketMarketplace.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./TicketNFT.sol";

contract TicketMarketplace is ReentrancyGuard {
    // Implementation here
}
```

**Step 1.6** - Write deployment script
```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  // Deploy TicketNFT
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy();
  await ticketNFT.waitForDeployment();
  
  // Deploy TicketFactory
  const TicketFactory = await ethers.getContractFactory("TicketFactory");
  const factory = await TicketFactory.deploy(await ticketNFT.getAddress());
  await factory.waitForDeployment();
  
  // Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("TicketMarketplace");
  const marketplace = await Marketplace.deploy(await ticketNFT.getAddress());
  await marketplace.waitForDeployment();
  
  console.log("TicketNFT:", await ticketNFT.getAddress());
  console.log("TicketFactory:", await factory.getAddress());
  console.log("Marketplace:", await marketplace.getAddress());
}
```

**Step 1.7** - Deploy and verify
```bash
npx hardhat run scripts/deploy.ts --network pushTestnet
# Save contract addresses to .env
```

### Phase 2: Frontend Development (Week 2)

**Step 2.1** - Project setup
```bash
npx create-next-app@latest ticketchain --typescript --tailwind --app
cd ticketchain
npm install @pushchain/core @pushchain/ui-kit viem wagmi @tanstack/react-query
npm install qrcode.react react-qr-scanner lucide-react
```

**Step 2.2** - Configure Push Chain and Wagmi
```typescript
// lib/pushchain.ts
import { createPushClient } from '@pushchain/core';
import { http, createConfig } from 'wagmi';
import { pushTestnet } from '@pushchain/core/chains';

export const pushClient = createPushClient({
  chain: 'donut',
  rpcUrl: process.env.NEXT_PUBLIC_PUSH_RPC!,
});

export const config = createConfig({
  chains: [pushTestnet],
  transports: {
    [pushTestnet.id]: http(),
  },
});
```

**Step 2.3** - Create contract hooks
```typescript
// hooks/useContracts.ts
import { useReadContract, useWriteContract } from 'wagmi';
import { TicketFactoryABI, TICKET_FACTORY_ADDRESS } from '@/lib/contracts';

export function useCreateEvent() {
  const { writeContract, isPending } = useWriteContract();

  const createEvent = async (eventData: EventInput) => {
    // Upload image to IPFS first
    const ipfsHash = await uploadToIPFS(eventData.image);
    
    return writeContract({
      address: TICKET_FACTORY_ADDRESS,
      abi: TicketFactoryABI,
      functionName: 'createEvent',
      args: [
        eventData.name,
        eventData.description,
        eventData.startTime,
        eventData.endTime,
        eventData.venue,
        ipfsHash,
      ],
    });
  };

  return { createEvent, isPending };
}
```

**Step 2.4** - Build caching system
```typescript
// lib/cache.ts
const CACHE_KEY = 'ticketchain_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface Cache {
  events: Record<string, { data: any; timestamp: number }>;
  tickets: Record<string, { data: any; timestamp: number }>;
}

export function getCachedData(key: string, subKey?: string) {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const cache: Cache = JSON.parse(cached);
  const data = subKey ? cache[key][subKey] : cache[key];
  
  if (!data || Date.now() - data.timestamp > CACHE_DURATION) {
    return null;
  }

  return data.data;
}

export function setCachedData(key: string, data: any, subKey?: string) {
  const cached = localStorage.getItem(CACHE_KEY);
  const cache: Cache = cached ? JSON.parse(cached) : { events: {}, tickets: {} };

  if (subKey) {
    cache[key][subKey] = { data, timestamp: Date.now() };
  } else {
    cache[key] = { data, timestamp: Date.now() };
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}
```

**Step 2.5** - Build core components

**EventCard.tsx**
```typescript
export function EventCard({ event }: { event: Event }) {
  return (
    <div className="border rounded-lg p-4">
      <img src={getIPFSUrl(event.imageIpfsHash)} alt={event.name} />
      <h3>{event.name}</h3>
      <p>{event.description}</p>
      <p>{new Date(event.startTime * 1000).toLocaleDateString()}</p>
      <p>{event.venue}</p>
      <p>{event.sold}/{event.totalSupply} tickets sold</p>
      <Link href={`/events/${event.eventId}`}>View Details</Link>
    </div>
  );
}
```

**PurchaseModal.tsx**
```typescript
export function PurchaseModal({ eventId, ticketTypeId }: Props) {
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const { purchase, isPending } = usePurchaseTicket();

  const handlePurchase = async () => {
    await purchase(eventId, ticketTypeId, selectedChain);
  };

  return (
    <Dialog>
      <ChainSelector value={selectedChain} onChange={setSelectedChain} />
      <Button onClick={handlePurchase} disabled={isPending}>
        {isPending ? 'Processing...' : 'Purchase Ticket'}
      </Button>
    </Dialog>
  );
}
```

**Step 2.6** - Build pages

**app/events/page.tsx** - Browse Events
```typescript
export default function EventsPage() {
  const { data: eventCounter } = useReadContract({
    address: TICKET_FACTORY_ADDRESS,
    abi: TicketFactoryABI,
    functionName: 'eventCounter',
  });

  // Fetch all events from 0 to eventCounter
  const events = useEvents(eventCounter);

  return (
    <div className="grid grid-cols-3 gap-4">
      {events.map(event => (
        <EventCard key={event.eventId} event={event} />
      ))}
    </div>
  );
}
```

**app/my-tickets/page.tsx** - User Tickets
```typescript
export default function MyTicketsPage() {
  const { address } = useAccount();
  const tickets = useUserTickets(address);

  return (
    <div className="grid grid-cols-2 gap-4">
      {tickets.map(ticket => (
        <TicketCard key={ticket.tokenId} ticket={ticket}>
          <QRDisplay tokenId={ticket.tokenId} eventId={ticket.eventId} />
          <Button onClick={() => listOnMarketplace(ticket.tokenId)}>
            Sell Ticket
          </Button>
        </TicketCard>
      ))}
    </div>
  );
}
```

### Phase 3: IPFS Integration (Day 3)

**Step 3.1** - Setup Pinata account (free)
- Sign up at https://pinata.cloud
- Get API JWT token
- Add to `.env.local`

**Step 3.2** - Create IPFS utilities
```typescript
// lib/ipfs.ts
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT!;

export async function uploadToIPFS(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  const { IpfsHash } = await response.json();
  return IpfsHash;
}

export async function uploadJSONToIPFS(json: object) {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify(json),
  });

  const { IpfsHash } = await response.json();
  return IpfsHash;
}

export function getIPFSUrl(hash: string) {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}
```

### Phase 4: Testing & Polish (Week 3)

**Step 4.1** - End-to-end testing
- Create event from organizer account
- Purchase from Ethereum wallet
- Purchase from different chain (Base/Polygon)
- View ticket in My Tickets
- List on marketplace
- Buy from marketplace
- Validate with QR scanner

**Step 4.2** - Performance optimization
- Implement lazy loading for images
- Add skeleton loaders
- Optimize re-renders with React.memo
- Batch contract reads where possible

**Step 4.3** - Mobile responsiveness
- Test on mobile devices
- Optimize QR scanner for mobile
- Ensure wallet connections work on mobile

**Step 4.4** - Error handling
```typescript
function useEvents() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(err => {
        setError(err.message);
        toast.error('Failed to load events');
      })
      .finally(() => setLoading(false));
  }, []);

  return { events, error, loading };
}
```

### Phase 5: Deployment & Demo (Day 1-2)

**Step 5.1** - Deploy to Vercel
```bash
npm run build
vercel deploy --prod
```

**Step 5.2** - Environment variables on Vercel
```env
NEXT_PUBLIC_PUSH_RPC=https://testnet-rpc.push.org
NEXT_PUBLIC_TICKET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_TICKET_NFT_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_PINATA_JWT=...
```

**Step 5.3** - Create demo video (3-5 min)
1. Show landing page with events
2. Create new event (30 sec)
3. Purchase ticket from Ethereum (1 min)
4. Purchase ticket from Solana (1 min)
5. Show ticket in My Tickets with QR code (30 sec)
6. List ticket on marketplace (30 sec)
7. Buy from marketplace (45 sec)
8. Validate ticket with QR scanner (30 sec)

**Step 5.4** - Prepare documentation
- README with setup instructions
- Contract addresses
- Demo link
- Video link
- Architecture diagram

## Environment Variables
```env
# Push Chain
NEXT_PUBLIC_PUSH_RPC=https://testnet-rpc.push.org
NEXT_PUBLIC_PUSH_CHAIN_ID=111557560

# Contracts (After deployment)
NEXT_PUBLIC_TICKET_FACTORY_ADDRESS=
NEXT_PUBLIC_TICKET_NFT_ADDRESS=
NEXT_PUBLIC_MARKETPLACE_ADDRESS=

# IPFS
NEXT_PUBLIC_PINATA_JWT=

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

## Testing Checklist
- [ ] Deploy contracts to Push Chain testnet
- [ ] Create event with image upload
- [ ] Purchase ticket from Ethereum wallet
- [ ] Purchase ticket from different chain
- [ ] View ticket NFT in My Tickets
- [ ] Generate and display QR code
- [ ] List ticket on marketplace
- [ ] Purchase from marketplace
- [ ] Scan QR code for validation
- [ ] Mark ticket as used
- [ ] Withdraw funds as organizer
- [ ] Test on mobile device
- [ ] Verify IPFS images load correctly

## Key Advantages of This Approach

### ✅ Pros
- **Fully Decentralized**: No central server needed
- **Lower Costs**: No backend hosting fees
- **Simpler Architecture**: Fewer moving parts
- **More Secure**: No API vulnerabilities
- **Faster Development**: Focus on contracts + frontend

### ⚠️ Limitations
- Search/filtering is client-side (slower for many events)
- Historical data requires caching or The Graph
- Real-time updates require polling

### 💡 Solutions
- Cache aggressively with localStorage
- Use The Graph for complex queries (optional)
- Implement pagination for large datasets
- Show loading states gracefully (use shadcn library, use skeletons)

## Resources
- Push Chain Docs: https://pushchain.github.io/push-chain-website/pr-preview/pr-1067/docs/
- Push Chain SDK: https://www.npmjs.com/package/@pushchain/core
- Testnet Faucet: https://faucet.push.org/
- Block Explorer: https://donut.push.network/
- Pinata IPFS: https://pinata.cloud
- Wagmi Docs: https://wagmi.sh/

## Demo Script
1. **Landing** - Show featured events (15 sec)
2. **Create Event** - Organizer creates event with image (45 sec)
3. **Multi-Chain Purchase** - Buy from Ethereum, then Solana (2 min)
4. **My Tickets** - Show owned NFTs with QR codes (30 sec)
5. **Marketplace** - List and buy ticket (1 min)
6. **Validation** - Scan QR and validate (30 sec)

Total: ~5 minutes

## Success Metrics
- Smart contracts deployed ✅
- Multi-chain purchases working ✅
- QR validation functional ✅
- Marketplace operational ✅
- Mobile responsive ✅
- No backend required ✅
