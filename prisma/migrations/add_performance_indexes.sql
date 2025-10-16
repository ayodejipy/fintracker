-- Performance optimization indexes for Personal Finance Dashboard
-- These indexes are designed to optimize common query patterns

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Transaction table indexes (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_amount ON transactions(user_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_date_range ON transactions(date) WHERE date >= CURRENT_DATE - INTERVAL '1 year';
CREATE INDEX IF NOT EXISTS idx_transactions_category_date ON transactions(category, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions(type, date DESC);

-- Composite index for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date_amount ON transactions(user_id, type, date DESC, amount);

-- Budget table indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_user_category_month ON budgets(user_id, category, month);
CREATE INDEX IF NOT EXISTS idx_budgets_month_active ON budgets(month) WHERE current_spent < monthly_limit;

-- Loan table indexes
CREATE INDEX IF NOT EXISTS idx_loans_user_active ON loans(user_id) WHERE current_balance > 0;
CREATE INDEX IF NOT EXISTS idx_loans_user_start_date ON loans(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_loans_payoff_date ON loans(projected_payoff_date) WHERE projected_payoff_date IS NOT NULL;

-- Savings goals table indexes
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_target_date ON savings_goals(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_progress ON savings_goals(user_id, current_amount, target_amount);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date_active ON savings_goals(target_date) WHERE current_amount < target_amount;

-- Notification table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at) WHERE scheduled_at IS NOT NULL AND is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_priority_unread ON notifications(priority, is_read, created_at DESC);

-- Notification preferences index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Partial indexes for better performance on common filtered queries
CREATE INDEX IF NOT EXISTS idx_transactions_recent_expenses ON transactions(user_id, date DESC, amount) 
  WHERE type = 'expense' AND date >= CURRENT_DATE - INTERVAL '3 months';

CREATE INDEX IF NOT EXISTS idx_transactions_recent_income ON transactions(user_id, date DESC, amount) 
  WHERE type = 'income' AND date >= CURRENT_DATE - INTERVAL '3 months';

CREATE INDEX IF NOT EXISTS idx_budgets_current_month ON budgets(user_id, category, current_spent, monthly_limit) 
  WHERE month = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

-- Indexes for analytical queries
CREATE INDEX IF NOT EXISTS idx_transactions_monthly_summary ON transactions(user_id, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), type, amount);

-- Function-based indexes for common calculations
CREATE INDEX IF NOT EXISTS idx_budgets_utilization ON budgets(user_id, (current_spent::float / monthly_limit::float)) 
  WHERE monthly_limit > 0;

CREATE INDEX IF NOT EXISTS idx_savings_progress ON savings_goals(user_id, (current_amount::float / target_amount::float)) 
  WHERE target_amount > 0;

-- Covering indexes for dashboard queries (includes commonly selected columns)
CREATE INDEX IF NOT EXISTS idx_transactions_dashboard_cover ON transactions(user_id, date DESC) 
  INCLUDE (amount, category, type, description);

CREATE INDEX IF NOT EXISTS idx_budgets_dashboard_cover ON budgets(user_id, month) 
  INCLUDE (category, monthly_limit, current_spent);

-- Text search indexes for descriptions (if full-text search is needed)
CREATE INDEX IF NOT EXISTS idx_transactions_description_gin ON transactions USING gin(to_tsvector('english', description));

-- Indexes for foreign key relationships (if not automatically created)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Statistics update for better query planning
ANALYZE users;
ANALYZE transactions;
ANALYZE budgets;
ANALYZE loans;
ANALYZE savings_goals;
ANALYZE notifications;
ANALYZE notification_preferences;