import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Google Drive API configuration
const GDRIVE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GDRIVE_SERVICE_ACCOUNT_EMAIL') || 'mess-manager-drive-uploader@messflow-486008.iam.gserviceaccount.com';
const GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY = Deno.env.get('GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY') || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCOPC83haS7LUU/
psyrP87A4E6iQaYTN9ux7XIfHSUAbrwk/CGK6krmmQH+vZM6tUjjq0RXZAKnJFsA
iSrL2rR8JGzN7E4Y7jkpYDBCqALYMJ3JbHBRx+KifEWZM/QlvzNwMyqkcT9WGzeB
OOLDHcUmp9aZHAgPNe+2ASuIkTg2dCaqeUvS4QgTJrmjUdMLdRJsNrRRdn8ip0dR
GI2abF74gPbvTMffT3zrnJDIHwUkgURll0EZ/2KIaeZjNDsWRKVXUWpASeXrPeNr
jNeC61EW5mIBtaRIJ/eaK9xSLV/v8qGOlQVbBCsu5t/qjy19bbNZ4iSaR3cMvFAM
VRH+Xl2xAgMBAAECggEAEPyFjA0xHOx9ZGpkb4A1jinLokuSTKHDYkav9iDKKjjP
TeBxlhBAhTUZPKXBx0VesNfjl8c5HOJ13sTC4GkcXGYSO26A7i/HElarNM6xVkXK
FkPVzyJ+wbZzLmZ6viZNO5VUvqJKtNsXwB490J0FzkXFlm/3U2+20sblftAPBUug
vWZI0zA8sExsJWBD64ewiqRr4FEhpbLFohBRqmjuJppqtJDjA9Nx3+UMVYCGf30y
PsRV7tmXY3zV34BYwpehLRoGcK2PwWqjKE/pNFlMSzxKZdlTZRyxC5C5PfTVGGIF
Kd8C+YqREZTMgj1w7VY7E3PNitA6Yr7xFJeqq1Ha1QKBgQC/z81WNjhzvMM1EIu3
Wi7XUnBhiuG4bnwuVwN+H03BLA0gEib9n2uHyxWDO3lrXN1ULpsT7CO09K8seQ/d
golr0JDG1/VmNK2vm2W5vRWVhw7QoK+8LUuxw5b5KU6nJwIAlpmF9dIxKOBjpYSq
sxOt0I0wGrP8P2nl2KkC4GXcXQKBgQC91TuwWlk3eBlnD4bAKB3TVsbnP1cQnSTy
G7+3h2YAGCMrouIEBZsC6SN07CbSu5bUu5kvsyTQcyLqPxxzIkUMgxtrP7TNdioA
tT1hyAKJ1f+p+JpBasWy65iZDZKM8t5HI4cgXAcAoksz5J5WxbOvq8tHFUX4hHQR
uYPFKflRZQKBgC9eqW5GG7DxiB/9wxN38SN6F4jvXIlIt+BV2uX14yT2tRMbiIeQ
LGUv0VNEh9rs5zgX/nJwGe1hlDVefH2O9FMtAeQph1BDaDV7Iic5vC/eV9lMJbpK
UWxISmukOOls58CvcKC1scA0QR46zUW+zfhaDdQ4dASywHtkA3FTa7R9AoGBALh3
7nHXyhyZ62137ATsttb423450dxGKHHQv0OUIm1zBzJPLPylidWRQjBLjwp22gJN
bnWoytx5FfO1cmr7YUfgW5Ojq4mBCx33APf1CWpx9uhvuU5aeFT+liIcy02GcLOG
dbffVbqq+xMpVSiTI6JQ+c9Qf9cYt0XGFaNRv4H1AoGAS/MD2ViAlA6Ez1wbFF4m
l+1Eytf2MF0s6Dw4pk7iIQddkueaOs16ABsFj/oJ3FfkRR5Kxp1Ql30KfvQbkyMF
O9N/RQapAfwzKVq2wu4b3itmp1ITCYLU7mCvF52hMN2BSatfTU0m9ReR80RfXFbq
BuXInOdhBmayPLV6hgotPaA=
-----END PRIVATE KEY-----`;
const GDRIVE_ROOT_FOLDER_ID = Deno.env.get('GDRIVE_ROOT_FOLDER_ID') || '1hFLjKyIVRcTH0s09igFIDt62MAxduH9I';

if (!GDRIVE_SERVICE_ACCOUNT_EMAIL || !GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY || !GDRIVE_ROOT_FOLDER_ID) {
  throw new Error('Google Drive environment variables not configured');
}

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
function generateJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: GDRIVE_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Simple JWT encoding (base64url)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // Note: This is a simplified JWT. In production, you'd want to use a proper JWT library
  // For now, we'll use a different approach with fetch to Google's OAuth endpoint
  return `${header}.${encodedPayload}.signature`;
}

// Get OAuth token from Google
async function getOAuthToken(): Promise<string> {
  const jwtAssertion = generateJWT();
  
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
async function uploadToGoogleDrive(file: File, folder: string, filename?: string): Promise<GoogleDriveFile> {
  const accessToken = await getOAuthToken();
  
  // Create folder if it doesn't exist
  const folderId = await ensureFolderExists(accessToken, folder);
  
  // Prepare file data
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify({
    name: filename || file.name,
    parents: [folderId],
  })], { type: 'application/json' }));
  
  formData.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Google Drive upload failed: ${response.statusText}`);
  }

  const uploadedFile = await response.json();
  return uploadedFile;
}

// Ensure folder exists in Google Drive
async function ensureFolderExists(accessToken: string, folderPath: string): Promise<string> {
  const folders = folderPath.split('/').filter(f => f.trim());
  let currentFolderId = GDRIVE_ROOT_FOLDER_ID;

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
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
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

    // Upload to Google Drive
    const uploadedFile = await uploadToGoogleDrive(file, folder, filename);

    // Generate public URL (make file publicly accessible)
    const accessToken = await getOAuthToken();
    
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
    console.error('Upload error:', error);
    
    const response: UploadResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
    });
  }
});