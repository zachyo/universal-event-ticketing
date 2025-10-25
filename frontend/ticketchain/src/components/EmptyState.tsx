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
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
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
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
