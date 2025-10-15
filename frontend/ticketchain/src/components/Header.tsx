import { Link } from 'react-router-dom';
import { PushUniversalAccountButton, usePushWalletContext } from '@pushchain/ui-kit';
import { Ticket } from 'lucide-react';

export const Header = () => {
  const { connectionStatus } = usePushWalletContext();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="font-bold">TicketChain</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              to="/events"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Events
            </Link>
            <Link
              to="/marketplace"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Marketplace
            </Link>
            <Link
              to="/create-event"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Create Event
            </Link>
            {connectionStatus === 'connected' && (
              <Link
                to="/my-tickets"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                My Tickets
              </Link>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <PushUniversalAccountButton />
        </div>
      </div>
    </header>
  );
};