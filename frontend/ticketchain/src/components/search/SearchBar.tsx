import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { useSearchHistory } from "../../hooks/useEventSearch";
import { cn } from "../../utils/cn";

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
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "flex items-center rounded-full border border-border bg-background px-4 py-2 transition-all shadow-sm",
            isFocused && "border-primary shadow-md"
          )}
        >
          <Search className="mr-3 h-5 w-5 text-primary" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="flex-1 bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {isSearching && (
            <div className="mr-3 h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
          {value && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-2 rounded-full p-1 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-3 overflow-hidden rounded-[1.5rem] border border-border bg-card backdrop-blur-xl shadow-lg">
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent searches
              </span>
            </div>
            <div className="space-y-1">
              {history.map((query, index) => (
                <div
                  key={index}
                  className="group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition hover:bg-primary/10"
                  onClick={() => handleHistoryClick(query)}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="truncate text-sm text-foreground">
                      {query}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(query);
                    }}
                    className="rounded-full p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
                    aria-label="Remove from history"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSuggestions && !value && history.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-3 overflow-hidden rounded-[1.5rem] border border-border bg-card backdrop-blur-xl shadow-lg">
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Popular searches
              </span>
            </div>
            <div className="space-y-1">
              {["Music", "Sports", "Technology", "Arts"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleHistoryClick(term)}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-primary/10"
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
