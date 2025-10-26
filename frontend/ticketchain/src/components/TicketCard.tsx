import { useEffect, useMemo, useState } from "react";
import {
  QrCode,
  ExternalLink,
  Tag,
  Ticket,
  ShieldCheck,
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { FormattedTicket } from "../types";
import {
  formatEvent,
  formatDateTime,
  formatPriceWithCurrency,
  getEventStatus,
} from "../lib/formatters";
import { QRCodeDisplay } from "./QRCodeDisplay";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "./ui/dialog";
import { useGetEvent, useTicketTypes } from "../hooks/useContracts";
import { getTierImageUrl } from "../lib/tierImageUtils";

interface TicketCardProps {
  ticket: FormattedTicket;
  showQR?: boolean;
  showListButton?: boolean;
  onList?: (tokenId: number) => void;
  onViewQR?: (ticket: FormattedTicket) => void;
  showListingBadge?: boolean;
  isListed?: boolean;
}

export function TicketCard({
  ticket,
  showQR = true,
  showListButton = true,
  onList,
  onViewQR,
  showListingBadge = false,
  isListed = false,
}: TicketCardProps) {
  const [showQRCode, setShowQRCode] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const hasValidEventId = Number.isFinite(ticket.eventId) && ticket.eventId > 0;
  const {
    event: fetchedEvent,
    isLoading: isDialogEventLoading,
    error: dialogEventError,
    refetch: refetchDialogEvent,
  } = useGetEvent(ticket.eventId, {
    enabled: isDetailsOpen && hasValidEventId,
  });

  // Fetch ticket types to get tier-specific image
  const { ticketTypes } = useTicketTypes(ticket.eventId, {
    enabled: hasValidEventId,
  });

  useEffect(() => {
    if (isDetailsOpen && hasValidEventId) {
      void refetchDialogEvent();
    }
  }, [hasValidEventId, isDetailsOpen, refetchDialogEvent]);

  const formattedFetchedEvent = useMemo(
    () => (fetchedEvent ? formatEvent(fetchedEvent) : undefined),
    [fetchedEvent]
  );

  const primaryEvent = useMemo(
    () => formattedFetchedEvent ?? ticket.event,
    [formattedFetchedEvent, ticket.event]
  );

  const dialogErrorMessage = useMemo(() => {
    if (!dialogEventError) return null;
    if (dialogEventError instanceof Error) return dialogEventError.message;
    return String(dialogEventError);
  }, [dialogEventError]);

  const eventStatus = useMemo(() => {
    if (!primaryEvent) return null;
    return getEventStatus(primaryEvent);
  }, [primaryEvent]);

  // Get tier-specific image
  const tierImage = useMemo(() => {
    const tierType = ticketTypes?.find(
      (tt) => tt.ticketTypeId === BigInt(ticket.ticketTypeId)
    );
    return getTierImageUrl(
      tierType?.imageIpfsHash,
      primaryEvent?.imageIpfsHash,
      primaryEvent?.imageUrl
    );
  }, [ticketTypes, ticket.ticketTypeId, primaryEvent]);

  // Get tier name
  const tierName = useMemo(() => {
    const tierType = ticketTypes?.find(
      (tt) => tt.ticketTypeId === BigInt(ticket.ticketTypeId)
    );
    return tierType?.name || `Tier #${ticket.ticketTypeId}`;
  }, [ticketTypes, ticket.ticketTypeId]);

  const statusStyles: Record<
    NonNullable<typeof eventStatus>,
    { label: string; className: string }
  > = {
    upcoming: {
      label: "Upcoming",
      className: "bg-primary/10 text-primary border border-primary/30",
    },
    live: {
      label: "Live Now",
      className: "bg-green-100 text-green-800 border border-green-200",
    },
    ended: {
      label: "Completed",
      className: "bg-gray-200 text-gray-700 border border-gray-300",
    },
    inactive: {
      label: "Inactive",
      className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    },
  };

  const shouldShowQRCodeSection = showQRCode && ticket.ticketStatus !== "used";
  const shouldShowUsedNotice = ticket.ticketStatus === "used";
  const hasCardBodyContent = shouldShowQRCodeSection || shouldShowUsedNotice;
  const formattedPurchasePrice = formatPriceWithCurrency(ticket.purchasePrice);
  const purchaseChainLabel = useMemo(() => {
    const meta = ticket.purchaseChainMeta;

    if (meta) {
      const name = meta.name ?? "Unknown Network";
      const symbol = meta.symbol ?? "";
      const isTestnet = (meta as { testnet?: boolean }).testnet ?? false;
      const baseLabel = isTestnet ? `${name} (Testnet)` : name;
      return symbol ? `${baseLabel} • ${symbol}` : baseLabel;
    }

    if (ticket.purchaseChain?.trim()) {
      return ticket.purchaseChain.replace("chain:", "Chain ");
    }

    return "Push Chain";
  }, [ticket.purchaseChain, ticket.purchaseChainMeta]);

  const handleListTicket = () => {
    if (onList) {
      onList(ticket.tokenId);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-card border-border">
      {/* Tier Image Banner */}
      <div className="relative h-40 overflow-hidden bg-muted">
        <img
          src={tierImage}
          alt={tierName}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = primaryEvent?.imageUrl || "/placeholder-event.jpg";
          }}
        />
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Tier badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-background/90 text-foreground backdrop-blur-sm shadow-sm border border-border">
            <Ticket className="h-3.5 w-3.5" />
            {tierName}
          </span>
        </div>
      </div>

      <CardHeader className="gap-2 bg-card p-4 text-foreground border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Ticket className="h-3.5 w-3.5" /> Ticket #{ticket.tokenId}
            </span>
            <CardTitle className="text-lg font-bold text-foreground">
              {primaryEvent?.name || `Event #${ticket.eventId}`}
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              {primaryEvent
                ? formatDateTime(primaryEvent.startTime)
                : "Date coming soon"}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {eventStatus && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[eventStatus].className}`}
              >
                {statusStyles[eventStatus].label}
              </span>
            )}
            {showListingBadge && isListed && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                <Tag className="h-3 w-3" /> Listed
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      {hasCardBodyContent && (
        <CardContent className="space-y-4 p-4 bg-card">
          {shouldShowQRCodeSection && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Entry QR Code</p>
                  <p className="text-xs text-muted-foreground">
                    Present this code at the event entrance to verify ownership
                    on Push Chain.
                  </p>
                  {onViewQR && (
                    <button
                      onClick={() => onViewQR(ticket)}
                      className="mt-2 hover:underline inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/90 transition-colors"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      View QR
                    </button>
                  )}
                </div>
                <div className="self-center rounded-xl border border-border bg-background p-3 shadow-sm hidden">
                  <QRCodeDisplay
                    tokenId={BigInt(ticket.tokenId)}
                    eventId={BigInt(ticket.eventId)}
                    owner={ticket.currentOwner}
                    size="sm"
                    showDownload={false}
                  />
                </div>
              </div>
            </div>
          )}

          {shouldShowUsedNotice && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4" />
                <div>
                  <p className="font-semibold text-red-300">Used Ticket</p>
                  <p className="text-xs text-red-400">
                    This ticket has already been validated and can't be used for
                    another entry.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}

      <CardFooter className="flex flex-wrap gap-2 border-t border-border bg-muted/50 p-4">
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              <Info className="h-4 w-4" />
              View Details
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {primaryEvent?.name || `Event #${ticket.eventId}`}
              </DialogTitle>
              <DialogDescription>
                Everything you need to know about this ticket and its event.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 text-sm text-muted-foreground">
              <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-semibold">Event Details</span>
                </div>

                {isDialogEventLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 rounded bg-muted" />
                    <div className="h-4 rounded bg-muted" />
                    <div className="h-4 rounded bg-muted" />
                    <div className="h-20 rounded bg-muted" />
                  </div>
                ) : dialogErrorMessage ? (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    Unable to load event details.{" "}
                    {dialogErrorMessage || "Please try again later."}
                  </div>
                ) : hasValidEventId && primaryEvent ? (
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Start Time</p>
                        <p className="text-sm">
                          {formatDateTime(primaryEvent.startTime)}
                        </p>
                      </div>
                    </div>
                    {primaryEvent.endTime && (
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">End Time</p>
                          <p className="text-sm">
                            {formatDateTime(primaryEvent.endTime)}
                          </p>
                        </div>
                      </div>
                    )}
                    {primaryEvent.venue && (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">Venue</p>
                          <p className="text-sm">{primaryEvent.venue}</p>
                        </div>
                      </div>
                    )}
                    {primaryEvent.description && (
                      <div className="rounded-md bg-background/60 p-3 text-sm text-muted-foreground">
                        {primaryEvent.description}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Event metadata isn't available yet.{" "}
                    {hasValidEventId
                      ? "Check back soon."
                      : "This ticket isn't linked to a published event."}
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Ticket className="h-4 w-4" />
                  <span className="font-semibold">Ticket Information</span>
                </div>
                <dl className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Tier
                    </span>
                    <span className="font-medium text-foreground">
                      {tierName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Price
                    </span>
                    <span className="font-medium text-foreground">
                      {formattedPurchasePrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Network
                    </span>
                    <span className="font-medium text-foreground">
                      {purchaseChainLabel}
                    </span>
                  </div>
                </dl>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Close
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showQR && ticket.ticketStatus !== "used" && (
          <button
            onClick={() => setShowQRCode(!showQRCode)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <QrCode className="h-4 w-4" />
            {showQRCode ? "Hide QR" : "Show QR"}
          </button>
        )}

        {showListButton && ticket.ticketStatus !== "used" && (
          <button
            onClick={handleListTicket}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Tag className="h-4 w-4" />
            List for Sale
          </button>
        )}

        {ticket.event && (
          <Link
            to={`/events/${ticket.event.eventId}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowRight className="h-4 w-4" />
            Event Page
          </Link>
        )}

        {ticket.tokenURI && (
          <a
            href={ticket.tokenURI}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" />
            Metadata
          </a>
        )}
      </CardFooter>
    </Card>
  );
}

// Skeleton loader for TicketCard
export function TicketCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="h-24 bg-slate-300" />
      <div className="p-4 space-y-4">
        <div className="h-28 rounded-lg border border-slate-200 bg-slate-100" />
        <div className="h-24 rounded-lg border border-red-100 bg-red-50" />
      </div>
      <div className="border-t border-slate-200 bg-slate-50 p-4 flex flex-wrap gap-2">
        <div className="h-9 bg-slate-200 rounded w-28" />
        <div className="h-9 bg-slate-200 rounded w-28" />
      </div>
    </Card>
  );
}

// Grid container for ticket cards
export function TicketGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 lg:gap-6">
      {children}
    </div>
  );
}

// Empty state for when no tickets are found
export function TicketsEmptyState({
  message = "No tickets found",
}: {
  message?: string;
}) {
  return (
    <div className="text-center py-12">
      <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
