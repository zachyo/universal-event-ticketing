(Files content cropped to 300k characters, download full ingest to see more)
================================================
FILE: README.md
================================================
# OmniPay

A comprehensive cross-chain payment platform that leverages Push Protocol for decentralized notifications, enabling seamless transactions across multiple blockchain networks with real-time user notifications.

## 🌟 Overview

OmniPay is a modern Web3 payment infrastructure that combines the power of cross-chain interoperability with Push Protocol's decentralized notification system. Built with React 19, TypeScript, and Solidity, it provides a complete solution for payments, subscriptions, settlements, and cross-chain bridges with integrated push notifications.

## 🚀 Key Features

### Core Payment System
- **Instant Payments**: Send ETH and ERC20 tokens with real-time confirmation
- **Cross-Chain Payments**: Seamless transactions across Ethereum, Base, Polygon, Arbitrum, and Optimism
- **Multi-Token Support**: Support for major tokens including ETH, USDC, USDT, DAI, and Push Protocol token
- **Payment References**: Add custom references and metadata to transactions

### Subscription Management
- **Recurring Payments**: Automated subscription billing with customizable intervals
- **Flexible Scheduling**: Daily, weekly, monthly, quarterly, and yearly payment cycles
- **Merchant Dashboard**: Complete subscription management for service providers
- **Auto-Execution**: Automated payment processing with notification alerts

### Settlement System
- **Multi-Party Settlements**: Create settlements with multiple recipients
- **Deadline Management**: Set payment deadlines with automatic expiration
- **Partial Payments**: Support for partial settlement execution
- **Settlement Tracking**: Real-time status updates and payment history

### Cross-Chain Bridge
- **Multi-Chain Support**: Bridge payments across 5+ major blockchain networks
- **Relayer Network**: Decentralized relayer system for cross-chain execution
- **Payment Verification**: Cryptographic proof verification for secure bridging
- **Fee Management**: Dynamic fee calculation based on network conditions

### Push Protocol Integration
- **Decentralized Notifications**: Real-time push notifications for all payment events
- **Channel Management**: Dedicated Push Protocol channel for OmniPay notifications
- **Multi-Event Support**: Notifications for payments, subscriptions, settlements, and bridge operations
- **Custom Notifications**: Extensible notification system for custom events

## 🛠 Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions

### Web3 Integration
- **Wagmi v2** - React hooks for Ethereum
- **Reown AppKit** - Multi-wallet connection
- **Viem** - TypeScript Ethereum library
- **RainbowKit** - Beautiful wallet connection UI

### Smart Contracts
- **Solidity ^0.8.20** - Smart contract development
- **Hardhat** - Development environment and testing
- **OpenZeppelin** - Security-audited contract libraries
- **TypeChain** - TypeScript bindings for contracts

### Push Protocol Stack
- **@pushprotocol/restapi** - Push Protocol SDK for notifications
- **Push Chain Donut Testnet** - Testnet deployment for Push notifications
- **Channel Management** - Dedicated notification channels

### UI/UX
- **Lucide React** - Modern icon library
- **React Hook Form** - Form state management
- **Sonner** - Toast notifications
- **Zustand** - Lightweight state management

## 📁 Project Structure

```
omnipay/
├── contracts/                 # Smart contracts
│   ├── OmniPayCore.sol       # Core payment logic
│   ├── OmniPayNotifier.sol   # Push Protocol integration
│   ├── OmniPaySubscription.sol # Subscription management
│   ├── OmniPaySettlement.sol # Multi-party settlements
│   ├── OmniPayBridge.sol     # Cross-chain bridge
│   └── mocks/                # Test contracts
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── config/          # Configuration files
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── scripts/                 # Deployment and utility scripts
│   ├── deploy.ts           # Contract deployment
│   ├── pushchannel.ts      # Push channel creation
│   └── verify.ts           # Contract verification
└── test/                   # Smart contract tests
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Git
- MetaMask or compatible Web3 wallet

### Quick Start

1. **Clone the repository**:
```bash
git clone https://github.com/Fmsticks2/omnipay.git
cd omnipay
```

2. **Install dependencies**:
```bash
npm install
cd frontend && npm install
```

3. **Environment Setup**:
```bash
cp .env.example .env
cd frontend && cp .env.example .env.local
```

4. **Configure environment variables**:
```bash
# Root .env
PRIVATE_KEY=your_private_key
PUSH_COMM=0x... # Push Protocol communicator address
PUSH_CHANNEL=0x... # Your Push Protocol channel address

# Frontend .env.local
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_PUSH_CHANNEL=your_push_channel_address
```

5. **Start development**:
```bash
# Terminal 1: Start frontend
cd frontend && npm run dev

# Terminal 2: Deploy contracts (optional)
npm run deploy:testnet
```

## 📋 Available Scripts

### Frontend Development
- `npm run dev` - Start development server (port 5174)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checking
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

- `npm run compile` - Compile smart contracts
- `npm run test` - Run contract tests
- `npm run deploy:testnet` - Deploy to testnet
- `npm run deploy:mainnet` - Deploy to mainnet
- `npm run verify` - Verify contracts on Etherscan
- `npm run create-channel` - Create Push Protocol channel

## 🔗 Smart Contract Architecture

### Core Contracts

#### OmniPayCore.sol
The main payment processing contract that handles:
- ETH and ERC20 token payments
- Payment validation and execution
- Transaction history and references
- Integration with notification system

#### OmniPayNotifier.sol
Push Protocol integration contract featuring:
- Decentralized notification dispatch
- Multi-event type support (payments, subscriptions, settlements)
- Channel management and configuration
- Custom notification payloads

#### OmniPaySubscription.sol
Subscription management system with:
- Recurring payment automation
- Flexible interval scheduling
- Merchant and subscriber management
- Auto-execution with notifications

#### OmniPaySettlement.sol
Multi-party settlement system providing:
- Group payment coordination
- Deadline-based execution
- Partial payment support
- Settlement status tracking

#### OmniPayBridge.sol
Cross-chain payment bridge offering:
- Multi-chain payment initiation
- Relayer-based execution
- Payment verification and completion
- Cross-chain notification delivery

## 🔔 Push Protocol Integration

### Notification System
OmniPay leverages Push Protocol to provide real-time, decentralized notifications for all payment activities:

- **Payment Notifications**: Instant alerts for successful/failed payments
- **Subscription Alerts**: Renewal reminders and execution confirmations
- **Settlement Updates**: Multi-party payment coordination notifications
- **Bridge Status**: Cross-chain payment progress tracking

### Channel Configuration
```typescript
// Push Protocol Channel Setup
const channelConfig = {
  name: "OmniPay Channel",
  description: "Cross-chain payment notifications for OmniPay",
  url: "https://omnipay.vercel.app",
  icon: "https://omnipay.vercel.app/favicon.ico",
  chainId: 42101 // Push Chain Donut Testnet
};
```

### SDK Integration
The project uses `@pushprotocol/restapi` for:
- Channel creation and management
- Notification dispatch
- Subscriber management
- Push Protocol communication

## 🌐 Supported Networks

### Mainnet Support
- **Ethereum** (Chain ID: 1)
- **Base** (Chain ID: 8453)
- **Polygon** (Chain ID: 137)
- **Arbitrum One** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)

### Testnet Support
- **Push Chain Donut Testnet** (Chain ID: 42101) - Primary deployment
- **Sepolia** (Chain ID: 11155111)
- **Base Sepolia** (Chain ID: 84532)

## 💰 Token Support

### Native Tokens
- ETH (Ethereum)
- MATIC (Polygon)
- ETH (Base, Arbitrum, Optimism)

### ERC20 Tokens
- **USDC** - USD Coin
- **USDT** - Tether USD
- **DAI** - Dai Stablecoin
- **PUSH** - Push Protocol Token
- Custom ERC20 tokens (configurable)

## 🚀 Usage Examples

### Basic Payment
```typescript
import { useSendPayment } from './hooks/useOmniPayContracts';

const PaymentComponent = () => {
  const { sendPayment, isPending, isSuccess } = useSendPayment();
  
  const handlePayment = async () => {
    await sendPayment(
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // recipient
      '1.0', // amount in ETH
      '0x0000000000000000000000000000000000000000', // ETH address
      'Payment for services' // reference
    );
  };
  
  return (
    <button onClick={handlePayment} disabled={isPending}>
      {isPending ? 'Processing...' : 'Send Payment'}
    </button>
  );
};
```

### Subscription Creation
```typescript
import { useCreateSubscription } from './hooks/useOmniPayContracts';

const SubscriptionComponent = () => {
  const { createSubscription, isPending } = useCreateSubscription();
  
  const handleSubscription = async () => {
    await createSubscription(
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // merchant
      '0xA0b86a33E6441b8dB4B2a4B4B4B4B4B4B4B4B4B4', // USDC token
      '10.0', // amount
      2592000 // 30 days in seconds
    );
  };
  
  return (
    <button onClick={handleSubscription} disabled={isPending}>
      Create Monthly Subscription
    </button>
  );
};
```

### Cross-Chain Payment
```typescript
import { useInitiateCrossChainPayment } from './hooks/useOmniPayContracts';

const CrossChainComponent = () => {
  const { initiateCrossChainPayment, isPending } = useInitiateCrossChainPayment();
  
  const handleCrossChainPayment = async () => {
    await initiateCrossChainPayment(
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // payer
      '0x123...', // payee
      '0xA0b86a33E6441b8dB4B2a4B4B4B4B4B4B4B4B4B4', // token
      '50.0', // amount
      137, // Polygon chain ID
      'Cross-chain payment', // reference
      '0.001' // bridge fee in ETH
    );
  };
  
  return (
    <button onClick={handleCrossChainPayment} disabled={isPending}>
      Send Cross-Chain Payment
    </button>
  );
};
```

## 🔐 Security Features

### Smart Contract Security
- **OpenZeppelin Libraries**: Battle-tested security patterns
- **Reentrancy Protection**: Guards against reentrancy attacks
- **Access Control**: Role-based permissions system
- **Pausable Contracts**: Emergency stop functionality
- **Input Validation**: Comprehensive parameter checking

### Frontend Security
- **Type Safety**: Full TypeScript implementation
- **Input Sanitization**: XSS protection
- **Secure RPC**: Encrypted blockchain communication
- **Wallet Integration**: Secure Web3 wallet connections

## 🧪 Testing

### Smart Contract Tests
```bash
# Run all contract tests
npm run test

# Run specific test file
npx hardhat test test/OmniPayCore.test.js

# Run tests with coverage
npm run coverage
```

### Frontend Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 🚀 Deployment

### Testnet Deployment
```bash
# Deploy to Push Chain Donut Testnet
npm run deploy:testnet

# Create Push Protocol channel
npm run create-channel

# Verify contracts
npm run verify
```

### Mainnet Deployment
```bash
# Deploy to mainnet
npm run deploy:mainnet

# Verify contracts
npm run verify:mainnet
```

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Use conventional commit messages
- Ensure all tests pass before submitting
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Push Protocol** - For providing decentralized notification infrastructure
- **OpenZeppelin** - For secure smart contract libraries
- **Wagmi Team** - For excellent React Web3 hooks
- **Viem** - For TypeScript-first Ethereum library
- **Hardhat** - For comprehensive development environment

## 📞 Support & Community

- **Documentation**: [https://docs.omnipay.app](https://docs.omnipay.app)
- **Discord**: [Join our community](https://discord.gg/omnipay)
- **Twitter**: [@OmniPayApp](https://twitter.com/OmniPayApp)
- **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/omnipay/issues)
- **Email**: support@omnipay.app

---

Built with ❤️ by the OmniPay team, powered by Push Protocol.



================================================
FILE: hardhat.config.ts
================================================
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "solidity-coverage";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // viaIR: true, // Temporarily disabled due to test issues
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    push_donut: {
      url: process.env.VITE_PUSHCHAIN_RPC_URL || "https://evm.rpc-testnet-donut-node1.push.org",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here" ? [process.env.PRIVATE_KEY] : [],
      chainId: parseInt(process.env.VITE_PUSHCHAIN_CHAIN_ID || "42101"),
      gas: parseInt(process.env.GAS_LIMIT || "8000000"),
      gasPrice: parseInt(process.env.GAS_PRICE || "20000000000"),
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    externalArtifacts: ["externalArtifacts/*.json"],
    dontOverrideCompile: false,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 20,
    showTimeSpent: true,
    showMethodSig: true,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  etherscan: {
    apiKey: {
      push_donut: process.env.ETHERSCAN_API_KEY || "dummy",
    },
    customChains: [
      {
        network: "push_donut",
        chainId: parseInt(process.env.VITE_PUSHCHAIN_CHAIN_ID || "42101"),
        urls: {
          apiURL: process.env.VITE_PUSHCHAIN_EXPLORER_URL || "https://testnet-explorer.push.org/api",
          browserURL: process.env.VITE_PUSHCHAIN_EXPLORER_URL || "https://testnet-explorer.push.org",
        },
      },
    ],
  },
  mocha: {
    timeout: 60000,
    reporter: "spec",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;


