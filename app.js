const state = {
  champions: [],
  normalizedMap: new Map(),
  secretChampion: null,
  guesses: [],
  gameWon: false,
};

const input = document.getElementById("champion-input");
const guessBtn = document.getElementById("guess-btn");
const newGameBtn = document.getElementById("new-game-btn");
const suggestionsEl = document.getElementById("suggestions");
const statusText = document.getElementById("status-text");
const attemptsBody = document.getElementById("attempts-body");
const attemptCounter = document.getElementById("attempt-counter");
const patchBadge = document.getElementById("patch-badge");
const championsGallery = document.getElementById("champions-gallery");
const remainingCount = document.getElementById("remaining-count");
const suggestionTemplate = document.getElementById("suggestion-template");

const GENDER_LABELS = {
  Male: "Hombre",
  Female: "Mujer",
  Other: "Otra cosa",
};

const POSITION_LABELS = {
  Top: "Top",
  Jungle: "Jungla",
  Middle: "Mid",
  Bottom: "Bot",
  Support: "Soporte",
};

const RESOURCE_LABELS = {
  Mana: "Man\u00e1",
  Energy: "Energ\u00eda",
  Fury: "Furia",
  Heat: "Calor",
  Shield: "Escudo",
  Courage: "Valent\u00eda",
  Ferocity: "Ferocidad",
  Flow: "Flujo",
  Grit: "Aguante",
  BloodWell: "Pozo de sangre",
  CrimsonRush: "Oleada carmes\u00ed",
  Manaless: "Sin man\u00e1",
  None: "Sin recurso",
};

const REGION_LABELS = {
  BandleCity: "Ciudad de Bandle",
  Bilgewater: "Aguas Estancadas",
  Demacia: "Demacia",
  Freljord: "Freljord",
  Icahtia: "Icathia",
  Ionia: "Jonia",
  Ixtal: "Ixtal",
  Noxus: "Noxus",
  Piltover: "Piltover",
  Runeterra: "Runaterra",
  ShadowIsles: "Islas de la Sombra",
  "Shadow Isles": "Islas de la Sombra",
  Shurima: "Shurima",
  Targon: "Targ\u00f3n",
  TheVoid: "Vac\u00edo",
  Void: "Vac\u00edo",
  Zaun: "Zaun",
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined || value === "") {
    return [];
  }
  return [value];
}

function normalizeRangeType(value) {
  if (value === "M") {
    return "Melee";
  }
  if (value === "R") {
    return "Ranged";
  }
  return value;
}

function labelGender(value) {
  return GENDER_LABELS[value] || value || "Otra cosa";
}

function labelPosition(value) {
  return POSITION_LABELS[value] || value || "Sin posici\u00f3n";
}

function labelResource(value) {
  return RESOURCE_LABELS[value] || value || "Sin recurso";
}

function labelRegion(value) {
  return REGION_LABELS[value] || value || "Sin regi\u00f3n";
}

function labelRangeType(value) {
  const normalized = normalizeRangeType(value);
  if (normalized === "Melee") {
    return "Melee";
  }
  if (normalized === "Ranged") {
    return "Rango";
  }
  return normalized || "Sin dato";
}

function getRandomChampion() {
  return state.champions[Math.floor(Math.random() * state.champions.length)];
}

function updateStatus(message, isWinner = false) {
  statusText.textContent = message;
  statusText.classList.toggle("winner-banner", isWinner);
}

function updateRemainingCount() {
  if (!remainingCount) {
    return;
  }

  const available = Math.max(0, state.champions.length - state.guesses.length);
  remainingCount.textContent = `(${available})`;
}

function startNewGame() {
  state.secretChampion = getRandomChampion();
  state.guesses = [];
  state.gameWon = false;
  renderChampionsGallery(state.champions);
  updateRemainingCount();
  input.value = "";
  suggestionsEl.innerHTML = "";
  attemptsBody.innerHTML = "";
  attemptCounter.textContent = "0 intentos";
  updateStatus("Nueva partida lista. Empieza a escribir un campe\u00f3n.");
  input.focus();
}

function renderSuggestions(matches, rawQuery) {
  suggestionsEl.innerHTML = "";

  if (!rawQuery) {
    return;
  }

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "suggestion-item";
    empty.textContent = "No hay coincidencias";
    empty.setAttribute("aria-disabled", "true");
    suggestionsEl.appendChild(empty);
    return;
  }

  matches.slice(0, 18).forEach((champion) => {
    const button = suggestionTemplate.content.firstElementChild.cloneNode(true);
    button.textContent = champion.name;
    button.addEventListener("click", () => {
      input.value = champion.name;
      suggestionsEl.innerHTML = "";
      submitGuess();
    });
    suggestionsEl.appendChild(button);
  });
}

function renderChampionsGallery(champions) {
  if (!championsGallery) {
    return;
  }

  championsGallery.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const sortedChampions = [...champions].sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );

  sortedChampions.forEach((champion) => {
    const figure = document.createElement("figure");
    figure.className = "champion-thumb";
    figure.dataset.championId = champion.id;
    figure.title = "Doble clic para probar";
    figure.addEventListener("dblclick", () => {
      if (!state.secretChampion || state.gameWon) {
        return;
      }

      if (state.guesses.some((item) => item.id === champion.id)) {
        return;
      }

      input.value = champion.name;
      suggestionsEl.innerHTML = "";
      submitGuess();
    });

    const image = document.createElement("img");
    image.src = champion.image;
    image.alt = champion.name;
    image.loading = "lazy";

    const caption = document.createElement("figcaption");
    caption.textContent = champion.name;

    figure.appendChild(image);
    figure.appendChild(caption);
    fragment.appendChild(figure);
  });

  championsGallery.appendChild(fragment);
}

function removeChampionFromGallery(championId) {
  if (!championsGallery) {
    return;
  }

  for (const thumb of championsGallery.querySelectorAll(".champion-thumb")) {
    if (thumb.dataset.championId === championId) {
      thumb.remove();
      break;
    }
  }
}

function getSuggestionMatches(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return [];
  }

  const guessedIds = new Set(state.guesses.map((champion) => champion.id));

  return state.champions.filter(
    (champion) =>
      !guessedIds.has(champion.id) &&
      normalizeText(champion.name).includes(normalizedQuery)
  );
}

function compareValue(guessValue, targetValue) {
  return guessValue === targetValue ? "exact" : "wrong";
}

function compareYear(guessValue, targetValue) {
  if (guessValue === targetValue) {
    return { state: "exact", sub: "Coincide" };
  }

  if (guessValue < targetValue) {
    return {
      state: "high",
      sub: `Sali\u00f3 ${targetValue - guessValue} a\u00f1os despu\u00e9s`,
    };
  }

  return {
    state: "low",
    sub: `Sali\u00f3 ${guessValue - targetValue} a\u00f1os antes`,
  };
}

function compareList(guessList, targetList) {
  const guess = normalizeList(guessList);
  const target = normalizeList(targetList);
  const guessSorted = [...guess].sort();
  const targetSorted = [...target].sort();
  const exact =
    guessSorted.length === targetSorted.length &&
    guessSorted.every((item, index) => item === targetSorted[index]);

  if (exact) {
    return { state: "exact", sub: "Coincide" };
  }

  const shared = guess.filter((item) => target.includes(item));
  if (shared.length) {
    return {
      state: "partial",
      sub: `Comparte ${shared.length} ${shared.length === 1 ? "dato" : "datos"}`,
    };
  }

  return { state: "wrong", sub: "No coincide" };
}

function createCell(content, stateClass, subText = "") {
  const td = document.createElement("td");
  td.className = `state-${stateClass}`;

  const main = document.createElement("span");
  main.className = "cell-main";
  main.textContent = content;
  td.appendChild(main);

  if (subText) {
    const sub = document.createElement("span");
    sub.className = "cell-sub";
    sub.textContent = subText;
    td.appendChild(sub);
  }

  return td;
}

function renderGuessRow(guess) {
  const row = document.createElement("tr");
  const target = state.secretChampion;
  const guessPositions = normalizeList(guess.positions);
  const targetPositions = normalizeList(target.positions);
  const guessRegions = normalizeList(guess.regions);
  const targetRegions = normalizeList(target.regions);
  const guessRange = normalizeRangeType(guess.rangeType);
  const targetRange = normalizeRangeType(target.rangeType);

  const genderState = compareValue(guess.gender, target.gender);
  const yearState = compareYear(guess.releaseYear, target.releaseYear);
  const positionState = compareList(guessPositions, targetPositions);
  const rangeState = compareValue(guessRange, targetRange);
  const resourceState = compareValue(guess.resource, target.resource);
  const regionState = compareList(guessRegions, targetRegions);

  const championTd = document.createElement("td");
  championTd.className = guess.name === target.name ? "state-exact" : "state-wrong";
  championTd.innerHTML = `
    <div class="champion-cell">
      <img src="${guess.image}" alt="${guess.name}">
      <div>
        <div class="champion-name">${guess.name}</div>
        <div class="champion-id">Clave Riot: ${guess.key}</div>
      </div>
    </div>
  `;

  row.appendChild(championTd);
  row.appendChild(createCell(labelGender(guess.gender), genderState, genderState === "exact" ? "Coincide" : "Diferente"));
  row.appendChild(createCell(String(guess.releaseYear), yearState.state, yearState.sub));
  row.appendChild(createCell(guessPositions.map(labelPosition).join(", "), positionState.state, positionState.sub));
  row.appendChild(createCell(labelRangeType(guessRange), rangeState, rangeState === "exact" ? "Coincide" : "Diferente"));
  row.appendChild(createCell(labelResource(guess.resource), resourceState, resourceState === "exact" ? "Coincide" : "Diferente"));
  row.appendChild(createCell(guessRegions.map(labelRegion).join(", "), regionState.state, regionState.sub));

  attemptsBody.prepend(row);
}

function submitGuess() {
  if (!state.secretChampion || state.gameWon) {
    return;
  }

  const query = input.value;
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    updateStatus("Escribe un campe\u00f3n antes de probar.");
    return;
  }

  const guess = state.normalizedMap.get(normalizedQuery);

  if (!guess) {
    updateStatus("Ese nombre no coincide con un campe\u00f3n. Usa las sugerencias para ayudarte.");
    renderSuggestions(getSuggestionMatches(query), query);
    return;
  }

  if (state.guesses.some((item) => item.id === guess.id)) {
    updateStatus(`Ya probaste con ${guess.name}. Elige otro campe\u00f3n.`);
    return;
  }

  state.guesses.push(guess);
  removeChampionFromGallery(guess.id);
  updateRemainingCount();
  renderGuessRow(guess);
  attemptCounter.textContent = `${state.guesses.length} ${state.guesses.length === 1 ? "intento" : "intentos"}`;
  input.value = "";
  suggestionsEl.innerHTML = "";

  if (guess.id === state.secretChampion.id) {
    state.gameWon = true;
    updateStatus(`Has acertado en ${state.guesses.length} intentos. El campe\u00f3n era ${state.secretChampion.name}.`, true);
    return;
  }

  updateStatus(`${guess.name} no era. Sigue probando con las pistas.`);
  input.focus();
}

function bindEvents() {
  input.addEventListener("input", () => {
    renderSuggestions(getSuggestionMatches(input.value), input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitGuess();
    }
  });

  guessBtn.addEventListener("click", submitGuess);
  newGameBtn.addEventListener("click", startNewGame);
}

async function init() {
  try {
    const data = window.CHAMPION_DATA;
    if (!data || !Array.isArray(data.champions)) {
      throw new Error("Champion data unavailable");
    }

    state.champions = data.champions.map((champion) => ({
      ...champion,
      positions: normalizeList(champion.positions),
      regions: normalizeList(champion.regions),
      rangeType: normalizeRangeType(champion.rangeType),
    }));

    state.normalizedMap = new Map(
      state.champions.map((champion) => [normalizeText(champion.name), champion])
    );

    renderChampionsGallery(state.champions);
    patchBadge.textContent = `Parche oficial ${data.version}`;
    bindEvents();
    startNewGame();
  } catch (error) {
    console.error(error);
    updateStatus("No se pudieron cargar los campeones.");
    patchBadge.textContent = "Error al cargar";
    guessBtn.disabled = true;
    newGameBtn.disabled = true;
    if (remainingCount) {
      remainingCount.textContent = "(0)";
    }
    if (championsGallery) {
      championsGallery.innerHTML = '<p class="sidebar-loading">No se pudieron cargar los retratos.</p>';
    }
  }
}

init();
