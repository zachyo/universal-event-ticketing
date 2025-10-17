import { useState } from "react";
import { uploadJSONToIPFS } from "../lib/ipfs";
import { useSetTicketURI } from "./useContracts";
import type { FormattedEvent } from "../types";

interface GenerateMetadataParams {
  tokenId: number;
  event: FormattedEvent;
  ticketTypeName: string;
  purchasePrice: bigint;
  purchaseChain: string;
}

/**
 * Hook for automatically generating and uploading ticket metadata after purchase
 */
export function useAutoMetadata() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTicketURI, isPending: isSettingURI } = useSetTicketURI();

  const generateAndUploadMetadata = async (params: GenerateMetadataParams) => {
    const { tokenId, event, ticketTypeName, purchasePrice, purchaseChain } =
      params;

    setIsGenerating(true);
    setError(null);

    try {
      // 1. Create NFT metadata JSON
      const metadata = {
        name: `${event.name} - ${ticketTypeName} #${tokenId}`,
        description: `${event.description}\n\nVenue: ${
          event.venue
        }\nDate: ${event.startTime.toLocaleDateString()}\nTicket Type: ${ticketTypeName}`,
        image: event.imageUrl, // Use event poster as ticket image
        external_url: `${window.location.origin}/tickets/${tokenId}`,
        attributes: [
          {
            trait_type: "Event",
            value: event.name,
          },
          {
            trait_type: "Venue",
            value: event.venue,
          },
          {
            trait_type: "Event Date",
            value: event.startTime.toISOString(),
          },
          {
            trait_type: "Ticket Type",
            value: ticketTypeName,
          },
          {
            trait_type: "Token ID",
            value: tokenId,
            display_type: "number",
          },
          {
            trait_type: "Purchase Price (wei)",
            value: purchasePrice.toString(),
          },
          {
            trait_type: "Purchase Chain",
            value: purchaseChain,
          },
          {
            trait_type: "Event ID",
            value: event.eventId,
            display_type: "number",
          },
        ],
      };

      // 2. Upload metadata to IPFS
      const ipfsHash = await uploadJSONToIPFS(metadata);
      const tokenURI = `ipfs://${ipfsHash}`;

      // 3. Set tokenURI on-chain
      await setTicketURI(tokenId, tokenURI);

      return { success: true, ipfsHash, tokenURI };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate ticket metadata";
      setError(errorMessage);
      console.error("Metadata generation error:", err);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAndUploadMetadata,
    isGenerating: isGenerating || isSettingURI,
    error,
  };
}
