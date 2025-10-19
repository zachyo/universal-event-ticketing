import { X, Calendar, MapPin, Clock, Ticket as TicketIcon } from "lucide-react";
import { QRCodeDisplay } from "./QRCodeDisplay";
import type { FormattedTicket } from "../types";
import { formatDateTime, formatPriceWithCurrency } from "../lib/formatters";

interface ViewQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: FormattedTicket;
}

export function ViewQRModal({ isOpen, onClose, ticket }: ViewQRModalProps) {
  if (!isOpen) return null;

  const event = ticket.event;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal when clicking the backdrop
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Stop propagation to prevent backdrop click from closing
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Ticket QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Code Display */}
          <div className="flex justify-center mb-6">
            {ticket.currentOwner ? (
              <QRCodeDisplay
                tokenId={BigInt(ticket.tokenId)}
                eventId={BigInt(ticket.eventId)}
                owner={ticket.currentOwner}
                size="lg"
                showDownload={true}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-red-600 font-semibold">
                  Unable to generate QR code
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Owner information is missing. Please try refreshing your
                  tickets.
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <TicketIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  How to use this ticket
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Show this QR code at the event entrance</li>
                  <li>• Organizers will scan to verify authenticity</li>
                  <li>• Download the QR code for offline access</li>
                  <li>• Do not share this QR code with others</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Ticket Details
            </h3>

            {/* Event Info */}
            {event && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <TicketIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Event</p>
                    <p className="text-base font-semibold text-gray-900">
                      {event.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-base text-gray-900">
                      {formatDateTime(event.startTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Time</p>
                    <p className="text-base text-gray-900">
                      {event.startTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {event.venue && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Venue</p>
                      <p className="text-base text-gray-900">{event.venue}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Ticket Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Token ID
                </p>
                <p className="text-base font-mono text-gray-900">
                  #{ticket.tokenId}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Ticket Type
                </p>
                <p className="text-base text-gray-900 capitalize">
                  Type #{ticket.ticketTypeId}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Purchase Price
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {formatPriceWithCurrency(ticket.purchasePrice)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    ticket.ticketStatus === "used"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {ticket.ticketStatus === "used" ? "Used" : "Valid"}
                </span>
              </div>
            </div>

            {/* Owner Address */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Owner</p>
              <p className="text-xs font-mono text-gray-600 break-all">
                {ticket.currentOwner}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              QR codes are valid for 24 hours and regenerate automatically
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
