import { useState } from "react";
import { usePushChain, usePushChainClient } from "@pushchain/ui-kit";
import { TICKET_FACTORY_ADDRESS, TicketFactoryABI } from "../lib/contracts";

/**
 * Hook for marking a ticket as used (validated) by the event organizer
 *
 * This function calls TicketFactory.validateTicket(eventId, tokenId)
 * which:
 * 1. Verifies caller is the event organizer
 * 2. Verifies ticket belongs to the event
 * 3. Calls TicketNFT.validateTicket to mark ticket.used = true
 * 4. Emits TicketValidated event
 *
 * After successful marking, the ticket cannot be used again.
 */
export function useMarkTicketAsUsed() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();

  const [isMarking, setIsMarking] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  /**
   * Mark a ticket as used
   * @param eventId The event ID the ticket belongs to
   * @param tokenId The ticket token ID
   */
  const markAsUsed = async (eventId: bigint, tokenId: bigint) => {
    if (!pushChainClient || !PushChain) {
      setError(new Error("Push Chain client not available"));
      return;
    }

    try {
      // Reset state
      setIsMarking(true);
      setIsConfirmed(false);
      setError(null);
      setTransactionHash(null);


      // Call validateTicket on TicketFactory via Push Chain
      const tx = await pushChainClient.universal.sendTransaction({
        to: TICKET_FACTORY_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketFactoryABI),
          functionName: "validateTicket",
          args: [eventId, tokenId],
        }),
      });

      setTransactionHash(tx.hash);

      // Wait for transaction confirmation
      await tx.wait();

      setIsConfirmed(true);
    } catch (err) {
      console.error("Error marking ticket as used:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to mark ticket as used")
      );
    } finally {
      setIsMarking(false);
    }
  };

  // Get error message
  const getErrorMessage = (): string | null => {
    if (!error) return null;

    const errorMessage = error.message.toLowerCase();

    if (
      errorMessage.includes("user rejected") ||
      errorMessage.includes("user denied")
    ) {
      return "Transaction cancelled by user";
    } else if (errorMessage.includes("insufficient funds")) {
      return "Insufficient funds for gas fee";
    } else if (errorMessage.includes("notorganizer")) {
      return "You are not the event organizer";
    } else if (errorMessage.includes("ticketused")) {
      return "Ticket already marked as used";
    } else if (errorMessage.includes("invalidevent")) {
      return "Invalid event - ticket does not belong to this event";
    }
    return error.message || "Failed to mark ticket as used";
  };

  const reset = () => {
    setIsMarking(false);
    setIsConfirmed(false);
    setError(null);
    setTransactionHash(null);
  };

  return {
    markAsUsed,
    isMarking,
    isConfirmed,
    error,
    errorMessage: getErrorMessage(),
    transactionHash,
    reset,
  };
}
