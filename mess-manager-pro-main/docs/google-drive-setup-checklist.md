# Google Drive Setup Checklist

This checklist guides you through replacing Cloudinary with Google Drive for file uploads in Mess Manager Pro.

## 1. Google Cloud / Google Drive Setup

### Create Google Cloud Project
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create a new project or select existing project
- [ ] Note down the project ID

### Enable Google Drive API
- [ ] In Google Cloud Console, go to **APIs & Services** → **Library**
- [ ] Search for "Google Drive API"
- [ ] Click **Enable**

### Create Service Account
- [ ] Go to **APIs & Services** → **Credentials**
- [ ] Click **Create Credentials** → **Service Account**
- [ ] Fill in service account details:
  - **Service account name**: `mess-manager-drive-uploader`
  - **Service account ID**: auto-generated
  - **Description**: Service account for Mess Manager Pro file uploads
- [ ] Click **Create and Continue**
- [ ] **Note**: Use the provided service account email: `mess-manager-drive-uploader@messflow-486008.iam.gserviceaccount.com`

### Configure Service Account Permissions
- [ ] Add role: **Project** → **Editor** (or create custom role with Drive permissions)
- [ ] Click **Continue** → **Done**

### Create Service Account Key
- [ ] Go to **APIs & Services** → **Service Accounts**
- [ ] Find your service account and click the **3-dot menu**
- [ ] Select **Manage Keys**
- [ ] Click **Add Key** → **Create New Key**
- [ ] Select **JSON** format
- [ ] Click **Create**
- [ ] **IMPORTANT**: Download and securely store the JSON key file
- [ ] Extract these values from the JSON file:
  - **Service Account Email**: `mess-manager-drive-uploader@messflow-486008.iam.gserviceaccount.com`
  - **Private Key**: Use the provided private key from the JSON file

### Create Google Drive Folder
- [ ] Use the provided Google Drive folder: [https://drive.google.com/drive/folders/1hFLjKyIVRcTH0s09igFIDt62MAxduH9I?usp=sharing](https://drive.google.com/drive/folders/1hFLjKyIVRcTH0s09igFIDt62MAxduH9I?usp=sharing)
- [ ] **Folder ID**: `1hFLjKyIVRcTH0s09igFIDt62MAxduH9I`
- [ ] Ensure the folder is shared with the service account

### Share Folder with Service Account
- [ ] Right-click the folder → **Share**
- [ ] Add the service account email: `mess-manager-drive-uploader@messflow-486008.iam.gserviceaccount.com`
- [ ] Set permission to **Editor**
- [ ] Click **Send**

## 2. Supabase Edge Function Configuration

### Deploy the Edge Function
```bash
cd mess-manager-pro-main
supabase functions deploy upload-to-drive
```

### Verify Function Deployment
```bash
supabase functions list
```
Should show `upload-to-drive` in the list.

### Set Edge Function Environment Variables
In Supabase Dashboard → **Functions** → **upload-to-drive** → **Settings**:

- [ ] Set `GDRIVE_SERVICE_ACCOUNT_EMAIL`: `mess-manager-drive-uploader@messflow-486008.iam.gserviceaccount.com`
- [ ] Set `GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY`: Use the private key from the provided JSON file
- [ ] Set `GDRIVE_ROOT_FOLDER_ID`: `1hFLjKyIVRcTH0s09igFIDt62MAxduH9I`

**Alternative via CLI:**
```bash
supabase functions secrets set GDRIVE_SERVICE_ACCOUNT_EMAIL="mess-manager-drive-uploader@messflow-486008.iam.gserviceaccount.com"
supabase functions secrets set GDRIVE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCOPC83haS7LUU/\npsyrP87A4E6iQaYTN9ux7XIfHSUAbrwk/CGK6krmmQH+vZM6tUjjq0RXZAKnJFsA\niSrL2rR8JGzN7E4Y7jkpYDBCqALYMJ3JbHBRx+KifEWZM/QlvzNwMyqkcT9WGzeB\nOOLDHcUmp9aZHAgPNe+2ASuIkTg2dCaqeUvS4QgTJrmjUdMLdRJsNrRRdn8ip0dR\nGI2abF74gPbvTMffT3zrnJDIHwUkgURll0EZ/2KIaeZjNDsWRKVXUWpASeXrPeNr\njNeC61EW5mIBtaRIJ/eaK9xSLV/v8qGOlQVbBCsu5t/qjy19bbNZ4iSaR3cMvFAM\nVRH+Xl2xAgMBAAECggEAEPyFjA0xHOx9ZGpkb4A1jinLokuSTKHDYkav9iDKKjjP\nTeBxlhBAhTUZPKXBx0VesNfjl8c5HOJ13sTC4GkcXGYSO26A7i/HElarNM6xVkXK\nFkPVzyJ+wbZzLmZ6viZNO5VUvqJKtNsXwB490J0FzkXFlm/3U2+20sblftAPBUug\nvWZI0zA8sExsJWBD64ewiqRr4FEhpbLFohBRqmjuJppqtJDjA9Nx3+UMVYCGf30y\nPsRV7tmXY3zV34BYwpehLRoGcK2PwWqjKE/pNFlMSzxKZdlTZRyxC5C5PfTVGGIF\nKd8C+YqREZTMgj1w7VY7E3PNitA6Yr7xFJeqq1Ha1QKBgQC/z81WNjhzvMM1EIu3\nWi7XUnBhiuG4bnwuVwN+H03BLA0gEib9n2uHyxWDO3lrXN1ULpsT7CO09K8seQ/d\ngolr0JDG1/VmNK2vm2W5vRWVhw7QoK+8LUuxw5b5KU6nJwIAlpmF9dIxKOBjpYSq\nsxOt0I0wGrP8P2nl2KkC4GXcXQKBgQC91TuwWlk3eBlnD4bAKB3TVsbnP1cQnSTy\nG7+3h2YAGCMrouIEBZsC6SN07CbSu5bUu5kvsyTQcyLqPxxzIkUMgxtrP7TNdioA\ntT1hyAKJ1f+p+JpBasWy65iZDZKM8t5HI4cgXAcAoksz5J5WxbOvq8tHFUX4hHQR\nuYPFKflRZQKBgC9eqW5GG7DxiB/9wxN38SN6F4jvXIlIt+BV2uX14yT2tRMbiIeQ\nLGUv0VNEh9rs5zgX/nJwGe1hlDVefH2O9FMtAeQph1BDaDV7Iic5vC/eV9lMJbpK\nUWxISmukOOls58CvcKC1scA0QR46zUW+zfhaDdQ4dASywHtkA3FTa7R9AoGBALh3\n7nHXyhyZ62137ATsttb423450dxGKHHQv0OUIm1zBzJPLPylidWRQjBLjwp22gJN\nbnWoytx5FfO1cmr7YUfgW5Ojq4mBCx33APf1CWpx9uhvuU5aeFT+liIcy02GcLOG\ndbffVbqq+xMpVSiTI6JQ+c9Qf9cYt0XGFaNRv4H1AoGAS/MD2ViAlA6Ez1wbFF4m\nl+1Eytf2MF0s6Dw4pk7iIQddkueaOs16ABsFj/oJ3FfkRR5Kxp1Ql30KfvQbkyMF\nO9N/RQapAfwzKVq2wu4b3itmp1ITCYLU7mCvF52hMN2BSatfTU0m9ReR80RfXFbq\nBuXInOdhBmayPLV6hgotPaA=\n-----END PRIVATE KEY-----"
supabase functions secrets set GDRIVE_ROOT_FOLDER_ID="1hFLjKyIVRcTH0s09igFIDt62MAxduH9I"
```

## 3. Cloudflare Pages / Environment Variables

### Update Environment Variables
In Cloudflare Pages dashboard → **Settings** → **Environment variables**:

- [ ] **Keep existing Supabase vars:**
  - `VITE_SUPABASE_URL`: `https://wgmbwjzvgxvqvpkgmydy.supabase.co`
  - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
  - `VITE_SUPABASE_PROJECT_ID`: `wgmbwjzvgxvqvpkgmydy`

- [ ] **Remove Cloudinary vars (if present):**
  - Remove `VITE_CLOUDINARY_CLOUD_NAME`
  - Remove `VITE_CLOUDINARY_UPLOAD_PRESET`

- [ ] **No new client-side vars needed** - Google Drive credentials are server-side only

### Build Settings
- [ ] **Build command**: `npm run build` (no changes needed)
- [ ] **Build output directory**: `dist` (no changes needed)
- [ ] **Environment**: `Production`

## 4. Supabase Schema / RLS (No Changes Needed)

**✅ No schema or RLS changes required**
- The existing `expenses.receipt_url` and `profiles.company_logo_url` columns work with Google Drive URLs
- No database migrations needed
- No RLS policy changes needed

## 5. Testing Checklist

### Test File Upload from App
- [ ] **Receipt Upload:**
  1. Go to Expenses page
  2. Add new expense with receipt image
  3. Verify upload completes successfully
  4. Check that receipt appears in Google Drive folder

- [ ] **Company Logo Upload:**
  1. Go to Settings page
  2. Upload company logo
  3. Verify upload completes successfully
  4. Check that logo appears in Google Drive folder

### Verify File Storage
- [ ] **Check Google Drive:**
  1. Go to your Google Drive folder
  2. Verify uploaded files appear with correct folder structure:
     - `mess-manager/receipts/` for receipts
     - `mess-manager/logos/` for company logos
     - `mess-manager/avatars/` for user avatars

- [ ] **Verify Database Storage:**
  1. Check that `receipt_url` and `company_logo_url` columns contain Google Drive URLs
  2. URLs should be in format: `https://drive.google.com/uc?id=FILE_ID` or similar

### Verify App Rendering
- [ ] **Receipt Display:**
  1. View expense with uploaded receipt
  2. Verify receipt image loads and displays correctly
  3. Check that image quality is acceptable

- [ ] **Logo Display:**
  1. View company settings or invoices
  2. Verify company logo displays correctly
  3. Check logo appears in correct size and format

### Test Edge Cases
- [ ] **Large Files:** Try uploading files close to 5MB limit
- [ ] **Invalid Files:** Try uploading non-image files (should be rejected)
- [ ] **Network Issues:** Test with slow connection
- [ ] **Authentication:** Verify uploads fail when not logged in

## 6. Production Deployment

### Deploy to Production
```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages (if using)
# Or deploy to your preferred hosting platform

# Deploy Supabase Edge Function (if not already done)
supabase functions deploy upload-to-drive
```

### Verify Production Environment
- [ ] Test file uploads in production environment
- [ ] Confirm Google Drive folder receives files
- [ ] Verify all app functionality works as expected
- [ ] Check that no Cloudinary references remain

## 7. Cleanup

### Remove Cloudinary Dependencies
- [ ] Delete `src/lib/cloudinary.ts` file
- [ ] Remove any remaining Cloudinary imports from components
- [ ] Update any documentation referencing Cloudinary

### Monitor Usage
- [ ] Monitor Google Drive storage usage
- [ ] Check Supabase Edge Function logs for errors
- [ ] Verify no Cloudinary API calls are being made

## Troubleshooting

### Common Issues

**"Service account not authorized"**
- Verify service account has Editor role on the project
- Check that the folder is shared with the service account email
- Ensure Google Drive API is enabled

**"File not found in Google Drive"**
- Check that the folder ID is correct
- Verify the service account can access the root folder
- Check Edge Function logs for errors

**"Upload fails with authentication error"**
- Verify Supabase Edge Function has correct environment variables
- Check that the private key format is correct (includes BEGIN/END lines)
- Ensure the user is authenticated in the app

**"Files appear but URLs don't work"**
- Verify files are set to public access in Google Drive
- Check that the Edge Function is setting file permissions correctly
- Test the generated URLs directly in browser

### Getting Help
- Check Supabase Edge Function logs in dashboard
- Verify Google Cloud API quotas and billing
- Test Google Drive API directly using Google's API explorer