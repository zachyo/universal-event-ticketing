import type { Abi } from "viem";
import TicketFactoryArtifact from "./abi/TicketFactory.json";
import TicketNFTArtifact from "./abi/TicketNFT.json";
import TicketMarketplaceArtifact from "./abi/TicketMarketplace.json";

export const TICKET_FACTORY_ADDRESS = import.meta.env
  .VITE_TICKET_FACTORY_ADDRESS;
export const TICKET_NFT_ADDRESS = import.meta.env.VITE_TICKET_NFT_ADDRESS;
export const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS;

export const TicketFactoryABI = TicketFactoryArtifact.abi as Abi;
export const TicketNFTABI = TicketNFTArtifact.abi as Abi;
export const TicketMarketplaceABI = TicketMarketplaceArtifact.abi as Abi;

// Push Chain native token configuration
export const PC_TOKEN = {
  name: "Push Chain",
  symbol: "PC",
  decimals: 18,
  // PC token exchange rates (these would typically come from an API)
  exchangeRates: {
    ETH: 0.001, // 1 PC = 0.001 ETH (example rate)
    MATIC: 0.5, // 1 PC = 0.5 MATIC (example rate)
    SOL: 0.01, // 1 PC = 0.01 SOL (example rate)
    BNB: 0.002, // 1 PC = 0.002 BNB (example rate)
    AVAX: 0.03, // 1 PC = 0.03 AVAX (example rate)
  },
};

// Helper function to convert PC to other currencies for display
export function convertPCToNative(
  pcAmount: bigint,
  targetCurrency: string
): bigint {
  const rate =
    PC_TOKEN.exchangeRates[
      targetCurrency as keyof typeof PC_TOKEN.exchangeRates
    ] || 1;
  const converted = Number(pcAmount) * rate;
  if (Number.isNaN(converted) || !Number.isFinite(converted)) {
    return BigInt(0);
  }
  return BigInt(Math.floor(converted));
}

// Helper function to convert native currency to PC
export function convertNativeToPC(
  nativeAmount: bigint,
  sourceCurrency: string
): bigint {
  const rate =
    PC_TOKEN.exchangeRates[
      sourceCurrency as keyof typeof PC_TOKEN.exchangeRates
    ] || 1;
  const converted = Number(nativeAmount) / rate;
  if (Number.isNaN(converted) || !Number.isFinite(converted)) {
    return BigInt(0);
  }
  return BigInt(Math.floor(converted));
}
