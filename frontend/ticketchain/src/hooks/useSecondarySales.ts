import { useState, useEffect, useMemo } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { useEvent } from "./useContracts";
import TicketMarketplaceABI from "../lib/abi/TicketMarketplace.json";

const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS;

export interface SecondarySale {
  listingId: bigint;
  tokenId: bigint;
  seller: string;
  buyer: string;
  price: bigint;
  royaltyAmount: bigint;
  royaltyReceiver: string;
  completedAt: Date;
  blockNumber: bigint;
}

export interface SecondarySalesData {
  sales: SecondarySale[];
  totalSales: number;
  totalVolume: bigint;
  totalRoyalties: bigint;
  avgPrice: bigint;
  avgRoyalty: bigint;
}

export function useSecondarySales(eventId: number) {
  console.log("🎯 useSecondarySales (EVENT-BASED) called with eventId:", eventId);

  const [sales, setSales] = useState<SecondarySale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { event, isLoading: eventLoading, error: eventError } = useEvent(eventId);
  const publicClient = usePublicClient();

  console.log("🔍 Hook state:", {
    eventId,
    hasEvent: !!event,
    hasPublicClient: !!publicClient,
    eventLoading,
    marketplaceAddress: MARKETPLACE_ADDRESS,
  });

  // Get all listings for this event from the contract
  const {
    data: eventListings,
    isLoading: listingsLoading,
    error: listingsError,
  } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: TicketMarketplaceABI.abi,
    functionName: "getListingsByEvent",
    args: [BigInt(eventId)],
    query: {
      enabled: eventId > 0,
    },
  });

  useEffect(() => {
    if (listingsLoading || eventLoading || !publicClient) {
      setLoading(true);
      return;
    }

    if (listingsError || eventError) {
      setError((listingsError || eventError) as Error);
      setLoading(false);
      return;
    }

    if (!event || !eventListings) {
      setSales([]);
      setLoading(false);
      return;
    }

    async function analyzeSales() {
      try {
        if (!event || !publicClient) {
          console.log("⚠️ Missing event or publicClient");
          setSales([]);
          setLoading(false);
          return;
        }

        // Get the event's royalty percentage
        const royaltyBps = Number(event.royaltyBps || 0);

        console.log("🔍 Starting secondary sales analysis for event", eventId);
        console.log("Event details:", {
          eventId,
          organizer: event.organizer,
          royaltyBps,
          royaltyPercentage: royaltyBps / 100,
        });

        // Fetch TicketPurchased events from the contract
        // This is the most accurate way to track actual sales (not cancellations)
        console.log("🔍 Fetching TicketPurchased events from blockchain...");
        console.log("Marketplace address:", MARKETPLACE_ADDRESS);

        let purchasedEvents: any[] = [];
        try {
          // Push Chain RPC has a 10,000 block limit per request
          // We need to fetch in chunks
          const currentBlock = await publicClient.getBlockNumber();
          console.log("Current block:", currentBlock);

          const CHUNK_SIZE = 9999; // Stay under 10000 limit
          const allEvents: any[] = [];

          // Calculate how many chunks we need
          const totalBlocks = Number(currentBlock);
          const numChunks = Math.ceil(totalBlocks / CHUNK_SIZE);

          console.log(`📦 Fetching events in ${numChunks} chunks of ${CHUNK_SIZE} blocks...`);

          for (let i = 0; i < numChunks; i++) {
            const fromBlock = BigInt(i * CHUNK_SIZE);
            const toBlock = BigInt(Math.min((i + 1) * CHUNK_SIZE - 1, totalBlocks));

            console.log(`  Chunk ${i + 1}/${numChunks}: blocks ${fromBlock} to ${toBlock}`);

            const chunkEvents = await publicClient.getContractEvents({
              address: MARKETPLACE_ADDRESS as `0x${string}`,
              abi: TicketMarketplaceABI.abi,
              eventName: "TicketPurchased",
              fromBlock,
              toBlock,
            });

            allEvents.push(...chunkEvents);
            console.log(`    Found ${chunkEvents.length} events in this chunk`);
          }

          purchasedEvents = allEvents;
          console.log(`✅ Found ${purchasedEvents.length} TicketPurchased events total`);

          if (purchasedEvents.length > 0) {
            console.log("Sample events:", purchasedEvents.slice(0, 3).map(e => ({
              args: e.args,
              blockNumber: e.blockNumber,
            })));
          }
        } catch (err) {
          console.error("❌ Error fetching TicketPurchased events:", err);
          console.error("Error details:", err);

          // Fallback: Use inactive listings as a proxy for sales
          console.log("⚠️ Falling back to inactive listings method");
          if (eventListings && (eventListings as any[]).length > 0) {
            const inactiveListings = (eventListings as any[]).filter((l: any) => !l.active);
            console.log(`Found ${inactiveListings.length} inactive listings for event ${eventId}`);

            const fallbackSales: SecondarySale[] = inactiveListings.map((listing: any) => {
              const royaltyAmount = (BigInt(listing.price) * BigInt(royaltyBps)) / BigInt(10000);
              return {
                listingId: listing.listingId,
                tokenId: listing.tokenId,
                seller: listing.seller,
                buyer: "0x0000000000000000000000000000000000000000", // Unknown
                price: listing.price,
                royaltyAmount,
                royaltyReceiver: event.organizer,
                completedAt: new Date(Number(listing.createdAt) * 1000),
                blockNumber: BigInt(0),
              };
            });

            setSales(fallbackSales);
            setLoading(false);
            return;
          }
        }

        // Filter to only include listings from this event
        const listingIds = new Set(
          (eventListings as any[]).map((l: any) => l.listingId.toString())
        );

        console.log("📋 Event listings:", {
          eventId,
          totalEventListings: (eventListings as any[]).length,
          listingIds: Array.from(listingIds),
        });

        console.log("🔍 All TicketPurchased events:", purchasedEvents.map(log => ({
          listingId: log.args.listingId?.toString(),
          tokenId: log.args.tokenId?.toString(),
          seller: log.args.seller,
          buyer: log.args.buyer,
          price: log.args.price?.toString(),
          royaltyAmount: log.args.royaltyAmount?.toString(),
          royaltyReceiver: log.args.royaltyReceiver,
        })));

        const eventSales: SecondarySale[] = purchasedEvents
          .filter((log) => {
            const listingId = log.args.listingId?.toString();
            const matches = listingId && listingIds.has(listingId);
            console.log(`Checking listing ${listingId}: ${matches ? "✅ MATCH" : "❌ no match"}`);
            return matches;
          })
          .map((log) => {
            return {
              listingId: log.args.listingId as bigint,
              tokenId: log.args.tokenId as bigint,
              seller: log.args.seller as string,
              buyer: log.args.buyer as string,
              price: log.args.price as bigint,
              royaltyAmount: log.args.royaltyAmount as bigint,
              royaltyReceiver: log.args.royaltyReceiver as string,
              completedAt: new Date(), // We'd need to fetch block timestamp for exact time
              blockNumber: log.blockNumber,
            };
          });

        console.log("🔍 Secondary Sales Analysis:", {
          eventId,
          totalListings: (eventListings as any[]).length,
          activeListings: (eventListings as any[]).filter((l: any) => l.active).length,
          inactiveListings: (eventListings as any[]).filter((l: any) => !l.active).length,
          purchasedEvents: purchasedEvents.length,
          eventSales: eventSales.length,
          royaltyBps,
          royaltyPercentage: royaltyBps / 100,
          sales: eventSales.map((s) => ({
            listingId: s.listingId.toString(),
            tokenId: s.tokenId.toString(),
            price: s.price.toString(),
            royaltyAmount: s.royaltyAmount.toString(),
            seller: s.seller,
            buyer: s.buyer,
            royaltyReceiver: s.royaltyReceiver,
          })),
        });

        setSales(eventSales);
        setLoading(false);
      } catch (err) {
        console.error("Error analyzing secondary sales:", err);
        setError(err as Error);
        setLoading(false);
      }
    }

    analyzeSales();
  }, [eventListings, listingsLoading, listingsError, event, eventLoading, eventError, eventId, publicClient]);

  const analytics = useMemo((): SecondarySalesData => {
    if (!sales.length) {
      return {
        sales: [],
        totalSales: 0,
        totalVolume: BigInt(0),
        totalRoyalties: BigInt(0),
        avgPrice: BigInt(0),
        avgRoyalty: BigInt(0),
      };
    }

    const totalVolume = sales.reduce((sum, sale) => sum + sale.price, BigInt(0));
    const totalRoyalties = sales.reduce((sum, sale) => sum + sale.royaltyAmount, BigInt(0));
    const avgPrice = totalVolume / BigInt(sales.length);
    const avgRoyalty = totalRoyalties / BigInt(sales.length);

    return {
      sales,
      totalSales: sales.length,
      totalVolume,
      totalRoyalties,
      avgPrice,
      avgRoyalty,
    };
  }, [sales]);

  return {
    analytics,
    loading: loading || listingsLoading || eventLoading,
    error: error || listingsError || eventError,
  };
}
