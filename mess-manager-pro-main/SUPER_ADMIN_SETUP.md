# Super Admin Production Setup Guide

This guide walks you through setting up the initial Super Admin account for Mess Manager Pro in a production environment.

## Prerequisites

- Your application is deployed (Vercel/Cloudflare)
- Lovable Cloud backend is connected and running
- You have access to the Lovable Cloud backend panel

---

## Step 1: Create the Super Admin Account

1. Navigate to your deployed application (e.g., `https://your-app.vercel.app`)
2. Click **Sign Up** and create a new account with your admin email
3. Use a **strong password** (minimum 12 characters, mix of uppercase, lowercase, numbers, symbols)
4. Complete the signup process

> ⚠️ **Important**: Use a dedicated admin email address, not a personal one.

---

## Step 2: Grant Super Admin Role

After the user account is created, you need to assign the `super_admin` role. 

### Option A: Using Lovable Cloud Backend (Recommended)

1. Open your Lovable project
2. Click on the **Backend** button in the top menu
3. Navigate to the **SQL Editor** or **Table Editor**
4. Run the following SQL command:

```sql
-- Replace 'your-admin@email.com' with your actual admin email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'your-admin@email.com';
```

### Option B: Direct SQL (if you have database access)

```sql
-- Find your user ID first
SELECT id, email FROM auth.users WHERE email = 'your-admin@email.com';

-- Then insert the role (replace USER_ID_HERE with the actual UUID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'super_admin');
```

---

## Step 3: Verify Super Admin Access

1. Log out of the application
2. Log back in with your super admin credentials
3. You should be automatically redirected to `/super-admin` dashboard
4. Verify you can see all tenant data and admin functions

---

## Step 4: Production Security Checklist

### Authentication Settings

- [ ] **Disable auto-confirm emails** for production (require email verification)
- [ ] **Set strong password policies** in authentication settings
- [ ] **Configure allowed redirect URLs** to only your production domain

### Database Security

- [ ] **Verify RLS policies** are enabled on all tables
- [ ] **Test role-based access** - ensure regular users cannot access admin routes
- [ ] **Review security logs** regularly via Super Admin Security dashboard

### Application Security

- [ ] **Use HTTPS only** (enforced by Vercel/Cloudflare)
- [ ] **Remove any test/demo accounts**
- [ ] **Change default credentials** if any exist

---

## Adding Additional Super Admins

Once logged in as Super Admin, you can add additional admins via the UI:

1. Go to **Super Admin Dashboard** → **Admins** tab
2. Enter the email of the user you want to promote
3. Click **Add Admin**

> Note: The user must have already signed up before you can promote them.

---

## Removing Super Admin Access

### Via UI (Recommended)
1. Go to **Super Admin Dashboard** → **Admins** tab
2. Find the admin you want to remove
3. Click the **Remove** button

### Via SQL (Emergency)
```sql
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin-to-remove@email.com')
AND role = 'super_admin';
```

---

## Troubleshooting

### "Access Denied" after login
- Verify the user_roles entry exists for your user
- Check that the role value is exactly `super_admin`
- Clear browser cache and try again

### Cannot see tenant data
- Verify RLS policies allow super_admin access
- Check the `has_role` function exists and works correctly

### Login redirects to regular dashboard
- The role check happens after login in `Login.tsx`
- Verify the user_roles query is returning data
- Check browser console for errors

---

## SQL Reference Scripts

### Check existing super admins
```sql
SELECT u.email, ur.role, ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'super_admin';
```

### Check if RLS is enabled on all tables
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Verify has_role function works
```sql
-- Replace with actual user_id
SELECT public.has_role('user-uuid-here', 'super_admin');
```

---

## Production Deployment Checklist

Before going live, ensure:

1. ✅ Super Admin account created and tested
2. ✅ Email verification enabled (disable auto-confirm)
3. ✅ All RLS policies reviewed and tested
4. ✅ Production redirect URLs configured
5. ✅ Security logs monitoring enabled
6. ✅ Backup strategy in place
7. ✅ Custom domain configured (optional)
8. ✅ SSL/HTTPS enforced

---

## Support

If you encounter issues:
1. Check the Security Logs in Super Admin dashboard
2. Review browser console for errors
3. Verify database policies using the SQL scripts above
