import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { MARKETPLACE_ADDRESS, TicketMarketplaceABI } from "../lib/contracts";

export interface BatchListingItem {
  tokenId: bigint;
  price: string; // ETH string value
}

export function useBatchListing() {
  const [isPreparing, setIsPreparing] = useState(false);

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  const batchListTickets = async (items: BatchListingItem[]) => {
    if (items.length === 0) {
      throw new Error("No tickets to list");
    }

    setIsPreparing(true);

    try {
      const tokenIds = items.map((item) => item.tokenId);
      const prices = items.map((item) => parseEther(item.price));

      writeContract({
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: TicketMarketplaceABI,
        functionName: "batchListTickets",
        args: [tokenIds, prices],
      });
    } catch (error) {
      console.error("Error preparing batch listing:", error);
      throw error;
    } finally {
      setIsPreparing(false);
    }
  };

  const batchCancelListings = async (listingIds: bigint[]) => {
    if (listingIds.length === 0) {
      throw new Error("No listings to cancel");
    }

    setIsPreparing(true);

    try {
      writeContract({
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: TicketMarketplaceABI,
        functionName: "batchCancelListings",
        args: [listingIds],
      });
    } catch (error) {
      console.error("Error preparing batch cancellation:", error);
      throw error;
    } finally {
      setIsPreparing(false);
    }
  };

  return {
    batchListTickets,
    batchCancelListings,
    isPreparing,
    isWritePending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError || confirmError,
  };
}
