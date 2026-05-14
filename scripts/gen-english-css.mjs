// Generate @font-face declarations for the premium English font catalog so
// the picker can preview their glyphs in the browser. Source of truth:
// lib/fonts/premium-fonts.ts. Output: app/premium-fonts.css.
//
// Read it via globals.css `@import './premium-fonts.css'`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(
  path.join(root, 'lib', 'fonts', 'premium-fonts.ts'),
  'utf8',
);

// Parse the PREMIUM_FONTS array. Each entry is roughly:
//   { family: 'X', category: 'title', variants: [...] }
// withItalics / uprightOnly are helper calls — we re-implement them here to
// expand into concrete file rows.
const entries = [];
const blockRe = /\{\s*family:\s*'([^']+)'[^}]*?variants:\s*((?:withItalics|uprightOnly|\[)[\s\S]*?)\}/g;
for (const m of src.matchAll(blockRe)) {
  const family = m[1];
  const variantsExpr = m[2];

  const variants = [];
  let helperMatch;
  if ((helperMatch = variantsExpr.match(/withItalics\(\s*'([^']+)'\s*,\s*(\[[^\]]+\]|[A-Za-z]+)(?:\s*,\s*'([^']+)')?\s*\)/))) {
    const slug = helperMatch[1];
    const weightsExpr = helperMatch[2];
    const ext = helperMatch[3] ?? 'otf';
    const weights = parseWeights(weightsExpr, src);
    for (const w of weights) {
      variants.push({ weight: w, italic: false, file: `${slug}-${w}.${ext}` });
      variants.push({ weight: w, italic: true,  file: `${slug}-${w}-italic.${ext}` });
    }
  } else if ((helperMatch = variantsExpr.match(/uprightOnly\(\s*'([^']+)'\s*,\s*(\[[^\]]+\]|[A-Za-z]+)(?:\s*,\s*'([^']+)')?\s*\)/))) {
    const slug = helperMatch[1];
    const weightsExpr = helperMatch[2];
    const ext = helperMatch[3] ?? 'otf';
    const weights = parseWeights(weightsExpr, src);
    for (const w of weights) variants.push({ weight: w, italic: false, file: `${slug}-${w}.${ext}` });
  } else {
    // Literal array of variants — pull file: '...' tuples.
    const fileRe = /weight:\s*(\d+),\s*italic:\s*(true|false),\s*file:\s*'([^']+)'/g;
    for (const lit of variantsExpr.matchAll(fileRe)) {
      variants.push({ weight: Number(lit[1]), italic: lit[2] === 'true', file: lit[3] });
    }
  }

  for (const v of variants) {
    entries.push({ family, ...v });
  }
}

function parseWeights(expr, src) {
  if (expr.startsWith('[')) {
    return expr.slice(1, -1).split(',').map((s) => Number(s.trim())).filter(Boolean);
  }
  // Named const like `sohneWeights`. Resolve from src.
  const re = new RegExp(`const\\s+${expr}\\s*=\\s*\\[([^\\]]+)\\]`);
  const m = src.match(re);
  if (!m) return [];
  return m[1].split(',').map((s) => Number(s.trim())).filter(Boolean);
}

if (entries.length === 0) {
  console.error('no premium entries parsed — check the regex');
  process.exit(1);
}

const css = entries
  .map((e) => {
    const fmt = e.file.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
    return `@font-face {
  font-family: ${JSON.stringify(e.family)};
  src: url("/fonts/english/premium/${encodeURIComponent(e.file)}") format("${fmt}");
  font-weight: ${e.weight};
  font-style: ${e.italic ? 'italic' : 'normal'};
  font-display: swap;
}`;
  })
  .join('\n\n');

const outPath = path.join(root, 'app', 'premium-fonts.css');
fs.writeFileSync(outPath, css + '\n');
console.log('wrote', outPath, 'with', entries.length, '@font-face rules');
