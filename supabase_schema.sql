-- ============================================================
--  Iconic Coffee — Supabase Database Schema
--  Run this ONCE in your Supabase project:
--    Dashboard -> SQL Editor -> New query -> paste -> Run
--  It creates the 4 tables the app syncs to and opens up
--  access so the anon key can read/write them.
-- ============================================================

-- 1. Products (menu items)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name_en TEXT,
  name_ar TEXT,
  price NUMERIC,
  description_en TEXT,
  description_ar TEXT,
  category TEXT,
  tag TEXT,
  image TEXT,
  is_special BOOLEAN DEFAULT FALSE,
  bg_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff (POS logins)
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT,
  role TEXT,
  pin TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders (live customer orders)
--    Destination is floor / gate / shop, not a table. `table_number` is kept as the
--    pre-computed one-line label so orders placed before this change still resolve.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  floor TEXT,
  gate TEXT,
  shop_name TEXT,
  signboard_url TEXT,
  payment_method TEXT,
  table_number TEXT,
  phone_number TEXT,
  total_price NUMERIC,
  status TEXT,
  items JSONB,
  sales_person TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  estimated_time_minutes INTEGER DEFAULT 10
);

-- Upgrade path for a project created before the floor/gate rollout.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS floor TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gate TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS signboard_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 4. Loyalty (streak / rewards profiles + app settings row)
CREATE TABLE IF NOT EXISTS loyalty (
  identifier TEXT PRIMARY KEY,
  streak INTEGER DEFAULT 0,
  last_date TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  reward_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Access: the app connects with the public "anon" key, so the
-- tables must allow that key to read and write. Disable RLS...
-- ------------------------------------------------------------
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty  DISABLE ROW LEVEL SECURITY;

-- ...and, as a fallback in case RLS is re-enabled later, add
-- policies that allow all operations for the anon role.
DROP POLICY IF EXISTS "Allow all for anonymous users on products" ON public.products;
CREATE POLICY "Allow all for anonymous users on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anonymous users on staff" ON public.staff;
CREATE POLICY "Allow all for anonymous users on staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anonymous users on orders" ON public.orders;
CREATE POLICY "Allow all for anonymous users on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anonymous users on loyalty" ON public.loyalty;
CREATE POLICY "Allow all for anonymous users on loyalty" ON public.loyalty FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- Storage: two PUBLIC buckets.
--   signboards  - shop signboard photos customers attach to an order
--   menu-assets - branded category / product imagery
-- Create both under Storage -> Buckets (public = on), then run these policies
-- so the anon key the server uses can upload into them.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public read signboards" ON storage.objects;
CREATE POLICY "Public read signboards" ON storage.objects FOR SELECT USING (bucket_id = 'signboards');

DROP POLICY IF EXISTS "Anon upload signboards" ON storage.objects;
CREATE POLICY "Anon upload signboards" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signboards');

DROP POLICY IF EXISTS "Public read menu-assets" ON storage.objects;
CREATE POLICY "Public read menu-assets" ON storage.objects FOR SELECT USING (bucket_id = 'menu-assets');

DROP POLICY IF EXISTS "Anon upload menu-assets" ON storage.objects;
CREATE POLICY "Anon upload menu-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-assets');

-- 5. Create 'promos' table (admin-managed Iconic Range cards)
CREATE TABLE IF NOT EXISTS promos (
  id TEXT PRIMARY KEY,
  label TEXT,
  label_ar TEXT,
  image TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.promos DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anonymous users on promos" ON public.promos;
CREATE POLICY "Allow all for anonymous users on promos" ON public.promos FOR ALL USING (true) WITH CHECK (true);
