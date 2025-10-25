import {
  PushUI,
  PushUniversalWalletProvider,
  type AppMetadata,
  type ProviderConfigProps,
} from "@pushchain/ui-kit";

/**
 * PushChainProviders Component
 *
 * This component wraps your entire application with Push Chain's Universal Wallet Provider.
 * It configures the wallet connection options, network settings, and app metadata.
 *
 * Configuration Guide:
 * - network: Choose between MAINNET, TESTNET, or DEV
 * - login: Configure authentication methods (email, google, wallet)
 * - modal: Customize the UI appearance and behavior
 * - chainConfig: Add your custom RPC endpoints
 * - appMetadata: Brand your app with logo, title, and description
 */

const PushChainProviders = ({ children }: { children: React.ReactNode }) => {
  // Wallet configuration - customize these settings for your app
  const walletConfig: ProviderConfigProps = {
    // Network selection: MAINNET for production, TESTNET for development
    network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET,

    // Login options - enable/disable authentication methods
    login: {
      email: true, // Allow email authentication
      google: true, // Allow Google OAuth
      wallet: {
        enabled: true, // Allow wallet connection (MetaMask, etc.)
      },
      appPreview: true, // Show app preview in login modal
    },

    // Modal UI customization
    modal: {
      // Layout: SPLIT (side-by-side) or STACKED (vertical)
      loginLayout: PushUI.CONSTANTS.LOGIN.LAYOUT.SPLIT,

      // Connected wallet display: HOVER (on hover) or FULL (always visible)
      connectedLayout: PushUI.CONSTANTS.CONNECTED.LAYOUT.HOVER,

      // Show app preview in modals
      appPreview: true,

      // Background interaction when modal is open: BLUR or NONE
      connectedInteraction: PushUI.CONSTANTS.CONNECTED.INTERACTION.BLUR,
    },

    // Chain configuration - add your custom RPC endpoints here
    chainConfig: {
      rpcUrls: {
        // Ethereum Sepolia testnet (for testing)
        "eip155:11155111": [
          "https://sepolia.gateway.tenderly.co/",
          "https://rpc.sepolia.org",
        ],

        // Solana Push Testnet (fee-locker lives on devnet)
        "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1": [
          "https://api.devnet.solana.com",
        ],

        // Solana Devnet (standard cluster id)
        "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z": [
          "https://api.devnet.solana.com",
        ],
      },
    },
  };

  // App metadata - customize with your app's branding
  const appMetadata: AppMetadata = {
    // Your app's logo URL (can be a URL or base64 data URI)
    logoUrl: "https://avatars.githubusercontent.com/u/64157541?v=4",

    // Your app's display name
    title: "TicketChain",

    // Brief description of your app (shown in wallet connection prompts)
    description:
      "TicketChain - A decentralized ticketing platform powered by Push Chain. Buy tickets with any token from any supported blockchain.",
  };

  return (
    <PushUniversalWalletProvider config={walletConfig} app={appMetadata}>
      {children}
    </PushUniversalWalletProvider>
  );
};

export { PushChainProviders };
