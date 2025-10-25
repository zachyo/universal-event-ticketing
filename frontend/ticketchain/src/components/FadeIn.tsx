import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  show: boolean;
  className?: string;
  duration?: number;
}

/**
 * FadeIn component for smooth loading transitions
 *
 * Usage:
 * <FadeIn show={!loading}>
 *   <YourContent />
 * </FadeIn>
 */
export function FadeIn({
  children,
  show,
  className = "",
  duration = 300,
}: FadeInProps) {
  return (
    <div
      className={`transition-opacity ${className}`}
      style={{
        opacity: show ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
