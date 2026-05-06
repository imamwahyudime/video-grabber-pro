export type Theme = "light" | "dark" | "system";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", dark);
}

export function watchSystemTheme(theme: Theme, cb: () => void): () => void {
  if (theme !== "system") return () => undefined;
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => cb();
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}
