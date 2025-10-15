import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Globe } from 'lucide-react';

const features = [
  {
    icon: Globe,
    title: 'Multi-Chain Freedom',
    description: 'Buy and sell tickets using any token from any supported blockchain.',
  },
  {
    icon: ShieldCheck,
    title: 'True Ownership',
    description: 'Your tickets are NFTs (ERC-721), giving you full control and provenance.',
  },
  {
    icon: Zap,
    title: 'Universal Marketplace',
    description: 'A global secondary market for all tickets, with automated royalties for organizers.',
  },
];

const HeroSection = () => (
  <section className="py-20 md:py-32">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-4">
        The Future of Event Ticketing is Here.
      </h2>
      <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
        Buy, sell, and manage tickets as NFTs on any chain. Decentralized, secure, and universally accessible.
      </p>
      <Link
        to="/events"
        className="bg-primary hover:bg-accent text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors inline-block"
      >
        Browse Events
      </Link>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section className="py-20 bg-secondary">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h3 className="text-3xl md:text-4xl font-bold text-foreground">Why TicketChain?</h3>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-background p-8 rounded-xl border border-secondary/50">
            <feature.icon className="text-primary mb-4" size={40} />
            <h4 className="text-xl font-bold text-foreground mb-2">{feature.title}</h4>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h3 className="text-3xl md:text-4xl font-bold text-foreground">How It Works</h3>
      </div>
      <div className="grid md:grid-cols-3 gap-8 text-center">
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold text-primary mb-4">1</div>
          <h4 className="text-xl font-bold mb-2">Find Your Event</h4>
          <p className="text-gray-600">Browse a global list of concerts, sports, and community gatherings.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold text-primary mb-4">2</div>
          <h4 className="text-xl font-bold mb-2">Purchase Your Ticket</h4>
          <p className="text-gray-600">Connect your wallet and buy your unique NFT ticket with any token.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold text-primary mb-4">3</div>
          <h4 className="text-xl font-bold mb-2">Enjoy or Resell</h4>
          <p className="text-gray-600">Use your ticket for entry or trade it on the open secondary marketplace.</p>
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
