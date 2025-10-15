import TicketFactory from "/home/zarcc/Documents/GitHub/WEB3/hackathon/ticketchain/artifacts/contracts/TicketFactory.sol/TicketFactory.json";
import TicketNFT from "/home/zarcc/Documents/GitHub/WEB3/hackathon/ticketchain/artifacts/contracts/TicketNFT.sol/TicketNFT.json";
import TicketMarketplace from "/home/zarcc/Documents/GitHub/WEB3/hackathon/ticketchain/artifacts/contracts/TicketMarketplace.sol/TicketMarketplace.json";
import type { Abi } from "viem";

export const TICKET_FACTORY_ADDRESS = import.meta.env.VITE_TICKET_FACTORY_ADDRESS;
export const TICKET_NFT_ADDRESS = import.meta.env.VITE_TICKET_NFT_ADDRESS;
export const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS;

export const TicketFactoryABI = TicketFactory.abi as Abi;
export const TicketNFTABI = TicketNFT.abi as Abi;
export const TicketMarketplaceABI = TicketMarketplace.abi as Abi;

// Push Chain native token configuration
export const PC_TOKEN = {
  name: "Push Chain",
  symbol: "PC",
  decimals: 18,
  // PC token exchange rates (these would typically come from an API)
  exchangeRates: {
    ETH: 0.001, // 1 PC = 0.001 ETH (example rate)
    MATIC: 0.5,  // 1 PC = 0.5 MATIC (example rate)
    SOL: 0.01,   // 1 PC = 0.01 SOL (example rate)
    BNB: 0.002,  // 1 PC = 0.002 BNB (example rate)
    AVAX: 0.03,  // 1 PC = 0.03 AVAX (example rate)
  }
};

// Helper function to convert PC to other currencies for display
export function convertPCToNative(pcAmount: bigint, targetCurrency: string): bigint {
  const rate = PC_TOKEN.exchangeRates[targetCurrency as keyof typeof PC_TOKEN.exchangeRates] || 1;
  return BigInt(Math.floor(Number(pcAmount) * rate));
}

// Helper function to convert native currency to PC
export function convertNativeToPC(nativeAmount: bigint, sourceCurrency: string): bigint {
  const rate = PC_TOKEN.exchangeRates[sourceCurrency as keyof typeof PC_TOKEN.exchangeRates] || 1;
  return BigInt(Math.floor(Number(nativeAmount) / rate));
}
