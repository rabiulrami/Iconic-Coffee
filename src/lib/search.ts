import { CATEGORIES, MenuItem } from '../data';

/**
 * Typo-tolerant menu search.
 *
 * Customers type from memory and on phone keyboards, so "baba", "juce" and "mocca"
 * all have to land on the right drink. Matching runs on normalised text and falls
 * back to bounded edit distance when nothing matches literally.
 */

const ARABIC_HARAKAT = /[ً-ْٰـ]/g;

/**
 * Fold text to a comparable form: case, Latin accents, Arabic vowel marks and the
 * interchangeable Arabic letter shapes all collapse, and punctuation becomes spaces.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')            // é -> e
    .replace(ARABIC_HARAKAT, '')                // drop harakat and tatweel
    .replace(/[آأإٱ]/g, 'ا') // آ إ أ -> ا
    .replace(/ة/g, 'ه')               // ة -> ه
    .replace(/ى/g, 'ي')               // ى -> ي
    .replace(/[^a-z0-9؀-ۿ]+/g, ' ')
    .trim();
}

/**
 * Optimal string alignment distance, abandoned as soon as it exceeds `max`.
 *
 * This counts a swap of two neighbouring letters as one edit rather than two, which
 * plain Levenshtein does not. Transposition is the most common phone-keyboard typo —
 * without it "jucie" never reaches "juice" at any sane tolerance.
 */
function boundedEditDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prevPrev = new Array<number>(b.length + 1).fill(0);
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowBest = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      // Adjacent transposition: "ie" <-> "ei" costs one edit, not two.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prevPrev[j - 2] + 1);
      }
      curr[j] = v;
      if (v < rowBest) rowBest = v;
    }
    if (rowBest > max) return max + 1;         // whole row already too far
    const spare = prevPrev;
    prevPrev = prev;
    prev = curr;
    curr = spare;
  }
  return prev[b.length];
}

/** How many typos to forgive at a given word length. Short words get no slack, or
 *  "hot" would match "hat" and every three-letter word collides. */
function tolerance(length: number): number {
  if (length <= 3) return 0;
  if (length <= 5) return 1;
  if (length <= 8) return 2;
  return 3;
}

/** 0 when the token does not match this text at all, higher is better. */
function scoreToken(token: string, text: string): number {
  if (!text) return 0;
  if (text === token) return 1;
  if (text.startsWith(token)) return 0.95;
  if (text.includes(token)) return 0.85;

  const words = text.split(' ');
  let best = 0;
  for (const word of words) {
    if (!word) continue;
    if (word === token) { best = Math.max(best, 1); continue; }
    if (word.startsWith(token)) { best = Math.max(best, 0.9); continue; }

    // Fuzzy last: "baba" -> "boba", "juce" -> "juice", "mocca" -> "mocha".
    const max = tolerance(Math.max(token.length, word.length));
    if (max === 0) continue;
    const dist = boundedEditDistance(token, word, max);
    if (dist <= max) {
      best = Math.max(best, 0.75 * (1 - dist / (Math.max(word.length, token.length) + 1)));
    }
  }
  return best;
}

const FIELD_WEIGHTS = { nameEn: 10, nameAr: 10, category: 6, tag: 4, description: 3 };

interface Haystack {
  nameEn: string;
  nameAr: string;
  category: string;
  tag: string;
  description: string;
}

const haystackCache = new WeakMap<MenuItem, Haystack>();

function haystackFor(item: MenuItem): Haystack {
  const cached = haystackCache.get(item);
  if (cached) return cached;

  const category = CATEGORIES.find((c) => c.id === item.category);
  const built: Haystack = {
    nameEn: normalize(item.nameEn || ''),
    nameAr: normalize(item.nameAr || ''),
    // Category names are searchable so "juice" finds the juices even when the word
    // is not in any single product's name.
    category: normalize(`${item.category} ${category?.nameEn ?? ''} ${category?.nameAr ?? ''}`),
    tag: normalize(item.tag || ''),
    description: normalize(`${item.descriptionEn || ''} ${item.descriptionAr || ''}`),
  };
  haystackCache.set(item, built);
  return built;
}

/**
 * Relevance for one item, or 0 when it should not appear. Every token in the query
 * has to match something, so "iced latte" does not return everything iced.
 */
export function scoreItem(query: string, item: MenuItem): number {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return 0;

  const hay = haystackFor(item);
  let total = 0;

  for (const token of tokens) {
    const best = Math.max(
      scoreToken(token, hay.nameEn) * FIELD_WEIGHTS.nameEn,
      scoreToken(token, hay.nameAr) * FIELD_WEIGHTS.nameAr,
      scoreToken(token, hay.category) * FIELD_WEIGHTS.category,
      scoreToken(token, hay.tag) * FIELD_WEIGHTS.tag,
      scoreToken(token, hay.description) * FIELD_WEIGHTS.description,
    );
    if (best === 0) return 0;                  // one unmatched token disqualifies
    total += best;
  }
  return total;
}

/** Items matching `query`, best first. Empty query returns everything unchanged. */
export function searchItems(query: string, items: MenuItem[]): MenuItem[] {
  if (!query.trim()) return items;
  return items
    .map((item) => ({ item, score: scoreItem(query, item) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}
