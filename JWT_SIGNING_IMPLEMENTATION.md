# JWT Signing Implementation Summary

## Overview
Successfully implemented proper JWT signing for Google Drive authentication using the `jose` library in the Supabase Edge Function.

## Key Changes Made

### 1. Added jose Library Import
```typescript
import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5.8.0';
```

### 2. Implemented Proper JWT Signing Function
```typescript
async function getOAuthToken(email: string, privateKeyPem: string): Promise<string> {
  try {
    // Import the private key using jose library
    const privateKey = await importPKCS8(privateKeyPem, "RS256");
    const now = Math.floor(Date.now() / 1000);

    // Create and sign the JWT using jose library
    const jwt = await new SignJWT({
      iss: email,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .sign(privateKey);

    // Request OAuth token from Google
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
      throw new Error(`OAuth token request failed: ${response.status} ${response.statusText} - ${body}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error("OAuth token response missing access_token");
    }

    return data.access_token as string;
  } catch (error) {
    console.error("JWT signing error:", error);
    throw new Error(`Failed to generate OAuth token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
```

## Implementation Details

### JWT Structure
- **Algorithm**: RS256 (RSA Signature with SHA-256)
- **Type**: JWT
- **Issuer (iss)**: Service account email
- **Scope**: `https://www.googleapis.com/auth/drive.file`
- **Audience (aud)**: `https://oauth2.googleapis.com/token`
- **Issued At (iat)**: Current timestamp
- **Expiration (exp)**: 1 hour from issuance

### Security Features
- ✅ **Proper RSA signing** using service account private key
- ✅ **Secure key import** via `importPKCS8`
- ✅ **Standard JWT format** compliant with Google's requirements
- ✅ **Error handling** with detailed logging
- ✅ **Token validation** checking for access_token presence

### CORS Configuration
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

### Environment Variables
- `GDRIVE_SERVICE_ACCOUNT_EMAIL` - Service account email
- `GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY` - Service account private key (PKCS#8 format)
- `GDRIVE_ROOT_FOLDER_ID` - Root folder ID in Google Drive
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## Deployment Steps

### 1. Redeploy Edge Function
```bash
cd mess-manager-pro-main
npx supabase@latest functions deploy upload-to-drive
```

### 2. Verify Environment Variables
Ensure all required environment variables are set in Supabase Dashboard:
- Settings → Config → Environment Variables

### 3. Test the Function
Use the test file to verify functionality:
```bash
open test-upload-fixed.html
```

## Expected Results

### Successful JWT Generation
The function will now properly:
1. Import the service account private key
2. Create a signed JWT with correct claims
3. Exchange the JWT for an OAuth access token
4. Use the access token to upload files to Google Drive

### Success Response
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

## Troubleshooting

### Common Issues

#### 1. Invalid Private Key Format
**Error**: `Failed to import PKCS8 key`
**Solution**: Ensure the private key is in PKCS#8 format and properly escaped

#### 2. Service Account Permissions
**Error**: `403 Forbidden` from Google Drive API
**Solution**: Verify service account has Editor access to the root folder

#### 3. Invalid JWT Claims
**Error**: `Invalid JWT` from Google OAuth
**Solution**: Check that all required claims are present and correctly formatted

#### 4. Network Issues
**Error**: `Failed to fetch` or timeout
**Solution**: Check network connectivity and Google API quotas

### Debugging Steps

1. **Check Function Logs** in Supabase Dashboard
2. **Verify Environment Variables** are correctly set
3. **Test JWT Generation** manually if needed
4. **Monitor Google API Quotas** in Google Cloud Console

## Security Considerations

### ✅ Implemented
- Proper RSA signing with service account private key
- Secure key storage in environment variables
- Standard JWT format compliant with Google requirements
- Comprehensive error handling and logging

### ⚠️ Important Notes
- Never hard-code access tokens
- Keep service account private key secure
- Monitor Google API usage and quotas
- Implement token refresh for production use

## Next Steps

1. **Redeploy the function** with the updated code
2. **Test upload functionality** using the provided test files
3. **Monitor function logs** for any errors
4. **Consider implementing token caching** for better performance
5. **Add token refresh logic** for production use

This implementation provides a secure, standards-compliant solution for Google Drive authentication that should resolve the "Invalid JWT" error and enable reliable file uploads.