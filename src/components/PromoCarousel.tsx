import React, { useState } from 'react';
import { PROMO_BANNERS, PromoBanner } from '../data';

interface PromoCarouselProps {
  /** Applies the banner's menu filter and jumps to the products. */
  onSelectCategory: (categoryId: string) => void;
}

/**
 * Continuously scrolling showcase of the branded category artwork.
 *
 * The track holds the banner list twice and slides exactly one copy's width before
 * looping, so the seam is invisible and the motion never resets visibly. Touching or
 * hovering pauses it; `prefers-reduced-motion` stops it entirely and leaves the strip
 * as a normal swipeable rail.
 */
export default function PromoCarousel({ onSelectCategory }: PromoCarouselProps) {
  const [paused, setPaused] = useState(false);
  const [broken, setBroken] = useState<string[]>([]);

  // A banner whose artwork is missing is dropped rather than shown as an empty box.
  const banners = PROMO_BANNERS.filter((b) => !broken.includes(b.slug));
  if (banners.length === 0) return null;

  const renderBanner = (banner: PromoBanner, copy: number) => (
    <button
      key={`${banner.slug}-${copy}`}
      type="button"
      onClick={() => onSelectCategory(banner.category)}
      // The second copy exists only to make the loop seamless.
      aria-hidden={copy === 1}
      tabIndex={copy === 1 ? -1 : 0}
      aria-label={`Browse ${banner.label}`}
      className="relative shrink-0 w-[268px] aspect-[3/2] rounded-2xl overflow-hidden ring-1 ring-line bg-paper-2 cursor-pointer transition-transform duration-200 active:scale-[0.98] hover:ring-accent/40"
    >
      <img
        src={banner.image}
        alt={banner.label}
        loading="lazy"
        draggable={false}
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          if (el.src !== banner.imageFallback) {
            el.src = banner.imageFallback;
          } else {
            setBroken((prev) => prev.includes(banner.slug) ? prev : [...prev, banner.slug]);
          }
        }}
        className="w-full h-full object-cover"
      />
    </button>
  );

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
        className="promo-marquee pb-5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div
          className="promo-marquee-track"
          style={{
            animationDuration: `${banners.length * 5}s`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {banners.map((b) => renderBanner(b, 0))}
          {banners.map((b) => renderBanner(b, 1))}
        </div>
      </div>
    </section>
  );
}
