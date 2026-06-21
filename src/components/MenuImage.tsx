import React from 'react';

interface MenuImageProps {
  itemId: string;
  category: string;
  className?: string;
  image?: string;
}

export default function MenuImage({ itemId, category, className = "w-16 h-16", image }: MenuImageProps) {
  // Check if image or itemId looks like an image URL, path, or Base64 string
  const isUrl = (str?: string) => {
    if (!str) return false;
    return str.startsWith('http') || str.startsWith('/') || str.includes('.') || str.includes('data:image');
  };

  const REALISTIC_IMAGE_MAP: Record<string, string> = {
    // Exact photographic matches to user screenshots
    'sugar_boba': 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?q=80&w=400', 
    'milk_tea_boba': 'https://images.unsplash.com/photo-1627998794066-5a740b7d9835?q=80&w=400',
    'taro_boba': 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?q=80&w=400', // Uses identical caramelized cup in screenshot
    'matcha_boba': 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=400', // Sliced lime rustic matcha shake
    'choc_boba': 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?q=80&w=400', // Caramelized cup match
    'mocha_frappe_boba': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=400' // Red Apple match as shown in screenshot!
  };

  const mappedImage = image && REALISTIC_IMAGE_MAP[image] ? REALISTIC_IMAGE_MAP[image] : null;

  const imageSrc = mappedImage || (isUrl(image) ? image : (isUrl(itemId) ? itemId : null));

  if (imageSrc) {
    return (
      <div className={`relative ${className} flex items-center justify-center overflow-hidden rounded-full bg-[#FAF6F0]`}>
        <img 
          src={imageSrc} 
          alt="" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // fallback if custom URL is broken
            (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=150";
          }}
        />
      </div>
    );
  }

  // Return gorgeous procedural decorative CSS cups, plates, and glasses based on names
  
  // 1. Boba drinks
  if (category === 'boba') {
    let accentColor = "bg-amber-800"; // Sugar caramelized
    let milkColor = "bg-amber-100";
    let fruits = null;

    if (itemId.includes('sugar')) {
      accentColor = "bg-amber-900";
      milkColor = "bg-amber-100/90";
    } else if (itemId.includes('milk_tea')) {
      accentColor = "bg-orange-850/30";
      milkColor = "bg-[#f1ded2]";
    } else if (itemId.includes('taro')) {
      accentColor = "bg-purple-400";
      milkColor = "bg-purple-100";
    } else if (itemId.includes('matcha')) {
      accentColor = "bg-emerald-600";
      milkColor = "bg-emerald-50";
    } else if (itemId.includes('choc')) {
      accentColor = "bg-amber-950";
      milkColor = "bg-amber-900/40";
    } else if (itemId.includes('moch')) {
      accentColor = "bg-amber-950";
      milkColor = "bg-[#e5d4cb]";
    } else if (itemId.includes('oreo')) {
      accentColor = "bg-slate-800";
      milkColor = "bg-slate-200";
    } else if (itemId.includes('straw')) {
      accentColor = "bg-red-500";
      milkColor = "bg-red-100";
      fruits = <div className="absolute top-1/2 left-3 w-1.5 h-1.5 rounded-full bg-red-600/70" />;
    } else if (itemId.includes('coconut')) {
      accentColor = "bg-zinc-300";
      milkColor = "bg-zinc-50";
    } else if (itemId.includes('pist')) {
      accentColor = "bg-emerald-500";
      milkColor = "bg-emerald-100";
    } else if (itemId.includes('caramel')) {
      accentColor = "bg-amber-600";
      milkColor = "bg-amber-100";
    } else if (itemId.includes('mango')) {
      accentColor = "bg-yellow-500";
      milkColor = "bg-yellow-100";
    }

    return (
      <div className={`relative ${className} flex items-center justify-center`}>
        {/* Cup outline */}
        <div className="absolute w-[76%] h-[84%] bg-white/40 border border-[#b29e84]/30 rounded-b-2xl rounded-t-lg shadow-inner overflow-hidden flex flex-col justify-end">
          {/* Liquid background */}
          <div className={`w-full h-full ${milkColor} relative flex flex-col justify-end overflow-hidden`}>
            {/* Shaded swirls */}
            <div className={`absolute top-0 w-full h-[60%] ${accentColor} opacity-20 blur-[3px] rounded-full transform -translate-y-4`} />
            <div className="absolute bottom-0 w-full h-1/2 bg-amber-950/20" />
            
            {/* Boba pearls */}
            <div className="absolute bottom-1.5 left-2.5 w-2 h-2 rounded-full bg-neutral-900 shadow" />
            <div className="absolute bottom-1 left-4.5 w-2.5 h-2.5 rounded-full bg-zinc-950 shadow" />
            <div className="absolute bottom-2 left-6.5 w-2 h-2 rounded-full bg-neutral-950 shadow" />
            <div className="absolute bottom-1 right-3 w-2 h-2 rounded-full bg-neutral-900 shadow" />
            <div className="absolute bottom-3 left-4 w-2 h-2 rounded-full bg-neutral-900 shadow opacity-80" />
            <div className="absolute bottom-2.5 right-4 w-1.5 h-1.5 rounded-full bg-neutral-950 shadow opacity-90" />
            
            {fruits}
          </div>
        </div>
        {/* Cap dome */}
        <div className="absolute top-[8%] w-[68%] h-[12%] bg-white/60 rounded-t-full border border-white/40" />
        {/* Boba Straw */}
        <div className="absolute top-0 right-1/3 w-2 h-[82%] bg-[#9C5D30]/60 rounded-full transform rotate-6 shadow-inner" />
      </div>
    );
  }

  // 2. Sweet / pastries
  if (category === 'sweet') {
    let frostingColor = "bg-amber-100";
    let baseColor = "bg-amber-800";
    let toppings = null;

    if (itemId.includes('khalat')) {
      // Hexagonal rolls / honey buns
      return (
        <div className={`relative ${className} flex items-center justify-center`}>
          <div className="w-[84%] h-[84%] rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <div className="relative w-[74%] h-[74%] rounded-full bg-amber-300 shadow-inner overflow-hidden flex flex-wrap justify-center items-center p-1 border border-amber-400">
              <div className="w-4 h-4 rounded-full bg-amber-500 border border-amber-600 shadow shadow-amber-900/30 font-semibold" />
              <div className="w-5 h-5 rounded-full bg-amber-500 border border-amber-600 shadow shadow-amber-900/30 font-semibold mx-0.5" />
              <div className="w-4 h-4 rounded-full bg-amber-500 border border-amber-600 shadow shadow-amber-900/30 font-semibold" />
              <div className="w-4 h-4 rounded-full bg-amber-500 border border-amber-600 shadow shadow-amber-900/30 font-semibold mt-0.5" />
              {/* Honey glaze shine */}
              <div className="absolute top-1 left-2 w-6 h-1.5 rounded-full bg-white/50 transform -rotate-12 blur-[1px]" />
            </div>
          </div>
        </div>
      );
    } else if (itemId.includes('san_seb')) {
      frostingColor = "bg-[#45271a]"; // burnt Basque crust
      baseColor = "bg-[#fcf8ed]"; // custard core
      return (
        <div className={`relative ${className} flex items-center justify-center`}>
          {/* Plate */}
          <div className="absolute w-[86%] h-[86%] rounded-full bg-white border border-slate-200/50 shadow flex items-center justify-center">
            {/* Cake Slice Wedge */}
            <div className="w-[66%] h-[66%] relative flex items-center justify-center overflow-hidden">
              <div className="w-0 h-0 border-l-[22 px] border-l-transparent border-r-[22px] border-r-transparent border-b-[44px] border-b-[#fdfaf2] shadow-inner" />
              {/* Burnt basque layer */}
              <div className="absolute top-[32%] w-7 h-5 rounded-lg bg-[#422112] border-t border-amber-800 transform rotate-12 flex items-center justify-center">
                <div className="w-4.5 h-1 bg-[#fff]/10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      );
    } else if (itemId.includes('cheese') || itemId.includes('cake')) {
      let cover = "bg-amber-600"; // caramel/honey
      if (itemId.includes('blue')) cover = "bg-indigo-900"; // blueberry
      if (itemId.includes('saffron')) cover = "bg-orange-500"; // saffron milk

      return (
        <div className={`relative ${className} flex items-center justify-center`}>
          <div className="absolute w-[80%] h-[80%] bg-amber-100 rounded-lg shadow border border-amber-900/10 overflow-hidden flex flex-col justify-end">
            <div className="flex-1 w-full bg-amber-50" />
            <div className={`w-full h-1/2 ${cover} relative`}>
              {/* Cream swirls */}
              <div className="absolute -top-1 left-2 w-3 h-3 rounded-full bg-[#fdfdfc]" />
              <div className="absolute -top-1.5 left-5 w-4 h-3 rounded-full bg-[#fdfdfc]" />
            </div>
            <div className="w-full h-1.5 bg-amber-850" /> {/* pie crust */}
          </div>
        </div>
      );
    } else if (itemId.includes('cookie')) {
      return (
        <div className={`relative ${className} flex items-center justify-center`}>
          {/* Rounded cookie with cracks */}
          <div className="w-[78%] h-[78%] rounded-full bg-amber-200 border-2 border-amber-300 shadow-inner relative overflow-hidden flex flex-wrap justify-center items-center">
            {/* Chocolate chips */}
            <div className="absolute top-2 left-4 w-2.5 h-2.5 rounded-full bg-[#3e2312]" />
            <div className="absolute top-5 left-2.5 w-2 h-2 rounded-full bg-[#3e2312]" />
            <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#2a170a]" />
            <div className="absolute bottom-2.5 left-5 w-2 h-2 rounded-full bg-[#3e2312]" />
            <div className="absolute bottom-5 right-3.5 w-3 h-3 rounded-full bg-[#2a170a]" />
            {/* Chocolate melting glow */}
            <div className="absolute top-1 right-2.5 w-1 h-3 rounded bg-white/30 transform rotate-12" />
          </div>
        </div>
      );
    } else if (itemId.includes('waffle') || itemId.includes('crepe') || itemId.includes('fett')) {
      let drizzleColor = "border-amber-950";
      if (itemId.includes('kinder')) drizzleColor = "border-amber-700";
      if (itemId.includes('pistachio')) drizzleColor = "border-emerald-600";

      return (
        <div className={`relative ${className} flex items-center justify-center`}>
          {/* Plate */}
          <div className="w-[84%] h-[84%] rounded-full bg-white border border-stone-200/40 shadow-md p-1 flex items-center justify-center">
            {/* Grid waffle base */}
            <div className="w-[84%] h-[84%] rounded-lg bg-orange-250 border-2 border-orange-300/60 relative overflow-hidden flex items-center justify-center">
              {/* Waffle checks */}
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full p-1 opacity-70">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-orange-400 bg-orange-100/30 rounded" />
                ))}
              </div>
              {/* Drizzle lines overlay */}
              <div className={`absolute inset-1 border-b-2 border-r-2 ${drizzleColor} opacity-80 transform -rotate-12`} />
              <div className={`absolute inset-1 border-t-2 border-l-2 ${drizzleColor} opacity-80 transform rotate-45`} />
            </div>
          </div>
        </div>
      );
    } else if (itemId.includes('pancake')) {
      return (
        <div className={`relative ${className} flex items-center justify-center`}>
          <div className="w-[84%] h-[84%] rounded-full bg-amber-50/10 flex items-center justify-center relative">
            {/* 3 stacked mini circles */}
            <div className="absolute bottom-1 w-8 h-8 rounded-full bg-amber-300 border border-amber-400" />
            <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-amber-300 border border-amber-400 shadow-sm" />
            <div className="absolute top-1.5 right-1 w-7 h-7 rounded-full bg-amber-400 border border-amber-500 shadow-sm flex items-center justify-center">
              {/* butter melting */}
              <div className="w-2.5 h-2.5 rounded bg-yellow-300" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className} flex items-center justify-center`}>
        <div className="w-[80%] h-[80%] rounded-xl bg-orange-100 border border-amber-200 flex items-center justify-center text-4xl">
          🍰
        </div>
      </div>
    );
  }

  // 3. Specials / Premium Cocktails
  if (category === 'specials') {
    let accentGradient = "from-amber-100 to-emerald-50";
    let fluidLayer = <div className="w-full h-[60%] bg-emerald-500/40 rounded-b-xl" />;
    
    if (itemId.includes('pistachio')) {
      // Pistachio Rose
      accentGradient = "from-emerald-100 via-stone-50 to-pink-50";
      fluidLayer = (
        <div className="w-full h-[68%] bg-emerald-800/20 relative flex flex-col justify-end">
          {/* Rose foam */}
          <div className="absolute top-0 w-full h-4 bg-pink-300/40 rounded-full blur-[1px]" />
          {/* Petals */}
          <div className="absolute top-1/3 left-4 w-1.5 h-1.5 rounded-full bg-pink-500/80 animate-pulse" />
          <div className="absolute top-1/2 right-4 w-1 h-1.5 rounded-full bg-pink-500/80" />
          {/* Pistachio cream body */}
          <div className="w-full h-full bg-[#daeed6] opacity-90" />
        </div>
      );
    } else if (itemId.includes('sugar')) {
      // Brown Sugar Frappe
      accentGradient = "from-amber-200 via-amber-100 to-amber-300";
      fluidLayer = (
        <div className="w-full h-[76%] bg-amber-950/25 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900 to-yellow-100 opacity-80" />
          {/* Boba pearls */}
          <div className="absolute bottom-1 w-full flex justify-around px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-950 block shadow" />
            <span className="w-3 h-3 rounded-full bg-zinc-950 block shadow" />
            <span className="w-2 h-2 rounded-full bg-zinc-950 block shadow" />
          </div>
        </div>
      );
    } else if (itemId.includes('saffron')) {
      // Saffron Honey
      accentGradient = "from-amber-50 to-orange-100";
      fluidLayer = (
        <div className="w-full h-[68%] bg-yellow-500/20 relative flex flex-col justify-end">
          {/* Milk layering */}
          <div className="w-full h-[88%] bg-amber-100/70 relative">
            {/* saffron strands */}
            <div className="absolute top-1 left-3 w-3 h-[0.5px] bg-red-600 transform rotate-45" />
            <div className="absolute top-2 right-4 w-2 h-[0.5px] bg-red-600" />
            <div className="absolute top-1.5 left-1/2 w-4 h-[0.5px] bg-orange-600 transform -rotate-12" />
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className} flex items-center justify-center rounded-full bg-gradient-to-tr ${accentGradient} p-1 border-2 border-amber-300/40 shadow-inner`}>
        {/* Glass cup */}
        <div className="w-[72%] h-[82%] border border-white/60 rounded-b-2xl rounded-t shadow flex flex-col justify-end overflow-hidden">
          {fluidLayer}
        </div>
        {/* Straw */}
        <div className="absolute top-0 right-1/4 w-1.5 h-[50%] bg-[#9C5D30]/60 rounded transform rotate-12" />
      </div>
    );
  }

  // 4. Hot of all kinds
  if (category === 'hot') {
    let cupColor = "bg-amber-800/80";
    let liquidColor = "bg-[#3e2417]";
    let features = null;

    if (itemId.includes('turkish')) {
      cupColor = "bg-sky-900/60";
      liquidColor = "bg-neutral-800";
    } else if (itemId.includes('latte') || itemId.includes('cappuccino') || itemId.includes('flat')) {
      cupColor = "bg-[#bda18e]/35";
      liquidColor = "bg-[#805e46]";
      // Latte-art heart
      features = (
        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-[#e8dbcc] rounded-full flex justify-center items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#805e46]" />
        </div>
      );
    } else if (itemId.includes('matcha')) {
      cupColor = "bg-emerald-950";
      liquidColor = "bg-emerald-600";
    } else if (itemId.includes('arabic')) {
      // Return beautiful Arabic Flask (Dallah) icon layout
      return (
        <div className={`relative ${className} flex items-center justify-center`}>
          <div className="w-[84%] h-[84%] relative flex flex-col items-center justify-center">
            {/* Spout */}
            <div className="absolute left-[20%] top-[40%] w-4 h-3 bg-amber-500 transform -rotate-45 clip-triangle" />
            {/* Handle */}
            <div className="absolute right-[16%] top-[34%] w-3 h-8 border-2 border-amber-500 rounded-tr-lg rounded-br-lg" />
            {/* Flask lid */}
            <div className="w-4 h-3 bg-amber-400 rounded-t-lg border-b border-amber-600" />
            {/* Dallah main body */}
            <div className="w-[52%] h-[60%] bg-amber-500 rounded-lg flex flex-col items-center justify-between py-1 border border-amber-600 shadow-md">
              <div className="w-full h-1 bg-red-650" />
              <div className="w-1.5 h-2 rounded-full bg-emerald-700/80" />
              <div className="w-full h-1 bg-red-650" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className} flex flex-col items-center justify-center`}>
        {/* Steam */}
        <div className="flex gap-1 mb-0.5 h-3 opacity-60">
          <span className="w-[1.5px] h-2 bg-slate-400 rounded animate-bounce delay-100" />
          <span className="w-[1.5px] h-3 bg-slate-400 rounded animate-bounce delay-200" />
          <span className="w-[1.5px] h-2 bg-slate-400 rounded animate-bounce delay-300" />
        </div>
        {/* Cup */}
        <div className={`relative w-[68%] h-[56%] ${cupColor} rounded-b-2xl border-x border-b border-white/20 shadow flex justify-center`}>
          {/* Liquid level */}
          <div className={`absolute top-0.5 w-[90%] h-3 ${liquidColor} rounded-full overflow-hidden`}>
            {features}
          </div>
          {/* Handle */}
          <div className="absolute right-[-24%] top-1/4 w-3.5 h-6 border-2 border-stone-400/40 rounded-r-lg" />
        </div>
        {/* Saucer */}
        <div className="w-[82%] h-1.5 bg-stone-300/50 rounded-full mt-0.5" />
      </div>
    );
  }

  // 5. Cold / Shakes / Juices
  let beverageColor = "bg-amber-100";
  let layerDetails = null;

  if (category === 'juice') {
    beverageColor = "bg-yellow-400";
    if (itemId.includes('strawberry')) beverageColor = "bg-red-400";
    if (itemId.includes('blue')) beverageColor = "bg-blue-500";
    if (itemId.includes('passion')) {
      beverageColor = "bg-yellow-500";
      layerDetails = <span className="absolute top-1/3 left-4 w-1.5 h-1.5 rounded-full bg-black/60" />;
    }
  } else if (category === 'matcha') {
    beverageColor = "bg-emerald-500";
    if (itemId.includes('shake')) {
      if (itemId.includes('lotus')) beverageColor = "bg-orange-100";
      if (itemId.includes('nutella')) beverageColor = "bg-amber-900";
      if (itemId.includes('oreo')) beverageColor = "bg-neutral-800";
    }
  } else if (category === 'cold') {
    beverageColor = "bg-amber-800/10";
    if (itemId.includes('americano')) beverageColor = "bg-neutral-900";
    if (itemId.includes('hibiscus')) beverageColor = "bg-red-850";
    if (itemId.includes('water')) beverageColor = "bg-sky-100";
  }

  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      {/* Tall cold glass */}
      <div className="w-[66%] h-[84%] border border-slate-300/40 rounded-b-xl rounded-t-sm shadow-sm p-[1.5px] flex flex-col justify-end overflow-hidden bg-white/20">
        <div className={`w-full h-5/6 ${beverageColor} rounded-b-lg relative overflow-hidden`}>
          {/* Ice cubes inside */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-white/40 rounded-sm transform rotate-45" />
          <div className="absolute top-6 right-3.5 w-1.5 h-1.5 bg-white/40 rounded-sm transform rotate-12" />
          {layerDetails}
        </div>
      </div>
      {/* Straw */}
      <div className="absolute top-0 right-1/4 w-1 h-[70%] bg-[#bda18e] rounded transform rotate-12" />
    </div>
  );
}
