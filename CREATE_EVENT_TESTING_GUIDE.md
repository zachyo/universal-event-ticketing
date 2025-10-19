# Create Event Page - Testing Guide

## 🧪 Quick Testing Checklist

### Prerequisites

1. Start the development server: `npm run dev` in `frontend/ticketchain`
2. Navigate to: `http://localhost:5173/create-event`
3. Connect your wallet

---

## Test 1: Character Counter ✅

**Steps**:

1. Navigate to Create Event page
2. Click on the Description field
3. Start typing text

**Expected Results**:

- ✅ Counter shows "0 / 2000 characters" initially
- ✅ Counter updates in real-time as you type
- ✅ Counter turns yellow after 1800 characters
- ✅ Cannot type beyond 2000 characters (hard limit)
- ✅ Counter is right-aligned below the textarea

**Pass/Fail**: **\_**

---

## Test 2: Auto-Calculate End Time ✅

**Steps**:

1. Scroll to "Event Schedule" section
2. Select a Start Date (e.g., tomorrow)
3. Select a Start Time (e.g., 18:00)
4. Observe the End Date and End Time fields

**Expected Results**:

- ✅ End Time auto-fills to 3 hours later (21:00 if start is 18:00)
- ✅ End Date is same as Start Date (if no midnight crossing)
- ✅ If start is 23:00, end is 02:00 next day with date incremented
- ✅ Can manually override the suggested end time

**Edge Cases**:

- Start: 10:00 → End: 13:00 ✅
- Start: 23:00 → End: 02:00 (next day) ✅
- Start: 21:30 → End: 00:30 (next day) ✅

**Pass/Fail**: **\_**

---

## Test 3: Estimated Revenue Calculator ✅

**Steps**:

1. Scroll to "Ticket Configuration" section
2. Enter Total Supply: 100
3. Add a ticket type:
   - Name: "General Admission"
   - Price: 0.01 PC
   - Supply: 100
4. Observe the green revenue banner

**Expected Results**:

- ✅ Green banner appears above "Ticket Types"
- ✅ Shows "Estimated Revenue"
- ✅ Shows "If all tickets are sold"
- ✅ Displays: "1 PC" (100 × 0.01)
- ✅ Updates immediately when you change price or supply

**Multiple Tiers Test**:

1. Add second ticket type:
   - Name: "VIP"
   - Price: 0.05 PC
   - Supply: 20
2. Revenue should show: 2 PC (100 × 0.01 + 20 × 0.05)

**Pass/Fail**: **\_**

---

## Test 4: Duplicate Ticket Type ✅

**Steps**:

1. Scroll to "Ticket Types" section
2. Fill in first ticket type:
   - Name: "VIP Gold"
   - Price: 0.1 PC
   - Supply: 50
3. Click the "Duplicate" button (blue with Copy icon)
4. Observe the new ticket type

**Expected Results**:

- ✅ New ticket type appears at bottom
- ✅ Name is "VIP Gold (Copy)"
- ✅ Price is 0.1 PC (same as original)
- ✅ Supply is 50 (same as original)
- ✅ Can edit the duplicated ticket type independently
- ✅ Can duplicate multiple times

**Mobile Test**:

- On small screens, "Duplicate" text is hidden, only icon shows ✅

**Pass/Fail**: **\_**

---

## Test 5: Draft Auto-Save ✅

**Part A: Auto-Save Functionality**

**Steps**:

1. Fill in some fields:
   - Event Name: "Test Concert"
   - Description: "Amazing live performance"
   - Venue: "Madison Square Garden"
2. Wait 30 seconds (or modify code to 5 seconds for testing)
3. Look for "Draft saved at [time]" indicator at top right

**Expected Results**:

- ✅ After 30 seconds, see "Draft saved at XX:XX:XX" with green checkmark
- ✅ Timestamp updates every 30 seconds if you continue editing
- ✅ Indicator appears below header, above form
- ✅ No indicator shows until first save completes

**Part B: Draft Load on Return**

**Steps**:

1. After auto-save completes, close the browser tab
2. Reopen `http://localhost:5173/create-event`
3. Observe the blue banner at top

**Expected Results**:

- ✅ Blue banner appears with "Continue from draft?"
- ✅ Shows "You have an unsaved event draft"
- ✅ Two buttons: "Load Draft" (blue) and "Discard" (gray)

**Part C: Load Draft**

**Steps**:

1. Click "Load Draft" button
2. Scroll through the form

**Expected Results**:

- ✅ All previously entered fields are restored
- ✅ Event Name: "Test Concert" ✅
- ✅ Description: "Amazing live performance" ✅
- ✅ Venue: "Madison Square Garden" ✅
- ✅ Ticket types are restored with correct prices/supplies
- ✅ Image preview is restored (if uploaded)
- ✅ Blue banner disappears after loading
- ✅ "Draft saved at..." indicator shows with original timestamp

**Part D: Discard Draft**

**Steps**:

1. Return to create-event page (refresh if needed to see banner)
2. Click "Discard" button
3. Observe the page

**Expected Results**:

- ✅ Blue banner disappears immediately
- ✅ Form remains empty (doesn't auto-populate)
- ✅ Can start fresh without draft interference
- ✅ Refreshing page doesn't show banner again

**Part E: Clear on Success**

**Steps**:

1. Load draft (or enter new data)
2. Fill in all required fields
3. Upload an image
4. Submit the form (create event)
5. Navigate back to create-event page

**Expected Results**:

- ✅ No draft banner appears (localStorage cleared on success)
- ✅ Form starts fresh
- ✅ No leftover data from previous event

**Pass/Fail**: **\_**

---

## Test 6: Integration Test (All Features Together) ✅

**Scenario**: Create a complete event using all new features

**Steps**:

1. Navigate to Create Event page
2. Enter Event Name: "Tech Conference 2025"
3. Enter Description: Type 50-100 words, watch character counter
4. Enter Venue: "Convention Center"
5. Select Start Date: Tomorrow
6. Select Start Time: 09:00
7. Observe End Time auto-fills to 12:00
8. Manually change End Time to 17:00 (8-hour event)
9. Upload an event image
10. Enter Total Supply: 200
11. Add first ticket type:
    - Name: "General Admission"
    - Price: 0.02 PC
    - Supply: 150
12. Observe revenue: 3 PC
13. Click "Duplicate" on General Admission
14. Edit duplicated ticket:
    - Name: "General Admission (Copy)" → "Student Discount"
    - Price: 0.01 PC
    - Supply: 50
15. Observe revenue updates to: 3.5 PC (150 × 0.02 + 50 × 0.01)
16. Wait for auto-save (30 seconds)
17. Observe "Draft saved at..." indicator
18. Refresh the page
19. See draft banner, click "Load Draft"
20. Verify all data restored correctly
21. Click "Create Event"

**Expected Results**:

- ✅ Character counter worked throughout
- ✅ End time auto-calculated correctly
- ✅ Revenue calculator updated dynamically
- ✅ Duplicate button created exact copy
- ✅ Auto-save preserved all data
- ✅ Draft loaded successfully
- ✅ Event created without errors
- ✅ Draft cleared after successful creation

**Pass/Fail**: **\_**

---

## Test 7: Edge Cases & Error Handling ✅

### Edge Case 1: Empty Form Auto-Save

**Steps**:

1. Open create-event page
2. Don't enter anything
3. Wait 30 seconds

**Expected**:

- ✅ No auto-save triggers (conditional on having data)
- ✅ No "Draft saved" indicator appears

### Edge Case 2: Image Preview in Draft

**Steps**:

1. Fill form partially
2. Upload an image
3. Wait for auto-save
4. Refresh page
5. Load draft

**Expected**:

- ✅ Image preview is restored from data URL
- ✅ Can remove restored image
- ✅ Can upload new image

### Edge Case 3: Very Large Numbers

**Steps**:

1. Set ticket supply to 999999
2. Set price to 100 PC
3. Check revenue calculator

**Expected**:

- ✅ Shows "99999900 PC" without errors
- ✅ No JavaScript overflow errors
- ✅ BigInt handles large numbers correctly

### Edge Case 4: Fractional Prices

**Steps**:

1. Set ticket price to 0.001 PC
2. Set supply to 1000
3. Check revenue

**Expected**:

- ✅ Shows "1 PC" correctly
- ✅ No precision loss

### Edge Case 5: Multiple Drafts

**Steps**:

1. Fill form, wait for auto-save
2. Refresh, load draft
3. Change data, wait for auto-save again
4. Refresh, load draft again

**Expected**:

- ✅ Latest draft overwrites previous
- ✅ Only one draft exists in localStorage
- ✅ Loads most recent data

### Edge Case 6: LocalStorage Full

**Steps**:

- This is hard to test, but code should handle gracefully
- Try/catch blocks prevent crashes

**Expected**:

- ✅ No console errors
- ✅ App continues functioning

**Pass/Fail**: **\_**

---

## Test 8: Accessibility & Responsive Design ✅

### Desktop (1920x1080)

- ✅ All features visible and functional
- ✅ Revenue banner full width
- ✅ Duplicate button shows "Duplicate" text
- ✅ Draft banner two rows: text left, buttons right

### Tablet (768px)

- ✅ Revenue banner stacks nicely
- ✅ Duplicate button still shows text
- ✅ Draft banner wraps buttons below text

### Mobile (375px)

- ✅ Revenue banner fully responsive
- ✅ Duplicate button hides text, shows only icon
- ✅ Draft banner buttons stack vertically or wrap
- ✅ Character counter doesn't overflow

### Keyboard Navigation

- ✅ Tab through all fields works
- ✅ Can activate "Load Draft" with Enter
- ✅ Can activate "Discard" with Enter
- ✅ Can activate "Duplicate" with Enter

### Screen Reader

- ✅ Button titles/tooltips present
- ✅ "Duplicate this ticket type" title on button
- ✅ "Remove this ticket type" title on button
- ✅ Form labels properly associated

**Pass/Fail**: **\_**

---

## Test 9: Performance ✅

### Auto-Save Performance

**Test**: Fill form with large description (2000 chars), 10 ticket types

**Expected**:

- ✅ Auto-save completes in < 100ms
- ✅ No UI lag or freezing
- ✅ Can continue typing during save

### Draft Load Performance

**Test**: Load draft with large data

**Expected**:

- ✅ Draft loads in < 200ms
- ✅ UI updates smoothly
- ✅ No flash of empty content

**Pass/Fail**: **\_**

---

## Test 10: Browser Compatibility ✅

Test on:

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Expected**: All features work identically across browsers

---

## 🐛 Bug Report Template

If you find issues, document them:

```
**Bug**: [Short description]
**Steps to Reproduce**:
1.
2.
3.

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: [Chrome 118, Firefox 119, etc.]
**Console Errors**: [Any error messages]
**Screenshot**: [If applicable]
```

---

## ✅ Sign-Off

**Tester Name**: ********\_********  
**Date**: ********\_********  
**Overall Pass/Fail**: ********\_********

**Notes**:

---

---

---

---

## 🚀 Production Readiness Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] No console errors
- [ ] Works on mobile devices
- [ ] Works across all major browsers
- [ ] LocalStorage limits handled gracefully
- [ ] Draft save doesn't impact performance
- [ ] User feedback collected (if possible)
- [ ] Documentation updated
- [ ] Success metrics tracking in place

**Approved for Production**: ☐ YES ☐ NO

**Reviewer**: ********\_********  
**Date**: ********\_********
