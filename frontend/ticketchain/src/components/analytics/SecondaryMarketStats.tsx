import { Store, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatPrice } from "../../lib/formatters";

interface SecondaryMarketStatsProps {
  activeListings: number;
  avgResalePrice: bigint;
  lowestPrice: bigint;
  highestPrice: bigint;
  secondarySales: number;
  secondaryVolume: bigint;
  royaltyRevenue: bigint;
  royaltyPercentage: number;
}

export function SecondaryMarketStats({
  activeListings,
  avgResalePrice,
  lowestPrice,
  highestPrice,
  secondarySales,
  secondaryVolume,
  royaltyRevenue,
  royaltyPercentage,
}: SecondaryMarketStatsProps) {
  const hasListings = activeListings > 0;
  const hasSecondarySales = secondarySales > 0;

  return (
    <div className="glass-card rounded-[1.75rem] border border-border bg-card p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Store className="w-5 h-5 text-primary" />
        <h3 className="text-base md:text-lg font-semibold text-foreground">
          Secondary Market
        </h3>
      </div>

      {!hasListings && secondarySales === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">No secondary market activity yet</p>
          <p className="text-sm text-muted-foreground/70">
            Activity will appear when tickets are listed for resale
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Active Listings */}
            <div className="p-3 rounded-lg border border-primary/25 bg-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-4 h-4 text-primary" />
                <p className="text-xs font-medium text-primary">
                  Active Listings
                </p>
              </div>
              <p className="text-2xl font-bold text-primary">
                {activeListings}
              </p>
            </div>

            {/* Secondary Sales */}
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <p className="text-xs font-medium text-green-500">
                  Resold Tickets
                </p>
              </div>
              <p className="text-2xl font-bold text-green-500">
                {secondarySales}
              </p>
            </div>
          </div>

          {/* Price Stats */}
          {hasListings && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-foreground mb-3">
                Current Prices
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Lowest */}
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded">
                    <TrendingDown className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lowest</p>
                    <p className="text-base font-semibold text-foreground">
                      {formatPrice(lowestPrice)} PC
                    </p>
                  </div>
                </div>

                {/* Average */}
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className="text-base font-semibold text-foreground">
                      {formatPrice(avgResalePrice)} PC
                    </p>
                  </div>
                </div>

                {/* Highest */}
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500/10 rounded">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Highest</p>
                    <p className="text-base font-semibold text-foreground">
                      {formatPrice(highestPrice)} PC
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Royalty Revenue Section */}
          {hasSecondarySales && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Your Royalty Earnings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Royalty Revenue */}
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-xs text-green-500 mb-1">Total Earned</p>
                  <p className="text-xl font-bold text-green-500">
                    {formatPrice(royaltyRevenue)} PC
                  </p>
                </div>

                {/* Royalty Percentage */}
                <div className="p-3 bg-primary/10 border border-primary/25 rounded-lg">
                  <p className="text-xs text-primary mb-1">Royalty Rate</p>
                  <p className="text-xl font-bold text-primary">
                    {royaltyPercentage.toFixed(1)}%
                  </p>
                </div>

                {/* Secondary Volume */}
                <div className="p-3 bg-muted/50 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Market Volume</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatPrice(secondaryVolume)} PC
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-500">
              <strong>💡 About Royalties:</strong> {royaltyPercentage > 0 
                ? `You earn ${royaltyPercentage.toFixed(1)}% from every secondary sale automatically. Royalties are enforced on-chain via EIP-2981.`
                : "No royalties are set for this event. You can set royalties (0-10%) when creating future events."
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
