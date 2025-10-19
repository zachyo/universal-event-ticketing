import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { X, DollarSign, Clock } from "lucide-react";
import { useOffers } from "../../hooks/useOffers";

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint;
  ticketInfo: {
    eventName: string;
    ticketTypeName: string;
    currentPrice?: bigint;
  };
  onSuccess?: () => void;
}

export function MakeOfferModal({
  isOpen,
  onClose,
  tokenId,
  ticketInfo,
  onSuccess,
}: MakeOfferModalProps) {
  const [offerAmount, setOfferAmount] = useState("");
  const [expiresInHours, setExpiresInHours] = useState<number>(24);
  const [noExpiration, setNoExpiration] = useState(false);

  const {
    makeOffer,
    isPreparing,
    isWritePending,
    isConfirming,
    isConfirmed,
    error,
  } = useOffers();

  const handleSubmit = async () => {
    if (!offerAmount || parseFloat(offerAmount) <= 0) return;

    try {
      await makeOffer(
        tokenId,
        offerAmount,
        noExpiration ? undefined : expiresInHours
      );
    } catch (err) {
      console.error("Make offer error:", err);
    }
  };

  const handleClose = () => {
    if (!isWritePending && !isConfirming) {
      setOfferAmount("");
      setExpiresInHours(24);
      setNoExpiration(false);
      onClose();
    }
  };

  // Auto-close on success
  useEffect(() => {
    if (isConfirmed) {
      if (onSuccess) onSuccess();
      const timer = setTimeout(() => {
        if (!isWritePending && !isConfirming) {
          setOfferAmount("");
          setExpiresInHours(24);
          setNoExpiration(false);
          onClose();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, isWritePending, isConfirming, onSuccess, onClose]);

  if (!isOpen) return null;

  const suggestedPrice = ticketInfo.currentPrice
    ? parseFloat(formatEther(ticketInfo.currentPrice))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Make an Offer</h2>
          <button
            onClick={handleClose}
            disabled={isWritePending || isConfirming}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Ticket Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Ticket</div>
            <div className="font-semibold">{ticketInfo.eventName}</div>
            <div className="text-sm text-gray-600">
              {ticketInfo.ticketTypeName}
            </div>
            {suggestedPrice !== null && (
              <div className="mt-2 text-sm text-gray-600">
                Listed at:{" "}
                <span className="font-semibold">
                  {suggestedPrice.toFixed(4)} ETH
                </span>
              </div>
            )}
          </div>

          {/* Offer Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Offer Amount (ETH)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.001"
                min="0"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                disabled={isWritePending || isConfirming}
                placeholder="0.000"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
            {suggestedPrice !== null && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() =>
                    setOfferAmount((suggestedPrice * 0.9).toFixed(4))
                  }
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  90% ({(suggestedPrice * 0.9).toFixed(4)})
                </button>
                <button
                  onClick={() =>
                    setOfferAmount((suggestedPrice * 0.95).toFixed(4))
                  }
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  95% ({(suggestedPrice * 0.95).toFixed(4)})
                </button>
                <button
                  onClick={() => setOfferAmount(suggestedPrice.toFixed(4))}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  100% ({suggestedPrice.toFixed(4)})
                </button>
              </div>
            )}
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Offer Expiration
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={expiresInHours}
                  onChange={(e) =>
                    setExpiresInHours(parseInt(e.target.value) || 24)
                  }
                  disabled={noExpiration || isWritePending || isConfirming}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-600">hours</span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noExpiration}
                  onChange={(e) => setNoExpiration(e.target.checked)}
                  disabled={isWritePending || isConfirming}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">No expiration</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Error: {error.message || "Failed to make offer"}
              </p>
            </div>
          )}

          {isConfirmed && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Offer submitted successfully!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isWritePending || isConfirming}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !offerAmount ||
                parseFloat(offerAmount) <= 0 ||
                isPreparing ||
                isWritePending ||
                isConfirming
              }
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPreparing
                ? "Preparing..."
                : isWritePending
                ? "Confirm in Wallet..."
                : isConfirming
                ? "Confirming..."
                : isConfirmed
                ? "Success!"
                : "Make Offer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
