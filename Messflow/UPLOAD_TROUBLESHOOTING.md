# Upload Troubleshooting Guide

## Issue: "Failed to fetch" Error

This guide helps you diagnose and fix the "Failed to fetch" error when uploading receipts to Google Drive.

## Quick Checklist

- [ ] Edge Functions deployed ✅
- [ ] Environment variables configured ✅
- [ ] CORS headers properly set ✅
- [ ] Authentication working ✅
- [ ] Google Drive API access ✅

## Step 1: Verify Function Deployment

### Check Function Status
1. Go to your Supabase Dashboard
2. Navigate to **Functions** section
3. Verify both functions are deployed and active:
   - `upload-to-drive` ✅
   - `create-tenant-folders` ✅

### Test Function Directly
Open your browser and test the function URL directly:

```
https://wgmbwjzvgxvqvpkgmydy.supabase.co/functions/v1/upload-to-drive
```

You should see a response like:
```json
{
  "error": "Method not allowed"
}
```

If you see a 404 or connection error, the function isn't deployed properly.

## Step 2: Check Environment Variables

### Required Variables in Supabase Dashboard
Go to **Settings → Config → Environment Variables** and verify:

```bash
# Google Drive Configuration
GDRIVE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GDRIVE_ROOT_FOLDER_ID=your-root-folder-id

# Supabase Configuration
SUPABASE_URL=https://wgmbwjzvgxvqvpkgmydy.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Verify Private Key Format
The private key must be properly formatted with escaped newlines:

```bash
# Correct format:
GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# NOT this:
GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

## Step 3: Test CORS Configuration

### Use the Test File
Open `test-upload-fixed.html` in your browser and:

1. Click **"Test CORS Only"** - Should show success
2. Select a file and click **"Test Upload"** - Should upload successfully

### Check Browser Console
Open DevTools (F12) and check the Console tab for:
- CORS errors
- Network request failures
- Authentication errors

### Check Network Tab
In DevTools → Network tab:
1. Filter by `upload-to-drive`
2. Look for OPTIONS requests (CORS preflight)
3. Verify responses have proper CORS headers:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: POST, OPTIONS
   Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
   ```

## Step 4: Verify Authentication

### Check Session Token
In your React app, verify you have a valid session:

```typescript
// In your component
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

if (!session) {
  console.error('No session found');
  return;
}

console.log('Access token:', session.access_token);
```

### Test with Manual Token
Use the test HTML file with a manual token:

```javascript
// Get token from your app
const token = session.access_token;

// Use in test
const response = await fetch(FUNCTION_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});
```

## Step 5: Check Google Drive Configuration

### Verify Service Account
1. Go to Google Cloud Console
2. Navigate to **IAM & Admin → Service Accounts**
3. Verify your service account exists and has:
   - **Role**: Project → Editor (or custom role with Drive access)
   - **Key**: JSON key downloaded and content copied to env var

### Verify Root Folder
1. Go to Google Drive
2. Navigate to your root folder
3. Get the folder ID from URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID
   ```
4. Verify this ID is in `GDRIVE_ROOT_FOLDER_ID`

### Check Folder Permissions
1. In Google Drive, right-click your root folder
2. Click **Share**
3. Verify the service account email has **Editor** access

## Step 6: Debug Function Logs

### Check Supabase Function Logs
1. Go to Supabase Dashboard → Functions
2. Click on `upload-to-drive` function
3. Check the **Logs** tab for:
   - Function execution errors
   - Environment variable access
   - Google API errors

### Common Log Messages

#### "Google Drive environment variables not configured"
```bash
Error: Google Drive environment variables not configured
```
**Fix**: Check environment variables are set correctly.

#### "OAuth token request failed"
```bash
Error: OAuth token request failed: 400 Bad Request
```
**Fix**: Verify service account email and private key.

#### "Base folder not found or inaccessible"
```bash
Error: Base folder not found or inaccessible: 404 Not Found
```
**Fix**: Verify `GDRIVE_ROOT_FOLDER_ID` is correct.

#### "Failed to create folder receipts"
```bash
Error: Failed to create folder receipts: 403 Forbidden
```
**Fix**: Verify service account has Editor access to root folder.

## Step 7: Test Google Drive API Directly

### Use Google API Explorer
1. Go to [Google Drive API Explorer](https://developers.google.com/drive/api/v3/reference/files/create)
2. Authenticate with your service account
3. Test creating a folder in your root folder

### Manual API Test
```bash
# Get OAuth token
curl -X POST https://oauth2.googleapis.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=YOUR_JWT"

# Create folder
curl -X POST https://www.googleapis.com/drive/v3/files \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-folder",
    "mimeType": "application/vnd.google-apps.folder",
    "parents": ["YOUR_ROOT_FOLDER_ID"]
  }'
```

## Step 8: Common Issues and Solutions

### Issue: "Failed to fetch" with no error details
**Causes**:
- Function not deployed
- Network connectivity issues
- CORS not configured

**Solutions**:
1. Verify function deployment
2. Check browser network tab
3. Test with `test-upload-fixed.html`

### Issue: "Unauthorized" error
**Causes**:
- Invalid or expired session token
- Missing Authorization header

**Solutions**:
1. Refresh session: `await supabase.auth.refreshSession()`
2. Verify token format: `Bearer ${token}`

### Issue: "Method not allowed"
**Causes**:
- Function deployed but not accessible
- Wrong HTTP method

**Solutions**:
1. Verify function URL is correct
2. Use POST method for uploads
3. Use OPTIONS for CORS preflight

### Issue: "Network Error" or timeout
**Causes**:
- Function execution timeout
- Large file size
- Network issues

**Solutions**:
1. Reduce file size (< 10MB recommended)
2. Check function timeout settings
3. Test with smaller files

## Step 9: Production Checklist

### Before Going Live
- [ ] Test upload with multiple file types
- [ ] Verify folder structure creation
- [ ] Test with multiple tenants
- [ ] Monitor function execution time
- [ ] Set up error monitoring
- [ ] Configure Google Drive API quotas

### Monitoring
- Monitor function execution logs
- Track upload success/failure rates
- Watch Google Drive API quota usage
- Set up alerts for function errors

## Step 10: Getting Help

### If Issues Persist
1. **Check Function Logs**: Supabase Dashboard → Functions → Logs
2. **Browser Console**: Look for detailed error messages
3. **Network Tab**: Analyze request/response details
4. **Test Files**: Use `test-upload-fixed.html` for isolated testing

### Contact Support
If you're still having issues:

1. **Function Logs**: Copy relevant log entries
2. **Error Details**: Browser console errors
3. **Network Details**: Request/response from Network tab
4. **Environment**: List of configured environment variables

## Quick Fix Commands

### Redeploy Functions
```bash
cd mess-manager-pro-main
npx supabase@latest functions deploy upload-to-drive
npx supabase@latest functions deploy create-tenant-folders
```

### Check Environment Variables
```bash
# List all env vars
npx supabase@latest config list

# Set specific env var
npx supabase@latest config set GDRIVE_SERVICE_ACCOUNT_EMAIL="your-email@project.iam.gserviceaccount.com"
```

### Test Function
```bash
# Test with curl
curl -X POST https://wgmbwjzvgxvqvpkgmydy.supabase.co/functions/v1/upload-to-drive \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Summary

The "Failed to fetch" error is typically caused by:
1. **CORS issues** - Fixed with proper headers
2. **Authentication problems** - Verify session tokens
3. **Environment variables** - Check Google Drive config
4. **Function deployment** - Ensure functions are deployed

Use the test files and debugging steps above to identify and resolve the specific issue in your environment.