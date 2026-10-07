# Pokémon TCG Projects

Two browser apps for Pokémon Trading Card Game collecting. There's nothing to install.

**Bookmark these:**
- Artist Binder: https://poochyb.github.io/Pokemon/
- Collection Tracker: https://poochyb.github.io/Pokemon/collection.html

## Artist Binder (`index.html`)

Pick Pokémon card artists and see every card they illustrated, using data from TCGdex.
Tap a card to mark it Owned or Missing and track your progress per artist.

## Collection Tracker (`collection.html`)

A simple tracker for every card you own, with prices.

- **Find Cards**: search real Pokémon cards by name (and optionally by set). You'll see the card picture, set, rarity and current market price. Click **Add to collection**.
- **My Collection**: see every card you own, with totals and an estimated value. You can:
  - change how many copies you have with **−** / **+**
  - set the condition (Mint, Near Mint, …)
  - add notes
  - filter and sort the list
- **Add Manually**: for cards the search can't find, or when you're offline.
- **Backup**: download your collection as a file, or restore it from one.

Card data and prices come from the free [Pokémon TCG API](https://pokemontcg.io), which uses TCGplayer market prices in US dollars.

> **Important:** for both apps, your data is saved inside the browser you use, on that computer.
> If you clear your browser data or switch browsers, it won't carry over, so use **Backup → Download backup** now and then.

## Getting it onto your Mac (first time)

Open the **Terminal** app and paste:

```bash
cd ~/Documents/Claude_Work
git clone https://github.com/poochyb/Pokemon.git Pokemon_TCG_Collection
cd Pokemon_TCG_Collection
git checkout claude/pokemon-tcg-collection-ws1czw
open collection.html
```

To get later updates, run this inside that folder:

```bash
git pull
```

## Files

| File              | What it is                                  |
|-------------------|---------------------------------------------|
| `index.html`      | Artist Binder (everything in one file)      |
| `collection.html` | Collection Tracker page layout              |
| `style.css`       | Collection Tracker colors and styling       |
| `app.js`          | Collection Tracker logic                    |
