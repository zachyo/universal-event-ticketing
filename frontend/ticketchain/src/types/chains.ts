export interface SupportedChain {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  type: "evm" | "solana";
  testnet?: boolean;
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  // Ethereum
  {
    id: "eip155:1",
    name: "Ethereum",
    symbol: "ETH",
    icon: "ethereum",
    type: "evm",
  },
  {
    id: "eip155:11155111",
    name: "Ethereum Sepolia",
    symbol: "ETH",
    icon: "ethereum",
    type: "evm",
    testnet: true,
  },

  // Polygon
  {
    id: "eip155:137",
    name: "Polygon",
    symbol: "MATIC",
    icon: "polygon",
    type: "evm",
  },
  {
    id: "eip155:80001",
    name: "Polygon Mumbai",
    symbol: "MATIC",
    icon: "polygon",
    type: "evm",
    testnet: true,
  },

  // Arbitrum
  {
    id: "eip155:42161",
    name: "Arbitrum One",
    symbol: "ETH",
    icon: "arbitrum",
    type: "evm",
  },
  {
    id: "eip155:421614",
    name: "Arbitrum Sepolia",
    symbol: "ETH",
    icon: "arbitrum",
    type: "evm",
    testnet: true,
  },

  // Optimism
  {
    id: "eip155:10",
    name: "Optimism",
    symbol: "ETH",
    icon: "optimism",
    type: "evm",
  },
  {
    id: "eip155:11155420",
    name: "Optimism Sepolia",
    symbol: "ETH",
    icon: "optimism",
    type: "evm",
    testnet: true,
  },

  // BNB Smart Chain
  {
    id: "eip155:56",
    name: "BNB Smart Chain",
    symbol: "BNB",
    icon: "bnb",
    type: "evm",
  },
  {
    id: "eip155:97",
    name: "BNB Testnet",
    symbol: "BNB",
    icon: "bnb",
    type: "evm",
    testnet: true,
  },

  // Base
  {
    id: "eip155:8453",
    name: "Base",
    symbol: "ETH",
    icon: "ethereum", // Base uses ETH
    type: "evm",
  },
  {
    id: "eip155:84532",
    name: "Base Sepolia",
    symbol: "ETH",
    icon: "ethereum",
    type: "evm",
    testnet: true,
  },

  // Avalanche
  {
    id: "eip155:43114",
    name: "Avalanche",
    symbol: "AVAX",
    icon: "avalanche",
    type: "evm",
  },
  {
    id: "eip155:43113",
    name: "Avalanche Fuji",
    symbol: "AVAX",
    icon: "avalanche",
    type: "evm",
    testnet: true,
  },

  // Solana
  {
    id: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    name: "Solana",
    symbol: "SOL",
    icon: "solana",
    type: "solana",
  },
  {
    id: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    name: "Solana Devnet (Push)",
    symbol: "SOL",
    icon: "solana",
    type: "solana",
    testnet: true,
  },
  {
    id: "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z",
    name: "Solana Devnet (Standard)",
    symbol: "SOL",
    icon: "solana",
    type: "solana",
    testnet: true,
  },
];

// Helper function to get chain by ID
export const getChainById = (chainId: string): SupportedChain | undefined => {
  return SUPPORTED_CHAINS.find((chain) => chain.id === chainId);
};

// Helper function to get mainnet chains only
export const getMainnetChains = (): SupportedChain[] => {
  return SUPPORTED_CHAINS.filter((chain) => !chain.testnet);
};

// Helper function to get testnet chains only
export const getTestnetChains = (): SupportedChain[] => {
  return SUPPORTED_CHAINS.filter((chain) => chain.testnet);
};

// Default chain for development (Ethereum Sepolia)
export const DEFAULT_CHAIN = "eip155:11155111";
