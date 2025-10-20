import { MoonStar, Sun } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import { cn } from "../utils/cn";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-white/80 text-foreground shadow-sm transition-all duration-300 hover:scale-[1.03] hover:border-primary/50 hover:shadow-lg dark:bg-white/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/60 focus-visible:ring-offset-background",
        className
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/15 dark:from-primary/25 dark:via-transparent dark:to-accent/20" />
      <Sun
        className={cn(
          "h-5 w-5 transition-all duration-300 text-primary",
          theme === "dark" ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      />
      <MoonStar
        className={cn(
          "h-5 w-5 transition-all duration-300 text-accent",
          theme === "dark" ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
      />
    </button>
  );
}
