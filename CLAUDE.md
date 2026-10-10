# Pokémon TCG Projects

The owner is new to coding. Explain things in plain language and give click-by-click steps for anything they must do themselves.

## Apps (plain HTML/CSS/JS, no build step)
- `index.html`: **Artist Binder** (page title "Howard’s Pokémon TCG Collection"), the main app. Self-contained single file. Uses the TCGdex API (https://api.tcgdex.net/v2). Tracks owned cards per illustrator, shows market prices and owned totals. Data lives in browser localStorage (key `artistBinder.v1`), with JSON backup/restore. A **Share** button makes a view-only snapshot link (`#share=` + deflate-raw/base64url JSON of artists and owned ids); opening it never writes to the viewer's localStorage. Share and Backup buttons live in the footer; the top-right of the header shows the binder total (value + owned count).
  - Categories (`state.cat`): **Artists** (sub-tabs = artists, `state.artists`/`state.active`), **Pokémon** (sub-tabs = Pokémon the owner adds, `state.pokemon`/`state.activePoke`; cards from `GET /v2/{lang}/cards?name=<longest word>` filtered by `isCardOf` so "Mew" excludes "Mewtwo" and "Porygon" excludes "Porygon-Z"; name suggestions from `pokemon-names.json`, built once from PokeAPI's `pokemon_species_names.csv`), and **EX / Mega EX** (a single sub-tab "EX" with every EX/ex card; `state.exSub` is always "all"). EX cards come from `GET /v2/en/cards?name=*EX` and `?name=*ex` (merged by id), kept if the name ends in ` EX`/`-EX`/` ex` (all eras: 2003–07 ex, 2012–16 EX, 2023+ ex, Mega ex). Owned flags are shared across categories (same `lang:id` key).
  - **Full Arts** category (`state.cat = "fa"`, one tab): a hand-picked list in `state.fullArts` (replaced the old automatic S.I.R. rarity tabs). In this category the header box becomes "Add a card…": it searches `GET /v2/{lang}/cards?name=` (a trailing number like "Wobbuffet 203" filters by card number), shows results in `#picker`, and Add stores the card's basics plus, when the card has several `variants_detailed`, the chosen version (`vid`, `vlabel` e.g. "Holo · Pokémon Center stamp", `tp` = TCGplayer product id). Adding marks the card owned. `priceOf` uses the chosen version everywhere: `prices.json` `ids[tp]` (exact TCGplayer price) first, then that version's TCGdex price.
  - **Most valuable** (`state.cat = "top"`): opened by clicking the binder total (top right). Every owned card from every loaded list, each once (cards carry their own `lang`), ranked by price; no Owned/Missing switch or sort menu.
  - Sub-tabs show only the name (title tooltip has "x of y owned (N%)"; the open tab's numbers are in the toolbar); artist/Pokémon tabs can be reordered by dragging (pointer events; touch needs a 350 ms press-and-hold so swipes still scroll). The order is the array order in `state.artists` / `state.pokemon`. « » arrows appear when the tab strip overflows.
- `collection.html` + `app.js` + `style.css`: older **Collection Tracker** using the Pokémon TCG API (pokemontcg.io).

- Card pictures: TCGdex `image` + `/low.webp` / `/high.webp`. TCGdex has no images for some cards (e.g. all Trainer/Galarian Gallery cards); for English ones `cardImages()` falls back to `https://images.pokemontcg.io/<set>/<num>.png` (`_hires.png` for zoom), mapping TCGdex set ids (`swsh12.5gg` → `swsh12pt5gg`, `sv03.5` → `sv3pt5`) and stripping leading zeros from numeric card numbers. Failed images show the "No image yet" box.

- Card lists are cached in localStorage (`artistBinder.lists.v1`, separate from user data). If TCGdex fails (it has short outages, e.g. HTTP 503 "no available server"), `useSaved()` shows the saved copy with a note and retries every minute; never-loaded lists show an error and keep retrying.
- TCGdex also returns Pokémon TCG Pocket (phone game) cards (`/tcgp/` images, set ids like `A4`, `B2`, `P-A`); `isPhysical()` drops them from every list.

## Publishing
- Live site via GitHub Pages: https://poochyb.github.io/Pokemon/ (Artist Binder) and /collection.html.
- Pages serves the branch `claude/pokemon-tcg-collection-ws1czw` (also the repo's default branch). Changes only go live once they are on that branch.

## Testing notes
- `.github/workflows/api-probe.yml` (manual) prints live TCGdex responses: trigger it with `paths` like `/v2/en/rarities /v2/en/cards/sv03.5-199` (via the GitHub MCP `actions_run_trigger`) and read the job log. Use it to check real API shapes before relying on them.
- Cloud sessions can't reach api.tcgdex.net or api.pokemontcg.io (egress blocked). Test in Playwright with mocked API responses, and tell the owner what couldn't be verified live.
- Don't break existing saved data: keep the localStorage key and backup format compatible.

## Prices
- Artist Binder uses TCGdex `pricing` first (TCGplayer USD, else Cardmarket EUR). TCGdex returns `pricing: null` for many cards.
- Fallback for English cards: `prices.json`, built daily by `.github/workflows/prices.yml` running `scripts/build-prices.mjs`, which downloads TCGplayer prices from TCGCSV (https://tcgcsv.com, category 3). It also writes `ids` (TCGplayer productId → price) for exact versions. The app matches by normalized card number + name, then best set-name overlap. Keep `normNum`/`normName` identical in both files.
- The workflow commits `prices.json` to the branch daily, so always `git pull` before pushing.
- Japanese cards aren't covered by the fallback yet (TCGplayer category 85 uses English names; TCGdex `ja` names are Japanese).
