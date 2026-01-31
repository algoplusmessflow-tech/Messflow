# Google OAuth Debug Checklist

## 1. Supabase Anon Key (CRITICAL)

- [x] Get the **anon public** key from Supabase Dashboard → Settings → API
- [x] Key must start with `eyJ...` (it's a JWT)
- [ ] Update `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`
- [ ] Update `VITE_SUPABASE_PUBLISHABLE_KEY` in Cloudflare Pages environment variables

## 2. Supabase Google Provider

- [ ] Go to **Supabase Dashboard** → **Authentication** → **Providers**
- [ ] Confirm **Google** toggle is **ON**
- [ ] Confirm **Client ID** is filled (from Google Cloud Console)
- [ ] Confirm **Client Secret** is filled (from Google Cloud Console)
- [ ] Click **Save**

## 3. Google Cloud OAuth Configuration

- [ ] Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
- [ ] Click on your OAuth 2.0 Client ID
- [ ] Verify **Authorized redirect URIs** contains:
https://wgmbwjzvgxvqvpkgmydy.supabase.co/auth/v1/callback


- [ ] Verify **Authorized JavaScript Origins** contains:
https://wgmbwjzvgxvqvpkgmydy.supabase.co

## 4. Git Commands to Push to GitHub

Run these commands in your terminal:

```bash
cd "C:\Users\SAHARA\Downloads\MessFlow- Algoplus\mess-manager-pro-main"

# Initialize git if not already (skip if already a git repo)
git init

# Add remote if needed
git remote add origin https://github.com/algoplusmessflow-tech/Messflow.git

# Stage the changes
git add .env src/integrations/supabase/client.ts docs/google-oauth-debug-checklist.md

# Commit
git commit -m "fix: Update Supabase anon key and add OAuth debug logging

- Fixed invalid VITE_SUPABASE_PUBLISHABLE_KEY (was not a valid JWT)
- Added development-only debug logging for Supabase config
- Created OAuth troubleshooting checklist

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Push to GitHub
git push -u origin main