import { Filter, ArrowUpDown } from "lucide-react";

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
    <div className="space-y-4">
      {/* Status Filters */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Filter by status:
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ key, label, description }) => (
            <button
              key={key}
              onClick={() => onStatusFilterChange(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === key
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
              title={description}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map(({ key, label, description }) => (
            <button
              key={key}
              onClick={() => onSortChange(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === key
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
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
