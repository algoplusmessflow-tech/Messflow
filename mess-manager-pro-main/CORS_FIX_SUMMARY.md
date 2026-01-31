# CORS Fix Summary: Google Drive Upload via Supabase Edge Function

## Issue Identified
`TypeError: Failed to fetch` when uploading receipts to Google Drive via Supabase Edge Function. The issue was caused by incorrect CORS headers that prevented proper preflight (OPTIONS) requests from succeeding.

## Root Cause
The Edge Function was using incorrect CORS headers that didn't match Supabase's recommended configuration for `supabase.functions.invoke()` calls.

### Before (Incorrect)
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### After (Correct)
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## Changes Made

### 1. Edge Function CORS Headers Fixed
**File**: `supabase/functions/upload-to-drive/index.ts`

**Changes**:
- Updated `Access-Control-Allow-Headers` to include Supabase's required headers: `authorization, x-client-info, apikey, content-type`
- Moved `corsHeaders` declaration outside try block to ensure it's available in error responses
- Ensured all Response objects include `...corsHeaders` in their headers

**Impact**: Fixes preflight OPTIONS requests and allows proper authentication headers to pass through.

### 2. Frontend Upload Function Enhanced
**File**: `src/lib/google-drive.ts`

**Changes**:
- Added minimal logging for debugging:
  - `console.log('Calling upload-to-drive function', { fileName, folder, functionUrl })`
  - `console.error('Function response error', { status, errorText })`
  - `console.log('Function response', { data })`
  - `console.error('Upload error from function', { error })`

**Impact**: Provides visibility into upload process for debugging in browser console.

### 3. Authentication Pattern Verified
**File**: `src/lib/google-drive.ts`

**Verification**: The frontend upload function already uses the correct authentication pattern:
- Gets session token via `supabase.auth.getSession()`
- Includes `Authorization: Bearer ${token}` header
- Uses FormData with correct fields: `file`, `folder`, `filename`
- Calls the correct Edge Function URL: `/functions/v1/upload-to-drive`

## Files Modified

### Modified Files:
1. **`supabase/functions/upload-to-drive/index.ts`**
   - Fixed CORS headers to match Supabase requirements
   - Moved corsHeaders declaration for proper scope
   - Ensured all responses include proper CORS headers

2. **`src/lib/google-drive.ts`**
   - Added comprehensive logging for debugging
   - Maintained existing authentication pattern

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
   - ✅ Status code is 200 (or well-defined 4xx/5xx with JSON)
   - ✅ Request method is POST
   - ✅ Authorization header is present
   - ✅ Response body contains JSON with success/error

### 3. Console Logging Verification
1. **Open DevTools → Console tab**
2. **Trigger upload** and verify logs:
   - ✅ `Calling upload-to-drive function` with file details
   - ✅ `Function response` with result data
   - ✅ Any error logs if upload fails

### 4. Supabase Edge Function Logs
1. **Go to Supabase Dashboard → Functions**
2. **Check `upload-to-drive` function logs**
3. **Look for**:
   - ✅ No CORS-related errors
   - ✅ `Upload error:` entries if Google Drive returns errors
   - ✅ Successful upload completions

### 5. Expected Success Response
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

### 6. Common Error Scenarios
- **CORS Error**: Should be resolved with new headers
- **Authentication Error**: Check session token validity
- **Google Drive Error**: Check service account permissions
- **File Size Error**: Check file size limits (5MB max)

## Verification Steps

### Step 1: Check Network Tab
- Look for OPTIONS preflight request (should succeed with 200)
- Look for POST request to upload-to-drive (should succeed with 200)
- Verify Authorization header is present in POST request

### Step 2: Check Console Logs
- Verify upload function is being called
- Check for any error messages
- Verify response data is received

### Step 3: Check Supabase Logs
- Verify Edge Function is receiving requests
- Check for any authentication or processing errors
- Verify Google Drive API calls are successful

## Next Steps

1. **Deploy the updated Edge Function**
2. **Test upload functionality**
3. **Monitor logs for any remaining issues**
4. **Verify files appear in Google Drive**

The CORS issue should now be resolved, and you should see successful upload requests in the Network tab along with proper console logging for debugging.