/**
 * Error handling utilities for user-friendly error messages and retry logic
 */

/**
 * Parse any error to a user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (!error) return "An unknown error occurred";

  // Handle string errors
  if (typeof error === "string") return error;

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // User rejected transaction
    if (
      message.includes("user rejected") ||
      message.includes("user denied") ||
      message.includes("rejected the request") ||
      message.includes("user cancelled")
    ) {
      return "Transaction was cancelled";
    }

    // Network errors
    if (
      message.includes("network") ||
      message.includes("failed to fetch") ||
      message.includes("connection")
    ) {
      return "Network error. Please check your connection and try again";
    }

    // Insufficient funds
    if (
      message.includes("insufficient funds") ||
      message.includes("insufficient balance")
    ) {
      return "Insufficient funds to complete this transaction";
    }

    // Gas errors
    if (message.includes("gas") || message.includes("out of gas")) {
      return "Transaction failed due to gas issues. Try increasing gas limit";
    }

    // Contract-specific errors
    if (message.includes("notorganizer")) {
      return "You are not the event organizer";
    }
    if (message.includes("notowner")) {
      return "You are not the owner of this ticket";
    }
    if (message.includes("ticketalreadyused")) {
      return "This ticket has already been used";
    }
    if (message.includes("ticketnotvalid")) {
      return "This ticket is not valid";
    }
    if (message.includes("invalidtokenid")) {
      return "Invalid ticket ID";
    }
    if (message.includes("invalidprice")) {
      return "Invalid price amount";
    }
    if (message.includes("notlisted")) {
      return "This ticket is not listed for sale";
    }
    if (message.includes("invalidoffer")) {
      return "This offer is no longer valid";
    }
    if (message.includes("offerexpired")) {
      return "This offer has expired";
    }

    // Return original message if no match
    return error.message;
  }

  // Handle objects with message property
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === "string") {
      return getErrorMessage(err.message);
    }
    if (typeof err.reason === "string") {
      return getErrorMessage(err.reason);
    }
  }

  return "An unexpected error occurred. Please try again";
}

/**
 * Check if error is a user rejection (don't retry these)
 */
export function isUserRejection(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("cancelled") ||
    message.includes("rejected") ||
    message.includes("denied")
  );
}

/**
 * Check if error is a network error (can retry these)
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("connection") ||
    message.includes("timeout")
  );
}

/**
 * Sleep utility for retry backoff
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxAttempts Maximum retry attempts (default: 3)
 * @param baseDelay Base delay in ms (default: 1000)
 * @returns Result of successful function call
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry user rejections
      if (isUserRejection(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts - 1) {
        throw error;
      }

      // Only retry network errors automatically
      if (!isNetworkError(error) && attempt > 0) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(
  hash: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  if (!hash || hash.length < prefixLength + suffixLength) return hash;
  return `${hash.slice(0, prefixLength)}...${hash.slice(-suffixLength)}`;
}

/**
 * Get transaction explorer URL
 * TODO: Add multi-chain support based on chainId
 */
export function getTxExplorerUrl(txHash: string): string {
  // Default to Sepolia for now
  const baseUrl = "https://sepolia.etherscan.io";
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Copy text to clipboard and return success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Error logger for production (can be extended to send to error tracking service)
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` - ${context}` : ""}]:`, error);
  } else {
    // In production, you might want to send to an error tracking service
    // Example: Sentry.captureException(error, { tags: { context } });
    console.error("An error occurred:", getErrorMessage(error));
  }
}
