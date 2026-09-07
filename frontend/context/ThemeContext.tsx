"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

// CSS variables for each theme – applied inline on <html> for guaranteed effect
const DARK_VARS: Record<string, string> = {
  "--bg-base": "#0d1117",
  "--bg-surface": "#161b22",
  "--bg-elevated": "#21262d",
  "--bg-overlay": "#30363d",
  "--border": "#30363d",
  "--border-subtle": "#21262d",
  "--text-primary": "#f0f6fc",
  "--text-secondary": "#8b949e",
  "--text-muted": "#6b7280",
  "--accent": "#6366f1",
  "--accent-light": "#818cf8",
  "--accent-dark": "#4f46e5",
  "--accent-muted": "rgba(99, 102, 241, 0.15)",
  "--status-active": "#10b981",
  "--status-active-bg": "rgba(16, 185, 129, 0.12)",
  "--status-warn": "#f59e0b",
  "--status-warn-bg": "rgba(245, 158, 11, 0.12)",
  "--status-danger": "#ef4444",
  "--status-danger-bg": "rgba(239, 68, 68, 0.12)",
  "--status-info": "#3b82f6",
  "--status-info-bg": "rgba(59, 130, 246, 0.12)",
  "--status-muted": "#6b7280",
  "--status-muted-bg": "rgba(107, 114, 128, 0.12)",
};

const LIGHT_VARS: Record<string, string> = {
  "--bg-base": "#f4f6fb",
  "--bg-surface": "#ffffff",
  "--bg-elevated": "#eef0f6",
  "--bg-overlay": "#e2e6f0",
  "--border": "#dde1ec",
  "--border-subtle": "#eaecf4",
  "--text-primary": "#1a2033",
  "--text-secondary": "#4b5675",
  "--text-muted": "#8592a8",
  "--accent": "#6366f1",
  "--accent-light": "#6366f1",
  "--accent-dark": "#4f46e5",
  "--accent-muted": "rgba(99, 102, 241, 0.1)",
  "--status-active": "#059669",
  "--status-active-bg": "rgba(5, 150, 105, 0.1)",
  "--status-warn": "#d97706",
  "--status-warn-bg": "rgba(217, 119, 6, 0.1)",
  "--status-danger": "#dc2626",
  "--status-danger-bg": "rgba(220, 38, 38, 0.1)",
  "--status-info": "#2563eb",
  "--status-info-bg": "rgba(37, 99, 235, 0.1)",
  "--status-muted": "#6b7280",
  "--status-muted-bg": "rgba(107, 114, 128, 0.1)",
};

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const vars = t === "light" ? LIGHT_VARS : DARK_VARS;
  Object.entries(vars).forEach(([prop, val]) =>
    root.style.setProperty(prop, val),
  );
  root.setAttribute("data-theme", t);
  // Propagate body background immediately
  document.body.style.background = vars["--bg-base"];
  document.body.style.color = vars["--text-primary"];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (localStorage.getItem("evalia_admin_theme") as Theme | null)
        : null;
    const resolved: Theme =
      saved === "light" || saved === "dark" ? saved : "dark";
    setThemeState(resolved);
    applyTheme(resolved);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("evalia_admin_theme", t);
    applyTheme(t);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
