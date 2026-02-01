# Google Drive Authentication Fix

## Issue: "Invalid JWT" Error

The current implementation fails because Google Drive requires a properly signed JWT using the service account's private key. The current code creates an unsigned JWT which Google rejects.

## Solution: Use Pre-Generated Access Token

### Step 1: Generate a Long-Lived Access Token

1. **Go to Google Cloud Console**
   - Navigate to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Go to **APIs & Services → Credentials**

2. **Create OAuth Consent Screen**
   - Configure OAuth consent screen
   - Add necessary scopes: `https://www.googleapis.com/auth/drive.file`
   - Submit for verification (if required)

3. **Create OAuth Client ID**
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Add authorized redirect URIs: `https://your-domain.com/callback`

4. **Generate Access Token**
   - Use Google OAuth 2.0 Playground: https://developers.google.com/oauthplayground
   - Select scope: `https://www.googleapis.com/auth/drive.file`
   - Click "Authorize APIs"
   - Click "Exchange authorization code for tokens"
   - Copy the **Access Token**

### Step 2: Configure Environment Variables

Add the access token to your Supabase environment variables:

```bash
# In Supabase Dashboard → Settings → Config → Environment Variables
GDRIVE_ACCESS_TOKEN=your-long-lived-access-token-here
```

### Step 3: Update Edge Function

The function now supports both methods:
1. **Pre-generated access token** (recommended for production)
2. **JWT-based authentication** (for future implementation)

## Alternative: Service Account with Proper JWT Signing

### Option A: Use Google Auth Library

Replace the JWT generation with Google's official auth library:

```typescript
// In package.json
{
  "dependencies": {
    "google-auth-library": "^9.0.0"
  }
}

// In index.ts
import { GoogleAuth } from 'google-auth-library';

async function getOAuthToken(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    keyFile: '/path/to/service-account-key.json'
  });
  
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token!;
}
```

### Option B: Manual JWT Signing

Implement proper RS256 signing using the private key:

```typescript
import * as crypto from 'crypto';

function signJWT(header: string, payload: string, privateKey: string): string {
  const data = `${header}.${payload}`;
  const signature = crypto.sign('sha256', Buffer.from(data), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  });
  
  return signature.toString('base64url');
}
```

## Quick Fix for Testing

For immediate testing, use the pre-generated access token approach:

1. **Generate token** using Google OAuth Playground
2. **Set environment variable** in Supabase
3. **Redeploy function**

## Production Implementation

For production, implement proper service account authentication:

1. **Use Google Auth Library** for reliable JWT signing
2. **Implement token caching** to avoid rate limits
3. **Add token refresh** logic for long-term use
4. **Monitor token usage** and implement rotation

## Testing the Fix

1. **Set GDRIVE_ACCESS_TOKEN** in Supabase environment variables
2. **Redeploy the function**:
   ```bash
   npx supabase@latest functions deploy upload-to-drive
   ```
3. **Test upload** using the test file:
   ```bash
   open test-upload-fixed.html
   ```

## Expected Results

With a valid access token, you should see:
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

### Token Expired
- Generate a new access token
- Consider implementing refresh logic

### Insufficient Permissions
- Verify the token has `https://www.googleapis.com/auth/drive.file` scope
- Check service account has Editor access to the root folder

### Rate Limits
- Implement token caching
- Add retry logic with exponential backoff

## Next Steps

1. **Implement proper JWT signing** using Google Auth Library
2. **Add token refresh logic** for production use
3. **Implement monitoring** for token usage and errors
4. **Add comprehensive logging** for debugging

This fix provides an immediate solution while laying the groundwork for a production-ready authentication system.