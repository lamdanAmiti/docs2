/**
 * Premium English fonts bundled in /public/fonts/english/premium/.
 *
 * Sourced from the user's purchased / trial-personal-use font collection
 * (Klim Söhne + Tiempos, Grilli Type GT America, Pangram Pangram Editorial
 * New / Migra / Neue Machina, Displaay Reckless). Trial-vendor naming
 * prefixes ("Test ", "PP ", "-TRIAL") are stripped from both display
 * labels AND the underlying OTF name tables (see scripts/strip-trial-names.py)
 * so neither the picker nor saved .docx files leak the word "Test".
 *
 * Layout in the picker: three semantic English groups — Title / Subtitle /
 * Paragraph — followed by the regular Google Fonts catalog underneath. The
 * weight chip next to the font picker exposes per-family weights.
 */

export type PremiumCategory = 'title' | 'subtitle' | 'paragraph';

export interface PremiumFontVariant {
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  italic: boolean;
  /** Filename inside /public/fonts/english/premium/. */
  file: string;
  /**
   * Optional CharFontName to dispatch when applying *this* weight. When
   * present, the weight picker switches via .uno:CharFontName instead of
   * via the awt.FontWeight property — much more reliable for foundries
   * (Klim etc.) that ship each weight under its own typographic family
   * name like 'Söhne Kräftig' or 'Söhne Extrafett'. When omitted, the
   * weight picker falls back to dispatching CharWeight on the base family.
   */
  fcFamily?: string;
}

export interface PremiumFont {
  /** Display name shown in the picker (and persisted into .docx as the CSS family). */
  family: string;
  category: PremiumCategory;
  /** Optional one-word label for the picker (e.g. "Söhne" instead of "Söhne Standard"). */
  label?: string;
  /** Available weights/italics, ordered light → heavy. */
  variants: PremiumFontVariant[];
}

const sohneWeights = [200, 400, 500, 600, 700, 800, 900] as const;
const tiemposDisplayWeights = [200, 400, 500, 600, 700, 900] as const;
const recklessWeights = [100, 200, 400, 500, 600, 700, 900] as const;

function withItalics(
  slug: string,
  weights: readonly number[],
  ext: 'otf' | 'ttf' = 'otf',
): PremiumFontVariant[] {
  const out: PremiumFontVariant[] = [];
  for (const w of weights) {
    out.push({ weight: w as PremiumFontVariant['weight'], italic: false, file: `${slug}-${w}.${ext}` });
    out.push({ weight: w as PremiumFontVariant['weight'], italic: true,  file: `${slug}-${w}-italic.${ext}` });
  }
  return out;
}

function uprightOnly(slug: string, weights: readonly number[], ext: 'otf' | 'ttf' = 'otf'): PremiumFontVariant[] {
  return weights.map((w) => ({
    weight: w as PremiumFontVariant['weight'],
    italic: false,
    file: `${slug}-${w}.${ext}`,
  }));
}

export const PREMIUM_FONTS: PremiumFont[] = [
  // ─── Title ───────────────────────────────────────────────────────────
  { family: 'Editorial New',     category: 'title', variants: withItalics('editorial-new', [200, 400, 800]) },
  { family: 'Migra',             category: 'title', variants: uprightOnly('migra', [200, 800]) },
  { family: 'Migra Italic',      category: 'title', variants: [
      { weight: 200, italic: true, file: 'migra-italic-200-italic.otf' },
      { weight: 800, italic: true, file: 'migra-italic-800-italic.otf' },
  ] },
  { family: 'Neue Machina',      category: 'title', variants: uprightOnly('neue-machina', [200, 400, 800]) },
  { family: 'Tiempos Headline',  category: 'title', variants: withItalics('tiempos-headline', tiemposDisplayWeights) },
  { family: 'Tiempos Fine',      category: 'title', variants: withItalics('tiempos-fine', tiemposDisplayWeights) },
  { family: 'Söhne Breit',       category: 'title', variants: withItalics('sohne-breit', sohneWeights) },
  { family: 'Reckless Wide',     category: 'title', label: 'Reckless Wide',     variants: withItalics('reckless-wide-m', recklessWeights) },
  { family: 'Reckless Standard XL', category: 'title', variants: withItalics('reckless-standard-xl', recklessWeights) },

  // ─── Subtitle ────────────────────────────────────────────────────────
  { family: 'Söhne Schmal',      category: 'subtitle', variants: withItalics('sohne-schmal', sohneWeights) },
  { family: 'Söhne Mono',        category: 'subtitle', variants: withItalics('sohne-mono', sohneWeights) },
  { family: 'GT America Mono',   category: 'subtitle', variants: uprightOnly('gt-america-mono', [200, 400, 500, 700, 900]) },
  { family: 'Reckless Condensed',category: 'subtitle', variants: withItalics('reckless-condensed-m', recklessWeights) },

  // ─── Paragraph ───────────────────────────────────────────────────────
  { family: 'Söhne',             category: 'paragraph', variants: withItalics('sohne', sohneWeights) },
  { family: 'Tiempos Text',      category: 'paragraph', variants: withItalics('tiempos-text', [400, 500, 600, 700]) },
  { family: 'GT America',        category: 'paragraph', variants: uprightOnly('gt-america', [200, 400, 500, 700, 900]) },
  { family: 'Reckless Standard', category: 'paragraph', variants: withItalics('reckless-standard-m', recklessWeights) },
];

// Auto-generated map of filename → fontconfig fullname for every premium
// font (e.g. 'sohne-500.otf' → 'Söhne Kräftig'). Used to dispatch the right
// CharFontName when the weight picker switches weights. Generated by
// scripts/gen-premium-fc-families.mjs from fc-query metadata.
import FC_FAMILIES from './premium-fc-families.json';

/** Returns the available weight list for a given premium family name. */
export function weightsForPremium(family: string): number[] {
  const f = PREMIUM_FONTS.find((p) => p.family === family);
  if (!f) return [];
  const set = new Set<number>();
  for (const v of f.variants) set.add(v.weight);
  return [...set].sort((a, b) => a - b);
}

/** True if `name` is a premium family known to the registry. */
export function isPremiumFont(name: string): boolean {
  return PREMIUM_FONTS.some((p) => p.family === name);
}

export function premiumByCategory(category: PremiumCategory): PremiumFont[] {
  return PREMIUM_FONTS.filter((p) => p.category === category);
}

/**
 * Find the premium family that `currentFont` belongs to. Matches against
 * either the picker display name ('Söhne') or any of its variants'
 * fontconfig fullnames ('Söhne Kräftig', 'Söhne Bold', etc.) so the weight
 * chip stays visible even after the user picks a specific weight and
 * Collabora reports the weight-specific family back.
 */
export function findPremiumFamily(currentFont: string): PremiumFont | null {
  if (!currentFont) return null;
  for (const p of PREMIUM_FONTS) {
    if (p.family === currentFont) return p;
    for (const v of p.variants) {
      const fc = (FC_FAMILIES as Record<string, string>)[v.file];
      if (fc === currentFont) return p;
    }
  }
  return null;
}

/**
 * For a premium family + desired weight, return the CharFontName to
 * dispatch so the renderer picks the right font file. Prefers the variant's
 * fontconfig fullname (e.g. 'Söhne Kräftig'), falls back to the base family
 * (which has CSS weight 400/Regular).
 */
export function dispatchFamilyFor(
  family: PremiumFont,
  weight: number,
  italic = false,
): string {
  const want = family.variants.find(
    (v) => v.weight === weight && v.italic === italic,
  ) ?? family.variants.find((v) => v.weight === weight);
  if (!want) return family.family;
  const fc = (FC_FAMILIES as Record<string, string>)[want.file];
  return fc ?? family.family;
}
