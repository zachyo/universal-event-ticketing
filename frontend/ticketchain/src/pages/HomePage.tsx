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
  <section className="border-b border-border/70 bg-secondary/60">
    <div className="container px-4 pb-20 pt-10 md:pb-24 md:pt-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary">
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
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Discover Live Drops
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/create-event"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Launch on TicketChain
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:max-w-lg">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card px-5 py-4 text-center shadow-sm"
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
          <div className="glass-card rounded-[2.25rem] p-8 md:p-10">
            <div className="mb-6 flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
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
                  className="rounded-2xl border border-border bg-secondary/40 p-4"
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    {item.title}
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-wide text-primary">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm">
              <div className="flex items-center gap-3 text-foreground">
                <Rocket className="h-5 w-5 text-primary" />
                <span className="font-semibold">
                  Instant settlement across Push Chain ecosystems
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
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
  <section className="py-20">
    <div className="container px-4">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/80">
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
            <div className="glass-card rounded-[2rem] p-8 transition group-hover:shadow-md">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-7 text-2xl font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">{description}</p>
              <div className="mt-6 inline-flex rounded-full border border-border bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
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
  <section className="bg-card pb-24 pt-12">
    <div className="container space-y-14 px-4">
      <div className="mx-auto max-w-2xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/80">
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
            className="glass-card rounded-[2rem] border border-border bg-card p-8"
          >
            <div className="inline-flex items-center justify-center rounded-2xl border border-border bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary">
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

      <div className="glass-card rounded-[2.5rem] border border-border bg-secondary/60 p-10 text-center">
        <h3 className="text-2xl font-semibold text-foreground md:text-3xl">
          Ready to revolutionize event ticketing?
        </h3>
        <p className="mt-4 text-base text-muted-foreground">
          Experience the future of event management with TicketChain's production-ready platform. 
          Built for real-world events with enterprise-grade reliability and user experience.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Explore Marketplace
            <ArrowRight className="h-4 w-4" />
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
