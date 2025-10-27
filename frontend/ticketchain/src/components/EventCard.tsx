import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Ticket,
} from "lucide-react";
import type { FormattedEvent } from "../types";
import type { EventWithTicketTypes } from "../hooks/useEventsWithTicketTypes";
import {
  formatDateTime,
  formatAvailability,
  getTimeUntilEvent,
  getEventStatus,
  formatPriceInCurrency,
} from "../lib/formatters";

interface EventCardProps {
  event: FormattedEvent | EventWithTicketTypes;
  showPurchaseButton?: boolean;
}

function hasTicketTypes(
  event: FormattedEvent | EventWithTicketTypes
): event is EventWithTicketTypes {
  return "ticketTypes" in event && "minPrice" in event;
}

const statusStyles: Record<ReturnType<typeof getEventStatus>, string> = {
  live: "border-emerald-300 bg-emerald-400/20 text-emerald-50",
  upcoming: "border-primary/40 bg-primary/15 text-primary",
  ended: "border-zinc-300 bg-zinc-500/20 text-zinc-50",
  inactive: "border-rose-300 bg-rose-400/20 text-rose-50",
};

export function EventCard({
  event,
  showPurchaseButton = true,
}: EventCardProps) {
  const status = getEventStatus(event);
  const timeUntil = getTimeUntilEvent(event.startTime);
  const availability = formatAvailability(event.sold, event.totalSupply);

  const isSoldOut = event.sold >= event.totalSupply;
  const isAlmostSoldOut = event.sold > event.totalSupply * 0.8 && !isSoldOut;
  const isPopular = event.sold > 50;

  const eventWithTypes = hasTicketTypes(event) ? event : null;
  const minPrice = eventWithTypes?.minPrice;
  const ticketTypeCount = eventWithTypes?.ticketTypeCount || 0;
  const hasMultipleTiers = eventWithTypes?.hasMultipleTiers || false;

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-4 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-48 overflow-hidden rounded-[1.8rem]">
        <img
          src={event.imageUrl || "/placeholder-event.jpg"}
          alt={event.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder-event.jpg";
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-black/35" />

        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusStyles[status]}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          {isSoldOut && (
            <span className="rounded-full border border-rose-300 bg-rose-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-100">
              Sold Out
            </span>
          )}
        </div>
      </div>

      <div className="p-4 pt-6">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold leading-tight text-foreground line-clamp-2">
            {event.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        </div>

        <div className="mt-5 space-y-2 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{formatDateTime(event.startTime)}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>{availability}</span>
          </div>
          {status === "upcoming" && (
            <div className="inline-flex items-center gap-2 text-primary">
              <Clock className="h-4 w-4" />
              <span>{timeUntil}</span>
            </div>
          )}
        </div>

        {minPrice !== null && minPrice !== undefined && minPrice > 0 && (
          <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 px-5 py-4">
            <div className="flex flex-col items-start justify-between gap-3">
              <div className="flex justify-between items-center w-full flex-wrap gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Starting from
                </p>
                <p className="text-2xl font-semibold text-primary">
                  {formatPriceInCurrency(BigInt(minPrice), "PC")}
                </p>
              </div>
              {hasMultipleTiers && ticketTypeCount > 1 && (
                <div className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Ticket className="h-3.5 w-3.5" />
                  <span>{ticketTypeCount} tiers</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(isAlmostSoldOut || isPopular) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {isAlmostSoldOut && (
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-500">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Almost Sold Out</span>
              </div>
            )}
            {isPopular && (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-500">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{event.sold} tickets sold</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 text-xs text-muted-foreground">
          Organized by {event.organizer.slice(0, 6)}…
          {event.organizer.slice(-4)}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Link
            to={`/events/${event.eventId}`}
            className="text-sm font-semibold text-primary transition hover:text-accent"
          >
            View Details →
          </Link>

          {showPurchaseButton && status === "upcoming" && !isSoldOut && (
            <Link
              to={`/events/${event.eventId}`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Get Tickets
            </Link>
          )}

          {isSoldOut && (
            <span className="text-sm font-semibold text-destructive">
              Sold Out
            </span>
          )}
          {status === "ended" && (
            <span className="text-sm font-semibold text-muted-foreground">
              Event Ended
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="glass-card rounded-[2rem] border border-border bg-card p-4 shadow-sm">
      <div className="h-48 rounded-[1.8rem] bg-border/50" />
      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-3/4 rounded bg-border/50" />
          <div className="h-4 w-full rounded bg-border/50" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-1/2 rounded bg-border/50" />
          <div className="h-3.5 w-2/3 rounded bg-border/50" />
          <div className="h-3.5 w-1/3 rounded bg-border/50" />
        </div>
        <div className="h-3 w-1/4 rounded bg-border/50" />
        <div className="h-9 w-full rounded-full bg-border/40" />
      </div>
    </div>
  );
}

export function EventGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  );
}

export function EventsEmptyState({
  message = "No events found",
}: {
  message?: string;
}) {
  return (
    <div className="glass-card mx-auto max-w-xl rounded-[2rem] border border-border bg-card px-6 py-12 text-center">
      <Calendar className="mx-auto mb-4 h-14 w-14 text-primary" />
      <h3 className="text-xl font-semibold text-foreground">No events</h3>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
