import type { HistoryEntry } from "./types";

const HISTORY_KEY = "vgp.history.v1";
const PREFS_KEY = "vgp.prefs.v1";

export interface Prefs {
  lang: "id" | "en";
  theme: "light" | "dark" | "system";
}

const DEFAULT_PREFS: Prefs = { lang: "id", theme: "system" };

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]) {
  try {
    // Keep at most 50 most-recent entries.
    const trimmed = entries.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

export function appendHistory(entry: HistoryEntry): HistoryEntry[] {
  const current = loadHistory();
  const filtered = current.filter((e) => e.id !== entry.id);
  const next = [entry, ...filtered];
  saveHistory(next);
  return next;
}

export function removeHistoryEntry(id: string): HistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  saveHistory(next);
  return next;
}

export function clearHistory() {
  saveHistory([]);
}
