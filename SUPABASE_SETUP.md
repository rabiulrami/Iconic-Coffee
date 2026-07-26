# Connecting Iconic Coffee to Supabase

This app stores its live data — **orders, products, staff, and loyalty profiles** — in a
Supabase (PostgreSQL) database. Once connected, every order placed and every change made in
the admin panel is written to Supabase in real time, and the admin dashboard reads back from
it (auto-refreshing every 4 seconds).

Until Supabase is configured, the app runs in **"Local Database Mode"** — data is only kept in
local JSON files, which are **not shared between devices and are wiped on each redeploy** on
hosts like Vercel. That is why data appeared "not connected." Follow the 3 steps below to fix it.

---

## Step 1 — Create the database tables

1. Go to <https://supabase.com>, sign in, and create a project (or open an existing one).
2. In the left sidebar open **SQL Editor** → **New query**.
3. Open the file [`supabase_schema.sql`](supabase_schema.sql) from this project, copy its
   entire contents, paste into the SQL editor, and click **Run**.

This creates the four tables (`products`, `staff`, `orders`, `loyalty`) and opens access so the
app's public key can read and write them. You only need to do this once. Re-running it on an
existing project is safe — it also adds the newer `orders` columns (`floor`, `gate`,
`shop_name`, `signboard_url`) if they are missing.

## Step 1b — Create the two storage buckets

Customers attach a photo of their shop signboard to every order, and those photos must outlive
the request (serverless filesystems are wiped between invocations). In the Supabase dashboard go
to **Storage → New bucket** and create both of these with **Public bucket** switched **on**:

| Bucket        | Holds                                            |
| ------------- | ------------------------------------------------ |
| `signboards`  | Shop signboard photos uploaded during checkout   |
| `menu-assets` | Branded category images and product photos       |

The storage policies at the bottom of `supabase_schema.sql` grant the app's anon key permission
to upload into them. If the buckets are missing, uploads silently fall back to local disk, which
does **not** survive a redeploy on Vercel.

## Step 2 — Get your two keys

In the Supabase dashboard go to **Project Settings → API** and copy:

| Value in Supabase        | Goes into           |
| ------------------------ | ------------------- |
| **Project URL**          | `SUPABASE_URL`      |
| **anon / public** key    | `SUPABASE_ANON_KEY` |

> Use the **anon/public** key, not the `service_role` key.

## Step 3 — Give the app the keys

Pick **one** of these:

### Option A — Environment variables (recommended for hosting, e.g. Vercel)
Set two environment variables in your host's dashboard, then redeploy:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

For **local development**, put the same two values in the `.env.local` file in this project
(a ready-to-fill template is already there), then run `npm run dev`.

### Option B — Enter them in the app (no redeploy needed)
1. Open the app, go to the **Staff Portal** (`/admin`) and log in
   (Super Admin PIN defaults to **1212**).
2. Open the **Database / Supabase settings** section.
3. Paste the **Project URL** and **anon key**, and click **Save / Connect**.
4. Click **"Push all data to Supabase"** once to upload the current menu/staff/orders.

> Note: on serverless hosts (Vercel) the filesystem is read-only, so Option B only lasts for the
> current session. Use **Option A** there so the connection survives restarts.

---

## How to confirm it's connected

- Visit `/api/health` — it should return `{"status":"ok","supabaseConnected":true}`.
- In the admin panel the status badge reads **"Supabase Active ✓"** instead of "Local Database Mode".
- The server log prints `✓ Supabase connected to: https://...` on startup.
- Place a test order — it should appear as a new row in the **orders** table in Supabase.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `supabaseConnected: false` | Keys missing/empty, or URL doesn't start with `https://`. Recheck Step 3. |
| Sync error mentioning a table | You skipped Step 1 — run `supabase_schema.sql` in the SQL editor. |
| Connects but data doesn't save | Make sure you used the **anon** key and ran the full SQL (it disables RLS / adds policies). |
| Signboard photos vanish after a redeploy | The `signboards` bucket is missing or not public — see Step 1b. |
| Works locally but not on Vercel | Set the env vars in the Vercel dashboard (Option A) and redeploy; Option B doesn't persist there. |

---

*Data model reference: the app maps its fields to snake_case columns, e.g. `nameEn → name_en`,
`customerName → customer_name`, `totalPrice → total_price`. The full mapping lives in
`api/index.ts` (the `sync*ToSupabase` / `get*FromSupabase` helpers).*
