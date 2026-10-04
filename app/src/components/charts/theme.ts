"use client";

import { useEffect, useState } from "react";

export const CHART = {
  accent: { css: "--accent", fallback: "#163a5f" },
  blue: { css: "--blue", fallback: "#2f5c86" },
  cyan: { css: "--cyan", fallback: "#2b7a78" },
  red: { css: "--red", fallback: "#b23a48" },
  green: { css: "--green", fallback: "#2f7a55" },
  orange: { css: "--orange", fallback: "#9a6b1f" },
  grid: { css: "--grid-line", fallback: "rgba(120,135,150,.20)" },
  axis: { css: "--text-muted", fallback: "#55637a" },
  label: { css: "--text", fallback: "#17232f" },
  track: { css: "--bar-track", fallback: "rgba(22,58,95,.16)" },
} as const;

export const SERIES = {
  class: { healthy: "accent", diabetic: "red" },
} as const;

export type ChartRole = keyof typeof CHART;
export type ChartTheme = Record<ChartRole, string>;

function fallbackTheme(): ChartTheme {
  return Object.fromEntries(Object.entries(CHART).map(([key, token]) => [key, token.fallback])) as ChartTheme;
}

function readTheme(): ChartTheme {
  if (typeof window === "undefined") return fallbackTheme();
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(CHART).map(([key, token]) => [key, style.getPropertyValue(token.css).trim() || token.fallback]),
  ) as ChartTheme;
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(fallbackTheme);

  useEffect(() => {
    const update = () => setTheme(readTheme());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    window.addEventListener("themechange", update);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      window.removeEventListener("themechange", update);
    };
  }, []);

  return theme;
}
