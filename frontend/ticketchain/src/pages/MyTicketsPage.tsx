import { useState, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { Filter, Search, QrCode, AlertCircle } from "lucide-react";
import {
  useUserTickets,
  useListTicket,
  useEvents,
} from "../hooks/useContracts";
import {
  TicketCard,
  TicketCardSkeleton,
  TicketGrid,
  TicketsEmptyState,
} from "../components/TicketCard";
import { usePushWalletContext, PushUI, usePushChain } from "@pushchain/ui-kit";
import {
  formatTicket,
  formatEvent,
  formatPriceWithCurrency,
  formatPriceInCurrency,
} from "../lib/formatters";
import { PC_TOKEN } from "../lib/contracts";
import type { FormattedEvent } from "../types";

interface ListTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: number;
  onList: (tokenId: number, price: string) => Promise<void>;
}

function ListTicketModal({
  isOpen,
  onClose,
  tokenId,
  onList,
}: ListTicketModalProps) {
  const [price, setPrice] = useState("");
  const [isListing, setIsListing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pcSymbol = PC_TOKEN.symbol;

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      setPrice("");
      setIsListing(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) return;

    setIsListing(true);
    setErrorMessage(null);
    try {
      await onList(tokenId, price);
      onClose();
      setPrice("");
    } catch (error) {
      console.error("Failed to list ticket:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to list ticket. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsListing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-bold mb-4">List Ticket for Sale</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price ({pcSymbol})
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Set your asking price in PC tokens. Push Chain will convert the
              buyer's payment from their origin chain automatically.
            </p>
            {errorMessage && (
              <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isListing || !price}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isListing ? "Listing..." : "List Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type StatusFilter = "all" | "valid" | "used";

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All Tickets" },
  { key: "valid", label: "Valid" },
  { key: "used", label: "Used" },
];

const MyTicketsPage = () => {
  const { connectionStatus, universalAccount, handleConnectToPushWallet } =
    usePushWalletContext();
  const { PushChain } = usePushChain();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const pushConnected =
    connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED;
  const isConnected =
    pushConnected || isEvmConnected || !!universalAccount || !!evmAddress;

  const [pushAccountAddress, setPushAccountAddress] = useState<
    string | undefined
  >(undefined);
  const [isResolvingPushAccount, setIsResolvingPushAccount] = useState(false);
  const [addressResolutionError, setAddressResolutionError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function resolvePushAccount() {
      if (!PushChain) {
        return;
      }

      if (!universalAccount) {
        if (!cancelled) {
          setPushAccountAddress(undefined);
          setIsResolvingPushAccount(false);
          setAddressResolutionError(null);
        }
        return;
      }

      setIsResolvingPushAccount(true);
      setAddressResolutionError(null);

      try {
        const { address } =
          await PushChain.utils.account.convertOriginToExecutor(
            universalAccount,
            { onlyCompute: true }
          );

        if (!cancelled) {
          setPushAccountAddress(address);
        }
      } catch (conversionError) {
        console.error(
          "Failed to resolve Push executor address:",
          conversionError
        );
        if (!cancelled) {
          setPushAccountAddress(undefined);
          setAddressResolutionError(
            "We couldn't map your wallet to Push Chain. Please reconnect and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setIsResolvingPushAccount(false);
        }
      }
    }

    resolvePushAccount();

    return () => {
      cancelled = true;
    };
  }, [PushChain, universalAccount, evmAddress]);

  console.log("origin account:", universalAccount?.address ?? evmAddress);
  console.log("resolved push account:", pushAccountAddress);

  const { tickets, loading, error, refetch } =
    useUserTickets(pushAccountAddress);
  const { listTicket } = useListTicket();
  const { events, loading: eventsLoading } = useEvents();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showListModal, setShowListModal] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

  const formattedEvents = useMemo(() => events.map(formatEvent), [events]);

  const eventsById = useMemo<Map<number, FormattedEvent>>(() => {
    const map = new Map<number, FormattedEvent>();
    formattedEvents.forEach((event) => map.set(event.eventId, event));
    return map;
  }, [formattedEvents]);

  const formattedTickets = useMemo(() => {
    if (!tickets.length) return [];

    return tickets.map((ticket) =>
      formatTicket(ticket, eventsById.get(Number(ticket.eventId)))
    );
  }, [tickets, eventsById]);

  const ticketStats = useMemo(() => {
    let valid = 0;
    let used = 0;
    let totalPurchaseValue = 0n;

    formattedTickets.forEach((ticket) => {
      if (ticket.ticketStatus === "used") {
        used += 1;
      } else {
        valid += 1;
      }

      totalPurchaseValue += ticket.purchasePrice;
    });

    return {
      total: formattedTickets.length,
      valid,
      used,
      totalPurchaseValue,
    };
  }, [formattedTickets]);

  const totalValuePC =
    ticketStats.totalPurchaseValue > 0n
      ? formatPriceWithCurrency(ticketStats.totalPurchaseValue)
      : `0 ${PC_TOKEN.symbol}`;

  const totalValueInEth =
    ticketStats.totalPurchaseValue > 0n
      ? formatPriceInCurrency(ticketStats.totalPurchaseValue, "ETH")
      : "0 ETH";

  const isLoading = loading || eventsLoading || isResolvingPushAccount;

  // Filter and search tickets
  const filteredTickets = useMemo(() => {
    if (!formattedTickets.length) return [];

    let visibleTickets = [...formattedTickets];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      visibleTickets = visibleTickets.filter(
        (ticket) =>
          ticket.event?.name?.toLowerCase().includes(query) ||
          ticket.event?.venue?.toLowerCase().includes(query) ||
          ticket.tokenId.toString().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      visibleTickets = visibleTickets.filter((ticket) =>
        statusFilter === "valid"
          ? ticket.ticketStatus !== "used"
          : ticket.ticketStatus === "used"
      );
    }

    return visibleTickets;
  }, [formattedTickets, searchQuery, statusFilter]);

  const handleListTicket = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setShowListModal(true);
  };

  const handleConfirmList = async (tokenId: number, price: string) => {
    try {
      const priceWei = parseUnits(price, 18);
      if (priceWei <= 0n) {
        throw new Error("Listing price must be greater than zero");
      }
      await listTicket({ tokenId: BigInt(tokenId), price: priceWei });
      await refetch(); // Refresh tickets
    } catch (error) {
      console.error("Failed to list ticket:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to list ticket. Please try again.");
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-6">
            Connect a Push universal wallet or any supported EVM wallet to see
            your tickets.
          </p>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            onClick={handleConnectToPushWallet}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (isResolvingPushAccount) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Preparing Your Tickets</h1>
          <p className="text-gray-600">
            Mapping your wallet to its Push Chain executor address...
          </p>
        </div>
      </div>
    );
  }

  if (!pushAccountAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Address Not Ready</h1>
          <p className="text-gray-600 mb-6">
            {addressResolutionError ??
              "We're still syncing your universal account on Push Chain."}
          </p>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            onClick={handleConnectToPushWallet}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <QrCode className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Tickets</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={refetch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Tickets</h1>
        <p className="text-gray-600">
          Your NFT ticket collection. Show QR codes at events or list them for
          sale.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tickets by event name, venue, or token ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Filter by status:
            </span>
          </div>

          <div className="flex gap-2">
            {STATUS_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && ticketStats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {ticketStats.total}
            </div>
            <div className="text-sm text-gray-600">Total Tickets</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {ticketStats.valid}
            </div>
            <div className="text-sm text-gray-600">Valid Tickets</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {ticketStats.used}
            </div>
            <div className="text-sm text-gray-600">Used Tickets</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totalValuePC}
            </div>
            <div className="text-xs text-gray-500">≈ {totalValueInEth}</div>
            <div className="text-sm text-gray-600">Total Purchased Value</div>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && (
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredTickets.length} ticket
            {filteredTickets.length !== 1 ? "s" : ""} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>
      )}

      {/* Tickets Grid */}
      {isLoading ? (
        <TicketGrid>
          {Array.from({ length: 6 }).map((_, index) => (
            <TicketCardSkeleton key={index} />
          ))}
        </TicketGrid>
      ) : filteredTickets.length > 0 ? (
        <TicketGrid>
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.tokenId}
              ticket={ticket}
              showQR={true}
              showListButton={ticket.ticketStatus !== "used"}
              onList={handleListTicket}
            />
          ))}
        </TicketGrid>
      ) : (
        <TicketsEmptyState
          message={
            formattedTickets.length === 0
              ? "You don't have any tickets yet. Start by purchasing tickets to events!"
              : searchQuery
              ? `No tickets found matching "${searchQuery}"`
              : statusFilter !== "all"
              ? `No ${statusFilter} tickets found`
              : "No tickets match your current filters"
          }
        />
      )}

      {/* List Ticket Modal */}
      <ListTicketModal
        isOpen={showListModal}
        onClose={() => {
          setShowListModal(false);
          setSelectedTokenId(null);
        }}
        tokenId={selectedTokenId || 0}
        onList={handleConfirmList}
      />
    </div>
  );
};

export default MyTicketsPage;
