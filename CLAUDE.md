# Pokémon TCG Projects

The owner is new to coding. Explain things in plain language and give click-by-click steps for anything they must do themselves.

## Apps (plain HTML/CSS/JS, no build step)
- `index.html`: **Artist Binder**, the main app. Self-contained single file. Uses the TCGdex API (https://api.tcgdex.net/v2). Tracks owned cards per illustrator, shows market prices and owned totals. Data lives in browser localStorage (key `artistBinder.v1`), with JSON backup/restore.
- `collection.html` + `app.js` + `style.css`: older **Collection Tracker** using the Pokémon TCG API (pokemontcg.io).

## Publishing
- Live site via GitHub Pages: https://poochyb.github.io/Pokemon/ (Artist Binder) and /collection.html.
- Pages serves the branch `claude/pokemon-tcg-collection-ws1czw` (also the repo's default branch). Changes only go live once they are on that branch.

## Testing notes
- Cloud sessions can't reach api.tcgdex.net or api.pokemontcg.io (egress blocked). Test in Playwright with mocked API responses, and tell the owner what couldn't be verified live.
- Don't break existing saved data: keep the localStorage key and backup format compatible.

## Known issues
- Many cards show "No price data": TCGdex returns `pricing: null` for cards it hasn't linked to TCGplayer/Cardmarket (e.g. SVP promos, some older sets). A fallback price source is being considered.
