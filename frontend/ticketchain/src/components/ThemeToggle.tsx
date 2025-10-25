import { MoonStar, Sun } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import { cn } from "../utils/cn";
import { Switch } from "./ui/switch";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleCheckedChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Sun
        className={cn(
          "h-4 w-4 transition-colors",
          isDark ? "text-muted-foreground" : "text-primary"
        )}
        aria-hidden="true"
      />
      <Switch
        checked={isDark}
        onCheckedChange={handleCheckedChange}
        aria-label="Toggle dark mode"
      />
      <MoonStar
        className={cn(
          "h-4 w-4 transition-colors",
          isDark ? "text-primary" : "text-muted-foreground"
        )}
        aria-hidden="true"
      />
    </div>
  );
}
