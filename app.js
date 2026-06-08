const STORAGE_KEY = "simple-slot-counter-v1";
const CURRENT_VERSION = 1;
const COUNTER_KEYS = ["a", "b", "c", "d", "e", "f"];

const defaultState = () => ({
  version: CURRENT_VERSION,
  game: 0,
  counters: {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
    f: 0,
  },
  minusMode: false,
  updatedAt: new Date().toISOString(),
});

function clampCount(value) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function normalizeState(raw) {
  const base = defaultState();
  const source = raw && typeof raw === "object" ? raw : {};
  const counters = source.counters && typeof source.counters === "object" ? source.counters : {};

  return {
    version: typeof source.version === "number" ? source.version : base.version,
    game: clampCount(source.game),
    counters: {
      a: clampCount(counters.a),
      b: clampCount(counters.b),
      c: clampCount(counters.c),
      d: clampCount(counters.d),
      e: clampCount(counters.e),
      f: clampCount(counters.f),
    },
    minusMode: Boolean(source.minusMode),
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : base.updatedAt,
  };
}

function loadState() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const initial = defaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const normalized = normalizeState(JSON.parse(existing));
    if (JSON.stringify(normalized) !== existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    const fallback = defaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

let state = loadState();

const minusToggle = document.getElementById("minusToggle");
const resetButton = document.getElementById("resetButton");
const counterButtons = Array.from(document.querySelectorAll(".counter-button"));

function saveState() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  minusToggle.classList.toggle("active", state.minusMode);
  minusToggle.setAttribute("aria-pressed", String(state.minusMode));
  document.body.classList.toggle("minus-mode", state.minusMode);

  COUNTER_KEYS.forEach((key) => {
    document.getElementById(`count-${key}`).textContent = String(state.counters[key]);
  });
}

function applyDelta(currentValue) {
  if (state.minusMode) {
    return Math.max(0, currentValue - 1);
  }
  return currentValue + 1;
}

function updateCounter(key) {
  state.counters[key] = applyDelta(state.counters[key]);
  saveState();
  render();
}

function toggleMinusMode() {
  state.minusMode = !state.minusMode;
  saveState();
  render();
}

function resetAll() {
  if (!window.confirm("\u5168\u3066\u306E\u30AB\u30A6\u30F3\u30BF\u30FC\u3092\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3059\u304B\uFF1F")) {
    return;
  }

  state = {
    ...state,
    game: 0,
    counters: COUNTER_KEYS.reduce((next, key) => {
      next[key] = 0;
      return next;
    }, {}),
  };
  saveState();
  render();
}

minusToggle.addEventListener("click", toggleMinusMode);
resetButton.addEventListener("click", resetAll);
counterButtons.forEach((button) => {
  button.addEventListener("click", () => updateCounter(button.dataset.key));
});

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
