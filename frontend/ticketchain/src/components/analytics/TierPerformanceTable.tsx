import { formatPrice } from "../../lib/formatters";
import type { TierAnalytics } from "../../hooks/useEventAnalytics";

interface TierPerformanceTableProps {
  tiers: TierAnalytics[];
}

export function TierPerformanceTable({ tiers }: TierPerformanceTableProps) {
  if (tiers.length === 0) {
    return (
      <div className="glass-card rounded-[1.75rem] border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No ticket types available</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[1.75rem] border border-border bg-card overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ticket Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Supply
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sell Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tiers.map((tier, index) => (
              <tr key={index} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-foreground">{tier.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                  {formatPrice(tier.price)} PC
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                  {tier.sold}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                  {tier.supply}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(tier.sellRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {tier.sellRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-semibold text-green-500">
                    {formatPrice(tier.revenue)} PC
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        {tiers.map((tier, index) => (
          <div key={index} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">{tier.name}</h3>
              <span className="text-sm font-medium text-primary">
                {formatPrice(tier.price)} PC
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Sold</p>
                <p className="text-sm font-medium text-foreground">
                  {tier.sold} / {tier.supply}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-sm font-semibold text-green-500">
                  {formatPrice(tier.revenue)} PC
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">Sell Rate</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {tier.sellRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(tier.sellRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
