import { formatEther } from "viem";
import { Clock, User, CheckCircle, XCircle } from "lucide-react";
import { type Offer } from "../../hooks/useOffers";

interface OfferCardProps {
  offer: Offer;
  isOwner?: boolean;
  isOfferer?: boolean;
  onAccept?: (offerId: bigint) => void;
  onCancel?: (offerId: bigint) => void;
  isProcessing?: boolean;
}

export function OfferCard({
  offer,
  isOwner,
  isOfferer,
  onAccept,
  onCancel,
  isProcessing,
}: OfferCardProps) {
  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired =
    offer.expiresAt > 0n &&
    offer.expiresAt <= BigInt(Math.floor(Date.now() / 1000));
  const timeRemaining =
    offer.expiresAt > 0n
      ? Number(offer.expiresAt) - Math.floor(Date.now() / 1000)
      : null;

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "Expired";
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0)
      return `${hours}h ${Math.floor((seconds % 3600) / 60)}m remaining`;
    return `${Math.floor(seconds / 60)}m remaining`;
  };

  return (
    <div
      className={`p-4 border rounded-lg ${
        isExpired ? "bg-gray-50 border-gray-300" : "bg-white border-gray-200"
      } ${!offer.active ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-2xl font-bold text-primary">
            {formatEther(offer.offerAmount)} ETH
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Offer #{offer.offerId.toString()}
          </div>
        </div>

        {!offer.active && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">
            Closed
          </span>
        )}
        {offer.active && isExpired && (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
            Expired
          </span>
        )}
        {offer.active && !isExpired && (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
            Active
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4" />
          <span className="font-mono text-xs">
            {offer.offerer.slice(0, 6)}...{offer.offerer.slice(-4)}
          </span>
          {isOfferer && (
            <span className="text-xs text-primary font-medium">(You)</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Created: {formatTimestamp(offer.createdAt)}</span>
        </div>

        {offer.expiresAt > 0n && (
          <div
            className={`flex items-center gap-2 ${
              isExpired ? "text-red-600" : "text-gray-600"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {timeRemaining !== null && timeRemaining > 0
                ? formatTimeRemaining(timeRemaining)
                : "No expiration"}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {offer.active && !isExpired && (
        <div className="mt-4 flex gap-2">
          {isOwner && onAccept && (
            <button
              onClick={() => onAccept(offer.offerId)}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Accept Offer
            </button>
          )}

          {isOfferer && onCancel && (
            <button
              onClick={() => onCancel(offer.offerId)}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel Offer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
