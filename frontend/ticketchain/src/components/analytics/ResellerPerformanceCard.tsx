import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPrice } from "../../lib/formatters";

interface ResellerPerformanceCardProps {
  title: string;
  myValue: bigint | number;
  marketValue: bigint | number;
  format?: "price" | "number" | "percentage";
  inverse?: boolean; // true if lower is better (e.g., royalties paid)
}

export function ResellerPerformanceCard({
  title,
  myValue,
  marketValue,
  format = "number",
  inverse = false,
}: ResellerPerformanceCardProps) {
  const formatValue = (val: bigint | number) => {
    // Handle NaN values
    if (typeof val === "number" && isNaN(val)) {
      return "N/A";
    }

    if (format === "price") {
      // Ensure we have a valid number before converting to BigInt
      const numVal = typeof val === "number" ? val : Number(val);
      if (isNaN(numVal)) return "N/A";
      return formatPrice(numVal) + " PC";
    }
    if (format === "percentage") {
      const numVal = Number(val);
      if (isNaN(numVal)) return "N/A";
      return `${numVal.toFixed(1)}%`;
    }
    return val.toString();
  };

  // Calculate performance comparison
  const myNum = Number(myValue);
  const marketNum = Number(marketValue);

  let comparison = "same";
  let percentDiff = 0;

  // Handle NaN values in comparison
  if (!isNaN(myNum) && !isNaN(marketNum) && marketNum > 0) {
    percentDiff = ((myNum - marketNum) / marketNum) * 100;

    if (inverse) {
      // Lower is better
      if (myNum < marketNum) comparison = "better";
      else if (myNum > marketNum) comparison = "worse";
    } else {
      // Higher is better
      if (myNum > marketNum) comparison = "better";
      else if (myNum < marketNum) comparison = "worse";
    }
  }

  const getIcon = () => {
    if (comparison === "better")
      return <TrendingUp className="h-4 w-4 text-primary" />;
    if (comparison === "worse")
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getComparisonText = () => {
    if (comparison === "same") return "Equal to market";
    const prefix = inverse
      ? comparison === "better"
        ? "Lower"
        : "Higher"
      : comparison === "better"
      ? "Higher"
      : "Lower";
    return `${prefix} than average (${Math.abs(percentDiff).toFixed(1)}%)`;
  };

  return (
    <div className="glass-card rounded-[1.75rem] border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Your Performance</p>
          <p className="mt-1 text-xl font-semibold text-primary">
            {formatValue(myValue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Market Average</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {formatValue(marketValue)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2">
        {getIcon()}
        <span className="text-xs font-medium text-foreground">
          {getComparisonText()}
        </span>
      </div>
    </div>
  );
}
