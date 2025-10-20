import { useState, useRef } from "react";
import {
  QrCode,
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  Scan,
  Upload,
  RefreshCw,
} from "lucide-react";
import { useTicketDetails, useValidateTicket } from "../hooks/useContracts";
import { usePushWalletContext } from "@pushchain/ui-kit";
import {
  validateQRCodeData,
  formatAddress,
} from "../lib/formatters";
import type { TicketNFT } from "../types";

interface TicketValidationResult {
  valid: boolean;
  tokenId?: number;
  eventId?: number;
  ticket?: TicketNFT;
  error?: string;
}

const VerifyPage = () => {
  const { connectionStatus } = usePushWalletContext();
  const { validateTicket, isPending: isValidating } = useValidateTicket();

  const [qrData, setQrData] = useState("");
  const [validationResult, setValidationResult] =
    useState<TicketValidationResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tokenId = validationResult?.tokenId ?? 0;
  const eventId = validationResult?.eventId ?? 0;
  const hasValidScan = Boolean(
    validationResult?.valid && tokenId > 0 && eventId > 0
  );

  const {
    ticketDetails,
    isLoading: isLoadingTicket,
    refetch: refetchTicketDetails,
  } = useTicketDetails(tokenId, { enabled: hasValidScan });

  const handleQRScan = async (data: string) => {
    setQrData(data);

    // Validate QR code format
    const qrValidation = validateQRCodeData(data);
    if (!qrValidation.valid) {
      setValidationResult({
        valid: false,
        error: qrValidation.error || "Invalid QR code format",
      });
      return;
    }

    const { tokenId, eventId } = qrValidation.data;
    setValidationResult({
      valid: true,
      tokenId: parseInt(tokenId),
      eventId: parseInt(eventId),
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrData.trim()) {
      handleQRScan(qrData.trim());
    }
  };

  const handleValidateTicket = async () => {
    if (
      !validationResult?.tokenId ||
      validationResult.eventId === undefined ||
      connectionStatus !== "connected"
    ) {
      return;
    }

    try {
      await validateTicket(validationResult.eventId, validationResult.tokenId);
      if (refetchTicketDetails) {
        await refetchTicketDetails();
      }

      // Refresh validation result
      setValidationResult((prev) => {
        if (!prev) return prev;
        const updatedTicket = ticketDetails
          ? { ...ticketDetails, used: true }
          : prev.ticket;
        return { ...prev, ticket: updatedTicket };
      });
    } catch (error) {
      console.error("Failed to validate ticket:", error);
      alert("Failed to validate ticket. Please try again.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real implementation, you would use a QR code reader library
    // to extract QR code data from the uploaded image
    alert(
      "QR code scanning from images is not implemented in this demo. Please use manual input."
    );
  };

  const resetValidation = () => {
    setValidationResult(null);
    setQrData("");
    setIsScanning(false);
    setManualInput(false);
  };

  if (connectionStatus !== "connected") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-6">
            You need to connect your wallet to verify tickets.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Ticket Verification
          </h1>
          <p className="text-gray-600">
            Scan or enter QR code data to verify and validate event tickets
          </p>
        </div>

        {!validationResult ? (
          /* QR Code Input Section */
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Scan Ticket QR Code</h2>
              <p className="text-gray-600">
                Choose how you'd like to input the QR code data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Camera Scan */}
              <div className="text-center">
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Camera Scan</h3>
                  <p className="text-sm text-gray-600">
                    Use your device camera
                  </p>
                </button>
              </div>

              {/* Upload Image */}
              <div className="text-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Upload Image</h3>
                  <p className="text-sm text-gray-600">Select QR code image</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Manual Input */}
              <div className="text-center">
                <button
                  onClick={() => setManualInput(true)}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Scan className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Manual Input</h3>
                  <p className="text-sm text-gray-600">Type QR code data</p>
                </button>
              </div>
            </div>

            {/* Manual Input Form */}
            {manualInput && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-4">Enter QR Code Data</h3>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR Code Data (JSON format)
                    </label>
                    <textarea
                      value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder='{"tokenId":"123","eventId":"456","timestamp":1234567890,"signature":"abc123"}'
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setManualInput(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Verify QR Code
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Camera Scanner Placeholder */}
            {isScanning && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Camera Scanner</h3>
                <p className="text-gray-600 mb-4">
                  Camera scanning is not implemented in this demo. Please use
                  manual input instead.
                </p>
                <button
                  onClick={() => setIsScanning(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Close Scanner
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Validation Result Section */
          <div className="space-y-6">
            {/* Result Header */}
            <div
              className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                validationResult.valid ? "border-green-500" : "border-red-500"
              }`}
            >
              <div className="flex items-center">
                {validationResult.valid ? (
                  <CheckCircle className="w-8 h-8 text-green-500 mr-4" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500 mr-4" />
                )}
                <div>
                  <h2 className="text-xl font-bold">
                    {validationResult.valid
                      ? "Valid QR Code"
                      : "Invalid QR Code"}
                  </h2>
                  <p className="text-gray-600">
                    {validationResult.valid
                      ? "QR code format is valid. Loading ticket details..."
                      : validationResult.error}
                  </p>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            {validationResult.valid && validationResult.tokenId && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">Ticket Details</h3>

                {isLoadingTicket ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  </div>
                ) : ticketDetails ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Token Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-600">Token ID:</span>{" "}
                            {validationResult.tokenId}
                          </p>
                          <p>
                            <span className="text-gray-600">Event ID:</span>{" "}
                            {validationResult.eventId}
                          </p>
                          <p>
                            <span className="text-gray-600">
                              Original Owner:
                            </span>{" "}
                            {formatAddress(ticketDetails.originalOwner)}
                          </p>
                          <p>
                            <span className="text-gray-600">
                              Current Owner:
                            </span>{" "}
                            {formatAddress(ticketDetails.currentOwner)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Ticket Status
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-600">Status:</span>
                            <span
                              className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                ticketDetails.used
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {ticketDetails.used ? "Used" : "Valid"}
                            </span>
                          </p>
                          <p>
                            <span className="text-gray-600">
                              Purchase Price:
                            </span>{" "}
                            {Number(ticketDetails.purchasePrice) / 1e18} ETH
                          </p>
                          <p>
                            <span className="text-gray-600">
                              Purchase Chain:
                            </span>{" "}
                            {ticketDetails.purchaseChain}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Validation Action */}
                    {!ticketDetails.used && (
                      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-yellow-800">
                              Ready to Validate
                            </h4>
                            <p className="text-sm text-yellow-700">
                              This ticket is valid and can be marked as used for
                              event entry.
                            </p>
                          </div>
                          <button
                            onClick={handleValidateTicket}
                            disabled={isValidating}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                          >
                            {isValidating ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Validating...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Mark as Used
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {ticketDetails.used && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <XCircle className="w-5 h-5 text-red-500 mr-3" />
                          <div>
                            <h4 className="font-medium text-red-800">
                              Ticket Already Used
                            </h4>
                            <p className="text-sm text-red-700">
                              This ticket has already been validated and cannot
                              be used again.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h4 className="font-medium text-red-800 mb-2">
                      Ticket Not Found
                    </h4>
                    <p className="text-red-700">
                      No ticket found with ID {validationResult.tokenId}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center">
              <button
                onClick={resetValidation}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Scan Another Ticket
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPage;
