import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Source of truth: lib/fonts/hebrew-fonts.ts. We parse the HEBREW_FONTS
// array out of it via a forgiving regex so we don't have to spin up a TS
// compiler from a build script. If the format of those entries ever
// changes, update the regex.
const srcPath = path.join(root, 'lib', 'fonts', 'hebrew-fonts.ts');
const src = fs.readFileSync(srcPath, 'utf8');

const entryRe = /\{\s*name:\s*'([^']+)'\s*,\s*file:\s*'([^']+)'(?:\s*,\s*weight:\s*(\d+))?/g;
const fonts = [];
for (const m of src.matchAll(entryRe)) {
  const name = m[1];
  const file = m[2];
  const weight = m[3] ? Number(m[3]) : 400;
  const fmt = file.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
  fonts.push([name, file, weight, fmt]);
}

if (fonts.length === 0) {
  console.error('No fonts parsed from', srcPath, '— check the regex.');
  process.exit(1);
}

const css = fonts
  .map(([name, file, weight, fmt]) => {
    const url = '/fonts/hebrew/' + encodeURIComponent(file);
    return `@font-face {
  font-family: ${JSON.stringify(name)};
  src: url("${url}") format("${fmt}");
  font-weight: ${weight};
  font-style: normal;
  font-display: swap;
  unicode-range: U+0590-05FF, U+FB1D-FB4F, U+0020-007F;
}`;
  })
  .join('\n\n');

const outPath = path.join(root, 'app', 'hebrew-fonts.css');
fs.writeFileSync(outPath, css + '\n');
console.log('wrote', outPath, 'with', fonts.length, '@font-face rules');
