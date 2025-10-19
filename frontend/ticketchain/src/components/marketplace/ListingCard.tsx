import { useState } from "react";
import {
  ShoppingCart,
  Tag,
  Calendar,
  MapPin,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import {
  formatPrice,
  formatDateTime,
  formatAddress,
} from "../../lib/formatters";
import type { FormattedListing } from "../../types";

interface ListingCardProps {
  listing: FormattedListing;
  onBuy: (listingId: number) => void;
  onMakeOffer?: (listing: FormattedListing) => void;
  onViewOffers?: (listing: FormattedListing) => void;
  isCurrentUser: boolean;
  offerCount?: number;
}

export function ListingCard({
  listing,
  onBuy,
  onMakeOffer,
  onViewOffers,
  isCurrentUser,
  offerCount = 0,
}: ListingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Listing Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg line-clamp-1">
              {listing.ticket?.event?.name ||
                `Event #${listing.ticket?.eventId}`}
            </h3>
            <p className="text-sm text-gray-600">Ticket #{listing.tokenId}</p>
          </div>
          <div className="text-right ml-3">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(BigInt(listing.price))} PC
            </div>
            <div className="text-xs text-gray-500">
              Listed {listing.createdAt.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      {listing.ticket?.event && (
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="line-clamp-1">
                {formatDateTime(listing.ticket.event.startTime)}
              </span>
            </div>
            {listing.ticket.event.venue && (
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">
                  {listing.ticket.event.venue}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seller Info & Offer Count */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between text-sm">
          <div className="flex-1 min-w-0">
            <span className="text-gray-500">Seller:</span>
            <span className="ml-2 font-mono text-xs">
              {formatAddress(listing.seller)}
            </span>
          </div>
          {isCurrentUser && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
              Your Listing
            </span>
          )}
        </div>

        {/* Offer Count Badge */}
        {offerCount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => onViewOffers?.(listing)}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>
                {offerCount} Active Offer{offerCount !== 1 ? "s" : ""}
              </span>
              {isCurrentUser && <TrendingUp className="w-3.5 h-3.5 ml-auto" />}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-2">
        {!isCurrentUser ? (
          <>
            <button
              onClick={() => onBuy(listing.listingId)}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                isHovered
                  ? "bg-green-600 text-white transform scale-105"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Buy Now
            </button>
            {onMakeOffer && (
              <button
                onClick={() => onMakeOffer(listing)}
                className="w-full py-2 px-4 border-2 border-purple-500 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors"
              >
                <Tag className="w-4 h-4 inline mr-2" />
                Make an Offer
              </button>
            )}
          </>
        ) : (
          <>
            <button
              className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              disabled
            >
              Your Listing
            </button>
            {offerCount > 0 && onViewOffers && (
              <button
                onClick={() => onViewOffers(listing)}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                View & Accept Offers
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="p-4 border-b">
        <div className="flex justify-between">
          <div>
            <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </div>
          <div>
            <div className="h-6 bg-gray-300 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      </div>
      <div className="p-4 border-b bg-gray-50">
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
      <div className="p-4 border-b">
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>
      <div className="p-4">
        <div className="h-8 bg-gray-300 rounded mb-2"></div>
        <div className="h-8 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}
