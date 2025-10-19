/**
 * Utility functions for handling tier-specific images with fallbacks
 */

import { IPFS_GATEWAY } from "../types";

/**
 * Get the image URL for a ticket tier
 * Falls back to event image if tier image is not available
 * Falls back to placeholder if neither is available
 *
 * @param tierImageHash - IPFS hash for tier-specific image
 * @param eventImageHash - IPFS hash for event image (fallback)
 * @param placeholder - Placeholder image path (default fallback)
 * @returns Complete IPFS gateway URL or placeholder
 */
export function getTierImageUrl(
  tierImageHash: string | undefined,
  eventImageHash?: string,
  placeholder: string = "/placeholder-event.jpg"
): string {
  // First priority: tier-specific image
  if (tierImageHash && tierImageHash.trim().length > 0) {
    return `${IPFS_GATEWAY}${tierImageHash}`;
  }

  // Second priority: event image
  if (eventImageHash && eventImageHash.trim().length > 0) {
    return `${IPFS_GATEWAY}${eventImageHash}`;
  }

  // Final fallback: placeholder
  return placeholder;
}

/**
 * Get tier image URL from event and ticket type data
 * Convenience function that handles extracting the right IPFS hashes
 *
 * @param ticket - Formatted ticket object with event data
 * @param ticketTypeIndex - Index of the ticket type in event.ticketTypes array
 * @returns Complete IPFS gateway URL or placeholder
 */
export function getTicketTierImageUrl(ticket: {
  ticketTypeId: number | bigint;
  event?: {
    imageUrl?: string;
    imageIpfsHash?: string;
    ticketTypes?: Array<{ ticketTypeId: bigint; imageIpfsHash?: string }>;
  };
}): string {
  // Try to find tier-specific image from event ticket types
  const tierImage = ticket.event?.ticketTypes?.find(
    (tt) => tt.ticketTypeId === BigInt(ticket.ticketTypeId)
  )?.imageIpfsHash;

  // Get event image hash (not the formatted URL)
  const eventImageHash = ticket.event?.imageIpfsHash;

  return getTierImageUrl(tierImage, eventImageHash);
}

/**
 * Preload an image to improve perceived performance
 *
 * @param url - Image URL to preload
 * @returns Promise that resolves when image is loaded
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Get multiple tier image URLs in batch
 * Useful for preloading images for multiple tiers
 *
 * @param ticketTypes - Array of ticket types with imageIpfsHash
 * @param fallbackEventImageHash - Event image hash for fallback
 * @returns Array of image URLs
 */
export function getBatchTierImageUrls(
  ticketTypes: Array<{ imageIpfsHash?: string }>,
  fallbackEventImageHash?: string
): string[] {
  return ticketTypes.map((tt) =>
    getTierImageUrl(tt.imageIpfsHash, fallbackEventImageHash)
  );
}
