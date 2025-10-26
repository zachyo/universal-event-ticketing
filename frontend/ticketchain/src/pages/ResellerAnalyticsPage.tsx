import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import {
  TrendingUp,
  DollarSign,
  Package,
  ArrowLeft,
  Download,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { useResellerAnalytics, useHasResellerAccess } from "../hooks/useResellerAnalytics";
import { useEvent } from "../hooks/useContracts";
import { formatPrice } from "../lib/formatters";
import {
  StatsCard,
  ResellerPerformanceCard,
  ResellerListingsTable,
} from "../components/analytics";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { usePushWalletContext, usePushChain } from "@pushchain/ui-kit";
import { exportResellerAnalyticsToCSV } from "../lib/csvExport";

export default function ResellerAnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();
  const { universalAccount } = usePushWalletContext();
  const { PushChain } = usePushChain();
  const [isExporting, setIsExporting] = useState(false);

  const eventIdNum = eventId ? parseInt(eventId, 10) : 0;
  const {
    event,
    isLoading: eventLoading,
    error: eventError,
  } = useEvent(eventIdNum);

  // UEA resolution state
  const [ueaAddress, setUeaAddress] = useState<string | null>(null);
  const [isResolvingUEA, setIsResolvingUEA] = useState(false);

  // Resolve UEA address
  useEffect(() => {
    const resolveExecutorAddress = async () => {
      if (!universalAccount || !PushChain) {
        setUeaAddress(address || null);
        return;
      }

      setIsResolvingUEA(true);
      try {
        const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
          universalAccount,
          { onlyCompute: true }
        );
        setUeaAddress(executorInfo.address);
      } catch (err) {
        console.error("Failed to resolve executor address:", err);
        setUeaAddress(address || null);
      } finally {
        setIsResolvingUEA(false);
      }
    };

    resolveExecutorAddress();
  }, [universalAccount, PushChain, address]);

  // Check access - only when UEA is resolved
  const { hasAccess, isLoading: accessLoading } = useHasResellerAccess(
    ueaAddress || undefined,
    eventIdNum
  );

  // Fetch analytics
  const analytics = useResellerAnalytics(ueaAddress || undefined, eventIdNum);

  // Include UEA resolution in loading state - treat null ueaAddress as still loading
  const loading = eventLoading || analytics.isLoading || isResolvingUEA || accessLoading || ueaAddress === null;
  const error = eventError || analytics.error;

  // Check if user has access
  useEffect(() => {
    // Only redirect if UEA is resolved and we still don't have access
    if (!loading && !hasAccess && event && ueaAddress !== null && !isResolvingUEA) {
      // Redirect if no access
      navigate(`/events/${eventId}`);
    }
  }, [loading, hasAccess, event, navigate, eventId, ueaAddress, isResolvingUEA]);

  const handleExportCSV = () => {
    if (!event || !ueaAddress) return;

    setIsExporting(true);
    try {
      exportResellerAnalyticsToCSV(analytics, event.name, ueaAddress);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate market averages for comparison
  const marketAverageSalePrice = useMemo(() => {
    if (analytics.eventSecondarySales === 0) return 0n;
    // This is a simplified calculation - in reality you'd need total market revenue
    // For now, we'll use the user's average as a proxy
    return analytics.averageSalePrice;
  }, [analytics]);

  if (loading) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="py-12">
          <ErrorDisplay
            error={error || new Error("Event not found")}
            retry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            No Listing History
          </h2>
          <p className="text-muted-foreground mb-6">
            You haven't listed any tickets for this event yet
          </p>
          <Link
            to={`/events/${eventId}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "N/A";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 space-y-6">
      {/* Header */}
      <div className="glass-card rounded-[2.25rem] border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Link
              to={`/events/${eventId}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Event
            </Link>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <TrendingUp className="h-3 w-3" />
                Reseller Analytics
              </span>
              <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
                Your Marketplace Performance
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Track your resale activity and earnings for{" "}
                <span className="font-semibold text-foreground">{event.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tickets Listed"
          value={Number(analytics.stats.totalListed)}
          subtitle={`${Number(analytics.stats.currentlyListed)} currently active`}
          icon={Package}
          color="primary"
        />
        <StatsCard
          title="Tickets Sold"
          value={Number(analytics.stats.totalSold)}
          subtitle={`${analytics.listingSuccessRate.toFixed(1)}% success rate`}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Total Revenue"
          value={formatPrice(analytics.stats.totalRevenue) + " PC"}
          subtitle={`Net: ${formatPrice(analytics.netRevenue)} PC`}
          icon={DollarSign}
          color="primary"
        />
        <StatsCard
          title="Royalties Paid"
          value={formatPrice(analytics.stats.totalRoyaltiesPaid) + " PC"}
          subtitle={`${analytics.profitMargin.toFixed(1)}% profit margin`}
          icon={TrendingDown}
          color="orange"
        />
      </div>

      {/* Performance Comparison */}
      <div className="glass-card rounded-[2.25rem] border border-border bg-card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Market Comparison
        </h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <ResellerPerformanceCard
            title="Average Sale Price"
            myValue={analytics.averageSalePrice}
            marketValue={marketAverageSalePrice}
            format="price"
          />
          <ResellerPerformanceCard
            title="Success Rate"
            myValue={analytics.listingSuccessRate}
            marketValue={50} // Market average placeholder
            format="percentage"
          />
          <ResellerPerformanceCard
            title="Profit Margin"
            myValue={analytics.profitMargin}
            marketValue={75} // Market average placeholder
            format="percentage"
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="glass-card rounded-[1.75rem] border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Canceled Listings
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {Number(analytics.stats.totalCanceled)}
          </p>
          <p className="text-xs text-muted-foreground">
            {analytics.stats.totalListed > 0n
              ? `${((Number(analytics.stats.totalCanceled) / Number(analytics.stats.totalListed)) * 100).toFixed(1)}% of total`
              : "No listings yet"}
          </p>
        </div>

        <div className="glass-card rounded-[1.75rem] border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Avg Time to Sell
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatDuration(analytics.avgTimeToSell)}
          </p>
          <p className="text-xs text-muted-foreground">
            From listing to sale
          </p>
        </div>

        <div className="glass-card rounded-[1.75rem] border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Market Share
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {analytics.eventSecondarySales > 0
              ? `${((Number(analytics.stats.totalSold) / analytics.eventSecondarySales) * 100).toFixed(1)}%`
              : "N/A"}
          </p>
          <p className="text-xs text-muted-foreground">
            Of total secondary sales
          </p>
        </div>
      </div>

      {/* Listings Table */}
      <ResellerListingsTable
        activeListings={analytics.activeListings}
        historicalListings={analytics.historicalListings}
      />

      {/* Event-wide Stats for Context */}
      <div className="glass-card rounded-[2rem] border border-border/60 bg-secondary/60 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Event-Wide Secondary Market
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Total Secondary Sales</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {analytics.eventSecondarySales}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Total Royalties Collected
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {formatPrice(analytics.eventRoyaltiesCollected)} PC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
