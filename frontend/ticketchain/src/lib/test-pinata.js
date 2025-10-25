// Test script to debug Pinata 403 error
// Run this in browser console to test your JWT

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_API_URL = "https://api.pinata.cloud";

console.log("🔍 Pinata Debug Info:", {
  hasJWT: !!PINATA_JWT,
  jwtLength: PINATA_JWT?.length,
  jwtStart: PINATA_JWT?.substring(0, 20),
  jwtEnd: PINATA_JWT?.substring(-20)
});

// Test 1: Authentication
async function testAuth() {
  try {
    const response = await fetch(`${PINATA_API_URL}/data/testAuthentication`, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });
    
    const result = await response.text();
    console.log("✅ Auth Test:", response.status, result);
    return response.ok;
  } catch (error) {
    console.error("❌ Auth Test Failed:", error);
    return false;
  }
}

// Test 2: Check API key permissions
async function testPermissions() {
  try {
    const response = await fetch(`${PINATA_API_URL}/data/pinList?status=pinned`, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });
    
    console.log("🔑 Permissions Test:", response.status, response.statusText);
    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Permissions Error:", error);
    }
    return response.ok;
  } catch (error) {
    console.error("❌ Permissions Test Failed:", error);
    return false;
  }
}

// Test 3: Try uploading a small file
async function testFileUpload() {
  try {
    // Create a small test file
    const testContent = "Hello Pinata Test";
    const testFile = new File([testContent], "test.txt", { type: "text/plain" });
    
    const formData = new FormData();
    formData.append("file", testFile);
    
    const metadata = JSON.stringify({
      name: "test-file",
      keyvalues: {
        test: "true"
      }
    });
    formData.append("pinataMetadata", metadata);
    
    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);
    
    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    });
    
    console.log("📁 File Upload Test:", response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.text();
      console.error("❌ File Upload Error:", error);
    } else {
      const result = await response.json();
      console.log("✅ File Upload Success:", result);
    }
    
    return response.ok;
  } catch (error) {
    console.error("❌ File Upload Test Failed:", error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("🧪 Running Pinata Tests...");
  
  const authOk = await testAuth();
  const permissionsOk = await testPermissions();
  const uploadOk = await testFileUpload();
  
  console.log("📊 Test Results:", {
    authentication: authOk ? "✅ PASS" : "❌ FAIL",
    permissions: permissionsOk ? "✅ PASS" : "❌ FAIL", 
    fileUpload: uploadOk ? "✅ PASS" : "❌ FAIL"
  });
  
  if (!authOk) {
    console.log("🔧 Fix: Check your JWT token");
  }
  if (!permissionsOk) {
    console.log("🔧 Fix: API key needs 'pinList' permission");
  }
  if (!uploadOk) {
    console.log("🔧 Fix: API key needs 'pinFileToIPFS' permission");
  }
}

// Export for use
window.testPinata = runAllTests;
