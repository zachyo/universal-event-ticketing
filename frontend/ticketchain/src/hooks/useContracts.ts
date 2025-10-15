import { useReadContract, useReadContracts, useWriteContract, useAccount } from 'wagmi';
import { useState, useCallback, useMemo } from 'react';
import {
  TicketFactoryABI,
  TicketNFTABI,
  TicketMarketplaceABI,
  TICKET_FACTORY_ADDRESS,
  TICKET_NFT_ADDRESS,
  MARKETPLACE_ADDRESS,
  convertPCToNative
} from '../lib/contracts';
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
  BuyTicketParams
} from '../types';
import { usePushChainClient, usePushChain } from '@pushchain/ui-kit';
import { uploadToIPFS } from '../lib/ipfs';

// Cache utilities
const CACHE_KEY = 'ticketchain_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(key: string, subKey?: string) {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache = JSON.parse(cached);
    const data = subKey ? cache[key]?.[subKey] : cache[key];

    if (!data || Date.now() - data.timestamp > CACHE_DURATION) {
      return null;
    }

    return data.data;
  } catch {
    return null;
  }
}

function setCachedData(key: string, data: any, subKey?: string) {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cache = cached ? JSON.parse(cached) : { events: {}, tickets: {}, listings: {} };

    if (subKey) {
      if (!cache[key]) cache[key] = {};
      cache[key][subKey] = { data, timestamp: Date.now() };
    } else {
      cache[key] = { data, timestamp: Date.now() };
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to cache data:', error);
  }
}

// Hook for creating events
export function useCreateEvent() {
  const { writeContract, isPending } = useWriteContract();

  const createEvent = async (eventData: EventInput) => {
    // Upload image to IPFS first
    const ipfsHash = await uploadToIPFS(eventData.image);

    return writeContract({
      address: TICKET_FACTORY_ADDRESS as `0x${string}`,
      abi: TicketFactoryABI as unknown as any[],
      functionName: 'createEvent',
      args: [
        eventData.name,
        eventData.description,
        eventData.startTime,
        eventData.endTime,
        eventData.venue,
        ipfsHash,
        eventData.totalSupply,
        eventData.royaltyBps,
      ],
    });
  };

  return { createEvent, isPending };
}

// Hook for reading event counter
export function useEventCounter() {
  const { data: eventCounter, isLoading, error } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI as unknown as any[],
    functionName: 'eventCounter',
  });

  return {
    eventCounter: eventCounter ? Number(eventCounter) : 0,
    isLoading,
    error
  };
}

// Hook for reading a single event
export function useEvent(eventId: number) {
  const { data: event, isLoading, error } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI as unknown as any[],
    functionName: 'events',
    args: [BigInt(eventId)],
  });

  return { event: event as Event | undefined, isLoading, error };
}

// Hook for reading a single event by ID
export function useGetEvent(eventId: number) {
  const { data: event, isLoading, error, refetch } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI as unknown as any[],
    functionName: 'getEvent',
    args: [BigInt(eventId)],
    query: {
      enabled: eventId > 0, // Only fetch if eventId is valid
    },
  });

  return {
    event: event as Event | undefined,
    isLoading,
    error,
    refetch,
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
      abi: TicketFactoryABI as unknown as any[],
      functionName: 'getEvent',
      args: [BigInt(i + 1)],
    }));
  }, [eventCounter]);

  const { data, error, isLoading, refetch } = useReadContracts({
    // @ts-ignore
    contracts,
    query: {
      enabled: eventCounter > 0,
    },
  });

  const events = useMemo(() => {
    if (!data) return [];
    // Cast with unknown first to satisfy TS and guard against undefined/array results
    return data
      .map((item) => item.result as unknown as Event)
      .filter((ev) => !!ev && (ev as any).eventId !== undefined);
  }, [data]);

  return {
    events,
    loading: isLoading || isCounterLoading,
    error: error ? error.message : null,
    refetch,
  };
}

 // Hook for reading ticket types for an event
export function useTicketTypes(eventId: number) {
  const { data: ticketTypes, isLoading, error } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI as unknown as any[],
    functionName: 'getTicketTypes',
    args: [BigInt(eventId)],
  });

  // Normalize to include ticketTypeId (index in returned array)
  // The solidity TicketFactory.TicketType does not include an id, so we derive it from array position.
  const normalized = useMemo(() => {
    if (!ticketTypes) return undefined;
    const arr = ticketTypes as TicketType[];

    const result = arr.map((tt, index) => {
      const normalized = { ...tt, ticketTypeId: BigInt(index) };

      // Debug logging for ticket types
      console.log(`Ticket type ${index}:`, {
        name: normalized.name,
        price: normalized.price.toString(),
        supply: normalized.supply.toString(),
        sold: normalized.sold.toString(),
        ticketTypeId: normalized.ticketTypeId.toString(),
      });

      return normalized;
    });

    console.log("All normalized ticket types:", result);
    return result;
  }, [ticketTypes]);

  return {
    ticketTypes: normalized,
    isLoading,
    error
  };
}

// Hook for adding ticket types to an event
export function useAddTicketType() {
  const { writeContract, isPending } = useWriteContract();

  const addTicketType = async (eventId: number, ticketType: TicketTypeInput) => {
    return writeContract({
      address: TICKET_FACTORY_ADDRESS as `0x${string}`,
      abi: TicketFactoryABI as unknown as any[],
      functionName: 'addTicketType',
      args: [
        BigInt(eventId),
        ticketType.name,
        ticketType.price,
        ticketType.supply,
      ],
    });
  };

  return { addTicketType, isPending };
}

// Hook for purchasing tickets using Push Chain
export function usePurchaseTicket() {
  const { pushChainClient } = usePushChainClient();
  const { PushChain } = usePushChain();
  const { chain } = useAccount();
  const [isPending, setIsPending] = useState(false);

  const purchaseTicket = async (params: PurchaseParams) => {
    if (!pushChainClient || !PushChain) {
      throw new Error('Push Chain client not available');
    }
    if (params.price === undefined || params.price === null) {
      throw new Error('Ticket price is required to purchase');
    }

    try {
      setIsPending(true);

      const quantity = params.quantity && params.quantity > 0 ? params.quantity : 1;
      const totalPrice = params.price * BigInt(quantity);

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
        abi: TicketFactoryABI as unknown as any[],
        functionName: 'purchaseTickets',
        args: [params.eventId, params.ticketTypeId, quantity],
      });

      // Value must be specified in destination chain native token (PC on PushChain)
      const valuePC = totalPrice;

      console.log("Transaction data:", {
        to: TICKET_FACTORY_ADDRESS,
        data: txData,
        value: valuePC.toString(),
        args: [params.eventId.toString(), params.ticketTypeId.toString(), quantity.toString()],
        chain: params.chain,
        note: "Value specified in destination chain native token (PC). Universal accounts handle cross-chain conversion from user's origin chain."
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
      localStorage.removeItem(CACHE_KEY);

      return tx;
    } catch (error) {
      console.error("Purchase transaction failed:", error);

      // Enhanced error logging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        // Check for specific Push Chain error codes
        if (error.message.includes('0xdc210b1a')) {
          throw new Error('Invalid payment payload. This could be due to:\n' +
            '• Incorrect payment amount\n' +
            '• Invalid ticket type ID\n' +
            '• Contract authorization issues\n' +
            '• Network congestion\n\n' +
            'Please try again or contact support if the issue persists.');
        }

        if (error.message.includes('executePayload')) {
          throw new Error('Cross-chain transaction failed. This could be due to:\n' +
            '• Insufficient gas fees\n' +
            '• Network connectivity issues\n' +
            '• Invalid transaction parameters\n\n' +
            'Please check your wallet balance and try again.');
        }

        if (error.message.includes('IncorrectPayment')) {
          throw new Error('Payment amount mismatch. The amount sent does not match the ticket price.\n' +
            'Please refresh the page and try again.');
        }

        throw new Error(`Purchase failed: ${error.message}`);
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

  // 1. Fetch the array of token IDs owned by the user
  const { data: tokenIds, isLoading: isLoadingTokenIds, refetch: refetchTokenIds } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: 'getUserTickets',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  // 2. Prepare contract calls to get details for each token ID
  const ticketDetailContracts = useMemo(() => {
    if (!tokenIds || (tokenIds as bigint[]).length === 0) return [];
    return (tokenIds as bigint[]).map(tokenId => ({
      address: TICKET_NFT_ADDRESS as `0x${string}`,
      abi: TicketNFTABI,
      functionName: 'ticketDetails',
      args: [tokenId],
    }));
  }, [tokenIds]);

  // 3. Fetch all ticket details in a batch
  const { data: ticketDetailsData, isLoading: isLoadingTicketDetails, error, refetch: refetchDetails } = useReadContracts({
    contracts: ticketDetailContracts,
    query: { enabled: !!ticketDetailContracts && ticketDetailContracts.length > 0 },
  });

  // 4. Format the results
  const tickets = useMemo(() => {
    if (!ticketDetailsData) return [];
    return ticketDetailsData
      .map(item => item.result as TicketNFT)
      .filter(Boolean);
  }, [ticketDetailsData]);

  const refetch = useCallback(() => {
    refetchTokenIds();
    refetchDetails();
  }, [refetchTokenIds, refetchDetails]);

  return {
    tickets,
    loading: isLoadingTokenIds || isLoadingTicketDetails,
    error: error ? error.message : null,
    refetch,
  };
}

// Hook for reading marketplace listings
export function useMarketplaceListings(): UseListingsReturn {
  const { data, isLoading, error, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI as unknown as any[],
    functionName: 'getActiveListings',
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
  const { writeContract, isPending } = useWriteContract();

  const listTicket = async (params: ListTicketParams) => {
    // Ensure marketplace can transfer the NFT into escrow
    await writeContract({
      address: TICKET_NFT_ADDRESS as `0x${string}`,
      abi: TicketNFTABI,
      functionName: 'approve',
      args: [MARKETPLACE_ADDRESS, params.tokenId],
    });

    // Create listing on marketplace (escrow transfer happens inside)
    return writeContract({
      address: MARKETPLACE_ADDRESS as `0x${string}`,
      abi: TicketMarketplaceABI as unknown as any[],
      functionName: 'listTicket',
      args: [params.tokenId, params.price],
    });
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
      throw new Error('Push Chain client not available');
    }

    try {
      setIsPending(true);

      const tx = await pushChainClient.universal.sendTransaction({
        to: MARKETPLACE_ADDRESS,
        data: PushChain.utils.helpers.encodeTxData({
          abi: TicketMarketplaceABI as unknown as any[],
          functionName: 'buyTicket',
          args: [params.listingId],
        }),
        // Must send destination chain native amount equal to listing price
        value: params.price,
      });

      await tx.wait();

      // Clear cache to refresh data
      localStorage.removeItem(CACHE_KEY);

      return tx;
    } finally {
      setIsPending(false);
    }
  };

  return { buyTicket, isPending };
}

// Hook for canceling a marketplace listing
export function useCancelListing() {
  const { writeContract, isPending } = useWriteContract();

  const cancelListing = async (listingId: number) => {
    return writeContract({
      address: MARKETPLACE_ADDRESS as `0x${string}`,
      abi: TicketMarketplaceABI as unknown as any[],
      functionName: 'cancelListing',
      args: [BigInt(listingId)],
    });
  };

  return { cancelListing, isPending };
}

// Hook for validating a ticket (marking as used)
export function useValidateTicket() {
  const { writeContract, isPending } = useWriteContract();

  const validateTicket = async (eventId: number, tokenId: number) => {
    return writeContract({
      address: TICKET_FACTORY_ADDRESS as `0x${string}`,
      abi: TicketFactoryABI as unknown as any[],
      functionName: 'validateTicket',
      args: [BigInt(eventId), BigInt(tokenId)],
    });
  };

  return { validateTicket, isPending };
}

// Hook for reading ticket details
export function useTicketDetails(tokenId: number) {
  const { data: ticketDetails, isLoading, error } = useReadContract({
    address: TICKET_NFT_ADDRESS as `0x${string}`,
    abi: TicketNFTABI,
    functionName: 'ticketDetails',
    args: [BigInt(tokenId)],
  });

  return {
    ticketDetails: ticketDetails as TicketNFT | undefined,
    isLoading,
    error
  };
}

// Hook for reading organizer events
export function useOrganizerEvents(organizer: string) {
  const { data: eventIds, isLoading, error } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI as unknown as any[],
    functionName: 'getOrganizerEvents',
    args: [organizer],
  });

  return {
    eventIds: eventIds as bigint[] | undefined,
    isLoading,
    error
  };
}