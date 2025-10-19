import { useState, useEffect, useMemo, useCallback } from "react";
import type { FormattedEvent } from "../types";

export interface SearchFilters {
  query: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  categories?: string[];
  status?: "all" | "upcoming" | "live" | "ended";
  sortBy?: "date" | "price-asc" | "price-desc" | "newest" | "popular";
}

interface UseEventSearchResult {
  filteredEvents: FormattedEvent[];
  isSearching: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  resultCount: number;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  status: "all",
  sortBy: "date",
};

/**
 * Hook for searching and filtering events
 * @param events - Array of formatted events to search through
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 */
export function useEventSearch(
  events: FormattedEvent[] | undefined,
  debounceMs: number = 300
): UseEventSearchResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFiltersState] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, debounceMs]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // Filter and search logic
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let results = [...events];

    // Text search (name, description, venue)
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase().trim();
      results = results.filter((event) => {
        return (
          event.name.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.venue.toLowerCase().includes(query) ||
          event.organizer.toLowerCase().includes(query)
        );
      });
    }

    // Date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      results = results.filter((event) => {
        const eventDate = event.startTime;
        if (filters.dateRange?.start && eventDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange?.end && eventDate > filters.dateRange.end) {
          return false;
        }
        return true;
      });
    }

    // Price range filter (min price of event's ticket types)
    // TODO: Implement when ticket type prices are available in event data
    if (filters.priceRange) {
      // results = results.filter((event) => {
      //   const minPrice = filters.priceRange?.min ?? 0;
      //   const maxPrice = filters.priceRange?.max ?? Infinity;
      //   return event.minTicketPrice >= minPrice && event.minTicketPrice <= maxPrice;
      // });
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      const now = new Date();
      results = results.filter((event) => {
        if (filters.status === "upcoming") {
          return event.startTime > now && event.active;
        }
        if (filters.status === "live") {
          return event.startTime <= now && event.endTime >= now && event.active;
        }
        if (filters.status === "ended") {
          return event.endTime < now;
        }
        return true;
      });
    }

    // Category filter (if categories are added to events)
    if (filters.categories && filters.categories.length > 0) {
      // TODO: Implement when categories are added to event data
      // results = results.filter(event =>
      //   filters.categories.some(cat => event.categories?.includes(cat))
      // );
    }

    // Sorting
    if (filters.sortBy) {
      results.sort((a, b) => {
        switch (filters.sortBy) {
          case "date":
            return a.startTime.getTime() - b.startTime.getTime();
          case "newest":
            return b.eventId - a.eventId;
          case "popular":
            return b.sold - a.sold;
          case "price-asc":
          case "price-desc":
            // TODO: Implement when ticket prices are available
            return 0;
          default:
            return 0;
        }
      });
    }

    return results;
  }, [events, debouncedQuery, filters]);

  return {
    filteredEvents,
    isSearching,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearFilters,
    resultCount: filteredEvents.length,
  };
}

/**
 * Hook for managing search history (stored in localStorage)
 */
export function useSearchHistory(maxItems: number = 5) {
  const STORAGE_KEY = "ticketchain_search_history";

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      setHistory((prev) => {
        const filtered = prev.filter((item) => item !== query);
        const newHistory = [query, ...filtered].slice(0, maxItems);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        return newHistory;
      });
    },
    [maxItems]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}
