import { useMemo } from "react";
import { Store, TrendingUp, Clock } from "lucide-react";
import { useBuyTicket } from "../../hooks/useContracts";
import { useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS, TicketMarketplaceABI } from "../../lib/contracts";
import { formatPrice } from "../../lib/formatters";
import type { Listing } from "../../types";
import { ListingCardSkeleton } from "../marketplace";
import { EmptyState } from "../EmptyState";
import { ErrorDisplay } from "../ErrorDisplay";
import { usePushWalletContext } from "@pushchain/ui-kit";
import { useAccount } from "wagmi";

// Simplified listing type for this component
interface SimpleFormattedListing {
  listingId: number;
  tokenId: number;
  seller: string;
  price: number;
  active: boolean;
  createdAt: Date;
  event?: {
    name?: string;
    venue?: string;
    startTime?: Date;
  };
}

interface MarketplaceSectionProps {
  eventId: number;
}

/**
 * MarketplaceSection component displays available resale tickets for a specific event
 *
 * Features:
 * - Filters marketplace listings by event ID
 * - Shows lowest price available
 * - Displays listing cards with buy functionality
 * - Empty state when no resale tickets available
 * - Error handling with retry
 */
export function MarketplaceSection({ eventId }: MarketplaceSectionProps) {
  // Use getListingsByEvent instead of getActiveListings for better performance
  const { data, isLoading, error, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI,
    functionName: "getListingsByEvent",
    args: [BigInt(eventId)],
  });

  const listings = useMemo(() => (data as Listing[] | undefined) || [], [data]);

  const { buyTicket } = useBuyTicket();
  const { connectionStatus } = usePushWalletContext();
  const { address } = useAccount();

  console.log("[MarketplaceSection] Event ID:", eventId);
  console.log("[MarketplaceSection] Listings for this event:", listings);

  // Format and sort listings
  const eventListings = useMemo((): SimpleFormattedListing[] => {
    if (!listings || listings.length === 0) {
      console.log(
        "[MarketplaceSection] No listings found for eventId:",
        eventId
      );
      return [];
    }

    const formatted = listings
      .filter((listing) => listing.active)
      .map((listing) => ({
        listingId: Number(listing.listingId),
        tokenId: Number(listing.tokenId),
        seller: listing.seller,
        price: Number(listing.price),
        active: listing.active,
        createdAt: new Date(Number(listing.createdAt) * 1000),
      }))
      .sort((a, b) => a.price - b.price);

    console.log("[MarketplaceSection] Formatted listings:", formatted);
    return formatted;
  }, [listings, eventId]);

  // Get lowest price
  const lowestPrice = useMemo(() => {
    if (eventListings.length === 0) return null;
    return eventListings[0].price;
  }, [eventListings]);

  // Get total available tickets
  const totalAvailable = eventListings.length;

  // Handler for buying tickets
  const handleBuyTicket = async (listingId: number) => {
    if (connectionStatus !== "connected") {
      alert("Please connect your wallet to buy tickets");
      return;
    }

    const rawListing = listings?.find((l) => Number(l.listingId) === listingId);
    if (!rawListing) {
      alert("Listing not found");
      return;
    }

    try {
      await buyTicket({
        listingId: BigInt(listingId),
        price: rawListing.price,
      });
      await refetch(); // Refresh listings
    } catch (error) {
      console.error("Failed to buy ticket:", error);
      // Error is already shown via toast from the hook
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Store className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold">Secondary Market</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Store className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold">Secondary Market</h3>
        </div>

        <ErrorDisplay error={error} retry={refetch} compact />
      </div>
    );
  }

  if (eventListings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Store className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold">Secondary Market</h3>
        </div>

        <EmptyState
          icon={Store}
          title="No Resale Tickets Available"
          message="There are currently no tickets listed for resale for this event. Check back later or purchase directly from the event."
          className="py-8"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold">Secondary Market</h3>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>
              {totalAvailable} {totalAvailable === 1 ? "ticket" : "tickets"}{" "}
              available
            </span>
          </div>
        </div>
      </div>

      {/* Market Stats */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-purple-600 font-medium mb-1">
              Lowest Price
            </p>
            <p className="text-2xl font-bold text-purple-900">
              {lowestPrice ? `${formatPrice(lowestPrice)} PC` : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-purple-600 font-medium mb-1">
              Available Tickets
            </p>
            <p className="text-2xl font-bold text-purple-900">
              {totalAvailable}
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Buying from Secondary Market</p>
          <p className="text-blue-700">
            These tickets are being resold by other attendees. Prices may differ
            from the original ticket price. All transactions are secure and
            verified on-chain.
          </p>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventListings.map((listing) => (
          <div
            key={listing.listingId}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {/* Listing Header */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg line-clamp-1">
                    Ticket #{listing.tokenId}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Listing #{listing.listingId}
                  </p>
                </div>
                <div className="text-right ml-3">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(BigInt(listing.price))} PC
                  </div>
                  <div className="text-xs text-gray-500">
                    Listed {listing.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-500">Seller:</span>
                  <span className="ml-2 font-mono text-xs">
                    {listing.seller.substring(0, 6)}...
                    {listing.seller.substring(38)}
                  </span>
                </div>
                {listing.seller.toLowerCase() === address?.toLowerCase() && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
                    Your Listing
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4">
              {listing.seller.toLowerCase() !== address?.toLowerCase() ? (
                <button
                  onClick={() => handleBuyTicket(listing.listingId)}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Buy Now
                </button>
              ) : (
                <button
                  className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium"
                  disabled
                >
                  Your Listing
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Want to sell your ticket?{" "}
          <a
            href="/tickets"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            List it on the marketplace
          </a>
        </p>
      </div>
    </div>
  );
}
