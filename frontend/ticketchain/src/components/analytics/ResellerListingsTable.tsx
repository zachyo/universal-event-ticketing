import { formatPrice } from "../../lib/formatters";
import { CheckCircle2, Clock, Ticket } from "lucide-react";

interface Listing {
  listingId: bigint;
  tokenId: bigint;
  seller: string;
  price: bigint;
  active: boolean;
  createdAt: bigint;
}

interface ResellerListingsTableProps {
  activeListings: Listing[];
  historicalListings: Listing[];
}

export function ResellerListingsTable({
  activeListings,
  historicalListings,
}: ResellerListingsTableProps) {
  const allListings = [...activeListings, ...historicalListings].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt)
  );

  const getStatusBadge = (listing: Listing) => {
    if (listing.active) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Clock className="h-3 w-3" />
          Active
        </span>
      );
    }

    // Assume sold if not active (could be canceled, but we'll treat as sold for now)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        Sold
      </span>
    );
  };

  if (allListings.length === 0) {
    return (
      <div className="glass-card rounded-[2rem] border border-border bg-card p-8 text-center">
        <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No listings yet
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your listing history will appear here once you list tickets for this
          event.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[2rem] border border-border bg-card overflow-hidden">
      <div className="border-b border-border/60 px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">
          Listing History
        </h3>
        <p className="text-sm text-muted-foreground">
          All your listings for this event ({allListings.length} total)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border/60 bg-background/60">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Listing ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ticket ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Listed Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {allListings.map((listing) => (
              <tr
                key={Number(listing.listingId)}
                className="transition hover:bg-background/60"
              >
                <td className="px-6 py-4 text-sm font-medium text-foreground">
                  #{Number(listing.listingId)}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  #{Number(listing.tokenId)}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-primary">
                  {formatPrice(listing.price)} PC
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(Number(listing.createdAt) * 1000).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </td>
                <td className="px-6 py-4">{getStatusBadge(listing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
