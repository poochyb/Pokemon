# Pokémon TCG Projects

The owner is new to coding. Explain things in plain language and give click-by-click steps for anything they must do themselves.

## Apps (plain HTML/CSS/JS, no build step)
- `index.html`: **Artist Binder** (page title "Howard’s Favorite Pokémon Artists"), the main app. Self-contained single file. Uses the TCGdex API (https://api.tcgdex.net/v2). Tracks owned cards per illustrator, shows market prices and owned totals. Data lives in browser localStorage (key `artistBinder.v1`), with JSON backup/restore. A **Share** button makes a view-only snapshot link (`#share=` + deflate-raw/base64url JSON of artists and owned ids); opening it never writes to the viewer's localStorage.
- `collection.html` + `app.js` + `style.css`: older **Collection Tracker** using the Pokémon TCG API (pokemontcg.io).

## Publishing
- Live site via GitHub Pages: https://poochyb.github.io/Pokemon/ (Artist Binder) and /collection.html.
- Pages serves the branch `claude/pokemon-tcg-collection-ws1czw` (also the repo's default branch). Changes only go live once they are on that branch.

## Testing notes
- Cloud sessions can't reach api.tcgdex.net or api.pokemontcg.io (egress blocked). Test in Playwright with mocked API responses, and tell the owner what couldn't be verified live.
- Don't break existing saved data: keep the localStorage key and backup format compatible.

## Prices
- Artist Binder uses TCGdex `pricing` first (TCGplayer USD, else Cardmarket EUR). TCGdex returns `pricing: null` for many cards.
- Fallback for English cards: `prices.json`, built daily by `.github/workflows/prices.yml` running `scripts/build-prices.mjs`, which downloads TCGplayer prices from TCGCSV (https://tcgcsv.com, category 3). The app matches by normalized card number + name, then best set-name overlap. Keep `normNum`/`normName` identical in both files.
- The workflow commits `prices.json` to the branch daily, so always `git pull` before pushing.
- Japanese cards aren't covered by the fallback yet (TCGplayer category 85 uses English names; TCGdex `ja` names are Japanese).
