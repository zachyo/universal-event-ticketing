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
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            <span className="font-medium">Filters</span>
            {hasActiveFilters() && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
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
        className={`${className} ${
          isOpen ? "block" : "hidden"
        } lg:block bg-white border border-gray-200 rounded-lg p-4`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          {hasActiveFilters() && (
            <button
              onClick={() => {
                onClearFilters();
                setIsOpen(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection("status")}
            className="flex items-center justify-between w-full mb-2"
          >
            <span className="font-medium text-gray-900">Event Status</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSections.status ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.status && (
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center cursor-pointer group"
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
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection("date")}
            className="flex items-center justify-between w-full mb-2"
          >
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-600" />
              <span className="font-medium text-gray-900">Date Range</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSections.date ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.date && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Price Range Filter (Placeholder) */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full mb-2"
          >
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-gray-600" />
              <span className="font-medium text-gray-900">Price Range</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSections.price ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSections.price && (
            <div className="text-sm text-gray-500 italic">
              Coming soon - Filter by ticket price
            </div>
          )}
        </div>

        {/* Sort By */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection("sort")}
            className="flex items-center justify-between w-full mb-2"
          >
            <div className="flex items-center">
              <Tag className="w-4 h-4 mr-2 text-gray-600" />
              <span className="font-medium text-gray-900">Sort By</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {filters.status !== "all" && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {
                    statusOptions.find((opt) => opt.value === filters.status)
                      ?.label
                  }
                  <button
                    onClick={() => onFiltersChange({ status: "all" })}
                    className="ml-1 hover:bg-blue-200 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.dateRange?.start && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
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
                    className="ml-1 hover:bg-blue-200 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.dateRange?.end && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
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
                    className="ml-1 hover:bg-blue-200 rounded-full"
                  >
                    <X className="w-3 h-3" />
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
