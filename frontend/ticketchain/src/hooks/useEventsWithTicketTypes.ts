import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { useEvents } from "./useContracts";
import { TICKET_FACTORY_ADDRESS, TicketFactoryABI } from "../lib/contracts";
import { formatEvent } from "../lib/formatters";
import type { FormattedEvent } from "../types";

export interface TicketType {
  eventId: bigint;
  name: string;
  price: bigint;
  supply: bigint;
  sold: bigint;
}

export interface EventWithTicketTypes extends FormattedEvent {
  ticketTypes: TicketType[];
  minPrice: number | null;
  maxPrice: number | null;
  ticketTypeCount: number;
  hasMultipleTiers: boolean;
}

/**
 * Hook to fetch events with their ticket types in a single batch
 * Uses getTicketTypesBatch() for efficient data fetching
 */
export function useEventsWithTicketTypes() {
  const {
    events: rawEvents,
    loading: eventsLoading,
    error: eventsError,
    refetch,
  } = useEvents();

  // Format events
  const events = useMemo(() => rawEvents.map(formatEvent), [rawEvents]);

  // Get all event IDs
  const eventIds = useMemo(
    () => events.map((e) => BigInt(e.eventId)),
    [events]
  );

  // Batch fetch all ticket types
  const {
    data: ticketTypesBatch,
    isLoading: ticketTypesLoading,
    error: ticketTypesError,
  } = useReadContract({
    address: TICKET_FACTORY_ADDRESS as `0x${string}`,
    abi: TicketFactoryABI,
    functionName: "getTicketTypesBatch",
    args: [eventIds],
    query: {
      enabled: eventIds.length > 0,
    },
  });

  // Combine events with their ticket types
  const eventsWithTicketTypes = useMemo<EventWithTicketTypes[]>(() => {
    if (!events.length) return [];
    if (!ticketTypesBatch) {
      // Return events without ticket types while loading
      return events.map((event) => ({
        ...event,
        ticketTypes: [],
        minPrice: null,
        maxPrice: null,
        ticketTypeCount: 0,
        hasMultipleTiers: false,
      })) as EventWithTicketTypes[];
    }

    const batchArray = ticketTypesBatch as TicketType[][];

    return events.map((event, index) => {
      const ticketTypes = batchArray[index] || [];

      // Calculate price info
      const prices = ticketTypes.map((t) => Number(t.price));
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
      const ticketTypeCount = ticketTypes.length;
      const hasMultipleTiers = ticketTypeCount > 1;

      return {
        ...event,
        ticketTypes,
        minPrice,
        maxPrice,
        ticketTypeCount,
        hasMultipleTiers,
      };
    });
  }, [events, ticketTypesBatch]);

  return {
    events: eventsWithTicketTypes,
    loading: eventsLoading || ticketTypesLoading,
    error: eventsError || (ticketTypesError ? ticketTypesError.message : null),
    refetch,
  };
}
