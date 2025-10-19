import { useEffect, useState, useMemo } from "react";
import {
  useEvent,
  useTicketTypes,
  useMarketplaceListings,
} from "./useContracts";
import { useTicketNFT } from "./useTicketNFT";
import { formatListing } from "../lib/formatters";
import type { FormattedListing } from "../types";

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

  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Filter listings for this specific event
  const eventListings = useMemo(
    () =>
      (listings || []).filter((listing) => listing.ticket?.eventId === eventId),
    [listings, eventId]
  );

  // Filter tickets for this event
  const eventTickets = useMemo(() => {
    if (!tickets.length) return [];
    return tickets.filter((ticket) => Number(ticket.eventId) === eventId);
  }, [tickets, eventId]);

  useEffect(() => {
    if (eventLoading || typesLoading || listingsLoading || ticketsLoading) {
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

      // Count secondary sales (inactive listings that were once active)
      const secondarySales = eventListings.filter((l) => !l.active).length;

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
    eventError,
    eventId,
  ]);

  return { analytics, loading, error };
}
