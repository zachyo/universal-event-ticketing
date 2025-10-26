import { useMemo, useState, useEffect } from "react";
import { Store, Clock, ShieldCheck, ExternalLink, X } from "lucide-react";
import { useBuyTicket, useCancelListing } from "../../hooks/useContracts";
import { useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS, TicketMarketplaceABI } from "../../lib/contracts";
import { formatPrice } from "../../lib/formatters";
import type { Listing } from "../../types";
import { ListingCardSkeleton } from "../marketplace";
import { EmptyState } from "../EmptyState";
import { ErrorDisplay } from "../ErrorDisplay";
import { usePushWalletContext, usePushChain } from "@pushchain/ui-kit";
import { useAccount } from "wagmi";
import { TicketDetailsModal } from "../TicketDetailsModal";

interface SimpleFormattedListing {
  listingId: number;
  tokenId: number;
  seller: string;
  price: number;
  active: boolean;
  createdAt: Date;
}

interface MarketplaceSectionProps {
  eventId: number;
}

export function MarketplaceSection({ eventId }: MarketplaceSectionProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [cancelConfirmListingId, setCancelConfirmListingId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI,
    functionName: "getListingsByEvent",
    args: [BigInt(eventId)],
  });

  const listings = useMemo(() => (data as Listing[] | undefined) || [], [data]);

  const { buyTicket } = useBuyTicket();
  const { cancelListing, isPending: isCanceling } = useCancelListing();
  const { connectionStatus, universalAccount } = usePushWalletContext();
  const { PushChain } = usePushChain();
  const { address } = useAccount();

  // Resolve UEA for current user
  const [userUEA, setUserUEA] = useState<string | null>(null);

  useEffect(() => {
    const resolveUEA = async () => {
      if (!universalAccount || !PushChain) {
        setUserUEA(address?.toLowerCase() || null);
        return;
      }

      try {
        const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
          universalAccount,
          { onlyCompute: true }
        );
        setUserUEA(executorInfo.address.toLowerCase());
      } catch (error) {
        console.error("Failed to resolve UEA:", error);
        setUserUEA(address?.toLowerCase() || null);
      }
    };

    resolveUEA();
  }, [universalAccount, PushChain, address]);

  const eventListings = useMemo<SimpleFormattedListing[]>(() => {
    if (!listings.length) {
      return [];
    }

    return listings
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
  }, [listings]);

  const lowestPrice = useMemo(() => {
    if (!eventListings.length) return null;
    return eventListings[0].price;
  }, [eventListings]);

  const totalAvailable = eventListings.length;

  const handleBuyTicket = async (listingId: number) => {
    if (connectionStatus !== "connected") {
      alert("Please connect your wallet to buy tickets");
      return;
    }

    const rawListing = listings.find((listing) => Number(listing.listingId) === listingId);
    if (!rawListing) {
      alert("Listing not found");
      return;
    }

    try {
      await buyTicket({
        listingId: BigInt(listingId),
        price: rawListing.price,
      });
      await refetch();
    } catch (buyError) {
      console.error("Failed to buy ticket:", buyError);
    }
  };

  const handleCancelListing = async (listingId: number) => {
    try {
      await cancelListing(listingId);
      await refetch();
      setCancelConfirmListingId(null);
    } catch (error) {
      console.error("Failed to cancel listing:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-[2rem] border border-border bg-card p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Secondary Market
            </h3>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Live resale listings
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-[2rem] border border-border bg-card p-6 md:p-8">
        <ErrorDisplay error={error} retry={refetch} compact />
      </div>
    );
  }

  if (!eventListings.length) {
    return (
      <div className="glass-card rounded-[2rem] border border-border bg-card p-6 md:p-8">
        <EmptyState
          icon={Store}
          title="No resale tickets"
          message="No one is reselling tickets for this event yet. Check back soon or grab one directly from the organizer."
          className="py-6"
        />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[2rem] border border-border bg-card p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground md:text-xl">
              Secondary Market
            </h3>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Community-powered resale hub
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Escrow protected</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lowest price
          </p>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {lowestPrice ? `${formatPrice(lowestPrice)} PC` : "N/A"}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tickets available
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {totalAvailable}
          </p>
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-border bg-secondary/60 p-4 text-sm text-foreground">
        <Clock className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <p className="font-semibold tracking-wide">
            Buying from fans, verified on-chain
          </p>
          <p className="text-xs text-muted-foreground">
            Each resale ticket keeps full Push Chain provenance. Organizers automatically earn royalties, and buyers receive instant settlement.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {eventListings.map((listing) => {
          const isCurrentUser =
            userUEA && listing.seller.toLowerCase() === userUEA;

          return (
            <div
              key={listing.listingId}
              className="glass-card rounded-[1.75rem] border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Ticket #{listing.tokenId}
                  </p>
                  <h4 className="mt-1 text-lg font-semibold text-foreground">
                    Listing #{listing.listingId}
                  </h4>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-primary">
                    {formatPrice(BigInt(listing.price))} PC
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Listed {listing.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="font-mono text-sm text-foreground/80">
                  {listing.seller.substring(0, 6)}…
                  {listing.seller.substring(listing.seller.length - 4)}
                </span>
                {isCurrentUser && (
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Your listing
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  onClick={() => setSelectedTicketId(listing.tokenId)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                  View ticket details
                </button>

                {isCurrentUser ? (
                  <button
                    onClick={() => setCancelConfirmListingId(listing.listingId)}
                    disabled={isCanceling}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-destructive/60 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    Cancel listing
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuyTicket(listing.listingId)}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    Secure ticket
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTicketId !== null && (
        <TicketDetailsModal
          tokenId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelConfirmListingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-[1.75rem] border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Cancel this listing?
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Your ticket will be returned to your wallet and removed from the marketplace.
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCancelConfirmListingId(null)}
                disabled={isCanceling}
                className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                Keep listing
              </button>
              <button
                onClick={() => handleCancelListing(cancelConfirmListingId)}
                disabled={isCanceling}
                className="flex-1 rounded-full bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCanceling ? "Canceling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
        Want to resell your seat?{
        " "
        }
        <a
          href="/my-tickets"
          className="font-semibold text-primary transition hover:text-accent"
        >
          list it from My Tickets
        </a>
        .
      </div>
    </div>
  );
}
