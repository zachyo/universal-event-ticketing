# Critical Security Fix: Ticket Reuse Prevention 🔒

**Issue Date:** October 18, 2025  
**Severity:** CRITICAL - Ticket can be used multiple times  
**Status:** PROPOSED SOLUTION

---

## 🚨 The Security Vulnerability

### **User Report:**

> "After I get verified with that ticket, I can send it to my friend and they'll use the same ticket to get in..."

### **Attack Scenario:**

```
1. Alice buys ticket (Ticket #123)
2. Alice generates QR code
3. Organizer scans QR → ✅ Valid
4. Alice enters event
5. Alice sends QR screenshot to Bob
6. Bob shows same QR at gate
7. Organizer scans → ✅ STILL VALID! (FRAUD)
8. Bob enters with Alice's ticket
9. Two people entered with one ticket 🚨
```

### **Root Cause:**

- Verification only **checks** ticket validity
- Does NOT **mark** ticket as used
- `validateTicket()` function exists in contract
- BUT it's restricted to Factory only
- Organizers cannot call it

---

## 💡 Proposed Solutions

### **Option 1: On-Chain Marking (Recommended)** ⭐

**Implementation:**

1. Add `markTicketAsUsed(tokenId, eventId)` function to TicketNFT
2. Restricted to event organizers only
3. Call when organizer clicks "Grant Entry"
4. Updates blockchain immediately
5. Next scan shows "Already used"

**Pros:**

```
✅ Permanent blockchain record
✅ Impossible to bypass
✅ Works across all devices
✅ Auditable entry log
✅ Prevents all duplicate entries
```

**Cons:**

```
⚠️ Requires gas fee (~$0.10-0.50 per entry)
⚠️ Slight delay (1-2 seconds transaction)
⚠️ Organizer wallet needs gas
⚠️ Transaction could fail
```

---

### **Option 2: Local Tracking + Batch On-Chain**

**Implementation:**

1. Store verified tokenIds in browser localStorage
2. Check local list before blockchain
3. Button to batch-mark on-chain later
4. Hybrid approach

**Pros:**

```
✅ Instant verification (no wait)
✅ No gas per entry
✅ Works offline
✅ Can mark all at once later
```

**Cons:**

```
⚠️ Not synchronized across devices
⚠️ Can be cleared/bypassed
⚠️ Different scanners don't know about each other
⚠️ Not secure until marked on-chain
```

---

### **Option 3: Hybrid (Best of Both)**

**Implementation:**

1. Mark locally immediately (instant feedback)
2. Queue blockchain transaction
3. Process in background
4. Fallback if transaction fails

**Pros:**

```
✅ Instant UX (local mark)
✅ Secure eventually (blockchain)
✅ Best user experience
✅ Failsafe mechanisms
```

**Cons:**

```
⚠️ More complex implementation
⚠️ Still requires gas
⚠️ Needs error handling
```

---

## 🎯 Recommended Implementation: Option 1 (On-Chain)

### **Why On-Chain is Best:**

1. **Security First**: This is a ticketing system - fraud prevention is critical
2. **Trust**: Organizers need provable entry records
3. **Auditability**: Blockchain provides immutable log
4. **Multi-Device**: Multiple scanners can work simultaneously
5. **Gas Cost**: Acceptable cost for event organizers (part of business)

---

## 🔧 Implementation Plan

### **Phase 1: Smart Contract Updates**

#### **A. Update TicketNFT.sol**

Add new function accessible to event organizers:

```solidity
/**
 * @notice Mark ticket as used by event organizer
 * @dev Can only be called by the organizer of the ticket's event
 * @param tokenId Token ID to mark as used
 */
function markTicketAsUsedByOrganizer(uint256 tokenId) external {
    if (_ownerOf(tokenId) == address(0)) revert TokenNonexistent();

    TicketMetadata storage meta = ticketDetails[tokenId];
    if (meta.used) revert TicketUsed();

    // Verify caller is the event organizer
    require(
        ITicketFactory(factory).isEventOrganizer(meta.eventId, msg.sender),
        "Not event organizer"
    );

    meta.used = true;
    emit TicketMarkedAsUsed(tokenId, msg.sender, block.timestamp);
}

event TicketMarkedAsUsed(
    uint256 indexed tokenId,
    address indexed markedBy,
    uint256 timestamp
);
```

#### **B. Update TicketFactory.sol**

Add public organizer check function:

```solidity
/**
 * @notice Check if address is organizer of event
 * @param eventId Event ID
 * @param addr Address to check
 * @return bool True if organizer
 */
function isEventOrganizer(uint256 eventId, address addr)
    external
    view
    returns (bool)
{
    return events[eventId].organizer == addr;
}
```

---

### **Phase 2: Frontend Integration**

#### **A. Add markTicketAsUsed Hook**

Create `useMarkTicketAsUsed.ts`:

```typescript
export function useMarkTicketAsUsed() {
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  const markAsUsed = (tokenId: bigint) => {
    writeContract({
      address: TICKET_NFT_ADDRESS,
      abi: TicketNFTABI,
      functionName: "markTicketAsUsedByOrganizer",
      args: [tokenId],
    });
  };

  return {
    markAsUsed,
    isMarking: isPending,
    isMarked: isSuccess,
    error,
  };
}
```

#### **B. Update VerificationResultModal**

Add "Mark as Used" action:

```tsx
// After successful verification
const { markAsUsed, isMarking, isMarked } = useMarkTicketAsUsed();

const handleGrantEntry = async () => {
  if (status === "success" && data) {
    // Mark ticket as used
    await markAsUsed(data.tokenId);

    // Wait for confirmation
    if (isMarked) {
      // Show success toast
      toast.success("Ticket marked as used - Entry granted");
      onClose();
    }
  }
};

// Update button
<button onClick={handleGrantEntry} disabled={isMarking}>
  {isMarking ? "Marking as Used..." : "Grant Entry & Mark Used"}
</button>;
```

#### **C. Update Verification Flow**

```tsx
// OrganizerVerificationPage.tsx

const [pendingMarkTokenId, setPendingMarkTokenId] = useState<bigint | null>(
  null
);

const handleGrantEntry = (tokenId: bigint) => {
  setPendingMarkTokenId(tokenId);
  // Trigger mark transaction
};

// Show confirmation UI while transaction processes
{
  pendingMarkTokenId && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500" />
        <p>Marking ticket as used...</p>
        <p className="text-sm">Please wait for blockchain confirmation</p>
      </div>
    </div>
  );
}
```

---

### **Phase 3: User Experience Flow**

#### **New Verification Flow:**

```
1. Scan QR Code
   ↓
2. Show "Verifying..." spinner
   ↓
3. Query blockchain:
   - Is ticket valid?
   - Is ticket already used? ← EXISTING CHECK
   - Is scanner the organizer?
   ↓
4. Show Verification Modal:
   ✅ Success → Shows "Grant Entry & Mark Used" button
   ❌ Already Used → Shows "Already Used" (no button)
   ❌ Unauthorized → Shows "Not Organizer" (no button)
   ↓
5. Organizer clicks "Grant Entry & Mark Used"
   ↓
6. Show "Marking..." spinner overlay
   ↓
7. Execute blockchain transaction:
   - markTicketAsUsedByOrganizer(tokenId)
   ↓
8. Transaction confirms (1-2 seconds)
   ↓
9. Show success message:
   "✅ Entry granted - Ticket marked as used"
   ↓
10. Modal closes
    ↓
11. Scanner ready for next ticket
```

---

### **Phase 4: Error Handling**

#### **Transaction Failures:**

```typescript
const handleGrantEntry = async () => {
  try {
    await markAsUsed(tokenId);

    // Wait for confirmation
    await waitForTransaction();

    toast.success("Entry granted - Ticket marked as used");
    onClose();
  } catch (error) {
    if (error.code === "ACTION_REJECTED") {
      toast.error("Transaction cancelled by user");
    } else if (error.message.includes("insufficient funds")) {
      toast.error("Insufficient gas - Please add funds to wallet");
    } else if (error.message.includes("Already used")) {
      toast.error("Ticket already marked as used");
    } else {
      toast.error("Failed to mark ticket - Please try again");
      console.error(error);
    }
  }
};
```

#### **Fallback Options:**

```tsx
// If transaction fails, show options
<div className="mt-4">
  <p className="text-red-600">Failed to mark ticket on blockchain</p>
  <div className="flex gap-2 mt-2">
    <button onClick={retryMark}>Retry Transaction</button>
    <button onClick={markLocally}>Mark Locally (Temporary)</button>
    <button onClick={skipAndContinue}>Skip & Continue</button>
  </div>
</div>
```

---

## 🔒 Security Enhancements

### **Additional Checks:**

#### **1. Double-Spend Prevention:**

```solidity
// In contract
if (meta.used) revert TicketUsed();
```

#### **2. Organizer Verification:**

```solidity
require(
    ITicketFactory(factory).isEventOrganizer(meta.eventId, msg.sender),
    "Not event organizer"
);
```

#### **3. Event Match:**

```typescript
// In frontend
if (ticketEventId !== scannedData.eventId) {
  return { status: "error", message: "Wrong event!" };
}
```

#### **4. Transaction Replay Protection:**

```typescript
// Check if already marked before sending transaction
const currentStatus = await contract.ticketDetails(tokenId);
if (currentStatus.used) {
  toast.error("Ticket already marked as used");
  return;
}
```

---

## 📊 Cost Analysis

### **Gas Costs (Estimated):**

```
Network: Push Chain Testnet
Base Gas: ~50,000 gas
Gas Price: ~1 gwei
Cost per mark: ~0.00005 PC (~$0.10-0.50 USD)

For 100 attendees:
Total cost: ~$10-50 USD
Acceptable for event organizers
```

### **Alternative: Batch Marking:**

```solidity
function markMultipleTicketsAsUsed(uint256[] calldata tokenIds) external {
    for (uint256 i = 0; i < tokenIds.length; i++) {
        // Mark each ticket
    }
}
```

**Pros:**

- Lower total gas (shared overhead)
- Mark 10-20 tickets in one transaction

**Cons:**

- Not real-time
- Vulnerable during batch window

---

## 🧪 Testing Scenarios

### **Scenario 1: Normal Entry (Happy Path)**

```
1. Scan ticket #123
2. Shows "Valid"
3. Click "Grant Entry & Mark Used"
4. Transaction processes (2 sec)
5. Success message
6. Scan ticket #123 again
7. Shows "Already Used" ❌
```

### **Scenario 2: Double Scan (Fraud Attempt)**

```
1. Alice scans ticket #123
2. Shows "Valid"
3. While transaction processing...
4. Bob scans same ticket #123
5. Already marked locally → Shows "Processing"
6. Transaction confirms
7. Bob's scan shows "Already Used" ❌
```

### **Scenario 3: Offline/Failed Transaction**

```
1. Scan ticket #123
2. Shows "Valid"
3. Click "Grant Entry"
4. Transaction fails (no internet)
5. Show error message
6. Options: Retry / Mark Locally / Skip
```

### **Scenario 4: Unauthorized Marker**

```
1. Non-organizer scans ticket
2. Shows "Unauthorized" (existing check)
3. No "Grant Entry" button shown
4. Cannot mark ticket
```

---

## 🎯 Rollout Plan

### **Stage 1: Contract Deployment**

1. Update TicketNFT.sol
2. Update TicketFactory.sol
3. Deploy to testnet
4. Test thoroughly
5. Deploy to mainnet

### **Stage 2: Frontend Integration**

1. Create useMarkTicketAsUsed hook
2. Update VerificationResultModal
3. Add transaction UI
4. Add error handling
5. Test end-to-end

### **Stage 3: Testing**

1. Test normal flow
2. Test double-scan prevention
3. Test error scenarios
4. Test gas costs
5. User acceptance testing

### **Stage 4: Documentation**

1. Update organizer guide
2. Add troubleshooting guide
3. Document gas requirements
4. Create training materials

---

## 📚 Alternative Approaches

### **Option A: Proof of Attendance Protocol (POAP)**

- Issue new NFT on entry
- Proves attendance
- Doesn't modify original ticket
- Requires separate contract

### **Option B: Time-Locked QR**

- QR expires after first scan
- 5-minute validity window
- Must regenerate at gate
- Poor UX but no gas cost

### **Option C: Centralized Verification DB**

- Track entries in database
- No blockchain calls
- Fast and free
- Not decentralized/trustless

---

## ✅ Recommendation

**Implement Option 1: On-Chain Marking**

**Why:**

1. **Security**: Only solution that's truly secure
2. **Auditability**: Blockchain provides proof
3. **Scalability**: Works with multiple scanners
4. **Trust**: Decentralized verification
5. **Cost**: Acceptable for events ($10-50 per event)

**Next Steps:**

1. ✅ Get user approval on approach
2. ⏳ Update smart contracts
3. ⏳ Deploy to testnet
4. ⏳ Update frontend
5. ⏳ Comprehensive testing
6. ⏳ Deploy to mainnet

---

**Status:** PROPOSED - Awaiting Approval  
**Priority:** CRITICAL SECURITY FIX  
**Estimated Time:** 2-4 hours implementation  
**Risk Level:** Medium (requires contract changes)

---

**Last Updated:** October 18, 2025  
**Proposed By:** GitHub Copilot  
**Project:** Universal Event Ticketing - Security Enhancement
