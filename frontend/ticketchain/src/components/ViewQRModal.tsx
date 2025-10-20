import type { ComponentType } from "react";
import { X, Calendar, MapPin, Clock, Ticket as TicketIcon } from "lucide-react";
import { cn } from "../utils/cn";
import { QRCodeDisplay } from "./QRCodeDisplay";
import type { FormattedTicket } from "../types";
import { formatDateTime, formatPriceWithCurrency } from "../lib/formatters";

interface ViewQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: FormattedTicket;
}

export function ViewQRModal({ isOpen, onClose, ticket }: ViewQRModalProps) {
  if (!isOpen) return null;

  const event = ticket.event;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="glass-card max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2.25rem] border border-border/70 bg-card/90 shadow-[0_40px_120px_-40px_rgba(129,54,255,0.65)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/95 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ticket QR code
            </p>
            <h2 className="text-xl font-semibold text-foreground">
              {event?.name ?? `Ticket #${ticket.tokenId}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border/60 p-1.5 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            <div className="mx-auto flex max-w-sm justify-center rounded-[1.5rem] border border-border/70 bg-background/70 p-6">
              {ticket.currentOwner ? (
                <QRCodeDisplay
                  tokenId={BigInt(ticket.tokenId)}
                  eventId={BigInt(ticket.eventId)}
                  owner={ticket.currentOwner}
                  size="lg"
                  showDownload
                />
              ) : (
                <div className="text-center text-sm text-destructive">
                  Unable to generate QR code. Refresh your tickets and try
                  again.
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-primary/30 bg-primary/10 p-5 text-sm text-primary-foreground">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/60 via-primary/30 to-accent/30 text-white shadow-[0_18px_40px_-22px_rgba(196,73,255,0.55)]">
                  <TicketIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider">
                    How to use this ticket
                  </h3>
                  <ul className="mt-2 space-y-1 text-xs text-primary-foreground/85">
                    <li>• Present this QR code at entry for instant scan</li>
                    <li>• Download a backup for offline access</li>
                    <li>• Keep it private to maintain ownership</li>
                    <li>• Organizers verify and mark usage on-chain</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-[1.75rem] border border-border/70 bg-background/80 p-5">
            <h3 className="text-base font-semibold text-foreground">
              Ticket details
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              {event && (
                <div className="space-y-4 rounded-[1.5rem] border border-border/60 bg-background/70 p-4">
                  <InfoRow
                    icon={TicketIcon}
                    label="Event"
                    value={event.name}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Date"
                    value={formatDateTime(event.startTime)}
                  />
                  <InfoRow
                    icon={Clock}
                    label="Start time"
                    value={event.startTime.toLocaleTimeString()}
                  />
                  {event.venue && (
                    <InfoRow icon={MapPin} label="Venue" value={event.venue} />
                  )}
                </div>
              )}

              <div className="space-y-3 rounded-[1.5rem] border border-border/60 bg-background/70 p-4">
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Detail label="Token ID" value={`#${ticket.tokenId}`} mono />
                  <Detail
                    label="Ticket type"
                    value={`Type #${ticket.ticketTypeId}`}
                  />
                  <Detail
                    label="Purchase price"
                    value={formatPriceWithCurrency(ticket.purchasePrice)}
                  />
                  <Detail
                    label="Status"
                    value={ticket.ticketStatus === "used" ? "Used" : "Valid"}
                    valueClass={
                      ticket.ticketStatus === "used"
                        ? "text-destructive"
                        : "text-primary"
                    }
                  />
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Owner
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] text-foreground/80">
                    {ticket.currentOwner}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/90 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold text-foreground",
          mono && "font-mono",
          valueClass
        )}
      >
        {value}
      </p>
    </div>
  );
}
