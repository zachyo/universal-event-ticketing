import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useBatchCancelListings } from "../../hooks/useContracts";

interface ListingOption {
  listingId: number;
  tokenId: number;
  eventName: string;
  price: bigint;
}

interface BulkCancelListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableListings: ListingOption[];
  onSuccess?: () => void;
}

export function BulkCancelListingModal({
  isOpen,
  onClose,
  availableListings,
  onSuccess,
}: BulkCancelListingModalProps) {
  const [selectedListingIds, setSelectedListingIds] = useState<Set<number>>(
    new Set()
  );
  const { batchCancelListings, isPending } = useBatchCancelListings();

  const toggleListing = (listingId: number) => {
    const newSet = new Set(selectedListingIds);
    if (newSet.has(listingId)) {
      newSet.delete(listingId);
    } else {
      newSet.add(listingId);
    }
    setSelectedListingIds(newSet);
  };

  const toggleAll = () => {
    if (selectedListingIds.size === availableListings.length) {
      setSelectedListingIds(new Set());
    } else {
      setSelectedListingIds(
        new Set(availableListings.map((l) => l.listingId))
      );
    }
  };

  const handleCancel = async () => {
    if (selectedListingIds.size === 0) return;

    try {
      await batchCancelListings(Array.from(selectedListingIds));
      setSelectedListingIds(new Set());
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to batch cancel listings:", error);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      setSelectedListingIds(new Set());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl rounded-[1.75rem] border border-border bg-card shadow-lg">
        <div className="border-b border-border/60 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Cancel Multiple Listings
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Select listings you want to cancel and return to your wallet
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isPending}
              className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {availableListings.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/60 px-6 py-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                No active listings
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You don't have any listings to cancel at the moment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={
                      selectedListingIds.size === availableListings.length &&
                      availableListings.length > 0
                    }
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  />
                  Select All ({availableListings.length})
                </label>
                <span className="text-xs text-muted-foreground">
                  {selectedListingIds.size} selected
                </span>
              </div>

              {availableListings.map((listing) => (
                <label
                  key={listing.listingId}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 transition hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedListingIds.has(listing.listingId)}
                      onChange={() => toggleListing(listing.listingId)}
                      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {listing.eventName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ticket #{listing.tokenId} • Listing #{listing.listingId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">
                      {(Number(listing.price) / 1e18).toFixed(4)} PC
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 px-6 py-5">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending || selectedListingIds.size === 0}
              className="flex-1 rounded-full bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Canceling..."
                : `Cancel ${selectedListingIds.size} listing${selectedListingIds.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
