-- =====================================================
-- MESS MANAGER PRO - Security Hardening Migration
-- Version: 2.2 (Security Update: February 2026)
-- Description: Fixes critical RLS vulnerabilities
-- =====================================================

-- =====================================================
-- PART 1: SECURE STORAGE RLS POLICIES
-- =====================================================

-- Step 1: Make receipts bucket PRIVATE (remove public access)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'receipts';

-- Step 2: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing storage policies for receipts bucket
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;

-- Step 4: Create STRICT owner-based storage policies
-- Policy: Users can only SELECT their own files
CREATE POLICY "Users can only view their own receipts" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can only INSERT files in their own folder
CREATE POLICY "Users can only upload to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can only UPDATE their own files
CREATE POLICY "Users can only update their own receipts" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can only DELETE their own files
CREATE POLICY "Users can only delete their own receipts" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 5: Create policy for super_admin to access all files
CREATE POLICY "Super admins can access all receipts" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'receipts' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- =====================================================
-- PART 2: ENHANCED RLS POLICIES FOR ALL TABLES
-- =====================================================

-- Helper function to get current user ID safely
CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- Fix: Profiles table - STRICTER policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can only view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can only update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Fix: Members table - STRICTER policies
DROP POLICY IF EXISTS "Owners can view their own members or super admin can view all" ON public.members;
DROP POLICY IF EXISTS "Owners can view their own members" ON public.members;
DROP POLICY IF EXISTS "Owners can update their own members" ON public.members;
DROP POLICY IF EXISTS "Owners can delete their own members" ON public.members;

CREATE POLICY "Owners can only view own members" 
ON public.members 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Owners can only create own members" 
ON public.members 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only update own members" 
ON public.members 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only delete own members" 
ON public.members 
FOR DELETE 
USING (owner_id = auth.uid());

-- Fix: Transactions table - STRICTER policies
DROP POLICY IF EXISTS "Owners can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owners can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owners can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owners can delete their own transactions" ON public.transactions;

CREATE POLICY "Owners can only view own transactions" 
ON public.transactions 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Owners can only create own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only update own transactions" 
ON public.transactions 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only delete own transactions" 
ON public.transactions 
FOR DELETE 
USING (owner_id = auth.uid());

-- Fix: Expenses table - STRICTER policies
DROP POLICY IF EXISTS "Owners can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Owners can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Owners can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Owners can delete their own expenses" ON public.expenses;

CREATE POLICY "Owners can only view own expenses" 
ON public.expenses 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Owners can only create own expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only update own expenses" 
ON public.expenses 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only delete own expenses" 
ON public.expenses 
FOR DELETE 
USING (owner_id = auth.uid());

-- Fix: Menu table - STRICTER policies
DROP POLICY IF EXISTS "Owners can view their own menu or super admin can view all" ON public.menu;
DROP POLICY IF EXISTS "Owners can view their own menu" ON public.menu;
DROP POLICY IF EXISTS "Owners can update their own menu" ON public.menu;
DROP POLICY IF EXISTS "Owners can delete their own menu" ON public.menu;

CREATE POLICY "Owners can only view own menu" 
ON public.menu 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Owners can only create own menu" 
ON public.menu 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only update own menu" 
ON public.menu 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only delete own menu" 
ON public.menu 
FOR DELETE 
USING (owner_id = auth.uid());

-- Fix: Inventory table - STRICTER policies
DROP POLICY IF EXISTS "Owners can view their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Owners can create inventory items" ON public.inventory;
DROP POLICY IF EXISTS "Owners can update their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Owners can delete their own inventory" ON public.inventory;

CREATE POLICY "Owners can only view own inventory" 
ON public.inventory 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Owners can only create own inventory" 
ON public.inventory 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only update own inventory" 
ON public.inventory 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only delete own inventory" 
ON public.inventory 
FOR DELETE 
USING (owner_id = auth.uid());

-- Fix: Inventory Consumption table - STRICTER policies
DROP POLICY IF EXISTS "Owners can view their own inventory consumption" ON public.inventory_consumption;
DROP POLICY IF EXISTS "Owners can create inventory consumption" ON public.inventory_consumption;
DROP POLICY IF EXISTS "Owners can update their own inventory consumption" ON public.inventory_consumption;
DROP POLICY IF EXISTS "Owners can delete their own inventory consumption" ON public.inventory_consumption;

CREATE POLICY "Owners can only view own inventory consumption" 
ON public.inventory_consumption 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Owners can only create own inventory consumption" 
ON public.inventory_consumption 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only update own inventory consumption" 
ON public.inventory_consumption 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only delete own inventory consumption" 
ON public.inventory_consumption 
FOR DELETE 
USING (owner_id = auth.uid());

-- Fix: Attendance table - STRICTER policies
DROP POLICY IF EXISTS "Owners can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Owners can create attendance" ON public.attendance;
DROP POLICY IF EXISTS "Owners can update their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Owners can delete their own attendance" ON public.attendance;

CREATE POLICY "Owners can only view own attendance" 
ON public.attendance 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Owners can only create own attendance" 
ON public.attendance 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only update own attendance" 
ON public.attendance 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can only delete own attendance" 
ON public.attendance 
FOR DELETE 
USING (owner_id = auth.uid());

-- =====================================================
-- PART 3: SUPER ADMIN POLICIES (SEPARATE)
-- =====================================================

-- Super admin can view all data (read-only for auditing)
CREATE POLICY "Super admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admin can view all members" 
ON public.members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admin can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admin can view all expenses" 
ON public.expenses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- =====================================================
-- PART 4: AUDIT LOGGING
-- =====================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Only super admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_trigger ON public.transactions;
CREATE TRIGGER audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger ON public.expenses;
CREATE TRIGGER audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_trigger ON public.members;
CREATE TRIGGER audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- =====================================================
-- PART 5: SECURITY VALIDATIONS
-- =====================================================

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END;
$$;

-- Create index for performance on owner_id columns
CREATE INDEX IF NOT EXISTS idx_members_owner_id ON public.members(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_owner_id ON public.transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner_id ON public.expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_menu_owner_id ON public.menu(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_owner_id ON public.inventory(owner_id);
CREATE INDEX IF NOT EXISTS idx_attendance_owner_id ON public.attendance(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Run this migration in Supabase SQL Editor
-- Then proceed with TypeScript security fixes