import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle, 
  ArrowRight,
  Sparkle,
  PhoneCall,
  XCircle,
  HelpCircle,
  Award
} from 'lucide-react';
import { CATEGORIES, MENU_ITEMS, MenuItem } from '../data';
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

  // Category state
  const [activeCategory, setActiveCategory] = useState('specials');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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
  
  // Selected category ref for smooth scrolling
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Selected loyalty reward products (up to 3)
  const [loyaltyRewardProductIds, setLoyaltyRewardProductIds] = useState<string[]>([]);

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
      alert("You can only claim 1 free Loyalty Reward product per order!");
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
      alert("You can only claim 1 unit of your Free Loyalty Gift!");
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

  const eligibleLoyaltyItemsInCart = cart.filter(c => loyaltyRewardProductIds.includes(c.id));
  const maxLoyaltyItemPrice = eligibleLoyaltyItemsInCart.length > 0 
    ? Math.max(...eligibleLoyaltyItemsInCart.map(c => c.price)) 
    : 0;

  // Place Order checkout click
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !tableNumber) {
      alert('Please fill out your Name and select a Table Number!');
      return;
    }

    if (redeemReward && redeemType === 'free_item' && maxLoyaltyItemPrice === 0) {
      alert("Please add at least one of your 3 Exclusive VIP Loyalty Gifts to your cart to claim your Free Product reward!");
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
        tableNumber,
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
      alert(err.message || 'Server offline. Try re-sending order.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Dismiss tracking overlay
  const handleDismissTracking = () => {
    localStorage.removeItem('iconic_active_order_id');
    setActiveOrderId(null);
    setIsTrackingOpen(false);
  };

  // Match Lucide category icons precisely
  const renderCatIcon = (iconName: string) => {
    const style = "w-4 h-4 mr-1.5";
    switch (iconName) {
      case 'Sparkles': return <Sparkles className={style} />;
      case 'CakeSlice': return <CakeSlice className={style} />;
      case 'Milk': return <Milk className={style} />;
      case 'CupSoda': return <CupSoda className={style} />;
      case 'IceCream': return <IceCream className={style} />;
      case 'Citrus': return <Citrus className={style} />;
      case 'Coffee': return <Coffee className={style} />;
      default: return <Coffee className={style} />;
    }
  };

  // Filter items in real time based on active category tabs and search bars
  const displayItems = menuItems.filter(it => {
    const belongsToCategory = activeCategory === 'all' || it.category === activeCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      it.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.nameAr.includes(searchQuery) ||
      (it.descriptionEn && it.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase()));

    return belongsToCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#3D2312] flex flex-col antialiased relative">
      
      {/* Top App Header Badge Area */}
      <header className="bg-[#FFFDFC]/90 backdrop-blur-md border-b border-[#F3EAD9] px-4 py-4 flex flex-col items-center justify-center sticky top-0 z-40 shadow-sm relative">
        {/* Subtle Luxury Top Gold Border Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200" />

        {/* Circular Gold Emblem with Luxury Framing */}
        <div className="w-13 h-13 rounded-full border border-[#D5C29D] flex items-center justify-center bg-white shadow-md mb-1 relative transform transition hover:scale-105 duration-300">
          <div className="w-11 h-11 rounded-full border border-[#D5C29D]/40 flex items-center justify-center bg-[#FFFDF9]">
            <span className="font-serif text-xl font-bold tracking-widest text-[#9C5D30] scale-95">IC</span>
          </div>
          <div className="absolute -right-1 -bottom-1 w-4.5 h-4.5 bg-[#9C5D30] rounded-full flex items-center justify-center text-[7px] text-[#FDF8F2] font-semibold border border-[#E9DFCE] shadow-xs">
            ★
          </div>
        </div>

        {/* Cursive Luxury Headlines */}
        <h1 className="font-serif text-lg tracking-[0.25em] font-bold uppercase text-[#2C190D] mt-1 pl-1">ICONIC COFFEE</h1>
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#A28259] font-sans">Sip Luxury • Taste Perfection</p>
        
        {/* Established divider lines */}
        <div className="flex items-center gap-2 mt-1.5 w-44 justify-center">
          <div className="h-[0.5px] bg-[#EADDC9] flex-1" />
          <span className="text-[8px] uppercase tracking-[0.18em] text-[#BCAAA4] font-mono">EXCLUSIVE</span>
          <div className="h-[0.5px] bg-[#EADDC9] flex-1" />
        </div>
      </header>

      {/* Main Content Area optimized for mobile */}
      <main className="flex-1 w-full max-w-md mx-auto pb-28 px-4 flex flex-col gap-6 pt-4">

        {/* Dynamic Tracking Status Floating Widget - visible at any state */}
        {activeOrderId && activeOrder && (
          <div 
            onClick={() => setIsTrackingOpen(true)}
            className="w-full bg-[#3D2312] hover:bg-[#2F1A0B] text-[#FAF6F0] p-3.5 rounded-xl flex items-center justify-between cursor-pointer shadow-xl border border-amber-800/10 hover:shadow-2xl transition group active:scale-95"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Order #{activeOrderId} Progress</p>
                <div className="text-[11px] font-medium font-mono text-slate-100 flex items-center gap-1.5 mt-0.5">
                  Status: 
                  <span className="font-bold underline text-emerald-300">
                    {activeOrder.status === 'Awaiting Payment' && '💳 Wait for Payment'}
                    {activeOrder.status === 'Pending' && '⏳ Waiting Validation'}
                    {activeOrder.status === 'Preparing' && '☕ Brew-cooking'}
                    {activeOrder.status === 'Out for Table' && '🏃 Out to Table'}
                    {activeOrder.status === 'Delivered' && '✓ Served & Done!'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-[#FAF6F0]/10 py-1 px-2.5 rounded-lg">
              <span>Track Details</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* --- 5-DAY COFFEE STREAK CLUB DECORATED WIDGET --- */}
        <div className="w-full bg-[#3D2312] rounded-2.5xl p-4 shadow-xl border border-amber-800/20 text-[#FFFDF9] relative overflow-hidden flex flex-col gap-3.5 select-none hover:shadow-2xl transition duration-300">
          <div className="absolute top-0 right-0 -translate-y-5 translate-x-5 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[8.5px] uppercase tracking-widest font-extrabold text-amber-300 border border-amber-500/30">
                ⭐ Streak Challenger
              </span>
              <h3 className="font-serif text-sm font-black text-amber-100 uppercase tracking-wide mt-1.5">5-Day Coffee Streak Club</h3>
              <p className="text-[10px] text-stone-300 leading-snug mt-0.5">Order 5 consecutive days back-to-back to unlock 20% off your entire next bill!</p>
            </div>
            <Award className="w-8 h-8 text-amber-400 stroke-1.5 animate-pulse shrink-0" />
          </div>

          {/* Phone/Email input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter phone number or email to check..."
              value={loyaltyInput}
              onChange={(e) => setLoyaltyInput(e.target.value)}
              className="flex-1 text-xs font-mono bg-[#FAF6F0]/10 hover:bg-[#FAF6F0]/15 focus:bg-stone-900 border border-amber-800/30 rounded-xl px-3 py-2 text-white placeholder-stone-400 focus:outline-none focus:border-amber-500/50"
            />
            <button
              type="button"
              onClick={handleCheckLoyalty}
              disabled={isCheckingLoyalty || !loyaltyInput.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center cursor-pointer transition active:scale-95 shadow-sm"
            >
              {isCheckingLoyalty ? "..." : "Check"}
            </button>
          </div>

          {checkedProfile ? (
            <div className="bg-[#FAF6F0]/5 rounded-xl p-3.5 border border-amber-800/20 text-left space-y-3.5 mt-0.5 animate-fadeIn">
              <div className="flex justify-between items-center text-[11px] font-sans">
                <span className="font-mono text-amber-200 truncate max-w-[170px] font-semibold">{checkedProfile.identifier}</span>
                <span className="text-amber-300 font-extrabold bg-[#55331C] px-2 py-0.5 rounded-md text-[10px]">
                  {checkedProfile.streak}/5 Consecutive Days
                </span>
              </div>

              {/* Progress visual dots mapping */}
              <div className="flex gap-2 justify-between items-center bg-stone-950/30 p-2.5 rounded-lg border border-amber-800/10">
                {[1, 2, 3, 4, 5].map((day) => {
                  const isActive = checkedProfile.streak >= day;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full border transition-all ${
                        isActive 
                          ? 'bg-amber-400 border-amber-300 shadow-md shadow-amber-500/30 scale-110' 
                          : 'bg-stone-800 border-stone-700'
                      }`} />
                      <span className="text-[8px] text-stone-400 font-bold uppercase">Day {day}</span>
                    </div>
                  );
                })}
              </div>

              {checkedProfile.rewardAvailable ? (
                <div className="text-[10px] text-emerald-300 font-bold flex items-start gap-2 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold uppercase tracking-wide text-emerald-250">🎉 Streak Complete!</p>
                    <p className="text-[9.5px] text-stone-300 font-normal mt-0.5">Use <span className="font-bold underline text-amber-300">{checkedProfile.identifier}</span> at checkout and toggle the 20% discount coupon flag! Excellent work!</p>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-stone-300 leading-relaxed bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                  {checkedProfile.streak === 0 ? (
                    "No orders placed today. Order now to initiate Day 1! Remember that missed days break the streak."
                  ) : checkedProfile.streak === 5 ? (
                    "Max streak unlocked! Redeem your reward on your next order to reset/maintain."
                  ) : (
                    `Great! Order again tomorrow to secure your Day ${checkedProfile.streak + 1} streak progression.`
                  )}
                </div>
              )}
            </div>
          ) : (
            loyaltyInfoMsg && (
              <p className="text-[10px] text-amber-300 font-bold text-center bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/10">
                ℹ️ {loyaltyInfoMsg}
              </p>
            )
          )}
        </div>

        {/* --- EXCLUSIVE LOYALTY REWARDS SELECTION --- */}
        {menuItems && loyaltyRewardProductIds && loyaltyRewardProductIds.length > 0 && (
          <div className="w-full bg-[#FAF6F0] rounded-2.5xl p-5 border border-[#E9DFCE] text-[#3D2312] space-y-4 animate-fadeIn shadow-xs">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="px-2 py-0.5 rounded bg-[#9C5D30]/10 text-[9px] uppercase tracking-wider font-extrabold text-[#9C5D30] border border-[#9C5D30]/20">
                  🎁 Exclusive Gift Menu
                </span>
                <h3 className="font-serif text-base font-black text-[#5C3A21] uppercase tracking-wide mt-1.5 leading-tight">
                  ⭐ VIP Loyalty Gifts
                </h3>
                <p className="text-[10px] text-stone-500 leading-snug mt-1 font-sans">
                  The admin has selected these 3 choices. If your 5-Day Coffee Streak is complete, claim 1 of these items completely FREE!
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-amber-500 shrink-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {loyaltyRewardProductIds
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
                      className="bg-white border border-[#E9DFCE] rounded-2xl p-4 flex flex-col justify-between gap-4 relative overflow-hidden group shadow-md hover:border-[#9C5D30]/60 transition duration-300"
                    >
                      <div className="flex flex-col items-center text-center gap-3">
                        {/* Modern elevated image container at the top */}
                        <div className="w-20 h-20 rounded-2xl bg-[#FAF6F0] flex-shrink-0 flex items-center justify-center border border-[#E9DFCE]/70 shadow-inner group-hover:scale-105 transition-all duration-300">
                          <MenuImage
                            itemId={prod.id}
                            category={prod.category}
                            className="w-16 h-16 group-hover:rotate-2 transition-transform"
                            image={prod.image}
                          />
                        </div>
                        
                        {/* Title and details clearly visible below the image */}
                        <div className="select-text w-full">
                          <h4 className="text-xs md:text-sm font-serif font-black uppercase text-neutral-800 leading-snug whitespace-normal break-words">
                            {prod.nameEn}
                          </h4>
                          <span className="text-[11px] text-[#9C5D30]/80 font-serif font-bold block leading-normal mt-1.5 whitespace-normal break-words">
                            {prod.nameAr}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#FAF6F0] pt-2.5 mt-1">
                        <div className="text-left font-mono text-xs">
                          {hasEligibleReward ? (
                            <>
                              <span className="text-[9px] text-[#9C5D30] font-bold block uppercase tracking-wider">
                                Claim Price
                              </span>
                              <span className="text-emerald-600 font-black text-xs leading-none block">
                                FREE (0 SR)
                              </span>
                              <span className="text-[9px] text-stone-400 block line-through">
                                {prod.price} SR
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-[9px] text-stone-400 font-bold block uppercase tracking-wider">
                                Value Gift
                              </span>
                              <span className="text-stone-600 font-bold">
                                {prod.price} SR
                              </span>
                            </>
                          )}
                        </div>

                        {hasEligibleReward ? (
                          <button
                            type="button"
                            onClick={() => handleClaimFreeLoyaltyProduct(prod)}
                            disabled={isAlreadyInCart}
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer active:scale-95 shadow-sm font-mono ${
                              isAlreadyInCart
                                ? "bg-emerald-100 border border-emerald-300 text-emerald-700"
                                : "bg-[#9C5D30] hover:bg-[#7D451B] text-white"
                            }`}
                          >
                            {isAlreadyInCart ? "Added ✔" : "Claim 🎁"}
                          </button>
                        ) : (
                          <div className="px-2 py-1 bg-[#FAF6F0] rounded-lg text-center border border-[#E9DFCE] inline-flex items-center gap-1 text-[#9C5D30] font-extrabold text-[9px] uppercase tracking-wider">
                            <span>🔒 Unlock at Day 5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Elegant Search bar with gold frame */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A18F7B]" />
          <input
            type="text"
            placeholder="Search matching sweet / hot brew..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-serif bg-white border border-[#E9DFCE] text-[#3D2312] placeholder-[#A18F7B] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#9C5D30] transition shadow-inner"
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Horizontal Category Slider Track */}
        <div className="overflow-x-auto scrollbar-none pb-2.5 -mx-4 px-4 sticky top-[134px] sm:top-[148px] z-30 bg-[#FAF6F0]/90 backdrop-blur-md shadow-sm border-y border-[#F3EAD9]/50">
          <div className="flex gap-2.5 whitespace-nowrap py-1.5 matches-scrollbar">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                  }}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center shadow-xs transition-all duration-300 active:scale-95 border ${
                    active
                      ? 'bg-[#55331C] text-amber-200 border-[#947752] scale-[1.02] font-semibold'
                      : 'bg-white/80 hover:bg-[#FBF7F0] text-[#7A6351] border-[#E9DFCE] hover:text-[#55331C]'
                  }`}
                >
                  {renderCatIcon(cat.icon)}
                  <span className="mr-1 font-sans">{cat.nameEn}</span>
                  <span className="text-[9px] opacity-70 font-mono">({cat.nameAr})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- DAILY SPECIALS HEADER & ROW (IF ACTIVE AND VALID) --- */}
        {activeCategory === 'specials' && searchQuery === '' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Header decoration */}
            <div className="flex items-center gap-2 mt-3">
              <span className="px-3 py-1 rounded bg-[#55331C] text-[8.5px] uppercase font-bold text-amber-200 tracking-[0.2em] flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" /> UNIQUE SPECIALS
              </span>
              <div className="h-[0.5px] bg-[#DFCBB3]/60 flex-1" />
            </div>

            {/* Horizontal Cards flow precisely stylized */}
            <div className="overflow-x-auto scrollbar-none -mx-4 px-4 pb-4">
              <div className="flex gap-4.5 w-max py-1">
                {menuItems.filter(it => it.isSpecial).map((item) => (
                  <div
                    key={item.id}
                    className="w-48 bg-white border border-[#EFE7D8] rounded-2xl overflow-hidden shadow-md flex flex-col hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {/* Badge top select */}
                    <div className="px-3 py-2 flex justify-between items-center bg-gradient-to-r from-[#FAF6F0] to-[#FFFDF9] border-b border-[#F7EFE2]">
                      <span className="px-2 py-0.5 text-[7.5px] rounded-md bg-amber-700/10 text-amber-900 border border-amber-700/20 font-bold tracking-wider capitalize">
                        {item.tag || "BEST PICK"}
                      </span>
                      <Sparkle className="w-3 h-3 text-amber-505" />
                    </div>

                    {/* Circular Image Container */}
                    <div className="py-4 flex justify-center bg-gradient-to-b from-[#FFFDF9] to-transparent">
                      <div className="w-24 h-24 rounded-full border-2 border-[#E9C35A] bg-white shadow-sm flex items-center justify-center p-1 relative transform transition-transform duration-300 group-hover:scale-105">
                        <MenuImage itemId={item.id} category={item.category} className="w-20 h-20" image={item.image} />
                      </div>
                    </div>

                    {/* Dark Brown Bottom layout with rich gold contrast */}
                    <div className="p-4 bg-gradient-to-b from-[#3E2514] to-[#25140A] text-white flex-1 flex flex-col justify-between">
                      <div>
                        {/* English name with Jakarta brand standard */}
                        <h4 className="text-[10px] font-sans font-bold tracking-wider uppercase text-amber-100 line-clamp-1">{item.nameEn}</h4>
                        {/* Arabic name */}
                        <div className="text-[11px] text-amber-300 font-serif font-bold mt-0.5 tracking-wide text-right">
                          {item.nameAr}
                        </div>
                        {/* Description */}
                        <p className="text-[9px] text-[#CAB29E] font-sans mt-2.5 leading-snug line-clamp-2 h-7 overflow-hidden select-none">
                          {item.descriptionEn}
                        </p>
                      </div>

                      {/* Pricing block with Add triggers */}
                      <div className="mt-4 pt-3 border-t border-amber-800/50 flex items-center justify-between">
                        <div className="text-xs font-mono font-bold text-amber-400">
                          SR {item.price}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="px-3 py-1.5 bg-[#AC7F53] hover:bg-[#8F633B] active:scale-95 text-[9px] uppercase font-bold font-sans tracking-wide text-white rounded-lg transition shadow-xs"
                        >
                          + ADD
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
        <div className="space-y-6">
          
          {/* Dynamic Active Title */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-serif font-black uppercase text-[#2B1B12] tracking-wider">
              {CATEGORIES.find(c => c.id === activeCategory)?.nameEn || 'Menu'}
            </h3>
            <span className="text-xs text-stone-400 font-mono">
              ({CATEGORIES.find(c => c.id === activeCategory)?.nameAr || 'قائمة'})
            </span>
            <div className="h-[0.5px] bg-[#D1C2AD] flex-1" />
          </div>

          {/* Catalog grid */}
          {displayItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500 font-serif">
              <Coffee className="w-10 h-10 text-stone-300 mx-auto mb-2 animate-bounce" />
              No beverages or sweets found matching search queries.
            </div>
          ) : (
             <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
               {displayItems.map((item) => (
                 <div
                   key={item.id}
                   className="bg-white rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col relative group border border-[#FAF6F0]"
                 >
                   {/* Realistic Product Image centered on Light Cream Background */}
                   <div className="pt-4 pb-3 sm:pt-6 sm:pb-4 flex justify-center bg-[#FAF6F0] rounded-t-[24px] sm:rounded-t-[32px] relative">
                     <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-28 sm:h-28 rounded-full border-[3px] sm:border-[4px] border-white bg-white shadow-md flex items-center justify-center p-0.5 relative transform transition-transform duration-300 group-hover:scale-105 z-10 overflow-hidden">
                       <MenuImage itemId={item.id} category={item.category} className="w-12 h-12 xs:w-16 xs:h-16 sm:w-24 sm:h-24 rounded-full object-cover" image={item.image} />
                       {item.isSpecial && (
                         <span className="absolute top-1 right-1 bg-amber-700 text-[5px] sm:text-[6px] text-white px-1 sm:px-1.5 py-0.5 rounded-full font-bold shadow-xs">
                           ★ Unique
                         </span>
                       )}
                     </div>
                   </div>
 
                   {/* Rich Chocolate Espresso Dark Brown Bottom Block */}
                   <div className="px-2 py-3 sm:px-3 sm:pt-4 sm:pb-5 flex-1 flex flex-col justify-between text-center bg-[#3D2312] text-white rounded-b-[24px] sm:rounded-b-[32px] relative select-none">
                     <div className="space-y-0.5 sm:space-y-1">
                       {/* Name English Uppercase Centered */}
                       <h4 className="text-[9px] xs:text-[10px] sm:text-[11.5px] font-sans font-black tracking-wider text-white uppercase text-center leading-tight line-clamp-2 h-6 xs:h-7 sm:h-8" title={item.nameEn}>
                         {item.nameEn}
                       </h4>
 
                       {/* Name Arabic Gold Accent */}
                       <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-[#E5C292] font-sans font-bold text-center truncate">
                         {item.nameAr}
                       </p>
 
                       {/* Description Muted Cream-Gray */}
                       {item.descriptionEn && (
                         <p className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] text-[#EDE7DE]/70 font-sans leading-snug line-clamp-2 px-0.5 h-5 xs:h-6 sm:h-7 select-none text-center overflow-hidden">
                           {item.descriptionEn}
                         </p>
                       )}
                     </div>
 
                     {/* Divider + Pricing + Shopping triggers INLINE */}
                     <div className="mt-2.5 sm:mt-3.5">
                       {/* Faint Divider exactly like photo */}
                       <div className="w-11/12 mx-auto border-t border-white/10" />
 
                       {/* Pricing and Add button side-by-side (INLINE) */}
                       <div className="flex items-center justify-between gap-1 mt-2.5 w-full">
                         {/* Muted Gold Price left-aligned */}
                         <div className="text-[9.5px] xs:text-[10.5px] sm:text-[12.5px] font-mono font-black text-[#FBBF24] shrink-0">
                           SR {item.price}
                         </div>
 
                         {/* Touch target / action button inline with price */}
                         <div className="shrink-0">
                           {cart.find(ci => ci.id === item.id) ? (
                             <div className="flex items-center justify-between bg-[#55331C] text-amber-200 rounded-lg p-0.5 px-1 sm:px-1.5 shadow-xs border border-amber-950/40 w-[45px] xs:w-[55px] sm:w-[75px]">
                               <button
                                 type="button"
                                 onClick={() => updateQuantity(item.id, -1)}
                                 className="px-0.5 sm:px-1 hover:bg-[#3D2312]/40 active:scale-95 rounded text-[8px] sm:text-[10px] font-bold transition text-amber-200 cursor-pointer"
                               >
                                 -
                               </button>
                               <span className="text-[8px] sm:text-[9.5px] font-mono font-black text-white">{cart.find(ci => ci.id === item.id)?.quantity}</span>
                               <button
                                 type="button"
                                 onClick={() => updateQuantity(item.id, 1)}
                                 className="px-0.5 sm:px-1 hover:bg-[#3D2312]/40 active:scale-95 rounded text-[8px] sm:text-[10px] font-bold transition text-amber-200 cursor-pointer"
                               >
                                 +
                               </button>
                             </div>
                           ) : (
                             <button
                               type="button"
                               onClick={() => handleAddToCart(item)}
                               className="bg-[#AC7F53] hover:bg-[#8F633B] active:scale-95 text-white font-sans text-[7.5px] xs:text-[8px] sm:text-[9.5px] tracking-wider uppercase font-extrabold py-1 px-1.5 sm:px-3 rounded-md sm:rounded-lg transition shadow-sm cursor-pointer whitespace-nowrap block"
                             >
                               + Add
                             </button>
                           )}
                         </div>
                       </div>
                     </div>
 
                   </div>
                 </div>
               ))}
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
            className="w-full bg-[#422B1D] hover:bg-[#321F14] text-white py-3.5 px-4 rounded-full flex items-center justify-between shadow-2xl transition border border-amber-800/10 hover:-translate-y-0.5 duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="relative p-2 bg-amber-500 rounded-full text-white shadow-inner">
                <ShoppingBag className="w-4.5 h-4.5" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-[#422B1D] font-mono text-[9px] font-black leading-none w-4 h-4 rounded-full flex items-center justify-center border border-[#422B1D] shadow-md animate-pulse">
                  {totalCartItemsCount}
                </span>
              </div>
              <div className="text-left font-serif">
                <p className="text-xs font-black tracking-wide text-amber-200 uppercase">View Order Cart</p>
                <p className="text-[10px] text-stone-300">Includes table routing</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-mono font-black text-[#FFFDF9] bg-stone-500/10 py-1.5 px-3 rounded-xl border border-white/10">
              <span>SR {totalCartPriceSum}</span>
              <ArrowRight className="w-4 h-4 ml-1 text-emerald-400" />
            </div>
          </button>
        </div>
      )}

      {/* --- CART DRAWER OVERLAY --- */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-[#3D2312]/60 backdrop-blur-sm z-50 flex items-end justify-center transition-opacity duration-300">
          <div className="bg-[#FAF6F0] w-full max-w-md rounded-t-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden text-[#3D2312] border-t border-[#E8DCC8] animate-slideUp">
            
            {/* Header */}
            <div className="p-4 border-b border-[#EBDCC5] flex items-center justify-between bg-white relative">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#9C5D30]" />
                <div>
                  <h3 className="font-serif font-black text-sm text-[#422B1D] uppercase tracking-wider">Your Table Cart</h3>
                  <p className="text-[10px] text-[#A68F7A] font-mono">Real-time waiter integration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-full transition text-stone-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inner List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-[#A68F7A] italic text-xs font-serif">
                  <Coffee className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  Your cart is empty. Tap any menu item to select it.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pr-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Selected Item Summary</span>
                    <button 
                      type="button" 
                      onClick={handleClearCart}
                      className="text-[10px] text-red-650 hover:underline font-bold"
                    >
                      Clear All
                    </button>
                  </div>

                  {cart.map((c) => (
                    <div 
                      key={c.id}
                      className="p-3 bg-white border border-[#E9DFCE] rounded-xl flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-200/50 flex-shrink-0 flex items-center justify-center">
                          <MenuImage itemId={c.id} category={c.category} className="w-8 h-8" image={c.image} />
                        </div>
                        <div className="truncate text-left">
                          <h4 className="text-xs font-serif font-black uppercase text-neutral-800 truncate flex items-center gap-1.5">
                            {c.nameEn}
                            {c.isLoyaltyFree && (
                              <span className="px-1 py-0.5 text-[8px] font-mono bg-amber-500 text-stone-950 font-black rounded uppercase shrink-0">
                                GIFT
                              </span>
                            )}
                          </h4>
                          <h4 className="text-[10px] text-stone-400 font-serif font-semibold text-left truncate">{c.nameAr}</h4>
                          {c.isLoyaltyFree && (
                            <span className="text-[8.5px] font-mono font-bold text-[#9C5D30] block leading-none mt-0.5">
                              🎁 Free Loyalty Reward
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-stone-500 whitespace-nowrap">
                          {c.isLoyaltyFree ? "FREE" : `${c.price * c.quantity} SR`}
                        </span>
                        
                        <div className="flex items-center gap-1.5 bg-neutral-100 p-0.5 rounded-full text-stone-800">
                          <button
                            type="button"
                            onClick={() => updateQuantity(c.id, -1)}
                            className="p-1 hover:bg-neutral-200 rounded-full transition"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-mono font-black px-1.5">{c.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(c.id, 1)}
                            className="p-1 hover:bg-neutral-200 rounded-full transition"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout Form */}
              <form onSubmit={handlePlaceOrder} className="pt-4 border-t border-[#EBDCC5] space-y-3.5">
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Routing Details</h4>
                
                {/* Table selector (Urgent for QR menus!) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#422B1D] block">Select Your Table *</label>
                  <select
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-[#E9DFCE] rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:border-[#9C5D30]"
                  >
                    <option value="">-- CHOOSE FOR DELIVER --</option>
                    {[...Array(20)].map((_, i) => {
                      const tStr = String(i + 1).padStart(2, '0');
                      return (
                        <option key={i} value={tStr}>Table {tStr} (Iconic Room)</option>
                      );
                    })}
                  </select>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#422B1D] block">Your Name / الاسم *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs font-serif bg-white border border-[#E9DFCE] rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:border-[#9C5D30]"
                  />
                </div>

                {/* Optional Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#422B1D] block">
                    Loyalty Identifier - Phone or Email (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 05xxxxxxx or user@gmail.com"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-[#E9DFCE] rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:border-[#9C5D30]"
                  />
                  {checkoutProfile && (
                    <div className="text-[10px] bg-stone-105 border border-amber-900/10 p-2.5 rounded-lg text-stone-650 flex justify-between items-center transition">
                      <span>✓ Connected Account Status:</span>
                      <span className="font-bold text-[#9D5D30] font-mono bg-white/60 px-1.5 py-0.5 rounded">
                        {checkoutProfile.streak}/5 Consecutive Streak Day Info
                      </span>
                    </div>
                  )}
                </div>

                {/* Redeem loyalty coupon discount toggler */}
                {checkoutProfile && checkoutProfile.rewardAvailable && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3.5 text-stone-800 shadow-xs animate-fadeIn">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex gap-2 items-start text-xs text-stone-700">
                        <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-emerald-800 text-[11px] uppercase tracking-wide">5-Day Reward Available!</p>
                          <p className="text-[10px] text-stone-500 leading-normal">Claim your loyalty choice on today's order!</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={redeemReward}
                          onChange={(e) => setRedeemReward(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {redeemReward && (
                      <div className="pt-2.5 border-t border-emerald-500/10 space-y-2 animate-fadeIn bg-white/40 p-2 rounded-lg">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Select Your Reward / اختر مكافأتك:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRedeemType('20_percent')}
                            className={`px-2.5 py-1.5 text-[10px] rounded-lg font-bold border transition duration-150 cursor-pointer text-center flex flex-col items-center justify-center ${
                              redeemType === '20_percent'
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                                : 'bg-transparent border-stone-300 text-stone-600 hover:bg-emerald-500/5'
                            }`}
                          >
                            <span>Flat 20% Off</span>
                            <span className="text-[8px] font-normal opacity-85">خصم 20% تلقائي</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRedeemType('free_item')}
                            className={`px-2.5 py-1.5 text-[10px] rounded-lg font-bold border transition duration-150 cursor-pointer text-center flex flex-col items-center justify-center ${
                              redeemType === 'free_item'
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                                : 'bg-transparent border-stone-300 text-stone-600 hover:bg-emerald-500/5'
                            }`}
                          >
                            <span>1 Free Product</span>
                            <span className="text-[8px] font-normal opacity-85">منتج مجاني بالكامل</span>
                          </button>
                        </div>
                        <p className="text-[9.5px] italic text-[#55331C] text-center">
                          {redeemType === '20_percent' 
                            ? `Save flat 20% off entire order sum (-SR ${Math.round(totalCartPriceSum * 0.2)})`
                            : `Makes the eligible VIP Loyalty Gift item in your cart completely FREE (-SR ${maxLoyaltyItemPrice})`
                          }
                        </p>

                        {redeemType === 'free_item' && (
                          <div className="pt-3 border-t border-emerald-500/10 space-y-2">
                            <p className="text-[10px] font-extrabold text-[#9C5D30] uppercase tracking-wider text-center">
                              🎁 Add 1 of your 3 Exclusive Free Gifts:
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {loyaltyRewardProductIds
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
                                      className={`p-2 rounded-xl border flex items-center justify-between text-left gap-2.5 bg-white transition ${
                                        isAlreadyInCart 
                                          ? 'border-emerald-500 bg-emerald-50/20' 
                                          : 'border-stone-200 hover:border-[#9C5D30]/40'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 select-none">
                                        <div className="w-8 h-8 rounded bg-[#FAF6F0] flex-shrink-0 flex items-center justify-center border border-[#E9DFCE]/50">
                                          <MenuImage
                                            itemId={prod.id}
                                            category={prod.category}
                                            className="w-7 h-7"
                                            image={prod.image}
                                          />
                                        </div>
                                        <div>
                                          <p className="text-[11px] font-bold text-neutral-800 leading-tight">
                                            {prod.nameEn}
                                          </p>
                                          <p className="text-[9px] text-stone-400 font-medium">
                                            Value: {prod.price} SR
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
                                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition font-mono ${
                                          isAlreadyInCart
                                            ? "bg-emerald-100 border border-emerald-300 text-emerald-700 hover:bg-emerald-200"
                                            : "bg-[#9C5D30] hover:bg-[#7D451B] text-white"
                                        }`}
                                      >
                                        {isAlreadyInCart ? "Added ✔" : "Add Free 🎁"}
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

                {/* Guarantee check info */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2 text-stone-700">
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <p className="text-[10.5px] leading-relaxed">
                    By submitting, your order is routed directly to the barista's live brewing console. Standard automated preparation timer commences instantly.
                  </p>
                </div>

                {/* Total price calculation summary footer */}
                <div className="pt-2 border-t border-slate-200 text-xs text-stone-700 space-y-1">
                  {redeemReward ? (
                    <>
                      <div className="flex justify-between">
                        <span className="font-serif">Original Subtotal:</span>
                        <span className="font-mono line-through">SR {totalCartPriceSum}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>
                          {redeemType === 'free_item' 
                            ? 'Free Product Reward Discount (100% off item):' 
                            : '5-Day Streak Discount (20% Off):'
                          }
                        </span>
                        <span className="font-mono">
                          - SR {redeemType === 'free_item' 
                            ? maxLoyaltyItemPrice 
                            : Math.round(totalCartPriceSum * 0.2)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pt-1 border-t border-dashed">
                        <span className="font-serif text-[#695843]">Net calculation:</span>
                        <span className="font-mono font-black text-[#9D5D30]">
                          SR {totalCartPriceSum - (redeemType === 'free_item' 
                            ? maxLoyaltyItemPrice 
                            : Math.round(totalCartPriceSum * 0.2))
                          }
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pt-1">
                      <span className="font-serif text-[#695843]">Sum total calculation:</span>
                      <span className="font-mono font-black text-[#9D5D30]">SR {totalCartPriceSum}</span>
                    </div>
                  )}
                </div>

                {/* Action Placement */}
                <button
                  type="submit"
                  disabled={isCheckoutLoading || cart.length === 0}
                  className="w-full bg-[#9C5D30] hover:bg-[#854E27] text-white py-3 font-serif uppercase font-black rounded-xl shadow-lg transition-all text-xs disabled:opacity-50 tracking-wider flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                >
                  {isCheckoutLoading ? (
                    <>⏳ COMMENCING BREW ORDER...</>
                  ) : (
                    <>✓ PLACE ORDER & COMMENCE TIMER</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- LIVE ORDER TRACKING OVERLAY / MODAL DIALOG --- */}
      {isTrackingOpen && activeOrderId && activeOrder && (
        <div className="fixed inset-0 bg-[#28160B]/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative flex flex-col text-[#3D2312] border border-[#ECDCC3] animate-fadeIn">
            
            {/* Top Close */}
            <div className="px-4 py-3 bg-amber-100/40 border-b border-amber-100 flex justify-between items-center">
              <span className="text-[10px] font-mono text-[#9C5D30] uppercase tracking-widest font-black">Iconic Coffee Live Tracker</span>
              <button 
                type="button" 
                onClick={() => setIsTrackingOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-200 text-stone-600 transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center justify-center space-y-5 text-center">
              
              {/* Order reference tag */}
              <div className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#9C5D30] font-mono text-xs font-black">
                ORDER ID: #{activeOrderId}
              </div>

              {/* Countdown block with aesthetic clock graphic */}
              {activeOrder.status === 'Awaiting Payment' ? (
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl w-full text-center space-y-2 animate-pulse my-2">
                  <div className="text-3xl font-mono font-black text-yellow-600">
                    SR {activeOrder.totalPrice}
                  </div>
                  <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-wider flex items-center justify-center gap-1">
                    💳 Waiting for Payment / بانتظار الدفع
                  </h4>
                  <p className="text-[11px] leading-relaxed text-[#3D2312] font-sans">
                    Please pay the cashier or waiter to confirm and prepare your order. / يرجى الدفع للنادل أو الكاشير لتأكيد الطلب وبدء التحضير.
                  </p>
                </div>
              ) : activeOrder.status !== 'Delivered' && countdownSeconds > 0 ? (
                <div className="space-y-1 my-2">
                  <div className="text-3xl font-mono font-semibold tracking-wider font-bold text-amber-700 animate-pulse">
                    {formatCountdown()}
                  </div>
                  <p className="text-[11px] text-[#A68F7A] font-serif uppercase tracking-widest font-black flex items-center justify-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-amber-600 animate-spin" /> ESTIMATED READY TIME
                  </p>
                </div>
              ) : activeOrder.status === 'Delivered' ? (
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-bounce shadow-lg shadow-green-200">
                  <Check className="w-10 h-10 text-white" />
                </div>
              ) : (
                <div className="space-y-1 my-2">
                  <div className="text-2xl font-mono font-black text-rose-600 animate-pulse">
                    NEARLY SERVED
                  </div>
                  <p className="text-[11px] text-[#A68F7A] font-serif uppercase tracking-widest font-black flex items-center justify-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-rose-500 animate-ping" /> Preparing final garnishment...
                  </p>
                </div>
              )}

              {/* Status Graphic Timeline */}
              <div className="w-full space-y-3.5 py-2">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pr-1">Preparation Milestone Steps</p>
                
                <div className="relative pl-6 space-y-4 text-left">
                  {/* Timeline connectors */}
                  <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[1.5px] bg-stone-300" />

                  {/* Stage Step 1 */}
                  <div className="relative flex items-start gap-3">
                    <div className={`absolute left-[-21px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shadow ${
                      ['Awaiting Payment', 'Pending', 'Preparing', 'Out for Table', 'Delivered'].includes(activeOrder.status)
                        ? 'bg-amber-600 border-amber-600 text-white text-[9px] font-mono font-bold'
                        : 'bg-stone-200 border-stone-200'
                    }`}>
                      ✓
                    </div>
                    <div>
                      <h5 className={`text-xs font-serif font-black ${
                        ['Awaiting Payment', 'Pending', 'Preparing', 'Out for Table', 'Delivered'].includes(activeOrder.status) ? 'text-neutral-800' : 'text-stone-400'
                      }`}>Order Placed in Queue</h5>
                      <p className="text-[10px] text-stone-500">Waiters mapped orders board at Table {activeOrder.tableNumber}</p>
                    </div>
                  </div>

                  {/* Stage Step 2 */}
                  <div className="relative flex items-start gap-3">
                    <div className={`absolute left-[-21px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shadow ${
                      ['Preparing', 'Out for Table', 'Delivered'].includes(activeOrder.status)
                        ? 'bg-blue-600 border-blue-600 text-white text-[9px] font-mono font-bold'
                        : activeOrder.status === 'Pending' ? 'bg-amber-200 border-amber-500 animate-pulse text-[9px]' : 'bg-stone-200 border-stone-200'
                    }`}>
                      {['Preparing', 'Out for Table', 'Delivered'].includes(activeOrder.status) ? '✓' : '●'}
                    </div>
                    <div>
                      <h5 className={`text-xs font-serif font-black ${
                        ['Preparing', 'Out for Table', 'Delivered'].includes(activeOrder.status) ? 'text-neutral-800' : 'text-stone-400'
                      }`}>Brewing & Baking / يتم التحضير</h5>
                      <p className="text-[10px] text-stone-500">Espresso shots extracting and pastries frosting cleanly</p>
                    </div>
                  </div>

                  {/* Stage Step 3 */}
                  <div className="relative flex items-start gap-3">
                    <div className={`absolute left-[-21px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shadow ${
                      ['Out for Table', 'Delivered'].includes(activeOrder.status)
                        ? 'bg-purple-600 border-purple-600 text-white text-[9px] font-mono font-bold'
                        : activeOrder.status === 'Preparing' ? 'bg-blue-200 border-blue-500 animate-pulse text-[9px]' : 'bg-stone-200 border-stone-200'
                    }`}>
                      {['Out for Table', 'Delivered'].includes(activeOrder.status) ? '✓' : '●'}
                    </div>
                    <div>
                      <h5 className={`text-xs font-serif font-black ${
                        ['Out for Table', 'Delivered'].includes(activeOrder.status) ? 'text-neutral-800' : 'text-stone-400'
                      }`}>On Its Way / في الطريق</h5>
                      <p className="text-[10px] text-stone-500">Waiter has collected standard tray. Running to Table {activeOrder.tableNumber}</p>
                    </div>
                  </div>

                  {/* Stage Step 4 */}
                  <div className="relative flex items-start gap-3">
                    <div className={`absolute left-[-21px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shadow ${
                      activeOrder.status === 'Delivered'
                        ? 'bg-green-600 border-green-600 text-white text-[9px] font-mono font-bold'
                        : activeOrder.status === 'Out for Table' ? 'bg-purple-100 border-purple-500 animate-pulse text-[9px]' : 'bg-stone-200 border-stone-200'
                    }`}>
                      {activeOrder.status === 'Delivered' ? '✓' : '●'}
                    </div>
                    <div>
                      <h5 className={`text-xs font-serif font-black ${
                        activeOrder.status === 'Delivered' ? 'text-emerald-700 font-bold' : 'text-stone-400'
                      }`}>Served with Love / جاهز بالكامل</h5>
                      <p className="text-[10px] text-stone-500">Delivered on your table! Enjoy your delicious coffee!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Alert banner (When order state becomes Delivered) */}
              {activeOrder.status === 'Delivered' && (
                <div className="p-3.5 bg-green-500/10 border border-green-400/30 rounded-2xl w-full text-center space-y-2 animate-fadeIn">
                  <h4 className="text-xs font-bold text-green-700">☕ Ah! Beautiful Choice!</h4>
                  <p className="text-[10.5px] leading-relaxed text-stone-700">
                    Your delicious treats have been recorded as **Delivered** from the administrative board logs. 
                  </p>
                  <button
                    type="button"
                    onClick={handleDismissTracking}
                    className="mt-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white uppercase text-[10px] font-bold rounded-lg tracking-wider"
                  >
                    Select New Treats
                  </button>
                </div>
              )}

              {/* Keep viewing button if prep work goes on */}
              {activeOrder.status !== 'Delivered' && (
                <button
                  type="button"
                  onClick={() => setIsTrackingOpen(false)}
                  className="w-full bg-stone-200 hover:bg-stone-300 text-[#3D2312] py-2.5 font-serif font-black text-xs rounded-xl tracking-wide transition-all"
                >
                  Minimize & Continue Menu Browsing
                </button>
              )}

              {/* Delete Active Order from browser memory */}
              <button 
                type="button"
                onClick={handleDismissTracking}
                className="text-[10px] text-red-650 opacity-60 hover:opacity-100 font-medium font-mono"
              >
                Clear reference from local memory
              </button>

            </div>

            {/* Quick footer */}
            <div className="p-3 bg-stone-100 border-t border-stone-200 text-center text-[9px] text-[#A68F7A] font-mono">
              REAL-TIME WAITER ENGINE LIVE. FOR QUESTIONS CALL +96650XXXXXX
            </div>

          </div>
        </div>
      )}

      {/* Footer copyright and credit info */}
      <footer className="bg-white py-6 border-t border-[#F1E8DC] text-center text-xs text-[#A68F7A] space-y-1 font-serif mt-auto">
        <p className="font-semibold text-[#8C765C]">☕ Iconic Coffee</p>
        <p className="text-[10px]">Premium Quality Beans & Fresh Bakery. Est. 2024</p>
        <p className="text-[11px] font-mono text-stone-500 pt-3 flex items-center justify-center gap-1">
          Developed by{' '}
          <a
            href="https://www.facebook.com/rabiulhasan.2001"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9C5D30] hover:underline font-bold"
          >
            Rabiul Rami
          </a>
        </p>
      </footer>

    </div>
  );
}
