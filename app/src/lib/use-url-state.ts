"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type HistoryMode = "push" | "replace";

function currentRelativeUrl(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

export function useUrlState<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: string) => boolean,
) {
  const validatorRef = useRef(isValid);
  validatorRef.current = isValid;
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const syncFromUrl = () => {
      const candidate = new URL(window.location.href).searchParams.get(key);
      setValue(candidate && validatorRef.current(candidate) ? candidate as T : fallback);
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [fallback, key]);

  const update = useCallback((next: T, mode: HistoryMode = "push") => {
    const url = new URL(window.location.href);
    if (next === fallback) url.searchParams.delete(key);
    else url.searchParams.set(key, next);

    const nextUrl = currentRelativeUrl(url);
    const currentUrl = currentRelativeUrl(new URL(window.location.href));
    if (nextUrl !== currentUrl) window.history[`${mode}State`]({}, "", nextUrl);
    setValue(next);
  }, [fallback, key]);

  return [value, update] as const;
}

export function clearUrlState(keys: string[]) {
  const url = new URL(window.location.href);
  keys.forEach((key) => url.searchParams.delete(key));
  const nextUrl = currentRelativeUrl(url);
  const currentUrl = currentRelativeUrl(new URL(window.location.href));
  if (nextUrl !== currentUrl) window.history.pushState({}, "", nextUrl);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
