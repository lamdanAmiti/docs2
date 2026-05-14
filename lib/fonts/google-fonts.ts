/**
 * Curated catalog of Google Fonts available in the picker.
 *
 * We don't proxy the full Google Fonts API (1700+ families is too noisy and
 * would need an API key). Instead we hand-pick: every font that supports
 * Hebrew (so they appear in the Hebrew filter alongside local fonts) plus a
 * broad cross-section of the most-used Latin families across categories.
 *
 * Fonts are lazy-loaded via <link href="https://fonts.googleapis.com/css2?...">
 * the first time a user previews or selects them.
 */

export interface GoogleFont {
  family: string;
  category: 'sans' | 'serif' | 'display' | 'handwriting' | 'mono';
  /** True if this font has glyphs for the Hebrew (U+0590..U+05FF) range. */
  hebrew?: boolean;
  /** Available weight axes — defaults to [400, 700] when unspecified. */
  weights?: number[];
}

export const GOOGLE_FONTS: GoogleFont[] = [
  // ─── Hebrew-capable Google Fonts ────────────────────────────────
  { family: 'Heebo', category: 'sans', hebrew: true, weights: [100, 300, 400, 500, 700, 800, 900] },
  { family: 'Assistant', category: 'sans', hebrew: true, weights: [200, 300, 400, 600, 700, 800] },
  { family: 'Rubik', category: 'sans', hebrew: true, weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Frank Ruhl Libre', category: 'serif', hebrew: true, weights: [300, 400, 500, 700, 900] },
  { family: 'Noto Sans Hebrew', category: 'sans', hebrew: true, weights: [100, 300, 400, 500, 700, 900] },
  { family: 'Noto Serif Hebrew', category: 'serif', hebrew: true, weights: [100, 300, 400, 500, 700, 900] },
  { family: 'Noto Rashi Hebrew', category: 'serif', hebrew: true },
  { family: 'Alef', category: 'sans', hebrew: true, weights: [400, 700] },
  { family: 'Suez One', category: 'serif', hebrew: true, weights: [400] },
  { family: 'Miriam Libre', category: 'sans', hebrew: true, weights: [400, 700] },
  { family: 'David Libre', category: 'serif', hebrew: true, weights: [400, 500, 700] },
  { family: 'Bellefair', category: 'serif', hebrew: true, weights: [400] },
  { family: 'Secular One', category: 'sans', hebrew: true, weights: [400] },
  { family: 'Karantina', category: 'display', hebrew: true, weights: [300, 400, 700] },
  { family: 'Varela Round', category: 'sans', hebrew: true, weights: [400] },
  { family: 'Amatic SC', category: 'handwriting', hebrew: true, weights: [400, 700] },
  { family: 'Tinos', category: 'serif', hebrew: true, weights: [400, 700] },
  { family: 'Arimo', category: 'sans', hebrew: true, weights: [400, 500, 600, 700] },
  { family: 'Cousine', category: 'mono', hebrew: true, weights: [400, 700] },
  { family: 'Open Sans Hebrew', category: 'sans', hebrew: true, weights: [400, 700] },
  { family: 'M PLUS 1', category: 'sans', hebrew: true, weights: [100, 300, 400, 500, 700, 900] },
  { family: 'Ploni', category: 'sans', hebrew: true, weights: [300, 400, 700] },

  // ─── Top sans-serif (Latin) ─────────────────────────────────────
  { family: 'Inter', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Roboto', category: 'sans', weights: [100, 300, 400, 500, 700, 900] },
  { family: 'Open Sans', category: 'sans', weights: [300, 400, 500, 600, 700, 800] },
  { family: 'Lato', category: 'sans', weights: [100, 300, 400, 700, 900] },
  { family: 'Montserrat', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Poppins', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Nunito', category: 'sans', weights: [200, 300, 400, 600, 700, 800, 900] },
  { family: 'Nunito Sans', category: 'sans', weights: [200, 300, 400, 600, 700, 800, 900] },
  { family: 'Source Sans 3', category: 'sans', weights: [200, 300, 400, 600, 700, 900] },
  { family: 'Work Sans', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'DM Sans', category: 'sans', weights: [400, 500, 700] },
  { family: 'Manrope', category: 'sans', weights: [200, 300, 400, 500, 600, 700, 800] },
  { family: 'Plus Jakarta Sans', category: 'sans', weights: [200, 300, 400, 500, 600, 700, 800] },
  { family: 'Public Sans', category: 'sans', weights: [100, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Outfit', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Onest', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Geist', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Instrument Sans', category: 'sans', weights: [400, 500, 600, 700] },
  { family: 'Figtree', category: 'sans', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Be Vietnam Pro', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Mulish', category: 'sans', weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Karla', category: 'sans', weights: [200, 300, 400, 500, 600, 700, 800] },
  { family: 'Quicksand', category: 'sans', weights: [300, 400, 500, 600, 700] },
  { family: 'Raleway', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Ubuntu', category: 'sans', weights: [300, 400, 500, 700] },
  { family: 'Barlow', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Cabin', category: 'sans', weights: [400, 500, 600, 700] },
  { family: 'PT Sans', category: 'sans', weights: [400, 700] },
  { family: 'Fira Sans', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'IBM Plex Sans', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700] },
  { family: 'Hind', category: 'sans', weights: [300, 400, 500, 600, 700] },
  { family: 'Oxygen', category: 'sans', weights: [300, 400, 700] },
  { family: 'Mukta', category: 'sans', weights: [200, 300, 400, 500, 600, 700, 800] },
  { family: 'Titillium Web', category: 'sans', weights: [200, 300, 400, 600, 700, 900] },
  { family: 'Exo 2', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Archivo', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },

  // ─── Top serif ──────────────────────────────────────────────────
  { family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Merriweather', category: 'serif', weights: [300, 400, 700, 900] },
  { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'PT Serif', category: 'serif', weights: [400, 700] },
  { family: 'Source Serif 4', category: 'serif', weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 500, 600, 700] },
  { family: 'EB Garamond', category: 'serif', weights: [400, 500, 600, 700, 800] },
  { family: 'Crimson Pro', category: 'serif', weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Crimson Text', category: 'serif', weights: [400, 600, 700] },
  { family: 'Libre Baskerville', category: 'serif', weights: [400, 700] },
  { family: 'Libre Caslon Text', category: 'serif', weights: [400, 700] },
  { family: 'Libre Franklin', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Bitter', category: 'serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Bodoni Moda', category: 'serif', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'DM Serif Display', category: 'serif', weights: [400] },
  { family: 'DM Serif Text', category: 'serif', weights: [400] },
  { family: 'Spectral', category: 'serif', weights: [200, 300, 400, 500, 600, 700, 800] },
  { family: 'Cardo', category: 'serif', weights: [400, 700] },
  { family: 'Vollkorn', category: 'serif', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Domine', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'Old Standard TT', category: 'serif', weights: [400, 700] },
  { family: 'Cormorant', category: 'serif', weights: [300, 400, 500, 600, 700] },
  { family: 'Newsreader', category: 'serif', weights: [200, 300, 400, 500, 600, 700, 800] },
  { family: 'Fraunces', category: 'serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Literata', category: 'serif', weights: [200, 300, 400, 500, 600, 700, 800, 900] },

  // ─── Display ────────────────────────────────────────────────────
  { family: 'Bebas Neue', category: 'display', weights: [400] },
  { family: 'Oswald', category: 'display', weights: [200, 300, 400, 500, 600, 700] },
  { family: 'Anton', category: 'display', weights: [400] },
  { family: 'Abril Fatface', category: 'display', weights: [400] },
  { family: 'Pacifico', category: 'handwriting', weights: [400] },
  { family: 'Lobster', category: 'display', weights: [400] },
  { family: 'Comfortaa', category: 'display', weights: [300, 400, 500, 600, 700] },
  { family: 'Righteous', category: 'display', weights: [400] },
  { family: 'Russo One', category: 'display', weights: [400] },
  { family: 'Permanent Marker', category: 'handwriting', weights: [400] },
  { family: 'Caveat', category: 'handwriting', weights: [400, 500, 600, 700] },
  { family: 'Dancing Script', category: 'handwriting', weights: [400, 500, 600, 700] },
  { family: 'Sacramento', category: 'handwriting', weights: [400] },
  { family: 'Great Vibes', category: 'handwriting', weights: [400] },
  { family: 'Allura', category: 'handwriting', weights: [400] },
  { family: 'Satisfy', category: 'handwriting', weights: [400] },
  { family: 'Kalam', category: 'handwriting', weights: [300, 400, 700] },
  { family: 'Indie Flower', category: 'handwriting', weights: [400] },
  { family: 'Shadows Into Light', category: 'handwriting', weights: [400] },
  { family: 'Patrick Hand', category: 'handwriting', weights: [400] },
  { family: 'Architects Daughter', category: 'handwriting', weights: [400] },
  { family: 'Homemade Apple', category: 'handwriting', weights: [400] },
  { family: 'Marck Script', category: 'handwriting', weights: [400] },
  { family: 'Cinzel', category: 'serif', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Cinzel Decorative', category: 'display', weights: [400, 700, 900] },
  { family: 'Unica One', category: 'display', weights: [400] },
  { family: 'Chivo', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },

  // ─── Monospace ──────────────────────────────────────────────────
  { family: 'JetBrains Mono', category: 'mono', weights: [100, 200, 300, 400, 500, 600, 700, 800] },
  { family: 'Fira Code', category: 'mono', weights: [300, 400, 500, 600, 700] },
  { family: 'IBM Plex Mono', category: 'mono', weights: [100, 200, 300, 400, 500, 600, 700] },
  { family: 'Source Code Pro', category: 'mono', weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'Roboto Mono', category: 'mono', weights: [100, 200, 300, 400, 500, 600, 700] },
  { family: 'Space Mono', category: 'mono', weights: [400, 700] },
  { family: 'Inconsolata', category: 'mono', weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { family: 'DM Mono', category: 'mono', weights: [300, 400, 500] },
  { family: 'PT Mono', category: 'mono', weights: [400] },
  { family: 'Cousine', category: 'mono', weights: [400, 700] },
];

export const HEBREW_GOOGLE_FONTS: GoogleFont[] = GOOGLE_FONTS.filter((f) => f.hebrew);
export const NON_HEBREW_GOOGLE_FONTS: GoogleFont[] = GOOGLE_FONTS.filter((f) => !f.hebrew);

/** Returns the CSS link URL for a single family with its weight axes. */
export function googleFontLinkUrl(family: string, weights?: number[]): string {
  const w = (weights ?? [400, 700]).slice().sort((a, b) => a - b);
  const axes = w.length > 1 ? `:wght@${w.join(';')}` : '';
  // Hebrew subset must be requested explicitly for Hebrew fonts to render
  const sub = '&subset=hebrew,latin';
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}${axes}&display=swap${sub}`;
}

/** Combined CSS URL for the most commonly used fonts — preloaded at startup. */
export function preloadGoogleFontsUrl(): string {
  // Preload Inter (default doc) + Instrument Sans (UI) + a small Hebrew sampler
  const families = [
    'Inter:wght@300;400;500;600;700;800',
    'Instrument+Sans:wght@400;500;600;700',
    'Heebo:wght@300;400;500;700;800',
    'Assistant:wght@300;400;600;700',
    'Frank+Ruhl+Libre:wght@400;700',
    'Noto+Sans+Hebrew:wght@400;500;700',
    'Rubik:wght@400;500;700',
  ];
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`;
}
