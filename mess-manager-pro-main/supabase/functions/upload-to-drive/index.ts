import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  mimeType: string;
  size: string;
}

interface UploadResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    webViewLink: string;
    webContentLink: string;
    mimeType: string;
    size: number;
    url: string;
  };
  error?: string;
}

// Generate JWT for Google Drive API
function generateJWT(email: string, privateKeyPem: string): Promise<string> {
  // Simple JWT encoding for now (should use jose library in production)
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Simple JWT encoding (base64url)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  return Promise.resolve(`${header}.${encodedPayload}.signature`);
}

// Get OAuth token from Google
async function getOAuthToken(email: string, privateKeyPem: string): Promise<string> {
  const jwtAssertion = await generateJWT(email, privateKeyPem);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtAssertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth token request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Upload file to Google Drive
async function uploadToGoogleDrive(file: File, folder: string, filename: string, accessToken: string, folderId: string): Promise<GoogleDriveFile> {
  // Prepare file data for Google Drive API
  const metadata = {
    name: filename,
    parents: [folderId],
  };

  // Create multipart/related request for Google Drive
  const boundary = '-------314159265358979323846';
  const delimiter = `--${boundary}`;
  const closeDelimiter = `--${boundary}--`;
  
  // Convert file to base64
  const fileContent = await file.arrayBuffer();
  const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileContent)));

  const multipartRequestBody =
    delimiter +
    '\r\n' +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    '\r\n' +
    delimiter +
    '\r\n' +
    'Content-Type: ' + file.type + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n' +
    '\r\n' +
    base64Content +
    '\r\n' +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': multipartRequestBody.length.toString(),
    },
    body: multipartRequestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive upload failed: ${response.statusText} - ${errorText}`);
  }

  const uploadedFile = await response.json();
  return uploadedFile;
}

// Ensure folder exists in Google Drive
async function ensureFolderExists(accessToken: string, folderPath: string, rootFolderId: string): Promise<string> {
  const folders = folderPath.split('/').filter(f => f.trim());
  let currentFolderId = rootFolderId;

  for (const folderName of folders) {
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}'+and+mimeType='application/vnd.google-apps.folder'+and+'${currentFolderId}'+in+parents&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const searchData = await searchResponse.json();
    const existingFolder = searchData.files?.[0];

    if (existingFolder) {
      currentFolderId = existingFolder.id;
    } else {
      // Create folder
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolderId],
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create folder: ${createResponse.statusText}`);
      }

      const newFolder = await createResponse.json();
      currentFolderId = newFolder.id;
    }
  }

  return currentFolderId;
}

serve(async (req: Request) => {
  try {
    // 1. Handle preflight first, before anything that might throw
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // 2. Read env vars inside the handler, not at global scope
    const GDRIVE_SERVICE_ACCOUNT_EMAIL = Deno.env.get("GDRIVE_SERVICE_ACCOUNT_EMAIL");
    const GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY = Deno.env.get("GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY");
    const GDRIVE_ROOT_FOLDER_ID = Deno.env.get("GDRIVE_ROOT_FOLDER_ID");

    if (!GDRIVE_SERVICE_ACCOUNT_EMAIL || !GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY || !GDRIVE_ROOT_FOLDER_ID) {
      return new Response(
        JSON.stringify({ error: "Google Drive environment variables not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;
    const filename = formData.get('filename') as string;

    if (!file || !folder) {
      return new Response(JSON.stringify({ error: 'Missing file or folder' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get OAuth token from Google
    const accessToken = await getOAuthToken(
      GDRIVE_SERVICE_ACCOUNT_EMAIL,
      GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY,
    );

    // Create folder if it doesn't exist
    const folderId = await ensureFolderExists(accessToken, folder, GDRIVE_ROOT_FOLDER_ID);
    
    // Upload to Google Drive
    const uploadedFile = await uploadToGoogleDrive(
      file, 
      folder, 
      filename || file.name, 
      accessToken, 
      folderId
    );

    // Generate public URL (make file publicly accessible)
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'anyone',
        role: 'reader',
      }),
    });

    // Return success response
    const response: UploadResponse = {
      success: true,
      data: {
        id: uploadedFile.id,
        name: uploadedFile.name,
        webViewLink: uploadedFile.webViewLink,
        webContentLink: uploadedFile.webContentLink,
        mimeType: uploadedFile.mimeType,
        size: parseInt(uploadedFile.size || '0'),
        url: uploadedFile.webContentLink || uploadedFile.webViewLink,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Upload error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});