import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import {
  TrendingUp,
  Ticket,
  DollarSign,
  Users,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useEventAnalytics } from "../hooks/useEventAnalytics";
import { useEvent } from "../hooks/useContracts";
import { formatPrice, formatDateTime } from "../lib/formatters";
import {
  StatsCard,
  TierPerformanceTable,
  RevenueChart,
  AttendanceTracker,
  SecondaryMarketStats,
} from "../components/analytics";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { usePushWalletContext, usePushChain } from "@pushchain/ui-kit";

export default function EventAnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();
  const { universalAccount } = usePushWalletContext();
  const { PushChain } = usePushChain();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const eventIdNum = eventId ? parseInt(eventId, 10) : 0;
  const {
    event,
    isLoading: eventLoading,
    error: eventError,
  } = useEvent(eventIdNum);
  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
  } = useEventAnalytics(eventIdNum);

  // UEA resolution state
  const [ueaAddress, setUeaAddress] = useState<string | null>(null);
  const [ueaLoading, setUeaLoading] = useState(false);

  const loading = eventLoading || analyticsLoading || ueaLoading;
  const error = eventError || analyticsError;

  // Resolve UEA address for Push Universal Account users
  useEffect(() => {
    if (universalAccount && PushChain && !ueaAddress && !ueaLoading) {
      setUeaLoading(true);
      PushChain.utils.account.convertOriginToExecutor(
        universalAccount,
        { onlyCompute: true }
      )
        .then((uea) => {
          setUeaAddress(uea.address);
          setUeaLoading(false);
        })
        .catch((error) => {
          console.warn("UEA resolution failed:", error);
          setUeaLoading(false);
        });
    }
  }, [universalAccount, PushChain, ueaAddress, ueaLoading]);

  // Check if user is the organizer
  // This includes checking UEA (Universal Executor Account) for Push Universal Account users
  const isOrganizer = useMemo(() => {
    if (!event?.organizer) return false;
    
    const organizerAddress = event.organizer.toLowerCase();
    const walletAddress = address?.toLowerCase();
    const pushAccountAddress = universalAccount?.address?.toLowerCase();
    
    // Direct address matches
    if (walletAddress && organizerAddress === walletAddress) return true;
    if (pushAccountAddress && organizerAddress === pushAccountAddress) return true;
    
    // UEA address match
    if (ueaAddress && organizerAddress === ueaAddress.toLowerCase()) return true;
    
    return false;
  }, [event?.organizer, address, universalAccount, ueaAddress]);

  useEffect(() => {
    if (!loading && !ueaLoading && !isOrganizer && event) {
      // Redirect if not organizer
      navigate("/events");
    }
  }, [loading, isOrganizer, event, navigate, ueaLoading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger re-fetch by navigating to same route
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics...</p>
            <p className="text-sm text-gray-500 mt-2">
              {ueaLoading ? "Resolving UEA address..." : "Loading event data..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event || !analytics) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="py-12">
          <ErrorDisplay
            error={error || new Error("Event not found")}
            retry={handleRefresh}
          />
        </div>
      </div>
    );
  }

  if (!isOrganizer) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            Only event organizers can view analytics
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Link
          to={`/events/${eventId}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/90 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Event Analytics
            </h1>
            <p className="text-base md:text-lg text-gray-600">{event.name}</p>
            <p className="text-sm text-gray-500">
              {formatDateTime(new Date(Number(event.startTime) * 1000))}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 md:py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm touch-manipulation"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
        <StatsCard
          title="Total Sold"
          value={analytics.totalSold}
          subtitle={`of ${analytics.totalCapacity} capacity`}
          icon={Ticket}
          color="primary"
        />
        <StatsCard
          title="Sell Rate"
          value={`${analytics.sellRate.toFixed(1)}%`}
          subtitle={`${analytics.remainingCapacity} remaining`}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Total Revenue"
          value={`${formatPrice(analytics.primaryRevenue)} PC`}
          subtitle="Primary sales"
          icon={DollarSign}
          color="primary"
        />
        <StatsCard
          title="Attendance"
          value={`${analytics.scanRate.toFixed(1)}%`}
          subtitle={`${analytics.ticketsScanned} scanned`}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Tier Performance */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
          Ticket Type Performance
        </h2>
        <TierPerformanceTable tiers={analytics.tierBreakdown} />
      </div>

      {/* Charts and Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
        {/* Revenue Chart */}
        <RevenueChart tiers={analytics.tierBreakdown} />

        {/* Secondary Market Stats */}
        <SecondaryMarketStats
          activeListings={analytics.activeListings}
          avgResalePrice={analytics.avgResalePrice}
          lowestPrice={analytics.lowestPrice}
          highestPrice={analytics.highestPrice}
          secondarySales={analytics.secondarySales}
          secondaryVolume={analytics.secondaryVolume}
          royaltyRevenue={analytics.royaltyRevenue}
          royaltyPercentage={analytics.royaltyPercentage}
        />
      </div>

      {/* Attendance Tracker */}
      <AttendanceTracker
        totalSold={analytics.totalSold}
        ticketsScanned={analytics.ticketsScanned}
        scanRate={analytics.scanRate}
        noShowRate={analytics.noShowRate}
      />

    </div>
  );
}
