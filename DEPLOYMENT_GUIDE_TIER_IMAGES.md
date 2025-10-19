# Contract Deployment Guide - Tier Images Update

## ✅ What's Been Done

### 1. Smart Contract Updates ✅

- ✅ Updated `TicketType` struct to include `imageIpfsHash`
- ✅ Updated `TicketTypeInput` struct to include `imageIpfsHash`
- ✅ Updated `createEvent()` function to accept tier images
- ✅ Updated `addTicketType()` function to accept tier images
- ✅ Contract compiled successfully

### 2. ABI Updated ✅

- ✅ Compiled contracts with `npx hardhat compile`
- ✅ Copied updated ABI to frontend: `frontend/ticketchain/src/lib/abi/TicketFactory.json`
- ✅ TypeScript compiles with no errors

---

## 🚨 Important: Contract Needs Redeployment

**The smart contract MUST be redeployed** because we added a new field (`imageIpfsHash`) to the structs. This is a breaking change.

### Why Redeployment is Needed

The old deployed contract has this structure:

```solidity
struct TicketType {
    uint256 eventId;
    string name;
    uint256 price;
    uint256 supply;
    uint256 sold;
    // NO imageIpfsHash field!
}
```

The new contract has:

```solidity
struct TicketType {
    uint256 eventId;
    string name;
    uint256 price;
    uint256 supply;
    uint256 sold;
    string imageIpfsHash; // NEW FIELD!
}
```

**You cannot upgrade the contract on-chain** - you must deploy a new instance.

---

## 📋 Deployment Options

### Option 1: Deploy to Testnet (Recommended for Testing)

```bash
cd /home/praise/Projects/GUD/universal-event-ticketing

# Deploy to testnet
npx hardhat run scripts/deploy.js --network <testnet-name>

# Example for Sepolia:
npx hardhat run scripts/deploy.js --network sepolia
```

**After deployment**, the script will output:

```
✅ Deployment complete! Summary:
   TicketNFT:         0x...
   TicketFactory:     0x...
   TicketMarketplace: 0x...
```

**Update frontend environment variables**:

```bash
# Edit frontend/ticketchain/.env
VITE_TICKET_FACTORY_ADDRESS=0x<new_factory_address>
VITE_TICKET_NFT_ADDRESS=0x<new_nft_address>
VITE_MARKETPLACE_ADDRESS=0x<new_marketplace_address>
```

### Option 2: Deploy to Local Hardhat Network (for Quick Testing)

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

### Option 3: Deploy to Mainnet (Production)

**⚠️ Only do this after thorough testing!**

```bash
# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Update .env with production addresses
# Verify contracts on explorer
npx hardhat verify --network mainnet <address> <constructor-args>
```

---

## 🔧 What Happens During Deployment

The `scripts/deploy.js` will:

1. **Deploy TicketNFT** - The ERC-721 NFT contract for tickets
2. **Deploy TicketFactory** - The main contract with tier images support
3. **Link them together** - Set TicketFactory as the minter for TicketNFT
4. **Deploy TicketMarketplace** - The secondary market contract

All three contracts will have NEW addresses.

---

## 📝 Post-Deployment Checklist

After deploying, you need to:

### 1. Update Frontend Environment Variables

```bash
cd frontend/ticketchain

# Edit .env file
VITE_TICKET_FACTORY_ADDRESS=0x<new_address>
VITE_TICKET_NFT_ADDRESS=0x<new_address>
VITE_MARKETPLACE_ADDRESS=0x<new_address>
```

### 2. Restart Frontend Dev Server

```bash
npm run dev
```

### 3. Test the New Contract

```bash
# Test flow:
1. Create event with tier images at /create-event
2. Verify transaction succeeds
3. Check event detail page shows tier images
4. Purchase ticket
5. Verify ticket card shows tier image
```

### 4. Verify Contract on Block Explorer (Optional)

```bash
# For public networks, verify your contracts
npx hardhat verify --network <network> <address> <constructor-args>
```

---

## 🧪 Testing Without Redeployment

**If you want to test the frontend changes without deploying:**

You can test with mock data or use the existing contract for old events (without tier images). The frontend has fallback logic that will show event images if tier images aren't available.

However, **to test the full tier image functionality**, you must:

1. Deploy the new contract
2. Create a new event with tier images
3. Verify the images display correctly

---

## ⚠️ Data Migration Notes

### Old Events (on old contract)

- Events created on the old contract will NOT have tier images
- They will continue to work normally
- Users can still purchase tickets
- Tier images will fall back to event images

### New Events (on new contract)

- Must include tier images for each ticket type
- Frontend validation requires images
- IPFS upload happens before contract interaction
- Tier images stored on-chain as IPFS hashes

### Migration Strategy

If you have existing users/events:

**Option A: Fresh Start**

- Deploy new contracts
- Start fresh with no migration
- Old tickets remain on old contract
- New tickets on new contract

**Option B: Dual Operation**

- Keep old contracts running for existing tickets
- Deploy new contracts for new events
- Update frontend to support both (add contract version check)
- Gradually phase out old contracts

**Option C: Manual Migration** (Complex)

- Extract data from old contracts
- Manually create events on new contracts
- Requires custom migration script
- Risk of data loss - not recommended

---

## 🚀 Recommended Approach

For your current development stage, I recommend:

### 1. Deploy to Testnet

```bash
npx hardhat run scripts/deploy.js --network <testnet>
```

### 2. Update Frontend .env

```bash
VITE_TICKET_FACTORY_ADDRESS=0x<new_testnet_address>
VITE_TICKET_NFT_ADDRESS=0x<new_testnet_address>
VITE_MARKETPLACE_ADDRESS=0x<new_testnet_address>
```

### 3. Test Complete Flow

- Create event with 3 tiers (different images)
- Purchase tickets from each tier
- Verify images display correctly
- Check My Tickets page
- Test marketplace (if applicable)

### 4. Once Satisfied, Deploy to Mainnet

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

---

## 📊 Summary

**Status**:

- ✅ Contract code updated
- ✅ ABI updated in frontend
- ✅ TypeScript compiles successfully
- ⏳ **Contracts need redeployment**
- ⏳ Frontend .env needs updating after deployment

**Next Steps**:

1. Deploy contracts to testnet
2. Update frontend .env with new addresses
3. Test tier image functionality
4. Deploy to mainnet when ready

**Time Estimate**:

- Testnet deployment: ~5 minutes
- Testing: ~15 minutes
- Mainnet deployment: ~5 minutes

---

## 🤔 Questions?

**Q: Can I update the existing contract?**  
A: No, Solidity contracts are immutable. You must deploy a new contract.

**Q: Will old events still work?**  
A: Old events on the old contract will work, but they won't have tier images. They'll use event images as fallback.

**Q: Do I need to migrate data?**  
A: Not required. Old contract can coexist with new contract, or you can start fresh.

**Q: What if IPFS upload fails during testing?**  
A: Frontend will show error. Contract transaction won't be sent until all images upload successfully.

**Q: Can I test locally without deploying?**  
A: Yes, run `npx hardhat node` and deploy to localhost. Fast and free for testing.

---

## 🎯 Ready to Deploy?

When you're ready, run:

```bash
# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia

# Then update .env and test!
```

Good luck! 🚀
