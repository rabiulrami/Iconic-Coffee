/**
 * Ask a hosted image for the size we actually paint.
 *
 * Product photos are uploaded straight from a phone camera, so the originals are
 * multi-megabyte PNGs — and they get painted into an 84px circle. Cloudinary can
 * resize and re-encode from the URL, which takes a 1 MB PNG down to about 5 KB of
 * WebP without touching the stored file, so nothing has to be re-uploaded or migrated.
 *
 * Anything that is not a Cloudinary URL is returned untouched.
 */

const CLOUDINARY_UPLOAD = '/image/upload/';

/** Transformation chain: modern format, automatic quality, capped width. */
const transform = (width: number) => `f_auto,q_auto,c_limit,w_${width}`;

export function optimizedImage(url: string | undefined, width: number): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes(CLOUDINARY_UPLOAD)) return url;

  const [base, rest] = url.split(CLOUDINARY_UPLOAD);
  if (!rest) return url;

  // Don't stack transformations if a URL already carries one (it starts with a
  // segment of comma-separated `k_v` pairs before the version).
  if (/^[a-z]{1,3}_[^/]*\//.test(rest)) return url;

  return `${base}${CLOUDINARY_UPLOAD}${transform(width)}/${rest}`;
}

/**
 * Downscale a picked file in the browser before it is uploaded.
 *
 * Phone cameras produce 3–5 MB images that end up painted at 84px. Shrinking here
 * keeps multi-megabyte originals out of storage in the first place, rather than
 * relying on delivery-time transforms to paper over them.
 */
export function downscaleImage(file: File, maxEdge = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image.'));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        // Already small enough — keep the original bytes rather than re-encoding.
        if (scale === 1) return resolve(String(reader.result));

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** Widths that match where images are painted, at roughly 3x for dense screens. */
export const IMG = {
  /** 84px product circle in the catalogue grid, 76px in the specials rail. */
  thumb: 256,
  /** 44px cart row and 36px reward-picker thumbnails. */
  small: 128,
  /** Wide promo artwork, painted at 268px. */
  banner: 800,
} as const;
