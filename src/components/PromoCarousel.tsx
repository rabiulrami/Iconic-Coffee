import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CATEGORIES, PROMO_BANNERS, PromoBanner } from '../data';

interface PromoCarouselProps {
  /** Applies the banner's menu filter and jumps to the products. */
  onSelectCategory: (categoryId: string) => void;
}

const AUTOPLAY_MS = 3800;
/** How long to leave autoplay alone after the customer swipes or drags. */
const RESUME_AFTER_MS = 6000;

/**
 * Auto-advancing showcase of the branded category artwork.
 *
 * Advances one card at a time and can still be swiped by hand; a manual swipe
 * suspends autoplay briefly, then it picks up again from wherever the customer
 * left it. Every banner always renders — where the wide artwork is missing the tile
 * falls back to that category's square photo with the name laid over it, so the card
 * is complete on first paint and can never collapse to nothing.
 */
export default function PromoCarousel({ onSelectCategory }: PromoCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Slugs whose wide artwork failed both the bundled path and the CDN copy.
  const [noArtwork, setNoArtwork] = useState<string[]>([]);
  // Admin-managed cards. Null until the fetch settles, so the bundled set shows first
  // and the card never flashes empty; an empty array means the admin cleared them all
  // and we fall back to the bundled banners rather than showing nothing.
  const [managed, setManaged] = useState<PromoBanner[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/promos')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows: any[]) => {
        if (cancelled || !Array.isArray(rows) || rows.length === 0) return;
        setManaged(rows.map((r) => ({
          slug: r.id,
          label: r.label || '',
          category: r.category || '',
          image: r.image,
          // Admin uploads are already absolute Supabase URLs, so there is nothing
          // further to fall back to.
          imageFallback: r.image,
        })));
      })
      .catch(() => { /* keep the bundled banners */ });
    return () => { cancelled = true; };
  }, []);
  // Set while the customer is interacting; cleared RESUME_AFTER_MS after they stop.
  const [suspended, setSuspended] = useState(false);
  const resumeTimer = useRef<number | null>(null);

  const banners = managed && managed.length > 0 ? managed : PROMO_BANNERS;
  const count = banners.length;

  const scrollToIndex = useCallback((i: number, smooth = true) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.children[0]?.children[i] as HTMLElement | undefined;
    if (!card) return;
    rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Hold autoplay off while the customer is driving, then hand it back.
  const suspendAutoplay = useCallback(() => {
    setSuspended(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setSuspended(false), RESUME_AFTER_MS);
  }, []);

  useEffect(() => () => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
  }, []);

  // Autoplay. Only reduced-motion opts out.
  //
  // Deliberately not gated on document.hidden: this menu runs inside an iframe wrapper
  // and is opened from a QR code in in-app webviews, and those contexts can report
  // hidden for the whole session — which would leave the carousel frozen on card one
  // for every customer. Browsers already throttle timers in background tabs, and an
  // idle scroll costs nothing, so the guard bought little and risked a lot.
  useEffect(() => {
    if (suspended) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % count;
        scrollToIndex(next);
        return next;
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [suspended, count, scrollToIndex]);

  // Keep the dots honest when the customer swipes by hand.
  const handleScroll = () => {
    const rail = railRef.current;
    if (!rail) return;
    const track = rail.children[0] as HTMLElement | undefined;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const mid = rail.scrollLeft + rail.clientWidth / 2;
    let closest = 0;
    let best = Infinity;
    cards.forEach((c, i) => {
      const centre = c.offsetLeft - rail.offsetLeft + c.offsetWidth / 2;
      const d = Math.abs(centre - mid);
      if (d < best) { best = d; closest = i; }
    });
    setIndex(closest);
  };

  const renderTile = (banner: PromoBanner) => {
    const usingFallback = noArtwork.includes(banner.slug);
    const category = CATEGORIES.find((c) => c.id === banner.category);

    return (
      <button
        key={banner.slug}
        type="button"
        // An admin card may be a pure announcement with no category behind it.
        onClick={() => { if (banner.category) onSelectCategory(banner.category); }}
        aria-label={banner.category ? `Browse ${banner.label}` : banner.label}
        className={`relative shrink-0 snap-center w-[268px] aspect-[3/2] rounded-2xl overflow-hidden ring-1 ring-line bg-paper-2 transition-transform duration-200 ${
          banner.category ? 'cursor-pointer active:scale-[0.98] hover:ring-accent/40' : 'cursor-default'
        }`}
      >
        <img
          src={usingFallback ? (category?.image ?? banner.image) : banner.image}
          alt={banner.label}
          loading="lazy"
          draggable={false}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            if (!usingFallback && el.src !== banner.imageFallback) {
              el.src = banner.imageFallback;                  // try the CDN copy
            } else if (!usingFallback) {
              setNoArtwork((prev) => [...prev, banner.slug]); // fall back to the square shot
            } else if (category && el.src !== category.imageFallback) {
              el.src = category.imageFallback;
            }
          }}
          className="w-full h-full object-cover"
        />

        {/* The real banners carry their own lettering; only the fallback needs a label. */}
        {usingFallback && (
          <>
            <span className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/25 to-transparent" />
            <span className="absolute left-4 bottom-3.5 right-4 text-left">
              <span className="block font-serif text-[19px] leading-tight font-semibold text-cream drop-shadow">
                {banner.label}
              </span>
              {category && (
                <span className="block text-[11px] text-cream-muted font-serif mt-0.5">{category.nameAr}</span>
              )}
            </span>
          </>
        )}
      </button>
    );
  };

  return (
    <section className="bg-card rounded-2xl border border-line shadow-soft overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-serif text-[20px] leading-tight font-semibold text-ink">The Iconic Range</h3>
          <p className="text-[11.5px] text-muted font-sans mt-0.5">Tap any one to jump straight to it</p>
        </div>
        <span className="text-[13px] text-faint font-serif shrink-0">تشكيلتنا</span>
      </div>

      <div
        ref={railRef}
        onScroll={handleScroll}
        onPointerDown={suspendAutoplay}
        onTouchStart={suspendAutoplay}
        onWheel={suspendAutoplay}
        onMouseEnter={() => setSuspended(true)}
        onMouseLeave={suspendAutoplay}
        className="overflow-x-auto scrollbar-none snap-x snap-mandatory"
      >
        <div className="flex gap-3 px-5 w-max">
          {banners.map(renderTile)}
        </div>
      </div>

      {/* Position dots double as jump targets */}
      <div className="flex items-center justify-center gap-1.5 py-3.5">
        {banners.map((b, i) => (
          <button
            key={b.slug}
            type="button"
            aria-label={`Show ${b.label}`}
            aria-current={i === index}
            onClick={() => { suspendAutoplay(); setIndex(i); scrollToIndex(i); }}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === index ? 'w-5 bg-accent' : 'w-1.5 bg-line hover:bg-faint'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
