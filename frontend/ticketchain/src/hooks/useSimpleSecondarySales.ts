/**
 * Simplified secondary sales tracking using inactive listings
 * This is a fallback approach that should always work
 */

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { useEvent } from "./useContracts";
import TicketMarketplaceABI from "../lib/abi/TicketMarketplace.json";

const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS;

export interface SimpleSecondarySale {
  listingId: bigint;
  tokenId: bigint;
  seller: string;
  price: bigint;
  royaltyAmount: bigint;
  active: boolean;
  createdAt: bigint;
}

export interface SimpleSecondarySalesData {
  sales: SimpleSecondarySale[];
  totalSales: number;
  totalVolume: bigint;
  totalRoyalties: bigint;
  avgPrice: bigint;
  avgRoyalty: bigint;
}

export function useSimpleSecondarySales(eventId: number) {
  console.log("🚀 useSimpleSecondarySales called with eventId:", eventId);

  const { event, isLoading: eventLoading, error: eventError } = useEvent(eventId);

  // Get all listings for this event from the contract
  const {
    data: eventListings,
    isLoading: listingsLoading,
    error: listingsError,
    refetch,
  } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI.abi,
    functionName: "getListingsByEvent",
    args: [BigInt(eventId)],
    query: {
      enabled: eventId > 0,
    },
  });

  const analytics = useMemo((): SimpleSecondarySalesData => {
    console.log("📍 Analytics calculation triggered");
    console.log("- eventListings:", eventListings);
    console.log("- event:", event);
    console.log("- listingsLoading:", listingsLoading);
    console.log("- eventLoading:", eventLoading);

    if (!eventListings || !event) {
      console.log("⚠️ No event listings or event data");
      console.log("- eventListings exists?", !!eventListings);
      console.log("- event exists?", !!event);
      return {
        sales: [],
        totalSales: 0,
        totalVolume: BigInt(0),
        totalRoyalties: BigInt(0),
        avgPrice: BigInt(0),
        avgRoyalty: BigInt(0),
      };
    }

    const royaltyBps = Number(event.royaltyBps || 0);
    const listings = eventListings as any[];

    console.log("📊 Simple Secondary Sales Analysis:");
    console.log("- Event ID:", eventId);
    console.log("- Total listings:", listings.length);
    console.log("- Active listings:", listings.filter((l) => l.active).length);
    console.log("- Inactive listings:", listings.filter((l) => !l.active).length);
    console.log("- Royalty BPS:", royaltyBps);

    // Consider inactive listings as completed sales
    // This is a simplified approach - it includes cancelled listings too
    // But it's better than showing nothing
    const inactiveListings = listings.filter((l) => !l.active);
    console.log("**********************inactive listings", inactiveListings)

    const sales: SimpleSecondarySale[] = inactiveListings.map((listing) => {
      const royaltyAmount =
        (BigInt(listing.price) * BigInt(royaltyBps)) / BigInt(10000);

      return {
        listingId: listing.listingId,
        tokenId: listing.tokenId,
        seller: listing.seller,
        price: listing.price,
        royaltyAmount,
        active: listing.active,
        createdAt: listing.createdAt,
      };
    });

    if (sales.length === 0) {
      console.log("ℹ️ No inactive listings found (no secondary sales yet)");
      return {
        sales: [],
        totalSales: 0,
        totalVolume: BigInt(0),
        totalRoyalties: BigInt(0),
        avgPrice: BigInt(0),
        avgRoyalty: BigInt(0),
      };
    }

    const totalVolume = sales.reduce(
      (sum, sale) => sum + sale.price,
      BigInt(0)
    );
    const totalRoyalties = sales.reduce(
      (sum, sale) => sum + sale.royaltyAmount,
      BigInt(0)
    );
    const avgPrice = totalVolume / BigInt(sales.length);
    const avgRoyalty = totalRoyalties / BigInt(sales.length);

    console.log("✅ Secondary Sales Found:");
    console.log("- Total sales:", sales.length);
    console.log("- Total volume:", totalVolume.toString());
    console.log("- Total royalties:", totalRoyalties.toString());
    console.log("- Avg price:", avgPrice.toString());
    console.log("- Avg royalty:", avgRoyalty.toString());
    console.log("- Sales details:", sales.map(s => ({
      listingId: s.listingId.toString(),
      tokenId: s.tokenId.toString(),
      price: s.price.toString(),
      royalty: s.royaltyAmount.toString(),
    })));

    return {
      sales,
      totalSales: sales.length,
      totalVolume,
      totalRoyalties,
      avgPrice,
      avgRoyalty,
    };
  }, [eventListings, event, eventId]);

  return {
    analytics,
    loading: eventLoading || listingsLoading,
    error: eventError || listingsError,
    refetch,
  };
}
