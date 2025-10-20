import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Tag,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Calendar,
  MapPin,
} from "lucide-react";
import { useMarketplaceListings, useBuyTicket } from "../hooks/useContracts";
import { usePushWalletContext } from "@pushchain/ui-kit";
import { useAccount } from "wagmi";
import { formatListing, formatPrice } from "../lib/formatters";
import type { FormattedListing } from "../types";
import { ListingCardSkeleton } from "../components/marketplace";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { TicketDetailsModal } from "../components/TicketDetailsModal";
import { cn } from "../utils/cn";

type SortOption = "price-low" | "price-high" | "newest" | "oldest";
type PriceFilter = "all" | "0-0.1" | "0.1-0.5" | "0.5+";

export const MarketplacePage = () => {
  const { connectionStatus } = usePushWalletContext();
  const { address } = useAccount();
  const { listings, loading, error, refetch } = useMarketplaceListings();
  const { buyTicket } = useBuyTicket();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<PriceFilter>("all");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const priceFilters: Array<{ value: PriceFilter; label: string }> = [
    { value: "all", label: "All Prices" },
    { value: "0-0.1", label: "0 - 0.1 PC" },
    { value: "0.1-0.5", label: "0.1 - 0.5 PC" },
    { value: "0.5+", label: "0.5+ PC" },
  ];

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const lowestPrice =
    listings.length > 0
      ? formatPrice(
          BigInt(Math.min(...listings.map((listing) => Number(listing.price))))
        )
      : null;

  const highestPrice =
    listings.length > 0
      ? formatPrice(
          BigInt(Math.max(...listings.map((listing) => Number(listing.price))))
        )
      : null;

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
      <div className="container px-4 py-16">
        <div className="glass-card rounded-[2.25rem] border border-border/70 bg-card/85 p-10">
          <ErrorDisplay error={error} retry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4">
      <div className="space-y-8">
        <section className="glass-card rounded-[2.25rem] border border-border/70 bg-card/85 px-6 py-6 md:px-9 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary">
                Secondary Market
              </div>
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                Own the night, resell the hype.
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Discover premium tickets from verified organizers and trusted
                fans. Every sale is on-chain, royalty-aware, and blazing fast
                across Push Chain ecosystems.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-gradient-to-r from-primary via-primary to-accent px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-20px_rgba(196,73,255,0.75)] transition hover:shadow-[0_18px_48px_-18px_rgba(196,73,255,0.85)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  isRefreshing && "animate-spin"
                )}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Listings"}
            </button>
          </div>

          {!loading && listings.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-border/60 bg-card/70 px-5 py-4 text-sm shadow-[0_14px_36px_-22px_rgba(129,54,255,0.55)]">
                <span className="text-muted-foreground">Active Listings</span>
                <div className="mt-2 text-2xl font-semibold text-foreground">
                  {listings.length}
                </div>
              </div>
              <div className="rounded-3xl border border-border/60 bg-card/70 px-5 py-4 text-sm shadow-[0_14px_36px_-22px_rgba(129,54,255,0.55)]">
                <span className="text-muted-foreground">Floor Price</span>
                <div className="mt-2 text-2xl font-semibold text-primary">
                  {lowestPrice ? `${lowestPrice} PC` : "--"}
                </div>
              </div>
              <div className="rounded-3xl border border-border/60 bg-card/70 px-5 py-4 text-sm shadow-[0_14px_36px_-22px_rgba(129,54,255,0.55)]">
                <span className="text-muted-foreground">Top Listing</span>
                <div className="mt-2 text-2xl font-semibold text-foreground">
                  {highestPrice ? `${highestPrice} PC` : "--"}
                </div>
              </div>
              <div className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 via-transparent to-accent/20 px-5 py-4 text-sm text-white shadow-[0_20px_40px_-24px_rgba(196,73,255,0.7)]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Trending Collection</span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-wider text-white/70">
                  {filteredListings[0]?.ticket?.event?.name ??
                    "Minted for discovery"}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="glass-card rounded-[2rem] border border-border/70 bg-card/85 px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event, venue, or token ID..."
                className="w-full rounded-full border border-transparent bg-background/75 px-12 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Filter className="h-4 w-4 text-primary" />
                Filters
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sort
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {priceFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setPriceRange(filter.value)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all",
                  priceRange === filter.value
                    ? "bg-gradient-to-r from-primary via-primary to-accent text-white shadow-[0_12px_30px_-18px_rgba(196,73,255,0.75)]"
                    : "border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {!loading && (
          <div className="rounded-[1.75rem] border border-border/60 bg-secondary/60 px-6 py-5 text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">
              {filteredListings.length}
            </span>{" "}
            listing{filteredListings.length !== 1 ? "s" : ""} available
            {searchQuery && (
              <>
                {" "}
                for <span className="text-foreground">"{searchQuery}"</span>
              </>
            )}
          </div>
        )}

        <section className="relative">
          <div className="absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-primary/12 via-transparent to-transparent blur-3xl" />
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ListingCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => {
                const isCurrentUser =
                  listing.seller.toLowerCase() === address?.toLowerCase();

                return (
                  <div
                    key={listing.listingId}
                    className="glass-card rounded-[1.75rem] border border-border/70 bg-card/85 p-6 shadow-[0_20px_60px_-28px_rgba(129,54,255,0.55)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Ticket #{listing.tokenId}
                        </p>
                        <h3 className="text-xl font-semibold text-foreground line-clamp-2">
                          {listing.ticket?.event?.name ??
                            `Event #${listing.ticket?.eventId ?? listing.listingId}`}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Listing #{listing.listingId}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-primary">
                          {formatPrice(BigInt(listing.price))} PC
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Listed {listing.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {listing.ticket?.event && (
                      <div className="mt-5 space-y-2 rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>
                            {listing.ticket.event.startTime
                              ? listing.ticket.event.startTime.toLocaleString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "Date TBA"}
                          </span>
                        </div>
                        {listing.ticket.event.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-accent" />
                            <span>{listing.ticket.event.venue}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary" />
                          <span>
                            Minted{" "}
                            {listing.createdAt.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                      <div className="font-mono text-sm text-foreground/80">
                        {listing.seller.substring(0, 6)}…
                        {listing.seller.substring(
                          listing.seller.length - 4,
                          listing.seller.length
                        )}
                      </div>
                      {isCurrentUser && (
                        <span className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                          Your listing
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedTicketId(listing.tokenId)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Ticket Details
                      </button>
                      {isCurrentUser ? (
                        <button
                          disabled
                          className="rounded-full border border-border/60 bg-background/60 px-4 py-2.5 text-sm font-semibold text-muted-foreground"
                        >
                          Your listing
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyTicket(listing.listingId)}
                          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary via-primary to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_36px_-20px_rgba(196,73,255,0.8)] transition hover:shadow-[0_18px_42px_-18px_rgba(196,73,255,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          Secure Ticket
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card relative rounded-[2.25rem] border border-border/70 bg-card/85 px-6 py-16 text-center">
              <Tag className="mx-auto h-12 w-12 text-primary" />
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                Marketplace is warming up
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? `No listings matched “${searchQuery}”. Try adjusting your filters or explore other chains.`
                  : "There are no resale tickets live right now. Check back shortly or launch your own listing."}
              </p>
            </div>
          )}
        </section>
      </div>

      {selectedTicketId !== null && (
        <TicketDetailsModal
          tokenId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  );
};
