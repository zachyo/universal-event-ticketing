import { AlertCircle, RefreshCw } from "lucide-react";
import { getErrorMessage } from "../lib/errorUtils";
import { cn } from "../utils/cn";

interface ErrorDisplayProps {
  error: unknown;
  retry?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Error display component for inline errors
 *
 * Usage:
 * <ErrorDisplay
 *   error={error}
 *   retry={() => refetch()}
 * />
 */
export function ErrorDisplay({
  error,
  retry,
  className = "",
  compact = false,
}: ErrorDisplayProps) {
  const errorMessage = getErrorMessage(error);

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-destructive",
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <span>{errorMessage}</span>
        {retry && (
          <button
            onClick={retry}
            className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-destructive transition hover:bg-destructive/15"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-card rounded-[1.75rem] border border-destructive/40 bg-destructive/10 p-5 text-destructive",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/20">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 text-sm">
          <h3 className="text-lg font-semibold text-destructive">Error</h3>
          <p className="mt-1 text-destructive/90">{errorMessage}</p>
          {retry && (
            <button
              onClick={retry}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-semibold uppercase tracking-wider text-destructive-foreground transition hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-destructive/70"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
