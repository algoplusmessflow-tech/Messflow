# 🔒 Security Fixes Implementation Guide

## ✅ COMPLETED: SQL Migration (Part 1)

The file `supabase/migrations/20250209_security_hardening_rls.sql` has been created with:
- ✅ Storage bucket made private
- ✅ Owner-based storage RLS policies
- ✅ Enhanced RLS policies for all tables
- ✅ Super admin read-only policies
- ✅ Audit logging system
- ✅ Performance indexes

**ACTION REQUIRED:** Run this migration in your Supabase SQL Editor NOW before proceeding.

---

## 🚨 CRITICAL FIXES NEEDED (Part 2 - TypeScript/React)

### Fix #1: Secure OAuth Redirects

**Files to Update:**
1. `src/pages/Login.tsx` (Line 90)
2. `src/pages/Signup.tsx` (similar location)
3. `src/pages/SuperAdminSecurity.tsx` (if exists)

**Current Code (INSECURE):**
```typescript
redirectTo: `${window.location.origin}/dashboard`,  // ❌ Client-controlled
```

**Fixed Code (SECURE):**
```typescript
// Use server-side environment variable
redirectTo: import.meta.env.VITE_APP_URL 
  ? `${import.meta.env.VITE_APP_URL}/dashboard`
  : `${window.location.origin}/dashboard`,
```

**Add to `.env`:**
```bash
VITE_APP_URL=https://yourdomain.com
```

---

### Fix #2: Enhanced Auth State Management

**File:** `src/lib/auth.tsx`

**Add TOKEN_REFRESHED handling:**
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      // Handle token refresh
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      // Handle signed out
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
      
      // Handle signed in
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        setUser(session?.user ?? null);
      }
      
      setLoading(false);
    }
  );

  // Check for existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);
```

---

### Fix #3: Secure CORS Headers (Edge Functions)

**Files to Update:**
1. `supabase/functions/upload-to-drive/index.ts`
2. `supabase/functions/create-tenant-folders/index.ts`

**Current Code (INSECURE):**
```typescript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",  // ❌ WILDCARD!
};
```

**Fixed Code (SECURE):**
```typescript
// Get allowed origins from environment
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",");

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

// In your handler:
serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  // ... rest of your code
  
  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

**Add to Supabase Edge Function Secrets:**
```bash
supabase secrets set ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

---

### Fix #4: Remove Console Logging in Production

**Create:** `src/lib/logger.ts`
```typescript
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) console.log(...args);
  },
  error: (...args: any[]) => {
    if (isDevelopment) console.error(...args);
  },
  warn: (...args: any[]) => {
    if (isDevelopment) console.warn(...args);
  },
  info: (...args: any[]) => {
    if (isDevelopment) console.info(...args);
  },
};
```

**Replace all instances:**
```typescript
// Before:
console.log("User authenticated:", user.id);

// After:
import { logger } from '@/lib/logger';
logger.log("User authenticated:", user.id);
```

---

### Fix #5: Add Rate Limiting to Edge Functions

**Add to Edge Functions:**
```typescript
// Simple in-memory rate limiter (for demo - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (userId: string, maxRequests = 10, windowMs = 60000): boolean => {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
};

// In your handler:
if (!checkRateLimit(user.id)) {
  return createErrorResponse("Rate limit exceeded", 429);
}
```

---

### Fix #6: Content Security Policy

**Add to:** `index.html` (in `<head>`)
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.supabase.co https://accounts.google.com;
  frame-src 'self' https://accounts.google.com;
">
```

---

### Fix #7: Secure File Upload Validation

**Add to file upload handlers:**
```typescript
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large (max 5MB)' };
  }
  
  // Check file extension matches MIME type
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
  };
  
  const validExts = mimeToExt[file.type] || [];
  if (!ext || !validExts.includes(ext)) {
    return { valid: false, error: 'File extension mismatch' };
  }
  
  return { valid: true };
};
```

---

## 📋 DEPLOYMENT CHECKLIST

### Step 1: Database (CRITICAL - DO FIRST)
- [ ] Run `20250209_security_hardening_rls.sql` in Supabase SQL Editor
- [ ] Verify storage bucket is private: `SELECT public FROM storage.buckets WHERE id = 'receipts';`
- [ ] Test file upload with your user account
- [ ] Verify RLS policies: Try accessing another user's data (should fail)

### Step 2: Environment Variables
- [ ] Add `VITE_APP_URL` to `.env`
- [ ] Add `ALLOWED_ORIGINS` to Supabase Edge Function secrets
- [ ] Update production environment variables

### Step 3: Code Updates
- [ ] Update OAuth redirects in Login.tsx, Signup.tsx
- [ ] Update auth.tsx with TOKEN_REFRESHED handling
- [ ] Update Edge Functions with secure CORS
- [ ] Replace console.log with logger utility
- [ ] Add rate limiting to Edge Functions
- [ ] Add file validation to upload handlers
- [ ] Add CSP meta tag to index.html

### Step 4: Testing
- [ ] Test login/signup flow
- [ ] Test file upload (should only see your own files)
- [ ] Test OAuth redirect
- [ ] Test rate limiting (make 11+ requests quickly)
- [ ] Test with different browsers/origins
- [ ] Test super admin access

### Step 5: Monitoring
- [ ] Check audit_logs table for suspicious activity
- [ ] Monitor Edge Function logs for errors
- [ ] Set up alerts for failed auth attempts
- [ ] Review storage access patterns

---

## 🔍 VERIFICATION QUERIES

Run these in Supabase SQL Editor to verify security:

```sql
-- 1. Check if storage bucket is private
SELECT id, name, public FROM storage.buckets WHERE id = 'receipts';
-- Expected: public = false

-- 2. List all storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
-- Expected: Empty result (all tables should have RLS enabled)

-- 4. View recent audit logs
SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 10;

-- 5. Check user roles
SELECT u.email, ur.role 
FROM auth.users u 
LEFT JOIN public.user_roles ur ON u.id = ur.user_id;
```

---

## 🚨 SECURITY BEST PRACTICES GOING FORWARD

1. **Never log sensitive data** (passwords, tokens, PII)
2. **Always validate user input** (file uploads, form data)
3. **Use parameterized queries** (prevent SQL injection)
4. **Implement rate limiting** on all public endpoints
5. **Regular security audits** (monthly review of audit_logs)
6. **Keep dependencies updated** (npm audit, Supabase updates)
7. **Use HTTPS only** in production
8. **Implement CSRF protection** for state-changing operations
9. **Regular backups** of database and storage
10. **Monitor for suspicious activity** (failed logins, unusual access patterns)

---

## 📞 SUPPORT

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Verify environment variables are set
4. Test with a fresh user account
5. Review audit_logs for clues

---

**Last Updated:** February 2025
**Version:** 2.2 (Security Hardening)
