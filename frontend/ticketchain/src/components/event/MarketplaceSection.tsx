import { useMemo, useState } from "react";
import {
  Store,
  TrendingUp,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useBuyTicket } from "../../hooks/useContracts";
import { useReadContract } from "wagmi";
import {
  MARKETPLACE_ADDRESS,
  TicketMarketplaceABI,
  TICKET_NFT_ADDRESS,
  TicketNFTABI,
} from "../../lib/contracts";
import { formatPrice, formatAddress } from "../../lib/formatters";
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

interface TicketMetadata {
  eventId: bigint;
  ticketTypeId: bigint;
  originalOwner: string;
  purchasePrice: bigint;
  purchaseChain: string;
  used: boolean;
  qrCodeHash: string;
}

/**
 * TicketDetailsModal - Shows detailed ticket information
 */
function TicketDetailsModal({
  tokenId,
  onClose,
}: {
  tokenId: number;
  onClose: () => void;
}) {
  // Fetch ticket metadata from contract
  const { data: ticketData } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "ticketDetails",
    args: [BigInt(tokenId)],
  });

  // Fetch token URI for image
  const { data: tokenURI } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
  });

  const metadata = ticketData as TicketMetadata | undefined;
  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Parse token URI to get image
  useMemo(() => {
    if (tokenURI && typeof tokenURI === "string") {
      // If it's an IPFS URI, convert to HTTP gateway
      if (tokenURI.startsWith("ipfs://")) {
        const ipfsHash = tokenURI.replace("ipfs://", "");
        setImageUrl(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      } else {
        setImageUrl(tokenURI);
      }
    }
  }, [tokenURI]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Ticket #{tokenId}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {metadata && (
            <div className="space-y-4">
              {/* NFT Image Toggle */}
              {imageUrl && (
                <div className="border-b pb-4">
                  <button
                    onClick={() => setShowImage(!showImage)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-3"
                  >
                    <ImageIcon className="w-5 h-5" />
                    {showImage ? "Hide NFT Image" : "View NFT Image"}
                  </button>

                  {showImage && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={`Ticket #${tokenId}`}
                        className="w-full h-auto"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-event.jpg";
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Ticket Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Event</p>
                  <Link
                    to={`/events/${metadata.eventId.toString()}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                  >
                    Event #{metadata.eventId.toString()}
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Ticket Type ID</p>
                  <p className="font-semibold">
                    #{metadata.ticketTypeId.toString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">
                    Original Purchase Price
                  </p>
                  <p className="font-semibold">
                    {formatPrice(metadata.purchasePrice)} PC
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Purchase Chain</p>
                  <p className="font-semibold">
                    {metadata.purchaseChain || "Push Chain"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p
                    className={`font-semibold ${
                      metadata.used ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {metadata.used ? "Used" : "Valid"}
                  </p>
                </div>
              </div>

              {/* Original Owner */}
              {metadata.originalOwner &&
                metadata.originalOwner !==
                  "0x0000000000000000000000000000000000000000" && (
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-2">
                      <User className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Original Owner
                        </p>
                        <p className="font-mono text-sm break-all">
                          {formatAddress(metadata.originalOwner)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          This is the first person who purchased this ticket
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> All ticket data is stored on-chain and
                  cannot be tampered with. The NFT image and metadata are stored
                  on IPFS for permanent availability.
                </p>
              </div>
            </div>
          )}

          {!metadata && (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading ticket details...</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

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
            <div className="p-4 space-y-2">
              {/* View Ticket Details Button */}
              <button
                onClick={() => setSelectedTicketId(listing.tokenId)}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Ticket Details
              </button>

              {/* Buy/Your Listing Button */}
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

      {/* Ticket Details Modal */}
      {selectedTicketId !== null && (
        <TicketDetailsModal
          tokenId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}

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
