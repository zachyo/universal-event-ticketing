import { useMemo } from "react";
import { useReadContracts, useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS, TicketMarketplaceABI } from "../lib/contracts";

export interface SellerStats {
  totalListed: bigint;
  currentlyListed: bigint;
  totalSold: bigint;
  totalRevenue: bigint;
  totalRoyaltiesPaid: bigint;
  totalCanceled: bigint;
  firstListingTime: bigint;
  lastActivityTime: bigint;
}

export interface ResellerAnalytics {
  // Personal stats
  stats: SellerStats;

  // Active listings
  activeListings: any[];

  // Historical listings
  historicalListings: any[];

  // Event-wide stats for comparison
  eventSecondarySales: number;
  eventRoyaltiesCollected: bigint;

  // Computed metrics
  averageSalePrice: bigint;
  netRevenue: bigint; // totalRevenue - totalRoyaltiesPaid
  profitMargin: number; // percentage
  listingSuccessRate: number; // percentage (sold / total listed)
  avgTimeToSell: number; // in seconds

  // Loading states
  isLoading: boolean;
  error: Error | null;
}

export function useResellerAnalytics(
  sellerAddress: string | undefined,
  eventId: number
): ResellerAnalytics {
  const enabled = Boolean(sellerAddress) && eventId > 0;

  // Fetch all data in parallel
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      // 0: Seller stats
      {
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: TicketMarketplaceABI.abi,
        functionName: "getResellerStats",
        args: sellerAddress ? [sellerAddress, BigInt(eventId)] : undefined,
      },
      // 1: Seller listings (active and historical)
      {
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: TicketMarketplaceABI.abi,
        functionName: "getSellerListings",
        args: sellerAddress ? [sellerAddress, BigInt(eventId)] : undefined,
      },
      // 2: Event-wide secondary market stats
      {
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: TicketMarketplaceABI.abi,
        functionName: "getEventSecondaryMarketStats",
        args: [BigInt(eventId)],
      },
    ],
    query: {
      enabled,
    },
  });

  const analytics = useMemo<ResellerAnalytics>(() => {
    if (!data || !data[0]?.result || !data[1]?.result || !data[2]?.result) {
      return {
        stats: {
          totalListed: 0n,
          currentlyListed: 0n,
          totalSold: 0n,
          totalRevenue: 0n,
          totalRoyaltiesPaid: 0n,
          totalCanceled: 0n,
          firstListingTime: 0n,
          lastActivityTime: 0n,
        },
        activeListings: [],
        historicalListings: [],
        eventSecondarySales: 0,
        eventRoyaltiesCollected: 0n,
        averageSalePrice: 0n,
        netRevenue: 0n,
        profitMargin: 0,
        listingSuccessRate: 0,
        avgTimeToSell: 0,
        isLoading,
        error: error as Error | null,
      };
    }

    // Parse seller stats
    const statsData = data[0].result as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
    const stats: SellerStats = {
      totalListed: statsData[0],
      currentlyListed: statsData[1],
      totalSold: statsData[2],
      totalRevenue: statsData[3],
      totalRoyaltiesPaid: statsData[4],
      totalCanceled: statsData[5],
      firstListingTime: statsData[6],
      lastActivityTime: statsData[7],
    };

    // Parse listings
    const listingsData = data[1].result as [any[], any[]];
    const activeListings = listingsData[0];
    const historicalListings = listingsData[1];

    // Parse event stats
    const eventStatsData = data[2].result as [bigint, bigint];
    const eventSecondarySales = Number(eventStatsData[0]);
    const eventRoyaltiesCollected = eventStatsData[1];

    // Compute derived metrics
    const averageSalePrice =
      stats.totalSold > 0n ? stats.totalRevenue / stats.totalSold : 0n;

    const netRevenue = stats.totalRevenue - stats.totalRoyaltiesPaid;

    const profitMargin =
      stats.totalRevenue > 0n
        ? (Number(netRevenue) / Number(stats.totalRevenue)) * 100
        : 0;

    const listingSuccessRate =
      stats.totalListed > 0n
        ? (Number(stats.totalSold) / Number(stats.totalListed)) * 100
        : 0;

    // Calculate average time to sell from historical listings
    let totalTimeToSell = 0;
    let soldCount = 0;

    for (const listing of historicalListings) {
      // Check if listing was sold (not active and has a buyer)
      // We can infer this if it's not active and not in canceled stats
      // For now, we'll use a simple approximation
      if (!listing.active) {
        soldCount++;
        // Assuming we store timestamps, calculate difference
        // This is a placeholder - adjust based on actual data structure
        totalTimeToSell += Number(stats.lastActivityTime - listing.createdAt);
      }
    }

    const avgTimeToSell =
      soldCount > 0 ? Math.floor(totalTimeToSell / soldCount) : 0;

    return {
      stats,
      activeListings,
      historicalListings,
      eventSecondarySales,
      eventRoyaltiesCollected,
      averageSalePrice,
      netRevenue,
      profitMargin,
      listingSuccessRate,
      avgTimeToSell,
      isLoading,
      error: null,
    };
  }, [data, isLoading, error]);

  return analytics;
}

// Hook to check if user can access reseller analytics
export function useHasResellerAccess(
  sellerAddress: string | undefined,
  eventId: number
): { hasAccess: boolean; isLoading: boolean } {
  const { data, isLoading } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI.abi,
    functionName: "hasSellerListedForEvent",
    args: sellerAddress ? [sellerAddress, BigInt(eventId)] : undefined,
    query: {
      enabled: Boolean(sellerAddress) && eventId > 0,
    },
  });

  return {
    hasAccess: Boolean(data),
    isLoading,
  };
}
