import { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  MapPin,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { useEvents } from "../hooks/useContracts";
import {
  EventCard,
  EventCardSkeleton,
  EventGrid,
  EventsEmptyState,
} from "../components/EventCard";
import {
  formatEvent,
  sortEventsByDate,
  filterEventsByStatus,
  searchEvents,
} from "../lib/formatters";

type StatusFilter = "all" | "upcoming" | "live" | "ended";

const STATUS_FILTERS: ReadonlyArray<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All Events" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "ended", label: "Ended" },
];

const EventsPage = () => {
  const { events, loading, error, refetch } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format and filter events
  const filteredEvents = useMemo(() => {
    if (!events.length) return [];

    let formattedEvents = events.map(formatEvent);

    // Apply search filter
    if (searchQuery.trim()) {
      formattedEvents = searchEvents(formattedEvents, searchQuery);
    }

    // Apply status filter
    formattedEvents = filterEventsByStatus(formattedEvents, statusFilter);

    // Apply sorting
    formattedEvents = sortEventsByDate(formattedEvents, sortOrder === "asc");

    return formattedEvents;
  }, [events, searchQuery, statusFilter, sortOrder]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
  };

  const handleSortOrderChange = (order: "asc" | "desc") => {
    setSortOrder(order);
  };

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
          <div className="text-red-600 mb-4">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Events</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">
            Discover amazing events happening around the world
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events by name, venue, or description..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          {/* Quick Status Filters */}
          <div className="flex gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleStatusFilterChange(filter.key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === filter.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Sort Order */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSortOrderChange("asc")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                sortOrder === "asc"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Earliest First
            </button>
            <button
              onClick={() => handleSortOrderChange("desc")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                sortOrder === "desc"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Latest First
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Filter by venue..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Any Price</option>
                  <option value="free">Free</option>
                  <option value="0-0.1">0 - 0.1 ETH</option>
                  <option value="0.1-0.5">0.1 - 0.5 ETH</option>
                  <option value="0.5+">0.5+ ETH</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredEvents.length} event
            {filteredEvents.length !== 1 ? "s" : ""} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
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
              : statusFilter !== "all"
              ? `No ${statusFilter} events found`
              : "No events available at the moment"
          }
        />
      )}
    </div>
  );
};

export default EventsPage;
