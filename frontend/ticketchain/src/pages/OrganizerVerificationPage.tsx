import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { QRScanner } from "../components/QRScanner";
import { VerificationResultModal } from "../components/VerificationResultModal";
import { verifyQRCodeData, type QRCodeData } from "../hooks/useQRCode";
import {
  TICKET_NFT_ADDRESS,
  TicketNFTABI,
  TICKET_FACTORY_ADDRESS,
  TicketFactoryABI,
} from "../lib/contracts";
import { AlertCircle, Scan } from "lucide-react";
import { usePushWalletContext, usePushChain } from "@pushchain/ui-kit";
import { useValidateTicket } from "../hooks/useContracts";

interface VerificationResult {
  status: "success" | "error" | "warning";
  message: string;
  data?: QRCodeData;
  details?: {
    isOwnerValid: boolean;
    isTicketUsed: boolean;
    isOrganizerValid: boolean;
    eventName?: string;
    ticketType?: string;
  };
}

interface EventDataType {
  eventId: bigint;
  organizer: string;
  name: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  venue: string;
  imageIpfsHash: string;
  totalSupply: bigint;
  sold: bigint;
  active: boolean;
  royaltyBps: bigint;
}

export function OrganizerVerificationPage() {
  const { address: originAddress } = useAccount();
  const { universalAccount } = usePushWalletContext();
  const { PushChain } = usePushChain();
  const { validateTicket, isPending: isMarkingUsed } = useValidateTicket();

  const [organizerAddress, setOrganizerAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [scannedData, setScannedData] = useState<QRCodeData | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Resolve Push Chain executor address (UEA) from origin address
  useEffect(() => {
    const resolveExecutorAddress = async () => {
      if (!universalAccount || !PushChain) {
        // Fallback to origin address if Push Chain is not available
        setOrganizerAddress(originAddress || null);
        return;
      }

      setIsResolvingAddress(true);
      try {
        console.log(
          "Resolving organizer UEA from origin:",
          universalAccount.address
        );

        const executorInfo =
          await PushChain.utils.account.convertOriginToExecutor(
            universalAccount,
            { onlyCompute: true }
          );

        const executorAddress = executorInfo.address;
        console.log("Resolved organizer UEA:", executorAddress);
        setOrganizerAddress(executorAddress);
      } catch (error) {
        console.error("Failed to resolve executor address:", error);
        // Fallback to origin address
        setOrganizerAddress(originAddress || null);
      } finally {
        setIsResolvingAddress(false);
      }
    };

    resolveExecutorAddress();
  }, [universalAccount, PushChain, originAddress]);

  // Read ticket details from contract
  const { data: ticketDetails, isLoading: isLoadingTicket } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "ticketDetails",
    args: scannedData ? [scannedData.tokenId] : undefined,
    query: {
      enabled: !!scannedData,
    },
  });

  // Read current owner
  const { data: currentOwner, isLoading: isLoadingOwner } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "ownerOf",
    args: scannedData ? [scannedData.tokenId] : undefined,
    query: {
      enabled: !!scannedData,
    },
  });

  // Read event details to verify organizer
  const { data: eventDetails, isLoading: isLoadingEvent } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI,
    functionName: "getEvent",
    args: scannedData ? [scannedData.eventId] : undefined,
    query: {
      enabled: !!scannedData,
    },
  });

  const handleScan = async (decodedText: string) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Step 1: Verify QR code format and signature
      const qrVerification = verifyQRCodeData(decodedText);

      if (!qrVerification.isValid) {
        setVerificationResult({
          status: "error",
          message: qrVerification.error || "Invalid QR code",
        });
        setIsVerifying(false);
        return;
      }

      setScannedData(qrVerification.data!);

      // Wait a bit for contract reads to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      setVerificationResult({
        status: "error",
        message: error instanceof Error ? error.message : "Verification failed",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify contract data when it's available
  useEffect(() => {
    if (
      scannedData &&
      ticketDetails &&
      currentOwner &&
      eventDetails &&
      !isLoadingTicket &&
      !isLoadingOwner &&
      !isLoadingEvent
    ) {
      const details = ticketDetails as [
        bigint,
        bigint,
        string,
        bigint,
        bigint,
        boolean,
        bigint
      ];
      const [eventId, , , , , isUsed] = details;

      // Debug: Log all data
      console.log("Verification Data:", {
        ticketDetails: details,
        eventDetails,
        currentOwner,
        scannedData,
        organizerAddress,
      });

      // Parse event details - wagmi returns struct as object with named fields
      // Structure: { eventId, organizer, name, description, startTime, endTime, venue, imageIpfsHash, totalSupply, sold, active, royaltyBps }
      const eventOrganizer = (eventDetails as EventDataType | undefined)
        ?.organizer;

      // Safety check - if we don't have organizer data, fail verification
      if (!eventOrganizer) {
        console.error(
          "Event organizer data missing. EventDetails:",
          eventDetails
        );
        setVerificationResult({
          status: "error",
          message:
            "Unable to verify organizer - Event data not loaded yet. Please try again.",
        });
        return;
      }

      // Debug: Log owner comparison
      console.log("Owner Verification:", {
        currentOwnerFromContract: currentOwner,
        ownerFromQRCode: scannedData.owner,
        areEqual:
          (currentOwner as string)?.toLowerCase() ===
          scannedData.owner?.toLowerCase(),
      });

      const isOwnerValid =
        currentOwner && scannedData.owner
          ? (currentOwner as string)?.toLowerCase() ===
            scannedData.owner?.toLowerCase()
          : false;
      const isEventMatch = eventId === scannedData.eventId;
      const isOrganizerValid =
        organizerAddress?.toLowerCase() === eventOrganizer?.toLowerCase();

      // Critical: Check if scanner is the event organizer
      if (!isOrganizerValid) {
        setVerificationResult({
          status: "error",
          message: "Unauthorized! You are not the organizer of this event.",
          data: scannedData,
          details: {
            isOwnerValid,
            isTicketUsed: isUsed,
            isOrganizerValid: false,
          },
        });
      } else if (isUsed) {
        setVerificationResult({
          status: "error",
          message: "Ticket has already been used!",
          data: scannedData,
          details: {
            isOwnerValid,
            isTicketUsed: true,
            isOrganizerValid: true,
          },
        });
      } else if (!isOwnerValid) {
        setVerificationResult({
          status: "warning",
          message: "Owner mismatch! Ticket may have been transferred.",
          data: scannedData,
          details: {
            isOwnerValid: false,
            isTicketUsed: false,
            isOrganizerValid: true,
          },
        });
      } else if (!isEventMatch) {
        setVerificationResult({
          status: "error",
          message: "Event ID mismatch! Wrong event.",
          data: scannedData,
          details: {
            isOwnerValid: true,
            isTicketUsed: false,
            isOrganizerValid: true,
          },
        });
      } else {
        setVerificationResult({
          status: "success",
          message: "Valid ticket! Entry permitted.",
          data: scannedData,
          details: {
            isOwnerValid: true,
            isTicketUsed: false,
            isOrganizerValid: true,
          },
        });
      }
    }
  }, [
    scannedData,
    ticketDetails,
    currentOwner,
    eventDetails,
    isLoadingTicket,
    isLoadingOwner,
    isLoadingEvent,
    organizerAddress,
  ]);

  const resetVerification = () => {
    setVerificationResult(null);
    setScannedData(null);
  };

  if (!organizerAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {isResolvingAddress ? (
            <>
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Resolving Address
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your organizer credentials on Push
                Chain...
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connect Wallet
              </h2>
              <p className="text-gray-600">
                Please connect your wallet to access the ticket verification
                system.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Scan className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Ticket Verification
            </h1>
          </div>
          <p className="text-gray-600">
            Scan ticket QR codes to verify authenticity and grant entry
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>
              Organizer: {organizerAddress.slice(0, 6)}...
              {organizerAddress.slice(-4)}
            </p>
          </div>
        </div>

        {/* Scanner Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <QRScanner
            onScan={handleScan}
            onError={(error) => console.error("Scanner error:", error)}
          />

          {isVerifying && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Verifying ticket...</p>
            </div>
          )}
        </div>

        {/* Verification Result Modal */}
        <VerificationResultModal
          isOpen={!!verificationResult}
          onClose={resetVerification}
          status={verificationResult?.status || "error"}
          message={verificationResult?.message || ""}
          data={verificationResult?.data}
          details={verificationResult?.details}
        />

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Click "Start Scanning" to activate the camera</li>
            <li>Point the camera at the ticket holder's QR code</li>
            <li>Wait for automatic verification</li>
            <li>Grant entry if verification is successful (green)</li>
            <li>Deny entry if ticket is used or invalid (red)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
