-- Fix for "Could not find column is_platform_gateway_enabled"
-- Run this in Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_platform_gateway_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS platform_gateway_config JSONB;

-- Notify user
DO $$
BEGIN
  RAISE NOTICE 'Schema updated successfully for Superadmin features.';
END $$;
