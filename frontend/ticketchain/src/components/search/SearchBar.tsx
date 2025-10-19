import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { useSearchHistory } from "../../hooks/useEventSearch";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  isSearching?: boolean;
  showHistory?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search events by name, venue, or organizer...",
  isSearching = false,
  showHistory = true,
  className = "",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { history, addToHistory, removeFromHistory } = useSearchHistory();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      addToHistory(value.trim());
      onSearch?.(value.trim());
      setShowSuggestions(false);
    }
  };

  const handleHistoryClick = (query: string) => {
    onChange(query);
    onSearch?.(query);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (showHistory && history.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay to allow click on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`flex items-center border rounded-lg bg-white transition-all ${
            isFocused
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-gray-300"
          }`}
        >
          <Search className="ml-3 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="flex-1 px-3 py-2.5 outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
          />
          {isSearching && (
            <div className="mr-3">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {value && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </form>

      {/* Search History / Suggestions */}
      {showSuggestions && showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase">
                Recent Searches
              </span>
            </div>
            <div className="space-y-1">
              {history.map((query, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded-md cursor-pointer group"
                  onClick={() => handleHistoryClick(query)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Clock className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {query}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(query);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                    aria-label="Remove from history"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popular Searches (Optional) */}
      {showSuggestions && !value && history.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="flex items-center px-2 py-1 mb-1">
              <TrendingUp className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                Popular Searches
              </span>
            </div>
            <div className="space-y-1">
              {["Music", "Sports", "Technology", "Arts"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleHistoryClick(term)}
                  className="w-full text-left px-2 py-2 hover:bg-gray-50 rounded-md text-sm text-gray-700"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
