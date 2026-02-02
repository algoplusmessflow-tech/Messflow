// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.8.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const JWT_EXPIRY = 3600;

interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  mimeType: string;
  size?: string;
}

class DriveError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

const sanitizeFolderName = (name: string): string =>
  name.replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 100);

const getUserFolderName = (user: any, businessName?: string): string => {
  const baseName = businessName?.trim() || user.email?.split("@")[0] || user.id || "user";
  const sanitized = sanitizeFolderName(baseName);
  const shortId = user.id?.slice(0, 8) || "";
  return shortId ? `${sanitized}_${shortId}` : sanitized;
};

const createAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const createErrorResponse = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

async function getOAuthToken(email: string, privateKeyPem: string): Promise<string> {
  try {
    console.log("Importing private key...");
    const privateKey = await importPKCS8(privateKeyPem, "RS256");
    const now = Math.floor(Date.now() / 1000);
    
    console.log("Creating JWT...");
    const jwt = await new SignJWT({
      iss: email,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + JWT_EXPIRY,
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .sign(privateKey);

    console.log("Requesting OAuth token...");
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("OAuth token request failed:", {
        status: response.status,
        statusText: response.statusText,
        body
      });
      throw new DriveError(`OAuth failed: ${response.status} - ${body}`, response.status);
    }

    const data = await response.json();
    console.log("OAuth response received:", { hasAccessToken: !!data.access_token });
    
    if (!data.access_token) {
      console.error("OAuth response missing access_token:", data);
      throw new DriveError("Missing access_token", 500);
    }
    
    return data.access_token;
  } catch (error) {
    console.error("OAuth token generation failed:", error);
    if (error instanceof DriveError) throw error;
    throw new DriveError(`OAuth token error: ${error.message}`, 500);
  }
}

async function ensureFolderExists(accessToken: string, folderPath: string, rootFolderId: string): Promise<string> {
  const parts = folderPath.split("/").filter(Boolean);
  let currentParentId = rootFolderId;

  for (const folderName of parts) {
    const sanitizedName = sanitizeFolderName(folderName);
    
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and name='${encodeURIComponent(sanitizedName)}' and '${currentParentId}' in parents and trashed=false`;
    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchResponse.ok) throw new DriveError("Folder search failed");

    const { files } = await searchResponse.json();
    
    if (files?.length > 0) {
      currentParentId = files[0].id;
    } else {
      const createResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: createAuthHeaders(accessToken),
        body: JSON.stringify({
          name: sanitizedName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [currentParentId],
        }),
      });

      if (!createResponse.ok) {
        const body = await createResponse.text();
        throw new DriveError(`Folder creation failed: ${body}`);
      }

      const { id } = await createResponse.json();
      currentParentId = id;
    }
  }

  return currentParentId;
}

async function uploadFileToDrive(token: string, file: File, folderId: string, filename: string): Promise<DriveFile> {
  const metadata = {
    name: sanitizeFolderName(filename || file.name),
    parents: [folderId],
  };

  const boundary = "boundary123";
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const base64 = btoa(String.fromCharCode(...fileBytes));

  const body = [
    `--${boundary}`,
    "Content-Type: application/json\r\n",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${file.type}`,
    "Content-Transfer-Encoding: base64\r\n",
    base64,
    `--${boundary}--`,
  ].join("\r\n");

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new DriveError(`Upload failed: ${response.status} - ${body}`);
  }
  
  return response.json();
}

async function makeFilePublic(token: string, fileId: string): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: createAuthHeaders(token),
    body: JSON.stringify({ type: "anyone", role: "reader" }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new DriveError(`Failed to make file public: ${body}`);
  }
}

serve(async (req: Request) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received`);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return createErrorResponse("Method not allowed", 405);
  }

  try {
    // Check environment variables
    const envVars = [
      "SUPABASE_URL", "SUPABASE_ANON_KEY", "GDRIVE_SERVICE_ACCOUNT_EMAIL",
      "GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY", "GDRIVE_ROOT_FOLDER_ID"
    ].map(key => ({ key, value: Deno.env.get(key) }));

    const missingVars = envVars.filter(v => !v.value).map(v => v.key);
    if (missingVars.length > 0) {
      console.error("Missing environment variables:", missingVars);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Missing environment variables: ${missingVars.join(", ")}` 
      }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const [SUPABASE_URL, SUPABASE_ANON_KEY, GDRIVE_SERVICE_ACCOUNT_EMAIL, GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY, GDRIVE_ROOT_FOLDER_ID] = envVars.map(v => v.value);

    // Check authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return createErrorResponse("Missing authorization header", 401);
    }

    console.log("Creating Supabase client...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log("Getting user from Supabase...");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Supabase auth error:", authError);
      return createErrorResponse(`Auth error: ${authError.message}`, 401);
    }
    if (!user) {
      console.error("No user found");
      return createErrorResponse("Unauthorized", 401);
    }

    console.log("User authenticated:", user.id);

    console.log("Getting user profile...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.warn("Profile query error:", profileError);
    }

    console.log("Parsing form data...");
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;
    const filename = formData.get("filename") as string;

    console.log("Form data:", { 
      hasFile: !!file, 
      fileSize: file?.size, 
      fileName: file?.name,
      folder, 
      filename 
    });

    if (!file) {
      console.error("No file provided");
      return createErrorResponse("Missing file", 400);
    }
    if (!folder) {
      console.error("No folder provided");
      return createErrorResponse("Missing folder", 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size);
      return createErrorResponse(`File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE})`, 400);
    }

    console.log("Getting OAuth token...");
    const accessToken = await getOAuthToken(GDRIVE_SERVICE_ACCOUNT_EMAIL, GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY);
    console.log("OAuth token obtained successfully");

    const userFolderName = getUserFolderName(user, profile?.business_name);
    const fullFolderPath = `${userFolderName}/${folder || "receipts"}`;
    console.log("Target folder path:", fullFolderPath);

    console.log("Ensuring folder exists...");
    const folderId = await ensureFolderExists(accessToken, fullFolderPath, GDRIVE_ROOT_FOLDER_ID);
    console.log("Folder ID:", folderId);

    console.log("Uploading file to Drive...");
    const uploadedFile = await uploadFileToDrive(accessToken, file, folderId, filename || file.name);
    console.log("File uploaded successfully:", uploadedFile.id);
    
    console.log("Making file public...");
    await makeFilePublic(accessToken, uploadedFile.id);
    console.log("File made public successfully");

    const response = {
      success: true,
      data: {
        id: uploadedFile.id,
        name: uploadedFile.name,
        webViewLink: uploadedFile.webViewLink,
        webContentLink: uploadedFile.webContentLink,
        mimeType: uploadedFile.mimeType,
        size: parseInt(uploadedFile.size || "0"),
        url: uploadedFile.webContentLink || uploadedFile.webViewLink,
      },
    };

    console.log("Upload completed successfully");
    return new Response(JSON.stringify(response), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Upload error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      status: error instanceof DriveError ? error.status : 'unknown'
    });
    
    const statusCode = error instanceof DriveError ? error.status : 500;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: statusCode,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
