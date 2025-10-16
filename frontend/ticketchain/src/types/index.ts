// Core event structure from smart contract
export interface Event {
  eventId: bigint;
  organizer: string;
  name: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  venue: string;
  imageIpfsHash: string;
  totalSupply: bigint;
  sold: bigint;
  active: boolean;
}

// Ticket type structure for different tiers (VIP, General, etc.)
export interface TicketType {
  eventId: bigint;
  ticketTypeId: bigint;
  name: string;
  price: bigint;
  supply: bigint;
  sold: bigint;
}

// NFT ticket metadata structure
export interface TicketNFT {
  tokenId: bigint;
  eventId: bigint;
  ticketTypeId: bigint;
  originalOwner: string;
  currentOwner: string;
  purchasePrice: bigint;
  purchaseChain: string;
  used: boolean;
  qrCodeHash: string;
  tokenURI: string;
}

// Marketplace listing structure
export interface Listing {
  listingId: bigint;
  tokenId: bigint;
  seller: string;
  price: bigint;
  active: boolean;
  createdAt: bigint;
}

// Form input types for creating events
export interface EventInput {
  name: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  venue: string;
  image: File;
  totalSupply: bigint;
  royaltyBps: bigint;
}

// Form input types for creating ticket types
export interface TicketTypeInput {
  name: string;
  price: bigint;
  supply: bigint;
}

// IPFS metadata structure for NFTs
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// QR Code data structure
export interface QRCodeData {
  tokenId: string;
  eventId: string;
  timestamp: number;
  signature: string;
}

// Cache structure for localStorage
export interface CacheStructure {
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

// Hook return types
export interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

export interface UseTicketsReturn {
  tickets: TicketNFT[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

export interface UseListingsReturn {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

// Purchase transaction types
export interface PurchaseParams {
  eventId: bigint;
  ticketTypeId: bigint;
  price: bigint; // amount of native currency to send (price per ticket)
  quantity?: number; // number of tickets to purchase (defaults to 1)
  chain?: string;
}

// Marketplace transaction types
export interface ListTicketParams {
  tokenId: bigint;
  price: bigint;
}

export interface BuyTicketParams {
  listingId: bigint;
  chain?: string;
}

// Utility types for formatting
export interface FormattedEvent
  extends Omit<
    Event,
    "eventId" | "startTime" | "endTime" | "totalSupply" | "sold"
  > {
  eventId: number;
  startTime: Date;
  endTime: Date;
  totalSupply: number;
  sold: number;
  imageUrl: string;
}

export interface FormattedTicket
  extends Omit<
    TicketNFT,
    "tokenId" | "eventId" | "ticketTypeId" | "purchasePrice"
  > {
  tokenId: number;
  eventId: number;
  ticketTypeId: number;
  purchasePrice: number;
  event?: FormattedEvent;
}

export interface FormattedListing
  extends Omit<Listing, "listingId" | "tokenId" | "price" | "createdAt"> {
  listingId: number;
  tokenId: number;
  price: number;
  createdAt: Date;
  ticket?: FormattedTicket;
}

// Component prop types
export interface EventCardProps {
  event: FormattedEvent;
  showPurchaseButton?: boolean;
}

export interface TicketCardProps {
  ticket: FormattedTicket;
  showQR?: boolean;
  showListButton?: boolean;
}

export interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FormattedEvent;
  ticketTypes: TicketType[];
}

export interface QRCodeProps {
  tokenId: number;
  eventId: number;
  size?: number;
}

// Error types
export interface ContractError {
  message: string;
  code?: string;
  data?: unknown;
}

// Chain configuration
export interface ChainConfig {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
}

// Constants
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// Utility function types
export type FormatEventFunction = (event: Event) => FormattedEvent;
export type FormatTicketFunction = (ticket: TicketNFT) => FormattedTicket;
export type FormatListingFunction = (listing: Listing) => FormattedListing;
export type GetIPFSUrlFunction = (hash: string) => string;
export type UploadToIPFSFunction = (file: File) => Promise<string>;
export type UploadJSONToIPFSFunction = (
  json: Record<string, unknown>
) => Promise<string>;
