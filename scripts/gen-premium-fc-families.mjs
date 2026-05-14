import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DIR = '/root/docs2/public/fonts/english/premium';
const files = fs.readdirSync(DIR).filter(f => /\.(otf|ttf)$/.test(f));
const out = {};

for (const f of files) {
  const q = execSync(`fc-query "${path.join(DIR, f)}" 2>/dev/null`, { encoding: 'utf8' });
  const family = q.match(/^\s+family:\s+"([^"]+)"/m)?.[1] ?? null;
  const fullname = q.match(/^\s+fullname:\s+"([^"]+)"/m)?.[1] ?? null;
  // Pull all families (multi-value), pick the more specific one (has space)
  const allFams = [...q.matchAll(/"([^"]+)"\(s\)/g)].map(m => m[1]).filter(x => x);
  // Strategy: prefer fullname if it differs from family (has weight suffix);
  // fallback to family.
  const dispatch = fullname && fullname !== family ? fullname : family;
  if (dispatch) out[f] = dispatch;
}

fs.writeFileSync('/root/docs2/lib/fonts/premium-fc-families.json', JSON.stringify(out, null, 2));
console.log('wrote', Object.keys(out).length, 'entries');
