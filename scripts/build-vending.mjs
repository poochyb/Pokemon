// Saves the official Pokémon TCG vending machines around home to vending.json, for drops.html.
// Source: the API behind https://vending.pokemon.com/en-us/ (it doesn't allow browsers on other
// sites to call it, so a daily GitHub Action copies it here instead).
//
// vending.json: { updated, home: {name, lat, lng}, machines: [{id, name, lat, lng, retailer,
//   street, city, zip, state}] } — every machine within RADIUS_MI miles of home.

import { readFile, writeFile } from "node:fs/promises";

const HOME = { name: "Yorba Linda, CA", lat: 33.8886, lng: -117.8131 };
const RADIUS_MI = 30;   // the page lets you pick a radius up to 25 miles
const API = "https://api.vending.prod.pokemon.com/v1/machines";

const miles = (a, b) => {
  const R = 3958.8, r = x => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Ask in a 4×4 grid of small boxes, in case the API caps how many machines one answer holds.
const dLat = RADIUS_MI / 69, dLng = RADIUS_MI / (69 * Math.cos(HOME.lat * Math.PI / 180)), N = 4;
const found = new Map();
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++){
  const sw = { lat: HOME.lat - dLat + 2 * dLat * i / N, lng: HOME.lng - dLng + 2 * dLng * j / N };
  const ne = { lat: sw.lat + 2 * dLat / N, lng: sw.lng + 2 * dLng / N };
  const url = `${API}?swLat=${sw.lat.toFixed(5)}&swLng=${sw.lng.toFixed(5)}&neLat=${ne.lat.toFixed(5)}&neLng=${ne.lng.toFixed(5)}&unit=mi`;
  const res = await fetch(url, { headers: { "User-Agent": "pyb-tcg-collection (github.com/poochyb/Pokemon)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  for (const m of (await res.json()).machines || []) found.set(m.id, m);
}

const machines = [...found.values()]
  .filter(m => miles(HOME, m) <= RADIUS_MI)
  .map(m => ({ id: m.id, name: m.name, lat: m.lat, lng: m.lng, retailer: m.retailer, street: m.street,
    city: m.city, zip: m.zipPostalCode, state: m.stateProvince }))
  .sort((a, b) => miles(HOME, a) - miles(HOME, b));
if (!machines.length) throw new Error("No machines found; keeping the old vending.json");

// Only touch the file (and its date) when the list itself changed, so the job doesn't commit daily.
let old = null;
try { old = JSON.parse(await readFile("vending.json", "utf8")); } catch(e){}
if (old && JSON.stringify(old.machines) === JSON.stringify(machines)){ console.log("No change"); process.exit(0); }
await writeFile("vending.json", JSON.stringify({ updated: new Date().toISOString(), home: HOME, machines }, null, 1) + "\n");
console.log(`Saved ${machines.length} machines within ${RADIUS_MI} miles of ${HOME.name}`);
