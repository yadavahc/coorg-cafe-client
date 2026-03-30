# 🍽️ Coorg Cafe - Complete Setup Guide

## ✅ Prerequisites

- Node.js installed
- Supabase account with new project
- Razorpay test keys configured

---

## 🚀 Step 1: Update Environment Variables

The `.env` file has been updated with your new Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zhocojirhfbnrjfmsean.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_HS-DouUM9XC8uf9IN0jxUA_Eawinvzo
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_SXLtugzNh5KR1t
RAZORPAY_KEY_SECRET=8RB8C9kf5EQYnqPHsxNUvjSe
```

**No changes needed** - already configured!

---

## 🗄️ Step 2: Setup Supabase Database

1. Go to your **new Supabase project**: https://zhocojirhfbnrjfmsean.supabase.co
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. **Copy the entire SQL schema** from `supabase_schema_final.sql` file
5. **Paste it** into the SQL editor
6. Click **Run** (CTRL + Enter)

**Wait for it to complete** - You should see ✅ success messages.

---

## 📋 Database Schema Details

The schema includes these tables:

### 1. **menu_items**

- Stores all cafe menu items
- Fields: name, price, category, image_url, is_available

### 2. **cafe_tables**

- Stores table data (1-10)
- Fields: table_number, qr_code_url, is_available, status

### 3. **orders**

- Main orders table
- Fields: table_number, order_type, payment_method, payment_status, total_amount, status
- Status values: `placed`, `preparing`, `ready`, `delivered`
- Payment status: `pending`, `paid`, `failed`, `cash_pending`, `cash_confirmed`

### 4. **order_items**

- Individual items in each order
- References: order_id, menu_id

### 5. **payments**

- Payment records for online transactions
- Fields: razorpay_order_id, razorpay_payment_id, razorpay_signature, status

---

## 💵 Step 3: Test Data (Optional)

Run this in Supabase SQL Editor to add sample menu items:

```sql
INSERT INTO menu_items (name, price, category, image_url, is_available) VALUES
('Espresso', 150, 'Coffee', '/espresso.jpg', true),
('Cappuccino', 200, 'Coffee', '/cappuccino.jpg', true),
('Latte', 220, 'Coffee', '/latte.jpg', true),
('Americano', 180, 'Coffee', '/americano.jpg', true),
('Cold Brew', 200, 'Cold Drinks', '/coldbrew.jpg', true),
('Iced Coffee', 210, 'Cold Drinks', '/icedcoffee.jpg', true),
('Croissant', 80, 'Pastry', '/croissant.jpg', true),
('Cake Slice', 120, 'Dessert', '/cake.jpg', true);
```

And add cafe tables:

```sql
INSERT INTO cafe_tables (table_number, is_available, status) VALUES
(1, true, 'available'),
(2, true, 'available'),
(3, true, 'available'),
(4, true, 'available'),
(5, true, 'available'),
(6, true, 'available'),
(7, true, 'available'),
(8, true, 'available'),
(9, true, 'available'),
(10, true, 'available');
```

---

## 🖥️ Step 4: Start Development Server

Kill any previous Next.js processes first:

**On Windows (PowerShell):**

```powershell
Get-Process node | Stop-Process -Force
```

**Or just restart your terminal.**

Then start the dev server:

```bash
npm run dev
```

Server should be at: `http://localhost:3000`

---

## 🎯 Features Implemented

### ✅ User Side

1. **Menu Page** (Landing)
   - Display all items from `menu_items` table
   - Add to cart functionality
   - Real-time price calculation

2. **Checkout Page**
   - Show cart items with prices
   - Display total amount
   - Table selection (1-10)
   - Payment method choice: Cash / Online

3. **Order Tracking**
   - Order ID display
   - Status updates (Placed → Preparing → Ready → Delivered)
   - Expected delivery time: 5 minutes
   - Real-time updates via Supabase Realtime

4. **Payment**
   - **Cash**: Mark as `cash_confirmed`, show order tracking
   - **Online**: Razorpay QR → scan → complete payment

### ✅ Admin Side

1. **Dashboard**
   - View all orders
   - Real-time order updates

2. **Kitchen Management**
   - View menu items
   - Add/Edit/Remove items
   - Changes instantly reflect on landing page

3. **Table Management**
   - View all tables (1-10)
   - Mark as available/unavailable/occupied
   - Real-time table status

4. **Billing (Counter Orders)**
   - Separate interface for counter staff
   - Staff can place orders directly
   - Marked as `counter_order`

5. **Order History**
   - View weekly/monthly/yearly reports
   - Payment breakdown
   - Filter by date range

---

## 🔄 Real-Time Features

All tables have Realtime enabled:

- When admin updates order status → User sees instantly
- When menu changes → Landing page updates instantly
- When table status changes → Users see available tables instantly

---

## 🔐 Row Level Security (RLS)

All tables have **Public Access** policies for testing.

**⚠️ Before Production:**

- Implement proper authentication (users table)
- Restrict access with RLS policies
- Use JWT tokens

---

## 📱 Razorpay Integration

**Test Mode Active:**

- Key ID: `rzp_test_SXLtugzNh5KR1t`
- Use test card: `4111 1111 1111 1111`
- Any future date + any CVV

**Flow:**

1. User selects "Online Payment"
2. Razorpay modal opens
3. User completes payment
4. Order status updated to `paid`
5. User redirected to tracking

---

## 📁 File Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page (Menu)
│   ├── admin/
│   │   ├── dashboard/page.tsx   # Admin dashboard
│   │   ├── menu/page.tsx        # Kitchen management
│   │   ├── tables/page.tsx      # Table management
│   │   ├── billing/page.tsx     # Counter billing
│   │   └── history/page.tsx     # Order analytics
│   └── table/[id]/
│       ├── page.tsx             # Menu for specific table
│       ├── checkout/page.tsx    # Checkout page
│       └── status/[order_id]/page.tsx  # Order tracking
├── components/
│   └── RazorpayButton.tsx       # Payment component
└── lib/
    └── supabase.ts              # Supabase client
```

---

## 🧪 Testing Workflow

### User Flow:

1. Visit `http://localhost:3000`
2. Select items → Add to cart
3. Click checkout
4. Select table (1-10)
5. Choose payment:
   - **Cash**: See order confirmation
   - **Online**: Complete Razorpay payment
6. View order tracking with Order ID

### Admin Flow:

1. Visit `http://localhost:3000/admin/dashboard`
2. See incoming orders
3. Update status → View real-time user updates
4. Manage menu/tables/billing

---

## 🐛 Troubleshooting

### "Port 3000 is already in use"

```bash
# Windows
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Supabase connection error

- Check `.env` file matches your project
- Verify URL and anon key match exactly
- Test connection in Supabase dashboard

### Razorpay error

- Verify test key in `.env`
- Check browser console for errors
- Ensure Razorpay script loaded (check network tab)

---

## ✨ Notes for Production

1. **RLS Policies**: Implement proper authentication
2. **Secrets**: Move Razorpay secret to backend only
3. **Validation**: Add server-side validation for all operations
4. **Rate Limiting**: Add on admin routes
5. **Notifications**: Add email/SMS for orders
6. **Analytics**: Track metrics and create reports

---

## 📞 Support

If you encounter any issues:

1. Check the console errors (F12 → Console)
2. Verify Supabase connection
3. Ensure all tables exist in database
4. Check .env file configuration

**Schema file**: `supabase_schema_final.sql` - Keep this for future reference!
