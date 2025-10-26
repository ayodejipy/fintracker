-- ============================================================================
-- CLEANUP DEMO USERS AND THEIR DATA
-- ============================================================================
-- This script removes all demo users and their associated data
-- Run this in Supabase SQL Editor when you want to clean up test/demo data
--
-- WARNING: This will DELETE data! Make sure you want to do this.
-- ============================================================================

-- Demo user emails to remove
-- Add or modify this list based on your demo users
DO $$
DECLARE
  demo_emails TEXT[] := ARRAY[
    'demo@example.com',
    'john.doe@example.com',
    'jane.smith@example.com'
  ];
  demo_user_id UUID;
BEGIN
  -- Loop through each demo email
  FOREACH demo_user_id IN ARRAY (
    SELECT ARRAY_AGG(id)
    FROM users
    WHERE email = ANY(demo_emails)
  )
  LOOP
    RAISE NOTICE 'Deleting user: %', demo_user_id;

    -- Delete from application database
    -- Note: Cascade deletes will automatically remove:
    --   - transactions
    --   - loans
    --   - budgets
    --   - savings_goals
    --   - notifications
    --   - notification_preferences
    --   - recurring_expenses
    --   - custom categories (where userId IS NOT NULL)
    DELETE FROM users WHERE id = demo_user_id;

    -- Delete from Supabase Auth
    -- Note: This requires running as postgres user or service role
    -- Uncomment if you have the right permissions
    -- DELETE FROM auth.users WHERE id = demo_user_id;

  END LOOP;

  RAISE NOTICE 'Demo users cleanup completed!';
END $$;

-- ============================================================================
-- MANUAL CLEANUP (if the above doesn't work due to permissions)
-- ============================================================================

-- Step 1: Get demo user IDs
-- SELECT id, email, name FROM users
-- WHERE email IN ('demo@example.com', 'john.doe@example.com', 'jane.smith@example.com');

-- Step 2: Delete from application database (replace UUIDs with actual values)
-- DELETE FROM users WHERE email IN ('demo@example.com', 'john.doe@example.com', 'jane.smith@example.com');

-- Step 3: Delete from Supabase Auth (go to Authentication > Users in dashboard)
-- Or use Supabase service role with admin API

-- ============================================================================
-- VERIFY CLEANUP
-- ============================================================================

-- Check if demo users are gone
SELECT email, name FROM users
WHERE email IN ('demo@example.com', 'john.doe@example.com', 'jane.smith@example.com');

-- Check transaction count (should be 0 for demo users)
SELECT COUNT(*) as remaining_demo_transactions
FROM transactions
WHERE "userId" IN (
  SELECT id FROM users
  WHERE email IN ('demo@example.com', 'john.doe@example.com', 'jane.smith@example.com')
);

-- Verify auth users (requires auth schema access)
-- SELECT email FROM auth.users
-- WHERE email IN ('demo@example.com', 'john.doe@example.com', 'jane.smith@example.com');
