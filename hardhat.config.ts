import dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import "solidity-coverage";
import "hardhat-gas-reporter";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    push: {
      url: "https://evm.rpc-testnet-donut-node1.push.org/",
      chainId: 42101,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    excludeContracts: [],
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      pushTestnet: "UNNECESSARY" // Blockscout explorers do not require an API key
    },
    customChains: [
      {
        network: "pushTestnet",
        chainId: 42101,
        urls: {
          apiURL: "https://donut.push.network/api",
          browserURL: "https://donut.push.network"
        }
      }
    ]
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  }
};

export default config;
