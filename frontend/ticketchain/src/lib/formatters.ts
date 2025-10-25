import type {
  Event,
  TicketNFT,
  Listing,
  FormattedEvent,
  FormattedTicket,
  FormattedListing,
  TicketType,
  QRCodeData,
} from "../types";
import { getIPFSUrl } from "./ipfs";
import { convertPCToNative } from "./contracts";
import { getChainById } from "../types/chains";

// Format event data from contract to display format
export function formatEvent(event: Event): FormattedEvent {
  return {
    ...event,
    eventId: Number(event.eventId),
    startTime: new Date(Number(event.startTime) * 1000),
    endTime: new Date(Number(event.endTime) * 1000),
    totalSupply: Number(event.totalSupply),
    sold: Number(event.sold),
    imageUrl: getIPFSUrl(event.imageIpfsHash),
  };
}

// Format ticket data from contract to display format
export function formatTicket(
  ticket: TicketNFT,
  event?: FormattedEvent
): FormattedTicket {
  const toNumber = (value: unknown): number => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "bigint") {
      return Number(value);
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  };

  const toBigInt = (value: unknown): bigint => {
    if (typeof value === "bigint") {
      return value;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return BigInt(Math.floor(value));
    }

    if (typeof value === "string" && value.trim() !== "") {
      try {
        return BigInt(value);
      } catch (error) {
        console.warn("Unable to parse purchasePrice to BigInt", {
          value,
          error,
        });
      }
    }

    return 0n;
  };

  const purchaseChainMeta = getChainById(ticket.purchaseChain);

  const rawPurchaseChain = (ticket as { purchaseChain?: unknown })
    .purchaseChain;
  const purchaseChain =
    typeof rawPurchaseChain === "string" && rawPurchaseChain.trim().length > 0
      ? rawPurchaseChain
      : "";

  const normalizedOriginalOwner =
    typeof ticket.originalOwner === "string"
      ? ticket.originalOwner.toLowerCase()
      : "";

  const normalizedCurrentOwner =
    typeof ticket.currentOwner === "string"
      ? ticket.currentOwner.toLowerCase()
      : "";

  const isOriginalOwner =
    normalizedOriginalOwner === "" ||
    normalizedCurrentOwner === "" ||
    normalizedOriginalOwner === normalizedCurrentOwner;

  const formattedTicket: FormattedTicket = {
    ...ticket,
    tokenId: toNumber((ticket as { tokenId?: unknown }).tokenId),
    eventId: toNumber((ticket as { eventId?: unknown }).eventId),
    ticketTypeId: toNumber((ticket as { ticketTypeId?: unknown }).ticketTypeId),
    purchasePrice: toBigInt(
      (ticket as { purchasePrice?: unknown }).purchasePrice
    ),
    // Explicitly preserve currentOwner (don't let it become empty string)
    currentOwner: normalizedCurrentOwner || ticket.currentOwner,
    originalOwner: normalizedOriginalOwner || ticket.originalOwner,
    purchaseChain,
    event,
    purchaseChainMeta,
    isOriginalOwner,
    ticketStatus: ticket.used ? "used" : "valid",
  };

  return formattedTicket;
}

// Format listing data from contract to display format
export function formatListing(
  listing: Listing,
  ticket?: FormattedTicket
): FormattedListing {
  return {
    ...listing,
    listingId: Number(listing.listingId),
    tokenId: Number(listing.tokenId),
    price: Number(listing.price),
    createdAt: new Date(Number(listing.createdAt) * 1000),
    ticket,
  };
}

// Format price in wei to PC with proper decimals
export function formatPrice(
  priceWei: bigint | number | string,
  decimals: number = 18
): string {
  let price: bigint;

  if (typeof priceWei === "bigint") {
    price = priceWei;
  } else if (typeof priceWei === "number") {
    price = BigInt(Math.trunc(priceWei));
  } else if (typeof priceWei === "string") {
    price = BigInt(priceWei);
  } else {
    price = BigInt(0);
  }
  const decimalsBigInt = BigInt(decimals);
  const divisor =
    decimalsBigInt === BigInt(0) ? BigInt(1) : BigInt(10) ** decimalsBigInt;
  const wholePart = price / divisor;
  const fractionalPart = price % divisor;

  if (fractionalPart === BigInt(0)) {
    return wholePart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const trimmedFractional = fractionalStr.replace(/0+$/, "");

  return `${wholePart}.${trimmedFractional}`;
}

// Format price with currency symbol
export function formatPriceWithCurrency(
  priceWei: bigint | number | string,
  currency: string = "PC",
  decimals: number = 18
): string {
  return `${formatPrice(priceWei, decimals)} ${currency}`;
}

// Convert PC price to display price in user's preferred currency
export function formatPriceInCurrency(
  pcPriceWei: bigint,
  targetCurrency: string
): string {
  const convertedPrice = convertPCToNative(pcPriceWei, targetCurrency);
  return formatPriceWithCurrency(convertedPrice, targetCurrency);
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format time for display
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format date and time for display
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

// Format address for display (truncate middle)
export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format large numbers with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Calculate time remaining until event
export function getTimeUntilEvent(eventDate: Date): string {
  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();

  if (diff <= 0) {
    return "Event has started";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
  } else {
    return `${minutes} minute${minutes > 1 ? "s" : ""} remaining`;
  }
}

// Check if event is active/upcoming
export function isEventActive(event: FormattedEvent): boolean {
  const now = new Date();
  return event.active && event.startTime > now;
}

// Check if event has ended
export function isEventEnded(event: FormattedEvent): boolean {
  const now = new Date();
  return event.endTime < now;
}

// Check if event is currently happening
export function isEventLive(event: FormattedEvent): boolean {
  const now = new Date();
  return event.startTime <= now && event.endTime > now;
}

// Get event status
export function getEventStatus(
  event: FormattedEvent
): "upcoming" | "live" | "ended" | "inactive" {
  if (!event.active) return "inactive";
  if (isEventEnded(event)) return "ended";
  if (isEventLive(event)) return "live";
  return "upcoming";
}

// Calculate availability percentage
export function getAvailabilityPercentage(sold: number, total: number): number {
  if (total === 0) return 0;
  return Math.round(((total - sold) / total) * 100);
}

// Format availability text
export function formatAvailability(sold: number, total: number): string {
  const available = total - sold;
  const percentage = getAvailabilityPercentage(sold, total);

  if (available === 0) {
    return "Sold Out";
  }

  return `${available} of ${total} available (${percentage}%)`;
}

// Generate QR code data
export function generateQRCodeData(tokenId: number, eventId: number): string {
  const data = {
    tokenId: tokenId.toString(),
    eventId: eventId.toString(),
    timestamp: Date.now(),
    signature: hashTicketData(tokenId, eventId),
  };

  return JSON.stringify(data);
}

// Simple hash function for ticket data (in production, use proper cryptographic hash)
function hashTicketData(tokenId: number, eventId: number): string {
  const data = `${tokenId}-${eventId}-${Date.now()}`;
  let hash = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
}

// Validate QR code data
export type QRCodeValidationResult =
  | { valid: true; data: QRCodeData }
  | { valid: false; error: string };

export function validateQRCodeData(qrData: string): QRCodeValidationResult {
  try {
    const data = JSON.parse(qrData) as Partial<QRCodeData> & {
      timestamp?: number;
      signature?: string;
    };

    if (!data.tokenId || !data.eventId || !data.timestamp || !data.signature) {
      return { valid: false, error: "Invalid QR code format" };
    }

    // Check if QR code is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - data.timestamp > maxAge) {
      return { valid: false, error: "QR code has expired" };
    }

    return {
      valid: true,
      data: {
        tokenId: data.tokenId,
        eventId: data.eventId,
        timestamp: data.timestamp,
        signature: data.signature,
      },
    };
  } catch {
    return { valid: false, error: "Invalid QR code data" };
  }
}

// Sort events by date
export function sortEventsByDate(
  events: FormattedEvent[],
  ascending: boolean = true
): FormattedEvent[] {
  return [...events].sort((a, b) => {
    const diff = a.startTime.getTime() - b.startTime.getTime();
    return ascending ? diff : -diff;
  });
}

// Filter events by status
export function filterEventsByStatus(
  events: FormattedEvent[],
  status: "upcoming" | "live" | "ended" | "all" = "all"
): FormattedEvent[] {
  if (status === "all") return events;

  return events.filter((event) => getEventStatus(event) === status);
}

// Search events by name or venue
export function searchEvents(
  events: FormattedEvent[],
  query: string
): FormattedEvent[] {
  if (!query.trim()) return events;

  const lowercaseQuery = query.toLowerCase();
  return events.filter(
    (event) =>
      event.name.toLowerCase().includes(lowercaseQuery) ||
      event.venue.toLowerCase().includes(lowercaseQuery) ||
      event.description.toLowerCase().includes(lowercaseQuery)
  );
}

// Get price range for ticket types
export function getPriceRange(ticketTypes: TicketType[]): {
  min: number;
  max: number;
} {
  if (!ticketTypes || ticketTypes.length === 0) {
    return { min: 0, max: 0 };
  }

  const prices = ticketTypes.map((type) => Number(type.price));
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

// Format price range
export function formatPriceRange(min: number, max: number): string {
  if (min === max) {
    return formatPrice(BigInt(min));
  }
  return `${formatPrice(BigInt(min))} - ${formatPrice(BigInt(max))}`;
}
