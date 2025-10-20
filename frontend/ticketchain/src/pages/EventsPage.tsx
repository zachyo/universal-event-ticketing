import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useEventsWithTicketTypes } from "../hooks/useEventsWithTicketTypes";
import {
  EventCard,
  EventCardSkeleton,
  EventGrid,
  EventsEmptyState,
} from "../components/EventCard";
import { useEventSearch } from "../hooks/useEventSearch";
import { SearchBar } from "../components/search/SearchBar";
import { FilterPanel } from "../components/search/FilterPanel";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { cn } from "../utils/cn";

const EventsPage = () => {
  const {
    events: formattedEvents,
    loading,
    error,
    refetch,
  } = useEventsWithTicketTypes();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use search hook
  const {
    filteredEvents,
    isSearching,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearFilters,
    resultCount,
  } = useEventSearch(formattedEvents);

  const handleRefresh = async () => {
    if (!refetch) return;
    try {
      setIsRefreshing(true);
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ErrorDisplay error={error} retry={handleRefresh} />
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4">
      <div className="space-y-8">
        <div className="glass-card rounded-[2.25rem] border border-border/70 bg-card/85 px-6 py-6 md:px-8 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary">
                Discover
              </div>
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                Explore experiences across every chain.
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Browse curated drops, IRL festivals, and community gatherings.
                Filter by status, price tiers, and momentum to craft the perfect
                night out.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-gradient-to-r from-primary via-primary to-accent px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-20px_rgba(196,73,255,0.75)] transition hover:shadow-[0_18px_48px_-18px_rgba(196,73,255,0.85)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 text-white",
                  isRefreshing && "animate-spin"
                )}
              />
              {isRefreshing ? "Refreshing" : "Refresh feed"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="lg:sticky lg:top-32">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
              className="glass-card rounded-[1.75rem] border border-border/70 bg-card/80 p-6"
            />
          </aside>

          <div className="space-y-5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              isSearching={isSearching}
              className="glass-card rounded-[1.75rem] border border-border/70 bg-card/80 p-1"
            />

            {!loading && (
              <div className="flex flex-col gap-2 rounded-[1.5rem] border border-border/60 bg-secondary/60 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <strong className="text-foreground">{resultCount}</strong>{" "}
                  event{resultCount !== 1 ? "s" : ""} live
                  {searchQuery && (
                    <>
                      {" "}
                      for <span className="text-foreground">"{searchQuery}"</span>
                    </>
                  )}
                </span>
                {resultCount > 0 && (
                  <span className="text-xs uppercase tracking-wider text-foreground/60">
                    Sorted by{" "}
                    <strong className="text-foreground">
                      {filters.sortBy === "date"
                        ? "Date (Nearest)"
                        : filters.sortBy === "newest"
                        ? "Newest"
                        : filters.sortBy === "popular"
                        ? "Popularity"
                        : filters.sortBy === "price-asc"
                        ? "Lowest price"
                        : filters.sortBy === "price-desc"
                        ? "Highest price"
                        : filters.sortBy}
                    </strong>
                  </span>
                )}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />
              {loading ? (
                <EventGrid>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <EventCardSkeleton key={index} />
                  ))}
                </EventGrid>
              ) : filteredEvents.length > 0 ? (
                <EventGrid>
                  {filteredEvents.map((event) => (
                    <EventCard key={event.eventId} event={event} />
                  ))}
                </EventGrid>
              ) : (
                <EventsEmptyState
                  message={
                    searchQuery
                      ? `No events found matching "${searchQuery}"`
                      : filters.status !== "all"
                      ? `No ${filters.status} events found`
                      : "No events available at the moment"
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
