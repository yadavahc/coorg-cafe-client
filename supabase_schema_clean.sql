-- NOTE:
-- This schema is intentionally permissive for local/testing usage.
-- Tighten RLS before production deployment.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE: menu_items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: cafe_tables
CREATE TABLE IF NOT EXISTS cafe_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number INTEGER UNIQUE NOT NULL CHECK (table_number BETWEEN 1 AND 10),
    qr_code_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES cafe_tables(id),
    table_number INTEGER CHECK (table_number BETWEEN 1 AND 10),
    order_type TEXT NOT NULL DEFAULT 'table_order' CHECK (order_type IN ('table_order', 'counter_order')),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'online')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cash_pending', 'cash_confirmed')),
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'preparing', 'out_for_delivery', 'delivered')),
    estimated_ready_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES menu_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    price_snapshot DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    status TEXT DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward-compatible column upgrades for existing databases
ALTER TABLE cafe_tables ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE cafe_tables ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'table_order';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price_snapshot DECIMAL(10, 2);

-- Useful indexes for dashboard and reports
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_type_created_at ON orders(order_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_number_created_at ON orders(table_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- RLS Policies (testing only)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON menu_items;
DROP POLICY IF EXISTS "Admin All Access" ON menu_items;
CREATE POLICY "Public Read Access" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Admin All Access" ON menu_items FOR ALL USING (true);

ALTER TABLE cafe_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Access" ON cafe_tables;
CREATE POLICY "Public Read Access" ON cafe_tables FOR SELECT USING (true);
CREATE POLICY "Public Update Access" ON cafe_tables FOR UPDATE USING (true);
CREATE POLICY "Public Insert Access" ON cafe_tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Access" ON cafe_tables FOR DELETE USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Insert Access" ON orders;
DROP POLICY IF EXISTS "Public Read Access" ON orders;
CREATE POLICY "Public Insert Access" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Access" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Update Access" ON orders FOR UPDATE USING (true);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Insert Access" ON order_items;
DROP POLICY IF EXISTS "Public Read Access" ON order_items;
CREATE POLICY "Public Insert Access" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Access" ON order_items FOR SELECT USING (true);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Insert Access" ON payments;
DROP POLICY IF EXISTS "Public Read Access" ON payments;
DROP POLICY IF EXISTS "Public Update Access" ON payments;
CREATE POLICY "Public Insert Access" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Access" ON payments FOR SELECT USING (true);
CREATE POLICY "Public Update Access" ON payments FOR UPDATE USING (true);
