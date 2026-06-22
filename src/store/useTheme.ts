import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "chinook-theme";

/** Read the persisted theme, falling back to light (the SaaS default). */
function readStoredTheme(): Theme {
  if (typeof localStorage === "undefined") return "light";
  return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

/** Reflect the active theme onto <html data-theme> so the CSS variables switch. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme"); // light is the :root default
}

/**
 * Light/dark theme with localStorage persistence. The inline script in
 * index.html sets data-theme before first paint to avoid a flash; this hook
 * keeps React in sync and owns toggling thereafter.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle };
}
