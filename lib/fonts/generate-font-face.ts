import { HEBREW_FONTS } from './hebrew-fonts';

/**
 * Returns CSS @font-face rules for all bundled Hebrew fonts.
 * Used in app/globals.css via a server component injection.
 */
export function hebrewFontFaceCss(): string {
  return HEBREW_FONTS.map((font) => {
    const fmt = font.file.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
    const weight = font.weight ?? 400;
    return `@font-face {
  font-family: ${JSON.stringify(font.name)};
  src: url("/fonts/hebrew/${encodeURIComponent(font.file)}") format("${fmt}");
  font-weight: ${weight};
  font-style: normal;
  font-display: swap;
  unicode-range: U+0590-05FF, U+FB1D-FB4F, U+0020-007F;
}`;
  }).join('\n\n');
}
