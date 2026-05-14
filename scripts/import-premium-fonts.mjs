#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const SRC = '/tmp/font-extract';
const DEST = '/root/docs2/public/fonts/english/premium';
fs.mkdirSync(DEST, { recursive: true });

function fc(file) {
  try {
    const out = execSync(`fc-query "${file}" 2>/dev/null`, { encoding: 'utf8' });
    const m = {
      family: out.match(/^\s+family:\s+"([^"]+)"/m)?.[1] ?? null,
      style: out.match(/^\s+style:\s+"([^"]+)"/m)?.[1] ?? null,
      weight: Number(out.match(/^\s+weight:\s+(\d+)/m)?.[1] ?? 80),
      slant: Number(out.match(/^\s+slant:\s+(\d+)/m)?.[1] ?? 0),
    };
    return m;
  } catch {
    return null;
  }
}

// fontconfig 'weight' field uses its own scale (0–215). Map to standard 100–900.
const WEIGHT_MAP = [
  [0, 100], [40, 200], [50, 200], [55, 300], [75, 350], [80, 400],
  [100, 500], [180, 600], [200, 700], [205, 800], [210, 900], [215, 900],
];
function normWeight(fcWeight) {
  let best = 400, bestDelta = Infinity;
  for (const [fc, w] of WEIGHT_MAP) {
    const d = Math.abs(fc - fcWeight);
    if (d < bestDelta) { bestDelta = d; best = w; }
  }
  return best;
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/test\s+/g, '')
    .replace(/pp\s+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const all = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('__MACOSX') || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.(otf|ttf)$/i.test(e.name)) all.push(full);
  }
}
walk(SRC);

// Skip woff/woff2 (the Migra zip ships those alongside otf/ttf; we have the
// preferred format already).

const registry = new Map(); // family → { weights: Map<weight, {file, italic}> }
let copied = 0;

for (const f of all) {
  const meta = fc(f);
  if (!meta?.family) continue;
  const italic = meta.slant !== 0 || /italic|kursiv/i.test(meta.style ?? '');
  const weight = normWeight(meta.weight);

  // Clean the family: strip 'Test ' (Söhne / Tiempos trial), strip 'PP '
  // (PangramPangram), strip '-TRIAL' (Reckless), strip ' Trial' (GT).
  const cleanFamily = meta.family
    .replace(/^Test\s+/, '')
    .replace(/^PP\s+/, '')
    .replace(/\s+Trial\b/gi, '')
    .replace(/-TRIAL$/i, '')
    .trim();

  const slugFam = slug(cleanFamily);
  const ext = path.extname(f).toLowerCase();
  const target = path.join(
    DEST,
    `${slugFam}-${weight}${italic ? '-italic' : ''}${ext}`,
  );
  // Don't overwrite existing (in case multiple files map to same key — keep first).
  if (fs.existsSync(target)) continue;
  fs.copyFileSync(f, target);
  copied++;

  if (!registry.has(cleanFamily)) {
    registry.set(cleanFamily, { weights: new Map(), realFamily: meta.family });
  }
  const fam = registry.get(cleanFamily);
  const key = italic ? `${weight}i` : String(weight);
  fam.weights.set(key, { file: path.basename(target), weight, italic });
}

console.log(`Copied ${copied} files to ${DEST}`);
console.log(`\n${registry.size} families:`);
for (const [name, info] of [...registry.entries()].sort()) {
  const ws = [...info.weights.keys()].sort();
  console.log(`  ${name.padEnd(40)} → ${ws.join(', ')}`);
}

// Emit a JSON dump for the registry generator step.
const out = [...registry.entries()].map(([family, info]) => ({
  family,
  realFamily: info.realFamily,
  variants: [...info.weights.values()].sort(
    (a, b) => a.weight - b.weight || (a.italic ? 1 : 0) - (b.italic ? 1 : 0),
  ),
}));
fs.writeFileSync('/tmp/premium-registry.json', JSON.stringify(out, null, 2));
console.log(`\nWrote /tmp/premium-registry.json`);
