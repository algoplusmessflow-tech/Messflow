# Google Drive Receipts Setup Checklist

This checklist ensures your Google Drive receipt upload functionality is properly configured and working.

## Supabase Edge Function Secrets

Set these environment variables in your Supabase project:

- **SUPABASE_URL**: Your Supabase project URL (e.g., `https://wgmbwjzvgxvqvpkgmydy.supabase.co`)
- **SUPABASE_ANON_KEY**: Your Supabase anonymous key
- **GDRIVE_SERVICE_ACCOUNT_EMAIL**: Service account email from Google Cloud
- **GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY**: Service account private key (PEM format)
- **GDRIVE_ROOT_FOLDER_ID**: Google Drive folder ID where receipts will be stored

## Google Cloud Setup

### 1. Create Service Account
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing
- Navigate to IAM & Admin → Service Accounts
- Create service account with role: **Project → Editor**
- Generate and download JSON key file

### 2. Enable Google Drive API
- In Google Cloud Console, navigate to APIs & Services → Library
- Search for "Google Drive API"
- Click "Enable"

### 3. Configure Service Account Key
- Extract the private key from the JSON file
- Format it as a single line with escaped newlines for the environment variable
- Example format:
  ```
  -----BEGIN PRIVATE KEY-----
  MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
  -----END PRIVATE KEY-----
  ```

### 4. Share Root Folder
- Create a folder in Google Drive for receipts
- Get the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID`
- Share the folder with the service account email as **Editor**

## Frontend Environment Variables

Set these in your Cloudflare Pages environment:

- **VITE_SUPABASE_URL**: Same as SUPABASE_URL above
- **VITE_SUPABASE_ANON_KEY**: Same as SUPABASE_ANON_KEY above

## Folder Structure

The system creates this structure in Google Drive:

```
<GDRIVE_ROOT_FOLDER_ID>/
├── <UserFolderName>/
│   ├── receipts/
│   │   ├── receipt1.jpg
│   │   ├── receipt2.png
│   │   └── ...
│   └── <OtherSubfolders>/
└── <AnotherUserFolder>/
    └── receipts/
```

### User Folder Naming
- Uses business name from profiles table if available
- Falls back to email prefix (before @)
- Falls back to user ID
- Appends first 8 characters of user ID for uniqueness
- Example: `Deepak_T_74f2d4bf`

## Testing Steps

### 1. Mobile Testing
1. Log in on a mobile device
2. Navigate to Expenses page
3. Click "Add Expense"
4. Tap "Take Photo" button
5. Capture a photo of a receipt
6. Fill in expense details and save
7. Verify:
   - `upload-to-drive` OPTIONS and POST both succeed (status 200)
   - New folder appears in Drive with user's name
   - Receipt is stored in the receipts subfolder
   - Receipt URL is accessible

### 2. Desktop Testing
1. Log in on desktop
2. Navigate to Expenses page
3. Click "Add Expense"
4. Use "Choose File" to upload a receipt image
5. Fill in expense details and save
6. Verify same as mobile testing

### 3. Authentication Testing
1. Try uploading without authentication
2. Verify 401 Unauthorized response
3. Try with invalid/expired token
4. Verify proper error handling

### 4. Storage Limits Testing
1. Upload files near the storage limit
2. Verify proper error messages
3. Test storage usage tracking

## Security Considerations

- ✅ JWT tokens are properly signed with RS256
- ✅ OAuth tokens are generated per request
- ✅ Files are made publicly accessible after upload
- ✅ CORS headers are properly configured
- ✅ Supabase RLS is enforced
- ✅ Environment variables are stored securely

## Troubleshooting

### Common Issues

1. **"Token failed" error**
   - Check service account private key format
   - Verify service account has Drive API enabled
   - Check service account email matches

2. **"Upload failed" error**
   - Verify root folder ID is correct
   - Check folder is shared with service account
   - Ensure service account has Editor permissions

3. **CORS errors**
   - Verify CORS headers in Edge Function
   - Check frontend is using correct Supabase URL

4. **Authentication errors**
   - Verify Supabase URL and anon key match
   - Check user is properly authenticated
   - Ensure session is active

### Debug Tools

- Use browser Network tab to monitor API calls
- Check Supabase logs for function execution
- Monitor Google Drive API usage in Google Cloud Console
- Use browser console for JavaScript errors

## Production Deployment

### 1. Deploy Edge Function
```bash
npx supabase@latest functions deploy upload-to-drive
```

### 2. Deploy Frontend
```bash
cd mess-manager-pro-main
npm install
npm run build
# Deploy to Cloudflare Pages or your preferred platform
```

### 3. Verify Deployment
- Test all functionality in production environment
- Monitor logs for any issues
- Verify storage limits and quotas
- Test with multiple users

## Maintenance

### Regular Checks
- Monitor Google Drive storage usage
- Check for failed uploads in logs
- Verify service account key hasn't expired
- Review security settings periodically

### Updates
- Keep Supabase Edge Function updated
- Monitor for Google Drive API changes
- Update dependencies as needed
- Review and update security practices

## Support

For issues with this setup:
1. Check this checklist first
2. Review error messages in browser console
3. Check Supabase function logs
4. Verify Google Cloud API quotas
5. Contact support with specific error details