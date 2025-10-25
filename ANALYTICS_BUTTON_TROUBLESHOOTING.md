# 🔍 Analytics Button Not Showing - Troubleshooting Guide

## Why You Can't See the Analytics Button

The "Event Analytics" button is **intentionally hidden** for non-organizers. It only appears when:

### ✅ **Required Conditions:**

1. **You must be the event organizer**
   - Your wallet address must match the event creator's address
   
2. **Your wallet must be connected**
   - Check if you see your address in the top-right corner
   
3. **You must be on the Event Detail Page**
   - Not the Events list, but the individual event page

---

## 🔍 Step-by-Step Debugging

### **Step 1: Verify You're Connected**

**Check:**
- Look at the top-right of the page
- You should see a wallet address or "Connect Wallet" button
- If you see "Connect Wallet", click it and connect

**How to Connect:**
```
1. Click "Connect Wallet" button (top-right)
2. Choose your wallet provider
3. Approve the connection
4. Your address should appear
```

---

### **Step 2: Check Which Event You're Viewing**

**The button ONLY shows on events YOU created.**

**Check:**
1. Go to "Events" page
2. Look for events where YOU are the organizer
3. If you haven't created any events yet, you won't see the button anywhere

**Test:**
- Try creating a test event first
- Then view that event
- You should see the analytics button

---

### **Step 3: Verify Organizer Address**

**Debug Information to Check:**

Open browser console (F12) and look for:
```javascript
// The page logs:
"origin account: 0xYourAddress"
"resolved push account: 0xYourPushAddress"
```

**Check Event Organizer:**
1. On the event page, the organizer address is stored
2. Your address must match EXACTLY (case-insensitive)

**Two Addresses Checked:**
- Your wallet address (EVM address)
- Your Push Universal Account address

**Either one matching the organizer = button appears**

---

## 🧪 Quick Test: Create Your Own Event

**To see the analytics button immediately:**

### **1. Create a Test Event**

```
1. Click "Create Event" in navigation
2. Fill in the form:
   - Event Name: "Test Event"
   - Description: "Testing analytics"
   - Venue: "Test Venue"
   - Start Date: Today or tomorrow
   - End Date: One day after start
   - Image: Any image file
   - Total Supply: 10
   - Royalty: 2.5% (default is fine)

3. Add a ticket type:
   - Name: "General"
   - Price: 0.001 (in PC)
   - Supply: 10
   - Image: Any image

4. Click "Create Event"
5. Wait for transaction to confirm
```

### **2. Navigate to Your Event**

```
1. Go to "Events" page
2. Find your newly created event
3. Click on it
4. Look in the right sidebar (desktop) or scroll down (mobile)
5. You should NOW see "Event Analytics" button
```

---

## 🖥️ Where Exactly is the Button?

### **Desktop View:**

```
┌─────────────────────────────────────────────┐
│  Event Detail Page                          │
├──────────────────┬──────────────────────────┤
│                  │                          │
│  Event Image     │  Right Sidebar          │
│  & Details       │                          │
│                  │  ┌──────────────────┐   │
│                  │  │ 📊 Event         │   │ ← HERE!
│                  │  │  Analytics       │   │
│                  │  └──────────────────┘   │
│                  │                          │
│                  │  Event Info              │
│                  │  - Organizer             │
│                  │  - Date                  │
│                  │  - Tickets Sold          │
└──────────────────┴──────────────────────────┘
```

### **Mobile View:**

```
┌────────────────────────┐
│  Event Image           │
│  & Name                │
├────────────────────────┤
│  Event Details         │
│  - Date, Venue, etc.   │
├────────────────────────┤
│  ┌──────────────────┐ │
│  │ 📊 Event         │ │ ← Scroll down to see
│  │  Analytics       │ │
│  └──────────────────┘ │
├────────────────────────┤
│  Ticket Selection      │
│  ...                   │
└────────────────────────┘
```

**Button Appearance:**
- Text: "Event Analytics"
- Icon: 📊 Bar chart
- Style: Rounded border button
- Color: Matches theme (light/dark)

---

## 🎯 Common Issues & Solutions

### **Issue 1: "I created an event but still don't see the button"**

**Possible Causes:**
1. Wrong wallet connected
2. Page not refreshed after event creation
3. Universal Account mismatch

**Solutions:**
```
✓ Disconnect and reconnect your wallet
✓ Refresh the page (F5)
✓ Clear browser cache
✓ Check you're using the SAME wallet that created the event
```

---

### **Issue 2: "I'm viewing someone else's event"**

**Expected Behavior:**
- You will NOT see the analytics button
- This is intentional for privacy
- Only organizers see their analytics

**Solution:**
- Create your own event to see analytics
- Or ask the event organizer to share analytics

---

### **Issue 3: "Button was there, now it's gone"**

**Possible Causes:**
1. Wallet disconnected
2. Switched to a different wallet
3. Viewing a different event

**Solutions:**
```
✓ Reconnect your wallet
✓ Verify you're on YOUR event page
✓ Check wallet address matches organizer
```

---

### **Issue 4: "I'm using Push Universal Account"**

**Special Note:**
The system checks BOTH addresses:
- Your origin wallet address (EVM)
- Your Push Universal Account address

**How it works:**
```javascript
isOrganizer = 
  organizer.toLowerCase() === walletAddress?.toLowerCase() ||
  organizer.toLowerCase() === universalAccount?.address?.toLowerCase()
```

**If you purchased from Solana or another chain:**
- Your UEA (Universal Executor Account) is used
- The event organizer is set as your UEA
- Button should still appear when you connect

---

## 🛠️ Developer Debug Mode

**To see exactly what's happening:**

### **Open Browser Console (F12)**

**Check these values:**
```javascript
// In console, type:
console.log({
  walletAddress: "Your connected address",
  universalAccount: "Your Push account",
  eventOrganizer: "Event organizer from contract"
});
```

**Look for log messages like:**
```
"origin account: 0xYourAddress"
"resolved push account: 0xYourPushAddress"
```

**Match Check:**
- Does either address match the event organizer?
- Addresses are case-insensitive
- Both must be checksummed Ethereum addresses

---

## 📝 Manual Analytics Access

**If you know your event ID, access directly:**

### **URL Format:**
```
https://your-app.com/event-analytics/{eventId}
```

### **Examples:**
```
Event ID 1: /event-analytics/1
Event ID 5: /event-analytics/5
Event ID 12: /event-analytics/12
```

### **How to Find Your Event ID:**
1. Look in the URL when viewing your event
2. Example: `/events/3` means event ID is 3
3. Then go to: `/event-analytics/3`

**Note:** You can access this URL directly, BUT:
- You'll still need to be the organizer
- Page will show "Access Denied" if you're not
- Analytics data won't load for non-organizers

---

## ✅ Verification Checklist

Use this checklist to verify everything:

### **Before Viewing Analytics:**

- [ ] Wallet is connected
- [ ] I created this event (I'm the organizer)
- [ ] I'm on the Event Detail Page (not the list)
- [ ] Page has fully loaded
- [ ] No console errors (F12 to check)

### **Expected to See:**

- [ ] Event image and details
- [ ] Ticket selection options
- [ ] Right sidebar with event info
- [ ] **"Event Analytics" button** in sidebar (if organizer)

### **If Button Still Not Visible:**

- [ ] Try creating a new test event
- [ ] Verify with browser console (F12)
- [ ] Check network connection
- [ ] Try different browser
- [ ] Clear cache and reload

---

## 🎓 Understanding the Code

**How the button visibility works:**

```typescript
// 1. Get event organizer from contract
const event = await contract.getEvent(eventId);
const organizer = event.organizer;

// 2. Get connected wallet addresses
const walletAddress = useAccount(); // EVM address
const universalAccount = usePushWalletContext(); // Push account

// 3. Check if user is organizer
const isOrganizer = 
  organizer.toLowerCase() === walletAddress?.toLowerCase() ||
  organizer.toLowerCase() === universalAccount?.address?.toLowerCase();

// 4. Conditionally render button
{isOrganizer && (
  <Link to="/event-analytics/${eventId}">
    Event Analytics
  </Link>
)}
```

**Why it's hidden:**
- Privacy: Only organizers should see their analytics
- Security: Prevents unauthorized access to event data
- UX: Cleaner interface for regular users

---

## 🚀 Quick Start Guide

**Never created an event? Follow this:**

### **Step 1: Get Test Tokens**
1. Visit [Push Chain Faucet](https://donut.push.network/)
2. Request test PC tokens
3. Wait for tokens to arrive

### **Step 2: Create Your First Event**
1. Go to "Create Event"
2. Fill in all required fields
3. Set royalty to 2.5% (or your preference)
4. Add at least one ticket type
5. Submit transaction

### **Step 3: View Your Event**
1. Go to "Events"
2. Click on your new event
3. **Look for the "Event Analytics" button**
4. It should now be visible!

### **Step 4: Access Analytics**
1. Click "Event Analytics" button
2. View your comprehensive dashboard
3. See royalty tracking and all metrics

---

## 📞 Still Having Issues?

### **Try This:**

1. **Screenshot Test:**
   - Take screenshot of event page
   - Check if you see organizer info
   - Verify wallet address in top-right

2. **Console Log Test:**
   - Open console (F12)
   - Look for any red errors
   - Share errors for debugging

3. **Browser Test:**
   - Try different browser
   - Disable extensions
   - Use incognito mode

4. **Wallet Test:**
   - Disconnect wallet
   - Reconnect wallet
   - Refresh page

---

## 💡 Key Takeaways

1. **Analytics button = Organizers ONLY**
2. **Must match wallet address to event creator**
3. **Create your own event to test**
4. **Button location: Right sidebar on event detail page**
5. **Can access directly via URL if you know event ID**

---

## 🎯 Expected Behavior Summary

| Scenario | Analytics Button Visible? |
|----------|---------------------------|
| I created the event | ✅ YES |
| Someone else created the event | ❌ NO |
| I'm not connected | ❌ NO |
| Wrong wallet connected | ❌ NO |
| On events list page | ❌ NO (must be on detail page) |
| On event detail page (my event) | ✅ YES |

---

**Remember:** The analytics button is a **privacy feature**, not a bug. It only shows for event organizers to protect sensitive business data.

If you've created an event and still can't see it, please share:
1. Your wallet address
2. Event ID you're viewing
3. Any console errors
4. Screenshot of the event page

We'll help you debug further!

