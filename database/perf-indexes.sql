-- database/perf-indexes.sql
--
-- Indexes for the queries BrickApp runs most often.
--
-- Safe to run repeatedly: every statement is guarded so a missing table or
-- column is skipped rather than aborting the script. Run it once against the
-- production database; it does not modify any data.
--
--   psql "$DATABASE_URL" -f database/perf-indexes.sql
--
-- CONCURRENTLY is deliberately NOT used so the whole file can run in one
-- transaction-free session against a small database without leaving invalid
-- indexes behind. On a large, busy table, create these one at a time with
-- CREATE INDEX CONCURRENTLY instead.

\set ON_ERROR_STOP off

DO $$
DECLARE
    stmt text;
    stmts text[] := ARRAY[
        -- Auth: this join runs on (almost) every authenticated request.
        'CREATE INDEX IF NOT EXISTS idx_bua_user_id ON branch_user_assignments (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_bua_branch_id ON branch_user_assignments (branch_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_roles_branch_id ON user_roles (branch_id)',
        'CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)',

        -- Orders: every dashboard aggregate filters by branch and date.
        'CREATE INDEX IF NOT EXISTS idx_orders_branch_date ON orders (branch_id, order_date DESC)',
        'CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders (order_date DESC)',
        'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)',

        -- Order items: joined to orders and products for the sales charts.
        'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id)',
        'CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id)',

        -- Products: branch listings and the stock-alert scan.
        'CREATE INDEX IF NOT EXISTS idx_products_branch_id ON products (branch_id)',

        -- Expenses / wastage: monthly totals and category rollups.
        'CREATE INDEX IF NOT EXISTS idx_expenses_branch_date ON expenses (branch_id, expense_date DESC)',
        'CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category)',
        'CREATE INDEX IF NOT EXISTS idx_wastage_branch_date ON wastage (branch_id, date DESC)',

        -- Deliveries and production.
        'CREATE INDEX IF NOT EXISTS idx_delivery_trips_branch_date ON delivery_trips (branch_id, trip_date DESC)',
        'CREATE INDEX IF NOT EXISTS idx_production_batches_branch ON production_batches (branch_id)',

        -- Chat: the unread count and conversation list run on every page load.
        'CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages (conversation_id, created_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_chat_conv_p1 ON chat_conversations (participant1_id)',
        'CREATE INDEX IF NOT EXISTS idx_chat_conv_p2 ON chat_conversations (participant2_id)',

        -- Order timeline lookups.
        'CREATE INDEX IF NOT EXISTS idx_order_timeline_order ON order_timeline (order_id)'
    ];
BEGIN
    FOREACH stmt IN ARRAY stmts LOOP
        BEGIN
            EXECUTE stmt;
            RAISE NOTICE 'ok:      %', stmt;
        EXCEPTION WHEN undefined_table OR undefined_column THEN
            RAISE NOTICE 'skipped: % (%)', stmt, SQLERRM;
        END;
    END LOOP;
END $$;

-- Refresh planner statistics so the new indexes are actually chosen.
ANALYZE;
