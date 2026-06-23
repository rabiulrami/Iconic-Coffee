import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Check, 
  Timer, 
  Send, 
  Globe, 
  Search, 
  CheckCircle2, 
  Database,
  Download,
  Link2,
  Trash2,
  Table,
  PlusCircle,
  Edit2,
  Sparkles,
  Layers,
  Sparkle,
  Image as ImageIcon,
  TrendingUp,
  Plus,
  Upload,
  Award,
  Copy
} from 'lucide-react';

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

interface AdminSheetProps {
  currentUser: {
    name: string;
    role: 'Super Admin' | 'Manager' | 'Sales';
  };
  onBackToMenu: () => void;
}

// Curated selection of aesthetic premium coffee shop photography presets from Unsplash
const IMAGE_PRESETS = [
  { name: "Pistachio Rose Latte", url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400" },
  { name: "Iced Shaken Spanish", url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=400" },
  { name: "Burnt Basque Cheesecake", url: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?auto=format&fit=crop&q=80&w=400" },
  { name: "Premium French Crepes", url: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&q=80&w=400" },
  { name: "Warm Matcha Green Tea", url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400" },
  { name: "Fudge Chocolate Brownies", url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400" },
  { name: "Brown Sugar Boba", url: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400" },
  { name: "Coffee Beans & Cup", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400" }
];

export default function AdminSheet({ currentUser, onBackToMenu }: AdminSheetProps) {
  // Navigation & Core admin tabs
  const [activeAdminTab, setActiveAdminTab] = useState<'orders' | 'products' | 'reports' | 'staff' | 'loyalty' | 'settings'>('orders');

  // Pagination states for Orders & Loyaty screens
  const [ordersPage, setOrdersPage] = useState(1);
  const [loyaltyPage, setLoyaltyPage] = useState(1);

  // Super Admin and employee PIN editing states
  const [inputSuperAdminPin, setInputSuperAdminPin] = useState('');
  const [savingSuperAdminPin, setSavingSuperAdminPin] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingStaffPin, setEditingStaffPin] = useState<string>('');

  // Loyalty members tracking states
  const [loyaltyProfiles, setLoyaltyProfiles] = useState<any[]>([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  const fetchLoyaltyProfiles = async () => {
    setLoyaltyLoading(true);
    try {
      const res = await fetch('/api/loyalty');
      if (res.ok) {
        const data = await res.json();
        setLoyaltyProfiles(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'loyalty') {
      fetchLoyaltyProfiles();
      fetchLoyaltySettings();
    }
    if (activeAdminTab === 'staff') {
      fetchSuperAdminPin();
    }
  }, [activeAdminTab]);

  // Staff manual order creation states
  const [showStaffOrderModal, setShowStaffOrderModal] = useState(false);
  const [staffCustomerName, setStaffCustomerName] = useState('Walk-in Guest');
  const [staffTableNumber, setStaffTableNumber] = useState('01');
  const [staffSalesPerson, setStaffSalesPerson] = useState(currentUser ? currentUser.name : 'Owner');
  const [staffOrderStatus, setStaffOrderStatus] = useState<'Preparing' | 'Delivered' | 'Awaiting Payment'>('Preparing');
  const [staffCart, setStaffCart] = useState<{ id: string; quantity: number }[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Staff manual order loyalty integration
  const [staffPhoneNumber, setStaffPhoneNumber] = useState('');
  const [staffRedeemReward, setStaffRedeemReward] = useState(false);
  const [staffRedeemType, setStaffRedeemType] = useState<'20_percent' | 'free_item'>('20_percent');
  const [staffLoyaltyProfile, setStaffLoyaltyProfile] = useState<any | null>(null);

  useEffect(() => {
    if (staffPhoneNumber.trim().length > 3) {
      const delayCheck = setTimeout(() => {
        fetch('/api/loyalty/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: staffPhoneNumber })
        })
          .then(res => res.json())
          .then(data => {
            if (data && !data.error) {
              setStaffLoyaltyProfile(data);
            } else {
              setStaffLoyaltyProfile(null);
            }
          })
          .catch(err => {
            console.error(err);
            setStaffLoyaltyProfile(null);
          });
      }, 500);
      return () => clearTimeout(delayCheck);
    } else {
      setStaffLoyaltyProfile(null);
      setStaffRedeemReward(false);
    }
  }, [staffPhoneNumber]);

  // Database / Supabase states
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);

  const supabaseSqlQuery = `-- 1. Create 'products' table
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

-- 2. Create 'staff' table
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT,
  role TEXT,
  pin TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 'orders' table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  table_number TEXT,
  phone_number TEXT,
  total_price NUMERIC,
  status TEXT,
  items JSONB,
  sales_person TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  estimated_time_minutes INTEGER DEFAULT 10
);

-- 4. Create 'loyalty' table
CREATE TABLE IF NOT EXISTS loyalty (
  identifier TEXT PRIMARY KEY,
  streak INTEGER DEFAULT 0,
  last_date TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  reward_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (RLS) to allow simple direct inserts and updates
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty DISABLE ROW LEVEL SECURITY;

-- Fallback: Just in case RLS stays enabled, we explicitly add public policies allowing ALL operations
DROP POLICY IF EXISTS "Allow all for anonymous users on products" ON public.products;
CREATE POLICY "Allow all for anonymous users on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anonymous users on staff" ON public.staff;
CREATE POLICY "Allow all for anonymous users on staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anonymous users on orders" ON public.orders;
CREATE POLICY "Allow all for anonymous users on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anonymous users on loyalty" ON public.loyalty;
CREATE POLICY "Allow all for anonymous users on loyalty" ON public.loyalty FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSqlQuery);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Staff list Management states
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Sales' | 'Manager'>('Sales');
  const [newStaffPin, setNewStaffPin] = useState('');

  // Selected loyalty reward products (up to 3)
  const [loyaltySelectedProd1, setLoyaltySelectedProd1] = useState('');
  const [loyaltySelectedProd2, setLoyaltySelectedProd2] = useState('');
  const [loyaltySelectedProd3, setLoyaltySelectedProd3] = useState('');
  const [loyaltySettingsLoading, setLoyaltySettingsLoading] = useState(false);
  const [loyaltySettingsMsg, setLoyaltySettingsMsg] = useState('');

  const fetchLoyaltySettings = async () => {
    try {
      const res = await fetch('/api/loyalty/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.freeProducts) {
          setLoyaltySelectedProd1(data.freeProducts[0] || '');
          setLoyaltySelectedProd2(data.freeProducts[1] || '');
          setLoyaltySelectedProd3(data.freeProducts[2] || '');
        }
      }
    } catch (e) {
      console.error("Failed to fetch loyalty settings on admin", e);
    }
  };

  const handleSaveLoyaltySettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoyaltySettingsLoading(true);
    setLoyaltySettingsMsg('');
    try {
      const freeProducts = [loyaltySelectedProd1, loyaltySelectedProd2, loyaltySelectedProd3].filter(Boolean);
      const res = await fetch('/api/loyalty/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freeProducts })
      });
      if (res.ok) {
        setLoyaltySettingsMsg('✓ Loyalty reward products updated and saved!');
        setTimeout(() => setLoyaltySettingsMsg(''), 4000);
      } else {
        const err = await res.json();
        setLoyaltySettingsMsg(`❌ Error: ${err.error || 'Failed to save'}`);
      }
    } catch (e) {
      console.error(e);
      setLoyaltySettingsMsg('❌ Network connection error');
    } finally {
      setLoyaltySettingsLoading(false);
    }
  };

  // Loyalty addition variables
  const [newLoyaltyPhone, setNewLoyaltyPhone] = useState('');
  const [newLoyaltyStreak, setNewLoyaltyStreak] = useState(0);
  const [newLoyaltyReward, setNewLoyaltyReward] = useState(false);
  const [loyaltySubmitting, setLoyaltySubmitting] = useState(false);
  const [loyaltyMsg, setLoyaltyMsg] = useState('');

  const handleAddLoyaltySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoyaltyPhone.trim()) return;
    setLoyaltySubmitting(true);
    setLoyaltyMsg('');
    try {
      const res = await fetch('/api/loyalty/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: newLoyaltyPhone.trim(),
          streak: newLoyaltyStreak,
          rewardAvailable: newLoyaltyStreak >= 5 || newLoyaltyReward
        })
      });
      if (res.ok) {
        const result = await res.json();
        setLoyaltyMsg(`✓ ${result.message || 'Loyalty member registered!'}`);
        setNewLoyaltyPhone('');
        setNewLoyaltyStreak(0);
        setNewLoyaltyReward(false);
        fetchLoyaltyProfiles();
        setTimeout(() => setLoyaltyMsg(''), 4000);
      } else {
        const errData = await res.json();
        setLoyaltyMsg(`❌ Error: ${errData.error || 'Failed to add'}`);
      }
    } catch (err) {
      console.error(err);
      setLoyaltyMsg('❌ Connection error');
    } finally {
      setLoyaltySubmitting(false);
    }
  };

  // Customer Orders Queue variables
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Reset pagination pages when searching/filtering
  useEffect(() => {
    setOrdersPage(1);
    setLoyaltyPage(1);
  }, [searchQuery, filterStatus]);
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState('');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [webhookSavedMsg, setWebhookSavedMsg] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Products Catalogue Management variables
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Add/Edit Product form states
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formPrice, setFormPrice] = useState('15');
  const [formDescriptionEn, setFormDescriptionEn] = useState('');
  const [formDescriptionAr, setFormDescriptionAr] = useState('');
  const [formCategory, setFormCategory] = useState('hot');
  const [formTag, setFormTag] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIsSpecial, setFormIsSpecial] = useState(false);

  // Safe non-modal states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => prev?.text === text ? null : prev);
    }, 4000);
  };

  // Fetch current orders
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      setOrders(data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dynamic products
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Failed to load products list", e);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load database settings
  const fetchDBSettings = async () => {
    try {
      const res = await fetch('/api/settings/db');
      if (res.ok) {
        const data = await res.json();
        setSupabaseUrl(data.supabaseUrl || '');
        setSupabaseAnonKey(data.supabaseAnonKey || '');
        setSupabaseConnected(data.supabaseConnected || false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save database settings
  const handleSaveDbSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDb(true);
    setDbStatusMsg('');
    try {
      const res = await fetch('/api/settings/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseUrl, supabaseAnonKey })
      });
      if (res.ok) {
        const data = await res.json();
        setSupabaseConnected(data.supabaseConnected);
        setDbStatusMsg(data.supabaseConnected ? "✓ Database configuration successfully synced with Supabase!" : "✕ Connected to local server, but Supabase connection failed. Double-check tables existence.");
        showToast(data.supabaseConnected ? "✓ Supabase connected successfully!" : "Saved, but connection rejected.", data.supabaseConnected ? "success" : "error");
      } else {
        showToast("Error updating database.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Service timeout.", "error");
    } finally {
      setIsSavingDb(false);
    }
  };

  // Synchronize and push all local datasets directly to Supabase tables
  const [isPushingLocal, setIsPushingLocal] = useState(false);
  const [pushSyncResult, setPushSyncResult] = useState<string | null>(null);

  // Upload picture states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const handlePushLocalToSupabase = async () => {
    setIsPushingLocal(true);
    setPushSyncResult(null);
    try {
      const res = await fetch("/api/settings/push-all-to-supabase", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        setPushSyncResult(data.summary || "✓ Synchronized all local records with Supabase successfully!");
        showToast("✓ Sync completed successfully!", "success");
        // Reload data from newly sync'd DB
        fetchProducts();
        fetchOrders();
        fetchStaff();
      } else {
        setPushSyncResult(`✕ Synchronization failed: ${data.error || "Unknown error"}`);
        showToast("✕ Sync rejected by server.", "error");
      }
    } catch (err: any) {
      console.error(err);
      setPushSyncResult(`✕ Sync connection error: ${err.message || "Timeout"}`);
      showToast("Service connection error", "error");
    } finally {
      setIsPushingLocal(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (limit to 10mb)
    if (file.size > 10 * 1024 * 1024) {
      setImageUploadError("✕ File is too large! Maximum limit is 10 MB.");
      showToast("File is too large! Max 10MB.", "error");
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            base64: base64Data
          })
        });

        const resJson = await uploadRes.json();
        if (uploadRes.ok) {
          setFormImage(resJson.url);
          showToast("✓ Picture uploaded successfully!", "success");
        } else {
          setImageUploadError(`✕ Upload failed: ${resJson.error || "Unknown server response"}`);
          showToast("✕ Image upload aborted.", "error");
        }
      } catch (err: any) {
        console.error(err);
        setImageUploadError("✕ Network connection failed during upload.");
        showToast("Upload failed.", "error");
      } finally {
        setIsUploadingImage(false);
      }
    };

    reader.onerror = () => {
      setImageUploadError("✕ Failed reading file properties.");
      setIsUploadingImage(false);
    };

    reader.readAsDataURL(file);
  };

  // Staff listing
  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStaffLoading(false);
    }
  };

  // Create staff account
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffPin || newStaffPin.length !== 4 || isNaN(Number(newStaffPin))) {
      showToast("Security code PIN must be exactly 4 digits!", "error");
      return;
    }
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStaffName, role: newStaffRole, pin: newStaffPin })
      });
      if (res.ok) {
        showToast("✓ Employee account has been provisioned!");
        setNewStaffName('');
        setNewStaffPin('');
        fetchStaff();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to register staff account.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Technical database query failed.", "error");
    }
  };

  // Remove staff account
  const handleDeleteStaff = async (id: string) => {
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Staff account terminated.");
        fetchStaff();
      } else {
        showToast("Failed to remove staff member.", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch current Super Admin PIN
  const fetchSuperAdminPin = async () => {
    try {
      const res = await fetch('/api/auth/super-admin-pin');
      if (res.ok) {
        const data = await res.json();
        setInputSuperAdminPin(data.superAdminPin || '');
      }
    } catch (err) {
      console.error("Failed to load Super Admin PIN:", err);
    }
  };

  // Update Super Admin PIN
  const handleUpdateSuperAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSuperAdminPin || inputSuperAdminPin.length !== 4 || isNaN(Number(inputSuperAdminPin))) {
      showToast("Super Admin PIN must be exactly 4 digits!", "error");
      return;
    }
    setSavingSuperAdminPin(true);
    try {
      const res = await fetch('/api/auth/super-admin-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: inputSuperAdminPin })
      });
      if (res.ok) {
        showToast("✓ Super Admin PIN updated successfully!");
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to update Super Admin PIN.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Technical database query failed.", "error");
    } finally {
      setSavingSuperAdminPin(false);
    }
  };

  // Update employee/staff PIN inline
  const handleUpdateStaffPin = async (id: string, newPin: string) => {
    if (!newPin || newPin.length !== 4 || isNaN(Number(newPin))) {
      showToast("Employee PIN must be exactly 4 digits!", "error");
      return;
    }
    try {
      const res = await fetch(`/api/staff/${id}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin })
      });
      if (res.ok) {
        showToast("✓ Employee PIN updated successfully!");
        setEditingStaffId(null);
        fetchStaff();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to update employee PIN.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Technical database query failed.", "error");
    }
  };

  // Load everything on mount
  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchDBSettings();
    fetchStaff();
    fetchLoyaltySettings();
    
    // Check path for default tab selection
    const path = window.location.pathname.toLowerCase();
    if (path === '/sales' || path === '/sales-person') {
      setActiveAdminTab('reports');
    }
  }, []);

  // Poll orders
  useEffect(() => {
    if (!autoRefresh || activeAdminTab !== 'orders') return;
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeAdminTab]);

  // Handle changing status of an order
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Save Webhook Integration
  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWebhook(true);
    try {
      const response = await fetch('/api/settings/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetWebhookUrl })
      });
      if (response.ok) {
        setWebhookSavedMsg(true);
        setTimeout(() => setWebhookSavedMsg(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingWebhook(false);
    }
  };

  // Product actions handlers
  const openEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setFormNameEn(prod.nameEn);
    setFormNameAr(prod.nameAr);
    setFormPrice(String(prod.price));
    setFormDescriptionEn(prod.descriptionEn || '');
    setFormDescriptionAr(prod.descriptionAr || '');
    setFormCategory(prod.category);
    setFormTag(prod.tag || '');
    setFormImage(prod.image || '');
    setFormIsSpecial(!!prod.isSpecial);
    setShowAddProductModal(true);
  };

  const openAddNewProduct = () => {
    setEditingProduct(null);
    setFormNameEn('');
    setFormNameAr('');
    setFormPrice('15');
    setFormDescriptionEn('');
    setFormDescriptionAr('');
    setFormCategory('hot');
    setFormTag('');
    setFormImage('');
    setFormIsSpecial(false);
    setShowAddProductModal(true);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameEn.trim() || !formNameAr.trim() || !formPrice) {
      showToast("Please provide at least local English & Arabic product names!", "error");
      return;
    }

    const payload = {
      nameEn: formNameEn.trim(),
      nameAr: formNameAr.trim(),
      price: Number(formPrice),
      descriptionEn: formDescriptionEn.trim(),
      descriptionAr: formDescriptionAr.trim(),
      category: formCategory,
      tag: formTag.trim(),
      image: formImage.trim(),
      isSpecial: formIsSpecial
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowAddProductModal(false);
        showToast(editingProduct ? "Product details updated successfully!" : "Newly recruited recipe drink added successfully!");
        fetchProducts();
      } else {
        showToast("Failed to save the product to the server database shelf.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Connection failed.", "error");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        showToast("Product item deleted successfully.");
        fetchProducts();
      } else {
        showToast("Server failed to delete item.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Connection failure while deleting product.", "error");
    }
  };

  // Staff order cart calculations
  const cartItems = staffCart.map(c => {
    const prod = products.find(p => p.id === c.id);
    return { prod, quantity: c.quantity };
  }).filter(c => c.prod !== undefined) as { prod: any; quantity: number }[];

  const cartTotalPrice = cartItems.reduce((sum, item) => sum + (item.prod?.price || 0) * item.quantity, 0);

  const getStaffOrderDiscount = () => {
    if (!staffRedeemReward || !staffLoyaltyProfile || !staffLoyaltyProfile.rewardAvailable) return 0;
    if (staffRedeemType === 'free_item') {
      const allowedIds = [loyaltySelectedProd1, loyaltySelectedProd2, loyaltySelectedProd3].filter(Boolean);
      const eligibleItems = cartItems.filter(item => allowedIds.includes(item.prod?.id));
      const prices = eligibleItems.map(item => item.prod?.price || 0);
      return prices.length > 0 ? Math.max(...prices) : 0;
    } else {
      return Math.round(cartTotalPrice * 0.2);
    }
  };
  const staffDiscount = getStaffOrderDiscount();
  const staffFinalPrice = cartTotalPrice - staffDiscount;

  const handleUpdateStaffCartItemQty = (prodId: string, delta: number) => {
    setStaffCart(prev => {
      const existing = prev.find(item => item.id === prodId);
      if (!existing) {
        if (delta > 0) return [...prev, { id: prodId, quantity: delta }];
        return prev;
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter(item => item.id !== prodId);
      }
      return prev.map(item => item.id === prodId ? { ...item, quantity: newQty } : item);
    });
  };

  const handleCreateStaffOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staffCart.length === 0) {
      showToast("Please add at least one recipe item from list to checkout!", "error");
      return;
    }

    const allowedIds = [loyaltySelectedProd1, loyaltySelectedProd2, loyaltySelectedProd3].filter(Boolean);
    const hasEligibleLoyaltyItem = cartItems.some(item => allowedIds.includes(item.prod?.id));
    if (staffRedeemReward && staffRedeemType === 'free_item' && !hasEligibleLoyaltyItem) {
      showToast("To claim the free product reward, please ensure at least one of your 3 configured Loyalty Gift products is added to the cart!", "error");
      return;
    }

    const orderPayloadItems = cartItems.map(item => ({
      id: item.prod.id,
      nameEn: item.prod.nameEn,
      nameAr: item.prod.nameAr,
      price: item.prod.price,
      quantity: item.quantity
    }));

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: staffCustomerName.trim() || 'Walk-in Guest',
          tableNumber: staffTableNumber,
          phoneNumber: staffPhoneNumber.trim(),
          items: orderPayloadItems,
          salesPerson: staffSalesPerson,
          status: staffOrderStatus,
          redeemReward: staffRedeemReward,
          redeemType: staffRedeemType
        })
      });

      if (response.ok) {
        showToast("✓ Barista-created manual order created and logged successfully!");
        setShowStaffOrderModal(false);
        setStaffCart([]);
        setStaffCustomerName('Walk-in Guest');
        setStaffPhoneNumber('');
        setStaffRedeemReward(false);
        setStaffRedeemType('20_percent');
        setStaffLoyaltyProfile(null);
        fetchOrders();
      } else {
        showToast("Server refused logging staff order records.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network connection error to local server.", "error");
    }
  };

  // Filter lists inside viewport
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.includes(searchQuery) ||
      order.tableNumber.includes(searchQuery);

    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const itemsPerPage = 10;
  
  const totalOrdersPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const currentOrdersPage = Math.min(ordersPage, totalOrdersPages);
  const paginatedOrders = filteredOrders.slice((currentOrdersPage - 1) * itemsPerPage, currentOrdersPage * itemsPerPage);

  const filteredLoyaltyProfiles = loyaltyProfiles.filter(profile => 
    !searchQuery.trim() || profile.identifier.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalLoyaltyPages = Math.ceil(filteredLoyaltyProfiles.length / itemsPerPage) || 1;
  const currentLoyaltyPage = Math.min(loyaltyPage, totalLoyaltyPages);
  const paginatedLoyaltyProfiles = filteredLoyaltyProfiles.slice((currentLoyaltyPage - 1) * itemsPerPage, currentLoyaltyPage * itemsPerPage);

  const filteredProducts = products.filter(prod => {
    if (searchQuery.trim() === '') return true;
    return prod.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.nameAr.includes(searchQuery) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Premium iframe-safe dynamic Toast banner */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border animate-fadeIn transition-all duration-300 ${
          toastMsg.type === 'error' 
            ? 'bg-red-950 border-red-800 text-red-100' 
            : 'bg-emerald-950 border-emerald-800 text-emerald-100'
        }`}>
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            {toastMsg.type === 'error' ? '🛑 Error:' : '✨ Info:'} {toastMsg.text}
          </span>
          <button 
            type="button"
            onClick={() => setToastMsg(null)}
            className="ml-2 hover:opacity-80 text-xs font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Header Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-[#9C5D30] flex items-center justify-center shadow-lg shadow-amber-900/30">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-slate-100 uppercase">Iconic Coffee POS</h1>
            <p className="text-[10px] text-green-400 font-mono flex items-center gap-1 leading-none pt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Operator: {currentUser ? currentUser.name : 'Owner'} ({currentUser ? currentUser.role : 'Super Admin'})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex flex-col items-end text-right mr-2 font-mono">
            <span className="text-[9px] text-[#A28259] uppercase tracking-widest font-bold">Cloud Synced</span>
            <span className="text-[10px] text-slate-400">{supabaseConnected ? "Supabase Active ✓" : "Local Database Mode ℹ"}</span>
          </div>
          <button 
            type="button"
            onClick={() => { fetchOrders(); fetchProducts(); fetchStaff(); }}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Force Reload Data State"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
          </button>
          <button
            type="button"
            onClick={onBackToMenu}
            className="px-3 py-2 bg-red-950 hover:bg-red-900 border border-red-800/50 text-[10px] text-red-200 font-black uppercase rounded-lg transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
          >
            🔓 Log Out
          </button>
        </div>
      </header>

      {/* Tabs navigation sub-bar */}
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex gap-2 sm:gap-3 sticky top-[61px] z-30 justify-center flex-wrap">
        <button
          type="button"
          onClick={() => { setActiveAdminTab('orders'); setSearchQuery(''); }}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
            activeAdminTab === 'orders' 
              ? 'bg-[#9C5D30] text-white shadow-lg border border-amber-500/20' 
              : 'hover:text-slate-200 text-slate-400 bg-slate-800/40 hover:bg-slate-800'
          }`}
        >
          📋 Customer Order Requests
        </button>

        {currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Manager') && (
          <>
            <button
              type="button"
              onClick={() => { setActiveAdminTab('products'); setSearchQuery(''); }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
                activeAdminTab === 'products' 
                  ? 'bg-[#9C5D30] text-white shadow-lg border border-amber-500/20' 
                  : 'hover:text-slate-200 text-slate-400 bg-slate-800/40 hover:bg-slate-800'
              }`}
            >
              ☕ Products Catalog
            </button>
            <button
              type="button"
              onClick={() => { setActiveAdminTab('reports'); setSearchQuery(''); }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
                activeAdminTab === 'reports' 
                  ? 'bg-[#9C5D30] text-white shadow-lg border border-amber-500/20' 
                  : 'hover:text-slate-200 text-slate-400 bg-slate-800/40 hover:bg-slate-800'
              }`}
            >
              📊 Reports & Analytics
            </button>
          </>
        )}

        {currentUser && currentUser.role === 'Super Admin' && (
          <button
            type="button"
            onClick={() => { setActiveAdminTab('staff'); setSearchQuery(''); }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'staff' 
                ? 'bg-[#9C5D30] text-white shadow-lg border border-amber-500/20' 
                : 'hover:text-slate-200 text-slate-400 bg-slate-800/40 hover:bg-slate-800'
            }`}
          >
            👥 Staff Accounts
          </button>
        )}

        {currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Manager') && (
          <button
            type="button"
            onClick={() => { setActiveAdminTab('loyalty'); setSearchQuery(''); }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'loyalty' 
                ? 'bg-[#9C5D30] text-white shadow-lg border border-amber-500/20' 
                : 'hover:text-slate-200 text-slate-400 bg-slate-800/40 hover:bg-slate-800'
            }`}
          >
            ⭐ Streak Loyalty Club
          </button>
        )}

        {currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Manager') && (
          <button
            type="button"
            onClick={() => { setActiveAdminTab('settings'); setSearchQuery(''); }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'settings' 
                ? 'bg-[#9C5D30] text-white shadow-lg border border-amber-500/20' 
                : 'hover:text-slate-200 text-slate-400 bg-slate-800/40 hover:bg-slate-800'
            }`}
          >
            ⚙️ Supabase Settings
          </button>
        )}
      </div>

      {/* Main Container */}
      <main className="flex-1 p-4 max-w-6xl w-full mx-auto space-y-6">

        {/* Tab 1: Orders Queue Spreadsheet */}
        {activeAdminTab === 'orders' && (() => {
          const totalRevenue = orders.reduce((sum, order) => sum + (order.status !== 'Awaiting Payment' ? order.totalPrice : 0), 0);
          const activeOrdersCount = orders.filter(o => o.status !== 'Delivered').length;
          const preparingCount = orders.filter(o => o.status === 'Preparing').length;
          const deliveredCount = orders.filter(o => o.status === 'Delivered').length;

          return (
            <>
              {/* Premium Dashboard KPI Metric Scorecards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
                <div className="bg-slate-950/70 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-[#9C5D30]/45 transition-all duration-300 shadow-xl">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#9C5D30]/5 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block font-mono">EST. REVENUE</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1 tracking-tight">SR {totalRevenue}</span>
                    <span className="text-[9px] text-slate-500 font-mono">Paid / confirmed bills only</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-[#9C5D30]/45 transition-all duration-300 shadow-xl">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block font-mono">ACTIVE QUEUE</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-500 block mt-1 tracking-tight">{activeOrdersCount} Tables</span>
                    <span className="text-[9px] text-slate-500 font-mono">Currently serving live streams</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
                    <Timer className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-[#9C5D30]/45 transition-all duration-300 shadow-xl">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block font-mono">BREW PREPS</span>
                    <span className="text-xl sm:text-2xl font-black text-blue-400 block mt-1 tracking-tight">{preparingCount} Recipes</span>
                    <span className="text-[9px] text-slate-500 font-mono">Actively under hot prep cooker</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-[#9C5D30]/45 transition-all duration-300 shadow-xl">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block font-mono">CLOSED ORDERS</span>
                    <span className="text-xl sm:text-2xl font-black text-purple-400 block mt-1 tracking-tight">{deliveredCount} items</span>
                    <span className="text-[9px] text-slate-500 font-mono">Delivered and closed safely</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-inner">
                    <Check className="w-5 h-5" />
                  </div>
                </div>
              </div>

            {/* Real-Time Queue Service Despatcher Guide */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 shadow-inner">
              <h2 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                ☕ Live Barista Brewing queue
              </h2>
              <p className="text-xs text-slate-300">
                You are viewing the real-time active customer orders database. Update any order's progress cell status using the inline action column buttons, and watch the customer's countdown timer and status update immediately on their mobile device!
              </p>
            </div>

            {/* Filters and Control Area */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-3 border border-slate-800 rounded-xl">
              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search table, customer, order ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Filtering Tabs */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-slate-400 block pr-2 font-mono">Filter Cells:</span>
                {['All', 'Awaiting Payment', 'Pending', 'Preparing', 'Out for Table', 'Delivered'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      filterStatus === status 
                        ? 'bg-amber-600 text-white shadow-md' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Real Spreadsheet Styled Grid UI */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-amber-500" /> Orders Database Spreadsheet Mode
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffCart([]);
                      setStaffCustomerName("Walk-in Guest");
                      setStaffTableNumber("Takeaway");
                      setStaffSalesPerson(currentUser ? currentUser.name : "Owner");
                      setStaffOrderStatus("Preparing");
                      setStaffSearchQuery("");
                      setShowStaffOrderModal(true);
                    }}
                    className="px-3 py-1.5 bg-[#9C5D30] hover:bg-[#b06a37] text-[10px] font-black uppercase text-white rounded-lg flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all border border-amber-500/25"
                  >
                    <Plus className="w-3.5 h-3.5" /> ⚡ Create Staff Order
                  </button>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-200">
                    <input 
                      type="checkbox" 
                      checked={autoRefresh} 
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-slate-800 text-amber-600 focus:ring-0 bg-slate-950"
                    />
                    Auto-Refresh (4s)
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto animate-fadeIn">
                {loading ? (
                  <div className="p-10 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-amber-500" />
                    <p className="text-xs font-mono">Retrieving active queue statuses...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-700 mb-2" />
                    No active pending order records in the queue. Place orders from the main customer digital menu to view them here live!
                  </div>
                ) : (
                  <table className="w-full text-left font-mono border-collapse text-xs">
                    <thead>
                      <tr className="bg-amber-900/10 border-b border-slate-800 text-amber-400 font-bold uppercase tracking-wider select-none text-[10px]">
                        <th className="py-3 px-4 border-r border-slate-800">Order ID</th>
                        <th className="py-3 px-4 border-r border-slate-800">Table</th>
                        <th className="py-3 px-4 border-r border-slate-800">Customer Name</th>
                        <th className="py-3 px-4 border-r border-slate-800">Selected Items (Qty)</th>
                        <th className="py-3 px-4 border-r border-slate-800">Bill (SR)</th>
                        <th className="py-3 px-4 border-r border-slate-800">Estimated Prep Time</th>
                        <th className="py-3 px-4 border-r border-slate-800">Live Status</th>
                        <th className="py-3 px-4 text-center">Order Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 leading-relaxed">
                      {paginatedOrders.map((order, idx) => {
                        let statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                        if (order.status === 'Awaiting Payment') statusColor = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30 font-bold animate-pulse';
                        if (order.status === 'Preparing') statusColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
                        if (order.status === 'Out for Table') statusColor = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
                        if (order.status === 'Delivered') statusColor = 'text-green-400 bg-green-500/10 border-green-500/30';

                        return (
                          <tr 
                            key={order.id} 
                            className={`hover:bg-slate-900/85 transition-all ${idx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/30'}`}
                          >
                            <td className="py-3.5 px-4 font-bold text-slate-200 border-r border-slate-800/50">#{order.id}</td>
                            <td className="py-3.5 px-4 text-orange-400 font-bold border-r border-slate-800/50 text-center">{order.tableNumber}</td>
                            <td className="py-3.5 px-4 border-r border-slate-800/50">
                              <div className="font-semibold text-slate-100">{order.customerName}</div>
                              {order.phoneNumber && <span className="text-[10px] text-slate-500 block">{order.phoneNumber}</span>}
                              {order.salesPerson && (
                                <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-slate-950 text-amber-500 rounded border border-amber-550/20 text-[9px] font-extrabold uppercase tracking-wide">
                                  💼 STAFF: {order.salesPerson}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs border-r border-slate-800/50">
                              <div className="space-y-1">
                                {order.items.map((it, i) => (
                                  <div key={i} className="text-[11px] text-slate-300 flex justify-between gap-1.5">
                                    <span className="truncate">{it.nameEn} <span className="text-slate-500">({it.nameAr})</span></span>
                                    <span className="font-bold text-amber-500 bg-amber-500/5 px-1 rounded whitespace-nowrap">x{it.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-400 border-r border-slate-800/50">SR {order.totalPrice}</td>
                            <td className="py-3.5 px-4 border-r border-slate-800/50">
                              <div className="flex items-center gap-1.5">
                                <Timer className="w-3.5 h-3.5 text-slate-500" />
                                <input 
                                  type="number" 
                                  min="1" 
                                  value={order.estimatedTimeMinutes}
                                  onChange={(e) => {
                                    const t = parseInt(e.target.value);
                                    if (!isNaN(t)) {
                                      fetch(`/api/orders/${order.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ estimatedTimeMinutes: t }),
                                      });
                                      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, estimatedTimeMinutes: t } : o));
                                    }
                                  }}
                                  className="w-12 text-center bg-slate-900 border border-slate-800 rounded font-bold text-slate-300 py-1"
                                />
                                <span className="text-[10px] text-slate-500">mins</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 border-r border-slate-800/50">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold focus:outline-none font-mono cursor-pointer ${statusColor}`}
                              >
                                <option value="Awaiting Payment">Awaiting Payment 💰</option>
                                <option value="Pending">Pending ⏳</option>
                                <option value="Preparing">Preparing ☕</option>
                                <option value="Out for Table">Out for Table 🏃</option>
                                <option value="Delivered">Delivered ✓</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {order.status === 'Awaiting Payment' ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                                  className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1 mx-auto shadow-md cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Confirm Payment
                                </button>
                              ) : order.status !== 'Delivered' ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                                  className="px-3 py-1.5 bg-green-900/60 hover:bg-green-600 text-green-400 hover:text-white border border-green-800 hover:border-transparent text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                                </button>
                              ) : (
                                <div className="text-slate-500 italic text-[11px] flex items-center justify-center gap-1">
                                  <Check className="w-4 h-4 text-green-500" /> Served & Closed
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Orders Pagination Controls */}
              {totalOrdersPages > 1 && (
                <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={currentOrdersPage === 1}
                    onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 disabled:hover:bg-slate-850 text-slate-300 font-mono text-[10px] font-bold rounded-lg border border-slate-850 disabled:opacity-40 select-none transition-all flex items-center gap-1 cursor-pointer"
                  >
                    ◀ Prev
                  </button>
                  <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">
                    Page {currentOrdersPage} of {totalOrdersPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentOrdersPage === totalOrdersPages}
                    onClick={() => setOrdersPage(p => Math.min(totalOrdersPages, p + 1))}
                    className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 disabled:hover:bg-slate-850 text-slate-300 font-mono text-[10px] font-bold rounded-lg border border-slate-850 disabled:opacity-40 select-none transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Next ▶
                  </button>
                </div>
              )}

              <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>SHOWING {paginatedOrders.length} OF {filteredOrders.length} FILTERED (TOTAL {orders.length}) CELL ENTRIES</span>
                <span>SYSTEM STABLE. SECURE SSL LINK ACTIVE</span>
              </div>
            </div>
          </>
          );
        })()}

        {/* Tab 3: Reports & Sales Leaderboard */}
        {activeAdminTab === 'reports' && (() => {
          // Calculate metrics
          const completedOrders = orders.filter(o => o.status !== 'Awaiting Payment');
          const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
          
          // Today's Date String
          const todayString = new Date().toDateString();
          const todayOrders = completedOrders.filter(o => new Date(o.createdAt).toDateString() === todayString);
          const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalPrice, 0);

          // Salesperson Stats
          const salespersonStats: { [key: string]: { revenue: number, count: number } } = {};
          completedOrders.forEach(o => {
            const spName = o.salesPerson || "Self Service / Table QR";
            if (!salespersonStats[spName]) {
              salespersonStats[spName] = { revenue: 0, count: 0 };
            }
            salespersonStats[spName].revenue += o.totalPrice;
            salespersonStats[spName].count += 1;
          });

          const salespersonLeaderboard = Object.entries(salespersonStats)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.revenue - a.revenue);

          // Daily stats reporting
          const dailyStats: { [key: string]: { revenue: number, count: number } } = {};
          completedOrders.forEach(o => {
            const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            if (!dailyStats[dateStr]) {
              dailyStats[dateStr] = { revenue: 0, count: 0 };
            }
            dailyStats[dateStr].revenue += o.totalPrice;
            dailyStats[dateStr].count += 1;
          });

          const dailyReports = Object.entries(dailyStats)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Product sales stats
          const productStats: { [key: string]: { qty: number, revenue: number, nameAr: string } } = {};
          completedOrders.forEach(o => {
            o.items.forEach(i => {
              const nameEn = i.nameEn || "Custom Brew";
              if (!productStats[nameEn]) {
                productStats[nameEn] = { qty: 0, revenue: 0, nameAr: i.nameAr || "" };
              }
              productStats[nameEn].qty += i.quantity;
              productStats[nameEn].revenue += i.price * i.quantity;
            });
          });

          const productLeaderboard = Object.entries(productStats)
            .map(([nameEn, stats]) => ({ nameEn, ...stats }))
            .sort((a, b) => b.qty - a.qty);

          return (
            <div className="space-y-6 animate-fadeIn">
              {/* Report Header */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between flex-wrap gap-4 shadow-inner">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-500" /> Executive Financial & Salesperson Analytics
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    Track daily sales, trace who made how many transactions, and evaluate popular recipe items. Calculations automatically exclude unpaid orders to maintain book precision.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono block text-slate-500">LAST SYNC TIMING</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">● LIVE RUNTIME SYNCED</span>
                </div>
              </div>

              {/* Grid 1: Revenue KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/70 border border-slate-850 p-4 rounded-xl shadow-lg">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block">TODAY'S REVENUE</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-500 block mt-1">SR {todayRevenue}</span>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">For {todayString}</p>
                </div>
                <div className="bg-slate-950/70 border border-slate-850 p-4 rounded-xl shadow-lg">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block">TODAY'S SALES COUNT</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-500 block mt-1">{todayOrders.length} Orders</span>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">Total sold quantities: {todayOrders.reduce((sum, o) => sum + o.items.reduce((acc, i) => acc + i.quantity, 0), 0)}</p>
                </div>
                <div className="bg-slate-950/70 border border-slate-850 p-4 rounded-xl shadow-lg">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block">ALL-TIME REVENUE</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1">SR {totalRevenue}</span>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">Across all calendar dates</p>
                </div>
                <div className="bg-slate-950/70 border border-slate-850 p-4 rounded-xl shadow-lg">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block">ALL-TIME RECEIPTS</span>
                  <span className="text-xl sm:text-2xl font-black text-cyan-400 block mt-1">{completedOrders.length} Invoices</span>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">Average checkout price: SR {completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0}</p>
                </div>
              </div>

              {/* Leaderboard and Sales Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left side: Sales Person Performance leaderboard */}
                <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      💼 Salesperson Performance Ledger
                    </h3>
                    <span className="text-[9.5px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400/90 rounded font-bold uppercase tracking-wider">
                      Staff Tracking
                    </span>
                  </div>

                  {salespersonLeaderboard.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs leading-relaxed font-mono">
                      No staff sales recorded yet. Use the 'Create Staff Order' button to register sales with custom barista attributions.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {salespersonLeaderboard.map((sp, sIdx) => {
                        // Max progress ratio calculation
                        const maxRevenue = salespersonLeaderboard[0]?.revenue || 1;
                        const percentage = Math.max(8, Math.round((sp.revenue / maxRevenue) * 100));
                        
                        return (
                          <div key={sp.name} className="space-y-1.5 p-3 bg-slate-900/40 rounded-xl border border-slate-850 hover:border-slate-800 transition">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-100 flex items-center gap-2">
                                <span className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded-full text-[10px] text-amber-400 font-mono border border-slate-700 shadow-sm">
                                  {sIdx + 1}
                                </span>
                                {sp.name}
                              </span>
                              <span className="font-mono font-black text-emerald-400">SR {sp.revenue}</span>
                            </div>

                            {/* Bar Chart Representation */}
                            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                className="bg-gradient-to-r from-[#9C5D30] to-amber-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>

                            <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                              <span>Percentage of peak: {percentage}%</span>
                              <span>{sp.count} total customer transactions</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right side: Daily Sales Reports */}
                <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      📅 Daily Sales General Log
                    </h3>
                    <span className="text-[9.5px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400/90 rounded font-bold uppercase tracking-wider font-mono">
                      Daily Stats
                    </span>
                  </div>

                  {dailyReports.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs leading-relaxed font-mono">
                      No sales history compiled yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono border-collapse text-[11px] text-slate-300">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-[9.5px] uppercase text-slate-400 font-bold tracking-wider">
                            <th className="py-2.5 px-3">Date Record</th>
                            <th className="py-2.5 px-3 text-center">Receipts Count</th>
                            <th className="py-2.5 px-3 text-right">Daily Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {dailyReports.map((report) => (
                            <tr key={report.date} className="hover:bg-slate-900/30">
                              <td className="py-3 px-3 font-semibold text-slate-100">{report.date}</td>
                              <td className="py-3 px-3 text-center font-bold text-amber-500">{report.count} checkouts</td>
                              <td className="py-3 px-3 text-right font-black text-emerald-400">SR {report.revenue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Row 3: Product Sales leaderboard popularity */}
              <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    🍧 Recipe & Product Popularity Index
                  </h3>
                  <span className="text-[9.5px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/90 rounded font-bold uppercase tracking-wider font-mono">
                    Product Leaderboard
                  </span>
                </div>

                {productLeaderboard.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    No product transactions logged.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productLeaderboard.slice(0, 9).map((product, pIdx) => {
                      const maxQty = productLeaderboard[0]?.qty || 1;
                      const percentage = Math.max(10, Math.round((product.qty / maxQty) * 100));
                      
                      return (
                        <div key={product.nameEn} className="p-3 bg-slate-900/50 rounded-xl border border-slate-850 flex flex-col justify-between space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-bold text-slate-100 uppercase tracking-tight">{product.nameEn}</div>
                              <div className="text-[10px] text-slate-400 block" dir="rtl">{product.nameAr}</div>
                            </div>
                            <span className="text-xs bg-amber-500/15 text-amber-400 font-mono font-black px-2 py-0.5 rounded border border-amber-500/10">
                              #{pIdx + 1} Best
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>Sold Quantity: <b className="text-slate-300">{product.qty} servings</b></span>
                              <span>SR {product.revenue}</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full animate-pulse" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* Tab 2: Products Catalog Management */}
        {activeAdminTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Guide Board */}
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between flex-wrap gap-4 shadow-inner">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Customized Customer Menu Catalog
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  Add, edit, or delete sweet treats, espresso shots, or boba drinks. Change pictures, pricing, and tag labels instantly on all tables. 
                  Below, use the simple Image presets to load coffee photography instantly!
                </p>
              </div>
              <button
                type="button"
                onClick={openAddNewProduct}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-xs font-black uppercase text-white rounded-lg flex items-center gap-1.5 shadow transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add New Product Item
              </button>
            </div>

            {/* Quick Filter Search */}
            <div className="bg-slate-900 p-3 border border-slate-800 rounded-xl relative">
              <Search className="absolute left-6.5 top-5.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search products by English or Arabic name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Grid display list of products */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productsLoading ? (
                <div className="col-span-full p-10 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-amber-500" />
                  <p className="text-xs font-mono">Loading product lists from storage database...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full p-12 text-center text-slate-400 bg-slate-950 rounded-xl border border-slate-850">
                  No products matched the current keyword index. Clear search or add a new recipe!
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  return (
                    <div 
                      key={prod.id || prod.nameEn}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-4 hover:border-slate-700/80 transition relative overflow-hidden"
                    >
                      {/* Thumbnail frame of item */}
                      <div className="w-20 h-20 rounded-lg bg-slate-900 border border-slate-850 shrink-0 overflow-hidden relative flex items-center justify-center">
                        {prod.image ? (
                          prod.image.startsWith('http') ? (
                            <img 
                              src={prod.image} 
                              alt={prod.nameEn} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            // Is a code name mapping, fallback to icon or default
                            <div className="text-center p-1 text-slate-500 flex flex-col items-center">
                              <Layers className="w-6 h-6 text-amber-650 mb-1" />
                              <span className="text-[7.5px] font-bold font-mono tracking-tighter truncate max-w-[70px]">{prod.image}</span>
                            </div>
                          )
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-705" />
                        )}
                        <span className="absolute bottom-1 right-1 bg-slate-950/80 px-1 py-0.5 rounded text-[8px] font-mono font-bold text-amber-400">
                          {prod.category}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-sans font-bold text-slate-100 text-sm truncate pr-2">{prod.nameEn}</h4>
                            <span className="text-emerald-400 font-mono font-bold text-xs">SR {prod.price}</span>
                          </div>
                          <h5 className="text-xs text-amber-500 font-sans font-semibold text-right truncate" dir="rtl">{prod.nameAr}</h5>
                          <p className="text-[10.5px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                            {prod.descriptionEn || "Delicious hand-dripped recipe item by Iconic Coffee."}
                          </p>
                        </div>

                        {/* Actions drawer */}
                        <div className="flex justify-between items-center mt-3.5 pt-2 border-t border-slate-900">
                          <span className="text-[9px] text-slate-500 font-mono uppercase bg-slate-900 px-1 rounded">
                            ID: {prod.id}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProduct(prod)}
                              className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded flex items-center gap-1 transition cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-amber-500" /> Edit Details
                            </button>
                            {deleteConfirmId === prod.id ? (
                              <div className="flex items-center gap-1.5 animate-fadeIn">
                                <span className="text-[10px] uppercase font-bold text-red-400">Sure?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded uppercase cursor-pointer"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 text-[10px] rounded uppercase cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(prod.id)}
                                className="p-1 bg-red-950/45 hover:bg-red-900 border border-red-900/30 text-red-400 hover:text-white rounded transition cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* Tab 5: Streak Loyalty Members Management */}
        {activeAdminTab === 'loyalty' && (
          <div className="space-y-6 animate-fadeIn text-slate-100">
            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-sm font-bold font-mono text-[#A28259] uppercase tracking-wider flex items-center gap-2">
                    ⭐ 5-Day Coffee Streak Club Members
                  </h2>
                  <p className="text-xs text-slate-400 mt-2">
                    Review and search for registered customer accounts, consecutive order streak indicators, and available reward coupon states.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchLoyaltyProfiles}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg font-mono flex items-center gap-1.5 transition text-amber-500 cursor-pointer"
                >
                  🔄 Reload Data
                </button>
              </div>

              {/* Admin Selected Loyalty Reward Products (Up to 3) */}
              <div className="mt-6 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-inner">
                <div>
                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1 font-mono flex items-center gap-1.5">
                    🎁 Select 3 Exclusive Reward Products for Loyalty Members
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Choose up to 3 products from your active menu. When a customer's 5-day streak is complete, they will see these 3 items as FREE on the homepage and can claim 1 of them.
                  </p>
                </div>

                <form onSubmit={handleSaveLoyaltySettingsSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1.5 font-bold">🎯 Product Choice #1</label>
                    <select
                      value={loyaltySelectedProd1}
                      onChange={(e) => setLoyaltySelectedProd1(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nameEn} ({p.category}) - {p.price} SR
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1.5 font-bold">🎯 Product Choice #2</label>
                    <select
                      value={loyaltySelectedProd2}
                      onChange={(e) => setLoyaltySelectedProd2(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nameEn} ({p.category}) - {p.price} SR
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1.5 font-bold">🎯 Product Choice #3</label>
                    <select
                      value={loyaltySelectedProd3}
                      onChange={(e) => setLoyaltySelectedProd3(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nameEn} ({p.category}) - {p.price} SR
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loyaltySettingsLoading}
                      className="w-full text-center py-2 bg-[#A28259] hover:bg-[#8e704b] disabled:opacity-50 text-white font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer uppercase shadow-md shadow-slate-950/20"
                    >
                      {loyaltySettingsLoading ? "Saving..." : "Save Choices 💾"}
                    </button>
                  </div>
                </form>
                {loyaltySettingsMsg && (
                  <p className="text-[11px] font-mono font-bold text-amber-400 animate-fadeIn mt-1">{loyaltySettingsMsg}</p>
                )}
              </div>

              {/* Lookup and Creation Utilities */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Column 1: Search */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">🔍 Search Member</h3>
                    <p className="text-[11px] text-slate-400">Search registered loyalty club members by phone or email identifier.</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Search for phone number or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Column 2: Add Loyalty Member */}
                <form onSubmit={handleAddLoyaltySubmit} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1 font-mono">➕ Add/Register Member</h3>
                    <p className="text-[11px] text-slate-400">Add or register a loyalty member by phone number or email of customer.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <input
                      type="text"
                      required
                      placeholder="e.g. +966500000000"
                      value={newLoyaltyPhone}
                      onChange={(e) => setNewLoyaltyPhone(e.target.value)}
                      className="flex-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 min-w-[140px]"
                    />
                    <select
                      value={newLoyaltyStreak}
                      onChange={(e) => setNewLoyaltyStreak(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 text-xs text-amber-500 font-bold px-2 py-2 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="0">0/5 Streak</option>
                      <option value="1">1/5 Streak</option>
                      <option value="2">2/5 Streak</option>
                      <option value="3">3/5 Streak</option>
                      <option value="4">4/5 Streak</option>
                      <option value="5">5/5 (20% Coupon)</option>
                    </select>
                    <button
                      type="submit"
                      disabled={loyaltySubmitting}
                      className="px-4 py-2 bg-[#A28259] hover:bg-[#8e704b] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {loyaltySubmitting ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                  {loyaltyMsg && (
                    <p className="text-[11px] font-semibold text-amber-400 animate-fadeIn">{loyaltyMsg}</p>
                  )}
                </form>
              </div>

              {loyaltyLoading ? (
                <div className="p-10 text-center text-slate-400 font-mono text-xs">
                  ⏳ Loading loyalty register cells...
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto border border-slate-800/60 rounded-xl">
                  <table className="w-full text-left font-mono border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider select-none text-[10px]">
                        <th className="py-3 px-4">Identifier</th>
                        <th className="py-3 px-4">Consecutive Streak</th>
                        <th className="py-3 px-4">Last Date Played</th>
                        <th className="py-3 px-4">Unlocked Rewards</th>
                        <th className="py-3 px-4 text-center">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {paginatedLoyaltyProfiles.map((profile, idx) => {
                          return (
                            <tr key={profile.identifier} className={idx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/40'}>
                              <td className="py-3 px-4 font-bold text-slate-100">{profile.identifier}</td>
                              <td className="py-3 px-4">
                                <span className="text-amber-500 font-extrabold text-[12px] pr-2">
                                  {profile.streak}/5
                                </span>
                                <span className="text-slate-500 text-[10px]">({profile.history?.length || 0} total orders)</span>
                                <div className="flex gap-1.5 mt-1.5">
                                  {[1, 2, 3, 4, 5].map((d) => (
                                    <div
                                      key={d}
                                      className={`h-2 w-2 rounded-full ${
                                        profile.streak >= d ? 'bg-amber-400' : 'bg-slate-800 border border-slate-700'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-300">{profile.lastDate || 'Never'}</td>
                              <td className="py-3 px-4">
                                {profile.rewardAvailable ? (
                                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md font-bold text-[10px] uppercase">
                                    🎉 coupon ready (20%)
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[10px]">In Progress</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Manually void/claim reward code for ${profile.identifier}?`)) {
                                      try {
                                        const r = await fetch('/api/loyalty/claim', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ identifier: profile.identifier })
                                        });
                                        if (r.ok) {
                                          alert("Coupon marked clean successfully!");
                                          fetchLoyaltyProfiles();
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }
                                  }}
                                  disabled={!profile.rewardAvailable}
                                  className="px-2.5 py-1 bg-red-950 hover:bg-red-900 disabled:opacity-40 text-red-300 border border-red-500/10 rounded text-[10.5px] cursor-pointer transition"
                                >
                                  Void Coupon Code
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {filteredLoyaltyProfiles.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            No registered loyalty streakers found yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Loyalty Pagination Controls */}
                  {totalLoyaltyPages > 1 && (
                    <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        disabled={currentLoyaltyPage === 1}
                        onClick={() => setLoyaltyPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 disabled:hover:bg-slate-850 text-slate-300 font-mono text-[10px] font-bold rounded-lg border border-slate-850 disabled:opacity-40 select-none transition-all flex items-center gap-1 cursor-pointer"
                      >
                        ◀ Prev
                      </button>
                      <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">
                        Page {currentLoyaltyPage} of {totalLoyaltyPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentLoyaltyPage === totalLoyaltyPages}
                        onClick={() => setLoyaltyPage(p => Math.min(totalLoyaltyPages, p + 1))}
                        className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 disabled:hover:bg-slate-850 text-slate-300 font-mono text-[10px] font-bold rounded-lg border border-slate-850 disabled:opacity-40 select-none transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Next ▶
                      </button>
                    </div>
                  )}

                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>SHOWING {paginatedLoyaltyProfiles.length} OF {filteredLoyaltyProfiles.length} REGISTERED STREAKERS</span>
                    <span>SECURE DATA LINK INSTANTIATED</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab 4: Staff accounts list and management */}
        {activeAdminTab === 'staff' && currentUser && currentUser.role === 'Super Admin' && (
          <div className="space-y-6 animate-fadeIn text-slate-100">
            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-sm font-bold font-mono text-[#A28259] uppercase tracking-wider flex items-center gap-2">
                👥 Staff Account Provisioning
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                Register new employees (Sales associates or Managers) and allocate unique PIN codes.
                Staff members can log in using their allocated 4-digit PIN keys to open checkout registers.
              </p>

              <form onSubmit={handleCreateStaff} className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Staff Full Name</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Salim Alhamdan"
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access Privilege Role</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                  >
                    <option value="Sales">Salesperson (Order Entries Only)</option>
                    <option value="Manager">Manager (Full POS Panel Access)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Login 4-Digit PIN</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 8888"
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-center font-black tracking-widest text-amber-500"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full text-xs uppercase font-bold bg-[#9C5D30] hover:bg-amber-600 text-white rounded py-2 px-4 transition cursor-pointer font-serif flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Register Employee
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-450">Active Registrars Directory</span>
                <span className="text-[10px] text-slate-400 font-mono">Total {staffList.length} employees found</span>
              </div>

              {staffLoading ? (
                <div className="p-8 text-center text-xs text-slate-500 font-mono animate-pulse">Retrieving roster file...</div>
              ) : staffList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-650 font-serif italic">No registrars provisioned. Add them above.</div>
              ) : (
                <div className="divide-y divide-slate-800 w-full bg-slate-950/30">
                  {staffList.map((st: any) => (
                    <div key={st.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-serif font-bold text-[#A28259]">
                          {st.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{st.name}</h4>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] uppercase font-bold mt-1 tracking-wider ${
                            st.role === 'Manager' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-850 text-slate-400'
                          }`}>
                            🛡️ {st.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {editingStaffId === st.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={4}
                              value={editingStaffPin}
                              onChange={(e) => setEditingStaffPin(e.target.value.replace(/\D/g, ''))}
                              className="w-20 text-center text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-205 font-mono font-black tracking-wider text-amber-400 focus:outline-none focus:border-amber-500"
                              placeholder="PIN"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateStaffPin(st.id, editingStaffPin)}
                              className="px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 font-bold text-[10px] text-white rounded cursor-pointer"
                            >
                              Save 💾
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStaffId(null)}
                              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-400 rounded cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-[9px] text-slate-500 block uppercase font-bold font-mono">allocated pin</span>
                              <span className="text-xs font-mono font-bold tracking-widest text-[#A28259]">•••• (PIN: {st.pin})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStaffId(st.id);
                                setEditingStaffPin(st.pin);
                              }}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-350 hover:text-white rounded transition cursor-pointer text-xs"
                              title="Edit Personal Login PIN"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Do you want to delete the staff account for ${st.name}?`)) {
                              handleDeleteStaff(st.id);
                            }
                          }}
                          className="p-1.5 bg-red-950/45 hover:bg-red-900 border border-red-900/25 text-red-400 hover:text-white rounded transition cursor-pointer"
                          title="Revoke and Delete Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Super Admin / Shop Owner Bypass PIN custom control card */}
            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-sm font-bold font-mono text-[#A28259] uppercase tracking-wider flex items-center gap-2">
                🛡️ Super Admin / Owner PIN Management
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                Set and change the shop owner dynamic security master PIN. Setting a secure, non-prefilled custom key prevents unauthorized admin dashboard access completely.
              </p>

              <form onSubmit={handleUpdateSuperAdminPin} className="mt-5 max-w-sm flex items-end gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="space-y-1.5 flex-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">New 4-Digit Super Admin PIN</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={inputSuperAdminPin}
                    onChange={(e) => setInputSuperAdminPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-center font-black tracking-widest text-amber-500"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={savingSuperAdminPin}
                    className="w-full text-xs uppercase font-bold bg-[#9C5D30] hover:bg-amber-600 disabled:opacity-50 text-white rounded py-2 px-4 transition cursor-pointer font-serif flex items-center justify-center gap-1"
                  >
                    {savingSuperAdminPin ? "Updating..." : "Update PIN"}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* Tab 5: Supabase Settings Config Panel */}
        {activeAdminTab === 'settings' && currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Manager') && (
          <div className="space-y-6 animate-fadeIn text-slate-100">
            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-sm font-bold font-mono text-[#A28259] uppercase tracking-wider flex items-center gap-2">
                ⚙️ Supabase Integration Control Pane
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Configure your persistent Cloud Database instantly. When connected, the POS terminal will automatically sync all tickets, 
                products menu modifications, page updates, and employees registers directory to your Supabase tables in real-time.
              </p>

              <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-slate-350 space-y-1">
                <p className="font-bold text-amber-400 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  ⚠️ Cloud Deployment & Vercel Notice
                </p>
                <p className="leading-relaxed">
                  Because Vercel runs in a serverless, read-only container environment, any credentials saved here cannot write to <code className="text-amber-500 font-mono">database.json</code> permanently. 
                  To keep Supabase connected permanently on Vercel, please set these two **Environment Variables** in your Vercel Dashboard:
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                  <div className="bg-slate-950 p-2 rounded border border-slate-850">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Variable Name</span>
                    <span className="text-amber-500 font-bold block">SUPABASE_URL</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-850">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Variable Name</span>
                    <span className="text-amber-500 font-bold block">SUPABASE_ANON_KEY</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveDbSettings} className="mt-5 space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Supabase API URL</label>
                    <span className="text-[9px] font-mono text-[#A28259]">Reference: SUPABASE_URL</span>
                  </div>
                  <input
                    type="url"
                    required
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://yourprojectid.supabase.co"
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-700/80 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Supabase Anon Key / Public Token</label>
                    <span className="text-[9px] font-mono text-[#A28259]">Reference: SUPABASE_ANON_KEY</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImNh..."
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-700/80 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {dbStatusMsg && (
                  <p className={`p-3 rounded-xl text-xs font-semibold leading-relaxed font-mono ${
                    supabaseConnected 
                      ? "bg-emerald-950/40 border border-emerald-850 text-emerald-300"
                      : "bg-red-950/40 border border-red-850 text-red-300"
                  }`}>
                    {dbStatusMsg}
                  </p>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSavingDb}
                    className="px-5 py-2.5 bg-[#9C5D30] hover:bg-amber-600 disabled:opacity-40 text-xs font-black uppercase tracking-wider text-white rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSavingDb ? 'animate-spin' : ''}`} />
                    {isSavingDb ? "Syncing API..." : "Save & Verify Sync"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSupabaseUrl('');
                      setSupabaseAnonKey('');
                      setDbStatusMsg('');
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-350 font-black uppercase rounded-lg transition cursor-pointer"
                  >
                    Reset Fields
                  </button>
                </div>
              </form>
            </div>

            {/* FORCE LOCAL DATA TO SUPABASE SYNC TOOL */}
            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold font-mono text-[#A28259] uppercase tracking-wider flex items-center gap-2">
                    ⚡ Push Local Database to Supabase
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    If you just configured a fresh Supabase database or tables, use this tool to instantly upload all currently existing local Menu products, Staff rosters, and Order invoices from this server files to your cloud database in bulk!
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="px-2 py-1 rounded text-[9px] uppercase font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono">
                    Owner Feature
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-4">
                <p className="text-xs text-slate-400 leading-normal">
                  This operation will run an <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-500 font-mono text-[10px]">upsert</code> query across all tables. Items with matching primary keys will be updated, while new ones will be registered.
                </p>

                {pushSyncResult && (
                  <div className={`p-4 rounded-xl text-xs font-mono border leading-relaxed ${
                    pushSyncResult.startsWith("✓") 
                      ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-300"
                      : "bg-red-950/45 border-red-900/30 text-red-300"
                  }`}>
                    {pushSyncResult}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePushLocalToSupabase}
                  disabled={isPushingLocal || !supabaseConnected}
                  className={`px-5 py-3 rounded-lg text-xs font-black uppercase tracking-wider text-white shadow-xl flex items-center gap-2 transition active:scale-95 cursor-pointer ${
                    supabaseConnected 
                      ? "bg-[#9C5D30] hover:bg-amber-600 hover:shadow-amber-900/20" 
                      : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/30"
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isPushingLocal ? 'animate-spin' : ''}`} />
                  {isPushingLocal ? "Uploading Roster & Menu Records..." : "Push All Local Data to Supabase Now"}
                </button>
                {!supabaseConnected && (
                  <span className="text-[10px] text-red-400/80 block font-mono">
                     Please connect and verify your Supabase API keys above before copying file records.
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">Supabase SQL Editor Deployment</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Run the following script in your **Supabase Dashboard SQL Editor** to create all four required tables instantly!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className={`px-3 py-1.5 text-[10.5px] font-mono font-bold rounded-lg border transition duration-150 cursor-pointer flex items-center gap-1.5 ${
                    sqlCopied
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {sqlCopied ? 'Copied Script ✓' : 'Copy SQL Script'}
                </button>
              </div>

              {/* Collapsible/Scrollable SQL container code snippet block */}
              <div className="relative">
                <pre className="text-[9.5px] font-mono text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-[160px] overflow-y-auto block leading-normal select-all">
                  {supabaseSqlQuery}
                </pre>
                <div className="absolute bottom-2 right-2 bg-slate-900/90 text-[8.5px] font-mono text-slate-500 px-2 py-0.5 rounded border border-slate-800/80 pointer-events-none select-none">
                  SQL Script Box
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-400 mb-3">Database Tables Fields Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-[10px]">
                  <div className="bg-slate-950 p-3 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-amber-400 font-bold block border-b border-slate-800 pb-1">1. orders</span>
                    <div className="text-slate-400 space-y-1">
                      <p>• <span className="text-slate-200 font-bold">id</span> (text, PK)</p>
                      <p>• <span className="text-slate-200">customer_name</span> (text)</p>
                      <p>• <span className="text-slate-200">table_number</span> (text)</p>
                      <p>• <span className="text-slate-200">phone_number</span> (text)</p>
                      <p>• <span className="text-slate-200">total_price</span> (numeric)</p>
                      <p>• <span className="text-slate-200">status</span> (text)</p>
                      <p>• <span className="text-slate-200">items</span> (jsonb)</p>
                      <p>• <span className="text-slate-200">sales_person</span> (text)</p>
                      <p>• <span className="text-slate-200">created_at</span> (timestamptz)</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-amber-400 font-bold block border-b border-slate-800 pb-1">2. products</span>
                    <div className="text-slate-400 space-y-1">
                      <p>• <span className="text-slate-200 font-bold">id</span> (text, PK)</p>
                      <p>• <span className="text-slate-200">name_en</span> (text)</p>
                      <p>• <span className="text-slate-200">name_ar</span> (text)</p>
                      <p>• <span className="text-slate-200">price</span> (numeric)</p>
                      <p>• <span className="text-slate-200">description_en</span> (text)</p>
                      <p>• <span className="text-slate-200">description_ar</span> (text)</p>
                      <p>• <span className="text-slate-200">category</span> (text)</p>
                      <p>• <span className="text-slate-200">tag</span> (text)</p>
                      <p>• <span className="text-slate-200">image</span> (text)</p>
                      <p>• <span className="text-slate-200">is_special</span> (boolean)</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-amber-400 font-bold block border-b border-slate-800 pb-1">3. staff</span>
                    <div className="text-slate-400 space-y-1">
                      <p>• <span className="text-slate-200 font-bold">id</span> (text, PK)</p>
                      <p>• <span className="text-slate-200">name</span> (text)</p>
                      <p>• <span className="text-slate-200">role</span> (text)</p>
                      <p>• <span className="text-slate-200 font-bold">pin</span> (text, unique)</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-amber-500 font-bold block border-b border-slate-800 pb-1">4. loyalty</span>
                    <div className="text-slate-400 space-y-1">
                      <p>• <span className="text-slate-200 font-bold">identifier</span> (text, PK)</p>
                      <p>• <span className="text-slate-200 font-bold">streak</span> (integer)</p>
                      <p>• <span className="text-slate-200 font-bold">last_date</span> (text)</p>
                      <p>• <span className="text-slate-200 font-bold">history</span> (jsonb)</p>
                      <p>• <span className="text-slate-200 font-bold">reward_available</span> (bool)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- ADD/EDIT PRODUCT DIALOG GALAXY OVERLAY --- */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-4 animate-scaleUp">
            
            {/* Header */}
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkle className="w-4 h-4 text-amber-500 animate-pulse" />
                {editingProduct ? '✏ Edit Product details' : '☕ Add New Recipe Drink'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-white font-serif text-lg bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProductSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Product Names: Dual column translation layout */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">English Product Name</label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. SPANISH SHAKE"
                    className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded pl-3 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-bold uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Arabic Product Name (اسم المنتج بالكامل)</label>
                  <input
                    type="text"
                    required
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    placeholder="مثال: سبانش شيك بارد"
                    dir="rtl"
                    className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded pl-3 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              {/* Price and Category dual column */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Price Score (Saudi Riyal - SR)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="18"
                    className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded pl-3 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-black text-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Menu Main Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded pl-3 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                  >
                    <option value="specials">Specials (المميزة) ⭐</option>
                    <option value="sweet">Sweet (حلويات) 🍰</option>
                    <option value="boba">Boba Drinks (بوبا) 🧋</option>
                    <option value="cold">Cold Drinks (مشروبات باردة) ❄️</option>
                    <option value="matcha">Matcha & Shake (ماتشا وشيك) 🍦</option>
                    <option value="juice">Juice (عصير) 🍊</option>
                    <option value="hot">Hot Drinks (مشروبات ساخنة) ☕</option>
                  </select>
                </div>
              </div>

              {/* Tag text & Specials toggle */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Optional Highlight Tag Badge (e.g. 'FAN FAVORITE')</label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    placeholder="e.g. TODAY'S CHAIR PICK"
                    className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded pl-3 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-semibold uppercase tracking-wide text-amber-500"
                  />
                </div>
                <div className="flex items-center gap-2 mt-4 select-none">
                  <input
                    type="checkbox"
                    id="isSpecialBox"
                    checked={formIsSpecial}
                    onChange={(e) => setFormIsSpecial(e.target.checked)}
                    className="rounded border-slate-700 text-amber-600 focus:ring-0 bg-slate-950 cursor-pointer"
                  />
                  <label htmlFor="isSpecialBox" className="text-xs text-slate-300 font-bold cursor-pointer">
                    ✨ Elevate to Chef's Special Horizontal Slider
                  </label>
                </div>
              </div>

              {/* Description translate */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">English Recipe Description</label>
                  <textarea
                    rows={2}
                    value={formDescriptionEn}
                    onChange={(e) => setFormDescriptionEn(e.target.value)}
                    placeholder="Espresso shot, cooled sweet layers vanilla milk..."
                    className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded p-3 text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Arabic Recipe Description (وصف المنتج)</label>
                  <textarea
                    rows={2}
                    value={formDescriptionAr}
                    onChange={(e) => setFormDescriptionAr(e.target.value)}
                    placeholder="إسبريسو غني، طبقات حليب بارد بنكهة الفانيلا الفاخرة..."
                    dir="rtl"
                    className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded p-3 text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* --- IMAGE URL SETTINGS SECTION --- */}
              <div className="space-y-4 border-t border-slate-800 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-[0.11em] text-amber-400 font-black block">Product Visual Graphics / Photo</label>
                  <span className="text-[9px] text-slate-500 font-mono font-bold">Upload dynamic photo or enter link</span>
                </div>

                {/* Picture Upload Zone */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2">
                    <label className="relative flex flex-col items-center justify-center border border-dashed border-slate-750 hover:border-amber-500/55 bg-slate-950/70 rounded-xl p-4 cursor-pointer transition group">
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Upload className={`w-5 h-5 text-slate-400 group-hover:text-amber-400 transition-colors ${isUploadingImage ? 'animate-bounce' : ''}`} />
                        <span className="text-[11px] font-bold text-slate-200">
                          {isUploadingImage ? "Uploading Asset Archive..." : "Upload Product Picture"}
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-mono tracking-wide">Supports PNG, JPG, WEBP (Max 10MB)</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        disabled={isUploadingImage}
                      />
                    </label>
                  </div>

                  {/* Thumbnail Preview box */}
                  <div className="flex items-center justify-center p-2 rounded-xl bg-slate-900/40 border border-slate-800 h-[82px] overflow-hidden">
                    {formImage ? (
                      <div className="relative group w-full h-full max-w-[120px] rounded overflow-hidden">
                        <img 
                          src={formImage} 
                          alt="Thumbnail preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9.5px] font-bold text-red-400 transition-all cursor-pointer"
                        >
                          Clear Image
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-[9px] text-slate-600 font-mono italic">
                        No Picture Selected
                      </div>
                    )}
                  </div>
                </div>

                {imageUploadError && (
                  <p className="text-[10px] font-mono text-red-400 leading-none pt-0.5">{imageUploadError}</p>
                )}

                <div className="space-y-1.5 pt-0.5">
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider block">Or Paste Manual Picture URL Link</span>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="url"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full text-xs bg-slate-950 border border-slate-700/80 rounded-lg pl-10 pr-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Spectacular Luxury Preset shortcuts! */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[9.5px] uppercase tracking-wider text-slate-405 font-bold">✨ Quick Click: Dynamic Shop Photo Presets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {IMAGE_PRESETS.map((preset, pidx) => {
                      const isSelected = formImage === preset.url;
                      return (
                        <button
                          key={pidx}
                          type="button"
                          onClick={() => setFormImage(preset.url)}
                          className={`px-2 py-1 text-[10px] rounded transition duration-200 border cursor-pointer font-sans font-medium hover:-translate-y-0.5 ${
                            isSelected 
                              ? 'bg-amber-600 border-amber-550 text-white font-bold' 
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-xs font-black text-white rounded flex items-center gap-1.5 shadow-lg shadow-amber-900/10 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editingProduct ? 'Save Product Details' : 'Add Recruited Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {showStaffOrderModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-4 animate-scaleUp">
            
            {/* Header */}
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkle className="w-4 h-4 text-amber-500 animate-pulse" />
                ⚡ Create Manual Sales/Staff Order
              </h3>
              <button
                type="button"
                onClick={() => setShowStaffOrderModal(false)}
                className="text-slate-400 hover:text-white font-serif text-lg bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleCreateStaffOrderSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 flex flex-col">
              
              {/* Row 1: Customer Record metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Customer / Guest Name</label>
                  <input
                    type="text"
                    required
                    value={staffCustomerName}
                    onChange={(e) => setStaffCustomerName(e.target.value)}
                    placeholder="e.g. Walk-in Guest"
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded pl-3 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block font-mono">Serving Table Number</label>
                  <select
                    value={staffTableNumber}
                    onChange={(e) => setStaffTableNumber(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded pl-3 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                  >
                    <option value="Takeaway">Takeaway (سفري) 🥡</option>
                    {Array.from({ length: 20 }, (_, i) => {
                      const num = String(i + 1).padStart(2, '0');
                      return <option key={num} value={num}>Table {num} (طاولة {num}) ☕</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* Row 1.5: Loyalty Club Link */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 space-y-3 shrink-0">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-550" />
                    Loyalty Club Integration / ربط الولاء
                  </h4>
                  {staffLoyaltyProfile && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                      ✓ Registered Member
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold block">
                      Customer Phone / Email Identifier
                    </label>
                    <input
                      type="text"
                      value={staffPhoneNumber}
                      onChange={(e) => setStaffPhoneNumber(e.target.value)}
                      placeholder="e.g. +966500000000"
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded pl-3 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                    <p className="text-[8.5px] text-slate-500 leading-normal">
                      Entering phone automatically records this manual visit & advances streak day.
                    </p>
                  </div>

                  {/* Loyalty options if profile loaded */}
                  {staffLoyaltyProfile ? (
                    <div className="space-y-2 bg-slate-905 p-2.5 rounded-lg border border-slate-800/60">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Current Streak:</span>
                        <span className="text-amber-500 font-bold font-mono">{staffLoyaltyProfile.streak}/5 Days</span>
                      </div>
                      
                      {staffLoyaltyProfile.rewardAvailable ? (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={staffRedeemReward}
                              onChange={(e) => setStaffRedeemReward(e.target.checked)}
                              className="accent-amber-500 text-amber-600 rounded bg-slate-950 border-slate-800"
                            />
                            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider animate-pulse">
                              Apply Completed 5-Day Reward!
                            </span>
                          </label>

                          {staffRedeemReward && (
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setStaffRedeemType('20_percent')}
                                className={`px-2 py-1 text-[9px] rounded font-bold border transition cursor-pointer ${
                                  staffRedeemType === '20_percent'
                                    ? 'bg-emerald-600 border-emerald-500 text-white font-black'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                Flat 20% Off
                              </button>
                              <button
                                type="button"
                                onClick={() => setStaffRedeemType('free_item')}
                                className={`px-2 py-1 text-[9px] rounded font-bold border transition cursor-pointer ${
                                  staffRedeemType === 'free_item'
                                    ? 'bg-emerald-600 border-emerald-500 text-white font-black'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                1 Free Product
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 bg-slate-950/50 p-1.5 rounded text-center">
                          Reward locked. Complete 5 consecutive visits to unlock reward.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center bg-slate-950/20 p-2 rounded border border-dashed border-slate-800/80">
                      <p className="text-[10px] text-slate-500 text-center italic leading-tight">
                        {staffPhoneNumber ? "Searching member database..." : "Enter phone to fetch streak info or apply rewards"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Salesperson selection and order stage status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Sales Person / Barista Assigned</label>
                  <input
                    type="text"
                    required
                    disabled
                    value={staffSalesPerson}
                    placeholder="Operator Assigned"
                    className="w-full text-xs bg-slate-950/70 border border-slate-800 rounded pl-3 pr-3 py-2 text-slate-400 font-mono font-bold focus:outline-none cursor-not-allowed"
                  />
                  <p className="text-[9px] text-amber-500 font-mono leading-none pt-1">✓ Logged operator is automatically recorded for audit track.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Live Order Starting Stage</label>
                  <div className="pt-6">
                    <select
                      value={staffOrderStatus}
                      onChange={(e: any) => setStaffOrderStatus(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded pl-3 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                    >
                      <option value="Preparing">Preparing (قيد التحضير) ☕</option>
                      <option value="Delivered">Delivered & Closed (تم التسليم والإغلاق) ✓</option>
                      <option value="Awaiting Payment">Awaiting Payment (بانتظار الدفع) 💵</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Selector with searching */}
              <div className="flex-1 min-h-[160px] flex flex-col space-y-2 border-t border-slate-800 pt-3">
                <div className="flex justify-between items-center shrink-0">
                  <label className="text-[10px] uppercase tracking-[0.11em] text-amber-400 font-black block">Select Products to Add</label>
                  <input
                    type="text"
                    placeholder="Filter products..."
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    className="text-[10px] bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 focus:outline-none focus:border-amber-500 w-36"
                  />
                </div>

                {/* Available Products Scroll Box list */}
                <div className="flex-1 overflow-y-auto max-h-48 border border-slate-800 rounded bg-slate-950 p-2 space-y-1">
                  {products.filter(p => !staffSearchQuery || p.nameEn.toLowerCase().includes(staffSearchQuery.toLowerCase())).map((prod) => {
                    const cartItem = staffCart.find(c => c.id === prod.id);
                    const qty = cartItem ? cartItem.quantity : 0;

                    return (
                      <div key={prod.id} className="p-2 hover:bg-slate-900 border-b border-slate-850/40 flex items-center justify-between text-xs transition">
                        <div>
                          <div className="font-bold text-slate-200">{prod.nameEn}</div>
                          <div className="text-[10px] text-slate-500">{prod.category.toUpperCase()} | SR {prod.price}</div>
                        </div>

                        {qty === 0 ? (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleUpdateStaffCartItemQty(prod.id, 1)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-[#9C5D30] hover:text-white rounded text-[10.5px] text-slate-300 font-black transition cursor-pointer"
                          >
                            + Add Item
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 animate-fadeIn">
                            <button
                              type="button"
                              onClick={() => handleUpdateStaffCartItemQty(prod.id, -1)}
                              className="w-5 h-5 bg-slate-800 hover:bg-red-900 rounded flex items-center justify-center font-bold text-slate-200 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-amber-400 w-4 text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateStaffCartItemQty(prod.id, 1)}
                              className="w-5 h-5 bg-slate-800 hover:bg-emerald-900 rounded flex items-center justify-center font-bold text-slate-200 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* staff order Shopping Cart items summation */}
              <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl space-y-2 mt-2 shrink-0">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Manual Checkout Bill Summary</span>
                
                {cartItems.length === 0 ? (
                  <p className="text-[10.5px] text-slate-500 font-mono">No items loaded into billing register bucket yet. Click "+ Add Item" above.</p>
                ) : (
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.prod.id} className="flex justify-between items-center text-[11px] font-mono">
                        <span className="text-slate-300">{item.prod.nameEn} x{item.quantity}</span>
                        <span className="text-slate-400">SR {item.prod.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border-t border-slate-800/80 pt-2 space-y-1.5 font-mono text-[11px]">
                  {staffDiscount > 0 ? (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>Original Order Sum:</span>
                        <span className="line-through">SR {cartTotalPrice}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Streak Discount:</span>
                        <span>- SR {staffDiscount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-200 pt-1 border-t border-dashed border-slate-800">
                        <span className="uppercase text-amber-500">FINAL NET AMOUNT</span>
                        <span className="text-base text-emerald-400 font-bold">SR {staffFinalPrice}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                      <span className="uppercase text-slate-400">RUNNING TOTAL BILL</span>
                      <span className="text-sm font-black text-emerald-400">SR {cartTotalPrice}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit panel controls */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowStaffOrderModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cartItems.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black text-white rounded flex items-center gap-1.5 shadow-lg select-none cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Close & Submit Order
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Footer System Credits */}
      <footer className="py-6 border-t border-slate-800 bg-slate-950 text-center text-xs text-slate-600 font-mono mt-auto select-none">
        <p>© 2026 ICONIC COFFEE ADMINISTRATIVE DEPLOYMENT</p>
        <p className="text-[10px] text-slate-700 mt-1">EMULATING EXCEL & GOOGLE WORKSPACE API BRIDGE-READY MODULE</p>
      </footer>

    </div>
  );
}
