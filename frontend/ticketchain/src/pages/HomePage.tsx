import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Zap,
  Globe,
  Sparkles,
  Ticket,
  Rocket,
  Users,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Multi-Chain Freedom",
    description:
      "Settle tickets on any supported chain with seamless cross-network payments.",
    highlight: "Chain-agnostic payments",
  },
  {
    icon: ShieldCheck,
    title: "Programmable Ownership",
    description:
      "NFT-first tickets with on-chain provenance, gated entry, and instant transfers.",
    highlight: "NFT-native access",
  },
  {
    icon: Zap,
    title: "Universal Marketplace",
    description:
      "Curated primary drops and a secondary market with automatic royalties.",
    highlight: "Royalties baked in",
  },
];

const stats = [
  { value: "32+", label: "Supported Chains" },
  { value: "18k", label: "Tickets Minted" },
  { value: "4m+", label: "Volume Secured" },
];

const steps = [
  {
    number: "01",
    title: "Launch an Event",
    description:
      "Spin up an on-chain event in minutes. Configure tiers, supply, perks, and royalties.",
  },
  {
    number: "02",
    title: "Mint & Distribute",
    description:
      "Fans mint verifiable tickets with any token, receiving programmable proof of access.",
  },
  {
    number: "03",
    title: "Verify & Re-engage",
    description:
      "Scan on-site with organizer tools, then re-engage collectors with NFT-based rewards.",
  },
];

const HeroSection = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-x-0 -top-48 h-[28rem] blur-3xl">
      <div className="mx-auto h-full max-w-5xl rounded-full bg-gradient-to-r from-primary/25 via-primary/10 to-accent/30 opacity-60 dark:opacity-80" />
    </div>
    <div className="container relative px-4 pb-20 pt-10 md:pb-28 md:pt-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" />
            Universal Event Ticketing
          </div>
          <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl xl:text-6xl">
            The next era of{" "}
            <span className="gradient-text">chain-agnostic ticketing</span> is
            here.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            TicketChain powers frictionless NFT ticketing with instant
            settlement, built-in compliance, and a dazzling experience for
            organizers and fans—no blockchain gymnastics required.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_50px_-25px_rgba(196,73,255,0.8)] transition hover:shadow-[0_24px_60px_-22px_rgba(196,73,255,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Discover Live Drops
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/create-event"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Launch on TicketChain
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:max-w-lg">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-border/60 bg-card/60 px-5 py-4 text-center shadow-[0_12px_30px_-22px_rgba(129,54,255,0.65)]"
              >
                <div className="text-2xl font-semibold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 blur-3xl">
            <div className="h-full w-full rounded-full bg-gradient-to-br from-primary/35 via-accent/30 to-transparent" />
          </div>
          <div className="glass-card rounded-[2.5rem] p-8 md:p-10">
            <div className="mb-6 flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1">
                <Ticket className="h-4 w-4 text-primary" />
                Live Ticket Feed
              </span>
              <span>Powered by Push Chain</span>
            </div>
            <div className="space-y-5">
              {[
                {
                  title: "Metaverse Expo NYC",
                  detail: "Floor • 0.24 PC",
                  status: "Minting Now",
                },
                {
                  title: "AfroBeats Aurora",
                  detail: "Secondary • from 0.18 PC",
                  status: "Trending",
                },
                {
                  title: "Quantum Hack Summit",
                  detail: "VIP Access • 0.42 PC",
                  status: "Last Seats",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-[0_14px_34px_-20px_rgba(129,54,255,0.6)]"
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    {item.title}
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs uppercase tracking-wide text-primary">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-4 rounded-3xl border border-primary/20 bg-primary/10 p-5 text-sm text-primary-foreground">
              <div className="flex items-center gap-3 text-white">
                <Rocket className="h-5 w-5" />
                <span className="font-semibold tracking-wide">
                  Instant settlement across Push Chain ecosystems
                </span>
              </div>
              <p className="text-xs text-white/80">
                Your collectors keep full sovereignty. You keep royalties forever.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section className="relative py-20">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    <div className="container px-4">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/80">
          <Users className="h-4 w-4 text-primary" />
          Built for fans & organizers
        </p>
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">
          Everything you need to run legendary events.
        </h2>
        <p className="mt-3 text-base text-muted-foreground md:text-lg">
          From mint to scan, TicketChain handles discovery, fulfillment, and
          on-site operations—while keeping experiences elegant across any
          wallet.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description, highlight }) => (
          <div
            key={title}
            className="group relative overflow-hidden rounded-[2rem]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/10 opacity-0 transition group-hover:opacity-100" />
            <div className="glass-card rounded-[2rem] p-8">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/80 to-accent text-primary-foreground shadow-[0_14px_44px_-20px_rgba(196,73,255,0.8)]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-7 text-2xl font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">{description}</p>
              <div className="mt-6 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {highlight}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section className="relative pb-24 pt-12">
    <div className="absolute inset-x-0 top-0 h-[30rem] blur-[120px]">
      <div className="mx-auto h-full max-w-5xl rounded-full bg-gradient-to-r from-accent/25 via-primary/25 to-transparent" />
    </div>
    <div className="container relative space-y-14 px-4">
      <div className="mx-auto max-w-2xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/80">
          <Sparkles className="h-4 w-4 text-primary" />
          Zero friction workflow
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
          Launch in minutes. Delight forever.
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          TicketChain abstracts the blockchain while preserving trust. You
          focus on crafting experiences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="glass-card rounded-[2rem] border border-border/70 bg-card/80 p-8"
          >
            <div className="inline-flex items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary">
              Step {step.number}
            </div>
            <h3 className="mt-5 text-xl font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card relative overflow-hidden rounded-[2.5rem] border border-primary/25 bg-gradient-to-r from-primary/15 via-primary/5 to-accent/15 p-10 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(196,73,255,0.25),transparent_55%)]" />
        <h3 className="text-2xl font-semibold text-foreground md:text-3xl">
          Ready to stun judges & fans alike?
        </h3>
        <p className="mt-4 text-base text-muted-foreground">
          Ship a hackathon-ready demo with production polish. TicketChain’s UX
          is designed to wow on every screen.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_50px_-25px_rgba(196,73,255,0.8)] transition hover:shadow-[0_24px_60px_-22px_rgba(196,73,255,0.95)]"
          >
            Explore Marketplace
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/event-analytics/1"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            View Live Analytics
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export const HomePage = () => (
  <>
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
  </>
);
