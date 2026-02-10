# 🚀 Security Deployment Checklist

## Pre-Deployment Verification

### ✅ Step 1: Database Migration (CRITICAL - DO FIRST)

1. **Backup your database**
   ```bash
   # In Supabase Dashboard: Database → Backups → Create Backup
   ```

2. **Run the security migration**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `supabase/migrations/20250209_security_hardening_rls.sql`
   - Paste and run the entire script
   - Verify no errors in output

3. **Verify storage bucket is private**
   ```sql
   SELECT id, name, public FROM storage.buckets WHERE id = 'receipts';
   ```
   Expected result: `public = false`

4. **Verify RLS policies exist**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'objects' 
   AND schemaname = 'storage';
   ```
   Expected: Should see policies like "Users can only view their own receipts"

5. **Test with your account**
   - Upload a file through your app
   - Verify you can see it
   - Try to access another user's file URL directly (should fail)

---

### ✅ Step 2: Environment Variables

1. **Update `.env` file**
   ```bash
   # Copy the example
   cp .env.example .env
   
   # Edit with your values
   VITE_APP_URL=https://yourdomain.com
   VITE_SUPABASE_URL=your_actual_url
   VITE_SUPABASE_ANON_KEY=your_actual_key
   ```

2. **Set Edge Function secrets**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link your project
   supabase link --project-ref your-project-ref
   
   # Set secrets
   supabase secrets set ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
   supabase secrets set ENVIRONMENT="production"
   
   # Verify secrets are set
   supabase secrets list
   ```

3. **Update production environment**
   - If using Vercel/Netlify: Add `VITE_APP_URL` to environment variables
   - Redeploy your application

---

### ✅ Step 3: Code Updates

1. **Auth improvements** ✅ (Already done)
   - [x] `src/lib/auth.tsx` - TOKEN_REFRESHED handling

2. **OAuth redirect security** ✅ (Already done)
   - [x] `src/pages/Login.tsx` - Secure redirect

3. **Logger utility** ✅ (Already done)
   - [x] `src/lib/logger.ts` - Created

4. **File validation** ✅ (Already done)
   - [x] `src/lib/fileValidation.ts` - Created

5. **Secure Edge Function** ✅ (Already done)
   - [x] `supabase/functions/upload-to-drive/index_SECURE.ts` - Created

6. **Update Signup.tsx** (TODO - if exists)
   ```typescript
   // Find similar OAuth code and update:
   redirectTo: import.meta.env.VITE_APP_URL 
     ? `${import.meta.env.VITE_APP_URL}/dashboard`
     : `${window.location.origin}/dashboard`,
   ```

7. **Replace Edge Function** (TODO)
   ```bash
   # Backup current version
   cp supabase/functions/upload-to-drive/index.ts supabase/functions/upload-to-drive/index_OLD.ts
   
   # Replace with secure version
   cp supabase/functions/upload-to-drive/index_SECURE.ts supabase/functions/upload-to-drive/index.ts
   
   # Deploy
   supabase functions deploy upload-to-drive
   ```

8. **Update file upload components** (TODO)
   - Find all file upload handlers
   - Add validation:
   ```typescript
   import { validateFile } from '@/lib/fileValidation';
   
   const handleFileUpload = (file: File) => {
     const validation = validateFile(file);
     if (!validation.valid) {
       toast.error(validation.error);
       return;
     }
     // Continue with upload...
   };
   ```

---

### ✅ Step 4: Testing

1. **Test authentication flow**
   - [ ] Login with email/password
   - [ ] Login with Google OAuth
   - [ ] Verify redirect goes to correct URL
   - [ ] Test logout
   - [ ] Test token refresh (wait 1 hour, app should still work)

2. **Test file upload security**
   - [ ] Upload a valid file (should work)
   - [ ] Try to upload invalid file type (should fail)
   - [ ] Try to upload file > 5MB (should fail)
   - [ ] Verify file is stored with owner_id in path
   - [ ] Try to access another user's file URL (should fail)

3. **Test RLS policies**
   - [ ] Create test user #1
   - [ ] Create test user #2
   - [ ] Add data as user #1
   - [ ] Login as user #2
   - [ ] Verify user #2 cannot see user #1's data

4. **Test rate limiting**
   - [ ] Make 11+ rapid requests to Edge Function
   - [ ] Verify 11th request returns 429 error
   - [ ] Wait 1 minute
   - [ ] Verify requests work again

5. **Test CORS**
   - [ ] Test from your production domain (should work)
   - [ ] Test from unauthorized domain (should fail)
   - [ ] Check browser console for CORS errors

---

### ✅ Step 5: Monitoring & Verification

1. **Check audit logs**
   ```sql
   -- View recent activity
   SELECT 
     al.action,
     al.table_name,
     al.created_at,
     u.email
   FROM public.audit_logs al
   LEFT JOIN auth.users u ON al.user_id = u.id
   ORDER BY al.created_at DESC
   LIMIT 20;
   ```

2. **Monitor Edge Function logs**
   - Supabase Dashboard → Edge Functions → upload-to-drive → Logs
   - Look for errors or suspicious activity

3. **Check storage access**
   ```sql
   -- View storage objects
   SELECT 
     name,
     created_at,
     metadata->>'owner' as owner
   FROM storage.objects
   WHERE bucket_id = 'receipts'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

4. **Verify RLS is working**
   ```sql
   -- This should return 0 if RLS is properly enabled
   SELECT COUNT(*) 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND rowsecurity = false;
   ```

---

## Post-Deployment

### Immediate Actions (First 24 hours)

- [ ] Monitor error logs for any issues
- [ ] Test all critical user flows
- [ ] Check for any user-reported issues
- [ ] Verify no data leaks in audit logs

### Weekly Actions

- [ ] Review audit logs for suspicious activity
- [ ] Check Edge Function error rates
- [ ] Monitor storage usage
- [ ] Review failed login attempts

### Monthly Actions

- [ ] Security audit of new code
- [ ] Update dependencies (`npm audit fix`)
- [ ] Review and rotate secrets if needed
- [ ] Backup database

---

## Rollback Plan

If something goes wrong:

1. **Database rollback**
   ```sql
   -- Restore from backup in Supabase Dashboard
   -- Or manually revert policies:
   
   -- Make bucket public again (temporary)
   UPDATE storage.buckets SET public = true WHERE id = 'receipts';
   
   -- Drop new policies
   DROP POLICY IF EXISTS "Users can only view their own receipts" ON storage.objects;
   -- ... (drop other new policies)
   ```

2. **Code rollback**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push
   
   # Or restore old Edge Function
   cp supabase/functions/upload-to-drive/index_OLD.ts supabase/functions/upload-to-drive/index.ts
   supabase functions deploy upload-to-drive
   ```

3. **Environment variables rollback**
   ```bash
   # Remove new secrets
   supabase secrets unset ALLOWED_ORIGINS
   ```

---

## Support & Troubleshooting

### Common Issues

**Issue: "Missing authorization header"**
- Check that user is logged in
- Verify Supabase client is initialized correctly
- Check browser console for auth errors

**Issue: "Rate limit exceeded"**
- Wait 1 minute and try again
- Check if rate limit is too strict (adjust in Edge Function)

**Issue: "CORS error"**
- Verify ALLOWED_ORIGINS is set correctly
- Check that your domain is in the list
- Verify Edge Function is deployed with new code

**Issue: "Cannot access file"**
- Verify RLS policies are applied
- Check file path includes user ID
- Verify storage bucket is configured correctly

### Getting Help

1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Review audit_logs table for clues
4. Check Edge Function logs for detailed errors

---

## Security Checklist Summary

- [x] SQL migration created
- [ ] SQL migration deployed
- [ ] Storage bucket made private
- [ ] RLS policies applied
- [ ] Environment variables set
- [ ] Edge Function secrets configured
- [x] Auth improvements deployed
- [x] OAuth redirects secured
- [x] Logger utility created
- [x] File validation created
- [x] Secure Edge Function created
- [ ] Edge Function deployed
- [ ] All tests passed
- [ ] Monitoring configured
- [ ] Team notified

---

**Last Updated:** February 2025
**Version:** 2.2 (Security Hardening)
