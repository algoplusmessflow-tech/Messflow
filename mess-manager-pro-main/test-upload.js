// Google Drive Upload Test Script
// This script tests the Supabase Edge Function for Google Drive uploads

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://wgmbwjzvgxvqvpkgmydy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbWJ3anp2Z3h2cXZwa2dteWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NTc5MTUsImV4cCI6MjA4NTMzMzkxNX0.o2uNVbqnWLVItV8_HPhSkJKJx3DPV1thQ8Dmdz9lys8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testGoogleDriveUpload() {
    console.log('🚀 Starting Google Drive Upload Test...\n');

    try {
        // 1. Check if user is authenticated
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
            console.error('❌ Authentication Error:', authError.message);
            console.log('\n📝 To test upload functionality:');
            console.log('1. First, log in to your Supabase application');
            console.log('2. Get your auth token from localStorage or browser dev tools');
            console.log('3. Run this script again with a valid session');
            return;
        }

        if (!session) {
            console.error('❌ No active session found. Please log in first.');
            console.log('\n📝 To test upload functionality:');
            console.log('1. Visit your application and log in');
            console.log('2. Run this script again');
            return;
        }

        console.log('✅ User authenticated successfully');
        console.log('👤 User ID:', session.user.id);

        // 2. Test file upload
        console.log('\n📤 Testing file upload...');
        
        // Create a test file (1x1 PNG)
        const testFile = createTestFile();
        
        const uploadResult = await uploadFileToGoogleDrive(testFile, 'mess-manager/test-uploads', 'test-upload.png');
        
        if (uploadResult.success) {
            console.log('✅ Upload successful!');
            console.log('\n📊 Upload Details:');
            console.log('   File ID:', uploadResult.data.id);
            console.log('   File Name:', uploadResult.data.name);
            console.log('   File Size:', uploadResult.data.size, 'bytes');
            console.log('   MIME Type:', uploadResult.data.mimeType);
            console.log('   View Link:', uploadResult.data.webViewLink);
            console.log('   Direct Link:', uploadResult.data.url);
            
            // 3. Test file access
            console.log('\n🔍 Testing file access...');
            const accessTest = await testFileAccess(uploadResult.data.url);
            
            if (accessTest) {
                console.log('✅ File access test passed!');
            } else {
                console.log('⚠️  File access test failed - file may not be publicly accessible');
            }
            
        } else {
            console.error('❌ Upload failed:', uploadResult.error);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

async function uploadFileToGoogleDrive(file, folder, filename) {
    try {
        const functionUrl = `${SUPABASE_URL}/functions/v1/upload-to-drive`;
        const token = (await supabase.auth.getSession()).data.session?.access_token;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        formData.append('filename', filename);

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const result = await response.json();
        return result;

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function testFileAccess(fileUrl) {
    try {
        const response = await fetch(fileUrl, {
            method: 'HEAD' // Use HEAD request to check if file is accessible
        });
        
        return response.ok;
    } catch (error) {
        console.error('File access test error:', error.message);
        return false;
    }
}

function createTestFile() {
    // Create a simple 1x1 PNG file as a test
    const pngHeader = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5C, 0x0A, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60,
        0x82
    ]);

    return new File([pngHeader], 'test.png', { type: 'image/png' });
}

// CLI interface
if (require.main === module) {
    testGoogleDriveUpload().catch(console.error);
}

module.exports = { testGoogleDriveUpload, uploadFileToGoogleDrive };