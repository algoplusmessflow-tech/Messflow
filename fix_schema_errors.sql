-- Fix for "Could not find column is_petty_cash" and Superadmin errors
-- Run this in Supabase SQL Editor

-- 1. Add Petty Cash flag to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_petty_cash BOOLEAN DEFAULT FALSE;

-- 2. Add Payment Gateway Settings to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_platform_gateway_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platform_gateway_config JSONB;

-- Notify user
DO $$
BEGIN
  RAISE NOTICE 'Schema updated successfully for Petty Cash and Superadmin features.';
END $$;
