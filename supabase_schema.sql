-- Enable Row Level Security
-- TABLE: menu_items
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: cafe_tables
CREATE TABLE cafe_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number INTEGER UNIQUE NOT NULL,
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES cafe_tables(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'preparing', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: order_items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES menu_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    status TEXT DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Realtime settings: Enable for orders and menu_items
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- RLS Policies (For now, allow public access for testing - SHOULD BE SECURED LATER)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Admin All Access" ON menu_items FOR ALL USING (true); -- Replace with proper auth check later

ALTER TABLE cafe_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON cafe_tables FOR SELECT USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Access" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Access" ON orders FOR SELECT USING (true);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Access" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Access" ON order_items FOR SELECT USING (true);
