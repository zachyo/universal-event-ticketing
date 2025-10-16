import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ShoppingCart,
  Tag,
  TrendingUp,
  Calendar,
  MapPin,
} from "lucide-react";
import { useMarketplaceListings, useBuyTicket } from "../hooks/useContracts";
import { usePushWalletContext } from "@pushchain/ui-kit";
import { useAccount } from "wagmi";
import {
  formatListing,
  formatPrice,
  formatDateTime,
  formatAddress,
} from "../lib/formatters";
import type { FormattedListing } from "../types";

interface ListingCardProps {
  listing: FormattedListing;
  onBuy: (listingId: number) => void;
  isCurrentUser: boolean;
}

function ListingCard({ listing, onBuy, isCurrentUser }: ListingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Listing Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">
              {listing.ticket?.event?.name ||
                `Event #${listing.ticket?.eventId}`}
            </h3>
            <p className="text-sm text-gray-600">Ticket #{listing.tokenId}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(BigInt(listing.price))} PC
            </div>
            <div className="text-xs text-gray-500">
              Listed {listing.createdAt.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      {listing.ticket?.event && (
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{formatDateTime(listing.ticket.event.startTime)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{listing.ticket.event.venue}</span>
            </div>
          </div>
        </div>
      )}

      {/* Seller Info */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-500">Seller:</span>
            <span className="ml-2 font-mono">
              {formatAddress(listing.seller)}
            </span>
          </div>
          {isCurrentUser && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              Your Listing
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4">
        {!isCurrentUser ? (
          <button
            onClick={() => onBuy(listing.listingId)}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              isHovered
                ? "bg-green-600 text-white transform scale-105"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            <ShoppingCart className="w-4 h-4 inline mr-2" />
            Buy Now
          </button>
        ) : (
          <button
            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            disabled
          >
            Your Listing
          </button>
        )}
      </div>
    </div>
  );
}

function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="p-4 border-b">
        <div className="flex justify-between">
          <div>
            <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </div>
          <div>
            <div className="h-6 bg-gray-300 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      </div>
      <div className="p-4 border-b bg-gray-50">
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
      <div className="p-4 border-b">
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>
      <div className="p-4">
        <div className="h-8 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}

type SortOption = "price-low" | "price-high" | "newest" | "oldest";
type PriceFilter = "all" | "0-0.1" | "0.1-0.5" | "0.5+";

export const MarketplacePage = () => {
  const { connectionStatus } = usePushWalletContext();
  const { address } = useAccount();
  const { listings, loading, error, refetch } = useMarketplaceListings();
  const { buyTicket, isPending: isBuying } = useBuyTicket();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<PriceFilter>("all");

  // Filter and sort listings
  const filteredListings = useMemo<FormattedListing[]>(() => {
    if (!listings.length) return [];

    let formattedListings = listings.map((listing) => formatListing(listing));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      formattedListings = formattedListings.filter(
        (listing) =>
          listing.ticket?.event?.name.toLowerCase().includes(query) ||
          listing.ticket?.event?.venue.toLowerCase().includes(query) ||
          listing.tokenId.toString().includes(query)
      );
    }

    // Apply price range filter
    if (priceRange !== "all") {
      formattedListings = formattedListings.filter((listing) => {
        const pricePC = Number(listing.price) / 1e18;
        switch (priceRange) {
          case "0-0.1":
            return pricePC <= 0.1;
          case "0.1-0.5":
            return pricePC > 0.1 && pricePC <= 0.5;
          case "0.5+":
            return pricePC > 0.5;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    formattedListings.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "newest":
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return formattedListings;
  }, [listings, searchQuery, sortBy, priceRange]);

  const handleBuyTicket = async (listingId: number) => {
    if (connectionStatus !== "connected") {
      alert("Please connect your wallet to buy tickets");
      return;
    }

    const raw = listings.find((l) => Number(l.listingId) === listingId);
    if (!raw) {
      alert("Listing not found");
      return;
    }

    try {
      await buyTicket({ listingId: BigInt(listingId), price: raw.price });
      await refetch(); // Refresh listings
    } catch (error) {
      console.error("Failed to buy ticket:", error);
      alert("Failed to buy ticket. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <Tag className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Error Loading Marketplace
            </h3>
            <p>{error}</p>
          </div>
          <button
            onClick={refetch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Marketplace</h1>
        <p className="text-gray-600">
          Buy and sell tickets on the secondary market. All transactions are
          secure and verified on-chain.
        </p>
      </div>

      {/* Stats */}
      {!loading && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {listings.length}
            </div>
            <div className="text-sm text-gray-600">Active Listings</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {listings.length > 0
                ? formatPrice(
                    BigInt(Math.min(...listings.map((l) => Number(l.price))))
                  )
                : "0"}{" "}
              PC
            </div>
            <div className="text-sm text-gray-600">Lowest Price</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {listings.length > 0
                ? formatPrice(
                    BigInt(Math.max(...listings.map((l) => Number(l.price))))
                  )
                : "0"}{" "}
              PC
            </div>
            <div className="text-sm text-gray-600">Highest Price</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              <TrendingUp className="w-6 h-6 inline" />
            </div>
            <div className="text-sm text-gray-600">Trending</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-8">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search listings by event name, venue, or token ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Price:</span>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as PriceFilter)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Prices</option>
              <option value="0-0.1">0 - 0.1 ETH</option>
              <option value="0.1-0.5">0.1 - 0.5 ETH</option>
              <option value="0.5+">0.5+ ETH</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredListings.length} listing
            {filteredListings.length !== 1 ? "s" : ""} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.listingId}
              listing={listing}
              onBuy={handleBuyTicket}
              isCurrentUser={
                listing.seller.toLowerCase() === address?.toLowerCase()
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Listings Found
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? `No listings found matching "${searchQuery}"`
              : "There are no tickets listed for sale at the moment."}
          </p>
        </div>
      )}

      {/* Loading Overlay */}
      {isBuying && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Processing purchase...</p>
          </div>
        </div>
      )}
    </div>
  );
};
