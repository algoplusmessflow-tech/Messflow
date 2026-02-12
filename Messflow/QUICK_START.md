# ⚡ Quick Start - Security Fixes Deployment

## 🚨 CRITICAL: Do These 3 Steps NOW

### Step 1: Deploy SQL Migration (5 minutes)

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to: SQL Editor
3. Copy entire contents of: `supabase/migrations/20250209_security_hardening_rls.sql`
4. Paste and click "Run"
5. Verify success (no red errors)

**Verification:**
```sql
SELECT public FROM storage.buckets WHERE id = 'receipts';
```
Should return: `public = false`

---

### Step 2: Set Environment Variables (5 minutes)

**Local Development:**
```bash
# Create .env file (if not exists)
echo "VITE_APP_URL=http://localhost:5173" > .env
echo "VITE_SUPABASE_URL=your_url" >> .env
echo "VITE_SUPABASE_ANON_KEY=your_key" >> .env
```

**Production (Vercel/Netlify):**
- Add environment variable: `VITE_APP_URL=https://yourdomain.com`
- Redeploy

**Edge Functions:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set ALLOWED_ORIGINS="https://yourdomain.com,http://localhost:5173"
supabase secrets set ENVIRONMENT="production"
```

---

### Step 3: Deploy Secure Edge Function (5 minutes)

```bash
# Backup current version
cp supabase/functions/upload-to-drive/index.ts supabase/functions/upload-to-drive/index_backup.ts

# Use secure version
cp supabase/functions/upload-to-drive/index_SECURE.ts supabase/functions/upload-to-drive/index.ts

# Deploy
supabase functions deploy upload-to-drive

# Verify
supabase functions list
```

---

## ✅ Quick Test (2 minutes)

1. **Login to your app**
2. **Upload a file**
3. **Check it appears correctly**
4. **Try to access file URL directly** (should work for your files only)

---

## 📋 What Was Fixed

✅ **Storage bucket** - Now private (was public)
✅ **RLS policies** - Owner-based access only
✅ **OAuth redirects** - Server-controlled (Login.tsx, Signup.tsx)
✅ **Auth handling** - Token refresh support (auth.tsx)
✅ **CORS headers** - Whitelist only (Edge Function)
✅ **Rate limiting** - 10 requests/minute (Edge Function)
✅ **Logging** - Production-safe (logger.ts)
✅ **File validation** - Type/size checks (fileValidation.ts)

---

## 🔍 Quick Verification Queries

Run in Supabase SQL Editor:

```sql
-- 1. Storage is private?
SELECT id, name, public FROM storage.buckets WHERE id = 'receipts';
-- Expected: public = false

-- 2. RLS policies exist?
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
-- Expected: >= 5

-- 3. Audit logs working?
SELECT COUNT(*) FROM public.audit_logs;
-- Expected: > 0 (after some activity)

-- 4. All tables have RLS?
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected: 0
```

---

## 🆘 Troubleshooting

**"Missing authorization header"**
- User not logged in - refresh page

**"Rate limit exceeded"**
- Wait 1 minute, try again

**"CORS error"**
- Check ALLOWED_ORIGINS includes your domain
- Redeploy Edge Function

**"Cannot access file"**
- Check SQL migration ran successfully
- Verify file path includes user ID

---

## 📚 Full Documentation

- **Detailed Guide:** `SECURITY_FIXES_GUIDE.md`
- **Deployment Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Audit Summary:** `SECURITY_AUDIT_SUMMARY.md`

---

## ⏱️ Total Time: ~15 minutes

You're done! Your app is now secure. 🎉

---

**Need Help?** Check the full guides or Supabase logs for errors.
