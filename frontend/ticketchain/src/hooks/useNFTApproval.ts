import { useState, useEffect } from "react";
import { usePushWalletContext, usePushChain, usePushChainClient } from "@pushchain/ui-kit";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { readContract } from "viem/actions";
import { TICKET_NFT_ADDRESS, MARKETPLACE_ADDRESS, TicketNFTABI } from "../lib/contracts";
import {
  toastLoading,
  toastDismiss,
  toastSuccess,
  toastError,
} from "../lib/toast";

/**
 * Hook to check and manage NFT approval for marketplace listing
 *
 * IMPORTANT: Uses Push Chain UEA (Universal Executor Account) for approval checks,
 * NOT the origin address. This is critical because smart contracts on Push Chain
 * see the UEA as msg.sender, not the wallet's origin address.
 *
 * @param tokenId - The NFT token ID to check approval for
 * @returns approval status, loading states, and approve function
 */
export function useNFTApproval(tokenId?: bigint) {
  const { universalAccount } = usePushWalletContext();
  const { PushChain } = usePushChain();
  const { address: originAddress } = useAccount();
  const { pushChainClient } = usePushChainClient();

  const [userUEA, setUserUEA] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalRefreshKey, setApprovalRefreshKey] = useState(0);

  // Step 1: Resolve user's UEA from origin address
  useEffect(() => {
    let cancelled = false;

    const resolveUEA = async () => {
      if (!PushChain || !universalAccount) {
        // Fallback to origin address if Push Chain not available
        if (!cancelled) {
          setUserUEA(originAddress || null);
        }
        return;
      }

      try {
        const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
          universalAccount,
          { onlyCompute: true }
        );

        if (!cancelled) {
          setUserUEA(executorInfo.address);
        }
      } catch (err) {
        console.error("Failed to resolve UEA:", err);
        if (!cancelled) {
          setUserUEA(originAddress || null);
        }
      }
    };

    resolveUEA();

    return () => {
      cancelled = true;
    };
  }, [PushChain, universalAccount, originAddress]);

  // Step 2: Use wagmi's useReadContract to check approval status
  const {
    data: approvedAddress,
    isLoading: isCheckingApproval,
    error: approvalError,
    refetch,
  } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "getApproved",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
      // Add refresh key to force refetch after approval
      queryKey: ["nft-approval", tokenId?.toString(), approvalRefreshKey],
    },
  });

  // Check if marketplace is approved
  const isApproved =
    !!approvedAddress &&
    typeof approvedAddress === "string" &&
    approvedAddress.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase();

  /**
   * Approve marketplace to transfer this specific NFT
   * This is the first step in the listing flow
   */
  const approve = async () => {
    if (!pushChainClient || !PushChain || !tokenId) {
      throw new Error("Push Chain client not available or token ID not provided");
    }

    let toastId: string | undefined;

    try {
      setIsApproving(true);

      toastId = toastLoading("Approving marketplace to list your ticket...");

      // Send approval transaction
      const approvalTx = await pushChainClient.universal.sendTransaction({
        to: TICKET_NFT_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketNFTABI),
          functionName: "approve",
          args: [MARKETPLACE_ADDRESS, tokenId],
        }),
      });

      // Wait for confirmation
      await approvalTx.wait();

      // Trigger refetch to update approval status
      setApprovalRefreshKey((prev) => prev + 1);
      await refetch();

      if (toastId) toastDismiss(toastId);
      toastSuccess("Marketplace approved! You can now list your ticket.");
    } catch (err) {
      console.error("Failed to approve:", err);

      if (toastId) toastDismiss(toastId);

      const errorMessage = err instanceof Error ? err.message : "Failed to approve marketplace";

      // Only show error toast if not user rejection
      if (!errorMessage.includes("rejected") && !errorMessage.includes("denied")) {
        toastError(errorMessage);
      }

      throw err;
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Refresh approval status manually
   */
  const refreshApproval = async () => {
    setApprovalRefreshKey((prev) => prev + 1);
    await refetch();
  };

  return {
    isApproved,
    isCheckingApproval,
    isApproving,
    error: approvalError ? (approvalError as Error).message : null,
    userUEA,
    approve,
    refreshApproval,
  };
}

/**
 * Hook to check approval for multiple NFTs (for bulk listing)
 *
 * @param tokenIds - Array of token IDs to check
 * @returns approval status for all tokens and bulk approve function
 */
export function useBulkNFTApproval(tokenIds: bigint[]) {
  const { universalAccount } = usePushWalletContext();
  const { PushChain } = usePushChain();
  const { address: originAddress } = useAccount();
  const { pushChainClient } = usePushChainClient();
  const publicClient = usePublicClient();

  const [userUEA, setUserUEA] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<Map<string, boolean>>(new Map());
  const [isCheckingApprovals, setIsCheckingApprovals] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalRefreshKey, setApprovalRefreshKey] = useState(0);

  // Resolve UEA
  useEffect(() => {
    let cancelled = false;

    const resolveUEA = async () => {
      if (!PushChain || !universalAccount) {
        if (!cancelled) {
          setUserUEA(originAddress || null);
        }
        return;
      }

      try {
        const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
          universalAccount,
          { onlyCompute: true }
        );

        if (!cancelled) {
          setUserUEA(executorInfo.address);
        }
      } catch (err) {
        console.error("Failed to resolve UEA:", err);
        if (!cancelled) {
          setUserUEA(originAddress || null);
        }
      }
    };

    resolveUEA();

    return () => {
      cancelled = true;
    };
  }, [PushChain, universalAccount, originAddress]);

  // Check approval for all tokens using viem
  useEffect(() => {
    let cancelled = false;

    const checkApprovals = async () => {
      if (!publicClient || tokenIds.length === 0) {
        setApprovalStatus(new Map());
        return;
      }

      setIsCheckingApprovals(true);
      setError(null);

      try {
        const statusMap = new Map<string, boolean>();

        // Check each token using viem's readContract
        const checks = tokenIds.map(async (tokenId) => {
          try {
            const approvedAddress = await readContract(publicClient, {
              address: TICKET_NFT_ADDRESS as `0x${string}`,
              abi: TicketNFTABI,
              functionName: "getApproved",
              args: [tokenId],
            });

            const approved =
              !!approvedAddress &&
              typeof approvedAddress === "string" &&
              approvedAddress.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase();

            statusMap.set(tokenId.toString(), approved);
          } catch (err) {
            console.error(`Failed to check approval for token ${tokenId}:`, err);
            statusMap.set(tokenId.toString(), false);
          }
        });

        await Promise.all(checks);

        if (!cancelled) {
          setApprovalStatus(statusMap);
        }
      } catch (err) {
        console.error("Failed to check approvals:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to check approvals");
        }
      } finally {
        if (!cancelled) {
          setIsCheckingApprovals(false);
        }
      }
    };

    checkApprovals();

    return () => {
      cancelled = true;
    };
  }, [publicClient, tokenIds, approvalRefreshKey]);

  /**
   * Approve marketplace for all unapproved tokens
   */
  const approveAll = async () => {
    if (!pushChainClient || !PushChain || tokenIds.length === 0) {
      throw new Error("Push Chain client not available or no tokens provided");
    }

    let toastId: string | undefined;

    try {
      setIsApproving(true);
      setError(null);

      // Find tokens that need approval
      const unapprovedTokens = tokenIds.filter(
        (tokenId) => !approvalStatus.get(tokenId.toString())
      );

      if (unapprovedTokens.length === 0) {
        toastSuccess("All tickets are already approved!");
        return;
      }

      toastId = toastLoading(`Approving ${unapprovedTokens.length} ticket(s)...`);

      // Approve each token sequentially
      for (let i = 0; i < unapprovedTokens.length; i++) {
        const tokenId = unapprovedTokens[i];

        // Update toast with progress
        if (toastId) toastDismiss(toastId);
        toastId = toastLoading(`Approving ${i + 1}/${unapprovedTokens.length} tickets...`);

        const approvalTx = await pushChainClient.universal.sendTransaction({
          to: TICKET_NFT_ADDRESS,
          data: PushChain.utils.helpers.encodeTxData({
            abi: Array.from(TicketNFTABI),
            functionName: "approve",
            args: [MARKETPLACE_ADDRESS, tokenId],
          }),
        });

        await approvalTx.wait();

        // Update approval status for this token immediately
        setApprovalStatus((prev) => {
          const newMap = new Map(prev);
          newMap.set(tokenId.toString(), true);
          return newMap;
        });
      }

      // Trigger full refresh
      setApprovalRefreshKey((prev) => prev + 1);

      if (toastId) toastDismiss(toastId);
      toastSuccess("All tickets approved! You can now list them.");
    } catch (err) {
      console.error("Failed to approve tokens:", err);

      if (toastId) toastDismiss(toastId);

      const errorMessage = err instanceof Error ? err.message : "Failed to approve tokens";
      setError(errorMessage);

      if (!errorMessage.includes("rejected") && !errorMessage.includes("denied")) {
        toastError(errorMessage);
      }

      throw err;
    } finally {
      setIsApproving(false);
    }
  };

  // Calculate summary
  const allApproved = tokenIds.length > 0 && tokenIds.every((id) => approvalStatus.get(id.toString()));
  const noneApproved = tokenIds.every((id) => !approvalStatus.get(id.toString()));
  const someApproved = !allApproved && !noneApproved;
  const approvedCount = tokenIds.filter((id) => approvalStatus.get(id.toString())).length;

  return {
    approvalStatus,
    allApproved,
    noneApproved,
    someApproved,
    approvedCount,
    isCheckingApprovals,
    isApproving,
    error,
    userUEA,
    approveAll,
  };
}
