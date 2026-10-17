// Keeps a daily TCGplayer price history for every card, built from our own prices.json snapshots
// (TCGCSV's public price archive is currently offline). Run after build-prices.mjs.
//
// history/NNN.json  (NNN = TCGplayer productId % 1000) looks like:
//   { "start": "2026-10-10", "p": { "635468": [101.2, 99.5, null, 99.01, ...] } }
// Each array holds one price per day starting at "start"; null means no price that day.
// The first run (no history folder yet) backfills from every prices.json in the git history.

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const DIR = "history", SHARDS = 1000;
const day = iso => iso.slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

async function loadAll(){
  const shards = {};
  let files = [];
  try { files = await readdir(DIR); } catch(e){ return null; }
  for (const f of files) if (/^\d{3}\.json$/.test(f)) shards[+f.slice(0, 3)] = JSON.parse(await readFile(`${DIR}/${f}`, "utf8"));
  return shards;
}

function addSnapshot(shards, date, ids){
  for (const [id, price] of Object.entries(ids)){
    const n = +id % SHARDS, s = (shards[n] ||= { start: date, p: {} });
    if (date < s.start){ // older than this shard's start: shift every series right
      const shift = daysBetween(date, s.start);
      for (const k in s.p) s.p[k] = Array(shift).fill(null).concat(s.p[k]);
      s.start = date;
    }
    const i = daysBetween(s.start, date), arr = (s.p[id] ||= []);
    while (arr.length <= i) arr.push(null);
    arr[i] = Math.round(price * 100) / 100;
  }
}

const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 1 << 28 });
const gitQuiet = (...a) => execFileSync("git", a, { stdio: "ignore" });
let shards = await loadAll();
if (!shards){
  shards = {};
  try { gitQuiet("fetch", "--unshallow", "--quiet"); } catch(e){ /* already a full clone */ }
  const commits = git("log", "--reverse", "--format=%H", "--", "prices.json").trim().split("\n").filter(Boolean);
  let used = 0;
  for (const sha of commits){
    try {
      const d = JSON.parse(git("show", `${sha}:prices.json`));
      if (d.ids){ addSnapshot(shards, day(d.updated), d.ids); used++; }
    } catch(e){}
  }
  console.log(`Backfilled from ${used} earlier snapshots`);
}
const today = JSON.parse(await readFile("prices.json", "utf8"));
if (!today.ids) throw new Error("prices.json has no ids");
addSnapshot(shards, day(today.updated), today.ids);

// Pad every series to the latest day so all arrays line up with today.
const last = day(today.updated);
await mkdir(DIR, { recursive: true });
for (const [n, s] of Object.entries(shards)){
  const len = daysBetween(s.start, last) + 1;
  for (const k in s.p) while (s.p[k].length < len) s.p[k].push(null);
  await writeFile(`${DIR}/${String(n).padStart(3, "0")}.json`, JSON.stringify(s));
}
console.log(`History updated through ${last} in ${Object.keys(shards).length} files`);
