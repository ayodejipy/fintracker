-- ============================================================================
-- CLEANUP ALL DATA (NUCLEAR OPTION)
-- ============================================================================
-- This script removes ALL user data from ALL tables
-- Keeps system categories intact
--
-- ⚠️  WARNING: THIS WILL DELETE EVERYTHING! USE WITH EXTREME CAUTION!
-- ⚠️  Only use this for development/testing environments
-- ⚠️  DO NOT run this in production unless you want to start fresh
-- ============================================================================

-- Uncomment the BEGIN/COMMIT block to enable this script
-- By default it's disabled to prevent accidental data loss

-- BEGIN;

-- Delete all user-related data (cascade will handle related records)
-- This will delete:
--   - All user profiles
--   - All transactions (via cascade)
--   - All loans (via cascade)
--   - All budgets (via cascade)
--   - All savings goals (via cascade)
--   - All notifications (via cascade)
--   - All notification preferences (via cascade)
--   - All recurring expenses (via cascade)
--   - All custom categories (via cascade)

DELETE FROM users;

-- Optionally: Delete all custom categories (keeps system categories)
DELETE FROM categories WHERE "userId" IS NOT NULL;

-- Optionally: Reset system categories (if you want to re-seed them)
-- DELETE FROM categories WHERE "userId" IS NULL;

-- COMMIT;

-- ============================================================================
-- VERIFY CLEANUP
-- ============================================================================

-- Check remaining data
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'loans', COUNT(*) FROM loans
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets
UNION ALL
SELECT 'savings_goals', COUNT(*) FROM savings_goals
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
UNION ALL
SELECT 'recurring_expenses', COUNT(*) FROM recurring_expenses
UNION ALL
SELECT 'categories (custom)', COUNT(*) FROM categories WHERE "userId" IS NOT NULL
UNION ALL
SELECT 'categories (system)', COUNT(*) FROM categories WHERE "userId" IS NULL;

-- ============================================================================
-- NOTES
-- ============================================================================
-- After cleanup, you may want to:
-- 1. Re-seed categories: npm run db:seed:categories
-- 2. Re-seed demo users: npm run db:seed:demo
-- 3. Delete users from Supabase Auth manually (Dashboard > Authentication > Users)
-- 4. Or use the Supabase service role API to delete auth users programmatically
