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
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
            Events
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Discover amazing events happening around the world
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-300 px-4 py-2.5 md:py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 touch-manipulation"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 md:mb-8 flex flex-col lg:grid lg:grid-cols-4 gap-4 md:gap-6">
        {/* Filter Sidebar - Hidden on mobile, shown in collapsible section */}
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            isSearching={isSearching}
            className="mb-4 md:mb-6"
          />

          {/* Results Count */}
          {!loading && (
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm md:text-base text-gray-600">
                {resultCount} event{resultCount !== 1 ? "s" : ""} found
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              {resultCount > 0 && (
                <p className="text-xs md:text-sm text-gray-500">
                  Sorted by:{" "}
                  {filters.sortBy === "date"
                    ? "Date (Nearest First)"
                    : filters.sortBy === "newest"
                    ? "Newly Created"
                    : filters.sortBy === "popular"
                    ? "Most Popular"
                    : filters.sortBy}
                </p>
              )}
            </div>
          )}

          {/* Events Grid */}
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
  );
};

export default EventsPage;
