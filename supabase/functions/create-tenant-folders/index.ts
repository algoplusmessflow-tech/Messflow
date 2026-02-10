import { createClient } from '@supabase/supabase-js';

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateFoldersResponse {
  success: boolean;
  data?: {
    tenantId: string;
    folders: string[];
  };
  error?: string;
}

// Generate JWT for Google Drive API
async function generateJWT(email: string, privateKeyPem: string): Promise<string> {
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
  
  return `${header}.${encodedPayload}.signature`;
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

// Create folder in Google Drive
async function createFolder(accessToken: string, folderName: string, parentId?: string): Promise<string> {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : [],
  };

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create folder ${folderName}: ${response.statusText} - ${errorText}`);
  }

  const folder = await response.json();
  return folder.id;
}

// Ensure base folder exists
async function ensureBaseFolder(accessToken: string, baseFolderId: string): Promise<string> {
  // Check if base folder exists by trying to get its metadata
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${baseFolderId}?fields=id,name`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Base folder not found or inaccessible: ${response.statusText}`);
  }

  return baseFolderId;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    // 1. Handle preflight first, before anything that might throw
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // 2. Read env vars inside the handler, not at global scope
    const GDRIVE_SERVICE_ACCOUNT_EMAIL = process.env.GDRIVE_SERVICE_ACCOUNT_EMAIL;
    const GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY;
    const GDRIVE_ROOT_FOLDER_ID = process.env.GDRIVE_ROOT_FOLDER_ID;

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
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await req.json();
    const { tenantId } = body;

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'Missing tenantId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get OAuth token from Google
    const accessToken = await getOAuthToken(
      GDRIVE_SERVICE_ACCOUNT_EMAIL,
      GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY,
    );

    // Ensure base folder exists
    await ensureBaseFolder(accessToken, GDRIVE_ROOT_FOLDER_ID);

    // Create tenant-specific folders
    const tenantFolderId = await createFolder(accessToken, tenantId, GDRIVE_ROOT_FOLDER_ID);
    const receiptsFolderId = await createFolder(accessToken, 'receipts', tenantFolderId);
    const logosFolderId = await createFolder(accessToken, 'logos', tenantFolderId);
    const avatarsFolderId = await createFolder(accessToken, 'avatars', tenantFolderId);

    // Make folders publicly accessible
    const foldersToMakePublic = [tenantFolderId, receiptsFolderId, logosFolderId, avatarsFolderId];
    
    for (const folderId of foldersToMakePublic) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
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
    }

    // Return success response
    const response: CreateFoldersResponse = {
      success: true,
      data: {
        tenantId,
        folders: [
          `mess-manager/${tenantId}`,
          `mess-manager/${tenantId}/receipts`,
          `mess-manager/${tenantId}/logos`,
          `mess-manager/${tenantId}/avatars`,
        ],
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Folder creation error:", error);

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
}
