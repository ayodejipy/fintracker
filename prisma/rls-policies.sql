-- Row Level Security (RLS) Policies
-- This file contains all RLS policies for the personal finance dashboard
-- Run this in your Supabase SQL Editor after enabling RLS on all tables

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Users can only read and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow user creation during registration (handled by server API)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
-- Users can manage their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================================================
-- LOANS TABLE
-- ============================================================================
-- Users can manage their own loans
CREATE POLICY "Users can view own loans" ON loans
  FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own loans" ON loans
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own loans" ON loans
  FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own loans" ON loans
  FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================================================
-- BUDGETS TABLE
-- ============================================================================
-- Users can manage their own budgets
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================================================
-- SAVINGS_GOALS TABLE
-- ============================================================================
-- Users can manage their own savings goals
CREATE POLICY "Users can view own savings goals" ON savings_goals
  FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own savings goals" ON savings_goals
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own savings goals" ON savings_goals
  FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own savings goals" ON savings_goals
  FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
-- Users can manage their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================================================
-- NOTIFICATION_PREFERENCES TABLE
-- ============================================================================
-- Users can manage their own notification preferences
CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own notification preferences" ON notification_preferences
  FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================================================
-- RECURRING_EXPENSES TABLE
-- ============================================================================
-- Users can manage their own recurring expenses
CREATE POLICY "Users can view own recurring expenses" ON recurring_expenses
  FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own recurring expenses" ON recurring_expenses
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own recurring expenses" ON recurring_expenses
  FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own recurring expenses" ON recurring_expenses
  FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
-- Special handling: System categories (userId IS NULL) are visible to all
-- Users can view system categories and their own custom categories
CREATE POLICY "Users can view system and own categories" ON categories
  FOR SELECT
  USING (
    "userId" IS NULL OR auth.uid() = "userId"
  );

-- Users can only insert their own custom categories
CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

-- Users can only update their own custom categories (not system categories)
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE
  USING (auth.uid() = "userId" AND "userId" IS NOT NULL);

-- Users can only delete their own custom categories (not system categories)
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE
  USING (auth.uid() = "userId" AND "userId" IS NOT NULL);

-- ============================================================================
-- VERIFICATION AND TESTING
-- ============================================================================
-- After running these policies, verify they work correctly:
--
-- 1. Test with a real user session:
--    - Login to your app
--    - Try to view/create/update/delete your own data (should work)
--    - Try to access another user's data via API manipulation (should fail)
--
-- 2. Test system categories:
--    - All authenticated users should see system categories
--    - Users should only see their own custom categories
--    - Users should not be able to modify system categories
--
-- 3. Check policy effectiveness:
--    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    ORDER BY tablename, policyname;
--
-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. These policies assume auth.uid() returns the UUID of the authenticated user
-- 2. Policies are permissive by default (OR logic between policies of same type)
-- 3. onDelete: Cascade in Prisma handles cleanup when users are deleted
-- 4. System categories (userId IS NULL) are protected from user modification
-- 5. All policies require authentication - anonymous users cannot access data
