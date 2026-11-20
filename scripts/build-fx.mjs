// Saves the latest euro → US dollar exchange rate to fx.json, so the Artist Binder can show
// Cardmarket (euro) prices in dollars. Source: the European Central Bank's daily reference rate,
// read through Frankfurter (free, no key), or straight from the ECB if Frankfurter is down.
// Run with: node scripts/build-fx.mjs   (Node 20+, no packages needed)

import { writeFile } from "node:fs/promises";

async function frankfurter() {
  const r = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD");
  if (!r.ok) throw new Error(`Frankfurter HTTP ${r.status}`);
  const d = await r.json();
  return { eurUsd: d.rates?.USD, date: d.date };
}
async function ecb() {
  const r = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml");
  if (!r.ok) throw new Error(`ECB HTTP ${r.status}`);
  const x = await r.text();
  return { eurUsd: Number(x.match(/currency=['"]USD['"]\s+rate=['"]([\d.]+)/)?.[1]), date: x.match(/time=['"](\d{4}-\d\d-\d\d)/)?.[1] };
}

let fx = null;
for (const src of [frankfurter, ecb]) {
  try { const r = await src(); if (r.eurUsd > 0 && r.date) { fx = r; break; } } catch (e) { console.log(e.message); }
}
if (!fx) { console.log("No exchange rate today; keeping the old fx.json"); process.exit(0); }
await writeFile("fx.json", JSON.stringify(fx) + "\n");
console.log("fx.json:", fx);
