// Lightweight per-user color theme stored in localStorage.
// The Layout reads CSS variables --app-theme-from / --to / --accent on mount;
// the Settings page calls setTheme() to switch instantly.

const THEMES = [
  { key: "sunset",  label: "Sunset",  from: "#7c2d12", to: "#78350f", accent: "#fb923c" },
  { key: "ocean",   label: "Ocean",   from: "#1e3a8a", to: "#0e7490", accent: "#38bdf8" },
  { key: "forest",  label: "Forest",  from: "#064e3b", to: "#14532d", accent: "#34d399" },
  { key: "berry",   label: "Berry",   from: "#581c87", to: "#701a75", accent: "#c084fc" },
  { key: "slate",   label: "Slate",   from: "#1e293b", to: "#0f172a", accent: "#94a3b8" },
  { key: "rose",    label: "Rose",     from: "#881337", to: "#831843", accent: "#fb7185" },
];

const STORAGE_KEY = "flowship_theme";

export function getThemes() {
  return THEMES;
}

export function getActiveThemeKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "sunset";
  } catch {
    return "sunset";
  }
}

export function getActiveTheme() {
  return THEMES.find((t) => t.key === getActiveThemeKey()) || THEMES[0];
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--app-theme-from", theme.from);
  root.style.setProperty("--app-theme-to", theme.to);
  root.style.setProperty("--app-theme-accent", theme.accent);
}

export function setTheme(key) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* ignore */
  }
  const theme = THEMES.find((t) => t.key === key) || THEMES[0];
  applyTheme(theme);
  window.dispatchEvent(new Event("theme-change"));
}