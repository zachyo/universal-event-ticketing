import { useReadContract } from "wagmi";
import TicketMarketplaceABI from "../lib/abi/TicketMarketplace.json";

const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS;

/**
 * Hook to get secondary market statistics for an event directly from contract storage
 * This is much simpler and more reliable than fetching events from the blockchain
 */
export function useMarketplaceStats(eventId: number) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI.abi,
    functionName: "getEventSecondaryMarketStats",
    args: [BigInt(eventId)],
    query: {
      enabled: eventId > 0,
    },
  });


  return {
    secondarySales: data ? Number(data[0]) : 0,
    royaltiesCollected: data ? data[1] : BigInt(0),
    isLoading,
    error,
    refetch,
  };
}
