# 📍 Where to Find Analytics in TicketChain

## Quick Answer

**The "Event Analytics" button is located on the Event Detail Page, visible ONLY to event organizers.**

---

## Step-by-Step Guide

### 1️⃣ **Navigate to Your Event**

```
Home → Events → Click on Your Event
```

### 2️⃣ **Look for the Analytics Button**

On the **Event Detail Page**, you'll see:

- **Location**: Right sidebar (desktop) or bottom section (mobile)
- **Button Label**: "Event Analytics" with a bar chart icon (📊)
- **Appearance**: Rounded button with border
- **Visibility**: **Only visible if you're the event organizer**

### 3️⃣ **Click to Open Analytics**

Clicking the button takes you to:
```
/event-analytics/{eventId}
```

---

## Visual Location

```
┌─────────────────────────────────────────────┐
│  Event Detail Page                          │
├─────────────────────────────────────────────┤
│                                             │
│  Event Name & Details                       │
│  ┌──────────────┐   ┌──────────────────┐  │
│  │              │   │  ▶ Choose Tier   │  │
│  │ Event Image  │   │                  │  │
│  │              │   │  [Ticket Options]│  │
│  │              │   │                  │  │
│  └──────────────┘   │  ┌──────────────┐│  │
│                     │  │ 📊 Event     ││  │ ← HERE!
│  Description        │  │  Analytics   ││  │
│  ...                │  └──────────────┘│  │
│                     │                  │  │
│                     │  Event Info      │  │
│                     └──────────────────┘  │
│                                             │
│  Available Tickets                          │
│  [Ticket Types List]                        │
│                                             │
│  Secondary Market                           │
│  [Resale Listings]                          │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Important Notes

### ✅ **You WILL See the Button If:**
- You created the event (you're the organizer)
- Your connected wallet matches the event organizer's address
- You're on the event detail page

### ❌ **You WON'T See the Button If:**
- You're not the event organizer
- You're viewing someone else's event
- Your wallet isn't connected

---

## Alternative Access Methods

### **Method 1: Direct URL** (If you know your event ID)

```
https://your-app.com/event-analytics/1
```

Replace `1` with your actual event ID.

### **Method 2: From Homepage** (Demo Link)

There's a demo link on the homepage:
- "View Live Analytics" button
- Links to `/event-analytics/1` (demo event)

---

## What You'll See in Analytics

Once you click the button, you'll see:

### 📊 **Main Dashboard**
- Total Sold & Capacity
- Sell Rate
- Primary Revenue
- Attendance Rate

### 💰 **Royalty Revenue Section** (NEW!)
- **Total Earned**: Your royalty income from resales
- **Royalty Rate**: Your set percentage (e.g., 2.5%)
- **Market Volume**: Total secondary sales value

### 🎫 **Ticket Performance**
- Sales by tier (VIP, General, etc.)
- Revenue breakdown
- Sell rate per tier

### 🏪 **Secondary Market**
- Active listings
- Resale prices (low/avg/high)
- Number of resold tickets
- **Your royalty earnings** ✨

### 👥 **Attendance Tracking**
- Tickets scanned
- Scan rate %
- No-show rate

---

## Mobile View

On mobile devices:
- Scroll down on the event page
- Analytics button appears below ticket selection
- Full analytics dashboard is mobile-responsive

---

## Troubleshooting

### "I can't find the Analytics button"

**Check:**
1. ✓ Are you connected with the wallet that created the event?
2. ✓ Are you on the correct event page?
3. ✓ Did you create this event, or is it someone else's?

**Solution:**
- Only event organizers see this button
- Try connecting with the correct wallet
- Or create your own test event to see analytics

### "Button appears but leads to error"

**Possible causes:**
- Event ID is invalid
- Network connection issue
- You're not actually the organizer (wallet mismatch)

**Solution:**
- Verify your wallet address matches event organizer
- Check browser console for errors
- Refresh the page

### "Analytics show no data"

**Normal if:**
- Event just created (no sales yet)
- No secondary market activity (no resales)
- Tickets haven't been scanned (no attendance data)

**Wait for:**
- Tickets to be sold
- Tickets to be listed for resale
- Event to happen and tickets to be scanned

---

## Code Reference

The analytics button is rendered in:
```
frontend/ticketchain/src/pages/EventDetailPage.tsx
Lines 419-426
```

Conditional rendering:
```typescript
{isOrganizer && (
  <Link to={`/event-analytics/${eventId}`} className="...">
    <BarChart3 className="h-4 w-4" />
    Event Analytics
  </Link>
)}
```

---

## Quick Test

Want to test if you can see analytics?

1. **Create a Test Event**:
   - Go to "Create Event"
   - Fill in basic details
   - Add at least one ticket type
   - Submit

2. **Navigate to Your Event**:
   - Go to "Events"
   - Click on your newly created event

3. **Look for Button**:
   - You should now see "Event Analytics" button
   - Click it to view analytics

4. **Explore Dashboard**:
   - All metrics will show zeros (no sales yet)
   - But you can see the full layout
   - Royalty section will show your set percentage

---

## Need More Help?

- **Full Guide**: See `ANALYTICS_GUIDE.md`
- **Royalty Details**: See `DEPLOYMENT_SUMMARY.md`
- **General Docs**: See `/docs` folder

---

**Quick Summary:**
> **"Event Analytics" button is on the event detail page, visible ONLY to organizers. Click it to view comprehensive analytics including your new royalty revenue tracking!**

---

**Last Updated**: October 2025  
**Feature**: Enhanced with royalty revenue tracking  
**Location**: Event Detail Page → Right Sidebar → "Event Analytics" Button

