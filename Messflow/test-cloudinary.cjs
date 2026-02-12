/**
 * Cloudinary Connectivity Test Script (FIXED)
 * 
 * Run with: node test-cloudinary.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Cloudinary Configuration...\n');

// --- 1. Load Environment Variables ---
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        // Remove quotes if present in .env
        let val = valueParts.join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
           val = val.slice(1, -1);
        }
        envVars[key.trim()] = val;
      }
    }
  });
  
  return envVars;
}

const env = loadEnv();
if (!env) {
  console.log('❌ Cannot proceed without .env file');
  process.exit(1);
}

// Check if variables use VITE_ prefix or not (support both)
const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_CLOUD_NAME;
const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET || env.CLOUDINARY_UPLOAD_PRESET;

// --- 2. Validate Configuration ---
console.log('📋 Test 1: Checking environment variables...');

if (!cloudName) {
  console.log('❌ Cloud Name is missing in .env (Check VITE_CLOUDINARY_CLOUD_NAME)');
  process.exit(1);
}
if (!uploadPreset) {
  console.log('❌ Upload Preset is missing in .env (Check VITE_CLOUDINARY_UPLOAD_PRESET)');
  process.exit(1);
}

// Helper to mask sensitive data
function maskString(str, visibleChars = 4) {
  if (!str) return '????';
  if (str.length <= visibleChars) return '****';
  return '*'.repeat(str.length - visibleChars) + str.slice(-visibleChars);
}

console.log('✅ Environment variables are set');
console.log(`   Cloud Name: ${maskString(cloudName)}`);
console.log(`   Upload Preset: ${maskString(uploadPreset)}\n`);

console.log('📋 Test 2: Validating Cloud Name format...');
const cloudNameRegex = /^[a-z0-9_-]+$/;
if (!cloudNameRegex.test(cloudName)) {
  console.log('❌ Invalid Cloud Name format. Should use lowercase letters, numbers, underscores only.');
  process.exit(1);
}
console.log('✅ Cloud Name format is valid\n');

// --- 3. Test API Connectivity ---
console.log('📋 Test 3: Testing Cloudinary API connectivity...');

function testDNSLookup() {
  return new Promise((resolve) => {
    require('dns').lookup(`api.cloudinary.com`, (err, address) => {
      if (err) {
        console.log(`❌ DNS lookup failed: ${err.message}`);
        resolve(false);
      } else {
        console.log(`✅ DNS lookup successful: ${address}`);
        resolve(true);
      }
    });
  });
}

// --- 4. Test Actual Upload (The Fix) ---
async function testUploadPreset() {
  console.log('\n📋 Test 4: Testing upload preset with actual upload...');
  
  return new Promise((resolve) => {
    // FIXED: Use a Data URI string instead of raw binary buffer
    // This allows uploading without complex multipart binary stream handling
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const boundary = '----CloudinaryTestBoundary' + Date.now();
    
    // Construct body using simple strings (safest for Node.js http module)
    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"`,
      '',
      testImageBase64, // Sending the base64 string directly
      `--${boundary}`,
      `Content-Disposition: form-data; name="upload_preset"`,
      '',
      uploadPreset,
      `--${boundary}--`
    ].join('\r\n');

    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${cloudName}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 20000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            console.log('❌ Upload failed.');
            console.log(`   Error Message: ${response.error.message}`);
            
            if(response.error.message.includes('Invalid image file')) {
                 console.log(`   💡 Tip: This script sent a valid Base64 PNG. If this failed, check if your Preset 'Allowed Formats' includes 'png' (without quotes!).`);
            }
            resolve(false);
          } else {
            console.log('✅ Upload preset is configured correctly!');
            console.log(`   Public ID: ${response.public_id}`);
            console.log(`   URL: ${response.secure_url}`);
            resolve(true);
          }
        } catch (e) {
          console.log('❌ Failed to parse response from Cloudinary.');
          console.log('Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Network error during upload: ${error.message}`);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

// --- Run Logic ---
async function runTests() {
  const dnsOk = await testDNSLookup();
  if (!dnsOk) process.exit(1);

  const presetOk = await testUploadPreset();
  
  console.log('\n' + '='.repeat(50));
  if (presetOk) {
    console.log('   ✅ ALL TESTS PASSED');
    console.log('='.repeat(50));
  } else {
    console.log('   ⚠️  TEST FAILED');
    console.log('='.repeat(50));
    console.log('1. Go to Cloudinary > Settings > Upload > Upload Presets');
    console.log(`2. Edit preset: ${uploadPreset}`);
    console.log('3. Ensure "Allowed Formats" is EMPTY or says: jpg,png,jpeg (no quotes!)');
    console.log('4. Ensure Mode is "Unsigned"');
  }
}

runTests();