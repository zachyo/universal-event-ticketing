import { useState, useMemo } from "react";
import { Search, Filter, Tag, TrendingUp } from "lucide-react";
import { useMarketplaceListings, useBuyTicket } from "../hooks/useContracts";
import { usePushWalletContext } from "@pushchain/ui-kit";
import { useAccount } from "wagmi";
import { formatListing, formatPrice } from "../lib/formatters";
import type { FormattedListing } from "../types";
import {
  ListingCard,
  ListingCardSkeleton,
  MakeOfferModal,
  OfferHistoryModal,
  MyOffersPanel,
} from "../components/marketplace";
import { ErrorDisplay } from "../components/ErrorDisplay";

type SortOption = "price-low" | "price-high" | "newest" | "oldest";
type PriceFilter = "all" | "0-0.1" | "0.1-0.5" | "0.5+";
type MarketplaceTab = "listings" | "my-offers";

export const MarketplacePage = () => {
  const { connectionStatus } = usePushWalletContext();
  const { address } = useAccount();
  const { listings, loading, error, refetch } = useMarketplaceListings();
  const { buyTicket, isPending: isBuying } = useBuyTicket();

  const [activeTab, setActiveTab] = useState<MarketplaceTab>("listings");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<PriceFilter>("all");
  const [showMakeOfferModal, setShowMakeOfferModal] = useState(false);
  const [showOfferHistoryModal, setShowOfferHistoryModal] = useState(false);
  const [selectedListing, setSelectedListing] =
    useState<FormattedListing | null>(null);

  // Get offer counts for all listings (simplified - in real app would batch this)
  const listingOfferCounts = useMemo(() => {
    const counts = new Map<number, number>();
    // For now, return empty counts - can be enhanced later
    return counts;
  }, []);

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

  const handleMakeOffer = (listing: FormattedListing) => {
    setSelectedListing(listing);
    setShowMakeOfferModal(true);
  };

  const handleViewOffers = (listing: FormattedListing) => {
    setSelectedListing(listing);
    setShowOfferHistoryModal(true);
  };

  const handleOfferSuccess = () => {
    setShowMakeOfferModal(false);
    setShowOfferHistoryModal(false);
    refetch();
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-12">
          <ErrorDisplay error={error} retry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
          Marketplace
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Buy and sell tickets on the secondary market. All transactions are
          secure and verified on-chain.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 md:mb-8 overflow-x-auto">
        <div className="flex gap-2 md:gap-4 min-w-max">
          <button
            onClick={() => setActiveTab("listings")}
            className={`px-3 md:px-4 py-2.5 md:py-2 font-medium transition-colors relative text-sm md:text-base touch-manipulation ${
              activeTab === "listings"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Listings
          </button>
          <button
            onClick={() => setActiveTab("my-offers")}
            className={`px-3 md:px-4 py-2.5 md:py-2 font-medium transition-colors relative text-sm md:text-base touch-manipulation ${
              activeTab === "my-offers"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Offers
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "my-offers" ? (
        <MyOffersPanel />
      ) : (
        <>
          {/* Stats */}
          {!loading && listings.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600">
                  {listings.length}
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Active Listings
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {listings.length > 0
                    ? formatPrice(
                        BigInt(
                          Math.min(...listings.map((l) => Number(l.price)))
                        )
                      )
                    : "0"}{" "}
                  PC
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Lowest Price
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-bold text-purple-600">
                  {" "}
                  {listings.length > 0
                    ? formatPrice(
                        BigInt(
                          Math.max(...listings.map((l) => Number(l.price)))
                        )
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
                <span className="text-sm font-medium text-gray-700">
                  Filters:
                </span>
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
                  onMakeOffer={handleMakeOffer}
                  onViewOffers={handleViewOffers}
                  isCurrentUser={
                    listing.seller.toLowerCase() === address?.toLowerCase()
                  }
                  offerCount={
                    listingOfferCounts.get(Number(listing.tokenId)) || 0
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
        </>
      )}

      {/* Modals */}
      {selectedListing && (
        <>
          <MakeOfferModal
            isOpen={showMakeOfferModal}
            onClose={() => {
              setShowMakeOfferModal(false);
              setSelectedListing(null);
            }}
            tokenId={BigInt(selectedListing.tokenId)}
            ticketInfo={{
              eventName:
                selectedListing.ticket?.event?.name ||
                `Event #${selectedListing.ticket?.eventId}`,
              ticketTypeName: `Ticket #${selectedListing.tokenId}`,
              currentPrice: BigInt(selectedListing.price),
            }}
            onSuccess={handleOfferSuccess}
          />

          <OfferHistoryModal
            isOpen={showOfferHistoryModal}
            onClose={() => {
              setShowOfferHistoryModal(false);
              setSelectedListing(null);
            }}
            listing={selectedListing}
            onOfferAccepted={handleOfferSuccess}
          />
        </>
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
