import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Ticket,
  BarChart3,
} from "lucide-react";
import { useGetEvent, useTicketTypes } from "../hooks/useContracts";
import { uploadTicketMetadata } from "../hooks/useAutoMetadata";
import {
  formatEvent,
  formatDateTime,
  formatAvailability,
  getTimeUntilEvent,
  getEventStatus,
  formatPrice,
  formatAddress,
  getPriceRange,
  formatPriceRange,
} from "../lib/formatters";
import {
  TicketFactoryABI,
  TICKET_FACTORY_ADDRESS,
  TicketNFTABI,
  TICKET_NFT_ADDRESS,
} from "../lib/contracts";
import {
  usePushChainClient,
  usePushWalletContext,
  usePushChain,
  PushUI,
} from "@pushchain/ui-kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../components/ui/dialog";
import { MarketplaceSection } from "../components/event/MarketplaceSection";
import { cn } from "../utils/cn";


type TicketTypeOption = {
  id: string;
  ticketTypeId: bigint;
  name: string;
  price: bigint;
  supply: number;
  sold: number;
  available: number;
  soldOut: boolean;
  imageIpfsHash?: string;
};

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? parseInt(id) : 0;
  const { address } = useAccount();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<
    string | null
  >(null);

  // UEA resolution removed to prevent loading issues

  const {
    event,
    isLoading: eventLoading,
    error: eventError,
    refetch: refetchEvent,
  } = useGetEvent(eventId);
  const {
    ticketTypes,
    isLoading: ticketTypesLoading,
    error: ticketTypesError,
    refetch: refetchTicketTypes,
  } = useTicketTypes(eventId);
  const { data: tokenCounterData, refetch: refetchTokenCounter } =
    useReadContract({
      address: TICKET_NFT_ADDRESS as `0x${string}`,
      abi: TicketNFTABI,
      functionName: "tokenCounter",
    });
  const { pushChainClient, isInitialized } = usePushChainClient();
  const { connectionStatus, handleConnectToPushWallet, universalAccount } =
    usePushWalletContext();
  const { PushChain } = usePushChain();

  // UEA resolution state
  const [ueaAddress, setUeaAddress] = useState<string | null>(null);

  // Resolve UEA address for proper organizer comparison
  useEffect(() => {
    const resolveExecutorAddress = async () => {
      if (!event?.organizer) return;

      // Fallback if Push Chain not available
      if (!universalAccount || !PushChain) {
        console.log("Push Chain not available, using origin address");
        setUeaAddress(address || null);
        return;
      }

      try {
        console.log("Resolving UEA from origin:", universalAccount.address);

        // Convert origin address to UEA
        const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
          universalAccount,
          { onlyCompute: true }
        );

        const executorAddress = executorInfo.address;
        console.log("Resolved UEA:", executorAddress);
        setUeaAddress(executorAddress);
      } catch (err) {
        console.error("Failed to resolve executor address:", err);
        // Fallback to origin address
        setUeaAddress(address || null);
      }
    };

    resolveExecutorAddress();
  }, [universalAccount, PushChain, address, event?.organizer]);

  // Check if current user is the organizer using UEA
  const isOrganizer = useMemo(() => {
    if (!event?.organizer || !ueaAddress) return false;
    
    const organizerAddress = event.organizer.toLowerCase();
    const myUEA = ueaAddress.toLowerCase();
    
    console.log("🔍 Organizer Check (UEA):", {
      organizerAddress,
      myUEA,
      isMatch: organizerAddress === myUEA
    });
    
    return organizerAddress === myUEA;
  }, [event?.organizer, ueaAddress]);

  const ticketTypeOptions = useMemo<TicketTypeOption[]>(() => {
    if (!ticketTypes) return [];

    return ticketTypes.map((ticketType, index) => {
      const ticketTypeId = ticketType.ticketTypeId ?? BigInt(index);
      const supply = Number(ticketType.supply);
      const sold = Number(ticketType.sold);
      const available = Math.max(supply - sold, 0);

      return {
        id: ticketTypeId.toString(),
        ticketTypeId,
        name: ticketType.name,
        price: ticketType.price,
        supply,
        sold,
        available,
        soldOut: available === 0,
        imageIpfsHash: ticketType.imageIpfsHash,
      };
    });
  }, [ticketTypes]);

  const availableTicketOptions = useMemo(
    () => ticketTypeOptions.filter((option) => option.available > 0),
    [ticketTypeOptions]
  );

  useEffect(() => {
    if (availableTicketOptions.length === 0) {
      setSelectedTicketTypeId(null);
      return;
    }

    setSelectedTicketTypeId((prev) => {
      if (prev && availableTicketOptions.some((option) => option.id === prev)) {
        return prev;
      }
      return availableTicketOptions[0].id;
    });
  }, [availableTicketOptions]);

  useEffect(() => {
    setPurchaseError(null);
  }, [selectedTicketTypeId]);

  const selectedTicketType = useMemo(
    () =>
      ticketTypeOptions.find((option) => option.id === selectedTicketTypeId) ??
      null,
    [ticketTypeOptions, selectedTicketTypeId]
  );

  if (eventLoading || ticketTypesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/4 rounded bg-border/60"></div>
          <div className="mb-6 h-64 rounded bg-border/60"></div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-4 h-6 w-3/4 rounded bg-border/60"></div>
              <div className="mb-2 h-4 w-full rounded bg-border/60"></div>
              <div className="mb-2 h-4 w-5/6 rounded bg-border/60"></div>
              <div className="h-4 w-4/6 rounded bg-border/60"></div>
            </div>
            <div>
              <div className="h-48 rounded bg-border/60"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (eventError || ticketTypesError || !event) {
    return (
      <div className="container px-4 py-16">
        <div className="glass-card mx-auto max-w-xl rounded-[2rem] border border-border/70 bg-card/85 px-6 py-12 text-center">
          <Ticket className="mx-auto mb-4 h-14 w-14 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">
            Event Not Found
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            {eventError?.toString() ||
              ticketTypesError?.toString() ||
              "The event you are looking for does not exist."}
          </p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const formattedEvent = formatEvent(event);
  const status = getEventStatus(formattedEvent);
  const timeUntil = getTimeUntilEvent(formattedEvent.startTime);
  const availability = formatAvailability(
    formattedEvent.sold,
    formattedEvent.totalSupply
  );
  const isSoldOut = formattedEvent.sold >= formattedEvent.totalSupply;

  const priceRange = ticketTypes
    ? getPriceRange(ticketTypes)
    : { min: 0, max: 0 };

  const priceText = selectedTicketType
    ? `${formatPrice(selectedTicketType.price)} PC`
    : priceRange.min === priceRange.max
    ? `${formatPrice(BigInt(priceRange.min))} PC`
    : `${formatPriceRange(priceRange.min, priceRange.max)} PC`;

  const canPurchase = !!selectedTicketType && selectedTicketType.available > 0;

  const handleQuickPurchase = async (): Promise<
    "connect" | "error" | "success"
  > => {
    setPurchaseError(null);
    setTxHash(null);

    if (connectionStatus !== PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED) {
      handleConnectToPushWallet();
      return "connect";
    }

    if (!pushChainClient || !isInitialized || !PushChain) {
      setPurchaseError(
        "Push Chain client is initializing. Please try again in a moment."
      );
      return "error";
    }

    if (!selectedTicketType) {
      setPurchaseError(
        availableTicketOptions.length > 0
          ? "Please select a ticket tier."
          : "No tickets are currently available."
      );
      return "error";
    }

    if (selectedTicketType.available <= 0) {
      setPurchaseError("This ticket tier is sold out.");
      return "error";
    }

    if (!event) {
      setPurchaseError("Event data not loaded.");
      return "error";
    }

    try {
      setIsPurchasing(true);
      setIsGeneratingMetadata(true);

      let currentCounter: bigint | undefined;
      if (refetchTokenCounter) {
        try {
          const refetchResponse = await refetchTokenCounter();
          const result = (refetchResponse as { result?: unknown })?.result;
          if (typeof result === "bigint") {
            currentCounter = result;
          } else if (typeof result === "number") {
            currentCounter = BigInt(result);
          } else if (result !== undefined && result !== null) {
            currentCounter = BigInt(result as bigint);
          }
        } catch (error) {
          console.warn("Failed to refetch token counter", error);
        }
      }

      if (currentCounter === undefined) {
        const data = tokenCounterData;
        if (typeof data === "bigint") {
          currentCounter = data;
        } else if (typeof data === "number") {
          currentCounter = BigInt(data);
        } else if (data !== undefined && data !== null) {
          currentCounter = BigInt(data as bigint);
        } else {
          currentCounter = 0n;
        }
      }

      const nextTokenId = currentCounter + 1n;
      const purchaseChain = "Push Chain Universal";

      const { tokenURI } = await uploadTicketMetadata({
        tokenId: Number(nextTokenId),
        event: formattedEvent,
        ticketTypeName: selectedTicketType.name,
        purchasePrice: selectedTicketType.price,
        purchaseChain,
        tierImageIpfsHash: selectedTicketType.imageIpfsHash,
      });

      setIsGeneratingMetadata(false);

      const ticketTypeId = selectedTicketType.ticketTypeId;
      const txData = PushChain.utils.helpers.encodeTxData({
        abi: Array.from(TicketFactoryABI),
        functionName: "purchaseTicketWithURI",
        args: [BigInt(eventId), ticketTypeId, tokenURI],
      });

      const tx = await pushChainClient.universal.sendTransaction({
        to: TICKET_FACTORY_ADDRESS,
        data: txData,
        value: selectedTicketType.price,
      });

      await tx.wait();
      setTxHash(tx.hash);

      localStorage.removeItem("ticketchain_cache");
      await refetchEvent();
      await refetchTicketTypes();
      return "success";
    } catch (error) {
      console.error("Quick purchase failed:", error);
      if (error instanceof Error) {
        setPurchaseError(error.message);
      } else {
        setPurchaseError("Purchase failed. Please try again.");
      }
      return "error";
    } finally {
      setIsPurchasing(false);
      setIsGeneratingMetadata(false);
    }
  };

  const handleConfirmQuickPurchase = async () => {
    const result = await handleQuickPurchase();
    if (result === "success") {
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      <div className="container px-4 space-y-6 pt-4">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-lg">
          <div className="absolute inset-0 bg-primary/10" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="relative">
              <div className="h-64 overflow-hidden rounded-[2.5rem] lg:h-full">
                <img
                  src={formattedEvent.imageUrl || "/placeholder-event.jpg"}
                  alt={formattedEvent.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-event.jpg";
                  }}
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-6 pb-6 pt-24 text-white">
                <div className="flex flex-wrap items-center gap-3 pb-4">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                      status === "live"
                        ? "border-emerald-300 bg-emerald-400/20 text-emerald-100"
                        : status === "upcoming"
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : status === "ended"
                        ? "border-zinc-300 bg-zinc-500/20 text-zinc-100"
                        : "border-rose-300 bg-rose-400/20 text-rose-100"
                    )}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  {isSoldOut && (
                    <span className="rounded-full border border-rose-300 bg-rose-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-100">
                      Sold Out
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                  {formattedEvent.name}
                </h1>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
                  <div className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(formattedEvent.startTime)}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {formattedEvent.venue}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {availability}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col justify-between gap-6 border-t border-t-border/30 bg-card/85 px-6 py-6 lg:border-l lg:border-t-0">
              {isOrganizer && (
                <Link
                  to={`/event-analytics/${eventId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <BarChart3 className="h-4 w-4" />
                  Event Analytics
                </Link>
              )}
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <span className="text-xs uppercase tracking-wider text-primary">
                    Price Range
                  </span>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {priceText}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <span className="text-xs uppercase tracking-wider text-primary">
                    Time Until Event
                  </span>
                  <p className="mt-2 text-base text-foreground">
                    {status === "upcoming"
                      ? timeUntil
                      : status === "live"
                      ? "Happening now"
                      : status === "ended"
                      ? "Event ended"
                      : "Inactive"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                Organized by{" "}
                <span className="font-mono text-sm text-foreground">
                  {formatAddress(formattedEvent.organizer)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="glass-card rounded-[2rem] border border-border/70 bg-card/85 p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
                About this experience
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {formattedEvent.description}
              </p>
            </div>

            {/* Event Details */}
            <div className="glass-card rounded-[2rem] border border-border/70 bg-card/85 p-6 md:p-8">
              <h3 className="text-xl font-semibold text-foreground md:text-2xl">
                Event essentials
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date & Time
                  </h4>
                  <div className="space-y-1 text-sm text-foreground">
                    <p>Starts: {formatDateTime(formattedEvent.startTime)}</p>
                    <p>Ends: {formatDateTime(formattedEvent.endTime)}</p>
                    {status === "upcoming" && (
                      <p className="text-primary font-semibold">{timeUntil}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Location
                  </h4>
                  <p className="text-sm text-foreground">
                    {formattedEvent.venue}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Organizer
                  </h4>
                  <p className="font-mono text-sm text-foreground">
                    {formatAddress(formattedEvent.organizer)}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Capacity
                  </h4>
                  <p className="text-sm text-foreground">
                    {formattedEvent.totalSupply} total tickets
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formattedEvent.sold} sold ·{" "}
                    {formattedEvent.totalSupply - formattedEvent.sold} remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Ticket Types */}
            {ticketTypes && ticketTypes.length > 0 && (
              <div className="glass-card rounded-[2rem] border border-border/70 bg-card/85 p-6 md:p-8">
                <h3 className="text-xl font-semibold text-foreground md:text-2xl">
                  Ticket tiers
                </h3>
                <div className="mt-4 space-y-4">
                  {ticketTypes.map((ticketType) => {
                    const available =
                      Number(ticketType.supply) - Number(ticketType.sold);
                    const soldOut = available === 0;
                    const tierImageUrl = ticketType.imageIpfsHash
                      ? `https://gateway.pinata.cloud/ipfs/${ticketType.imageIpfsHash}`
                      : formattedEvent.imageUrl || "/placeholder-event.jpg";

                    return (
                      <div
                        key={ticketType.ticketTypeId?.toString()}
                        className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <img
                          src={tierImageUrl}
                          alt={ticketType.name}
                          className="h-16 w-16 rounded-2xl border border-border/60 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              formattedEvent.imageUrl ||
                              "/placeholder-event.jpg";
                          }}
                        />

                        <div className="flex flex-1 items-center justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-semibold text-foreground">
                              {ticketType.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {available} of {Number(ticketType.supply)}{" "}
                              available
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-semibold text-primary">
                              {formatPrice(ticketType.price)} PC
                            </span>
                            {soldOut && (
                              <span className="rounded-full border border-rose-200 bg-rose-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-500">
                                Sold Out
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Marketplace Section - Resale Tickets */}
            <MarketplaceSection eventId={eventId} />
          </div>

          <div className="space-y-6 lg:sticky lg:top-32">
            <div className="glass-card rounded-[2rem] border border-border/70 bg-card/90 p-6 md:p-8">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Choose your tier
                </p>
                <div className="mt-2 text-3xl font-semibold text-foreground">
                  {priceText}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedTicketType
                    ? `${selectedTicketType.available} of ${selectedTicketType.supply} available`
                    : ticketTypeOptions.length > 1
                    ? "Starting from"
                    : ticketTypeOptions.length === 1
                    ? `${ticketTypeOptions[0].available} of ${ticketTypeOptions[0].supply} available`
                    : "Ticket price"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select ticket tier
                </p>
                {ticketTypeOptions.length > 0 ? (
                  <div className="space-y-2">
                    {ticketTypeOptions.map((option) => {
                      const isSelected = option.id === selectedTicketTypeId;
                      const disabled = option.soldOut;
                      const tierImageUrl = option.imageIpfsHash
                        ? `https://gateway.pinata.cloud/ipfs/${option.imageIpfsHash}`
                        : formattedEvent.imageUrl || "/placeholder-event.jpg";

                      return (
                        <button
                          type="button"
                          key={option.id}
                          onClick={() =>
                            !disabled && setSelectedTicketTypeId(option.id)
                          }
                          disabled={disabled}
                          className={cn(
                            "w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                            disabled &&
                              "cursor-not-allowed opacity-60 hover:border-border/60",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border/60 bg-background/70 hover:border-primary/40"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={tierImageUrl}
                              alt={option.name}
                              className="h-12 w-12 rounded-xl border border-border/60 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  formattedEvent.imageUrl ||
                                  "/placeholder-event.jpg";
                              }}
                            />

                            <div className="flex flex-1 items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {option.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {option.available} of {option.supply}{" "}
                                  available
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-primary">
                                  {formatPrice(option.price)} PC
                                </p>
                                {disabled && (
                                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">
                                    Sold Out
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-border/60 bg-background/70 px-4 py-6 text-sm text-muted-foreground">
                    Tickets aren’t available yet for this event.
                  </p>
                )}
              </div>

              {status === "upcoming" && !isSoldOut ? (
                <>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={
                      isPurchasing || isGeneratingMetadata || !canPurchase
                    }
                    className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                  >
                    {isPurchasing
                      ? "Processing purchase..."
                      : isGeneratingMetadata
                      ? "Preparing your ticket..."
                      : selectedTicketType
                      ? `Buy ${selectedTicketType.name}`
                      : "Buy Ticket"}
                  </button>
                  {purchaseError && (
                    <p className="text-sm font-medium text-destructive">
                      {purchaseError}
                    </p>
                  )}
                  {txHash && pushChainClient && (
                    <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary-foreground">
                      <p className="font-semibold">
                        {isGeneratingMetadata
                          ? "Purchase complete! Generating ticket metadata..."
                          : "Purchase successful!"}
                      </p>
                      <a
                        className="inline-flex items-center gap-2 text-xs font-medium underline"
                        href={pushChainClient.explorer.getTransactionUrl(
                          txHash
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on Explorer
                      </a>
                      {!isGeneratingMetadata && (
                        <p className="mt-1 text-xs">
                          <Link
                            to="/my-tickets"
                            className="font-semibold underline"
                          >
                            View in My Tickets →
                          </Link>
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-6 text-center text-sm font-semibold text-muted-foreground">
                  {isSoldOut && (
                    <p className="text-destructive">Sold Out</p>
                  )}
                  {status === "ended" && (
                    <p className="text-muted-foreground">Event Ended</p>
                  )}
                  {status === "live" && (
                    <p className="text-primary">Event is Live</p>
                  )}
                  {status === "inactive" && (
                    <p className="text-destructive">Event Inactive</p>
                  )}
                </div>
              )}

              <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Tickets</span>
                  <span className="font-semibold text-foreground">
                    {formattedEvent.totalSupply}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Sold</span>
                  <span className="font-semibold text-foreground">
                    {formattedEvent.sold}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Available</span>
                  <span className="font-semibold text-foreground">
                    {formattedEvent.totalSupply - formattedEvent.sold}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs uppercase tracking-wide text-muted-foreground">
                  <span>Sales progress</span>
                  <span className="text-foreground">
                    {Math.round(
                      (formattedEvent.sold / formattedEvent.totalSupply) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${
                        (formattedEvent.sold / formattedEvent.totalSupply) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm ticket purchase</DialogTitle>
            <DialogDescription>
              {selectedTicketType
                ? `You're about to buy 1 ${
                    selectedTicketType.name
                  } ticket for ${formatPrice(selectedTicketType.price)} PC.`
                : "No tickets are currently available for this event."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Make sure your Push Wallet is connected and funded with a
              supported currency.
            </p>
            {connectionStatus !==
              PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED && (
              <p className="text-amber-500">
                We'll prompt you to connect your Push Wallet before completing
                the purchase.
              </p>
            )}
            {isPurchasing && (
              <p className="font-semibold text-primary">
                Processing your purchase...
              </p>
            )}
            {isGeneratingMetadata && (
              <p className="font-semibold text-primary">
                Generating your ticket metadata and uploading to IPFS...
              </p>
            )}
            {purchaseError && (
              <p className="font-semibold text-destructive">{purchaseError}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                disabled={isPurchasing || isGeneratingMetadata}
                className="w-full rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={handleConfirmQuickPurchase}
              disabled={isPurchasing || isGeneratingMetadata || !canPurchase}
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary sm:w-auto"
            >
              {isPurchasing
                ? "Processing..."
                : isGeneratingMetadata
                ? "Preparing ticket..."
                : "Confirm & Buy"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
};

export default EventDetailPage;
