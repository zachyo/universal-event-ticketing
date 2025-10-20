import { Filter, ArrowUpDown } from "lucide-react";
import { cn } from "../utils/cn";

export type TicketStatusFilter =
  | "all"
  | "valid"
  | "used"
  | "listed"
  | "unlisted";
export type TicketSortOption =
  | "recent"
  | "event-date"
  | "price-high"
  | "price-low"
  | "name";

interface TicketFiltersProps {
  statusFilter: TicketStatusFilter;
  sortBy: TicketSortOption;
  onStatusFilterChange: (filter: TicketStatusFilter) => void;
  onSortChange: (sort: TicketSortOption) => void;
}

const STATUS_FILTERS: Array<{
  key: TicketStatusFilter;
  label: string;
  description: string;
}> = [
  { key: "all", label: "All Tickets", description: "Show all tickets" },
  { key: "valid", label: "Valid", description: "Available for use" },
  { key: "used", label: "Used", description: "Already scanned" },
  { key: "listed", label: "Listed", description: "On marketplace" },
  { key: "unlisted", label: "Not Listed", description: "Not for sale" },
];

const SORT_OPTIONS: Array<{
  key: TicketSortOption;
  label: string;
  description: string;
}> = [
  { key: "recent", label: "Most Recent", description: "Newest first" },
  {
    key: "event-date",
    label: "Event Date",
    description: "Upcoming events first",
  },
  {
    key: "price-high",
    label: "Price (High to Low)",
    description: "Most expensive first",
  },
  {
    key: "price-low",
    label: "Price (Low to High)",
    description: "Cheapest first",
  },
  { key: "name", label: "Event Name (A-Z)", description: "Alphabetical order" },
];

export function TicketFilters({
  statusFilter,
  sortBy,
  onStatusFilterChange,
  onSortChange,
}: TicketFiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter by status
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ key, label, description }) => (
            <button
              key={key}
              onClick={() => onStatusFilterChange(key)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                statusFilter === key
                  ? "bg-gradient-to-r from-primary via-primary to-accent text-white shadow-[0_16px_40px_-24px_rgba(196,73,255,0.75)]"
                  : "border border-border/60 bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-primary"
              )}
              title={description}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sort by
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map(({ key, label, description }) => (
            <button
              key={key}
              onClick={() => onSortChange(key)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                sortBy === key
                  ? "bg-gradient-to-r from-primary via-primary to-accent text-white shadow-[0_16px_40px_-24px_rgba(196,73,255,0.75)]"
                  : "border border-border/60 bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-primary"
              )}
              title={description}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
