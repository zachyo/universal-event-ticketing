import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Share2,
  Heart,
  ExternalLink,
  Ticket,
} from "lucide-react";
import { useGetEvent, useTicketTypes } from "../hooks/useContracts";
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
import { TicketFactoryABI, TICKET_FACTORY_ADDRESS } from "../lib/contracts";
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

type TicketTypeOption = {
  id: string;
  ticketTypeId: bigint;
  name: string;
  price: bigint;
  supply: number;
  sold: number;
  available: number;
  soldOut: boolean;
};

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? parseInt(id) : 0;

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<
    string | null
  >(null);

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
  const { pushChainClient, isInitialized } = usePushChainClient();
  const { connectionStatus, handleConnectToPushWallet } =
    usePushWalletContext();
  const { PushChain } = usePushChain();

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
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-4/6"></div>
            </div>
            <div>
              <div className="h-48 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (eventError || ticketTypesError || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Event Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            {eventError?.toString() ||
              ticketTypesError?.toString() ||
              "The event you are looking for does not exist."}
          </p>
          <Link
            to="/events"
            className="text-blue-600 hover:text-blue-800 font-medium"
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

    try {
      setIsPurchasing(true);

      const ticketTypeId = selectedTicketType.ticketTypeId;
      const txData = PushChain.utils.helpers.encodeTxData({
        abi: Array.from(TicketFactoryABI),
        functionName: "purchaseTickets",
        args: [BigInt(eventId), ticketTypeId, 1],
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
    }
  };

  const handleConfirmQuickPurchase = async () => {
    const result = await handleQuickPurchase();
    if (result === "success") {
      setShowConfirmModal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-800 border-green-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ended":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/events"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Event Hero */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="relative h-64 md:h-96">
            <img
              src={formattedEvent.imageUrl || "/placeholder-event.jpg"}
              alt={formattedEvent.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-event.jpg";
              }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>

            {/* Event Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    status
                  )} bg-white`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
                {isSoldOut && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Sold Out
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {formattedEvent.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDateTime(formattedEvent.startTime)}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {formattedEvent.venue}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {availability}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-opacity-30 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-opacity-30 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">About This Event</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {formattedEvent.description}
                </p>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Date & Time
                  </h4>
                  <div className="space-y-1 text-gray-600">
                    <p>Starts: {formatDateTime(formattedEvent.startTime)}</p>
                    <p>Ends: {formatDateTime(formattedEvent.endTime)}</p>
                    {status === "upcoming" && (
                      <p className="text-blue-600 font-medium">{timeUntil}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                  <p className="text-gray-600">{formattedEvent.venue}</p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm mt-1 flex items-center">
                    View on Map <ExternalLink className="w-3 h-3 ml-1" />
                  </button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Organizer</h4>
                  <p className="text-gray-600 font-mono text-sm">
                    {formatAddress(formattedEvent.organizer)}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Capacity</h4>
                  <p className="text-gray-600">
                    {formattedEvent.totalSupply} total tickets
                  </p>
                  <p className="text-gray-600">
                    {formattedEvent.sold} sold,{" "}
                    {formattedEvent.totalSupply - formattedEvent.sold} remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Ticket Types */}
            {ticketTypes && ticketTypes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold mb-4">Ticket Types</h3>
                <div className="space-y-4">
                  {ticketTypes.map((ticketType) => {
                    const available =
                      Number(ticketType.supply) - Number(ticketType.sold);
                    const soldOut = available === 0;

                    return (
                      <div
                        key={ticketType.ticketTypeId?.toString()}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-lg">
                              {ticketType.name}
                            </h4>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatPrice(ticketType.price)} PC
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {available} of {Number(ticketType.supply)}{" "}
                              available
                            </p>
                            {soldOut && (
                              <p className="text-red-600 font-medium text-sm">
                                Sold Out
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {priceText}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Pay with any supported currency
                </div>
                <p className="text-gray-600">
                  {selectedTicketType
                    ? `${selectedTicketType.available} of ${selectedTicketType.supply} available`
                    : ticketTypeOptions.length > 1
                    ? "Starting from"
                    : ticketTypeOptions.length === 1
                    ? `${ticketTypeOptions[0].available} of ${ticketTypeOptions[0].supply} available`
                    : "Ticket price"}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Select ticket tier
                </p>
                {ticketTypeOptions.length > 0 ? (
                  <div className="space-y-2">
                    {ticketTypeOptions.map((option) => {
                      const isSelected = option.id === selectedTicketTypeId;
                      const disabled = option.soldOut;
                      return (
                        <button
                          type="button"
                          key={option.id}
                          onClick={() =>
                            !disabled && setSelectedTicketTypeId(option.id)
                          }
                          disabled={disabled}
                          className={`w-full rounded-lg border p-3 text-left transition ${
                            isSelected
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                          } ${
                            disabled
                              ? "cursor-not-allowed opacity-60 hover:border-gray-200"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-900">
                                {option.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {option.available} of {option.supply} available
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-600">
                                {formatPrice(option.price)} PC
                              </p>
                              {disabled && (
                                <p className="text-xs font-medium text-red-600">
                                  Sold Out
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Tickets aren’t available yet for this event.
                  </p>
                )}
              </div>

              {status === "upcoming" && !isSoldOut ? (
                <>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isPurchasing || !canPurchase}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors mb-3"
                  >
                    {isPurchasing
                      ? "Processing..."
                      : selectedTicketType
                      ? `Buy ${selectedTicketType.name}`
                      : "Buy Ticket"}
                  </button>
                  {purchaseError && (
                    <p className="text-sm text-red-600 mb-2">{purchaseError}</p>
                  )}
                  {txHash && pushChainClient && (
                    <div className="text-sm text-green-600">
                      <p className="font-medium">Purchase submitted!</p>
                      <a
                        className="underline"
                        href={pushChainClient.explorer.getTransactionUrl(
                          txHash
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on Explorer
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-3 mb-4">
                  {isSoldOut && (
                    <p className="text-red-600 font-medium">Sold Out</p>
                  )}
                  {status === "ended" && (
                    <p className="text-gray-500 font-medium">Event Ended</p>
                  )}
                  {status === "live" && (
                    <p className="text-green-600 font-medium">Event is Live</p>
                  )}
                  {status === "inactive" && (
                    <p className="text-red-600 font-medium">Event Inactive</p>
                  )}
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tickets:</span>
                  <span className="font-medium">
                    {formattedEvent.totalSupply}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sold:</span>
                  <span className="font-medium">{formattedEvent.sold}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium">
                    {formattedEvent.totalSupply - formattedEvent.sold}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Sales Progress</span>
                  <span>
                    {Math.round(
                      (formattedEvent.sold / formattedEvent.totalSupply) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                ? `You’re about to buy 1 ${
                    selectedTicketType.name
                  } ticket for ${formatPrice(selectedTicketType.price)} PC.`
                : "No tickets are currently available for this event."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Make sure your Push Wallet is connected and funded with a
              supported currency.
            </p>
            {connectionStatus !==
              PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED && (
              <p className="text-amber-600">
                We’ll prompt you to connect your Push Wallet before completing
                the purchase.
              </p>
            )}
            {purchaseError && <p className="text-red-600">{purchaseError}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="w-full sm:w-auto rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={handleConfirmQuickPurchase}
              disabled={isPurchasing || !canPurchase}
              className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
            >
              {isPurchasing ? "Processing..." : "Confirm & Buy"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetailPage;
