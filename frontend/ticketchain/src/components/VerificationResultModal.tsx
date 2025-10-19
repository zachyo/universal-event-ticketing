import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Ticket as TicketIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import type { QRCodeData } from "../hooks/useQRCode";
import { useMarkTicketAsUsed } from "../hooks/useMarkTicketAsUsed";
import { useEffect, useState } from "react";

interface VerificationDetails {
  isOwnerValid: boolean;
  isTicketUsed: boolean;
  isOrganizerValid: boolean;
  eventName?: string;
  ticketType?: string;
}

interface VerificationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "success" | "error" | "warning";
  message: string;
  data?: QRCodeData;
  details?: VerificationDetails;
}

export function VerificationResultModal({
  isOpen,
  onClose,
  status,
  message,
  data,
  details,
}: VerificationResultModalProps) {
  // Debug: Log when component renders
  console.log("VerificationResultModal rendering:", {
    isOpen,
    status,
    data,
    details,
  });

  const { markAsUsed, isMarking, isConfirmed, errorMessage } =
    useMarkTicketAsUsed();

  const [hasMarked, setHasMarked] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setHasMarked(false);
      setMarkError(null);
    }
  }, [isOpen]);

  // Handle successful marking
  useEffect(() => {
    if (isConfirmed && !hasMarked) {
      setHasMarked(true);
      setMarkError(null);
    }
  }, [isConfirmed, hasMarked]);

  // Handle errors
  useEffect(() => {
    if (errorMessage) {
      setMarkError(errorMessage);
    }
  }, [errorMessage]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent closing on backdrop click when marking is in progress
    if (isMarking) {
      e.stopPropagation();
      return;
    }
    // User must explicitly close
    e.stopPropagation();
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  // Handle grant entry action
  const handleGrantEntry = async () => {
    if (status === "success" && data && !isMarking && !hasMarked) {
      await markAsUsed(data.eventId, data.tokenId);
    }
  };

  // Handle button click
  const handleButtonClick = async () => {
    if (status === "success" && !hasMarked) {
      await handleGrantEntry();
    } else {
      onClose();
    }
  };

  // Debug logging
  console.log("VerificationResultModal Debug:", {
    isOpen,
    status,
    hasMarked,
    isMarking,
    data: data
      ? { tokenId: data.tokenId.toString(), eventId: data.eventId.toString() }
      : null,
  });

  // Status-based styling
  const statusConfig = {
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-500",
      textColor: "text-green-700",
      iconBgColor: "bg-green-100",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      buttonBg: "bg-green-600 hover:bg-green-700",
      buttonText: "Grant Entry & Continue",
    },
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-500",
      textColor: "text-red-700",
      iconBgColor: "bg-red-100",
      icon: XCircle,
      iconColor: "text-red-600",
      buttonBg: "bg-red-600 hover:bg-red-700",
      buttonText: "Deny Entry & Continue",
    },
    warning: {
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-500",
      textColor: "text-yellow-700",
      iconBgColor: "bg-yellow-100",
      icon: AlertCircle,
      iconColor: "text-yellow-600",
      buttonBg: "bg-yellow-600 hover:bg-yellow-700",
      buttonText: "Review & Continue",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border-4 ${config.borderColor} overflow-hidden flex flex-col`}
        onClick={handleModalClick}
      >
        {/* Header with Status */}
        <div
          className={`${config.bgColor} px-6 py-6 border-b-2 ${config.borderColor} flex-shrink-0`}
        >
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div
              className={`${config.iconBgColor} rounded-full p-4 mb-3 shadow-lg`}
            >
              <StatusIcon className={`w-12 h-12 ${config.iconColor}`} />
            </div>

            {/* Title */}
            <h2 className={`text-2xl font-bold ${config.textColor} mb-2`}>
              {message}
            </h2>

            {/* Subtitle based on status */}
            <p className="text-gray-600 text-sm">
              {status === "success" && "All verification checks passed"}
              {status === "error" && "Verification failed - Do not grant entry"}
              {status === "warning" &&
                "Verification warning - Review details carefully"}
            </p>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {/* Verification Checks */}
          {details && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Checks
              </h3>
              <div className="space-y-3">
                {/* Organizer Authorization */}
                <div
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    details.isOrganizerValid
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {details.isOrganizerValid ? (
                      <ShieldCheck className="w-6 h-6 text-green-600" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">
                        Organizer Authorization
                      </p>
                      <p className="text-sm text-gray-600">
                        {details.isOrganizerValid
                          ? "You are authorized for this event"
                          : "You are NOT the event organizer"}
                      </p>
                    </div>
                  </div>
                  {details.isOrganizerValid ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>

                {/* Owner Verification */}
                <div
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    details.isOwnerValid
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        Owner Verification
                      </p>
                      <p className="text-sm text-gray-600">
                        {details.isOwnerValid
                          ? "QR code owner matches blockchain"
                          : "Owner mismatch - ticket may have been transferred"}
                      </p>
                    </div>
                  </div>
                  {details.isOwnerValid ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  )}
                </div>

                {/* Usage Status */}
                <div
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    !details.isTicketUsed
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TicketIcon className="w-6 h-6 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        Ticket Status
                      </p>
                      <p className="text-sm text-gray-600">
                        {!details.isTicketUsed
                          ? "Ticket is unused and valid"
                          : "Ticket has already been used"}
                      </p>
                    </div>
                  </div>
                  {!details.isTicketUsed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ticket Information */}
          {data && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Ticket Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <TicketIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Ticket ID</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    #{data.tokenId.toString()}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Event ID</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    #{data.eventId.toString()}
                  </p>
                </div>

                <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Ticket Holder</span>
                  </div>
                  <p className="text-xs font-mono text-gray-900 break-all">
                    {data.owner}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message Display */}
        {markError && (
          <div className="px-6 py-4 bg-red-50 border-t border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Failed to mark ticket as used</p>
                <p className="text-sm">{markError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer with Action Button - Fixed at bottom */}
        <div className="px-6 py-4 bg-gray-50 border-t flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Action Indicator */}
            <div className="text-sm text-gray-600 text-center sm:text-left">
              {status === "success" && !hasMarked && (
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Verified - Ready to grant entry</span>
                </p>
              )}
              {status === "success" && hasMarked && (
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">
                    ✅ Entry Granted - Ticket Marked as Used
                  </span>
                </p>
              )}
              {status === "success" && isMarking && (
                <p className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Marking ticket as used...</span>
                </p>
              )}
              {status === "error" && (
                <p className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Failed - Do NOT allow entry</span>
                </p>
              )}
              {status === "warning" && (
                <p className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span>Warning - Use caution</span>
                </p>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleButtonClick}
              disabled={isMarking}
              className={`w-full sm:w-auto px-6 py-3 ${
                isMarking
                  ? "bg-gray-400 cursor-not-allowed"
                  : hasMarked
                  ? "bg-blue-600 hover:bg-blue-700"
                  : config.buttonBg
              } text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2`}
            >
              {isMarking && <Loader2 className="w-4 h-4 animate-spin" />}
              {isMarking
                ? "Marking as Used..."
                : hasMarked
                ? "Close & Continue"
                : status === "success"
                ? "Grant Entry & Mark as Used"
                : config.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
