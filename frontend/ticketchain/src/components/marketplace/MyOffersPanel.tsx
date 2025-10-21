import { useState, useMemo } from "react";
import { MessageCircle, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { useAccount } from "wagmi";
import { useOffers, useUserOffers, type Offer } from "../../hooks/useOffers";
import { OfferCard } from "./OfferCard";

type OfferTab = "made" | "received";
type OfferStatusFilter = "all" | "active" | "expired";

export function MyOffersPanel() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<OfferTab>("made");
  const [statusFilter, setStatusFilter] = useState<OfferStatusFilter>("active");

  const { acceptOffer, cancelOffer, isWritePending, isConfirming } =
    useOffers();

  const { offers: userOffers, isLoading } = useUserOffers(address);

  // Split offers into made and received
  const { offersMade, offersReceived } = useMemo(() => {
    if (!userOffers || !address) {
      return { offersMade: [], offersReceived: [] };
    }

    const made = userOffers.filter(
      (offer: Offer) => offer.offerer.toLowerCase() === address.toLowerCase()
    );
    const received = userOffers.filter(
      (offer: Offer) => offer.offerer.toLowerCase() !== address.toLowerCase()
    );

    return { offersMade: made, offersReceived: received };
  }, [userOffers, address]);

  // Apply status filter
  const filteredOffers = useMemo(() => {
    const offers = activeTab === "made" ? offersMade : offersReceived;

    if (statusFilter === "all") return offers;

    const now = Math.floor(Date.now() / 1000);

    return offers.filter((offer: Offer) => {
      const isExpired = offer.expiresAt > 0 && offer.expiresAt < now;

      if (statusFilter === "active") {
        return offer.active && !isExpired;
      } else {
        return !offer.active || isExpired;
      }
    });
  }, [activeTab, offersMade, offersReceived, statusFilter]);

  const stats = useMemo(() => {
    return {
      totalMade: offersMade.length,
      activeMade: offersMade.filter((o: Offer) => o.active).length,
      totalReceived: offersReceived.length,
      activeReceived: offersReceived.filter((o: Offer) => o.active).length,
    };
  }, [offersMade, offersReceived]);

  if (!address) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-600">Connect your wallet to view your offers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.totalMade}
          </div>
          <div className="text-sm text-gray-600">Offers Made</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.activeMade}
          </div>
          <div className="text-sm text-gray-600">Active Made</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.totalReceived}
          </div>
          <div className="text-sm text-gray-600">Offers Received</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {stats.activeReceived}
          </div>
          <div className="text-sm text-gray-600">Active Received</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("made")}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === "made"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Offers Made ({stats.totalMade})
          </button>
          <button
            onClick={() => setActiveTab("received")}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === "received"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <TrendingDown className="w-4 h-4 inline mr-2" />
            Offers Received ({stats.totalReceived})
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Status:</span>
        </div>
        <div className="flex gap-2">
          {["all", "active", "expired"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as OfferStatusFilter)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Offers List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading offers...</p>
        </div>
      ) : filteredOffers.length > 0 ? (
        <div className="grid gap-4">
          {filteredOffers.map((offer: Offer) => (
            <OfferCard
              key={offer.offerId.toString()}
              offer={offer}
              isOwner={activeTab === "received"}
              isOfferer={activeTab === "made"}
              onAccept={() => acceptOffer(offer.offerId)}
              onCancel={() => cancelOffer(offer.offerId)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {statusFilter !== "all" && `${statusFilter} `}offers{" "}
            {activeTab === "made" ? "made" : "received"}
          </h3>
          <p className="text-gray-600">
            {activeTab === "made"
              ? "Make offers on marketplace listings to see them here"
              : "Your listings don't have any offers yet"}
          </p>
        </div>
      )}

      {/* Loading Overlay */}
      {(isWritePending || isConfirming) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-700">
              {isWritePending ? "Preparing transaction..." : "Confirming..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
