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
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="container px-4 py-4">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-3 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 font-semibold text-foreground/90 transition hover:bg-secondary/80 hover:text-foreground"
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
                    "hover:bg-secondary",
                    isActive && "bg-primary text-primary-foreground shadow-sm"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/create-event"
              className="ml-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
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
            <div className="glass-card rounded-3xl px-5 py-6">
              <div className="relative z-[1] flex flex-col gap-4 text-base">
                {[...primaryLinks, ...authenticatedLinks].map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300",
                        "text-foreground/80 hover:bg-secondary hover:text-foreground",
                        isActive && "bg-primary text-primary-foreground"
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
                  className="mt-2 inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
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
