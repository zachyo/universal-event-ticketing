import { useState, useMemo } from "react";
import { formatEther } from "viem";
import { X, Plus, Trash2, DollarSign } from "lucide-react";
import {
  useBatchListing,
  type BatchListingItem,
} from "../../hooks/useBatchListing";

interface TicketOption {
  tokenId: bigint;
  eventName: string;
  ticketTypeName: string;
  originalPrice: bigint;
}

interface BulkListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTickets: TicketOption[];
  onSuccess?: () => void;
}

export function BulkListingModal({
  isOpen,
  onClose,
  availableTickets,
  onSuccess,
}: BulkListingModalProps) {
  const [selectedItems, setSelectedItems] = useState<BatchListingItem[]>([]);
  const {
    batchListTickets,
    isPreparing,
    isWritePending,
    isConfirming,
    isConfirmed,
    error,
  } = useBatchListing();

  const addItem = () => {
    if (availableTickets.length > 0) {
      const firstAvailable = availableTickets[0];
      setSelectedItems([
        ...selectedItems,
        {
          tokenId: firstAvailable.tokenId,
          price: formatEther(firstAvailable.originalPrice),
        },
      ]);
    }
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof BatchListingItem,
    value: bigint | string
  ) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedItems(updated);
  };

  const totalListingValue = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const price = parseFloat(item.price || "0");
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  }, [selectedItems]);

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;

    try {
      await batchListTickets(selectedItems);
    } catch (err) {
      console.error("Batch listing error:", err);
    }
  };

  const handleClose = () => {
    if (!isWritePending && !isConfirming) {
      setSelectedItems([]);
      onClose();
    }
  };

  // Auto-close on success
  if (isConfirmed && onSuccess) {
    onSuccess();
    handleClose();
  }

  if (!isOpen) return null;

  const usedTokenIds = new Set(selectedItems.map((item) => item.tokenId));
  const availableForSelection = availableTickets.filter(
    (ticket) => !usedTokenIds.has(ticket.tokenId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Batch List Tickets</h2>
          <button
            onClick={handleClose}
            disabled={isWritePending || isConfirming}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">No tickets selected</p>
              <p className="text-sm">Click "Add Ticket" to start listing</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedItems.map((item, index) => {
                const ticket = availableTickets.find(
                  (t) => t.tokenId === item.tokenId
                );

                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <select
                        value={item.tokenId.toString()}
                        onChange={(e) =>
                          updateItem(index, "tokenId", BigInt(e.target.value))
                        }
                        disabled={isWritePending || isConfirming}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 disabled:bg-gray-100"
                      >
                        {/* Current selection */}
                        {ticket && (
                          <option value={ticket.tokenId.toString()}>
                            #{ticket.tokenId.toString()} - {ticket.eventName} (
                            {ticket.ticketTypeName})
                          </option>
                        )}
                        {/* Available options */}
                        {availableForSelection.map((t) => (
                          <option
                            key={t.tokenId.toString()}
                            value={t.tokenId.toString()}
                          >
                            #{t.tokenId.toString()} - {t.eventName} (
                            {t.ticketTypeName})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Price (ETH):
                        </span>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            updateItem(index, "price", e.target.value)
                          }
                          disabled={isWritePending || isConfirming}
                          placeholder="0.00"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(index)}
                      disabled={isWritePending || isConfirming}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Button */}
          <button
            onClick={addItem}
            disabled={
              availableForSelection.length === 0 ||
              isWritePending ||
              isConfirming
            }
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:text-gray-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Ticket
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Error: {error.message || "Failed to list tickets"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Total Listing Value:</span>
            <span className="text-2xl font-bold text-primary">
              {totalListingValue.toFixed(4)} ETH
            </span>
          </div>

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
                selectedItems.length === 0 ||
                isPreparing ||
                isWritePending ||
                isConfirming
              }
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPreparing
                ? "Preparing..."
                : isWritePending
                ? "Confirm in Wallet..."
                : isConfirming
                ? "Confirming..."
                : `List ${selectedItems.length} Ticket${
                    selectedItems.length !== 1 ? "s" : ""
                  }`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
