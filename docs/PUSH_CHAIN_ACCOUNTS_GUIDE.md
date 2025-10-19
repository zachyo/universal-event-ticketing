# Push Chain Accounts System - Developer Guide

## Table of Contents

1. [Overview](#overview)
2. [Understanding Universal Executor Accounts (UEA)](#understanding-universal-executor-accounts-uea)
3. [Origin vs Executor Addresses](#origin-vs-executor-addresses)
4. [How Addresses Work in Transactions](#how-addresses-work-in-transactions)
5. [Getting Addresses in Your Code](#getting-addresses-in-your-code)
6. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
7. [Best Practices](#best-practices)
8. [Code Examples](#code-examples)

---

## Overview

Push Chain introduces a **Universal Account System** that enables seamless cross-chain interactions. Understanding how addresses work in Push Chain is critical for building applications that function correctly across different blockchain networks.

### Key Concepts

- **Origin Address**: Your wallet address on the source chain (e.g., Sepolia, Solana, Polygon)
- **Universal Executor Account (UEA)**: Your mapped address on Push Chain that executes transactions
- **Address Mapping**: The relationship between your origin address and your UEA

---

## Understanding Universal Executor Accounts (UEA)

### What is a UEA?

A **Universal Executor Account (UEA)** is your identity on Push Chain. It's a deterministically generated address that:

1. **Represents you across all chains** - One UEA maps to multiple origin addresses
2. **Executes transactions on Push Chain** - When you submit a transaction via Push SDK, your UEA is the `msg.sender`
3. **Is cryptographically derived** - Your UEA is computed from your origin chain address and account information

### Why UEAs Matter

When you interact with Push Chain smart contracts:

```solidity
// In your smart contract on Push Chain
function createEvent() public {
    events[eventId].organizer = msg.sender; // This is your UEA, NOT your origin address!
}
```

**Critical Understanding**: `msg.sender` in Push Chain contracts is ALWAYS the UEA, not your wallet's origin address.

---

## Origin vs Executor Addresses

### Visual Representation

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Identity                         │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐          ┌──────▼───────┐
        │ Origin Address │          │  Push Chain  │
        │   (Sepolia)    │◄────────►│     UEA      │
        │ 0xABC...123    │  Mapping │ 0xDEF...789  │
        └────────────────┘          └──────────────┘
                │                           │
                │                           │
         Wallet Address              Smart Contract
         (What you see)              Sees This!
```

### Comparison Table

| Aspect                     | Origin Address                            | UEA (Executor Address)                              |
| -------------------------- | ----------------------------------------- | --------------------------------------------------- |
| **Where it lives**         | Your origin chain (Sepolia, Solana, etc.) | Push Chain                                          |
| **How to get it**          | `useAccount().address` from wagmi/wallet  | `PushChain.utils.account.convertOriginToExecutor()` |
| **Used for**               | Signing transactions, wallet UI           | `msg.sender` in Push Chain contracts                |
| **Example**                | `0x1234...abcd`                           | `0x5678...efgh`                                     |
| **Visible to user**        | ✅ Yes (in wallet)                        | ❌ Usually hidden                                   |
| **Smart contract storage** | ❌ Don't store this                       | ✅ Store this for authorization                     |

---

## How Addresses Work in Transactions

### Transaction Flow Diagram

```
User Action: Create Event
        ↓
[Origin Chain Wallet]
 0xABC...123 (Sepolia)
        ↓
[Sign Transaction]
        ↓
[Push Chain SDK]
pushChainClient.universal.sendTransaction()
        ↓
[Address Mapping Layer]
Origin: 0xABC...123 → UEA: 0xDEF...789
        ↓
[Push Chain Smart Contract]
msg.sender = 0xDEF...789 (UEA!)
        ↓
[Contract Storage]
events[1].organizer = 0xDEF...789
```

### Example Scenario

**Creating an Event:**

```typescript
// User connected with Sepolia wallet: 0xABC...123

// User calls:
await pushChainClient.universal.sendTransaction({
  to: ticketFactoryAddress,
  data: encodeFunctionData({
    abi: TicketFactoryABI,
    functionName: 'createEvent',
    args: [...]
  })
});

// In the smart contract:
// msg.sender = 0xDEF...789 (UEA)
// NOT 0xABC...123 (origin address)
```

**Verifying the Event:**

```typescript
// ❌ WRONG - This will fail!
const originAddress = useAccount().address; // 0xABC...123
const isOrganizer = organizerAddress === originAddress; // false!

// ✅ CORRECT - Compare UEAs
const originAddress = useAccount().address;
const uea = await convertToUEA(originAddress); // 0xDEF...789
const isOrganizer = organizerAddress === uea; // true!
```

---

## Getting Addresses in Your Code

### 1. Getting the Origin Address

The origin address is your wallet address on the connected chain:

```typescript
import { useAccount } from "wagmi";

function MyComponent() {
  const { address: originAddress } = useAccount();

  console.log("Origin Address:", originAddress);
  // Output: "0xABC...123" (Sepolia address)

  return <div>Connected: {originAddress}</div>;
}
```

### 2. Getting the UEA (Universal Executor Account)

To get the UEA, you need to convert the origin address using Push Chain SDK:

```typescript
import { usePushWalletContext, usePushChain } from "@pushchain/ui-kit";

function MyComponent() {
  const { address: originAddress } = useAccount();
  const { universalAccount } = usePushWalletContext();
  const { PushChain } = usePushChain();

  const [ueaAddress, setUeaAddress] = useState<string | null>(null);

  useEffect(() => {
    const resolveUEA = async () => {
      if (!universalAccount || !PushChain) {
        setUeaAddress(originAddress || null);
        return;
      }

      try {
        // Convert origin address to UEA
        const executorInfo =
          await PushChain.utils.account.convertOriginToExecutor(
            universalAccount,
            { onlyCompute: true }
          );

        // Extract the address string from the ExecutorAccountInfo object
        const executorAddress = executorInfo.address;

        console.log("Origin Address:", universalAccount.address);
        console.log("UEA (Executor):", executorAddress);

        setUeaAddress(executorAddress);
      } catch (error) {
        console.error("Failed to resolve UEA:", error);
        setUeaAddress(originAddress || null);
      }
    };

    resolveUEA();
  }, [universalAccount, PushChain, originAddress]);

  return (
    <div>
      <p>Origin: {originAddress}</p>
      <p>UEA: {ueaAddress}</p>
    </div>
  );
}
```

### 3. Important: ExecutorAccountInfo Structure

The `convertOriginToExecutor()` function returns an **object**, not a string:

```typescript
// ❌ WRONG - Type error!
const executorAddress = await PushChain.utils.account.convertOriginToExecutor(
  universalAccount,
  { onlyCompute: true }
);
setUeaAddress(executorAddress); // Type: ExecutorAccountInfo, not string!

// ✅ CORRECT - Extract the address property
const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
  universalAccount,
  { onlyCompute: true }
);
const executorAddress = executorInfo.address; // Now it's a string
setUeaAddress(executorAddress);
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Comparing Origin Address to Contract Storage

**Problem:**

```typescript
// User creates event from Sepolia wallet
// Contract stores: organizer = 0xDEF...789 (UEA)

// Later, verification fails:
const { address: myAddress } = useAccount(); // 0xABC...123 (origin)
const isOrganizer = event.organizer === myAddress; // Always false!
```

**Solution:**

```typescript
// Convert your origin address to UEA first
const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
  universalAccount,
  { onlyCompute: true }
);
const myUEA = executorInfo.address;
const isOrganizer = event.organizer === myUEA; // Correct!
```

### Pitfall 2: Using Origin Address in Transaction Calls

**Problem:**

```typescript
// Trying to check authorization using origin address
const { address: originAddress } = useAccount();
const canVerify = await contract.isEventOrganizer(eventId, originAddress);
// Returns false because contract expects UEA
```

**Solution:**

```typescript
// Convert to UEA before calling contract
const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
  universalAccount,
  { onlyCompute: true }
);
const myUEA = executorInfo.address;
const canVerify = await contract.isEventOrganizer(eventId, myUEA);
// Returns true!
```

### Pitfall 3: Forgetting to Handle Loading States

**Problem:**

```typescript
// UEA resolution is async, but UI renders immediately
return <div>Organizer: {ueaAddress}</div>; // Shows "null" initially
```

**Solution:**

```typescript
const [isResolvingUEA, setIsResolvingUEA] = useState(false);

useEffect(() => {
  const resolveUEA = async () => {
    setIsResolvingUEA(true);
    try {
      // ... resolution logic
    } finally {
      setIsResolvingUEA(false);
    }
  };
  resolveUEA();
}, [universalAccount, PushChain]);

if (isResolvingUEA) {
  return <div>Resolving address...</div>;
}

return <div>Organizer: {ueaAddress}</div>;
```

### Pitfall 4: Not Handling Multiple Chain Connections

**Problem:**

```typescript
// User switches from Sepolia to Polygon
// Origin address changes, but UEA not recalculated
```

**Solution:**

```typescript
useEffect(() => {
  resolveUEA();
}, [universalAccount, PushChain, originAddress]); // Include originAddress in deps
```

---

## Best Practices

### 1. Always Store UEAs in Smart Contracts

```solidity
// ✅ GOOD - Contract automatically uses UEA
contract TicketFactory {
    struct Event {
        address organizer; // This will be UEA when created via Push SDK
        string name;
    }

    function createEvent(string memory name) public {
        events[nextId].organizer = msg.sender; // msg.sender is UEA
    }
}
```

### 2. Convert Addresses Before Comparisons

```typescript
// ✅ GOOD - Convert both sides to UEA
const isAuthorized = async (eventOrganizer: string) => {
  const myUEA = await resolveUEA(universalAccount);
  return eventOrganizer.toLowerCase() === myUEA.toLowerCase();
};
```

### 3. Cache UEA Resolution Results

```typescript
// ✅ GOOD - Resolve once and reuse
const [cachedUEA, setCachedUEA] = useState<string | null>(null);

useEffect(() => {
  if (cachedUEA) return; // Already resolved

  resolveUEA().then(setCachedUEA);
}, [universalAccount, cachedUEA]);
```

### 4. Always Handle Both Cases

```typescript
// ✅ GOOD - Graceful fallback
const resolveUEA = async () => {
  try {
    if (!universalAccount || !PushChain) {
      // Fallback to origin address if Push Chain not available
      return originAddress;
    }

    const executorInfo = await PushChain.utils.account.convertOriginToExecutor(
      universalAccount,
      { onlyCompute: true }
    );
    return executorInfo.address;
  } catch (error) {
    console.error("UEA resolution failed:", error);
    return originAddress; // Fallback
  }
};
```

### 5. Log for Debugging

```typescript
// ✅ GOOD - Clear logging
console.log("Address Resolution:");
console.log("  Origin:", originAddress);
console.log("  UEA:", ueaAddress);
console.log("  Match:", organizerAddress === ueaAddress);
```

---

## Code Examples

### Complete Example: Event Organizer Verification

```typescript
import { useAccount } from "wagmi";
import { usePushWalletContext, usePushChain } from "@pushchain/ui-kit";
import { useState, useEffect } from "react";

export function OrganizerVerificationPage() {
  const { address: originAddress } = useAccount();
  const { universalAccount } = usePushWalletContext();
  const { PushChain } = usePushChain();

  const [organizerUEA, setOrganizerUEA] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve the current user's UEA
  useEffect(() => {
    const resolveExecutorAddress = async () => {
      // Reset state
      setError(null);

      // Fallback if Push Chain not available
      if (!universalAccount || !PushChain) {
        console.log("Push Chain not available, using origin address");
        setOrganizerUEA(originAddress || null);
        return;
      }

      setIsResolving(true);
      try {
        console.log("Resolving UEA from origin:", universalAccount.address);

        // Convert origin address to UEA
        const executorInfo =
          await PushChain.utils.account.convertOriginToExecutor(
            universalAccount,
            { onlyCompute: true }
          );

        const executorAddress = executorInfo.address;
        console.log("Resolved UEA:", executorAddress);

        setOrganizerUEA(executorAddress);
      } catch (err) {
        console.error("Failed to resolve executor address:", err);
        setError(err instanceof Error ? err.message : "Unknown error");

        // Fallback to origin address
        setOrganizerUEA(originAddress || null);
      } finally {
        setIsResolving(false);
      }
    };

    resolveExecutorAddress();
  }, [universalAccount, PushChain, originAddress]);

  // Check if current user is the event organizer
  const checkIsOrganizer = (eventOrganizerAddress: string): boolean => {
    if (!organizerUEA || !eventOrganizerAddress) {
      return false;
    }

    // Compare UEAs (case-insensitive)
    const isOrganizer =
      organizerUEA.toLowerCase() === eventOrganizerAddress.toLowerCase();

    console.log("Authorization Check:");
    console.log("  Event Organizer (UEA):", eventOrganizerAddress);
    console.log("  Current User (UEA):", organizerUEA);
    console.log("  Is Organizer:", isOrganizer);

    return isOrganizer;
  };

  // UI rendering with loading states
  if (isResolving) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Resolving your Push Chain address...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error resolving address: {error}</p>
      </div>
    );
  }

  if (!organizerUEA) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please connect your wallet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        <p>Origin Address: {originAddress}</p>
        <p>Push Chain UEA: {organizerUEA}</p>
      </div>

      {/* Your verification UI here */}
    </div>
  );
}
```

### Complete Example: Displaying User's Tickets

```typescript
import { useAccount } from "wagmi";
import { usePushWalletContext, usePushChain } from "@pushchain/ui-kit";
import { useReadContract } from "wagmi";

export function MyTicketsPage() {
  const { address: originAddress } = useAccount();
  const { universalAccount } = usePushWalletContext();
  const { PushChain } = usePushChain();

  const [ownerUEA, setOwnerUEA] = useState<string | null>(null);

  // Resolve UEA
  useEffect(() => {
    const resolveUEA = async () => {
      if (!universalAccount || !PushChain) {
        setOwnerUEA(originAddress || null);
        return;
      }

      try {
        const executorInfo =
          await PushChain.utils.account.convertOriginToExecutor(
            universalAccount,
            { onlyCompute: true }
          );
        setOwnerUEA(executorInfo.address);
      } catch (error) {
        console.error("Failed to resolve UEA:", error);
        setOwnerUEA(originAddress || null);
      }
    };

    resolveUEA();
  }, [universalAccount, PushChain, originAddress]);

  // Fetch user's tickets using UEA
  const { data: tickets } = useReadContract({
    address: ticketFactoryAddress,
    abi: TicketFactoryABI,
    functionName: "getUserTickets",
    args: [ownerUEA], // Use UEA, not origin address!
  });

  return (
    <div>
      <h2>My Tickets</h2>
      {tickets?.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

---

## Quick Reference

### When to Use Origin Address

- ✅ Displaying connected wallet address to user
- ✅ UI components showing "Connected as..."
- ✅ Logging/debugging which wallet is connected
- ✅ Initial wallet connection detection

### When to Use UEA

- ✅ Comparing with addresses stored in Push Chain contracts
- ✅ Authorization checks (is this user the event organizer?)
- ✅ Fetching user-specific data from contracts
- ✅ Any address comparison involving `msg.sender` in contracts
- ✅ Checking token/NFT ownership on Push Chain

### Address Resolution Checklist

- [ ] Imported Push Chain hooks (`usePushWalletContext`, `usePushChain`)
- [ ] Created state for UEA (`useState<string | null>(null)`)
- [ ] Created loading state (`useState<boolean>(false)`)
- [ ] Added useEffect with proper dependencies
- [ ] Handled missing Push Chain context (fallback to origin)
- [ ] Extracted `.address` from `ExecutorAccountInfo` object
- [ ] Added error handling with try/catch
- [ ] Logged origin and UEA for debugging
- [ ] Used lowercase comparison (`toLowerCase()`)
- [ ] Added loading UI for resolution state

---

## Summary

**Key Takeaways:**

1. **Origin Address ≠ UEA** - They are different addresses
2. **Smart contracts see UEAs** - `msg.sender` is always UEA in Push Chain contracts
3. **Always convert before comparing** - Use `convertOriginToExecutor()` to get UEA
4. **Extract the address property** - `executorInfo.address`, not just `executorInfo`
5. **Handle loading states** - Address resolution is asynchronous
6. **Log everything** - Makes debugging cross-chain issues much easier

**When in doubt**: If you're comparing addresses with anything stored in a Push Chain smart contract, you need to be using UEAs, not origin addresses!

---

## Additional Resources

- [Push Chain Documentation](https://push.org/docs)
- [Push Chain SDK GitHub](https://github.com/push-protocol/push-chain-sdk)
- [Universal Account Examples](https://github.com/push-protocol/push-chain-examples)

---

**Document Version**: 1.0  
**Last Updated**: October 18, 2025  
**Maintained by**: TicketChain Team
