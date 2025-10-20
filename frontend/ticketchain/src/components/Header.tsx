import { Link, NavLink } from "react-router-dom";
import {
  PushUniversalAccountButton,
  usePushWalletContext,
} from "@pushchain/ui-kit";

import { Ticket, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "../utils/cn";

export const Header = () => {
  const { connectionStatus } = usePushWalletContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const primaryLinks = [
    { to: "/events", label: "Events" },
    { to: "/marketplace", label: "Marketplace" },
  ];

  const authenticatedLinks =
    connectionStatus === "connected"
      ? [
          { to: "/my-tickets", label: "My Tickets" },
          { to: "/organizer-scan", label: "Scan Tickets" },
        ]
      : [];

  return (
    <header className="sticky top-0 z-50 bg-transparent">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[-1] h-32 bg-gradient-to-b from-background/90 via-background/70 to-transparent backdrop-blur-md" />
      <div className="container px-4 py-4">
        <div className="flex items-center gap-3 rounded-full border border-border/60 bg-background/85 px-4 py-3 shadow-[0_18px_60px_-24px_rgba(129,54,255,0.35)] backdrop-blur-xl transition-colors duration-300">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-1.5 font-semibold text-foreground/90 transition hover:bg-secondary hover:text-foreground"
            >
              <Ticket className="h-5 w-5 text-primary" />
              TicketChain
            </Link>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-1 text-sm font-medium md:flex">
            {[...primaryLinks, ...authenticatedLinks].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "relative rounded-full px-4 py-2 transition-all duration-300",
                    "text-foreground/70 hover:text-foreground",
                    "hover:bg-secondary/70",
                    isActive &&
                      "bg-gradient-to-r from-primary/90 via-primary to-accent text-primary-foreground shadow-lg shadow-primary/30"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/create-event"
              className="ml-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-primary to-accent px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(129,54,255,0.45)] transition hover:shadow-[0_16px_50px_rgba(196,73,255,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Launch Event
            </Link>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <div className="flex items-center">
              <PushUniversalAccountButton />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 md:hidden">
            <ThemeToggle />
            <div className="scale-90">
              <PushUniversalAccountButton />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-secondary/80 text-foreground transition hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="container px-4 pb-6">
            <div className="glass-card rounded-3xl px-5 py-6 backdrop-blur-2xl">
              <div className="relative z-[1] flex flex-col gap-4 text-base">
                {[...primaryLinks, ...authenticatedLinks].map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300",
                        "text-foreground/80 hover:bg-secondary/80 hover:text-foreground",
                        isActive && "bg-primary/90 text-primary-foreground"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{link.label}</span>
                        <span className="text-xs uppercase tracking-wider text-foreground/50">
                          {isActive ? "Active" : "Explore"}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
                <Link
                  to="/create-event"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary via-primary to-accent px-4 py-3 font-semibold text-white shadow-[0_20px_40px_-20px_rgba(196,73,255,0.75)]"
                >
                  Launch New Event
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
