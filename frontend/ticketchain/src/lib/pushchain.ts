import { ethers } from "ethers";

// This provider can be used for read-only interactions with the Push Chain network
// that don't require a user's wallet connection.
export const pushProvider = new ethers.JsonRpcProvider(
  import.meta.env.VITE_PUSH_RPC_URL || "https://evm.rpc-testnet-donut-node1.push.org/"
);
