import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES, PROMO_BANNERS, PromoBanner } from '../data';

interface PromoCarouselProps {
  /** Applies the banner's menu filter and jumps to the products. */
  onSelectCategory: (categoryId: string) => void;
}

/**
 * Swipeable showcase of the branded category artwork.
 *
 * Every banner always renders. Where the wide artwork is missing the tile falls back
 * to that category's square photo with the name laid over it, so the card is complete
 * from the first paint instead of flashing in and collapsing as images fail. Dropping
 * a file into public/banners/ upgrades its tile with no code change.
 */
export default function PromoCarousel({ onSelectCategory }: PromoCarouselProps) {
  // Slugs whose wide artwork failed both the bundled path and the CDN copy.
  const [noArtwork, setNoArtwork] = useState<string[]>([]);

  const renderTile = (banner: PromoBanner) => {
    const usingFallback = noArtwork.includes(banner.slug);
    const category = CATEGORIES.find((c) => c.id === banner.category);

    return (
      <button
        key={banner.slug}
        type="button"
        onClick={() => onSelectCategory(banner.category)}
        aria-label={`Browse ${banner.label}`}
        className="relative shrink-0 snap-start w-[268px] aspect-[3/2] rounded-2xl overflow-hidden ring-1 ring-line bg-paper-2 cursor-pointer transition-transform duration-200 active:scale-[0.98] hover:ring-accent/40"
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
          <p className="text-[11.5px] text-muted font-sans mt-0.5 flex items-center gap-1">
            Swipe, then tap to jump
            <ArrowRight className="w-3 h-3 text-accent" strokeWidth={1.8} />
          </p>
        </div>
        <span className="text-[13px] text-faint font-serif shrink-0">تشكيلتنا</span>
      </div>

      <div className="overflow-x-auto scrollbar-none snap-x snap-mandatory pb-5">
        <div className="flex gap-3 px-5 w-max">
          {PROMO_BANNERS.map(renderTile)}
        </div>
      </div>
    </section>
  );
}
