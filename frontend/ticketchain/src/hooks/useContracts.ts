import { useReadContract, useReadContracts, useAccount } from "wagmi";
import { useState, useMemo } from "react";
import {
  TicketFactoryABI,
  TicketNFTABI,
  TicketMarketplaceABI,
  TICKET_FACTORY_ADDRESS,
  TICKET_NFT_ADDRESS,
  MARKETPLACE_ADDRESS,
} from "../lib/contracts";
import type {
  Event,
  TicketType,
  TicketNFT,
  Listing,
  EventInput,
  TicketTypeInput,
  UseEventsReturn,
  UseTicketsReturn,
  UseListingsReturn,
  PurchaseParams,
  ListTicketParams,
  BuyTicketParams,
} from "../types";
import { usePushChainClient, usePushChain } from "@pushchain/ui-kit";
import { uploadToIPFS } from "../lib/ipfs";
import {
  toastSuccess,
  toastError,
  toastLoading,
  toastDismiss,
} from "../lib/toast";
import { getErrorMessage, isUserRejection } from "../lib/errorUtils";

// Hook for creating events
export function useCreateEvent() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const [isPending, setIsPending] = useState(false);

  const createEvent = async (eventData: EventInput) => {
    if (!pushChainClient || !PushChain) {
      throw new Error("Push Chain client not available");
    }

    let toastId: string | undefined;

    try {
      setIsPending(true);

      // Show loading toast
      toastId = toastLoading("Creating event...");

      // Upload event image to IPFS
      const eventIpfsHash = await uploadToIPFS(eventData.image);

      // Upload all ticket type images to IPFS in parallel
      const initialTicketTypes = eventData.initialTicketTypes || [];

      if (initialTicketTypes.length === 0) {
        throw new Error("At least one ticket type is required");
      }

      // Validate all ticket types have images
      for (const tt of initialTicketTypes) {
        if (!tt.image) {
          throw new Error(`Image required for ticket type: ${tt.name}`);
        }
      }

      // Upload all tier images in parallel
      console.log(
        `Uploading ${initialTicketTypes.length} tier images to IPFS...`
      );
      const tierImageHashes = await Promise.all(
        initialTicketTypes.map(async (tt, index) => {
          console.log(`Uploading tier ${index + 1}: ${tt.name}`);
          const hash = await uploadToIPFS(tt.image!);
          console.log(`Tier ${index + 1} uploaded: ${hash}`);
          return hash;
        })
      );

      // Prepare ticket types with IPFS hashes
      const ticketTypesForContract = initialTicketTypes.map((tt, index) => ({
        name: tt.name,
        price: tt.price,
        supply: tt.supply,
        imageIpfsHash: tierImageHashes[index],
      }));

      console.log("Creating event with ticket types:", ticketTypesForContract);

      const tx = await pushChainClient.universal.sendTransaction({
        to: TICKET_FACTORY_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketFactoryABI),
          functionName: "createEvent",
          args: [
            eventData.name,
            eventData.description,
            eventData.startTime,
            eventData.endTime,
            eventData.venue,
            eventIpfsHash,
            eventData.totalSupply,
            eventData.royaltyBps,
            ticketTypesForContract,
          ],
        }),
      });

      await tx.wait();

      // Clear draft and cache after successful creation
      localStorage.removeItem("ticketchain_draft_event");
      localStorage.removeItem("ticketchain_cache");

      console.log("Event created successfully!");

      // Dismiss loading and show success
      if (toastId) toastDismiss(toastId);
      toastSuccess("Event created successfully!");

      return tx;
    } catch (error) {
      console.error("Failed to create event:", error);

      // Dismiss loading toast
      if (toastId) toastDismiss(toastId);

      // Show error toast if not user rejection
      if (!isUserRejection(error)) {
        toastError(getErrorMessage(error));
      }

      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { createEvent, isPending };
}

// Hook for reading event counter
export function useEventCounter() {
  const {
    data: eventCounter,
    isLoading,
    error,
  } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI,
    functionName: "eventCounter",
  });

  return {
    eventCounter: eventCounter ? Number(eventCounter) : 0,
    isLoading,
    error,
  };
}

// Hook for reading a single event
export function useEvent(eventId: number) {
  const {
    data: event,
    isLoading,
    error,
  } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI,
    functionName: "events",
    args: [BigInt(eventId)],
  });

  return { event: event as Event | undefined, isLoading, error };
}

// Hook for reading a single event by ID
export function useGetEvent(
  eventId: number,
  options?: {
    enabled?: boolean;
  }
) {
  const enabled = options?.enabled ?? true;
  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI,
    functionName: "getEvent",
    args: [BigInt(eventId)],
    query: {
      enabled: enabled && eventId > 0, // Only fetch if eventId is valid and enabled
    },
  });
  return {
    event: event as Event | undefined,
    isLoading,
    error,
    refetch: refetch as unknown as () => Promise<unknown>,
  };
}

// Hook for reading all events
export function useEvents(): UseEventsReturn {
  const { eventCounter, isLoading: isCounterLoading } = useEventCounter();

  const contracts = useMemo(() => {
    if (!eventCounter || eventCounter === 0) return [];
    // Create an array of contract calls for eventIds from 1 to eventCounter
    return Array.from({ length: eventCounter }, (_, i) => ({
      address: TICKET_FACTORY_ADDRESS as `0x${string}`,
      abi: TicketFactoryABI,
      functionName: "getEvent",
      args: [BigInt(i + 1)],
    }));
  }, [eventCounter]);

  const { data, error, isLoading, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: eventCounter > 0,
    },
  });

  const events = useMemo(() => {
    if (!data) return [];
    // Cast with unknown first to satisfy TS and guard against undefined/array results
    return data
      .map((item) => item.result as Event | undefined)
      .filter((ev): ev is Event => Boolean(ev && ev.eventId !== undefined));
  }, [data]);

  return {
    events,
    loading: isLoading || isCounterLoading,
    error: error ? error.message : null,
    refetch,
  };
}

// Hook for reading ticket types for an event
export function useTicketTypes(
  eventId: number,
  options?: {
    enabled?: boolean;
  }
) {
  const enabled = options?.enabled ?? true;
  const {
    data: ticketTypes,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI,
    functionName: "getTicketTypes",
    args: [BigInt(eventId)],
    query: {
      enabled: enabled && eventId > 0,
    },
  });

  // Normalize to include ticketTypeId (index in returned array)
  // The solidity TicketFactory.TicketType does not include an id, so we derive it from array position.
  const normalized = useMemo(() => {
    if (!ticketTypes) return undefined;
    const arr = ticketTypes as TicketType[];

    const result = arr.map((tt, index) => {
      const normalized = { ...tt, ticketTypeId: BigInt(index) };
      return normalized;
    });

    return result;
  }, [ticketTypes]);

  return {
    ticketTypes: normalized,
    isLoading,
    error,
    refetch,
  };
}

// Hook for adding ticket types to an event
export function useAddTicketType() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const [isPending, setIsPending] = useState(false);

  const addTicketType = async (
    eventId: number,
    ticketType: TicketTypeInput
  ) => {
    if (!pushChainClient || !PushChain) {
      throw new Error("Push Chain client not available");
    }

    if (!ticketType.image) {
      throw new Error("Image is required for ticket type");
    }

    try {
      setIsPending(true);

      // Upload tier image to IPFS
      console.log(`Uploading tier image for: ${ticketType.name}`);
      const imageIpfsHash = await uploadToIPFS(ticketType.image);
      console.log(`Tier image uploaded: ${imageIpfsHash}`);

      const tx = await pushChainClient.universal.sendTransaction({
        to: TICKET_FACTORY_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketFactoryABI),
          functionName: "addTicketType",
          args: [
            BigInt(eventId),
            ticketType.name,
            ticketType.price,
            ticketType.supply,
            imageIpfsHash,
          ],
        }),
      });

      await tx.wait();

      localStorage.removeItem("ticketchain_cache");

      return tx;
    } finally {
      setIsPending(false);
    }
  };

  return { addTicketType, isPending };
}

// Hook for purchasing tickets using Push Chain
export function usePurchaseTicket() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const [isPending, setIsPending] = useState(false);

  const purchaseTicket = async (params: PurchaseParams) => {
    if (!pushChainClient || !PushChain) {
      throw new Error("Push Chain client not available");
    }
    if (params.price === undefined || params.price === null) {
      throw new Error("Ticket price is required to purchase");
    }

    let toastId: string | undefined;

    try {
      setIsPending(true);

      const quantity =
        params.quantity && params.quantity > 0 ? params.quantity : 1;
      const quantityBigInt = BigInt(quantity);
      const totalPrice = params.price * quantityBigInt;

      // Show loading toast
      toastId = toastLoading(
        quantity > 1
          ? `Purchasing ${quantity} tickets...`
          : "Purchasing ticket..."
      );

      // Enhanced debugging
      console.log("Purchase parameters:", {
        params,
        eventId: params.eventId.toString(),
        ticketTypeId: params.ticketTypeId.toString(),
        price: params.price.toString(),
        quantity,
        totalPrice: totalPrice.toString(),
        factoryAddress: TICKET_FACTORY_ADDRESS,
      });

      const txData = PushChain.utils.helpers.encodeTxData({
        abi: Array.from(TicketFactoryABI),
        functionName: "purchaseTickets",
        args: [params.eventId, params.ticketTypeId, quantityBigInt],
      });

      // Value must be specified in destination chain native token (PC on PushChain)
      const valuePC = totalPrice;

      console.log("Transaction data:", {
        to: TICKET_FACTORY_ADDRESS,
        data: txData,
        value: valuePC.toString(),
        args: [
          params.eventId.toString(),
          params.ticketTypeId.toString(),
          quantity.toString(),
        ],
        chain: params.chain,
        note: "Value specified in destination chain native token (PC). Universal accounts handle cross-chain conversion from user's origin chain.",
      });

      if (totalPrice <= 0n) {
        throw new Error("Invalid total price: must be greater than 0");
      }

      const tx = await pushChainClient.universal.sendTransaction({
        to: TICKET_FACTORY_ADDRESS,
        data: txData,
        value: valuePC,
      });

      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed:", tx.hash);

      // Clear cache to refresh data
      localStorage.removeItem("ticketchain_cache");

      // Dismiss loading and show success
      if (toastId) toastDismiss(toastId);
      toastSuccess(
        quantity > 1
          ? `Successfully purchased ${quantity} tickets!`
          : "Ticket purchased successfully!"
      );

      return tx;
    } catch (error) {
      console.error("Purchase transaction failed:", error);

      // Dismiss loading toast
      if (toastId) toastDismiss(toastId);

      // Enhanced error logging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        // Check for specific Push Chain error codes
        if (error.message.includes("0xdc210b1a")) {
          const errorMsg =
            "Invalid payment payload. This could be due to:\n" +
            "• Incorrect payment amount\n" +
            "• Invalid ticket type ID\n" +
            "• Contract authorization issues\n" +
            "• Network congestion\n\n" +
            "Please try again or contact support if the issue persists.";

          if (!isUserRejection(error)) {
            toastError(errorMsg);
          }
          throw new Error(errorMsg);
        }

        if (error.message.includes("executePayload")) {
          const errorMsg =
            "Cross-chain transaction failed. This could be due to:\n" +
            "• Insufficient gas fees\n" +
            "• Network connectivity issues\n" +
            "• Invalid transaction parameters\n\n" +
            "Please check your wallet balance and try again.";

          if (!isUserRejection(error)) {
            toastError(errorMsg);
          }
          throw new Error(errorMsg);
        }

        if (error.message.includes("IncorrectPayment")) {
          const errorMsg =
            "Payment amount mismatch. The amount sent does not match the ticket price.\n" +
            "Please refresh the page and try again.";

          if (!isUserRejection(error)) {
            toastError(errorMsg);
          }
          throw new Error(errorMsg);
        }

        // Show generic error toast if not user rejection
        if (!isUserRejection(error)) {
          toastError(getErrorMessage(error));
        }

        throw new Error(`Purchase failed: ${error.message}`);
      }

      // Show error toast for unknown errors
      if (!isUserRejection(error)) {
        toastError(getErrorMessage(error));
      }

      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { purchaseTicket, isPending };
}

// Hook for reading user's tickets
export function useUserTickets(address?: string): UseTicketsReturn {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;

  // Use the new optimized batch function that returns full ticket details
  const {
    data: batchData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "getUserTicketsWithDetails",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  // Format the results - batchData is a tuple: [TicketMetadata[], uint256[]]
  const tickets = useMemo(() => {
    if (!batchData) return [];

    const [ticketMetadataArray, tokenIds] = batchData as [
      TicketNFT[],
      bigint[]
    ];

    if (!ticketMetadataArray || !tokenIds) return [];

    // Combine metadata with token IDs and add currentOwner
    // Note: getUserTicketsWithDetails only returns tickets owned by the queried address,
    // so currentOwner is always the same as the queried userAddress
    return ticketMetadataArray.map((metadata, index) => ({
      ...metadata,
      tokenId: tokenIds[index],
      currentOwner: userAddress || "", // Add currentOwner since contract doesn't return it
    }));
  }, [batchData, userAddress]);

  return {
    tickets,
    loading: isLoading,
    error: error ? error.message : null,
    refetch: refetch as unknown as () => Promise<unknown>,
  };
}

// Hook for reading marketplace listings
export function useMarketplaceListings(): UseListingsReturn {
  const { data, isLoading, error, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI,
    functionName: "getActiveListings",
  });

  const listings = useMemo(() => (data as Listing[] | undefined) || [], [data]);

  return {
    listings,
    loading: isLoading,
    error: error ? error.message : null,
    refetch,
  };
}

// Hook for listing a ticket on the marketplace
export function useListTicket() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const [isPending, setIsPending] = useState(false);

  const listTicket = async (params: ListTicketParams) => {
    if (!pushChainClient || !PushChain) {
      throw new Error("Push Chain client not available");
    }

    let toastId: string | undefined;

    try {
      setIsPending(true);

      // Show loading toast
      toastId = toastLoading("Listing ticket for sale...");

      // Ensure marketplace can transfer the NFT into escrow
      const approvalTx = await pushChainClient.universal.sendTransaction({
        to: TICKET_NFT_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketNFTABI),
          functionName: "approve",
          args: [MARKETPLACE_ADDRESS, params.tokenId],
        }),
      });
      await approvalTx.wait();

      // Create listing on marketplace (escrow transfer happens inside)
      const listTx = await pushChainClient.universal.sendTransaction({
        to: MARKETPLACE_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketMarketplaceABI),
          functionName: "listTicket",
          args: [params.tokenId, params.price],
        }),
      });

      await listTx.wait();

      localStorage.removeItem("ticketchain_cache");

      // Dismiss loading and show success
      if (toastId) toastDismiss(toastId);
      toastSuccess("Ticket listed successfully!");

      return listTx;
    } catch (error) {
      console.error("Failed to list ticket:", error);

      // Dismiss loading toast
      if (toastId) toastDismiss(toastId);

      // Show error toast if not user rejection
      if (!isUserRejection(error)) {
        toastError(getErrorMessage(error));
      }

      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { listTicket, isPending };
}

// Hook for buying a ticket from the marketplace
export function useBuyTicket() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const [isPending, setIsPending] = useState(false);

  const buyTicket = async (params: BuyTicketParams & { price: bigint }) => {
    if (!pushChainClient || !PushChain) {
      throw new Error("Push Chain client not available");
    }

    let toastId: string | undefined;

    try {
      setIsPending(true);

      // Show loading toast
      toastId = toastLoading("Purchasing ticket from marketplace...");

      const tx = await pushChainClient.universal.sendTransaction({
        to: MARKETPLACE_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketMarketplaceABI),
          functionName: "buyTicket",
          args: [params.listingId],
        }),
        // Must send destination chain native amount equal to listing price
        value: params.price,
      });

      await tx.wait();

      // Clear cache to refresh data
      localStorage.removeItem("ticketchain_cache");

      // Dismiss loading and show success
      if (toastId) toastDismiss(toastId);
      toastSuccess("Ticket purchased successfully from marketplace!");

      return tx;
    } catch (error) {
      console.error("Failed to buy ticket:", error);

      // Dismiss loading toast
      if (toastId) toastDismiss(toastId);

      // Show error toast if not user rejection
      if (!isUserRejection(error)) {
        toastError(getErrorMessage(error));
      }

      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { buyTicket, isPending };
}

// Hook for canceling a marketplace listing
export function useCancelListing() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const [isPending, setIsPending] = useState(false);

  const cancelListing = async (listingId: number) => {
    if (!pushChainClient || !PushChain) {
      throw new Error("Push Chain client not available");
    }

    try {
      setIsPending(true);

      const tx = await pushChainClient.universal.sendTransaction({
        to: MARKETPLACE_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketMarketplaceABI),
          functionName: "cancelListing",
          args: [BigInt(listingId)],
        }),
      });

      await tx.wait();

      localStorage.removeItem("ticketchain_cache");

      return tx;
    } finally {
      setIsPending(false);
    }
  };

  return { cancelListing, isPending };
}

// Hook for validating a ticket (marking as used)
export function useValidateTicket() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const [isPending, setIsPending] = useState(false);

  const validateTicket = async (eventId: number, tokenId: number) => {
    if (!pushChainClient || !PushChain) {
      throw new Error("Push Chain client not available");
    }

    try {
      setIsPending(true);

      const tx = await pushChainClient.universal.sendTransaction({
        to: TICKET_FACTORY_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketFactoryABI),
          functionName: "validateTicket",
          args: [BigInt(eventId), BigInt(tokenId)],
        }),
      });

      await tx.wait();

      localStorage.removeItem("ticketchain_cache");

      return tx;
    } finally {
      setIsPending(false);
    }
  };

  return { validateTicket, isPending };
}

// Hook for reading ticket details
export function useTicketDetails(
  tokenId: number,
  options?: {
    enabled?: boolean;
  }
) {
  const enabled = options?.enabled ?? true;
  const {
    data: ticketDetails,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: "ticketDetails",
    args: [BigInt(tokenId)],
    query: {
      enabled: enabled && tokenId > 0,
    },
  });

  return {
    ticketDetails: ticketDetails as TicketNFT | undefined,
    isLoading,
    error,
    refetch: refetch as unknown as () => Promise<unknown>,
  };
}

// Hook for reading organizer events
export function useOrganizerEvents(organizer: string) {
  const {
    data: eventIds,
    isLoading,
    error,
  } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI,
    functionName: "getOrganizerEvents",
    args: [organizer],
  });

  return {
    eventIds: eventIds as bigint[] | undefined,
    isLoading,
    error,
  };
}

// Hook for fetching multiple events at once
export function useEventsBatch(eventIds: number[]) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI,
    functionName: "getEventsBatch",
    args: [eventIds.map((id) => BigInt(id))],
    query: {
      enabled: eventIds.length > 0,
    },
  });

  const events = useMemo(() => {
    if (!data) return [];
    const [eventsData, validFlags] = data as [Event[], boolean[]];

    // Filter out invalid events
    return eventsData.filter((_, index) => validFlags[index]);
  }, [data]);

  return {
    events,
    isLoading,
    error,
    refetch: refetch as unknown as () => Promise<unknown>,
  };
}

// Hook for setting ticket URI (metadata)
export function useSetTicketURI() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const [isPending, setIsPending] = useState(false);

  const setTicketURI = async (tokenId: number, tokenURI: string) => {
    if (!pushChainClient || !PushChain) {
      throw new Error("Push Chain client not available");
    }

    try {
      setIsPending(true);

      const tx = await pushChainClient.universal.sendTransaction({
        to: TICKET_FACTORY_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: Array.from(TicketFactoryABI),
          functionName: "setTicketURI",
          args: [BigInt(tokenId), tokenURI],
        }),
      });

      await tx.wait();

      localStorage.removeItem("ticketchain_cache");

      return tx;
    } finally {
      setIsPending(false);
    }
  };

  return { setTicketURI, isPending };
}
