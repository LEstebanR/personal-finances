-- ============================================================================
-- ADD ROW LEVEL SECURITY POLICIES FOR TRANSFER TABLE
-- ============================================================================
-- This script adds RLS policies for the Transfer table
-- Execute this in the Supabase SQL Editor
-- ============================================================================

-- Enable Row Level Security on Transfer table
ALTER TABLE "Transfer" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own transfers" ON "Transfer";
DROP POLICY IF EXISTS "Users can insert their own transfers" ON "Transfer";
DROP POLICY IF EXISTS "Users can update their own transfers" ON "Transfer";
DROP POLICY IF EXISTS "Users can delete their own transfers" ON "Transfer";

-- ============================================================================
-- TRANSFER POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own transfers"
  ON "Transfer"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert their own transfers"
  ON "Transfer"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own transfers"
  ON "Transfer"
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own transfers"
  ON "Transfer"
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON "Transfer" TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'Transfer';

-- Check policies
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'Transfer';
