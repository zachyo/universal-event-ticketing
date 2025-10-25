# 📊 TicketChain Analytics Guide

## Where to Find Analytics in the UI

### **Option 1: From Event Detail Page** (Recommended for Organizers)

1. **Navigate to Events**: Click "Events" in the main navigation
2. **Select Your Event**: Click on any event you've created
3. **Access Analytics**: Look for the **"View Analytics"** button with a bar chart icon (📊) in the event details section
4. **Click to Open**: This will take you to `/event-analytics/:eventId`

### **Option 2: Direct URL Access**

If you know your event ID, you can directly visit:
```
/event-analytics/{eventId}
```

**Example**: For event ID 1, go to:
```
https://your-app.com/event-analytics/1
```

### **Option 3: From Organizer Dashboard** (Future Feature)

- A dedicated organizer dashboard showing all your events with quick access to analytics
- Currently in development

---

## Analytics Dashboard Overview

Once you open the analytics page, you'll see comprehensive metrics organized into sections:

### 📈 **1. Overview Stats** (Top Row)

Four key metrics displayed as cards:

- **Total Sold**: Number of tickets sold vs total capacity
- **Sell Rate**: Percentage of tickets sold + remaining tickets
- **Total Revenue**: Primary sales revenue in PC tokens
- **Attendance**: Scan rate + number of tickets scanned

### 🎫 **2. Ticket Type Performance** (Table)

Detailed breakdown by tier (VIP, General, etc.):
- Tier name
- Sold vs Supply
- Revenue per tier
- Sell rate percentage

### 💰 **3. Revenue Chart** (Left Column)

Visual pie or bar chart showing:
- Revenue distribution across ticket tiers
- Helps identify which ticket types generate most revenue

### 🏪 **4. Secondary Market Stats** (Right Column)

**NEW! Enhanced Royalty Tracking:**

#### **Market Activity:**
- **Active Listings**: Current tickets available for resale
- **Resold Tickets**: Number of completed secondary sales

#### **Current Prices:**
- **Lowest**: Cheapest resale ticket
- **Average**: Mean resale price
- **Highest**: Most expensive resale ticket

#### **🎉 Your Royalty Earnings** (NEW!)
Three key royalty metrics:

1. **Total Earned**
   - Total royalty revenue from all secondary sales
   - Displayed in PC tokens
   - Automatically paid to you on every resale

2. **Royalty Rate**
   - Your configured percentage (e.g., 2.5%)
   - Set during event creation
   - Can be 0% to 10%

3. **Market Volume**
   - Total value of all secondary sales
   - Shows the secondary market size
   - Your royalties are a % of this amount

#### **💡 About Royalties Info Box:**
- Explains how royalties work
- Shows your current royalty percentage
- Notes on EIP-2981 enforcement

### 👥 **5. Attendance Tracker** (Bottom)

Real-time attendance monitoring:
- Tickets scanned vs total sold
- Scan rate percentage
- No-show rate
- Visual progress indicator

---

## 🎯 Royalty Feature Details

### **What Are Royalties?**

Royalties are automatic payments you (the event organizer) receive every time someone resells a ticket on the secondary marketplace.

### **How It Works:**

1. **Set During Event Creation**
   - When creating an event, you set a royalty percentage (0-10%)
   - Default is 2.5%
   - This applies to ALL tickets for that event

2. **Automatic Enforcement**
   - Powered by EIP-2981 (NFT Royalty Standard)
   - Smart contract automatically splits payments
   - No manual intervention needed

3. **Payment Flow on Resale:**
   ```
   Buyer pays 10 PC for resale ticket
   ↓
   Marketplace Contract
   ↓
   ├─→ You (Organizer): 0.25 PC (2.5% royalty)
   └─→ Seller: 9.75 PC (97.5%)
   ```

4. **Tracked in Analytics**
   - Real-time royalty revenue tracking
   - Calculated from completed secondary sales
   - Formula: `Total Royalty = Secondary Volume × Royalty %`

### **Royalty Calculation Example:**

**Event Settings:**
- Royalty: 5% (500 basis points)
- 10 tickets sold on secondary market
- Average resale price: 2 PC

**Your Royalty Revenue:**
```
Secondary Volume = 10 tickets × 2 PC = 20 PC
Your Royalty = 20 PC × 5% = 1 PC
```

---

## 📱 How to Access Analytics (Step-by-Step)

### **For Event Organizers:**

#### **Desktop:**

1. Open TicketChain app
2. Connect your wallet (same wallet used to create event)
3. Click **"Events"** in top navigation
4. Find your event in the list
5. Click on the event card
6. Scroll to event details section
7. Click **"View Analytics"** button (📊 icon)

#### **Mobile:**

1. Open TicketChain app on mobile
2. Tap menu (☰) or navigate to "Events"
3. Tap your event
4. Scroll down to find "View Analytics" button
5. Tap to open full analytics dashboard

### **For Testing:**

If you want to see analytics without creating an event:

1. Note the event ID from any existing event
2. Manually navigate to: `/event-analytics/{eventId}`
3. You'll see analytics (note: you need to be the organizer to withdraw funds)

---

## 🔍 What Each Metric Means

### **Primary Revenue**
- Total income from direct ticket sales
- Calculated: `Sum of (ticket price × tickets sold)` for all tiers
- This is your main revenue stream

### **Secondary Volume**
- Total value of all resale transactions
- Shows market demand for your event
- Higher volume = more popular event

### **Royalty Revenue**
- Your passive income from resales
- Automatically deposited to your wallet
- Compounds over time as tickets are resold

### **Sell Rate**
- Percentage of total capacity sold
- Key metric for event success
- 100% = sold out event

### **Scan Rate**
- Percentage of ticket holders who actually attended
- Helps measure no-show rates
- Useful for capacity planning

---

## 🚀 Tips for Maximizing Royalty Revenue

1. **Set Competitive Royalties**
   - Too high (>10%): May discourage resales
   - Too low (<1%): Minimal benefit to you
   - Sweet spot: 2.5% - 5%

2. **Create Scarcity**
   - Limited ticket supply increases demand
   - Higher demand = more secondary sales
   - More secondary sales = more royalty revenue

3. **Build Hype**
   - Popular events drive secondary market activity
   - More resales = more royalty income
   - Quality events naturally generate royalties

4. **Monitor Analytics**
   - Check secondary market trends
   - Adjust future event royalty rates based on data
   - Use insights to price tickets optimally

---

## 🐛 Troubleshooting

### **"Can't see analytics button"**
- **Solution**: Ensure you're the event organizer
- **Check**: Connected wallet must match event creator address

### **"Analytics showing zero royalties"**
- **Reason**: No secondary sales yet
- **Wait**: Royalties appear after first resale
- **Note**: Primary sales don't generate royalties

### **"Secondary market stats empty"**
- **Normal**: No one has listed tickets for resale yet
- **Patience**: Activity appears when users list tickets

### **"Wrong event analytics"**
- **Check**: Event ID in URL matches your event
- **Navigate**: Use "View Analytics" button from event page

---

## 📊 Analytics Update Frequency

- **Real-time**: Ticket sales, listings, purchases
- **On-chain**: All data comes from blockchain
- **No lag**: Updates as soon as transactions confirm
- **Cache**: Some data may have 5-minute cache

---

## 🎓 Advanced: Understanding Basis Points

**Royalty is stored as basis points (bps):**

- 1 basis point = 0.01%
- 100 bps = 1%
- 250 bps = 2.5%
- 1000 bps = 10%

**Why?**
- Allows precise percentages (e.g., 2.5%)
- No decimals needed in smart contracts
- Standard practice in DeFi

**In the UI:**
- You see: "2.5%"
- Smart contract stores: 250
- Formula: `displayValue = bps / 100`

---

## 📞 Need Help?

- **Documentation**: See `/docs` folder
- **Discord**: Join community for support
- **GitHub**: Report issues or request features

---

**Last Updated**: October 2025  
**Version**: 2.0 (with enhanced royalty tracking)  
**Network**: Push Chain Testnet

