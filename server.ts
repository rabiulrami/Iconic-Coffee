import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { MENU_ITEMS } from "./src/data.ts";

function safeWriteFileSync(filePath: string, content: string | Buffer) {
  try {
    fs.writeFileSync(filePath, content, typeof content === "string" ? "utf8" : undefined);
  } catch (err: any) {
    console.warn(`[Read-Only Filesystem Warning] Ignored file write for ${path.basename(filePath)}: ${err.message}`);
  }
}

interface OrderItem {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  tableNumber: string;
  phoneNumber?: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'Awaiting Payment' | 'Pending' | 'Preparing' | 'Out for Table' | 'Delivered';
  createdAt: string;
  estimatedTimeMinutes: number;
  salesPerson?: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: 'Super Admin' | 'Manager' | 'Sales';
  pin: string;
}

const app = express();
const PORT = 3000;

  // Create uploads folder if not exists
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");
  const TMP_UPLOADS_DIR = "/tmp/uploads";

  if (!fs.existsSync(UPLOADS_DIR)) {
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    } catch (err) {
      console.error("Failed to create uploads directory:", err);
    }
  }

  try {
    if (!fs.existsSync(TMP_UPLOADS_DIR)) {
      fs.mkdirSync(TMP_UPLOADS_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Failed to create /tmp/uploads directory:", err);
  }

  // Middleware for body parsing with sufficiently large limit for base64 image data payload
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // Static directory for uploaded product images
  app.use("/uploads", express.static(UPLOADS_DIR));
  app.use("/uploads", express.static(TMP_UPLOADS_DIR));

  // Database Connection file or process environment variables
  const DB_CONFIG_FILE = path.join(process.cwd(), "database.json");
  let dbConfig = {
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ""
  };

  if (fs.existsSync(DB_CONFIG_FILE)) {
    try {
      const savedConfig = JSON.parse(fs.readFileSync(DB_CONFIG_FILE, "utf8"));
      if (savedConfig && savedConfig.supabaseUrl) {
        dbConfig.supabaseUrl = savedConfig.supabaseUrl;
      }
      if (savedConfig && savedConfig.supabaseAnonKey) {
        dbConfig.supabaseAnonKey = savedConfig.supabaseAnonKey;
      }
    } catch (e) {
      console.error("Failed to read database.json settings");
    }
  }

  let supabase: any = null;
  function initSupabase() {
    const url = dbConfig.supabaseUrl || process.env.SUPABASE_URL || "";
    const key = dbConfig.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || "";
    if (url && key && url.startsWith("https://")) {
      try {
        supabase = createClient(url, key);
        console.log(`✓ Supabase connected to: ${url}`);
      } catch (e: any) {
        console.error("✕ Supabase connection error:", e.message);
        supabase = null;
      }
    } else {
      supabase = null;
    }
  }
  initSupabase();

  // Products persistent database from JSON file or static seed
  const PRODUCTS_FILE = path.join(process.cwd(), "products.json");
  let products = [...MENU_ITEMS];

  if (fs.existsSync(PRODUCTS_FILE)) {
    try {
      products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
    } catch (e) {
      console.error("Failed to read persistent products.json, fallback to hardcoded seed.", e);
    }
  } else {
    try {
      safeWriteFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    } catch (e) {
      console.error("Failed to write initial products seed to products.json", e);
    }
  }

  // Staff persistent database seeded with standard roles
  const STAFF_FILE = path.join(process.cwd(), "staff.json");
  let staff: StaffMember[] = [
    { id: "staff-1", name: "Arif", role: "Sales", pin: "1111" },
    { id: "staff-2", name: "Rami", role: "Manager", pin: "2222" },
    { id: "staff-3", name: "Rabiul", role: "Manager", pin: "3333" },
    { id: "staff-4", name: "Sohail", role: "Sales", pin: "4444" }
  ];

  if (fs.existsSync(STAFF_FILE)) {
    try {
      staff = JSON.parse(fs.readFileSync(STAFF_FILE, "utf8"));
    } catch (e) {
      console.error("Failed to read staff.json file");
    }
  } else {
    try {
      safeWriteFileSync(STAFF_FILE, JSON.stringify(staff, null, 2));
    } catch (e) {
      console.error("Failed code-based save of initial staff list");
    }
  }

  // Super Admin security PIN state (Defaults to "1997")
  const ADMIN_PIN_FILE = path.join(process.cwd(), "admin_pin.json");
  let superAdminPin = process.env.SUPER_ADMIN_PIN || "1997";
  if (fs.existsSync(ADMIN_PIN_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(ADMIN_PIN_FILE, "utf8"));
      if (data && data.superAdminPin && !process.env.SUPER_ADMIN_PIN) {
        superAdminPin = data.superAdminPin;
      }
    } catch (e) {
      console.error("Failed to read admin_pin.json");
    }
  } else {
    try {
      safeWriteFileSync(ADMIN_PIN_FILE, JSON.stringify({ superAdminPin }, null, 2));
    } catch (e) {
      console.error("Failed to write initial admin_pin.json");
    }
  }

  // Active Orders Cache and Persistent File Database
  const ORDERS_FILE = path.join(process.cwd(), "orders.json");
  let orders: Order[] = [
    {
      id: "1001",
      customerName: "Rabiul",
      tableNumber: "03",
      phoneNumber: "0501234567",
      items: [
        { id: "spec-1", nameEn: "PISTACHIO ROSE LATTE", nameAr: "لاتيه الفستق والورد", price: 22, quantity: 1 },
        { id: "sweet-2", nameEn: "SAN SEBASTIAN", nameAr: "سان سيباستيان", price: 23, quantity: 1 }
      ],
      totalPrice: 45,
      status: "Delivered",
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      estimatedTimeMinutes: 12,
      salesPerson: "Arif"
    },
    {
      id: "1002",
      customerName: "Yousuf",
      tableNumber: "07",
      phoneNumber: "0559876543",
      items: [
        { id: "boba-1", nameEn: "SIGNATURE BROWN SUGAR BOBA", nameAr: "بوبا سكر بني إسجنتشر", price: 20, quantity: 2 },
        { id: "sweet-7", nameEn: "COOKIES", nameAr: "كوكيز", price: 10, quantity: 3 }
      ],
      totalPrice: 70,
      status: "Preparing",
      createdAt: new Date().toISOString(),
      estimatedTimeMinutes: 10,
      salesPerson: "Rami"
    }
  ];

  if (fs.existsSync(ORDERS_FILE)) {
    try {
      orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
    } catch (e) {
      console.error("Failed reading orders.json");
    }
  } else {
    try {
      safeWriteFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    } catch (e) {
      console.error("Failed saving orders to orders.json file");
    }
  }

  // --- Loyalty & Back-to-Back Streak Account Database ---
  interface LoyaltyProfile {
    identifier: string; // phone number or email
    streak: number;
    lastDate: string; // YYYY-MM-DD
    history: string[]; // YYYY-MM-DD
    rewardAvailable: boolean;
  }

  const LOYALTY_FILE = path.join(process.cwd(), "loyalty.json");
  let loyaltyProfiles: LoyaltyProfile[] = [];

  if (fs.existsSync(LOYALTY_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(LOYALTY_FILE, "utf8"));
      loyaltyProfiles = Array.isArray(parsed) ? parsed.filter((p: any) => p.identifier !== "_settings_") : [];
    } catch (e) {
      console.error("Failed reading loyalty.json database storage file");
    }
  } else {
    try {
      safeWriteFileSync(LOYALTY_FILE, JSON.stringify(loyaltyProfiles, null, 2));
    } catch (e) {
      console.error("Failed creating initial empty loyalty.json");
    }
  }

  // --- Loyalty selected products settings ---
  const LOYALTY_SETTINGS_FILE = path.join(process.cwd(), "loyalty_settings.json");
  let loyaltySettings = {
    freeProducts: ["cold-10", "boba-3", "boba-11"] as string[]
  };

  if (fs.existsSync(LOYALTY_SETTINGS_FILE)) {
    try {
      const loaded = JSON.parse(fs.readFileSync(LOYALTY_SETTINGS_FILE, "utf8"));
      if (loaded && Array.isArray(loaded.freeProducts) && loaded.freeProducts.length > 0) {
        loyaltySettings = loaded;
      }
    } catch (e) {
      console.error("Failed reading loyalty_settings.json");
    }
  } else {
    try {
      safeWriteFileSync(LOYALTY_SETTINGS_FILE, JSON.stringify(loyaltySettings, null, 2));
    } catch (e) {
      console.error("Failed creating initial empty loyalty_settings.json");
    }
  }

  loadAllSettingsFromSupabase().catch(e => console.error("Error doing initial load of settings from Supabase:", e));

  async function saveLoyaltyAndSync(profile?: LoyaltyProfile) {
    try {
      safeWriteFileSync(LOYALTY_FILE, JSON.stringify(loyaltyProfiles, null, 2));
      if (profile && supabase) {
        await syncLoyaltyToSupabase(profile);
      }
    } catch (e: any) {
      console.error("Failed saving loyaltyProfiles database:", e.message);
    }
  }

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDateString = (todayStr: string) => {
    const d = new Date(todayStr);
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getRefreshedProfile = (profile: LoyaltyProfile, todayStr: string): LoyaltyProfile => {
    if (!profile.lastDate) {
      profile.streak = 0;
      return profile;
    }
    if (profile.lastDate === todayStr) {
      return profile;
    }
    const yesterdayStr = getYesterdayDateString(todayStr);
    if (profile.lastDate === yesterdayStr) {
      return profile;
    }
    // They missed yesterday (the streak is broken and restarts from 0!)
    profile.streak = 0;
    return profile;
  };

  // --- Supabase Data Sync Helpers ---
  async function getProductsListFromSupabase() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("products").select("*").order("id");
        if (error) throw error;
        if (data && data.length > 0) {
          const fetched = data.map((d: any) => ({
            id: d.id,
            nameEn: d.name_en,
            nameAr: d.name_ar,
            price: Number(d.price),
            descriptionEn: d.description_en || "",
            descriptionAr: d.description_ar || "",
            category: d.category,
            tag: d.tag || "",
            image: d.image || "",
            isSpecial: !!d.is_special,
            bgColor: d.bg_color || undefined
          }));
          products = fetched;
          safeWriteFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
          return products;
        }
      } catch (err: any) {
        console.error("Failed querying Products from Supabase storage table, falling back to local file. Message:", err.message);
      }
    }
    return products;
  }

  async function syncProductToSupabase(p: any) {
    if (supabase) {
      const { error } = await supabase.from("products").upsert({
        id: p.id,
        name_en: p.nameEn,
        name_ar: p.nameAr,
        price: p.price,
        description_en: p.descriptionEn || "",
        description_ar: p.descriptionAr || "",
        category: p.category,
        tag: p.tag || "",
        image: p.image || "",
        is_special: p.isSpecial,
        bg_color: p.bgColor || null
      });
      if (error) {
        throw new Error(`Products table synchronization error: ${error.message}`);
      }
    }
  }

  async function deleteProductFromSupabase(id: string) {
    if (supabase) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        throw new Error(`Products table delete error: ${error.message}`);
      }
    }
  }

  async function getOrdersListFromSupabase() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        if (data) {
          const parsedOrders = data.map((d: any) => ({
            id: d.id,
            customerName: d.customer_name,
            tableNumber: d.table_number,
            phoneNumber: d.phone_number || "",
            totalPrice: Number(d.total_price),
            status: d.status,
            createdAt: d.created_at,
            estimatedTimeMinutes: d.estimated_time_minutes || 10,
            salesPerson: d.sales_person || "",
            items: typeof d.items === "string" ? JSON.parse(d.items) : (d.items || [])
          }));
          orders = parsedOrders;
          safeWriteFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
          return orders;
        }
      } catch (err: any) {
        console.error("Failed querying live Orders from Supabase database, using local file list. Error:", err.message);
      }
    }
    return orders;
  }

  async function syncOrderToSupabase(o: any) {
    if (supabase) {
      const { error } = await supabase.from("orders").upsert({
        id: o.id,
        customer_name: o.customerName,
        table_number: o.tableNumber,
        phone_number: o.phoneNumber || "",
        total_price: o.totalPrice,
        status: o.status,
        created_at: o.createdAt,
        estimated_time_minutes: o.estimatedTimeMinutes,
        sales_person: o.salesPerson || "",
        items: o.items
      });
      if (error) {
        throw new Error(`Orders table synchronization error: ${error.message}`);
      }
    }
  }

  async function getStaffListFromSupabase() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("staff").select("*").order("created_at", { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          const fetchedStaff = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            role: d.role,
            pin: d.pin
          }));
          staff = fetchedStaff;
          safeWriteFileSync(STAFF_FILE, JSON.stringify(staff, null, 2));
          return staff;
        }
      } catch (err: any) {
        console.error("Failed to read Staff list from Supabase, returning local data:", err.message);
      }
    }
    return staff;
  }

  async function syncStaffToSupabase(s: any) {
    if (supabase) {
      const { error } = await supabase.from("staff").upsert({
        id: s.id,
        name: s.name,
        role: s.role,
        pin: s.pin
      });
      if (error) {
        throw new Error(`Staff table synchronization error: ${error.message}`);
      }
    }
  }

  async function deleteStaffFromSupabase(id: string) {
    if (supabase) {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) {
        throw new Error(`Staff table delete error: ${error.message}`);
      }
    }
  }

  async function getLoyaltyProfilesFromSupabase() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("loyalty").select("*");
        if (error) throw error;
        if (data) {
          const fetched = data
            .filter((d: any) => d.identifier !== "_settings_")
            .map((d: any) => ({
              identifier: d.identifier,
              streak: Number(d.streak || 0),
              lastDate: d.last_date || "",
              history: typeof d.history === "string" ? JSON.parse(d.history) : (d.history || []),
              rewardAvailable: !!d.reward_available
            }));
          loyaltyProfiles = fetched;
          safeWriteFileSync(LOYALTY_FILE, JSON.stringify(loyaltyProfiles, null, 2));
          return loyaltyProfiles;
        }
      } catch (err: any) {
        console.error("Failed querying Loyalty Profiles from Supabase storage table, falling back to local file. Message:", err.message);
      }
    }
    return loyaltyProfiles;
  }

  async function loadAllSettingsFromSupabase() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("loyalty").select("*").eq("identifier", "_settings_").maybeSingle();
        if (error) throw error;
        if (data) {
          const config = typeof data.history === "string" ? JSON.parse(data.history) : (data.history || {});
          if (config) {
            if (config.freeProducts && Array.isArray(config.freeProducts)) {
              loyaltySettings.freeProducts = config.freeProducts;
              safeWriteFileSync(LOYALTY_SETTINGS_FILE, JSON.stringify(loyaltySettings, null, 2));
              console.log("✓ Loaded freeProducts from Supabase settings:", loyaltySettings.freeProducts);
            }
            if (config.superAdminPin && typeof config.superAdminPin === "string") {
              superAdminPin = config.superAdminPin;
              safeWriteFileSync(ADMIN_PIN_FILE, JSON.stringify({ superAdminPin }, null, 2));
              console.log("✓ Loaded superAdminPin from Supabase settings:", superAdminPin);
            }
          }
        }
      } catch (err: any) {
        console.error("Failed querying all settings from Supabase '_settings_' record:", err.message);
      }
    }
  }

  async function syncAllSettingsToSupabase() {
    if (supabase) {
      try {
        const configPayload = {
          freeProducts: loyaltySettings.freeProducts,
          superAdminPin: superAdminPin
        };
        const { error } = await supabase.from("loyalty").upsert({
          identifier: "_settings_",
          streak: 0,
          last_date: "_config_",
          history: configPayload,
          reward_available: false
        });
        if (error) {
          console.error("✕ Failed syncing all settings to Supabase:", error.message);
        } else {
          console.log("✓ Synced all settings to Supabase:", configPayload);
        }
      } catch (err: any) {
        console.error("✕ Error syncing all settings to Supabase:", err.message);
      }
    }
  }

  async function syncLoyaltyToSupabase(lp: any) {
    if (supabase) {
      const { error } = await supabase.from("loyalty").upsert({
        identifier: lp.identifier,
        streak: lp.streak,
        last_date: lp.lastDate || "",
        history: lp.history || [],
        reward_available: lp.rewardAvailable
      });
      if (error) {
        throw new Error(`Loyalty table synchronization error: ${error.message}`);
      }
    }
  }

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", supabaseConnected: !!supabase });
  });

  // Get Supabase DB configuration
  app.get("/api/settings/db", (req, res) => {
    res.json({
      supabaseUrl: dbConfig.supabaseUrl,
      supabaseAnonKey: dbConfig.supabaseAnonKey ? "••••••••••••••••" : "",
      supabaseConnected: !!supabase
    });
  });

  // Save/configure Supabase DB dynamically
  app.post("/api/settings/db", (req, res) => {
    const { supabaseUrl, supabaseAnonKey } = req.body;
    dbConfig.supabaseUrl = supabaseUrl || "";
    if (supabaseAnonKey && supabaseAnonKey !== "••••••••••••••••") {
      dbConfig.supabaseAnonKey = supabaseAnonKey;
    } else if (!supabaseAnonKey) {
      dbConfig.supabaseAnonKey = "";
    }

    try {
      safeWriteFileSync(DB_CONFIG_FILE, JSON.stringify(dbConfig, null, 2));
      initSupabase();
      res.json({ success: true, supabaseConnected: !!supabase });
    } catch (err: any) {
      initSupabase();
      res.json({ success: true, supabaseConnected: !!supabase, warning: "Connected in memory, database.json read-only." });
    }
  });

  // Dedicated API to decode base64 sent from React product form, save to uploads, and return public url link
  app.post("/api/upload", (req, res) => {
    try {
      const { filename, base64 } = req.body;
      if (!filename || !base64) {
        return res.status(400).json({ error: "Missing filename or image data" });
      }

      // Parse data URL schema
      const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid image format pattern" });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      if (!mimeType.startsWith("image/")) {
        return res.status(400).json({ error: "File uploaded must be a valid image" });
      }

      // Determine clean safe file extension
      const safeExt = filename.split(".").pop() || "png";
      const randomizedName = `product_${Date.now()}_${Math.floor(Math.random() * 100000)}.${safeExt}`;
      
      let filePath = path.join(UPLOADS_DIR, randomizedName);
      try {
        fs.writeFileSync(filePath, buffer);
        console.log(`✓ Image saved to disk: /uploads/${randomizedName}`);
      } catch (writeErr) {
        filePath = path.join(TMP_UPLOADS_DIR, randomizedName);
        fs.writeFileSync(filePath, buffer);
        console.log(`✓ Image saved to temporary folder /tmp/uploads/${randomizedName}`);
      }

      const resourceUrl = `/uploads/${randomizedName}`;
      res.json({ success: true, url: resourceUrl });
    } catch (err: any) {
      console.error("✕ Upload file error:", err.message);
      res.status(500).json({ error: "Failed to parse upload request: " + err.message });
    }
  });

  // Endpoint to manual force seed/push all local database values (products, staff, orders, loyalty) directly into Supabase tables
  app.post("/api/settings/push-all-to-supabase", async (req, res) => {
    if (!supabase) {
      return res.status(400).json({ error: "Supabase connection is not active! Please configure Supabase settings correctly first." });
    }

    try {
      console.log("⚡ Starting manual full push of all local records to Supabase tables...");
      
      let productsPushed = 0;
      let staffPushed = 0;
      let ordersPushed = 0;
      let loyaltyPushed = 0;

      // 1. Push Menu items to Products Table
      for (const p of products) {
        await syncProductToSupabase(p);
        productsPushed++;
      }

      // 2. Push Staff roster register to Staff Table
      for (const s of staff) {
        await syncStaffToSupabase(s);
        staffPushed++;
      }

      // 3. Push Orders histories to Orders Table
      for (const o of orders) {
        await syncOrderToSupabase(o);
        ordersPushed++;
      }

      // 4. Push Loyalty profiles to Loyalty Table
      for (const lp of loyaltyProfiles) {
        await syncLoyaltyToSupabase(lp);
        loyaltyPushed++;
      }

      console.log(`✓ Manual synchronization done! Pushed: ${productsPushed} products, ${staffPushed} staff, ${ordersPushed} orders, ${loyaltyPushed} loyalty profiles.`);
      res.json({
        success: true,
        summary: `Successfully synchronized local databases! Pushed ${productsPushed} items to 'products' table, ${staffPushed} staff members to 'staff' table, ${ordersPushed} invoices to 'orders' table, and ${loyaltyPushed} profiles to 'loyalty' table. Verification OK.`
      });
    } catch (err: any) {
      console.error("✕ Database synchronization push failed:", err.message);
      res.status(500).json({ 
        error: "Migration sync failed. Details: " + err.message + ". Please make sure you have executed the required SQL query in the Supabase SQL editor to declare all four tables ('products', 'staff', 'orders', and 'loyalty') with exact matching field definitions!"
      });
    }
  });

  // Authentication Pin Login
  app.post("/api/auth/login", async (req, res) => {
    await loadAllSettingsFromSupabase();
    const { pin, email } = req.body;

    // Email-based Super Admin login bypass
    if (email) {
      const emailLower = email.trim().toLowerCase();
      // Rabiul Sami (owner email rabiulrami@gmail.com, rabiul@iconiccoffee.com or admin@iconiccoffee.com)
      if (
        emailLower === "rabiulrami@gmail.com" || 
        emailLower === "rabiul@iconiccoffee.com" || 
        emailLower === "admin@iconiccoffee.com" ||
        emailLower === "owner@iconiccoffee.com"
      ) {
        // Option to verify pin or master code if provided, or simply logins successfully!
        if (!pin || pin === superAdminPin) {
          return res.json({
            success: true,
            user: { name: "Owner (Super Admin)", role: "Super Admin", email: emailLower }
          });
        } else {
          return res.status(401).json({ success: false, error: "Incorrect Admin PIN code (Security Verification Failed)" });
        }
      }
      return res.status(401).json({ success: false, error: "This email is not authorized as a Super Admin" });
    }

    if (!pin) {
      return res.status(400).json({ success: false, error: "PIN is required" });
    }

    // Dynamic Shop Owner master security bypass pin (Super Admin)
    if (pin === superAdminPin) {
      return res.json({
        success: true,
        user: { name: "Owner", role: "Super Admin" }
      });
    }

    // Otherwise lookup active staff members
    const activeStaff = await getStaffListFromSupabase();
    const found = activeStaff.find(s => s.pin === pin);
    if (found) {
      return res.json({
        success: true,
        user: { name: found.name, role: found.role }
      });
    }

    res.status(401).json({ success: false, error: "Incorrect Security PIN Code" });
  });

  // Get and Update Super Admin Pin endpoints
  app.get("/api/auth/super-admin-pin", async (req, res) => {
    await loadAllSettingsFromSupabase();
    res.json({ superAdminPin });
  });

  app.post("/api/auth/super-admin-pin", async (req, res) => {
    const { pin } = req.body;
    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits! (Numeric only)" });
    }
    superAdminPin = pin;
    try {
      safeWriteFileSync(ADMIN_PIN_FILE, JSON.stringify({ superAdminPin }, null, 2));
      await syncAllSettingsToSupabase();
      res.json({ success: true, message: "Super Admin PIN updated successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to persist Super Admin PIN: " + err.message });
    }
  });

  // Staff Management (Super Admin only access)
  app.get("/api/staff", async (req, res) => {
    const activeStaff = await getStaffListFromSupabase();
    res.json(activeStaff);
  });

  app.post("/api/staff", async (req, res) => {
    const { name, role, pin } = req.body;
    if (!name || !role || !pin) {
      return res.status(400).json({ error: "Missing required fields (name, role, pin)" });
    }

    // Check if PIN code already exists
    const activeStaff = await getStaffListFromSupabase();
    if (pin === superAdminPin || activeStaff.some(s => s.pin === pin)) {
      return res.status(400).json({ error: "PIN code is already taken! Please assign a unique PIN." });
    }

    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      name,
      role: role as any,
      pin
    };

    activeStaff.push(newStaff);
    staff = activeStaff;
    safeWriteFileSync(STAFF_FILE, JSON.stringify(staff, null, 2));
    await syncStaffToSupabase(newStaff);

    res.status(201).json(newStaff);
  });

  // Update specific employee's PIN
  app.put("/api/staff/:id/pin", async (req, res) => {
    const { id } = req.params;
    const { pin } = req.body;
    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits! (Numeric only)" });
    }

    const activeStaff = await getStaffListFromSupabase();
    const found = activeStaff.find(s => s.id === id);
    if (!found) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    if (pin === superAdminPin || activeStaff.some(s => s.pin === pin && s.id !== id)) {
      return res.status(400).json({ error: "This PIN code is already taken! Please assign a unique PIN." });
    }

    found.pin = pin;
    staff = activeStaff;
    safeWriteFileSync(STAFF_FILE, JSON.stringify(staff, null, 2));
    await syncStaffToSupabase(found);

    res.json({ success: true, message: `PIN updated successfully for ${found.name}!` });
  });

  app.delete("/api/staff/:id", async (req, res) => {
    const { id } = req.params;
    const activeStaff = await getStaffListFromSupabase();
    const idx = activeStaff.findIndex(s => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    activeStaff.splice(idx, 1);
    staff = activeStaff;
    safeWriteFileSync(STAFF_FILE, JSON.stringify(staff, null, 2));
    await deleteStaffFromSupabase(id);

    res.json({ success: true });
  });

  // --- Loyalty Status endpoints ---
  app.get("/api/loyalty", async (req, res) => {
    const activeLoyalty = await getLoyaltyProfilesFromSupabase();
    res.json(activeLoyalty);
  });

  // --- Loyalty selected products endpoints ---
  app.get("/api/loyalty/settings", async (req, res) => {
    await loadAllSettingsFromSupabase();
    res.json(loyaltySettings);
  });

  app.post("/api/loyalty/settings", async (req, res) => {
    const { freeProducts } = req.body;
    if (!freeProducts || !Array.isArray(freeProducts)) {
      return res.status(400).json({ error: "Invalid freeProducts parameter" });
    }
    // Limit to 3 items
    loyaltySettings.freeProducts = freeProducts.slice(0, 3);
    try {
      safeWriteFileSync(LOYALTY_SETTINGS_FILE, JSON.stringify(loyaltySettings, null, 2));
      await syncAllSettingsToSupabase();
      res.json({ success: true, loyaltySettings });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to write loyalty settings: " + err.message });
    }
  });

  app.post("/api/loyalty/add", async (req, res) => {
    const { identifier, streak, rewardAvailable } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "Phone number or email is required" });
    }
    const cleanId = identifier.trim().toLowerCase();
    await getLoyaltyProfilesFromSupabase();
    let profile = loyaltyProfiles.find(p => p.identifier === cleanId);
    if (profile) {
      profile.streak = parseInt(streak, 10) || 0;
      profile.rewardAvailable = !!rewardAvailable;
      await saveLoyaltyAndSync(profile);
      return res.json({ success: true, message: "Updated existing member profile", profile });
    } else {
      profile = {
        identifier: cleanId,
        streak: parseInt(streak, 10) || 0,
        lastDate: "",
        history: [],
        rewardAvailable: !!rewardAvailable
      };
      loyaltyProfiles.push(profile);
      await saveLoyaltyAndSync(profile);
      return res.json({ success: true, message: "Successfully added new loyal member", profile });
    }
  });

  app.post("/api/loyalty/check", async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "Phone number or email is required" });
    }
    const cleanId = identifier.trim().toLowerCase();
    await getLoyaltyProfilesFromSupabase();
    let profile = loyaltyProfiles.find(p => p.identifier === cleanId);
    const todayStr = getLocalDateString();
    
    if (!profile) {
      profile = {
        identifier: cleanId,
        streak: 0,
        lastDate: "",
        history: [],
        rewardAvailable: false
      };
      loyaltyProfiles.push(profile);
      await saveLoyaltyAndSync(profile);
    } else {
      profile = getRefreshedProfile(profile, todayStr);
      await saveLoyaltyAndSync(profile);
    }
    res.json(profile);
  });

  app.post("/api/loyalty/claim", async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "Identifier required" });
    }
    const cleanId = identifier.trim().toLowerCase();
    await getLoyaltyProfilesFromSupabase();
    const profile = loyaltyProfiles.find(p => p.identifier === cleanId);
    if (profile) {
      profile.rewardAvailable = false;
      profile.streak = 0;
      await saveLoyaltyAndSync(profile);
      return res.json({ success: true, profile });
    }
    res.status(404).json({ error: "Profile not found" });
  });

  // Get all orders (for Admin Dashboard)
  app.get("/api/orders", async (req, res) => {
    const activeOrders = await getOrdersListFromSupabase();
    res.json(activeOrders);
  });

  // Create a new order
  app.post("/api/orders", async (req, res) => {
    try {
      const { customerName, tableNumber, phoneNumber, items, salesPerson, status, redeemReward, redeemType } = req.body;

      if (!customerName || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing required fields: customerName, tableNumber, items" });
      }

      // Generate a short 4-digit order ID starting from 1003 or incremented
      const activeOrders = await getOrdersListFromSupabase();
      let maxId = 1000;
      activeOrders.forEach(o => {
        const parsed = parseInt(o.id);
        if (!isNaN(parsed) && parsed > maxId) maxId = parsed;
      });
      const nextId = String(maxId + 1);

      // Estimate preparation time based on items:
      let estimatedTime = 7;
      let sweetCount = 0;
      let totalAmount = 0;
      let claimedLoyaltyFreeItem = false;

      items.forEach((item: any) => {
        if (item.isLoyaltyFree) {
          const isAllowedFreeProduct = loyaltySettings.freeProducts && loyaltySettings.freeProducts.includes(item.id);
          if (isAllowedFreeProduct) {
            item.price = 0; // Force price to 0 in the backend!
            claimedLoyaltyFreeItem = true;
          } else {
            // Reset isLoyaltyFree if it's not actually an approved loyalty free item
            item.isLoyaltyFree = false;
          }
        }
        totalAmount += Number(item.price) * Number(item.quantity);
        if (item.id && (item.id.startsWith('sweet') || item.id.startsWith('spec'))) {
          sweetCount += item.quantity;
        }
      });

      estimatedTime += sweetCount * 2;
      if (estimatedTime > 25) estimatedTime = 25;

      let finalPrice = totalAmount;
      let appliedDiscount = 0;
      let streakBefore = 0;
      let streakAfter = 0;

      // Calculate loyalty streak
      if (phoneNumber && phoneNumber.trim().length > 3) {
        const cleanPhone = phoneNumber.trim().toLowerCase();
        await getLoyaltyProfilesFromSupabase();
        let profile = loyaltyProfiles.find(p => p.identifier === cleanPhone);
        const todayStr = getLocalDateString();

        if (claimedLoyaltyFreeItem) {
          if (!profile || !profile.rewardAvailable) {
            return res.status(400).json({ error: "You are not eligible for a Loyalty Free Gift. Please complete your 5-day coffee streak first!" });
          }
        }
        
        if (!profile) {
          profile = {
            identifier: cleanPhone,
            streak: 1,
            lastDate: todayStr,
            history: [todayStr],
            rewardAvailable: false
          };
          loyaltyProfiles.push(profile);
          streakBefore = 0;
          streakAfter = 1;
        } else {
          profile = getRefreshedProfile(profile, todayStr);
          streakBefore = profile.streak;

          // Apply selected consecutive loyalty reward if requested and available
          if ((redeemReward || claimedLoyaltyFreeItem) && profile.rewardAvailable) {
            profile.rewardAvailable = false;
            profile.streak = 0;
            streakBefore = 0;
            if (claimedLoyaltyFreeItem) {
              // The free gift price was already set to 0, so no additional discount is applied!
              appliedDiscount = 0;
            } else if (redeemType === 'free_item') {
              // Find the highest priced item to make it free, BUT ONLY if it is in the configured free loyalty products list!
              let maxPrice = 0;
              items.forEach((item: any) => {
                const isAllowed = loyaltySettings.freeProducts && loyaltySettings.freeProducts.includes(item.id);
                if (isAllowed) {
                  const itemPrice = Number(item.price);
                  if (itemPrice > maxPrice) {
                    maxPrice = itemPrice;
                  }
                }
              });
              
              if (maxPrice === 0) {
                return res.status(400).json({ error: "To claim your free product reward, please ensure at least one of your 3 configured Loyalty Gift products is added to your cart!" });
              }
              
              appliedDiscount = maxPrice; // 100% discount of that single unit free item
            } else {
              appliedDiscount = Math.round(totalAmount * 0.2); // flat 20% off
            }
            finalPrice = totalAmount - appliedDiscount;
            if (finalPrice < 0) finalPrice = 0;
          }

          // Increment streak for a new visitation day
          if (!profile.history.includes(todayStr)) {
            profile.history.push(todayStr);
            const yesterdayStr = getYesterdayDateString(todayStr);
            if (profile.lastDate === yesterdayStr) {
              profile.streak += 1;
              if (profile.streak >= 5) {
                profile.rewardAvailable = true;
                profile.streak = 5;
              }
            } else {
              profile.streak = 1;
            }
            profile.lastDate = todayStr;
          }
          streakAfter = profile.streak;
        }
        await saveLoyaltyAndSync(profile);
      } else {
        if (claimedLoyaltyFreeItem) {
          return res.status(400).json({ error: "Phone number is required to claim a Loyalty Free Gift!" });
        }
      }

      const newOrder: Order = {
        id: nextId,
        customerName,
        tableNumber,
        phoneNumber: phoneNumber || "",
        items,
        totalPrice: finalPrice,
        status: status || (salesPerson ? "Preparing" : "Awaiting Payment"),
        createdAt: new Date().toISOString(),
        estimatedTimeMinutes: estimatedTime,
        salesPerson: salesPerson || ""
      };

      orders = activeOrders;
      orders.push(newOrder);
      safeWriteFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
      await syncOrderToSupabase(newOrder);

      res.status(201).json(newOrder);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Retrieve single order status (for mobile tracking)
  app.get("/api/orders/:id", async (req, res) => {
    const activeOrders = await getOrdersListFromSupabase();
    const order = activeOrders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  });

  // Update order status or details
  app.patch("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    const { status, estimatedTimeMinutes } = req.body;

    const activeOrders = await getOrdersListFromSupabase();
    const orderIndex = activeOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (status) {
      activeOrders[orderIndex].status = status;
    }
    if (estimatedTimeMinutes !== undefined) {
      activeOrders[orderIndex].estimatedTimeMinutes = Number(estimatedTimeMinutes);
    }

    orders = activeOrders;
    safeWriteFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    await syncOrderToSupabase(activeOrders[orderIndex]);

    res.json(activeOrders[orderIndex]);
  });

  // Export raw CSV content for immediate customer download
  app.get("/api/export-sheets", async (req, res) => {
    try {
      const activeOrders = await getOrdersListFromSupabase();
      let csvContent = "Order ID,Customer Name,Table Number,Contact,Status,Created At,Total Price,Items,Salesperson\n";
      
      activeOrders.forEach(order => {
        const itemsSummary = order.items.map(item => `${item.nameEn} (x${item.quantity})`).join(" | ");
        const cleanedDate = order.createdAt.replace(/T/, " ").replace(/\..+/, "");
        csvContent += `"${order.id}","${order.customerName.replace(/"/g, '""')}","${order.tableNumber}","${order.phoneNumber || ''}","${order.status}","${cleanedDate}",SR ${order.totalPrice},"${itemsSummary.replace(/"/g, '""')}","${order.salesPerson || ''}"\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="IconicCoffee_OrderSheet_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).send("Error generating export data");
    }
  });

  // Get active products
  app.get("/api/products", async (req, res) => {
    const activeProducts = await getProductsListFromSupabase();
    res.json(activeProducts);
  });

  // Create a new product item
  app.post("/api/products", async (req, res) => {
    try {
      const { nameEn, nameAr, price, descriptionEn, descriptionAr, category, tag, image, isSpecial } = req.body;
      
      if (!nameEn || !nameAr || price === undefined || !category) {
        return res.status(400).json({ error: "Missing required fields (nameEn, nameAr, price, category)" });
      }

      const newProduct = {
        id: `${category}-${Date.now()}`,
        nameEn,
        nameAr,
        price: Number(price),
        descriptionEn: descriptionEn || "",
        descriptionAr: descriptionAr || "",
        category,
        tag: tag || "",
        image: image || "",
        isSpecial: !!isSpecial,
        bgColor: isSpecial ? "from-amber-50 to-orange-100" : undefined
      };

      const activeProducts = await getProductsListFromSupabase();
      activeProducts.push(newProduct);
      products = activeProducts;
      safeWriteFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
      await syncProductToSupabase(newProduct);
      res.status(201).json(newProduct);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update a product item
  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const activeProducts = await getProductsListFromSupabase();
      const idx = activeProducts.findIndex(p => p.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Product not found" });
      }

      const { nameEn, nameAr, price, descriptionEn, descriptionAr, category, tag, image, isSpecial } = req.body;

      activeProducts[idx] = {
        ...activeProducts[idx],
        nameEn: nameEn !== undefined ? nameEn : activeProducts[idx].nameEn,
        nameAr: nameAr !== undefined ? nameAr : activeProducts[idx].nameAr,
        price: price !== undefined ? Number(price) : activeProducts[idx].price,
        descriptionEn: descriptionEn !== undefined ? descriptionEn : activeProducts[idx].descriptionEn,
        descriptionAr: descriptionAr !== undefined ? descriptionAr : activeProducts[idx].descriptionAr,
        category: category !== undefined ? category : activeProducts[idx].category,
        tag: tag !== undefined ? tag : activeProducts[idx].tag,
        image: image !== undefined ? image : activeProducts[idx].image,
        isSpecial: isSpecial !== undefined ? !!isSpecial : activeProducts[idx].isSpecial,
        bgColor: isSpecial ? "from-amber-50 to-orange-100" : undefined
      };

      products = activeProducts;
      safeWriteFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
      await syncProductToSupabase(products[idx]);
      res.json(products[idx]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a product item
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const activeProducts = await getProductsListFromSupabase();
      const idx = activeProducts.findIndex(p => p.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Product not found" });
      }

      activeProducts.splice(idx, 1);
      products = activeProducts;
      safeWriteFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
      await deleteProductFromSupabase(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(550).json({ error: err.message });
    }
  });

  // Dynamic asset routing for dev/SPA fallback
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT with Vite live compilation...");
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
    }).catch((err) => {
      console.error("Vite server middleware initialization error:", err);
    });
  } else {
    console.log("Starting server in PRODUCTION. Serving static artifacts directly...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✓ Digital Menu server is running on http://localhost:${PORT}`);
    });
  }

export default app;
