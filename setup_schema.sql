-- =====================================================
-- MESS MANAGER PRO - Complete Database Schema
-- Version: 2.1 (Updated: January 2026)
-- Security Update: Enhanced RLS + Audit Logging
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Step 1: Create Custom Types/Enums (idempotent)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('super_admin', 'owner');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
    CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'suspended');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
    CREATE TYPE public.plan_type AS ENUM ('1-time', '2-time', '3-time');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE public.transaction_type AS ENUM ('payment', 'charge', 'adjustment');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
    CREATE TYPE public.expense_category AS ENUM ('groceries', 'utilities', 'rent', 'salary', 'maintenance', 'equipment', 'other');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
    CREATE TYPE public.staff_role AS ENUM ('chef', 'helper', 'manager', 'delivery');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
    CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'half_day', 'leave');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'petty_cash_type') THEN
    CREATE TYPE public.petty_cash_type AS ENUM ('deposit', 'withdrawal');
  END IF;
END
$$;

-- Step 2: Create Tables
-- =====================================================

-- User Roles Table (for super admin access)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AED',
    tax_name TEXT DEFAULT 'VAT',
    tax_rate NUMERIC DEFAULT 5,
    tax_trn TEXT,
    company_logo_url TEXT,
    company_address TEXT,
    payment_link TEXT,
    whatsapp_api_key TEXT,
    plan_type TEXT NOT NULL DEFAULT 'free',
    subscription_status subscription_status NOT NULL DEFAULT 'trial',
    subscription_expiry TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
    is_paid BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    invoice_count INTEGER NOT NULL DEFAULT 0,
    next_invoice_number INTEGER NOT NULL DEFAULT 1,
    storage_used BIGINT NOT NULL DEFAULT 0,
    storage_limit BIGINT NOT NULL DEFAULT 104857600,
    last_broadcast_seen_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 0,
    monthly_fee NUMERIC NOT NULL DEFAULT 0,
    status member_status NOT NULL DEFAULT 'active',
    plan_type plan_type NOT NULL DEFAULT '3-time',
    selected_menu_week INTEGER DEFAULT 1,
    joining_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    plan_expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    member_id UUID NOT NULL,
    type transaction_type NOT NULL,
    amount NUMERIC NOT NULL,
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    category expense_category NOT NULL DEFAULT 'other',
    description TEXT NOT NULL,
    receipt_url TEXT,
    file_size_bytes BIGINT DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Menu Table (with weekly menu support)
CREATE TABLE IF NOT EXISTS public.menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    day TEXT NOT NULL,
    week_number INTEGER NOT NULL DEFAULT 1,
    breakfast TEXT,
    lunch TEXT,
    dinner TEXT,
    optional_dishes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    item_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory Consumption Table
CREATE TABLE IF NOT EXISTS public.inventory_consumption (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    inventory_id UUID NOT NULL,
    quantity_used NUMERIC NOT NULL,
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role staff_role NOT NULL DEFAULT 'helper',
    designation TEXT,
    base_salary NUMERIC NOT NULL DEFAULT 0,
    salary_day INTEGER NOT NULL DEFAULT 1,
    joining_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    bank_name TEXT,
    account_number TEXT,
    iban TEXT,
    swift_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff Attendance Table
CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    staff_id UUID NOT NULL,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Salary Advances Table
CREATE TABLE IF NOT EXISTS public.salary_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    staff_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Salary Payments Table
CREATE TABLE IF NOT EXISTS public.salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    staff_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    month_year TEXT NOT NULL,
    expense_id UUID,
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Petty Cash Transactions Table
CREATE TABLE IF NOT EXISTS public.petty_cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    type petty_cash_type NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    balance_after NUMERIC NOT NULL DEFAULT 0,
    linked_expense_id UUID,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Broadcasts Table (admin announcements)
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    days_to_add INTEGER NOT NULL DEFAULT 30,
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_by UUID,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Promo Code Assignments Table
CREATE TABLE IF NOT EXISTS public.promo_code_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security Logs Table
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Create Storage Buckets
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create Functions
-- =====================================================

-- Function to check user role (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to handle new user signup (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow this SECURITY DEFINER trigger to create the profile despite RLS
  -- by exporting the new user id into a session-local setting that the
  -- profiles INSERT policy will accept. This avoids making the table
  -- publicly writable while allowing the auth trigger to operate.
  PERFORM set_config('app.current_user_id', NEW.id::text, true);

  INSERT INTO public.profiles (user_id, business_name, owner_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Mess'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Function to log super admin actions (audit trail)
CREATE OR REPLACE FUNCTION public.log_super_admin_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if the action is performed by a super admin
  IF has_role(auth.uid(), 'super_admin') THEN
    INSERT INTO public.security_logs (
      user_id,
      event_type,
      details
    ) VALUES (
      auth.uid(),
      'super_admin_' || TG_OP,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'record_id', CASE 
          WHEN TG_OP = 'DELETE' THEN OLD.id::text
          ELSE NEW.id::text
        END,
        'timestamp', now()
      )
    );
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 5: Create Triggers
-- =====================================================

-- Auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers for all relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_menu_updated_at ON public.menu;
CREATE TRIGGER update_menu_updated_at BEFORE UPDATE ON public.menu FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_staff_updated_at ON public.staff;
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_staff_attendance_updated_at ON public.staff_attendance;
CREATE TRIGGER update_staff_attendance_updated_at BEFORE UPDATE ON public.staff_attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_petty_cash_updated_at ON public.petty_cash_transactions;
CREATE TRIGGER update_petty_cash_updated_at BEFORE UPDATE ON public.petty_cash_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Super Admin Audit Triggers (logs sensitive actions)
CREATE TRIGGER audit_profiles_super_admin AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_super_admin_action();
CREATE TRIGGER audit_user_roles_super_admin AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.log_super_admin_action();
CREATE TRIGGER audit_promo_codes_super_admin AFTER INSERT OR UPDATE OR DELETE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION public.log_super_admin_action();
CREATE TRIGGER audit_broadcasts_super_admin AFTER INSERT OR DELETE ON public.broadcasts FOR EACH ROW EXECUTE FUNCTION public.log_super_admin_action();

-- Step 6: Enable Row Level Security
-- =====================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies
-- =====================================================

-- User Roles Policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Super admins can view all roles" ON public.user_roles FOR SELECT USING (has_role((SELECT auth.uid()), 'super_admin'));
CREATE POLICY "Super admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role((SELECT auth.uid()), 'super_admin'));
CREATE POLICY "Super admins can delete roles" ON public.user_roles FOR DELETE USING (has_role((SELECT auth.uid()), 'super_admin'));

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((SELECT auth.uid()) = user_id);
-- Allow profile creation either by the authenticated user or by the
-- auth.users trigger which sets `app.current_user_id` via `set_config()`
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR (current_setting('app.current_user_id', true) IS NOT NULL AND user_id = current_setting('app.current_user_id', true)::uuid)
  );
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (has_role((SELECT auth.uid()), 'super_admin'));
CREATE POLICY "Super admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role((SELECT auth.uid()), 'super_admin'));

-- Members Policies (with super admin access for exports)
CREATE POLICY "Owners can view their own members or super admin can view all" ON public.members FOR SELECT USING (((SELECT auth.uid()) = owner_id) OR has_role((SELECT auth.uid()), 'super_admin'));
CREATE POLICY "Owners can create members" ON public.members FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can update their own members" ON public.members FOR UPDATE USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own members" ON public.members FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Transactions Policies
CREATE POLICY "Owners can view their own transactions" ON public.transactions FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can create transactions" ON public.transactions FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can update their own transactions" ON public.transactions FOR UPDATE USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own transactions" ON public.transactions FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Expenses Policies
CREATE POLICY "Owners can view their own expenses" ON public.expenses FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can create expenses" ON public.expenses FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can update their own expenses" ON public.expenses FOR UPDATE USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own expenses" ON public.expenses FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Menu Policies (with super admin access for exports)
CREATE POLICY "Owners can view their own menu or super admin can view all" ON public.menu FOR SELECT USING (((SELECT auth.uid()) = owner_id) OR has_role((SELECT auth.uid()), 'super_admin'));
CREATE POLICY "Owners can create menu items" ON public.menu FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can update their own menu" ON public.menu FOR UPDATE USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own menu" ON public.menu FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Inventory Policies
CREATE POLICY "Owners can view their own inventory" ON public.inventory FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can create inventory items" ON public.inventory FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can update their own inventory" ON public.inventory FOR UPDATE USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own inventory" ON public.inventory FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Inventory Consumption Policies
CREATE POLICY "Owners can view their own consumption" ON public.inventory_consumption FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can create consumption records" ON public.inventory_consumption FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own consumption" ON public.inventory_consumption FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Staff Policies
CREATE POLICY "Owners can view their own staff" ON public.staff FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can create staff" ON public.staff FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can update their own staff" ON public.staff FOR UPDATE USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own staff" ON public.staff FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Staff Attendance Policies
CREATE POLICY "Owners can view their own attendance" ON public.staff_attendance FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can create attendance" ON public.staff_attendance FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can update their own attendance" ON public.staff_attendance FOR UPDATE USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own attendance" ON public.staff_attendance FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Salary Advances Policies
CREATE POLICY "Owners can view their own advances" ON public.salary_advances FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can create advances" ON public.salary_advances FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own advances" ON public.salary_advances FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Salary Payments Policies
CREATE POLICY "Owners can view their own salary payments" ON public.salary_payments FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can create salary payments" ON public.salary_payments FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);

-- Petty Cash Policies
CREATE POLICY "Owners can view their own petty cash" ON public.petty_cash_transactions FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can create petty cash transactions" ON public.petty_cash_transactions FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can update their own petty cash" ON public.petty_cash_transactions FOR UPDATE USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own petty cash" ON public.petty_cash_transactions FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Notifications Policies
CREATE POLICY "Owners can view their own notifications" ON public.notifications FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can create notifications" ON public.notifications FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can update their own notifications" ON public.notifications FOR UPDATE USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "Owners can delete their own notifications" ON public.notifications FOR DELETE USING ((SELECT auth.uid()) = owner_id);

-- Broadcasts Policies (super admin can manage, all authenticated can read)
CREATE POLICY "Authenticated users can read broadcasts" ON public.broadcasts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Super admins can create broadcasts" ON public.broadcasts FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can delete broadcasts" ON public.broadcasts FOR DELETE USING (has_role(auth.uid(), 'super_admin'));

-- Promo Codes Policies (secured - auth required, restricted UPDATE)
CREATE POLICY "Authenticated users can read promo codes" ON public.promo_codes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can claim unused promo codes for themselves" ON public.promo_codes FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND is_used = false)
  WITH CHECK (auth.uid() IS NOT NULL AND used_by = auth.uid() AND is_used = true);
CREATE POLICY "Super admins can create promo codes" ON public.promo_codes FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can delete promo codes" ON public.promo_codes FOR DELETE USING (has_role(auth.uid(), 'super_admin'));

-- Promo Code Assignments Policies
CREATE POLICY "Users can view their own assignments" ON public.promo_code_assignments FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Super admins can view all assignments" ON public.promo_code_assignments FOR SELECT USING (has_role((SELECT auth.uid()), 'super_admin'));
CREATE POLICY "Super admins can create assignments" ON public.promo_code_assignments FOR INSERT WITH CHECK (has_role((SELECT auth.uid()), 'super_admin'));
CREATE POLICY "Super admins can delete assignments" ON public.promo_code_assignments FOR DELETE USING (has_role((SELECT auth.uid()), 'super_admin'));

-- Security Logs Policies
CREATE POLICY "Users can view their own security logs" ON public.security_logs FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert their own security logs" ON public.security_logs FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "Super admins can view all security logs" ON public.security_logs FOR SELECT USING (has_role((SELECT auth.uid()), 'super_admin'));

-- Step 8: Storage Policies for Receipts Bucket
-- =====================================================

CREATE POLICY "Anyone can view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own receipts" ON storage.objects FOR UPDATE USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own receipts" ON storage.objects FOR DELETE USING (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

-- Step 9: Enable Realtime for Core Tables (Optional)
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- 
-- Next steps:
-- 1. Go to Supabase Dashboard > Authentication > Providers
--    - Enable Email provider
--    - Set "Confirm email" to OFF for testing (enable for production)
-- 
-- 2. Go to Authentication > URL Configuration
--    - Add your production URL to "Redirect URLs"
--    - Example: https://your-app.vercel.app/**
-- 
-- 3. Set environment variables in your hosting platform:
--    - VITE_SUPABASE_URL = your Supabase project URL
--    - VITE_SUPABASE_PUBLISHABLE_KEY = your Supabase anon key
--    - VITE_CLOUDINARY_CLOUD_NAME = your Cloudinary cloud name
--    - VITE_CLOUDINARY_UPLOAD_PRESET = your Cloudinary upload preset
-- 
-- 4. To create the first Super Admin:
--    a. Sign up a new user through the app
--    b. Run this SQL (replace email):
--       INSERT INTO public.user_roles (user_id, role)
--       SELECT id, 'super_admin'::app_role
--       FROM auth.users
--       WHERE email = 'your-admin@email.com';
-- 
-- 5. For production security:
--    - Enable email confirmation
--    - Review and test all RLS policies
--    - Set up database backups
--    - Monitor security_logs table
-- 
-- =====================================================
