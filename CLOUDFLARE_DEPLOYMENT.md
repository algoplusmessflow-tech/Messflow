# Cloudflare Pages Deployment Setup

## ⚠️ IMPORTANT: Fix Git Submodules Issue First

If you're getting this error:
```
fatal: No url found for submodule path 'Messflow' in .gitmodules
```

**Quick Fix (PowerShell):**
```powershell
cd "c:\Users\SAHARA\Downloads\MessFlow- Algoplus\mess-manager-pro-main"

# Pull latest changes
git pull origin main --rebase

# Push your changes
git push origin main
```

The workflow file has already been updated to disable submodules.

---

## Required GitHub Secrets

To enable automatic deployment to Cloudflare Pages, you need to add the following secrets to your GitHub repository:

### 1. Get Your Cloudflare Account ID
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account (top right)
3. Copy the Account ID from the URL or sidebar

### 2. Create Cloudflare API Token
1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Cloudflare Pages" template or create custom:
   - Account: Cloudflare Pages: Edit
   - Account: Workers KV Storage: Edit (if needed)
4. Copy the generated token

### 3. Add Secrets to GitHub
1. Go to your GitHub repository: https://github.com/algoplusmessflow-tech/Messflow
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |
| `VITE_SUPABASE_URL` | `https://wgmbwjzvgxvqvpkgmydy.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_CLOUDINARY_CLOUD_NAME` | `dpgm0tzyn` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `Mess-Flow` |

### 4. Trigger Deployment
After adding secrets:
1. Go to **Actions** tab in GitHub
2. Click "Deploy to Cloudflare Pages"
3. Click "Run workflow"

## Manual Deployment

If you prefer to deploy manually:

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=messflow
```

## Verify Deployment
- Check GitHub Actions for build status
- Visit: https://messflow.pages.dev
