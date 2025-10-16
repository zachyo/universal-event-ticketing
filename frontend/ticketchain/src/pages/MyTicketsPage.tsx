import { useState, useMemo } from "react";
import { Filter, Search, QrCode, AlertCircle } from "lucide-react";
import { useUserTickets } from "../hooks/useContracts";
import { useListTicket } from "../hooks/useContracts";
import {
  TicketCard,
  TicketCardSkeleton,
  TicketGrid,
  TicketsEmptyState,
} from "../components/TicketCard";
import { usePushWalletContext } from "@pushchain/ui-kit";
import { formatTicket } from "../lib/formatters";

interface ListTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: number;
  onList: (tokenId: number, price: string) => void;
}

function ListTicketModal({
  isOpen,
  onClose,
  tokenId,
  onList,
}: ListTicketModalProps) {
  const [price, setPrice] = useState("");
  const [isListing, setIsListing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) return;

    setIsListing(true);
    try {
      await onList(tokenId, price);
      onClose();
      setPrice("");
    } catch (error) {
      console.error("Failed to list ticket:", error);
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
              Price (ETH)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.1"
              required
            />
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
  const { connectionStatus, universalAccount } = usePushWalletContext();
  const accountAddress = universalAccount?.address;
  const { tickets, loading, error, refetch } = useUserTickets(accountAddress);
  const { listTicket } = useListTicket();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showListModal, setShowListModal] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

  // Filter and search tickets
  const filteredTickets = useMemo(() => {
    if (!tickets.length) return [];

    let formattedTickets = tickets.map((ticket) => formatTicket(ticket));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      formattedTickets = formattedTickets.filter(
        (ticket) =>
          ticket.event?.name.toLowerCase().includes(query) ||
          ticket.event?.venue.toLowerCase().includes(query) ||
          ticket.tokenId.toString().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      formattedTickets = formattedTickets.filter((ticket) =>
        statusFilter === "valid" ? !ticket.used : ticket.used
      );
    }

    return formattedTickets;
  }, [tickets, searchQuery, statusFilter]);

  const handleListTicket = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setShowListModal(true);
  };

  const handleConfirmList = async (tokenId: number, price: string) => {
    try {
      const priceWei = BigInt(Math.floor(parseFloat(price) * 1e18));
      await listTicket({ tokenId: BigInt(tokenId), price: priceWei });
      await refetch(); // Refresh tickets
    } catch (error) {
      console.error("Failed to list ticket:", error);
      throw error;
    }
  };

  if (connectionStatus !== "connected") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-6">
            You need to connect your wallet to view your tickets.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
            Connect Wallet
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
      {!loading && tickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tickets.length}
            </div>
            <div className="text-sm text-gray-600">Total Tickets</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter((t) => !t.used).length}
            </div>
            <div className="text-sm text-gray-600">Valid Tickets</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {tickets.filter((t) => t.used).length}
            </div>
            <div className="text-sm text-gray-600">Used Tickets</div>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredTickets.length} ticket
            {filteredTickets.length !== 1 ? "s" : ""} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>
      )}

      {/* Tickets Grid */}
      {loading ? (
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
              showListButton={!ticket.used}
              onList={handleListTicket}
            />
          ))}
        </TicketGrid>
      ) : (
        <TicketsEmptyState
          message={
            tickets.length === 0
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
