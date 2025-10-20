import { Link } from "react-router-dom";
import { ExternalLink, Ticket } from "lucide-react";

const footerLinks = [
  { label: "Browse Events", to: "/events" },
  { label: "Marketplace", to: "/marketplace" },
  { label: "Create Event", to: "/create-event" },
  { label: "Verify Ticket", to: "/verify" },
];

export const Footer = () => (
  <footer className="relative mt-16 border-t border-border/70 bg-background/60 backdrop-blur-md">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
    <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background/40 to-background/80 dark:from-primary/20 dark:via-background/30 dark:to-background/90" />
    <div className="container px-4 py-12">
      <div className="grid gap-10 md:grid-cols-[1.75fr_1fr] md:items-start">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-secondary/60 px-4 py-2 text-sm font-semibold text-foreground/90 shadow-[0_12px_40px_-22px_rgba(129,54,255,0.45)]">
            <Ticket className="h-5 w-5 text-primary" />
            TicketChain
          </div>
          <h4 className="text-2xl font-semibold text-foreground md:text-3xl">
            Universal access to unforgettable experiences.
          </h4>
          <p className="max-w-xl text-sm text-muted-foreground md:text-base">
            TicketChain brings a futuristic, chain-agnostic ticketing journey to
            fans, creators, and organizers. Build, discover, and trade with
            confidence across any ecosystem.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/60 bg-card/60 px-3 py-1">
              Built for Hackathons
            </span>
            <span className="rounded-full border border-border/60 bg-card/60 px-3 py-1">
              Powered by Push Chain
            </span>
            <span className="rounded-full border border-border/60 bg-card/60 px-3 py-1">
              NFT-First Ownership
            </span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="relative z-[1] flex flex-col gap-4">
            <div>
              <h5 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
                Explore
              </h5>
            </div>
            <div className="grid gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex items-center justify-between rounded-2xl border border-transparent bg-white/30 px-4 py-3 text-sm font-medium text-foreground/80 transition hover:border-primary/40 hover:bg-primary/10 hover:text-foreground dark:bg-white/5"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-4 w-4 text-primary transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} TicketChain. Crafted with care
              for the future of universal events.
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
