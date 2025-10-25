import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { TierAnalytics } from "../../hooks/useEventAnalytics";
import { formatPrice } from "../../lib/formatters";

interface RevenueChartProps {
  tiers: TierAnalytics[];
}

const COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
];

export function RevenueChart({ tiers }: RevenueChartProps) {
  const chartData = tiers
    .filter((tier) => tier.revenue > 0)
    .map((tier) => ({
      name: tier.name,
      value: Number(tier.revenue) / 1e18, // Convert to PC
      revenue: tier.revenue,
    }));

  if (chartData.length === 0) {
    return (
      <div className="glass-card rounded-[1.75rem] border border-border bg-card p-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Revenue by Tier
        </h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No revenue data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[1.75rem] border border-border bg-card p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">
        Revenue by Tier
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              `${formatPrice(BigInt(Math.floor(value * 1e18)))} PC`
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {chartData.map((tier, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{tier.name}</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatPrice(tier.revenue)} PC
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
