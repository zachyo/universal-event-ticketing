import { useState } from 'react';
import { QrCode, ExternalLink, Tag, Calendar, MapPin } from 'lucide-react';
import type { FormattedTicket } from '../types';
import { formatDateTime, formatPrice, formatAddress } from '../lib/formatters';
import { QRCodeDisplay } from './QRCodeDisplay';


interface TicketCardProps {
  ticket: FormattedTicket;
  showQR?: boolean;
  showListButton?: boolean;
  onList?: (tokenId: number) => void;
}

export function TicketCard({ 
  ticket, 
  showQR = true, 
  showListButton = true,
  onList 
}: TicketCardProps) {
  const [showQRCode, setShowQRCode] = useState(false);

  const handleListTicket = () => {
    if (onList) {
      onList(ticket.tokenId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Ticket Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">
              {ticket.event?.name || `Event #${ticket.eventId}`}
            </h3>
            <p className="text-blue-100 text-sm">
              Ticket #{ticket.tokenId}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-100">Token ID</div>
            <div className="font-mono text-sm">{ticket.tokenId}</div>
          </div>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="p-4">
        {ticket.event && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span>{formatDateTime(ticket.event.startTime)}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span>{ticket.event.venue}</span>
            </div>
          </div>
        )}

        {/* Purchase Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Purchase Price</div>
              <div className="font-medium">{formatPrice(BigInt(ticket.purchasePrice))} ETH</div>
            </div>
            <div>
              <div className="text-gray-500">Chain</div>
              <div className="font-medium">{ticket.purchaseChain}</div>
            </div>
            <div>
              <div className="text-gray-500">Original Owner</div>
              <div className="font-mono text-xs">{formatAddress(ticket.originalOwner)}</div>
            </div>
            <div>
              <div className="text-gray-500">Status</div>
              <div className={`font-medium ${ticket.used ? 'text-red-600' : 'text-green-600'}`}>
                {ticket.used ? 'Used' : 'Valid'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {showQR && !ticket.used && (
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <QrCode className="w-4 h-4" />
              {showQRCode ? 'Hide QR' : 'Show QR'}
            </button>
          )}

          {showListButton && !ticket.used && (
            <button
              onClick={handleListTicket}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Tag className="w-4 h-4" />
              List for Sale
            </button>
          )}

          {ticket.tokenURI && (
            <a
              href={ticket.tokenURI}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Metadata
            </a>
          )}
        </div>

        {/* QR Code Display */}
        {showQRCode && !ticket.used && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
            <QRCodeDisplay
              tokenId={ticket.tokenId} 
              eventId={ticket.eventId}
              size={200}
            />
            <p className="text-xs text-gray-500 mt-2">
              Present this QR code at the event entrance
            </p>
          </div>
        )}

        {/* Used Ticket Notice */}
        {ticket.used && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
              This ticket has been used and is no longer valid for entry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Skeleton loader for TicketCard
export function TicketCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="bg-gray-300 p-4">
        <div className="flex justify-between">
          <div>
            <div className="h-5 bg-gray-400 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-400 rounded w-20"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-400 rounded w-16 mb-1"></div>
            <div className="h-4 bg-gray-400 rounded w-12"></div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3 mb-4">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="bg-gray-100 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-8 bg-gray-300 rounded"></div>
          <div className="flex-1 h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Grid container for ticket cards
export function TicketGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  );
}

// Empty state for when no tickets are found
export function TicketsEmptyState({ message = "No tickets found" }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
