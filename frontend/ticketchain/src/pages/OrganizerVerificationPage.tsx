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

        const executorInfo =
          await PushChain.utils.account.convertOriginToExecutor(
            universalAccount,
            { onlyCompute: true }
          );

        const executorAddress = executorInfo.address;
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
      <div className="container flex min-h-screen items-center justify-center px-4 py-16">
        <div className="glass-card w-full max-w-lg rounded-[2rem] border border-border bg-card p-8 text-center shadow-xl">
          {isResolvingAddress ? (
            <>
              <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                Verifying organizer access
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Sit tight while we map your wallet to its Push executor
                address.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <AlertCircle className="h-9 w-9" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                Connect your organizer wallet
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Link the wallet tied to your event so you can securely verify
                ticket holders.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="glass-card rounded-[2.25rem] border border-border bg-card p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
                Ticket verification hub
              </h1>
              <p className="text-sm text-muted-foreground">
                Scan attendee QR codes, confirm ownership, and mark entry on
                chain in real time.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-[1.5rem] border border-border/60 bg-background/70 px-4 py-3 text-xs text-muted-foreground">
            Organizer wallet:&nbsp;
            <span className="font-mono text-foreground">
              {organizerAddress.slice(0, 6)}…{organizerAddress.slice(-4)}
            </span>
          </div>
        </div>

        <div className="glass-card rounded-[2.25rem] border border-border/70 bg-card/90 p-6 md:p-8">
          <QRScanner
            onScan={handleScan}
            onError={(error) => console.error("Scanner error:", error)}
          />

          {isVerifying && (
            <div className="mt-6 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Verifying ticket...
              </p>
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

        <div className="glass-card mt-6 rounded-[2rem] border border-primary/30 bg-primary/10 p-6 text-foreground">
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            How to verify tickets
          </h3>
          <ol className="mt-3 space-y-2 text-xs">
            <li>1. Tap “Start scanning” inside the QR component to enable your camera.</li>
            <li>2. Center the attendee’s QR code within the frame—verification runs instantly.</li>
            <li>3. Green success means grant entry; red alerts flag used or mismatched tickets.</li>
            <li>4. Each successful scan locks the ticket, preventing re-entry attempts.</li>
            <li>5. Need to reset? Hit “Clear” in the result modal and scan the next guest.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
