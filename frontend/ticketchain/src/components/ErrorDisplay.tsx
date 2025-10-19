import { AlertCircle, RefreshCw } from "lucide-react";
import { getErrorMessage } from "../lib/errorUtils";

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
        className={`flex items-center gap-2 text-sm text-red-600 ${className}`}
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{errorMessage}</span>
        {retry && (
          <button
            onClick={retry}
            className="text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-1">Error</h3>
          <p className="text-red-700">{errorMessage}</p>

          {/* Retry Button */}
          {retry && (
            <button
              onClick={retry}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
