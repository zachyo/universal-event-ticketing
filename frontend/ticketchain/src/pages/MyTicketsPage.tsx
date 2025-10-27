import { useState, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { AlertCircle, Package, X } from "lucide-react";
import {
  useUserTickets,
  useListTicket,
  useEvents,
  useMarketplaceListings,
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
import { ViewQRModal } from "../components/ViewQRModal";
import {
  TicketFilters,
  type TicketStatusFilter,
  type TicketSortOption,
} from "../components/TicketFilters";
import { BulkListingModal } from "../components/marketplace/BulkListingModal";
import { BulkCancelListingModal } from "../components/marketplace/BulkCancelListingModal";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { SearchBar } from "../components/search/SearchBar";
import { useNFTApproval } from "../hooks/useNFTApproval";

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

  // Use approval hook to check if marketplace is approved for this token
  const {
    isApproved,
    isCheckingApproval,
    isApproving,
    error: approvalError,
    approve,
  } = useNFTApproval(BigInt(tokenId));

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      setPrice("");
      setIsListing(false);
    }
  }, [isOpen]);

  const handleApprove = async () => {
    try {
      await approve();
      // Approval successful - user can now proceed to list
    } catch (error) {
      console.error("Failed to approve:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to approve marketplace. Please try again.";
      setErrorMessage(message);
    }
  };

  const handleList = async (e: React.FormEvent) => {
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

  // Show loading state while checking approval
  const showLoading = isCheckingApproval;

  // Determine which button to show
  const showApproveButton = !isApproved && !showLoading;
  const showListButton = isApproved && !showLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg rounded-[1.75rem] border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            List Ticket for Sale
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isApproving || isListing}
            className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>

        {/* Step indicator */}
        <div className="mt-4 mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                !isApproved
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/20 text-primary"
              }`}
            >
              1
            </div>
            <span
              className={`text-xs font-semibold ${
                !isApproved ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Approve Marketplace
            </span>
            <div className="flex-1 h-px bg-border mx-2" />
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                isApproved
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-semibold ${
                isApproved ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              List Ticket
            </span>
          </div>
        </div>

        <form onSubmit={handleList} className="mt-5 space-y-5">
          {/* Approval Step */}
          {showApproveButton && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Step 1: Approve Marketplace
                </p>
                <p className="text-xs text-muted-foreground">
                  First, grant the marketplace permission to list this ticket.
                  This is a one-time approval per ticket.
                </p>
              </div>
              {(errorMessage || approvalError) && (
                <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">
                  {errorMessage || approvalError}
                </p>
              )}
            </div>
          )}

          {/* Listing Step */}
          {showListButton && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm">
                <p className="text-green-600 dark:text-green-400 font-semibold mb-1">
                  ✓ Marketplace Approved
                </p>
                <p className="text-xs text-muted-foreground">
                  Now set your listing price below.
                </p>
              </div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price ({pcSymbol})
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.001"
                className="w-full rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm font-medium text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="100"
                required
                disabled={isListing}
              />
              <p className="text-xs text-muted-foreground">
                Push Chain automatically handles cross-chain settlement; simply
                set your desired amount in PC tokens.
              </p>
              {errorMessage && (
                <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">
                  {errorMessage}
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {showLoading && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/40 bg-muted/50 px-4 py-3 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">
                  Checking approval status...
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isApproving || isListing}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            {showApproveButton && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary flex items-center justify-center gap-2"
              >
                {isApproving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                )}
                {isApproving ? "Approving..." : "Approve Marketplace"}
              </button>
            )}

            {showListButton && (
              <button
                type="submit"
                disabled={isListing || !price}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary flex items-center justify-center gap-2"
              >
                {isListing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                )}
                {isListing ? "Listing..." : "List Ticket"}
              </button>
            )}

            {showLoading && (
              <button
                type="button"
                disabled
                className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground cursor-not-allowed"
              >
                Loading...
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

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


  const { tickets, loading, error, refetch } =
    useUserTickets(pushAccountAddress);
  const { listTicket } = useListTicket();
  const { events, loading: eventsLoading } = useEvents();
  const { listings } = useMarketplaceListings();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("all");
  const [sortBy, setSortBy] = useState<TicketSortOption>("recent");
  const [showListModal, setShowListModal] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [showBulkListModal, setShowBulkListModal] = useState(false);
  const [showBulkCancelModal, setShowBulkCancelModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTicketForQR, setSelectedTicketForQR] = useState<
    (typeof formattedTickets)[0] | null
  >(null);

  const formattedEvents = useMemo(() => events.map(formatEvent), [events]);

  const eventsById = useMemo<Map<number, FormattedEvent>>(() => {
    const map = new Map<number, FormattedEvent>();
    formattedEvents.forEach((event) => map.set(event.eventId, event));
    return map;
  }, [formattedEvents]);

  const formattedTickets = useMemo(() => {
    if (!tickets.length) return [];

    const formatted = tickets.map((ticket) => {
      return formatTicket(ticket, eventsById.get(Number(ticket.eventId)));
    });

    return formatted;
  }, [tickets, eventsById]);

  // Create a map of tokenId to listing for quick lookup
  const listingsByTokenId = useMemo(() => {
    const map = new Map<number, boolean>();
    listings.forEach((listing) => {
      if (listing.active) {
        map.set(Number(listing.tokenId), true);
      }
    });
    return map;
  }, [listings]);

  // Create a list of active listings for batch cancel
  const activeListings = useMemo(() => {
    return listings
      .filter((listing) => listing.active)
      .map((listing) => {
        const ticket = formattedTickets.find(
          (t) => t.tokenId === Number(listing.tokenId)
        );

        // Try multiple fallbacks to get the event name
        let eventName = "Unknown Event";
        if (ticket?.event?.name) {
          eventName = ticket.event.name;
        } else if (ticket?.eventId) {
          eventName = `Event #${ticket.eventId}`;
        } 
        // else if (listing.eventId) {
        //   eventName = `Event #${listing.eventId}`;
        // }

        return {
          listingId: Number(listing.listingId),
          tokenId: Number(listing.tokenId),
          eventName,
          price: listing.price,
        };
      });
  }, [listings, formattedTickets]);

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
      if (statusFilter === "valid") {
        visibleTickets = visibleTickets.filter(
          (ticket) => ticket.ticketStatus !== "used"
        );
      } else if (statusFilter === "used") {
        visibleTickets = visibleTickets.filter(
          (ticket) => ticket.ticketStatus === "used"
        );
      } else if (statusFilter === "listed") {
        visibleTickets = visibleTickets.filter((ticket) =>
          listingsByTokenId.has(ticket.tokenId)
        );
      } else if (statusFilter === "unlisted") {
        visibleTickets = visibleTickets.filter(
          (ticket) =>
            !listingsByTokenId.has(ticket.tokenId) &&
            ticket.ticketStatus !== "used"
        );
      }
    }

    // Apply sorting
    visibleTickets.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          // Most recently purchased first (higher tokenId = more recent)
          return b.tokenId - a.tokenId;
        case "event-date":
          // Upcoming events first
          if (!a.event || !b.event) return 0;
          return a.event.startTime.getTime() - b.event.startTime.getTime();
        case "price-high":
          return Number(b.purchasePrice - a.purchasePrice);
        case "price-low":
          return Number(a.purchasePrice - b.purchasePrice);
        case "name":
          if (!a.event || !b.event) return 0;
          return a.event.name.localeCompare(b.event.name);
        default:
          return 0;
      }
    });

    return visibleTickets;
  }, [formattedTickets, searchQuery, statusFilter, sortBy, listingsByTokenId]);

  const handleListTicket = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setShowListModal(true);
  };

  const handleViewQR = (ticket: (typeof formattedTickets)[0]) => {
    setSelectedTicketForQR(ticket);
    setShowQRModal(true);
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
      <div className="container px-4 py-16">
        <div className="glass-card mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-10 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <AlertCircle className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            Connect your wallet
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Link a Push universal account or supported EVM wallet to unlock your
            cross-chain ticket collection.
          </p>
          <button
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            onClick={handleConnectToPushWallet}
          >
            Connect wallet
          </button>
        </div>
      </div>
    );
  }

  if (isResolvingPushAccount) {
    return (
      <div className="container px-4 py-16">
        <div className="glass-card mx-auto max-w-xl rounded-[2rem] border border-primary/40 bg-primary/10 p-10 text-center text-primary shadow-xl">
          <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <h1 className="text-2xl font-semibold md:text-3xl">
            Preparing your tickets
          </h1>
          <p className="mt-3 text-sm text-primary/80 md:text-base">
            Mapping your wallet to its Push Chain executor address. Hang tight—
            this only takes a moment.
          </p>
        </div>
      </div>
    );
  }

  if (!pushAccountAddress) {
    return (
      <div className="container px-4 py-16">
        <div className="glass-card mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-10 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertCircle className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            Address still syncing
          </h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            {addressResolutionError ??
              "We're finishing the Push Chain sync for your universal account. Give it a second and try reconnecting."}
          </p>
          <button
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            onClick={handleConnectToPushWallet}
          >
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-16">
        <div className="max-w-3xl">
          <ErrorDisplay error={error} retry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 space-y-8">
      <div className="glass-card rounded-[2.25rem] border border-border bg-card p-6 md:p-8 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              Ticket Vault
            </span>
            <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
              Your universal ticket hub
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Manage on-chain access passes, surface QR codes in seconds, and
              list seats across Push Chain’s secondary markets—all from one
              place.
            </p>
          </div>
          {!isLoading && filteredTickets.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowBulkListModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              >
                <Package className="h-5 w-5" />
                Bulk list tickets
              </button>
              {activeListings.length > 0 && (
                <button
                  onClick={() => setShowBulkCancelModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-destructive/60 bg-destructive/10 px-5 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-destructive"
                >
                  <X className="h-5 w-5" />
                  Bulk cancel listings
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-2xl border border-border/50 bg-background/60 animate-pulse"
                />
              ))
            : [
                {
                  label: "Total tickets",
                  primary: ticketStats.total,
                  secondary: `Portfolio value ${totalValuePC}`,
                },
                {
                  label: "Ready to use",
                  primary: ticketStats.valid,
                  secondary: "Scannable for entry",
                },
                {
                  label: "Already scanned",
                  primary: ticketStats.used,
                  secondary: "History preserved",
                },
                {
                  label: "Purchase volume",
                  primary: totalValuePC,
                  secondary: `≈ ${totalValueInEth}`,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/60 bg-background/70 px-5 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {stat.primary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.secondary}
                  </p>
                </div>
              ))}
        </div>
      </div>

      <div className="glass-card rounded-[2rem] border border-border bg-card p-6 md:p-8">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search tickets by event, venue, or token ID..."
          className="mb-5"
        />
        <TicketFilters
          statusFilter={statusFilter}
          sortBy={sortBy}
          onStatusFilterChange={setStatusFilter}
          onSortChange={setSortBy}
        />
      </div>

      {!isLoading && (
        <div className="rounded-[1.75rem] border border-border/60 bg-secondary/60 px-5 py-4 text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">
            {filteredTickets.length}
          </span>{" "}
          ticket{filteredTickets.length !== 1 ? "s" : ""} ready to explore
          {searchQuery && (
            <>
              {" "}for <span className="text-foreground">"{searchQuery}"</span>
            </>
          )}
        </div>
      )}

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
              onViewQR={handleViewQR}
              showListingBadge={true}
              isListed={listingsByTokenId.has(ticket.tokenId)}
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

      {/* Bulk Listing Modal */}
      <BulkListingModal
        isOpen={showBulkListModal}
        onClose={() => setShowBulkListModal(false)}
        availableTickets={formattedTickets
          .filter(
            (ticket) =>
              ticket.ticketStatus !== "used" &&
              !listingsByTokenId.has(ticket.tokenId)
          )
          .map((ticket) => ({
            tokenId: BigInt(ticket.tokenId),
            eventName: ticket.event?.name || `Event #${ticket.eventId}`,
            ticketTypeName: `Type #${ticket.ticketTypeId}`,
            originalPrice: ticket.purchasePrice,
          }))}
        onSuccess={() => {
          setShowBulkListModal(false);
          refetch();
        }}
      />

      {/* Bulk Cancel Listing Modal */}
      <BulkCancelListingModal
        isOpen={showBulkCancelModal}
        onClose={() => setShowBulkCancelModal(false)}
        availableListings={activeListings}
        onSuccess={() => {
          setShowBulkCancelModal(false);
          refetch();
        }}
      />

      {/* View QR Modal */}
      {selectedTicketForQR && (
        <ViewQRModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedTicketForQR(null);
          }}
          ticket={selectedTicketForQR}
        />
      )}
    </div>
  );
};

export default MyTicketsPage;
