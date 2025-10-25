import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TierAnalytics } from "../../hooks/useEventAnalytics";

interface RevenueChartProps {
  tiers: TierAnalytics[];
}

export function RevenueChart({ tiers }: RevenueChartProps) {
  const chartData = tiers
    .filter((tier) => tier.revenue > 0)
    .map((tier) => ({
      name: tier.name,
      revenue: Number(tier.revenue) / 1e18, // Convert to PC
      sold: tier.sold,
      supply: tier.supply,
      sellRate: tier.sellRate,
      price: Number(tier.price) / 1e18, // Convert to PC
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
        Revenue & Sales by Tier
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value} PC`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'revenue') {
                return [`${value.toFixed(2)} PC`, 'Revenue'];
              }
              return [value, name === 'sold' ? 'Tickets Sold' : name];
            }}
            labelFormatter={(label) => `Tier: ${label}`}
          />
          <Legend />
          <Bar 
            dataKey="revenue" 
            name="Revenue" 
            fill="hsl(var(--primary))" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="sold" 
            name="Tickets Sold" 
            fill="hsl(var(--primary) / 0.6)" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chartData.map((tier, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground truncate">{tier.name}</h4>
                <span className="text-xs text-muted-foreground">{tier.sellRate.toFixed(1)}%</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="font-semibold text-foreground">{tier.revenue.toFixed(2)} PC</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sold:</span>
                  <span className="font-semibold text-foreground">{tier.sold}/{tier.supply}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold text-foreground">{tier.price.toFixed(2)} PC</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
