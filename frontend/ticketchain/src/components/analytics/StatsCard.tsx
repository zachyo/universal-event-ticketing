import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: "primary" | "green" | "orange" | "red";
  trend?: {
    value: number;
    label: string;
  };
}

const colorThemes = {
  green: {
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
  },
  primary: {
    iconBg: "bg-primary/10",
    iconText: "text-primary",
  },
  orange: {
    iconBg: "bg-amber-100",
    iconText: "text-amber-700",
  },
  red: {
    iconBg: "bg-rose-100",
    iconText: "text-rose-700",
  },
} as const;

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: StatsCardProps) {
  const theme = colorThemes[color];

  return (
    <div className="glass-card rounded-[1.75rem] border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground md:text-3xl">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground md:text-sm">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-semibold ${
                  trend.value >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${theme.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${theme.iconText}`} />
        </div>
      </div>
    </div>
  );
}
