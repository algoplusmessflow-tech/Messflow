# Google Drive Upload Test Guide

This guide helps you test the Google Drive upload functionality in your Mess Manager Pro application.

## Prerequisites

Before testing, ensure you have:

1. **Supabase Edge Function Deployed**
   ```bash
   cd mess-manager-pro-main
   supabase functions deploy upload-to-drive
   ```

2. **Environment Variables Set**
   In Supabase Dashboard → Functions → upload-to-drive → Settings:
   - `GDRIVE_SERVICE_ACCOUNT_EMAIL`: `mess-manager-drive-uploader@messflow-486008.iam.gserviceaccount.com`
   - `GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY`: [Full private key from JSON file]
   - `GDRIVE_ROOT_FOLDER_ID`: `1hFLjKyIVRcTH0s09igFIDt62MAxduH9I`

3. **Google Drive Folder Shared**
   - Share folder `1hFLjKyIVRcTH0s09igFIDt62MAxduH9I` with service account
   - Set permission to **Editor**

4. **User Authentication**
   - User must be logged in via Supabase
   - Valid auth session required for API calls

## Test Methods

### Method 1: Browser Test (Visual)

1. Open `test-upload.html` in your browser
2. Select an image file (max 5MB)
3. Click "Upload to Google Drive"
4. Note: This is a demonstration - requires actual authentication

### Method 2: Node.js Test (Command Line)

1. Install dependencies:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Run the test script:
   ```bash
   node test-upload.js
   ```

3. The script will:
   - Check authentication status
   - Create a test PNG file
   - Upload to Google Drive via Edge Function
   - Verify file accessibility

### Method 3: In-App Testing

Test the actual components in your application:

1. **Receipt Upload** (Expenses page)
   - Add new expense with receipt image
   - Verify upload completes successfully
   - Check Google Drive folder for file

2. **Company Logo Upload** (Settings page)
   - Upload company logo
   - Verify upload completes successfully
   - Check logo displays correctly

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

### File Structure in Google Drive
```
Mess Manager Pro Files/
├── mess-manager/
│   ├── receipts/
│   │   └── receipt-2024-01-01.jpg
│   ├── logos/
│   │   └── company-logo.png
│   └── avatars/
│       └── user-avatar.jpg
```

## Troubleshooting

### Authentication Errors
- Ensure user is logged in via Supabase
- Check that auth token is valid
- Verify Supabase URL and keys are correct

### Upload Failures
- Check file size (max 5MB)
- Verify file type (images only)
- Ensure Google Drive API is enabled
- Check service account permissions

### File Access Issues
- Verify files are set to public access
- Check that Edge Function sets permissions correctly
- Test generated URLs directly in browser

### Edge Function Errors
- Check Supabase Edge Function logs
- Verify environment variables are set
- Ensure Google Cloud project has billing enabled

## Test Commands Summary

```bash
# Deploy Edge Function
supabase functions deploy upload-to-drive

# Test via Node.js
node test-upload.js

# Check function status
supabase functions list

# View function logs
supabase functions logs upload-to-drive
```

## Next Steps

After successful testing:

1. **Remove Test Files** (optional):
   ```bash
   rm test-upload.html test-upload.js README-TEST.md
   ```

2. **Update Production**:
   - Deploy to production environment
   - Set production environment variables
   - Test in production

3. **Monitor Usage**:
   - Check Google Drive storage usage
   - Monitor Edge Function performance
   - Track upload success rates

## Support

If you encounter issues:

1. Check the [Google Drive Setup Checklist](docs/google-drive-setup-checklist.md)
2. Review Supabase Edge Function logs
3. Verify Google Cloud API quotas and billing
4. Test Google Drive API directly using Google's API explorer