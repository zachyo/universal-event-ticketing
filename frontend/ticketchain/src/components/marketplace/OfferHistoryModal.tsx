import { X, MessageCircle } from "lucide-react";
import { OfferCard } from "./OfferCard";
import { useOffers, type Offer } from "../../hooks/useOffers";
import { useAccount } from "wagmi";
import type { FormattedListing } from "../../types";

interface OfferHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: FormattedListing;
  onOfferAccepted?: () => void;
}

export function OfferHistoryModal({
  isOpen,
  onClose,
  listing,
}: OfferHistoryModalProps) {
  const { address } = useAccount();
  const {
    offers,
    isLoadingOffers: isLoading,
    acceptOffer,
    cancelOffer,
  } = useOffers(BigInt(listing.tokenId));

  const isOwner = address?.toLowerCase() === listing.seller.toLowerCase();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Offers History</h2>
            <p className="text-sm text-gray-600 mt-1">
              Ticket #{listing.tokenId} •{" "}
              {listing.ticket?.event?.name ||
                `Event #${listing.ticket?.eventId}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading offers...</p>
            </div>
          ) : !offers || offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Active Offers
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                This listing doesn't have any active offers yet. Share the
                listing to get more exposure!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {offers.length} active offer{offers.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-4">
                {offers.map((offer: Offer) => (
                  <OfferCard
                    key={offer.offerId.toString()}
                    offer={offer}
                    isOwner={isOwner}
                    isOfferer={
                      address?.toLowerCase() === offer.offerer.toLowerCase()
                    }
                    onAccept={() => acceptOffer(offer.offerId)}
                    onCancel={() => cancelOffer(offer.offerId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {isOwner
                ? "Accept an offer to complete the sale"
                : "You can cancel your own offers anytime"}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
