import { Link } from "react-router-dom";
import {
  PushUniversalAccountButton,
  usePushWalletContext,
} from "@pushchain/ui-kit";

import { Ticket, Menu, X } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const { connectionStatus } = usePushWalletContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // console.log("This is the push chain client", pushChainClient);
  // console.log(
  //   "Push UI connection status:",
  //   PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED
  // );

  // const sendTokens = () => {
  //   if (pushChainClient != null) {
  //     pushChainClient.universal
  //       .sendTransaction({
  //         to: pushChainClient.universal.account,
  //         // value: PushChain.utils.helpers.parseUnits("10000", 18), // 0.1 PC in uPC
  //         // value: BigInt('100000000000000000') is equivalent here
  //         funds: {
  //           amount: PushChain.utils.helpers.parseUnits("10", 18),
  //           token: pushChainClient.moveable.token.USDT,
  //         },
  //       })
  //       .then((txHash) => alert(txHash))
  //       .catch((err) => console.error(err, "some shit ain't right"));
  //   }
  // };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="font-bold">TicketChain</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:ml-6 items-center gap-6 text-sm">
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
          {connectionStatus === "connected" && (
            <>
              <Link
                to="/my-tickets"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                My Tickets
              </Link>
              <Link
                to="/organizer-scan"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Scan Tickets
              </Link>
            </>
          )}
        </nav>

        {/* Desktop Wallet Button */}
        <div className="hidden md:flex flex-1 items-center justify-end space-x-4">
          <PushUniversalAccountButton />
        </div>

        {/* Mobile Menu Button & Wallet */}
        <div className="flex md:hidden flex-1 items-center justify-end gap-2">
          <div className="scale-90">
            <PushUniversalAccountButton />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground/60 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <nav className="container px-4 py-4 flex flex-col gap-3">
            <Link
              to="/events"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
            >
              Events
            </Link>
            <Link
              to="/marketplace"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
            >
              Marketplace
            </Link>
            <Link
              to="/create-event"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
            >
              Create Event
            </Link>
            {connectionStatus === "connected" && (
              <>
                <Link
                  to="/my-tickets"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
                >
                  My Tickets
                </Link>
                <Link
                  to="/organizer-scan"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
                >
                  Scan Tickets
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
