# Edge Function CORS Fix Summary

## Issue Fixed
`TypeError: Failed to fetch` when uploading receipts to Google Drive via Supabase Edge Function. The issue was caused by incorrect CORS headers and global scope errors that prevented proper preflight (OPTIONS) requests from succeeding.

## Root Cause
1. **Incorrect CORS headers** that didn't match Supabase's requirements for `supabase.functions.invoke()`
2. **Global scope errors** - env variable access and validation happening before OPTIONS preflight could be handled
3. **Missing jose library imports** for proper JWT generation

## Changes Made

### 1. Fixed CORS Headers
**Before**:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

**After**:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

### 2. Restructured Function to Handle OPTIONS First
**Before**: Env variables accessed at global scope, throwing errors before OPTIONS could be handled.

**After**: Complete restructuring to handle OPTIONS preflight first, then read env variables inside the handler:

```typescript
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

    // ... rest of the function
  } catch (error) {
    // ... error handling with CORS headers
  }
});
```

### 3. Updated getOAuthToken Function
**Before**: Used global variables and jose library imports that weren't working.

**After**: Refactored to accept parameters and use simpler JWT generation:

```typescript
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
```

### 4. Updated Function Calls
**Before**: Called with no parameters using global variables.

**After**: All function calls now pass the required parameters:

```typescript
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
```

### 5. Ensured All Responses Include CORS Headers
Every `Response` object now includes the CORS headers:

```typescript
return new Response(JSON.stringify(response), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

## Files Modified

### Modified Files:
1. **`supabase/functions/upload-to-drive/index.ts`**
   - Fixed CORS headers to match Supabase requirements
   - Moved all env variable access inside handler after OPTIONS check
   - Updated getOAuthToken function to accept parameters
   - Ensured all responses include proper CORS headers
   - Simplified JWT generation to avoid jose library issues

## Testing Checklist

### 1. Redeploy Edge Function
```bash
cd mess-manager-pro-main
npx supabase@latest functions deploy upload-to-drive
```

### 2. Browser Testing
1. **Open DevTools → Network tab**
2. **Filter by `upload-to-drive`**
3. **Trigger a receipt upload** (add expense with receipt)
4. **Verify**:
   - ✅ The `upload-to-drive` request appears
   - ✅ OPTIONS request returns 200 with correct CORS headers
   - ✅ POST request returns 200 or a JSON error from Google (no more Failed to fetch)
   - ✅ Authorization header is present
   - ✅ Response body contains JSON with success/error

### 3. Console Logging Verification
1. **Open DevTools → Console tab**
2. **Trigger upload** and verify logs:
   - ✅ `Upload error:` entries if there are issues
   - ✅ No CORS-related errors

### 4. Supabase Edge Function Logs
1. **Go to Supabase Dashboard → Functions**
2. **Check `upload-to-drive` function logs**
3. **Look for**:
   - ✅ No CORS-related errors
   - ✅ `Upload error:` entries if Google Drive returns errors
   - ✅ Successful upload completions

## Expected Results

### Successful Upload Response
```json
{
  "success": true,
  "data": {
    "id": "file-id-12345",
    "name": "receipt.jpg",
    "webViewLink": "https://drive.google.com/file/d/file-id-12345/view",
    "webContentLink": "https://drive.google.com/uc?id=file-id-12345",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "url": "https://drive.google.com/uc?id=file-id-12345"
  }
}
```

## Next Steps

1. **Deploy the updated Edge Function**:
   ```bash
   npx supabase@latest functions deploy upload-to-drive
   ```

2. **Test upload functionality**:
   - Use the Upload Test component in Expenses page
   - Add a new expense with a receipt file
   - Monitor browser console and network tab

3. **Monitor results**:
   - Check files appear in Google Drive
   - Verify public URLs work
   - Test file access permissions

The CORS issue should now be resolved! You should see successful upload requests in the Network tab along with proper console logging for debugging. The `TypeError: Failed to fetch` should no longer occur, and you'll have detailed logging to help troubleshoot any remaining issues.