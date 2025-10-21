import { useState } from "react";
import {
  ShoppingCart,
  Tag,
  Calendar,
  MapPin,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import {
  formatPrice,
  formatDateTime,
  formatAddress,
} from "../../lib/formatters";
import type { FormattedListing } from "../../types";

interface ListingCardProps {
  listing: FormattedListing;
  onBuy: (listingId: number) => void;
  onMakeOffer?: (listing: FormattedListing) => void;
  onViewOffers?: (listing: FormattedListing) => void;
  isCurrentUser: boolean;
  offerCount?: number;
}

export function ListingCard({
  listing,
  onBuy,
  onMakeOffer,
  onViewOffers,
  isCurrentUser,
  offerCount = 0,
}: ListingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="glass-card rounded-[1.75rem] border border-border bg-card p-5 shadow-sm transition-transform duration-500 hover:-translate-y-1 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Ticket #{listing.tokenId}
          </p>
          <h3 className="text-lg font-semibold text-foreground">
            {listing.ticket?.event?.name || `Listing #${listing.listingId}`}
          </h3>
          {listing.ticket?.event?.venue && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{listing.ticket.event.venue}</span>
            </div>
          )}
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

      {listing.ticket?.event?.startTime && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{formatDateTime(listing.ticket.event.startTime)}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-mono text-sm text-foreground/80">
          {formatAddress(listing.seller)}
        </span>
        {isCurrentUser && (
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Your listing
          </span>
        )}
      </div>

      {offerCount > 0 && (
        <button
          onClick={() => onViewOffers?.(listing)}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {offerCount} Active Offer{offerCount === 1 ? "" : "s"}
          {isCurrentUser && <TrendingUp className="h-3 w-3 text-primary" />}
        </button>
      )}

      <div className="mt-6 space-y-2">
        {isCurrentUser ? (
          <button
            disabled
            className="w-full rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-semibold text-muted-foreground"
          >
            Listed by you
          </button>
        ) : (
          <button
            onClick={() => onBuy(listing.listingId)}
            className={`w-full rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground transition ${
              isHovered
                ? "scale-[1.02] bg-primary shadow-md"
                : "bg-primary shadow-sm"
            } hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary`}
          >
            <ShoppingCart className="mr-2 inline h-4 w-4" />
            Buy now
          </button>
        )}

        {onMakeOffer && !isCurrentUser && (
          <button
            onClick={() => onMakeOffer(listing)}
            className="w-full rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <Tag className="mr-2 inline h-4 w-4" />
            Make an offer
          </button>
        )}
      </div>
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="glass-card rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
      <div className="h-28 rounded-2xl bg-border/50" />
      <div className="mt-4 space-y-3">
        <div className="h-4 w-2/3 rounded bg-border/50" />
        <div className="h-3.5 w-1/2 rounded bg-border/50" />
        <div className="h-3.5 w-1/3 rounded bg-border/50" />
      </div>
      <div className="mt-4 h-8 w-full rounded-full bg-border/40" />
      <div className="mt-2 h-8 w-full rounded-full bg-border/40" />
    </div>
  );
}
