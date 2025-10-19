# Quick Test Guide: Ticket Reuse Prevention 🧪

**Test Focus:** Verify tickets cannot be reused after being marked as used  
**Duration:** ~10 minutes  
**Prerequisites:** Dev server running, wallet connected, test event with tickets

---

## 🎯 Critical Test: Prevent Duplicate Entry

### **Scenario: Alice tries to let Bob use her ticket**

#### **Setup (2 min):**

```bash
# 1. Start dev server
cd frontend/ticketchain
npm run dev

# 2. Open browser to http://localhost:5175
# 3. Connect wallet A (organizer)
# 4. Create test event "Test Concert"
# 5. Add ticket type "General" - Price: 0.001 - Supply: 10
```

#### **Test Steps:**

**Phase 1: Alice Gets Ticket**

```
1. Switch to wallet B (Alice)
2. Browse events → Find "Test Concert"
3. Buy 1 ticket (will be ticket #1)
4. Wait for transaction confirmation
5. Go to "My Tickets" page
6. Verify ticket appears
7. Click "View QR Code"
8. SCREENSHOT THE QR CODE (save as alice_ticket.png)
```

**Phase 2: Alice Gets Verified & Enters**

```
9. Switch back to wallet A (organizer)
10. Go to "Organizer Verification" page
11. Click "Start Scanning"
12. Display alice_ticket.png to camera OR
    Click "Enter Code Manually" and paste QR data
13. ✅ Should show: "VERIFIED" (green modal)
14. Verify all checks are green:
    - ✅ Authorized Organizer
    - ✅ Ticket Unused
    - ✅ Valid Owner
15. Click "Grant Entry & Mark as Used" button
16. Approve MetaMask transaction
17. Watch loading: "Marking as Used..." 🔄
18. Wait 1-3 seconds for confirmation
19. ✅ Should show: "Entry Granted - Ticket Marked as Used"
20. Click "Close & Continue"
```

**Phase 3: Bob Tries to Use Same Ticket (FRAUD ATTEMPT) 🚨**

```
21. Still on wallet A (organizer)
22. Still on "Organizer Verification" page
23. Scan alice_ticket.png AGAIN
    (This simulates Bob showing Alice's QR)
24. ❌ Should show: "TICKET ALREADY USED" (red modal)
25. Verify ticket status check is red:
    - ❌ Ticket Status: "Ticket has already been used"
26. Button should say: "Deny Entry & Continue"
27. NO "Grant Entry" option available
```

**Expected Result:** 🎉

```
✅ Bob is DENIED entry
✅ System detected the ticket was already used
✅ Blockchain state prevented fraud
✅ Alice cannot share her ticket
✅ SECURITY FIX WORKING!
```

---

## 🧪 Additional Quick Tests

### **Test 2: Transaction Cancellation**

```
1. Get a new unused ticket
2. Scan and verify successfully
3. Click "Grant Entry & Mark as Used"
4. REJECT the MetaMask transaction
5. ❌ Should show error: "Transaction cancelled by user"
6. Modal should stay open
7. Ticket should remain unmarked
8. Can close modal and try again
9. Scanning same ticket again should still show "Verified" (not marked yet)
```

---

### **Test 3: Multiple Scanners**

**Requires:** Two browser windows or devices

```
Window 1 (Scanner A):
1. Connect as organizer
2. Go to Organizer Verification
3. Start scanning

Window 2 (Scanner B):
4. Open same app, connect same organizer wallet
5. Go to Organizer Verification
6. Start scanning

Test Flow:
7. In Window 1: Scan ticket #2
8. Mark as used
9. In Window 2: Try to scan same ticket #2
10. ✅ Should show "Already Used" (blockchain sync!)
```

---

### **Test 4: Wrong Organizer**

```
1. Create event with wallet A
2. Buy ticket for that event
3. Switch to wallet C (different address)
4. Go to Organizer Verification page
5. Try to scan the ticket
6. ❌ Should show: "UNAUTHORIZED ORGANIZER"
7. NO "Grant Entry" button available
8. Cannot mark ticket as used
```

---

## ✅ Success Checklist

After testing, verify:

- [ ] Valid tickets can be verified
- [ ] "Grant Entry & Mark as Used" button works
- [ ] Transaction submits and confirms (~1-3 sec)
- [ ] Success message shows after confirmation
- [ ] **Re-scanning same ticket shows "Already Used"** ← CRITICAL
- [ ] Multiple scanners see updated state
- [ ] Cancelled transactions don't mark tickets
- [ ] Wrong organizer cannot mark tickets
- [ ] Error messages are clear and helpful
- [ ] Loading states show during transactions
- [ ] Modal cannot be closed during marking

---

## 🔍 What to Look For

### **Good Signs:** ✅

- Spinner shows during transaction
- Clear "Marking as Used..." message
- Success confirmation after ~1-3 seconds
- Re-scan immediately shows "Already Used"
- Error messages are specific and helpful

### **Bad Signs:** ❌

- Transaction hangs indefinitely
- No loading indicator
- Success message but ticket still usable
- Can close modal during marking
- Errors without explanation
- Re-scan still shows as valid (CRITICAL BUG)

---

## 🚨 If Something Goes Wrong

### **Issue: Ticket still shows as valid after marking**

**Diagnosis:**

```typescript
// Check browser console for errors
// Look for transaction hash
// Verify transaction on block explorer
```

**Possible causes:**

- Transaction failed silently
- Wrong contract address
- Network issue
- Gas too low

**Solution:**

```bash
# Verify contract is deployed
npx hardhat ignition status TicketChainPhase1Oct2025 --network pushchain

# Check frontend contract address matches
grep TICKET_FACTORY_ADDRESS frontend/ticketchain/src/lib/contracts.ts

# Recompile contracts if ABI outdated
npx hardhat compile --force
```

---

### **Issue: "Insufficient funds" error**

**Solution:**

```
1. Ensure organizer wallet has gas (PC tokens)
2. Check gas balance in wallet
3. Add funds from faucet if needed
4. Retry transaction
```

---

### **Issue: Transaction pending forever**

**Solution:**

```
1. Check network status (Push Chain)
2. Open block explorer
3. Find transaction by hash
4. If stuck: Speed up or cancel in MetaMask
5. Try marking again
```

---

## 📊 Test Results Template

```
Test Date: _______________
Tester: __________________
Network: Push Chain Testnet

[ ] Test 1: Duplicate Entry Prevention
    Result: PASS / FAIL
    Notes: ___________________________

[ ] Test 2: Transaction Cancellation
    Result: PASS / FAIL
    Notes: ___________________________

[ ] Test 3: Multiple Scanners
    Result: PASS / FAIL
    Notes: ___________________________

[ ] Test 4: Wrong Organizer
    Result: PASS / FAIL
    Notes: ___________________________

Overall: PASS / FAIL

Issues Found:
_____________________________________
_____________________________________

Recommendations:
_____________________________________
_____________________________________
```

---

## 🎓 Understanding the Fix

**Before Fix:**

```
Scan Ticket → Verify → Show "Valid" → Grant Entry
             ↓
    (Nothing on blockchain)
             ↓
Scan Again → Verify → Show "Valid" ← PROBLEM!
```

**After Fix:**

```
Scan Ticket → Verify → Show "Valid" → Grant Entry → Mark Used (Blockchain)
                                                            ↓
                                                     ticket.used = true
                                                            ↓
Scan Again → Verify → Check used → Show "Already Used" ← FIXED!
```

**Key:** The blockchain transaction makes the "used" state permanent and synchronized across all devices.

---

## 🎉 Success Criteria

**The fix is working if:**

1. ✅ You can mark a ticket as used
2. ✅ Transaction confirms on blockchain
3. ✅ **Re-scanning immediately shows "Already Used"**
4. ✅ Different wallets/devices see the update
5. ✅ No way to bypass the "used" state

**If all 5 are true: SECURITY FIX SUCCESSFUL!** 🎊

---

**Test Duration:** ~10 minutes  
**Critical Test:** Duplicate Entry Prevention  
**Success Rate Required:** 100% (security critical)

**Happy Testing!** 🧪✨
