# 🔧 Pinata 403 Error Troubleshooting

## 🔍 **Common Causes of 403 Errors**

### **1. API Key Permissions**
- ❌ **Missing permissions** for `pinFileToIPFS` or `pinJSONToIPFS`
- ❌ **Wrong API key type** (using public key instead of JWT)

### **2. Authentication Issues**
- ❌ **Invalid JWT token** (expired, malformed, or wrong)
- ❌ **Missing Bearer prefix** in Authorization header
- ❌ **Environment variable not loaded** properly

### **3. Account Issues**
- ❌ **Account not verified** (email verification required)
- ❌ **Free tier limits exceeded** (1GB storage, 1000 pins)
- ❌ **Account suspended** or restricted

---

## 🧪 **Step-by-Step Debugging**

### **Step 1: Check Environment Variable**
```bash
# In your .env file, make sure you have:
VITE_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Check if it's loaded (in browser console):
console.log(import.meta.env.VITE_PINATA_JWT);
```

### **Step 2: Verify JWT Format**
Your JWT should:
- ✅ Start with `eyJ`
- ✅ Be very long (usually 200+ characters)
- ✅ Have 3 parts separated by dots (header.payload.signature)

### **Step 3: Check API Key Permissions**
In Pinata dashboard:
1. Go to **API Keys**
2. Click on your key
3. Verify permissions:
   - ✅ `pinFileToIPFS` 
   - ✅ `pinJSONToIPFS`
   - ✅ `pinList` (optional)

### **Step 4: Test with cURL**
```bash
# Test your JWT with a simple request
curl -X GET "https://api.pinata.cloud/data/testAuthentication" \
  -H "Authorization: Bearer YOUR_JWT_HERE"
```

**Expected response:** `{"message": "Congratulations! You are authenticated with Pinata!"}`

---

## 🔧 **Common Fixes**

### **Fix 1: Regenerate API Key**
1. Go to [Pinata Dashboard](https://app.pinata.cloud)
2. **Delete** the current API key
3. **Create new key** with proper permissions:
   - Name: "TicketChain Development"
   - Permissions: `pinFileToIPFS`, `pinJSONToIPFS`
4. **Copy the new JWT**
5. **Update .env file**
6. **Restart dev server**

### **Fix 2: Check Account Status**
1. Go to [Pinata Dashboard](https://app.pinata.cloud)
2. Check **Account** section
3. Verify:
   - ✅ Email is verified
   - ✅ Account is active
   - ✅ Not over free tier limits

### **Fix 3: Verify Environment Loading**
```typescript
// Add this to your component to debug
console.log("Environment check:", {
  hasJWT: !!import.meta.env.VITE_PINATA_JWT,
  jwtLength: import.meta.env.VITE_PINATA_JWT?.length,
  jwtStart: import.meta.env.VITE_PINATA_JWT?.substring(0, 10)
});
```

---

## 🧪 **Test the Fix**

### **1. Try Uploading an Image**
- Go to create event page
- Upload an image
- Check browser console for detailed error logs

### **2. Check Console Logs**
Look for these messages:
```javascript
// Good - should see this
IPFS upload successful: { IpfsHash: "Qm..." }

// Bad - will see this with details
Pinata API Error: {
  status: 403,
  statusText: "Forbidden", 
  error: "Invalid API key",
  hasJWT: true,
  jwtLength: 245
}
```

### **3. Verify Hash Length**
- ✅ **Good**: `QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (46 chars)
- ❌ **Bad**: `Qmfrtt8mmlnxa` (15 chars - still using placeholder)

---

## 🚨 **Emergency Fallback**

If Pinata continues to fail, you can temporarily use a different IPFS service:

### **Option 1: Use IPFS.io**
```typescript
// Update ipfs.ts
const PINATA_API_URL = "https://api.ipfs.io/api/v0";
const PINATA_GATEWAY = "https://ipfs.io/ipfs/";
```

### **Option 2: Use Web3.Storage**
```typescript
// Alternative service - requires different setup
// See: https://web3.storage/
```

### **Option 3: Local IPFS Node**
```bash
# Install IPFS locally
npm install -g ipfs
ipfs init
ipfs daemon
```

---

## 📋 **Checklist**

- [ ] JWT starts with `eyJ`
- [ ] JWT is 200+ characters long
- [ ] API key has `pinFileToIPFS` permission
- [ ] API key has `pinJSONToIPFS` permission
- [ ] Account email is verified
- [ ] Not over free tier limits
- [ ] Environment variable is loaded
- [ ] Dev server restarted after .env change
- [ ] No typos in JWT token

---

## 🎯 **Next Steps**

1. **Try uploading an image** and check console logs
2. **Share the detailed error message** from console
3. **Verify your API key permissions** in Pinata dashboard
4. **Test with cURL** to isolate the issue

The enhanced error logging will now show exactly what's wrong with the 403 error! 🔍
