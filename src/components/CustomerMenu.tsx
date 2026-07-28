import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  CakeSlice, 
  Milk, 
  CupSoda, 
  IceCream, 
  Citrus, 
  Coffee, 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  Check, 
  Timer, 
  ShieldCheck, 
  Shield,
  AlertCircle, 
  ArrowRight,
  Sparkle,
  PhoneCall,
  XCircle,
  HelpCircle,
  Award,
  Lock,
  Store,
  Camera,
  Banknote,
  CreditCard,
  Menu,
  ArrowUp,
  Info,
  MapPin,
  Clock
} from 'lucide-react';
import PromoCarousel from './PromoCarousel';
import { searchItems } from '../lib/search';
import { CATEGORIES, MENU_ITEMS, Category, MenuItem } from '../data';
import MenuImage from './MenuImage';

interface CustomerMenuProps {
  onGoToAdmin: () => void;
}

interface CartItem extends MenuItem {
  quantity: number;
  isLoyaltyFree?: boolean;
}

export default function CustomerMenu({ onGoToAdmin }: CustomerMenuProps) {
  // Menu items dynamic state loaded from server live database
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);

  // Custom visual toast state for iframe safety (replacing window.alert)
  const [toastText, setToastText] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('error');
  const [toastTimeout, setToastTimeout] = useState<any>(null);

  const triggerToast = (text: string, type: 'success' | 'error' = 'error') => {
    setToastText(text);
    setToastType(type);
    if (toastTimeout) clearTimeout(toastTimeout);
    const to = setTimeout(() => {
      setToastText(null);
    }, 4500);
    setToastTimeout(to);
  };

  // Category state
  const [activeCategory, setActiveCategory] = useState('specials');
  const [searchQuery, setSearchQuery] = useState('');
  // Category ids whose branded photo (and CDN fallback) failed to load
  const [brokenCatImages, setBrokenCatImages] = useState<string[]>([]);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Delivery destination: floor -> (gate, 1st floor only) -> shop name -> signboard photo
  const [floor, setFloor] = useState<'' | '1' | '2'>('');
  const [gate, setGate] = useState('');
  const [shopName, setShopName] = useState('');
  const [signboardUrl, setSignboardUrl] = useState('');
  const [signboardPreview, setSignboardPreview] = useState('');
  // How the customer settles the bill at handover
  const [paymentMethod, setPaymentMethod] = useState<'' | 'cash' | 'card'>('');
  const [isUploadingSignboard, setIsUploadingSignboard] = useState(false);
  const signboardInputRef = useRef<HTMLInputElement>(null);

  // Loyalty coffee streak club states and check functions
  const [loyaltyInput, setLoyaltyInput] = useState('');
  const [isCheckingLoyalty, setIsCheckingLoyalty] = useState(false);
  const [checkedProfile, setCheckedProfile] = useState<any | null>(null);
  const [loyaltyInfoMsg, setLoyaltyInfoMsg] = useState<string | null>(null);
  const [redeemReward, setRedeemReward] = useState(false);
  const [redeemType, setRedeemType] = useState<'20_percent' | 'free_item'>('20_percent');

  // Auto check loyalty if customer types phone under checkout modal
  const [checkoutProfile, setCheckoutProfile] = useState<any | null>(null);

  useEffect(() => {
    if (phoneNumber.trim().length > 3) {
      const delayDebt = setTimeout(() => {
        fetch('/api/loyalty/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: phoneNumber })
        })
          .then(res => res.json())
          .then(data => {
            if (data && !data.error) {
              setCheckoutProfile(data);
            } else {
              setCheckoutProfile(null);
            }
          })
          .catch(() => setCheckoutProfile(null));
      }, 600);
      return () => clearTimeout(delayDebt);
    } else {
      setCheckoutProfile(null);
      setRedeemReward(false);
    }
  }, [phoneNumber]);

  const handleCheckLoyalty = async () => {
    if (!loyaltyInput.trim()) return;
    setIsCheckingLoyalty(true);
    setCheckedProfile(null);
    setLoyaltyInfoMsg(null);
    try {
      const response = await fetch('/api/loyalty/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loyaltyInput })
      });
      if (response.ok) {
        const data = await response.json();
        setCheckedProfile(data);
        if (data.history.length === 0 && data.streak === 0) {
          setLoyaltyInfoMsg("Account ready! Submit an order with this identifier to initialize day 1.");
        }
      } else {
        setLoyaltyInfoMsg("Failed to load loyalty profile. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setLoyaltyInfoMsg("Network error checking streak.");
    } finally {
      setIsCheckingLoyalty(false);
    }
  };
  
  // Checkout & placement states
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  
  // Scroll targets for the quick-route menu and the category grid
  const listContainerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const loyaltyRef = useRef<HTMLDivElement>(null);
  // The page itself does not scroll (an ancestor does), so "back to top" needs an anchor.
  const topRef = useRef<HTMLDivElement>(null);

  // Hamburger navigation and the About Us sheet it opens
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Selected loyalty reward products (up to 3)
  const [loyaltyRewardProductIds, setLoyaltyRewardProductIds] = useState<string[]>([]);

  // Highly robust derived VIP loyalty rewards product ID list
  const actualRewardProductIds = useMemo(() => {
    const validIds = loyaltyRewardProductIds.filter(id => menuItems.some(p => p.id === id));
    if (validIds.length > 0) return validIds.slice(0, 3);
    
    // Fallback: If no loyaltyRewardProductIds match existing products (or database settings not synchronized yet),
    // we use the first 3 specials, or first 3 overall items so that the VIP Loyalty Gift shelf is always populated and active
    const specials = menuItems.filter(p => p.category === 'specials');
    if (specials.length >= 3) return specials.slice(0, 3).map(p => p.id);
    return menuItems.slice(0, 3).map(p => p.id);
  }, [loyaltyRewardProductIds, menuItems]);

  // Fetch active products
  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => setMenuItems(data))
      .catch(err => {
        console.error("Failed to load products from server, falling back to local static seed", err);
        setMenuItems(MENU_ITEMS);
      });

    fetch('/api/loyalty/settings')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (data && data.freeProducts) {
          setLoyaltyRewardProductIds(data.freeProducts);
        }
      })
      .catch(err => console.error("Failed loading loyalty reward settings:", err));
  }, []);

  // Initialize cart and track states from localStorage
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('iconic_cart');
      if (storedCart) setCart(JSON.parse(storedCart));

      const storedOrderId = localStorage.getItem('iconic_active_order_id');
      if (storedOrderId) {
        setActiveOrderId(storedOrderId);
        setIsTrackingOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync cart to localstorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('iconic_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error(e);
    }
  };

  // Poll active order state from the database
  useEffect(() => {
    if (!activeOrderId) {
      setActiveOrder(null);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${activeOrderId}`);
        if (!res.ok) {
          if (res.status === 404) {
            // Dismiss stale local active order
            localStorage.removeItem('iconic_active_order_id');
            setActiveOrderId(null);
          }
          return;
        }
        const data = await res.json();
        setActiveOrder(data);

        // Adjust real-time counter if prepping and didn't start yet
        if (data.status === 'Preparing' || data.status === 'Pending') {
          const creationDate = new Date(data.createdAt).getTime();
          const estimateMs = data.estimatedTimeMinutes * 60 * 1000;
          const elapsedMs = Date.now() - creationDate;
          const remainingSeconds = Math.max(0, Math.floor((estimateMs - elapsedMs) / 1000));
          setCountdownSeconds(remainingSeconds);
        } else {
          setCountdownSeconds(0);
        }
      } catch (err) {
        console.error('Failed to poll order status', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [activeOrderId]);

  // Countdown timer clock ticking
  useEffect(() => {
    if (countdownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCountdownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownSeconds]);

  // Destination shown while tracking. Orders placed before the floor/gate rollout only
  // carry the legacy `tableNumber` label, so fall back to it.
  const describeDestination = (order: any) => {
    if (!order) return '';
    if (order.floor) {
      const parts = [order.floor === '2' ? '2nd Floor' : '1st Floor'];
      if (order.floor === '1' && order.gate) parts.push(`Gate ${order.gate}`);
      if (order.shopName) parts.push(order.shopName);
      return parts.join(' · ');
    }
    return order.tableNumber || '';
  };

  // Format countdown clock nicely to MM:SS
  const formatCountdown = () => {
    const mins = Math.floor(countdownSeconds / 60);
    const secs = countdownSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Add Item to Cart
  const handleAddToCart = (item: MenuItem) => {
    const existing = cart.find(ci => ci.id === item.id);
    if (existing) {
      const nextCart = cart.map(ci => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      saveCart(nextCart);
    } else {
      saveCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // Claim Free Loyalty Product
  const handleClaimFreeLoyaltyProduct = (item: MenuItem) => {
    const hasFreeItem = cart.some(ci => ci.isLoyaltyFree);
    if (hasFreeItem) {
      triggerToast("You can only claim 1 free Loyalty Reward product per order!", "error");
      return;
    }

    const freeItem: CartItem = {
      ...item,
      price: 0,
      isLoyaltyFree: true,
      quantity: 1
    };

    saveCart([...cart, freeItem]);
    
    // Automatically prefill phone number the verified customer used
    if (checkedProfile && checkedProfile.identifier) {
      setPhoneNumber(checkedProfile.identifier);
    } else if (checkoutProfile && checkoutProfile.identifier) {
      setPhoneNumber(checkoutProfile.identifier);
    }
  };

  // Modify item quantity in Cart
  const updateQuantity = (itemId: string, delta: number) => {
    const target = cart.find(ci => ci.id === itemId);
    if (!target) return;
    if (target.isLoyaltyFree && delta > 0) {
      triggerToast("You can only claim 1 unit of your Free Loyalty Gift!", "error");
      return;
    }
    const nextAmount = target.quantity + delta;
    if (nextAmount <= 0) {
      const nextCart = cart.filter(ci => ci.id !== itemId);
      saveCart(nextCart);
    } else {
      const nextCart = cart.map(ci => ci.id === itemId ? { ...ci, quantity: nextAmount } : ci);
      saveCart(nextCart);
    }
  };

  // Clear Cart helper
  const handleClearCart = () => {
    saveCart([]);
  };

  // Calculate sum counts
  const totalCartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPriceSum = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const eligibleLoyaltyItemsInCart = cart.filter(c => actualRewardProductIds.includes(c.id));
  const maxLoyaltyItemPrice = eligibleLoyaltyItemsInCart.length > 0 
    ? Math.max(...eligibleLoyaltyItemsInCart.map(c => c.price)) 
    : 0;

  // Switching to the 2nd floor drops any gate picked on the 1st floor
  const handleSelectFloor = (nextFloor: '1' | '2') => {
    setFloor(nextFloor);
    if (nextFloor === '2') setGate('');
  };

  // Read the signboard photo, show it immediately, and push it to storage
  const handleSignboardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('Please upload a photo of your shop signboard (image file).', 'error');
      return;
    }
    // 8 MB matches the storage bucket limit; phone cameras can exceed it easily.
    if (file.size > 8 * 1024 * 1024) {
      triggerToast('That photo is larger than 8 MB. Please upload a smaller one.', 'error');
      return;
    }

    setIsUploadingSignboard(true);
    setSignboardUrl('');
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read that photo.'));
        reader.readAsDataURL(file);
      });

      setSignboardPreview(base64);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, base64, kind: 'signboard' })
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed.');

      setSignboardUrl(data.url);
      triggerToast('Signboard photo uploaded.', 'success');
    } catch (err: any) {
      setSignboardPreview('');
      triggerToast(err.message || 'Could not upload your signboard photo. Please try again.', 'error');
    } finally {
      setIsUploadingSignboard(false);
      // Let the customer re-pick the same file after a failure
      if (signboardInputRef.current) signboardInputRef.current.value = '';
    }
  };

  const handleRemoveSignboard = () => {
    setSignboardPreview('');
    setSignboardUrl('');
    if (signboardInputRef.current) signboardInputRef.current.value = '';
  };

  // Place Order checkout click
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      triggerToast('Please enter your name!', "error");
      return;
    }
    if (!floor) {
      triggerToast('Please select your floor.', "error");
      return;
    }
    if (floor === '1' && !gate) {
      triggerToast('Please select your gate (1 to 5).', "error");
      return;
    }
    if (!shopName.trim()) {
      triggerToast('Please enter your shop name.', "error");
      return;
    }
    if (isUploadingSignboard) {
      triggerToast('Your signboard photo is still uploading. One moment.', "error");
      return;
    }
    if (!signboardUrl) {
      triggerToast('Please upload a photo of your shop signboard.', "error");
      return;
    }
    if (!paymentMethod) {
      triggerToast('Please choose how you are paying: Cash or Card (Mada).', "error");
      return;
    }

    if (redeemReward && redeemType === 'free_item' && maxLoyaltyItemPrice === 0) {
      triggerToast("Please add at least one of your 3 Exclusive VIP Loyalty Gifts to your cart to claim your Free Product reward!", "error");
      return;
    }

    setIsCheckoutLoading(true);

    try {
      const simplifiedItems = cart.map(ci => ({
        id: ci.id,
        nameEn: ci.nameEn,
        nameAr: ci.nameAr,
        price: ci.price,
        quantity: ci.quantity,
        isLoyaltyFree: ci.isLoyaltyFree || false
      }));

      const payload = {
        customerName: customerName.trim(),
        floor,
        gate: floor === '1' ? gate : '',
        shopName: shopName.trim(),
        signboardUrl,
        paymentMethod,
        phoneNumber: phoneNumber.trim(),
        items: simplifiedItems,
        redeemReward: redeemReward,
        redeemType: redeemType
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Could not register your order. Please check with waiter.');

      const finalizedOrder = await res.json();
      
      // Store checkout reference
      setActiveOrderId(finalizedOrder.id);
      localStorage.setItem('iconic_active_order_id', finalizedOrder.id);
      
      // Reset variables
      saveCart([]);
      setRedeemReward(false);
      setIsCartOpen(false);
      setIsTrackingOpen(true);
    } catch (err: any) {
      triggerToast(err.message || 'Server offline. Try re-sending order.', "error");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Dismiss tracking overlay
  const handleDismissTracking = () => {
    try {
      localStorage.removeItem('iconic_active_order_id');
    } catch (e) {
      console.warn("localStorage.removeItem blocked in sandbox/iframe context:", e);
    }
    setActiveOrderId(null);
    setIsTrackingOpen(false);
  };

  // Branded category tile art. Falls back to the Supabase CDN copy, then to the
  // matching Lucide glyph, so a tile never renders empty.
  const renderCatIcon = (cat: Category) => {
    if (brokenCatImages.includes(cat.id)) {
      const style = "w-7 h-7 text-accent";
      const glyph = () => {
        switch (cat.icon) {
          case 'Sparkles': return <Sparkles className={style} strokeWidth={1.5} />;
          case 'CakeSlice': return <CakeSlice className={style} strokeWidth={1.5} />;
          case 'Milk': return <Milk className={style} strokeWidth={1.5} />;
          case 'CupSoda': return <CupSoda className={style} strokeWidth={1.5} />;
          case 'IceCream': return <IceCream className={style} strokeWidth={1.5} />;
          case 'Citrus': return <Citrus className={style} strokeWidth={1.5} />;
          default: return <Coffee className={style} strokeWidth={1.5} />;
        }
      };
      return (
        <span className="w-full h-full bg-paper-2 flex items-center justify-center">
          {glyph()}
        </span>
      );
    }

    return (
      <img
        src={cat.image}
        alt=""
        loading="lazy"
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          if (el.src !== cat.imageFallback) {
            el.src = cat.imageFallback;
          } else {
            setBrokenCatImages((prev) => prev.includes(cat.id) ? prev : [...prev, cat.id]);
          }
        }}
        className="w-full h-full object-cover"
      />
    );
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Picking a category from the grid drops the customer straight onto the products
  const handleSelectCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery('');
    scrollToSection(listContainerRef);
  };

  const isSearching = searchQuery.trim() !== '';

  // A search runs across the whole menu, not just the open category — someone typing
  // "juice" while Specials happens to be selected means to find the juices. Without a
  // query we are back to plain category browsing.
  const displayItems = useMemo(() => {
    if (isSearching) return searchItems(searchQuery, menuItems);
    return menuItems.filter(it => activeCategory === 'all' || it.category === activeCategory);
  }, [isSearching, searchQuery, menuItems, activeCategory]);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col antialiased relative">
      
      {/* Premium Floating non-blocking Toast notification */}
      {toastText && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm shadow-lift bg-card/97 backdrop-blur-md rounded-2xl p-4 border border-line flex items-start gap-3 transition-all animate-slideUp">
          <div className={`p-1.5 rounded-lg mt-0.5 ${toastType === 'success' ? 'bg-accent/10 text-accent' : 'bg-paper-2 text-ink'}`}>
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.7} />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-ink leading-relaxed">{toastText}</p>
          </div>
          <button onClick={() => setToastText(null)} className="text-faint hover:text-ink cursor-pointer transition mt-0.5">
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      )}

      {/* Top App Header Badge Area */}
      <header className="bg-card/85 backdrop-blur-md border-b border-line px-5 py-5 flex flex-col items-center justify-center sticky top-0 z-40 relative">
        {/* Staff Portal Shortcut button to avoid having to use # in URL */}
        <button
          type="button"
          onClick={onGoToAdmin}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-faint hover:text-accent hover:bg-paper-2 active:scale-95 transition-all cursor-pointer"
          title="Staff / Admin Portal Login"
        >
          <Shield className="w-[18px] h-[18px]" strokeWidth={1.6} />
        </button>

        {/* Quick-route menu: jump anywhere without scrolling the whole page */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={() => setIsQuickMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={isQuickMenuOpen}
            aria-label="Menu"
            className={`p-2 rounded-full active:scale-95 transition-all cursor-pointer ${
              isQuickMenuOpen ? 'text-accent bg-paper-2' : 'text-faint hover:text-accent hover:bg-paper-2'
            }`}
          >
            <Menu className="w-[18px] h-[18px]" strokeWidth={1.8} />
          </button>

          {isQuickMenuOpen && (
            <>
              {/* Click-away catcher sits under the panel but over the page */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsQuickMenuOpen(false)}
              />
              {/* Dark panel: text-only, high contrast against the ivory page behind it */}
              <div
                role="menu"
                className="absolute left-0 top-[calc(100%+8px)] z-50 w-60 bg-espresso border border-white/10 rounded-2xl shadow-lift overflow-hidden animate-fadeIn"
              >
                <div className="px-4 pt-3.5 pb-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cream-muted font-sans font-bold">Go to</p>
                </div>

                {activeOrderId && activeOrder && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setIsQuickMenuOpen(false); setIsTrackingOpen(true); }}
                    className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left hover:bg-white/10 transition cursor-pointer"
                  >
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent animate-livedot shrink-0" />
                    <span className="text-[14px] font-semibold text-cream">Track my order</span>
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setIsQuickMenuOpen(false); scrollToSection(searchRef); }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left hover:bg-white/10 transition cursor-pointer"
                >
                  <Search className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />
                  <span className="text-[14px] font-semibold text-cream">Search the menu</span>
                </button>

                <div className="border-y border-white/10 my-1 py-1">
                  {CATEGORIES.map((cat) => {
                    const active = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="menuitem"
                        onClick={() => { setIsQuickMenuOpen(false); handleSelectCategory(cat.id); }}
                        className={`w-full pl-4 pr-4 py-2 flex items-center justify-between gap-2 text-left transition cursor-pointer border-l-2 ${
                          active
                            ? 'bg-white/10 border-accent'
                            : 'border-transparent hover:bg-white/10 hover:border-accent/50'
                        }`}
                      >
                        <span className={`text-[14px] ${active ? 'text-cream font-bold' : 'text-cream/90 font-semibold'}`}>
                          {cat.nameEn}
                        </span>
                        <span className="text-[12px] text-cream-muted font-serif font-bold shrink-0" dir="rtl">
                          {cat.nameAr}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setIsQuickMenuOpen(false); scrollToSection(loyaltyRef); }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left hover:bg-white/10 transition cursor-pointer"
                >
                  <Award className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />
                  <span className="text-[14px] font-semibold text-cream">Loyalty & rewards</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setIsQuickMenuOpen(false); setIsAboutOpen(true); }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left hover:bg-white/10 transition cursor-pointer"
                >
                  <Info className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />
                  <span className="text-[14px] font-semibold text-cream">About us</span>
                </button>

                <a
                  role="menuitem"
                  href="tel:+966500000000"
                  onClick={() => setIsQuickMenuOpen(false)}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left hover:bg-white/10 transition cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />
                  <span className="text-[14px] font-semibold text-cream">Call the shop</span>
                </a>

                <div className="border-t border-white/10 mt-1 pt-1 pb-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setIsQuickMenuOpen(false); scrollToSection(topRef); }}
                    className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left hover:bg-white/10 transition cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />
                    <span className="text-[14px] font-semibold text-cream">Back to top</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setIsQuickMenuOpen(false); onGoToAdmin(); }}
                    className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left hover:bg-white/10 transition cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-cream-muted shrink-0" strokeWidth={2} />
                    <span className="text-[14px] font-semibold text-cream-muted">Staff portal</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Monogram emblem */}
        <div className="w-12 h-12 rounded-full border border-accent/30 flex items-center justify-center bg-paper">
          <span className="font-serif text-[19px] font-semibold tracking-[0.15em] text-accent leading-none pl-[3px]">IC</span>
        </div>

        {/* Wordmark */}
        <h1 className="font-serif text-[26px] leading-none tracking-[0.16em] font-semibold uppercase text-ink mt-3 pl-[3px]">Iconic Coffee</h1>
        <div className="flex items-center gap-2.5 mt-2">
          <span className="h-px w-6 bg-line" />
          <p className="text-[10px] tracking-[0.28em] font-medium text-faint font-sans uppercase">Roastery</p>
          <span className="h-px w-6 bg-line" />
        </div>
      </header>

      {/* Main Content Area optimized for mobile */}
      <main className="flex-1 w-full max-w-md mx-auto pb-28 px-4 flex flex-col gap-6 pt-4">
        <div ref={topRef} aria-hidden className="h-0 scroll-mt-4" />

        {/* Dynamic Tracking Status Floating Widget - visible at any state */}
        {activeOrderId && activeOrder && (
          <div
            onClick={() => setIsTrackingOpen(true)}
            className="w-full bg-espresso hover:bg-ink text-cream p-4 rounded-2xl flex items-center justify-between cursor-pointer shadow-soft border border-white/5 transition group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent animate-livedot"></span>
              </span>
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-[0.15em] text-cream-muted">Order #{activeOrderId}</p>
                <div className="text-[13px] font-medium text-cream mt-0.5">
                  {activeOrder.status === 'Awaiting Payment' && 'Awaiting payment'}
                  {activeOrder.status === 'Pending' && 'Confirming order'}
                  {activeOrder.status === 'Preparing' && 'Preparing your order'}
                  {activeOrder.status === 'Out for Table' && 'On its way to your shop'}
                  {activeOrder.status === 'Delivered' && 'Served, enjoy'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-cream-muted font-medium">
              <span>Track</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.6} />
            </div>
          </div>
        )}


        {/* Auto-scrolling showcase of the branded category artwork */}
        <PromoCarousel onSelectCategory={handleSelectCategory} />

        {/* Search bar */}
        <div ref={searchRef} className="relative scroll-mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" strokeWidth={1.6} />
          <input
            type="text"
            placeholder="Search the menu"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-[13px] bg-card border border-line text-ink placeholder-faint rounded-full pl-11 pr-4 py-3 focus:outline-none focus:border-accent/50 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-faint hover:text-ink transition" strokeWidth={1.8} />
            </button>
          )}
        </div>

        {/* Category grid — large branded tile, small label, whole menu visible at once */}
        <div className="grid grid-cols-4 gap-x-2.5 gap-y-4 pt-1">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                aria-pressed={active}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <span
                  className={`block w-full aspect-square rounded-2xl overflow-hidden bg-card transition-all duration-200 group-active:scale-95 ${
                    active
                      ? 'ring-2 ring-accent ring-offset-2 ring-offset-paper shadow-soft'
                      : 'ring-1 ring-line group-hover:ring-accent/40'
                  }`}
                >
                  {renderCatIcon(cat)}
                </span>
                {/* Fixed two-line box keeps every tile on the same baseline */}
                <span
                  className={`text-[11px] leading-[1.3] text-center font-sans h-[29px] px-0.5 transition-colors ${
                    active ? 'text-ink font-semibold' : 'text-muted font-medium group-hover:text-ink'
                  }`}
                >
                  {cat.nameEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* --- DAILY SPECIALS HEADER & ROW (IF ACTIVE AND VALID) --- */}
        {activeCategory === 'specials' && searchQuery === '' && (
          <div className="space-y-3 animate-fadeIn">

            <div className="flex items-baseline justify-between mt-1">
              <h3 className="font-serif text-[22px] font-semibold text-ink leading-none">Today's Specials</h3>
              <span className="text-[11px] text-faint font-sans">Swipe to browse</span>
            </div>

            {/* Horizontal rail */}
            <div className="overflow-x-auto scrollbar-none -mx-4 px-4 pb-3">
              <div className="flex gap-3 w-max py-1">
                {menuItems.filter(it => it.isSpecial).map((item) => (
                  <div
                    key={item.id}
                    className="w-44 bg-espresso rounded-2xl overflow-hidden shadow-soft flex flex-col group"
                  >
                    {/* Image on a soft ivory field */}
                    <div className="py-5 flex justify-center bg-card relative">
                      {item.tag && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[9px] rounded-full bg-accent/10 text-accent border border-accent/20 font-medium tracking-wide capitalize">
                          {item.tag}
                        </span>
                      )}
                      <div className="w-24 h-24 rounded-full bg-paper flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.04]">
                        <MenuImage itemId={item.id} category={item.category} className="w-[76px] h-[76px]" image={item.image} />
                      </div>
                    </div>

                    <div className="p-3.5 text-cream flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[12.5px] font-serif font-semibold text-cream leading-snug break-words">{item.nameEn}</h4>
                        <p dir="rtl" lang="ar" className="text-[12.5px] font-serif font-bold text-cream/90 leading-snug mt-1 break-words text-right">
                          {item.nameAr}
                        </p>
                        <p className="text-[10px] text-cream-muted font-sans mt-1.5 leading-snug line-clamp-2 overflow-hidden">
                          {item.descriptionEn}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <div className="text-[13.5px] font-mono font-semibold text-accent-on-dark">
                          SR {item.price}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="px-3.5 py-1.5 bg-accent hover:bg-accent-deep active:scale-95 text-[11px] font-semibold text-cream rounded-full transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- PRIMARY GRID CAT FLOWS --- */}
        <div className="space-y-6 scroll-mt-4" ref={listContainerRef}>

          {/* Dynamic Active Title */}
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-[22px] font-serif font-semibold text-ink leading-none">
              {isSearching
                ? `${displayItems.length} result${displayItems.length === 1 ? '' : 's'}`
                : CATEGORIES.find(c => c.id === activeCategory)?.nameEn || 'Menu'}
            </h3>
            <span className="text-[13px] text-faint font-serif">
              {isSearching
                ? `for "${searchQuery.trim()}"`
                : CATEGORIES.find(c => c.id === activeCategory)?.nameAr || 'قائمة'}
            </span>
          </div>

          {/* Catalog grid */}
          {displayItems.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-muted font-serif px-6">
              <Coffee className="w-9 h-9 text-line mx-auto mb-3" strokeWidth={1.2} />
              {isSearching ? (
                <>
                  <p className="text-ink font-semibold text-[14px]">No match for "{searchQuery.trim()}"</p>
                  <p className="mt-1.5 font-sans text-[12px] text-muted">
                    Try a shorter word, or browse the categories above.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-5 py-2.5 bg-espresso hover:bg-ink text-cream text-[12.5px] font-medium rounded-full transition cursor-pointer"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                'Nothing here yet.'
              )}
            </div>
          ) : (
             <div className="grid grid-cols-2 gap-3">
               {displayItems.map((item) => {
                 const inCart = cart.find(ci => ci.id === item.id);
                 return (
                 <div
                   key={item.id}
                   className="bg-espresso rounded-2xl overflow-hidden shadow-soft transition-all duration-300 flex flex-col relative group border border-line/70"
                 >
                   {/* Product image stays on a soft ivory field above the dark body */}
                   <div className="pt-5 pb-4 flex justify-center bg-card relative">
                     <div className="w-24 h-24 rounded-full bg-paper flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.04] overflow-hidden">
                       <MenuImage itemId={item.id} category={item.category} className="w-[84px] h-[84px] rounded-full object-cover" image={item.image} />
                     </div>
                     {item.isSpecial && (
                       <span className="absolute top-3 left-3 bg-accent/12 text-accent border border-accent/25 text-[9px] px-2 py-0.5 rounded-full font-semibold tracking-wide">
                         Signature
                       </span>
                     )}
                   </div>

                   {/* Body on a dark field so the names carry at a glance, matching the
                       specials rail. Cream on espresso clears WCAG AA comfortably. */}
                   <div className="px-3.5 pt-3 pb-3.5 flex-1 flex flex-col justify-between select-none bg-espresso">
                     {/* Names stack: side-by-side truncated the Arabic on narrow phones,
                         so each name now owns its full line and wraps instead of clipping. */}
                     <div>
                       <h4
                         className="text-[13.5px] font-serif font-bold text-cream leading-snug break-words hyphens-auto"
                         title={item.nameEn}
                       >
                         {item.nameEn}
                       </h4>
                       <p
                         dir="rtl"
                         lang="ar"
                         className="text-[13.5px] font-serif font-bold text-cream/95 leading-snug mt-1 break-words text-right"
                         title={item.nameAr}
                       >
                         {item.nameAr}
                       </p>
                       {item.descriptionEn && (
                         <p className="text-[10.5px] text-cream-muted font-sans leading-snug line-clamp-2 mt-1.5 overflow-hidden">
                           {item.descriptionEn}
                         </p>
                       )}
                     </div>

                     <div className="mt-3 pt-3 border-t border-white/12 flex items-center justify-between gap-2">
                       <div className="text-[14px] font-mono font-semibold text-accent-on-dark shrink-0">
                         SR {item.price}
                       </div>
                       <div className="shrink-0">
                         {inCart ? (
                           <div className="flex items-center gap-1 bg-white/10 rounded-full p-0.5 border border-white/15">
                             <button
                               type="button"
                               onClick={() => updateQuantity(item.id, -1)}
                               className="w-6 h-6 flex items-center justify-center hover:bg-white/15 active:scale-95 rounded-full transition text-cream cursor-pointer"
                             >
                               <Minus className="w-3 h-3" strokeWidth={2.5} />
                             </button>
                             <span className="text-[12px] font-mono font-bold text-cream w-4 text-center">{inCart.quantity}</span>
                             <button
                               type="button"
                               onClick={() => updateQuantity(item.id, 1)}
                               className="w-6 h-6 flex items-center justify-center hover:bg-white/15 active:scale-95 rounded-full transition text-cream cursor-pointer"
                             >
                               <Plus className="w-3 h-3" strokeWidth={2.5} />
                             </button>
                           </div>
                         ) : (
                           <button
                             type="button"
                             onClick={() => handleAddToCart(item)}
                             className="bg-accent hover:bg-accent-deep active:scale-95 text-cream font-sans text-[11.5px] font-semibold py-1.5 px-4 rounded-full transition cursor-pointer whitespace-nowrap"
                           >
                             Add
                           </button>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
                 );
               })}
             </div>
          )}
        </div>

        {/* --- LOYALTY, ANCHORED AT THE FOOT OF THE MENU --- */}
        <div ref={loyaltyRef} className="flex flex-col gap-6 scroll-mt-4 pt-2">
          {/* --- 5-DAY COFFEE STREAK CLUB --- */}
          <div className="w-full bg-espresso rounded-2xl p-5 shadow-soft text-cream relative overflow-hidden flex flex-col gap-4 select-none">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-serif text-[22px] leading-tight font-semibold text-cream">The 5-Day Streak</h3>
                <p className="text-[12px] text-cream-muted leading-relaxed mt-1 max-w-[46ch]">
                  Order five days in a row and your sixth is on us: 20% off the whole bill, or a gift on the house.
                </p>
              </div>
              <Award className="w-6 h-6 text-accent shrink-0 mt-1" strokeWidth={1.5} />
            </div>

            {/* Phone/Email input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Phone or email to check your streak"
                value={loyaltyInput}
                onChange={(e) => setLoyaltyInput(e.target.value)}
                className="flex-1 text-[13px] bg-white/8 border border-white/12 rounded-xl px-3.5 py-2.5 text-cream placeholder-cream-muted/70 focus:outline-none focus:border-accent/60 transition"
              />
              <button
                type="button"
                onClick={handleCheckLoyalty}
                disabled={isCheckingLoyalty || !loyaltyInput.trim()}
                className="bg-accent hover:bg-accent-deep disabled:opacity-40 text-cream font-semibold px-5 py-2.5 rounded-xl text-[13px] flex items-center justify-center cursor-pointer transition active:scale-95"
              >
                {isCheckingLoyalty ? "…" : "Check"}
              </button>
            </div>

            {checkedProfile ? (
              <div className="bg-white/5 rounded-xl p-4 border border-white/8 text-left space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[12px] text-cream truncate max-w-[170px]">{checkedProfile.identifier}</span>
                  <span className="text-cream-muted font-medium text-[11px]">
                    Day {checkedProfile.streak} of 5
                  </span>
                </div>

                {/* Progress track */}
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((day) => {
                    const isActive = checkedProfile.streak >= day;
                    return (
                      <div key={day} className="flex-1">
                        <div className={`h-1.5 rounded-full transition-all ${
                          isActive ? 'bg-accent' : 'bg-white/12'
                        }`} />
                      </div>
                    );
                  })}
                </div>

                {checkedProfile.rewardAvailable ? (
                  <div className="text-[12px] text-cream flex items-start gap-2.5 bg-accent/15 p-3 rounded-xl border border-accent/25">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <p className="font-semibold text-cream">Your reward is ready</p>
                      <p className="text-[11px] text-cream-muted leading-relaxed mt-0.5">Use <span className="text-accent-on-dark font-semibold">{checkedProfile.identifier}</span> at checkout and toggle your reward.</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11.5px] text-cream-muted leading-relaxed">
                    {checkedProfile.streak === 0
                      ? "No visit logged today. Place an order to begin day one. A missed day resets the streak."
                      : checkedProfile.streak === 5
                      ? "Streak complete. Redeem your reward on your next order."
                      : `Nicely done. Come back tomorrow to reach day ${checkedProfile.streak + 1}.`}
                  </p>
                )}
              </div>
            ) : (
              loyaltyInfoMsg && (
                <p className="text-[11.5px] text-cream-muted text-center bg-white/5 p-3 rounded-xl border border-white/8">
                  {loyaltyInfoMsg}
                </p>
              )
            )}
          </div>

          {/* --- EXCLUSIVE LOYALTY REWARDS SELECTION --- */}
          {menuItems && actualRewardProductIds && actualRewardProductIds.length > 0 && (
            <div className="w-full bg-card rounded-2xl p-5 border border-line text-ink space-y-4 animate-fadeIn shadow-soft">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-serif text-[22px] leading-tight font-semibold text-ink">Loyalty Gifts</h3>
                  <p className="text-[12px] text-muted leading-relaxed mt-1 max-w-[46ch] font-sans">
                    Complete your five-day streak and one of these three is yours, free.
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-accent shrink-0 mt-1" strokeWidth={1.5} />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {actualRewardProductIds
                  .map((id) => menuItems.find((p) => p.id === id))
                  .filter((prod): prod is MenuItem => !!prod)
                  .slice(0, 3)
                  .map((prod) => {
                    const hasEligibleReward =
                      (checkedProfile && checkedProfile.rewardAvailable) ||
                      (checkoutProfile && checkoutProfile.rewardAvailable);

                    const isAlreadyInCart = cart.some(
                      (ci) => ci.id === prod.id && ci.isLoyaltyFree
                    );

                    return (
                      <div
                        key={prod.id}
                        className="bg-paper border border-line rounded-xl p-3 flex items-center gap-3.5 group transition duration-300"
                      >
                        <div className="w-16 h-16 rounded-xl bg-card flex-shrink-0 flex items-center justify-center border border-line">
                          <MenuImage
                            itemId={prod.id}
                            category={prod.category}
                            className="w-12 h-12"
                            image={prod.image}
                          />
                        </div>

                        <div className="select-text flex-1 min-w-0">
                          <h4 className="text-[13.5px] font-serif font-bold text-ink leading-snug break-words">
                            {prod.nameEn}
                          </h4>
                          <span dir="rtl" lang="ar" className="text-[13px] text-ink font-serif font-bold block leading-snug break-words text-right mt-0.5">
                            {prod.nameAr}
                          </span>
                          <div className="mt-1 font-mono text-[11px]">
                            {hasEligibleReward ? (
                              <span className="text-accent font-medium">
                                Free <span className="text-faint line-through ml-1">{prod.price} SR</span>
                              </span>
                            ) : (
                              <span className="text-faint">{prod.price} SR</span>
                            )}
                          </div>
                        </div>

                        {hasEligibleReward ? (
                          <button
                            type="button"
                            onClick={() => handleClaimFreeLoyaltyProduct(prod)}
                            disabled={isAlreadyInCart}
                            className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold transition cursor-pointer active:scale-95 ${
                              isAlreadyInCart
                                ? "bg-accent/12 text-accent"
                                : "bg-accent hover:bg-accent-deep text-cream"
                            }`}
                          >
                            {isAlreadyInCart ? "Added" : "Claim"}
                          </button>
                        ) : (
                          <div className="shrink-0 px-3 py-2 rounded-full text-center inline-flex items-center gap-1.5 text-faint text-[11px] font-medium">
                            <Lock className="w-3 h-3" strokeWidth={1.8} />
                            Day 5
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Persistent Floating Bottom Cart Bar */}
      {totalCartItemsCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 animate-slideUp">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-espresso hover:bg-ink text-cream py-3 pl-3 pr-4 rounded-full flex items-center justify-between shadow-lift transition hover:-translate-y-0.5 duration-200 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center bg-accent rounded-full text-cream">
                <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.7} />
                <span className="absolute -top-1 -right-1 bg-card text-espresso font-mono text-[10px] font-semibold leading-none w-5 h-5 rounded-full flex items-center justify-center">
                  {totalCartItemsCount}
                </span>
              </div>
              <span className="text-[14px] font-medium text-cream">View order</span>
            </div>

            <div className="flex items-center gap-2 text-[14px] font-mono text-cream">
              <span>SR {totalCartPriceSum}</span>
              <ArrowRight className="w-4 h-4 text-accent" strokeWidth={1.8} />
            </div>
          </button>
        </div>
      )}

      {/* --- CART DRAWER OVERLAY --- */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-espresso/60 backdrop-blur-sm z-50 flex items-end justify-center transition-opacity duration-300">
          <div className="bg-paper w-full max-w-md rounded-t-3xl shadow-lift relative flex flex-col max-h-[90vh] overflow-hidden text-ink animate-slideUp">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-card relative">
              <div>
                <h3 className="font-serif font-semibold text-[19px] text-ink leading-none">Your order</h3>
                <p className="text-[11px] text-faint mt-1">Sent straight to the counter</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-paper-2 rounded-full transition text-muted hover:text-ink"
              >
                <X className="w-5 h-5" strokeWidth={1.7} />
              </button>
            </div>

            {/* Inner List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="py-14 text-center text-muted text-[13px] font-serif">
                  <Coffee className="w-9 h-9 text-line mx-auto mb-3" strokeWidth={1.2} />
                  Your cart is empty. Tap any item to add it.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pr-1">
                    <span className="text-[11px] text-faint font-sans">Items</span>
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-[11px] text-faint hover:text-accent transition font-medium"
                    >
                      Clear all
                    </button>
                  </div>

                  {cart.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-card border border-line rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-paper border border-line flex-shrink-0 flex items-center justify-center">
                          <MenuImage itemId={c.id} category={c.category} className="w-8 h-8" image={c.image} />
                        </div>
                        <div className="min-w-0 text-left">
                          <h4 className="text-[13.5px] font-serif font-bold text-ink leading-snug break-words flex items-start gap-1.5">
                            <span className="min-w-0">{c.nameEn}</span>
                            {c.isLoyaltyFree && (
                              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-accent/12 text-accent rounded shrink-0 mt-0.5">
                                Gift
                              </span>
                            )}
                          </h4>
                          <p dir="rtl" lang="ar" className="text-[12.5px] font-serif font-bold text-ink leading-snug break-words text-right mt-0.5">
                            {c.nameAr}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-mono text-muted whitespace-nowrap">
                          {c.isLoyaltyFree ? "Free" : `${c.price * c.quantity} SR`}
                        </span>

                        <div className="flex items-center gap-1 bg-paper-2 p-0.5 rounded-full text-ink">
                          <button
                            type="button"
                            onClick={() => updateQuantity(c.id, -1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-card rounded-full transition"
                          >
                            <Minus className="w-3 h-3" strokeWidth={2} />
                          </button>
                          <span className="text-[12px] font-mono font-semibold w-4 text-center">{c.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(c.id, 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-card rounded-full transition"
                          >
                            <Plus className="w-3 h-3" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout Form */}
              <form onSubmit={handlePlaceOrder} className="pt-5 border-t border-line space-y-4">
                <h4 className="text-[11px] text-faint font-sans">Where to bring it</h4>

                {/* Step 1 — Floor */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-ink block">
                    Floor / الدور <span className="text-accent">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: '1' as const, en: '1st Floor', ar: 'الدور الأول' },
                      { value: '2' as const, en: '2nd Floor', ar: 'الدور الثاني' },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectFloor(opt.value)}
                        className={`px-3 py-2.5 rounded-xl border text-center transition duration-150 cursor-pointer flex flex-col items-center gap-0.5 active:scale-[0.98] ${
                          floor === opt.value
                            ? 'bg-espresso border-espresso text-cream'
                            : 'bg-card border-line text-muted hover:border-accent/40 hover:text-ink'
                        }`}
                      >
                        <span className="text-[13px] font-medium">{opt.en}</span>
                        <span className="text-[10px] opacity-80 font-serif">{opt.ar}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2 — Gate (1st floor only) */}
                {floor === '1' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[12px] font-medium text-ink block">
                      Gate / البوابة <span className="text-accent">*</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {['1', '2', '3', '4', '5'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGate(g)}
                          className={`py-2.5 rounded-xl border text-[13px] font-mono font-semibold transition duration-150 cursor-pointer active:scale-[0.98] ${
                            gate === g
                              ? 'bg-accent border-accent text-cream'
                              : 'bg-card border-line text-muted hover:border-accent/40 hover:text-ink'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-faint">Pick the gate closest to your shop.</p>
                  </div>
                )}

                {/* Step 3 — Shop name */}
                {floor && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[12px] font-medium text-ink block">
                      Shop name / اسم المحل <span className="text-accent">*</span>
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" strokeWidth={1.6} />
                      <input
                        type="text"
                        placeholder="e.g. Al Noor Electronics"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full text-[13px] bg-card border border-line rounded-xl pl-10 pr-3.5 py-3 text-ink placeholder-faint focus:outline-none focus:border-accent/50 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4 — Signboard photo */}
                {floor && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[12px] font-medium text-ink block">
                      Signboard photo / صورة اللوحة <span className="text-accent">*</span>
                    </label>

                    <input
                      ref={signboardInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleSignboardChange}
                      className="hidden"
                    />

                    {signboardPreview ? (
                      <div className="flex items-center gap-3 p-2.5 bg-card border border-line rounded-xl">
                        <img
                          src={signboardPreview}
                          alt="Your shop signboard"
                          className="w-14 h-14 rounded-lg object-cover border border-line shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          {isUploadingSignboard ? (
                            <p className="text-[12px] text-muted">Uploading…</p>
                          ) : signboardUrl ? (
                            <p className="text-[12px] font-medium text-accent flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" strokeWidth={2} /> Photo ready
                            </p>
                          ) : (
                            <p className="text-[12px] text-muted">Upload failed, try again</p>
                          )}
                          <button
                            type="button"
                            onClick={() => signboardInputRef.current?.click()}
                            className="text-[11px] text-faint hover:text-ink transition font-medium"
                          >
                            Change photo
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveSignboard}
                          className="p-1.5 rounded-full text-faint hover:text-ink hover:bg-paper-2 transition shrink-0"
                          aria-label="Remove signboard photo"
                        >
                          <X className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => signboardInputRef.current?.click()}
                        disabled={isUploadingSignboard}
                        className="w-full px-3.5 py-4 rounded-xl border border-dashed border-line bg-card hover:border-accent/40 text-muted hover:text-ink transition flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="w-5 h-5 text-accent" strokeWidth={1.6} />
                        <span className="text-[12.5px] font-medium">
                          {isUploadingSignboard ? 'Uploading…' : 'Take or upload a photo'}
                        </span>
                        <span className="text-[10.5px] text-faint">So the runner can find your shop</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-ink block">Your name / الاسم *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-[13px] bg-card border border-line rounded-xl px-3.5 py-3 text-ink placeholder-faint focus:outline-none focus:border-accent/50 transition"
                  />
                </div>

                {/* Optional Phone */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-ink block">
                    Phone or email <span className="text-faint font-normal">(for loyalty, optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="05xxxxxxxx or you@email.com"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full text-[13px] font-mono bg-card border border-line rounded-xl px-3.5 py-3 text-ink placeholder-faint focus:outline-none focus:border-accent/50 transition"
                  />
                  {checkoutProfile && (
                    <div className="text-[11px] bg-paper-2 border border-line p-2.5 rounded-lg text-muted flex justify-between items-center">
                      <span>Loyalty account found</span>
                      <span className="font-medium text-accent font-mono">
                        Day {checkoutProfile.streak} of 5
                      </span>
                    </div>
                  )}
                </div>

                {/* Redeem loyalty coupon discount toggler */}
                {checkoutProfile && checkoutProfile.rewardAvailable && (
                  <div className="p-3.5 bg-accent/8 border border-accent/20 rounded-xl space-y-3.5 text-ink animate-fadeIn">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex gap-2.5 items-start">
                        <Award className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.6} />
                        <div>
                          <p className="font-semibold text-ink text-[13px]">Your reward is ready</p>
                          <p className="text-[11px] text-muted leading-normal">Apply it to today's order</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={redeemReward}
                          onChange={(e) => setRedeemReward(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>

                    {redeemReward && (
                      <div className="pt-3 border-t border-accent/12 space-y-2.5 animate-fadeIn">
                        <p className="text-[11px] font-medium text-muted">Choose your reward / اختر مكافأتك</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRedeemType('20_percent')}
                            className={`px-2.5 py-2 text-[12px] rounded-xl font-medium border transition duration-150 cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
                              redeemType === '20_percent'
                                ? 'bg-accent border-accent text-cream'
                                : 'bg-card border-line text-muted hover:border-accent/40'
                            }`}
                          >
                            <span>20% off</span>
                            <span className="text-[9px] font-normal opacity-85">خصم 20%</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRedeemType('free_item')}
                            className={`px-2.5 py-2 text-[12px] rounded-xl font-medium border transition duration-150 cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
                              redeemType === 'free_item'
                                ? 'bg-accent border-accent text-cream'
                                : 'bg-card border-line text-muted hover:border-accent/40'
                            }`}
                          >
                            <span>Free product</span>
                            <span className="text-[9px] font-normal opacity-85">منتج مجاني</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-muted text-center">
                          {redeemType === '20_percent'
                            ? `Save 20% on this order (- SR ${Math.round(totalCartPriceSum * 0.2)})`
                            : `Makes your eligible gift free (- SR ${maxLoyaltyItemPrice})`
                          }
                        </p>

                        {redeemType === 'free_item' && (
                          <div className="pt-3 border-t border-accent/12 space-y-2">
                            <p className="text-[11px] font-semibold text-accent text-center">
                              Add one of your three gifts
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {actualRewardProductIds
                                .map((id) => menuItems.find((p) => p.id === id))
                                .filter((prod): prod is MenuItem => !!prod)
                                .slice(0, 3)
                                .map((prod) => {
                                  const isAlreadyInCart = cart.some(
                                    (ci) => ci.id === prod.id && ci.isLoyaltyFree
                                  );
                                  return (
                                    <div
                                      key={prod.id}
                                      className={`p-2 rounded-xl border flex items-center justify-between text-left gap-2.5 bg-card transition ${
                                        isAlreadyInCart
                                          ? 'border-accent/50 bg-accent/5'
                                          : 'border-line hover:border-accent/40'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 select-none">
                                        <div className="w-9 h-9 rounded-lg bg-paper flex-shrink-0 flex items-center justify-center border border-line">
                                          <MenuImage
                                            itemId={prod.id}
                                            category={prod.category}
                                            className="w-7 h-7"
                                            image={prod.image}
                                          />
                                        </div>
                                        <div>
                                          <p className="text-[12px] font-serif font-semibold text-ink leading-tight">
                                            {prod.nameEn}
                                          </p>
                                          <p className="text-[10px] text-faint font-mono">
                                            {prod.price} SR
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isAlreadyInCart) {
                                            saveCart(cart.filter(ci => !(ci.id === prod.id && ci.isLoyaltyFree)));
                                          } else {
                                            handleClaimFreeLoyaltyProduct(prod);
                                          }
                                        }}
                                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition ${
                                          isAlreadyInCart
                                            ? "bg-accent/12 text-accent"
                                            : "bg-accent hover:bg-accent-deep text-cream"
                                        }`}
                                      >
                                        {isAlreadyInCart ? "Added" : "Add free"}
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment method — settled on handover, not in the app */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[12px] font-medium text-ink block">
                    Payment / الدفع <span className="text-accent">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'cash' as const, en: 'Cash', ar: 'نقدي', Icon: Banknote },
                      { value: 'card' as const, en: 'Card · Mada', ar: 'بطاقة · مدى', Icon: CreditCard },
                    ]).map(({ value, en, ar, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPaymentMethod(value)}
                        className={`px-3 py-2.5 rounded-xl border text-center transition duration-150 cursor-pointer flex flex-col items-center gap-1 active:scale-[0.98] ${
                          paymentMethod === value
                            ? 'bg-espresso border-espresso text-cream'
                            : 'bg-card border-line text-muted hover:border-accent/40 hover:text-ink'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${paymentMethod === value ? 'text-accent' : ''}`} strokeWidth={1.6} />
                        <span className="text-[12.5px] font-medium">{en}</span>
                        <span className="text-[10px] opacity-80 font-serif">{ar}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-faint">
                    {paymentMethod === 'card'
                      ? 'Our runner brings the Mada card machine to your shop.'
                      : paymentMethod === 'cash'
                      ? 'Pay our runner in cash when the order arrives.'
                      : 'You pay on delivery — nothing is charged now.'}
                  </p>
                </div>

                {/* Guarantee check info */}
                <div className="p-3.5 bg-paper-2 border border-line rounded-xl flex gap-2.5 text-muted">
                  <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" strokeWidth={1.6} />
                  <p className="text-[11px] leading-relaxed">
                    Your order goes straight to the counter and the preparation timer starts right away.
                  </p>
                </div>

                {/* Total price calculation summary footer */}
                <div className="pt-3 border-t border-line text-[13px] text-muted space-y-1.5">
                  {redeemReward ? (
                    <>
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono line-through text-faint">SR {totalCartPriceSum}</span>
                      </div>
                      <div className="flex justify-between text-accent font-medium">
                        <span>
                          {redeemType === 'free_item'
                            ? 'Free product reward'
                            : '5-day streak, 20% off'
                          }
                        </span>
                        <span className="font-mono">
                          - SR {redeemType === 'free_item'
                            ? maxLoyaltyItemPrice
                            : Math.round(totalCartPriceSum * 0.2)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t border-line">
                        <span className="font-serif text-[15px] text-ink">Total</span>
                        <span className="font-mono text-[16px] text-accent">
                          SR {totalCartPriceSum - (redeemType === 'free_item'
                            ? maxLoyaltyItemPrice
                            : Math.round(totalCartPriceSum * 0.2))
                          }
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="font-serif text-[15px] text-ink">Total</span>
                      <span className="font-mono text-[16px] text-accent">SR {totalCartPriceSum}</span>
                    </div>
                  )}
                </div>

                {/* Action Placement */}
                <button
                  type="submit"
                  disabled={isCheckoutLoading || cart.length === 0}
                  className="w-full bg-accent hover:bg-accent-deep text-cream py-3.5 font-medium rounded-full transition-all text-[14px] disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                >
                  {isCheckoutLoading ? "Placing your order…" : "Place order"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- ABOUT US SHEET --- */}
      {isAboutOpen && (
        <div
          className="fixed inset-0 bg-espresso/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => setIsAboutOpen(false)}
        >
          <div
            className="bg-paper w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-lift flex flex-col max-h-[88vh] overflow-hidden text-ink animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-card">
              <h3 className="font-serif font-semibold text-[19px] text-ink leading-none">About us</h3>
              <button
                type="button"
                onClick={() => setIsAboutOpen(false)}
                className="p-2 hover:bg-paper-2 rounded-full transition text-muted hover:text-ink cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={1.7} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-5">
              <div className="flex flex-col items-center text-center gap-2.5 pb-1">
                <div className="w-14 h-14 rounded-full border border-accent/30 flex items-center justify-center bg-card">
                  <span className="font-serif text-[21px] font-semibold tracking-[0.15em] text-accent leading-none pl-[3px]">IC</span>
                </div>
                <div>
                  <p className="font-serif text-[20px] font-semibold tracking-[0.12em] uppercase text-ink">Iconic Coffee</p>
                  <p className="text-[11px] tracking-[0.24em] font-medium text-faint font-sans uppercase mt-1">Roastery</p>
                </div>
              </div>

              <p className="text-[13px] leading-relaxed text-muted font-sans text-center">
                Specialty beans, roasted in-house and pulled fresh to order, alongside a
                bakery counter we bake through the day. We deliver straight to your shop
                inside the mall.
              </p>
              <p className="text-[12.5px] leading-relaxed text-muted font-serif text-center" dir="rtl">
                قهوة مختصة محمصة لدينا وحلويات طازجة، نوصلها مباشرة إلى محلك داخل المركز.
              </p>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-start gap-3 p-3.5 bg-card border border-line rounded-xl">
                  <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.7} />
                  <div>
                    <p className="text-[12.5px] font-medium text-ink">Where we are</p>
                    <p className="text-[11.5px] text-muted leading-relaxed mt-0.5">
                      Ground floor, beside the main atrium. We deliver to both floors.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-card border border-line rounded-xl">
                  <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.7} />
                  <div>
                    <p className="text-[12.5px] font-medium text-ink">Opening hours</p>
                    <p className="text-[11.5px] text-muted leading-relaxed mt-0.5">
                      Daily, 9:00 am to 12:00 am
                    </p>
                  </div>
                </div>

                <a
                  href="tel:+966500000000"
                  className="flex items-start gap-3 p-3.5 bg-card border border-line rounded-xl hover:border-accent/40 transition"
                >
                  <PhoneCall className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.7} />
                  <div>
                    <p className="text-[12.5px] font-medium text-ink">Talk to us</p>
                    <p className="text-[11.5px] text-muted leading-relaxed mt-0.5 font-mono">+966 50 000 0000</p>
                  </div>
                </a>
              </div>

              <button
                type="button"
                onClick={() => { setIsAboutOpen(false); handleSelectCategory('specials'); }}
                className="w-full bg-accent hover:bg-accent-deep text-cream py-3 font-medium rounded-full transition text-[13.5px] cursor-pointer active:scale-[0.99]"
              >
                See today's specials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LIVE ORDER TRACKING OVERLAY / MODAL DIALOG --- */}
      {isTrackingOpen && activeOrderId && activeOrder && (
        <div className="fixed inset-0 bg-espresso/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-sm rounded-3xl overflow-hidden shadow-lift relative flex flex-col text-ink border border-line animate-fadeIn">

            {/* Top Close */}
            <div className="px-5 py-4 border-b border-line flex justify-between items-center bg-card">
              <div className="flex items-center gap-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent animate-livedot" />
                <span className="text-[13px] font-serif font-semibold text-ink">Order #{activeOrderId}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackingOpen(false)}
                className="p-1.5 rounded-full hover:bg-paper-2 text-muted transition"
              >
                <X className="w-5 h-5" strokeWidth={1.7} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center space-y-6 text-center">

              {/* Status headline */}
              {activeOrder.status === 'Awaiting Payment' ? (
                <div className="w-full text-center space-y-1.5 my-1">
                  <div className="text-4xl font-mono text-ink">
                    SR {activeOrder.totalPrice}
                  </div>
                  <h4 className="text-[13px] font-medium text-ink">
                    {activeOrder.paymentMethod === 'card'
                      ? 'Paying by card (Mada)'
                      : activeOrder.paymentMethod === 'cash'
                      ? 'Paying in cash'
                      : 'Waiting for payment'}
                  </h4>
                  <p className="text-[12px] leading-relaxed text-muted font-sans max-w-[38ch] mx-auto">
                    {activeOrder.paymentMethod === 'card'
                      ? 'Our runner brings the Mada card machine with your order. Payment confirms it and starts preparation.'
                      : activeOrder.paymentMethod === 'cash'
                      ? 'Please have the cash ready for our runner. Payment confirms the order and starts preparation.'
                      : 'Pay at the counter or with your waiter to confirm the order and start preparation.'}
                  </p>
                  <p className="text-[11px] text-faint font-sans" dir="rtl">يرجى الدفع لتأكيد الطلب وبدء التحضير</p>
                </div>
              ) : activeOrder.status !== 'Delivered' && countdownSeconds > 0 ? (
                <div className="space-y-1.5 my-1">
                  <div className="text-5xl font-mono tracking-tight text-accent">
                    {formatCountdown()}
                  </div>
                  <p className="text-[11px] text-faint font-sans tracking-[0.15em] uppercase flex items-center justify-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-accent" strokeWidth={1.6} /> Estimated ready
                  </p>
                </div>
              ) : activeOrder.status === 'Delivered' ? (
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                  <Check className="w-9 h-9 text-cream" strokeWidth={2} />
                </div>
              ) : (
                <div className="space-y-1.5 my-1">
                  <div className="text-2xl font-serif font-semibold text-ink">
                    Almost ready
                  </div>
                  <p className="text-[11px] text-faint font-sans tracking-[0.15em] uppercase flex items-center justify-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-accent" strokeWidth={1.6} /> Final touches
                  </p>
                </div>
              )}

              {/* Status timeline - unified accent + neutral */}
              <div className="w-full py-1">
                <div className="relative pl-7 space-y-5 text-left">
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-line" />

                  {[
                    { done: ['Awaiting Payment', 'Pending', 'Preparing', 'Out for Table', 'Delivered'].includes(activeOrder.status), active: activeOrder.status === 'Awaiting Payment' || activeOrder.status === 'Pending', title: 'Order received', sub: `Placed for ${describeDestination(activeOrder)}` },
                    { done: ['Preparing', 'Out for Table', 'Delivered'].includes(activeOrder.status), active: activeOrder.status === 'Preparing', title: 'Preparing', sub: 'Your drinks and pastries are being made' },
                    { done: ['Out for Table', 'Delivered'].includes(activeOrder.status), active: activeOrder.status === 'Out for Table', title: 'On its way', sub: `Heading to ${describeDestination(activeOrder)}` },
                    { done: activeOrder.status === 'Delivered', active: false, title: 'Served', sub: 'Delivered to your shop' },
                  ].map((step, i) => (
                    <div key={i} className="relative flex items-start gap-3.5">
                      <div className={`absolute left-[-27px] top-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all ${
                        step.done ? 'bg-accent' : step.active ? 'bg-accent/25 ring-2 ring-accent/40' : 'bg-line'
                      }`}>
                        {step.done && <Check className="w-2.5 h-2.5 text-cream" strokeWidth={2.5} />}
                      </div>
                      <div>
                        <h5 className={`text-[13px] font-serif font-semibold ${step.done || step.active ? 'text-ink' : 'text-faint'}`}>{step.title}</h5>
                        <p className="text-[11px] text-muted leading-snug">{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivered banner */}
              {activeOrder.status === 'Delivered' && (
                <div className="p-4 bg-card border border-line rounded-2xl w-full text-center space-y-2.5 animate-fadeIn">
                  <p className="text-[13px] font-serif font-semibold text-ink">Enjoy your coffee</p>
                  <p className="text-[11.5px] leading-relaxed text-muted">
                    Your order has been delivered. We hope to see you again soon.
                  </p>
                  <button
                    type="button"
                    onClick={handleDismissTracking}
                    className="mt-1 px-5 py-2.5 bg-accent hover:bg-accent-deep text-cream text-[12px] font-medium rounded-full transition"
                  >
                    Start a new order
                  </button>
                </div>
              )}

              {/* Keep viewing button if prep work goes on */}
              {activeOrder.status !== 'Delivered' && (
                <button
                  type="button"
                  onClick={() => setIsTrackingOpen(false)}
                  className="w-full bg-paper-2 hover:bg-line/60 text-ink py-3 font-medium text-[13px] rounded-full transition-all"
                >
                  Back to the menu
                </button>
              )}

              {/* Delete Active Order from browser memory */}
              <button
                type="button"
                onClick={handleDismissTracking}
                className="text-[11px] text-faint hover:text-muted font-medium"
              >
                Clear this order
              </button>

            </div>

            {/* Quick footer */}
            <div className="px-5 py-3 bg-card border-t border-line text-center text-[10px] text-faint font-sans tracking-wide">
              Live updates from the counter
            </div>

          </div>
        </div>
      )}

      {/* Footer copyright and credit info */}
      <footer className="bg-card py-8 border-t border-line text-center space-y-1.5 mt-auto">
        <p className="font-serif text-[18px] font-semibold text-ink tracking-[0.1em]">Iconic Coffee</p>
        <p className="text-[11px] text-faint font-sans">Specialty beans and fresh bakery. Est. 2024</p>
        <p className="text-[11px] text-faint pt-4 font-sans">
          Developed by{' '}
          <a
            href="https://www.facebook.com/rabiulhasan.2001"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-medium"
          >
            Rabiul Rami
          </a>
        </p>
      </footer>

    </div>
  );
}
