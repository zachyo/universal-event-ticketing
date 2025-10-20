import { useState } from "react";
import {
  Filter,
  X,
  Calendar,
  DollarSign,
  Tag,
  ChevronDown,
} from "lucide-react";
import type { SearchFilters } from "../../hooks/useEventSearch";
import { cn } from "../../utils/cn";

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
  className?: string;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
  className = "",
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    date: false,
    price: false,
    sort: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const hasActiveFilters = () => {
    return (
      filters.status !== "all" ||
      filters.dateRange?.start ||
      filters.dateRange?.end ||
      filters.priceRange ||
      filters.categories?.length
    );
  };

  const statusOptions = [
    { value: "all", label: "All Events" },
    { value: "upcoming", label: "Upcoming" },
    { value: "live", label: "Live Now" },
    { value: "ended", label: "Ended" },
  ] as const;

  const sortOptions = [
    { value: "date", label: "Date (Nearest First)" },
    { value: "newest", label: "Newly Created" },
    { value: "popular", label: "Most Popular" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ] as const;

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <div className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            <span className="font-medium">Filters</span>
            {hasActiveFilters() && (
              <span className="ml-2 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs uppercase tracking-wider text-primary">
                Active
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Filter Panel */}
      <div
        className={cn(
          className,
          isOpen ? "block" : "hidden",
          "lg:block rounded-[1.75rem] border border-border/70 bg-card/85 p-5 space-y-6"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Filters
            </h3>
          </div>
          {hasActiveFilters() && (
            <button
              onClick={() => {
                onClearFilters();
                setIsOpen(false);
              }}
              className="text-xs font-semibold uppercase tracking-wider text-primary transition hover:text-accent"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div>
          <button
            onClick={() => toggleSection("status")}
            className="flex items-center justify-between w-full rounded-xl border border-transparent px-2 py-2 text-sm font-semibold text-foreground transition hover:border-border/50"
          >
            <span>Event Status</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.status ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.status && (
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className="group flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-primary/10"
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={filters.status === option.value}
                    onChange={(e) =>
                      onFiltersChange({
                        status: e.target.value as SearchFilters["status"],
                      })
                    }
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div>
          <button
            onClick={() => toggleSection("date")}
            className="flex items-center justify-between w-full rounded-xl border border-transparent px-2 py-2 text-sm font-semibold text-foreground transition hover:border-border/50"
          >
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              <span>Date Range</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.date ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.date && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  From
                </label>
                <input
                  type="date"
                  value={
                    filters.dateRange?.start
                      ? filters.dateRange.start.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    onFiltersChange({
                      dateRange: {
                        start: e.target.value ? new Date(e.target.value) : null,
                        end: filters.dateRange?.end ?? null,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  To
                </label>
                <input
                  type="date"
                  value={
                    filters.dateRange?.end
                      ? filters.dateRange.end.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    onFiltersChange({
                      dateRange: {
                        start: filters.dateRange?.start ?? null,
                        end: e.target.value ? new Date(e.target.value) : null,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full rounded-xl border border-transparent px-2 py-2 text-sm font-semibold text-foreground transition hover:border-border/50"
          >
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-primary" />
              <span>Price Range</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.price ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.price && (
            <div className="mt-2 rounded-xl border border-dashed border-border/60 bg-background/70 px-3 py-3 text-xs italic text-muted-foreground">
              Coming soon — filter by ticket price
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => toggleSection("sort")}
            className="flex items-center justify-between w-full rounded-xl border border-transparent px-2 py-2 text-sm font-semibold text-foreground transition hover:border-border/50"
          >
            <div className="flex items-center">
              <Tag className="mr-2 h-4 w-4 text-primary" />
              <span>Sort By</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedSections.sort ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.sort && (
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFiltersChange({
                  sortBy: e.target.value as SearchFilters["sortBy"],
                })
              }
              className="mt-3 w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {hasActiveFilters() && (
          <div className="border-t border-border/60 pt-4">
            <div className="flex flex-wrap gap-2">
              {filters.status !== "all" && (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {
                    statusOptions.find((opt) => opt.value === filters.status)
                      ?.label
                  }
                  <button
                    onClick={() => onFiltersChange({ status: "all" })}
                    className="rounded-full border border-primary/30 bg-primary/20 p-0.5 text-primary hover:bg-primary/30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.dateRange?.start && (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  From: {filters.dateRange.start.toLocaleDateString()}
                  <button
                    onClick={() =>
                      onFiltersChange({
                        dateRange: {
                          start: null,
                          end: filters.dateRange?.end ?? null,
                        },
                      })
                    }
                    className="rounded-full border border-primary/30 bg-primary/20 p-0.5 text-primary hover:bg-primary/30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.dateRange?.end && (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  To: {filters.dateRange.end.toLocaleDateString()}
                  <button
                    onClick={() =>
                      onFiltersChange({
                        dateRange: {
                          start: filters.dateRange?.start ?? null,
                          end: null,
                        },
                      })
                    }
                    className="rounded-full border border-primary/30 bg-primary/20 p-0.5 text-primary hover:bg-primary/30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
