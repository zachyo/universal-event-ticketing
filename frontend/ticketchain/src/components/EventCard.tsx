import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, TrendingUp, AlertCircle, Ticket } from 'lucide-react';
import type { FormattedEvent } from '../types';
import type { EventWithTicketTypes } from '../hooks/useEventsWithTicketTypes';
import {
  formatDateTime,
  formatAvailability,
  getTimeUntilEvent,
  getEventStatus,
  formatPriceInCurrency
} from '../lib/formatters';

interface EventCardProps {
  event: FormattedEvent | EventWithTicketTypes;
  showPurchaseButton?: boolean;
}

// Type guard to check if event has ticket types
function hasTicketTypes(event: FormattedEvent | EventWithTicketTypes): event is EventWithTicketTypes {
  return 'ticketTypes' in event && 'minPrice' in event;
}

export function EventCard({ event, showPurchaseButton = true }: EventCardProps) {
  const status = getEventStatus(event);
  const timeUntil = getTimeUntilEvent(event.startTime);
  const availability = formatAvailability(event.sold, event.totalSupply);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isSoldOut = event.sold >= event.totalSupply;
  const isAlmostSoldOut = event.sold > event.totalSupply * 0.8 && !isSoldOut;
  const isPopular = event.sold > 50;
  
  // Extract ticket type info if available
  const eventWithTypes = hasTicketTypes(event) ? event : null;
  const minPrice = eventWithTypes?.minPrice;
  const ticketTypeCount = eventWithTypes?.ticketTypeCount || 0;
  const hasMultipleTiers = eventWithTypes?.hasMultipleTiers || false;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.imageUrl || '/placeholder-event.jpg'}
          alt={event.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-event.jpg';
          }}
        />
        
        {/* Status Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>

        {/* Sold Out Badge */}
        {isSoldOut && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Sold Out
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {event.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Event Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>{formatDateTime(event.startTime)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span className="truncate">{event.venue}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2 text-gray-400" />
            <span>{availability}</span>
          </div>

          {status === 'upcoming' && (
            <div className="flex items-center text-sm text-blue-600">
              <Clock className="w-4 h-4 mr-2 text-blue-400" />
              <span>{timeUntil}</span>
            </div>
          )}
        </div>

        {/* Pricing Section */}
        {minPrice !== null && minPrice !== undefined && minPrice > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Starting from</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPriceInCurrency(BigInt(minPrice), 'PC')}
                </p>
              </div>
              {hasMultipleTiers && ticketTypeCount > 1 && (
                <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                  <Ticket className="w-3 h-3" />
                  <span>{ticketTypeCount} tiers</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Popularity Indicators */}
        {(isAlmostSoldOut || isPopular) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {isAlmostSoldOut && (
              <div className="flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full border border-red-200">
                <AlertCircle className="w-3 h-3" />
                <span>Almost Sold Out</span>
              </div>
            )}
            {isPopular && (
              <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                <TrendingUp className="w-3 h-3" />
                <span>{event.sold} tickets sold</span>
              </div>
            )}
          </div>
        )}

        {/* Organizer */}
        <div className="text-xs text-gray-500 mb-4">
          Organized by {event.organizer.slice(0, 6)}...{event.organizer.slice(-4)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Link
            to={`/events/${event.eventId}`}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
          >
            View Details →
          </Link>

          {showPurchaseButton && status === 'upcoming' && !isSoldOut && (
            <Link
              to={`/events/${event.eventId}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get Tickets
            </Link>
          )}

          {isSoldOut && (
            <span className="text-red-600 font-medium text-sm">
              Sold Out
            </span>
          )}

          {status === 'ended' && (
            <span className="text-gray-500 font-medium text-sm">
              Event Ended
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for EventCard
export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-300"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        </div>
        <div className="h-4 bg-gray-300 rounded mb-4 w-1/4"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-300 rounded w-20"></div>
          <div className="h-8 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

// Grid container for event cards
export function EventGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  );
}

// Empty state for when no events are found
export function EventsEmptyState({ message = "No events found" }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Events</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
