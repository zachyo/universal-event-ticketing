import { Store, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatPrice } from "../../lib/formatters";

interface SecondaryMarketStatsProps {
  activeListings: number;
  avgResalePrice: bigint;
  lowestPrice: bigint;
  highestPrice: bigint;
  secondarySales: number;
}

export function SecondaryMarketStats({
  activeListings,
  avgResalePrice,
  lowestPrice,
  highestPrice,
  secondarySales,
}: SecondaryMarketStatsProps) {
  const hasListings = activeListings > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Store className="w-5 h-5 text-primary" />
        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          Secondary Market
        </h3>
      </div>

      {!hasListings && secondarySales === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No secondary market activity yet</p>
          <p className="text-sm text-gray-400">
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
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-green-700">
                  Resold Tickets
                </p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {secondarySales}
              </p>
            </div>
          </div>

          {/* Price Stats */}
          {hasListings && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Current Prices
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Lowest */}
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded">
                    <TrendingDown className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Lowest</p>
                    <p className="text-base font-semibold text-gray-900">
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
                    <p className="text-xs text-gray-600">Average</p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatPrice(avgResalePrice)} PC
                    </p>
                  </div>
                </div>

                {/* Highest */}
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Highest</p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatPrice(highestPrice)} PC
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Secondary sales include resale activity on
              the marketplace. You may earn royalties from these transactions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
