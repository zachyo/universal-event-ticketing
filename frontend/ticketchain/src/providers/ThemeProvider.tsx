import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = "ticketchain-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(
    THEME_STORAGE_KEY
  ) as Theme | null;
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  return prefersDark ? "dark" : "light";
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [hasExplicitPreference, setHasExplicitPreference] = useState<boolean>(
    () => {
      if (typeof window === "undefined") {
        return false;
      }
      const stored = window.localStorage.getItem(
        THEME_STORAGE_KEY
      ) as Theme | null;
      return stored === "light" || stored === "dark";
    }
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.setProperty(
      "color-scheme",
      theme === "dark" ? "dark" : "light"
    );
    if (hasExplicitPreference) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } else {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    }
  }, [theme, hasExplicitPreference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    const handleChange = (event: MediaQueryListEvent) => {
      if (!hasExplicitPreference) {
        setTheme(event.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [hasExplicitPreference]);

  const updateTheme = (nextTheme: Theme) => {
    setHasExplicitPreference(true);
    setTheme(nextTheme);
  };

  const toggleTheme = () => {
    setHasExplicitPreference(true);
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme,
      setTheme: updateTheme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className="min-h-screen transition-colors duration-500">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
