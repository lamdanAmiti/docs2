// Download italic TTFs for every Google Font listed in lib/fonts/google-fonts.ts
// that supports italic, and write them into public/fonts/english/.
//
// Without these files fontconfig in the Collabora image has no italic-style
// face for the family, so LibreOffice synthesizes italic by skewing the
// regular glyphs. With them present, real italic glyphs render server-side.
//
// Idempotent: skips files that already exist.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public', 'fonts', 'english');
fs.mkdirSync(outDir, { recursive: true });

const src = fs.readFileSync(
  path.join(root, 'lib', 'fonts', 'google-fonts.ts'),
  'utf8',
);

// Parse { family: '…', …, weights: [...] } from the registry. We split into
// entries first (between '{ family:' boundaries) so we can independently
// look for a weights array in each, avoiding regex-greed pitfalls.
const families = [];
const blocks = src.split(/\{\s*family:\s*/).slice(1);
for (const blk of blocks) {
  const famM = blk.match(/^'([^']+)'/);
  if (!famM) continue;
  const family = famM[1];
  const end = blk.indexOf('}');
  const body = end >= 0 ? blk.slice(0, end) : blk;
  const wM = body.match(/weights:\s*\[([^\]]+)\]/);
  const weights = wM
    ? wM[1].split(',').map((s) => Number(s.trim())).filter(Boolean)
    : [400, 700];
  families.push({ family, weights });
}

console.log(`Discovered ${families.length} families`);

// Use a minimal UA so Google's CSS endpoint returns TTF instead of WOFF2.
// (WOFF2 isn't directly consumable by fontconfig in the Collabora image.)
const UA = 'Mozilla/5.0';

function slug(family) {
  return family.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function fetchCss(family, weights) {
  const ws = weights
    .map((w) => `0,${w};1,${w}`)
    .join(';');
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:ital,wght@${ws}&display=swap`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    // Family may not have italic axis (e.g. Bebas Neue) — try a basic probe.
    const probe = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:ital@1&display=swap`,
      { headers: { 'User-Agent': UA } },
    );
    if (!probe.ok) return null;
    return probe.text();
  }
  return res.text();
}

// Parse @font-face blocks of style italic from the CSS.
function extractItalic(css) {
  const blocks = css.split('@font-face').slice(1);
  const out = [];
  for (const b of blocks) {
    const styleM = b.match(/font-style:\s*italic/);
    if (!styleM) continue;
    const weightM = b.match(/font-weight:\s*(\d+)/);
    const urlM = b.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/);
    if (urlM) out.push({ weight: weightM ? Number(weightM[1]) : 400, url: urlM[1] });
  }
  return out;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

let added = 0;
let skipped = 0;
let missing = 0;

for (const { family, weights } of families) {
  const s = slug(family);
  try {
    const css = await fetchCss(family, weights);
    if (!css) {
      missing++;
      console.log(`  - ${family}: no italic axis`);
      continue;
    }
    const italics = extractItalic(css);
    if (italics.length === 0) {
      missing++;
      console.log(`  - ${family}: CSS had no italic faces`);
      continue;
    }
    for (const { weight, url } of italics) {
      const dest = path.join(outDir, `${s}-${weight}-italic.ttf`);
      if (fs.existsSync(dest)) {
        skipped++;
        continue;
      }
      await download(url, dest);
      added++;
      process.stdout.write('.');
    }
  } catch (err) {
    console.warn(`! ${family}: ${err.message}`);
  }
}

console.log();
console.log(`Done. added=${added} skipped=${skipped} no-italic=${missing}`);
