import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, polygon, base, arbitrum } from 'wagmi/chains';

// Define Push Chain testnet
export const pushTestnet = {
  id: 111557560,
  name: 'Push Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Push Token',
    symbol: 'PUSH',
  },
  rpcUrls: {
    default: {
      http: ['https://evm.rpc-testnet-donut-node1.push.org/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Push Chain Explorer',
      url: 'https://donut.push.network/',
    },
  },
  testnet: true,
} as const;

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [pushTestnet],
  transports: {
    [pushTestnet.id]: http(),
    // [mainnet.id]: http(),
    // [sepolia.id]: http(),
    // [polygon.id]: http(),
    // [base.id]: http(),
    // [arbitrum.id]: http(),
  },
});

// Export chain configurations for easy access
export const supportedChains = {
  pushTestnet,
  // mainnet,
  // sepolia,
  // polygon,
  // base,
  // arbitrum,
};

// Helper function to get chain by ID
export function getChainById(chainId: number) {
  return Object.values(supportedChains).find(chain => chain.id === chainId);
}

// Helper function to get chain name
export function getChainName(chainId: number): string {
  const chain = getChainById(chainId);
  return chain?.name || `Chain ${chainId}`;
}

// Helper function to get native currency symbol
export function getNativeCurrencySymbol(chainId: number): string {
  const chain = getChainById(chainId);
  return chain?.nativeCurrency.symbol || 'ETH';
}

// Helper function to get block explorer URL
export function getBlockExplorerUrl(chainId: number): string {
  const chain = getChainById(chainId);
  return chain?.blockExplorers?.default?.url || '';
}

// Helper function to get transaction URL
export function getTransactionUrl(chainId: number, txHash: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/tx/${txHash}` : '';
}

// Helper function to get address URL
export function getAddressUrl(chainId: number, address: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/address/${address}` : '';
}
