import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "orange" | "red";
  trend?: {
    value: number;
    label: string;
  };
}

const colorThemes = {
  blue: {
    background: "from-sky-500/80 via-sky-400/80 to-cyan-300/70",
    text: "text-sky-50",
    shadow: "shadow-[0_14px_40px_-20px_rgba(56,189,248,0.55)]",
  },
  green: {
    background: "from-emerald-500/80 via-emerald-400/80 to-lime-300/70",
    text: "text-emerald-50",
    shadow: "shadow-[0_14px_40px_-20px_rgba(16,185,129,0.55)]",
  },
  purple: {
    background: "from-primary/80 via-primary/70 to-accent/70",
    text: "text-white",
    shadow: "shadow-[0_14px_40px_-20px_rgba(196,73,255,0.6)]",
  },
  orange: {
    background: "from-orange-500/80 via-amber-400/80 to-yellow-300/70",
    text: "text-amber-50",
    shadow: "shadow-[0_14px_40px_-20px_rgba(251,191,36,0.55)]",
  },
  red: {
    background: "from-rose-500/80 via-rose-400/80 to-pink-300/70",
    text: "text-rose-50",
    shadow: "shadow-[0_14px_40px_-20px_rgba(244,63,94,0.55)]",
  },
};

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
    <div className="glass-card rounded-[1.75rem] border border-border/70 bg-card/85 p-5">
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
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${theme.background} ${theme.shadow}`}
        >
          <Icon className={`h-5 w-5 ${theme.text}`} />
        </div>
      </div>
    </div>
  );
}
