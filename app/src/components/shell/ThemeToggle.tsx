"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@/lib/icons";

type Theme = "light" | "dark";

function detectTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => setTheme(detectTheme()), []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("diabetes-theme", next);
    setTheme(next);
    window.dispatchEvent(new CustomEvent("themechange"));
  }

  return (
    <button className="icon-button" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={toggleTheme}>
      {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    </button>
  );
}
