// Pokémon TCG Collection tracker
// Everything runs in your browser. Your collection is saved with localStorage,
// and card data/images come from the free Pokémon TCG API (https://pokemontcg.io).

const STORAGE_KEY = "pokemon-tcg-collection";
const API_URL = "https://api.pokemontcg.io/v2/cards";
const CONDITIONS = ["Mint", "Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"];

// ---------- Saving and loading ----------

function loadCollection() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCollection() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
  } catch {
    showToast("Couldn't save. Download a backup to be safe.");
  }
}

let collection = loadCollection();

// ---------- Small helpers ----------

const $ = (selector) => document.querySelector(selector);

// Creates an element. Using textContent (not innerHTML) keeps card text safe to display.
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of [].concat(children)) {
    if (child != null) node.append(child);
  }
  return node;
}

function formatMoney(amount) {
  return "$" + (amount || 0).toFixed(2);
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// The API lists prices per print (holo, reverse holo, etc.). Take the first market price we find.
function marketPrice(apiCard) {
  const prices = apiCard.tcgplayer?.prices;
  if (!prices) return null;
  const preferred = ["holofoil", "normal", "reverseHolofoil", "1stEditionHolofoil", "1stEditionNormal"];
  const variants = [...preferred, ...Object.keys(prices)];
  for (const variant of variants) {
    const price = prices[variant]?.market ?? prices[variant]?.mid;
    if (typeof price === "number") return price;
  }
  return null;
}

function cardImage(card, size = "small") {
  const src = size === "large" ? card.imageLarge || card.image : card.image;
  if (!src) return el("div", { className: "no-image", textContent: "No image" });
  return el("img", { src, alt: card.name, loading: "lazy" });
}

// ---------- Tabs ----------

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".panel").forEach((p) => {
      p.classList.toggle("active", p.id === "tab-" + tab.dataset.tab);
    });
  });
});

// ---------- Adding cards ----------

function addToCollection(card) {
  // If you already own this exact card, just bump the quantity.
  const existing = collection.find((c) => c.id === card.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    collection.push({
      condition: "Near Mint",
      notes: "",
      ...card,
      quantity: 1,
      addedAt: Date.now(),
    });
  }
  saveCollection();
  renderCollection();
  showToast(`Added ${card.name}`);
}

// Convert a card from the API into the shape we store.
function fromApiCard(apiCard) {
  return {
    id: apiCard.id,
    name: apiCard.name,
    set: apiCard.set?.name || "",
    series: apiCard.set?.series || "",
    number: apiCard.number || "",
    rarity: apiCard.rarity || "",
    image: apiCard.images?.small || "",
    imageLarge: apiCard.images?.large || "",
    price: marketPrice(apiCard),
  };
}

// ---------- Collection view ----------

function renderCollection() {
  const filterText = $("#filter").value.trim().toLowerCase();
  const sortBy = $("#sort").value;

  // Stats are always for the whole collection, not just what the filter shows.
  const totalCards = collection.reduce((sum, c) => sum + c.quantity, 0);
  const totalValue = collection.reduce((sum, c) => sum + (c.price || 0) * c.quantity, 0);
  $("#stat-unique").textContent = collection.length;
  $("#stat-total").textContent = totalCards;
  $("#stat-value").textContent = formatMoney(totalValue);

  let cards = collection.filter((c) =>
    [c.name, c.set, c.rarity, c.number].join(" ").toLowerCase().includes(filterText)
  );

  const sorters = {
    added: (a, b) => b.addedAt - a.addedAt,
    name: (a, b) => a.name.localeCompare(b.name),
    set: (a, b) => a.set.localeCompare(b.set) || a.number.localeCompare(b.number, undefined, { numeric: true }),
    value: (a, b) => (b.price || 0) - (a.price || 0),
  };
  cards = [...cards].sort(sorters[sortBy]);

  $("#empty-collection").hidden = collection.length > 0;
  $("#collection-list").replaceChildren(...cards.map(collectionCard));
}

function collectionCard(card) {
  const qtyLabel = el("span", { textContent: card.quantity });

  const minus = el("button", { textContent: "−", title: "One fewer" });
  minus.addEventListener("click", () => {
    if (card.quantity > 1) {
      card.quantity -= 1;
      saveCollection();
      renderCollection();
    } else {
      removeCard(card);
    }
  });

  const plus = el("button", { textContent: "+", title: "One more" });
  plus.addEventListener("click", () => {
    card.quantity += 1;
    saveCollection();
    renderCollection();
  });

  const condition = el(
    "select",
    { title: "Condition" },
    CONDITIONS.map((c) => el("option", { value: c, textContent: c, selected: c === card.condition }))
  );
  condition.addEventListener("change", () => {
    card.condition = condition.value;
    saveCollection();
  });

  const notes = el("textarea", { value: card.notes || "", placeholder: "Notes", rows: 1 });
  notes.addEventListener("change", () => {
    card.notes = notes.value;
    saveCollection();
  });

  const remove = el("button", { className: "remove", textContent: "Remove" });
  remove.addEventListener("click", () => removeCard(card));

  const priceText = card.price != null
    ? `${formatMoney(card.price)} each · ${formatMoney(card.price * card.quantity)} total`
    : "No price available";

  return el("article", { className: "card" }, [
    cardImage(card),
    el("h3", { textContent: card.name }),
    el("div", { className: "meta", textContent: [card.set, card.number && "#" + card.number, card.rarity].filter(Boolean).join(" · ") }),
    el("div", { className: "price", textContent: priceText }),
    el("div", { className: "qty" }, [minus, qtyLabel, plus]),
    condition,
    notes,
    remove,
  ]);
}

function removeCard(card) {
  if (!confirm(`Remove ${card.name} from your collection?`)) return;
  collection = collection.filter((c) => c.id !== card.id);
  saveCollection();
  renderCollection();
}

$("#filter").addEventListener("input", renderCollection);
$("#sort").addEventListener("change", renderCollection);

// ---------- Online search ----------

// Remove characters that would break the API's search syntax.
const cleanTerm = (text) => text.replace(/["\\:()[\]{}]/g, " ").trim();

function buildQuery(name, set) {
  const parts = [];
  // Multi-word names need quotes; single words get a wildcard so "char" finds "Charizard".
  parts.push(name.includes(" ") ? `name:"${name}"` : `name:${name}*`);
  if (set) parts.push(set.includes(" ") ? `set.name:"${set}"` : `set.name:${set}*`);
  return parts.join(" ");
}

$("#search-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = cleanTerm($("#search-name").value);
  const set = cleanTerm($("#search-set").value);
  if (!name) return;

  const status = $("#search-status");
  const results = $("#search-results");
  status.textContent = "Searching…";
  results.replaceChildren();

  const params = new URLSearchParams({
    q: buildQuery(name, set),
    pageSize: "48",
    orderBy: "-set.releaseDate",
  });

  try {
    const response = await fetch(`${API_URL}?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { data } = await response.json();

    if (!data.length) {
      status.textContent = "No cards found. Check the spelling, or add it manually.";
      return;
    }
    status.textContent = `Found ${data.length} card${data.length === 1 ? "" : "s"}${data.length === 48 ? " (showing first 48, add a set to narrow it down)" : ""}.`;
    results.replaceChildren(...data.map((apiCard) => searchResultCard(fromApiCard(apiCard))));
  } catch (error) {
    console.error(error);
    status.textContent = "Couldn't reach the card database. Check your internet connection and try again, or add the card manually.";
  }
});

function searchResultCard(card) {
  const owned = collection.find((c) => c.id === card.id);
  const add = el("button", { className: "primary", textContent: owned ? `Add another (own ${owned.quantity})` : "Add to collection" });
  add.addEventListener("click", () => {
    addToCollection(card);
    const nowOwned = collection.find((c) => c.id === card.id);
    add.textContent = `Add another (own ${nowOwned.quantity})`;
  });

  return el("article", { className: "card" }, [
    cardImage(card),
    el("h3", { textContent: card.name }),
    el("div", { className: "meta", textContent: [card.set, card.number && "#" + card.number, card.rarity].filter(Boolean).join(" · ") }),
    el("div", { className: "price", textContent: card.price != null ? formatMoney(card.price) : "No price available" }),
    add,
  ]);
}

// ---------- Manual add ----------

$("#manual-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  const price = parseFloat(data.price);

  addToCollection({
    id: "manual-" + Date.now(),
    name: data.name.trim(),
    set: data.set.trim(),
    series: "",
    number: data.number.trim(),
    rarity: data.rarity.trim(),
    image: data.image.trim(),
    imageLarge: "",
    price: Number.isFinite(price) ? price : null,
  });
  form.reset();
});

// ---------- Backup ----------

$("#export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" });
  const link = el("a", {
    href: URL.createObjectURL(blob),
    download: `pokemon-collection-${new Date().toISOString().slice(0, 10)}.json`,
  });
  link.click();
  URL.revokeObjectURL(link.href);
});

$("#import-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported) || !imported.every((c) => c && c.id && c.name)) {
      throw new Error("Not a collection file");
    }
    if (!confirm(`Replace your current collection with ${imported.length} cards from this backup?`)) return;
    collection = imported.map((c) => ({
      ...c,
      quantity: Math.max(1, parseInt(c.quantity, 10) || 1),
      addedAt: c.addedAt || Date.now(),
      set: c.set || "",
      number: String(c.number || ""),
    }));
    saveCollection();
    renderCollection();
    showToast("Backup restored");
  } catch {
    alert("That file doesn't look like a collection backup.");
  } finally {
    event.target.value = "";
  }
});

// ---------- Start ----------

renderCollection();
