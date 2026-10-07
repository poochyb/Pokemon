# Pokémon TCG Collection

A simple tracker for your Pokémon Trading Card Game collection. It runs in your web browser, and there's nothing to install.

## How to open it

1. Download this project to your computer (see "Getting it onto your Mac" below).
2. Double-click `index.html`. It opens in your web browser.

## What it does

- **Find Cards**: search real Pokémon cards by name (and optionally by set). You'll see the card picture, set, rarity and current market price. Click **Add to collection**.
- **My Collection**: see every card you own, with totals and an estimated value. You can:
  - change how many copies you have with **−** / **+**
  - set the condition (Mint, Near Mint, …)
  - add notes
  - filter and sort the list
- **Add Manually**: for cards the search can't find, or when you're offline.
- **Backup**: download your collection as a file, or restore it from one.

Card data and prices come from the free [Pokémon TCG API](https://pokemontcg.io), which uses TCGplayer market prices in US dollars.

> **Important:** your collection is saved inside the browser you use, on that computer.
> If you clear your browser data or switch browsers, it won't carry over, so use **Backup → Download backup** now and then.

## Getting it onto your Mac (first time)

Open the **Terminal** app and paste:

```bash
cd ~/Documents/Claude_Work
git clone https://github.com/poochyb/Pokemon.git Pokemon_TCG_Collection
cd Pokemon_TCG_Collection
git checkout claude/pokemon-tcg-collection-ws1czw
open index.html
```

To get later updates, run this inside that folder:

```bash
git pull
```

## Files

| File         | What it is                                  |
|--------------|---------------------------------------------|
| `index.html` | The page layout                             |
| `style.css`  | Colors and styling                          |
| `app.js`     | The logic: search, saving, totals, backups  |
