import { supabase } from '@/integrations/supabase/client';

/**
 * Debug function to test Google Drive upload functionality
 * This helps identify where the upload is failing
 */
export async function debugUpload(file: File, folder: string = 'mess-manager/test') {
  console.log('🔍 Debug Upload Started');
  console.log('📁 File:', {
    name: file.name,
    size: file.size,
    type: file.type,
  });
  console.log('📂 Folder:', folder);

  try {
    // 1. Check authentication
    console.log('🔐 Checking authentication...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Authentication Error:', authError);
      throw new Error('Authentication failed: ' + authError.message);
    }

    if (!session) {
      console.error('❌ No active session');
      throw new Error('No active session found');
    }

    console.log('✅ Authentication successful');
    console.log('👤 User ID:', session.user.id);

    // 2. Prepare FormData
    console.log('📦 Preparing FormData...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('filename', file.name);

    console.log('✅ FormData prepared');

    // 3. Make request to Edge Function
    console.log('🚀 Making request to Edge Function...');
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-drive`;
    const token = session.access_token;

    console.log('🌐 Function URL:', functionUrl);
    console.log('🔑 Token present:', !!token);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    console.log('📡 Response received');
    console.log('📊 Status:', response.status);
    console.log('📋 Status Text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response not OK:', errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    // 4. Parse response
    console.log('📄 Parsing response...');
    const result = await response.json();
    console.log('✅ Response parsed:', result);

    if (!result.success) {
      console.error('❌ Upload failed:', result.error);
      throw new Error(result.error || 'Upload failed');
    }

    console.log('🎉 Upload successful!');
    console.log('📄 Result:', result.data);
    
    return result.data;

  } catch (error) {
    console.error('💥 Upload failed with error:', error);
    throw error;
  }
}

/**
 * Test upload with a simple file
 */
export async function testUpload() {
  try {
    // Create a simple test file
    const testContent = 'Hello World!';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    console.log('🧪 Starting upload test...');
    const result = await debugUpload(testFile, 'mess-manager/test');
    
    console.log('✅ Test completed successfully!');
    console.log('🔗 File URL:', result.url);
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}