# Google OAuth Verification Checklist

This checklist outlines the steps needed to complete Google OAuth verification for MessFlow.

## Domain Verification Status
✅ **Domain `imexglobals.com` is already verified in Google Search Console**
- No further DNS changes needed
- Domain ownership is confirmed

## Google Cloud Console OAuth Consent Screen Setup

### Required Information to Update

1. **App Information**
   - **App name**: `MessFlow`
   - **App logo**: Upload MessFlow logo (ensure it meets Google's requirements)
   - **App domain**: `https://imexglobals.com`
   - **Privacy Policy URL**: `https://imexglobals.com/privacy`
   - **Terms of Service URL**: `https://imexglobals.com/terms`

2. **Developer Contact**
   - **Email**: `support@algoplusit.com`
   - **Website**: `https://algoplusit.com`

3. **Authorized Domains**
   - Add: `imexglobals.com`
   - Add: `algoplusit.com` (if needed for support)

### App Description Requirements

The home page (`https://imexglobals.com`) must:
- ✅ Be publicly accessible (no login required)
- ✅ Describe MessFlow and its purpose
- ✅ Mention Algo Plus as the developer
- ✅ Include visible links to Privacy Policy and Terms of Service

### Current Implementation Status

✅ **Public Landing Page**: `/` route shows MessFlow landing page
✅ **Privacy Policy**: Available at `/privacy` 
✅ **Terms of Service**: Available at `/terms`
✅ **Footer Links**: Landing page includes links to both legal pages
✅ **App Name**: Consistently branded as "MessFlow" throughout

## Manual Steps Required

### 1. Update OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Update the following fields:
   - **App name**: `MessFlow`
   - **App domain**: `https://imexglobals.com`
   - **Privacy Policy URL**: `https://imexglobals.com/privacy`
   - **Terms of Service URL**: `https://imexglobals.com/terms`
   - **Developer contact information**: `support@algoplusit.com`

### 2. Add Authorized Domains
1. In OAuth consent screen settings
2. Under **Authorized domains**
3. Add: `imexglobals.com`
4. Add: `algoplusit.com` (optional, for support)

### 3. Submit for Verification
1. After updating all fields
2. Click **Submit for verification**
3. Google will review the app and contact information
4. May require additional information about data usage

## Post-Verification Steps

### 1. Monitor Verification Status
- Check Google Cloud Console for verification status updates
- Respond to any Google requests for additional information
- Verification typically takes 3-7 business days

### 2. Test OAuth Flow
After verification is complete:
1. Test the OAuth login flow
2. Ensure users can successfully authenticate
3. Verify that the consent screen shows correct branding

### 3. Update Documentation
- Document the verification completion date
- Keep screenshots of successful verification
- Update any internal documentation

## Troubleshooting

### Common Issues
1. **Domain not verified**: Ensure `imexglobals.com` is verified in Google Search Console
2. **Missing legal pages**: Verify `/privacy` and `/terms` routes work correctly
3. **App description**: Ensure landing page clearly describes the app's purpose
4. **Contact information**: Use valid email that receives Google communications

### Verification Rejection Reasons
- Incomplete app description
- Missing or inaccessible privacy policy
- Domain verification issues
- Suspicious data usage claims

## Notes
- Keep this checklist updated as Google's requirements may change
- Maintain consistent branding across all touchpoints
- Ensure legal pages are kept up-to-date with any policy changes