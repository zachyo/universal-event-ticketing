import { useEffect, useState, useMemo } from "react";
import {
  useEvent,
  useTicketTypes,
  useMarketplaceListings,
} from "./useContracts";
import { useTicketNFT } from "./useTicketNFT";
import { useMarketplaceStats } from "./useMarketplaceStats";

export interface TierAnalytics {
  name: string;
  sold: number;
  supply: number;
  revenue: bigint;
  sellRate: number;
  price: bigint;
}

export interface EventAnalytics {
  // Sales Overview
  totalSold: number;
  totalCapacity: number;
  sellRate: number;
  primaryRevenue: bigint;
  remainingCapacity: number;

  // Tier Breakdown
  tierBreakdown: TierAnalytics[];

  // Secondary Market
  activeListings: number;
  avgResalePrice: bigint;
  lowestPrice: bigint;
  highestPrice: bigint;
  secondarySales: number;
  secondaryVolume: bigint; // Total volume of secondary sales
  
  // Royalty Revenue
  royaltyRevenue: bigint; // Total royalties earned from secondary sales
  royaltyPercentage: number; // Event's royalty percentage (e.g., 2.5)
  avgRoyaltyPerSale: bigint; // Average royalty per secondary sale

  // Attendance
  ticketsScanned: number;
  scanRate: number;
  noShowRate: number;
}

export function useEventAnalytics(eventId: number) {
  const {
    event,
    isLoading: eventLoading,
    error: eventError,
  } = useEvent(eventId);
  const { ticketTypes, isLoading: typesLoading } = useTicketTypes(eventId);
  const { listings, loading: listingsLoading } = useMarketplaceListings();
  const { tickets, loading: ticketsLoading } = useTicketNFT();

  // Get secondary market stats directly from contract storage - simple and reliable!
  const {
    secondarySales: contractSecondarySales,
    royaltiesCollected: contractRoyaltiesCollected,
    isLoading: statsLoading,
  } = useMarketplaceStats(eventId);

  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Filter listings for this specific event
  // Note: Since useTicketNFT doesn't currently load all tickets,
  // we return all listings. In a production system, you'd want to
  // fetch ticket data for each listing to properly filter by eventId
  const eventListings = useMemo(() => {
    return listings || [];
  }, [listings]);

  // Filter tickets for this event
  const eventTickets = useMemo(() => {
    if (!tickets.length) return [];
    return tickets.filter((ticket) => Number(ticket.eventId) === eventId);
  }, [tickets, eventId]);

  useEffect(() => {
    if (eventLoading || typesLoading || listingsLoading || ticketsLoading || statsLoading) {
      setLoading(true);
      return;
    }

    if (eventError) {
      setError(eventError);
      setLoading(false);
      return;
    }

    if (!event) {
      setLoading(false);
      return;
    }

    try {
      // Calculate tier analytics
      const tierBreakdown: TierAnalytics[] = (ticketTypes || []).map((tt) => ({
        name: tt.name,
        sold: Number(tt.sold),
        supply: Number(tt.supply),
        revenue: tt.price * tt.sold,
        sellRate:
          Number(tt.supply) > 0
            ? (Number(tt.sold) / Number(tt.supply)) * 100
            : 0,
        price: tt.price,
      }));

      // Calculate primary revenue
      const primaryRevenue = tierBreakdown.reduce(
        (sum, tier) => sum + tier.revenue,
        BigInt(0)
      );

      // Calculate secondary market stats
      const activeListings = eventListings.filter((l) => l.active).length;

      const activePrices = eventListings
        .filter((l) => l.active)
        .map((l) => BigInt(l.price));

      const avgResalePrice =
        activePrices.length > 0
          ? activePrices.reduce((sum, price) => sum + price, BigInt(0)) /
            BigInt(activePrices.length)
          : BigInt(0);

      const lowestPrice =
        activePrices.length > 0
          ? activePrices.reduce((min, price) => (price < min ? price : min))
          : BigInt(0);

      const highestPrice =
        activePrices.length > 0
          ? activePrices.reduce((max, price) => (price > max ? price : max))
          : BigInt(0);

      // Use the contract-stored secondary sales data - simple and accurate!
      const secondarySales = contractSecondarySales;
      const royaltyRevenue = contractRoyaltiesCollected;
      const royaltyBps = Number(event.royaltyBps || 0);
      const royaltyPercentage = royaltyBps / 100; // Convert to percentage (e.g., 2.5)
      const avgRoyaltyPerSale = secondarySales > 0
        ? royaltyRevenue / BigInt(secondarySales)
        : BigInt(0);

      // We don't have total volume anymore, but that's okay - royalty data is more important
      const secondaryVolume = BigInt(0); // Could calculate from active listings if needed

      console.log("✅ Analytics from Contract Storage:", {
        eventId,
        secondarySales,
        royaltyRevenue: royaltyRevenue.toString(),
        royaltyPercentage,
        avgRoyaltyPerSale: avgRoyaltyPerSale.toString(),
        activeListings,
      });

      // Calculate attendance
      const ticketsScanned = eventTickets.filter((t) => t.used).length;
      const totalSold = Number(event.sold);
      const scanRate = totalSold > 0 ? (ticketsScanned / totalSold) * 100 : 0;
      const noShowRate = 100 - scanRate;

      const analyticsData: EventAnalytics = {
        // Sales Overview
        totalSold,
        totalCapacity: Number(event.totalSupply),
        sellRate:
          Number(event.totalSupply) > 0
            ? (totalSold / Number(event.totalSupply)) * 100
            : 0,
        primaryRevenue,
        remainingCapacity: Number(event.totalSupply) - totalSold,

        // Tier Breakdown
        tierBreakdown,

        // Secondary Market
        activeListings,
        avgResalePrice,
        lowestPrice,
        highestPrice,
        secondarySales,
        secondaryVolume,

        // Royalty Revenue
        royaltyRevenue,
        royaltyPercentage,
        avgRoyaltyPerSale,

        // Attendance
        ticketsScanned,
        scanRate,
        noShowRate,
      };

      setAnalytics(analyticsData);
      setLoading(false);
    } catch (err) {
      console.error("Error calculating analytics:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to calculate analytics")
      );
      setLoading(false);
    }
  }, [
    event,
    ticketTypes,
    eventListings,
    eventTickets,
    eventLoading,
    typesLoading,
    listingsLoading,
    ticketsLoading,
    statsLoading,
    eventError,
    eventId,
    contractSecondarySales,
    contractRoyaltiesCollected,
  ]);

  return { analytics, loading, error };
}
