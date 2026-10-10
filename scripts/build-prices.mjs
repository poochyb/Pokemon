// Downloads TCGplayer Pokémon card prices from TCGCSV (https://tcgcsv.com) and
// writes a compact prices.json that the Artist Binder uses when TCGdex has no price.
// Run with: node scripts/build-prices.mjs   (Node 20+, no packages needed)

import { writeFile } from "node:fs/promises";

const BASE = "https://tcgcsv.com/tcgplayer";
const CATEGORY = 3; // Pokémon (English)
const PREFERRED = ["Holofoil", "Normal", "1st Edition Holofoil", "1st Edition", "Unlimited Holofoil", "Unlimited", "Reverse Holofoil"];

async function getJSON(url, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "poochyb-pokemon-artist-binder" } });
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
      return (await r.json()).results || [];
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise(res => setTimeout(res, 2000 * i));
    }
  }
}

// Must match normNum/normName in index.html.
export const normNum = s => String(s).split("/")[0].trim().toLowerCase().replace(/^([a-z]*)0+(?=\d)/, "$1");
export const normName = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/\s+-\s+[^-]*\d[^-]*$/, "")   // "Charizard ex - 125/197" -> "Charizard ex"
  .replace(/\([^)]*\)/g, "")              // drop "(Shadowless)" style notes
  .toLowerCase().replace(/[^a-z0-9]/g, "");

function bestPrice(rows) {
  const priced = rows.filter(r => (r.marketPrice || r.midPrice) > 0);
  if (!priced.length) return null;
  priced.sort((a, b) => {
    const ia = PREFERRED.indexOf(a.subTypeName), ib = PREFERRED.indexOf(b.subTypeName);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const p = priced[0];
  return Math.round((p.marketPrice || p.midPrice) * 100) / 100;
}

const groups = await getJSON(`${BASE}/${CATEGORY}/groups`);
console.log(`${groups.length} groups`);

const sets = [];
const cards = {};
const ids = {}; // TCGplayer productId → price, for exact versions (e.g. a Pokémon Center stamped promo)
let count = 0, i = 0;

async function worker() {
  while (i < groups.length) {
    const g = groups[i++];
    const [products, prices] = await Promise.all([
      getJSON(`${BASE}/${CATEGORY}/${g.groupId}/products`),
      getJSON(`${BASE}/${CATEGORY}/${g.groupId}/prices`),
    ]);
    const byProduct = {};
    prices.forEach(p => (byProduct[p.productId] ||= []).push(p));
    const setIdx = sets.push(g.name) - 1;
    for (const prod of products) {
      const num = prod.extendedData?.find(d => d.name === "Number")?.value;
      if (!num) continue; // sealed product, not a card
      const price = bestPrice(byProduct[prod.productId] || []);
      if (price == null) continue;
      (cards[normNum(num)] ||= []).push([setIdx, normName(prod.name), price]);
      ids[prod.productId] = price;
      count++;
    }
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);

if (count < 1000) throw new Error(`Only ${count} priced cards found; refusing to overwrite prices.json`);
await writeFile("prices.json", JSON.stringify({ updated: new Date().toISOString(), sets, cards, ids }));
console.log(`Wrote prices.json with ${count} priced cards from ${sets.length} sets`);
