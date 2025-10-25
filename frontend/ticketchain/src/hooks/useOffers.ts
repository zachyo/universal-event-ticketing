import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseEther } from "viem";
import { MARKETPLACE_ADDRESS, TicketMarketplaceABI } from "../lib/contracts";

export interface Offer {
  offerId: bigint;
  tokenId: bigint;
  offerer: string;
  offerAmount: bigint;
  expiresAt: bigint;
  active: boolean;
  createdAt: bigint;
}

export function useOffers(tokenId?: bigint) {
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

  // Fetch active offers for a specific token
  const {
    data: offers,
    isLoading: isLoadingOffers,
    refetch: refetchOffers,
  } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI,
    functionName: "getActiveOffers",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  const makeOffer = async (
    tokenId: bigint,
    offerAmount: string,
    expiresInHours?: number
  ) => {
    setIsPreparing(true);

    try {
      const expiresAt = expiresInHours
        ? BigInt(Math.floor(Date.now() / 1000) + expiresInHours * 3600)
        : BigInt(0); // 0 means no expiration

      writeContract({
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: TicketMarketplaceABI,
        functionName: "makeOffer",
        args: [tokenId, expiresAt],
        value: parseEther(offerAmount),
      });
    } catch (error) {
      console.error("Error making offer:", error);
      throw error;
    } finally {
      setIsPreparing(false);
    }
  };

  const acceptOffer = async (offerId: bigint) => {
    setIsPreparing(true);

    try {
      writeContract({
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: TicketMarketplaceABI,
        functionName: "acceptOffer",
        args: [offerId],
      });
    } catch (error) {
      console.error("Error accepting offer:", error);
      throw error;
    } finally {
      setIsPreparing(false);
    }
  };

  const cancelOffer = async (offerId: bigint) => {
    setIsPreparing(true);

    try {
      writeContract({
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: TicketMarketplaceABI,
        functionName: "cancelOffer",
        args: [offerId],
      });
    } catch (error) {
      console.error("Error canceling offer:", error);
      throw error;
    } finally {
      setIsPreparing(false);
    }
  };

  // Refetch offers when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && tokenId !== undefined) {
      refetchOffers();
    }
  }, [isConfirmed, tokenId, refetchOffers]);

  return {
    offers: offers as Offer[] | undefined,
    isLoadingOffers,
    makeOffer,
    acceptOffer,
    cancelOffer,
    refetchOffers,
    isPreparing,
    isWritePending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError || confirmError,
  };
}

export function useUserOffers(userAddress?: string) {
  const {
    data: userOffers,
    isLoading,
    refetch,
  } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI,
    functionName: "getUserOffers",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    offers: userOffers as Offer[] | undefined,
    isLoading,
    refetch,
  };
}
