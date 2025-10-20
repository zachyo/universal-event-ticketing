import type { LucideIcon } from "lucide-react";
import { cn } from "../utils/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Generic empty state component
 *
 * Usage:
 * <EmptyState
 *   icon={Ticket}
 *   title="No tickets yet"
 *   message="You haven't purchased any tickets. Browse events to get started."
 *   action={{ label: "Browse Events", onClick: () => navigate('/events') }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 text-primary shadow-[0_14px_35px_-22px_rgba(129,54,255,0.45)]">
        <Icon className="h-10 w-10" />
      </div>

      <h3 className="mb-2 text-xl font-semibold text-foreground md:text-2xl">
        {title}
      </h3>

      <p className="mb-6 max-w-md text-sm text-muted-foreground md:text-base">
        {message}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="rounded-full bg-gradient-to-r from-primary via-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-[0_18px_45px_-22px_rgba(196,73,255,0.75)] transition hover:shadow-[0_22px_55px_-20px_rgba(196,73,255,0.85)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
