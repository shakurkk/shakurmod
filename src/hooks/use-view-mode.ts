import { useEffect, useState } from "react";

export type ViewMode = "grid" | "list";
const KEY = "shakurmod:view";

// Some browsers (e.g. Samsung Internet inside a shared preview frame) block storage
// and throw on access; never let that crash the page.
function readSaved(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function useViewMode() {
  const [mode, setMode] = useState<ViewMode>("grid");
  useEffect(() => {
    const saved = readSaved();
    if (saved === "grid" || saved === "list") setMode(saved);
  }, []);
  const update = (m: ViewMode) => {
    setMode(m);
    try {
      window.localStorage.setItem(KEY, m);
    } catch {
      /* storage blocked: keep the choice for this visit only */
    }
  };
  return [mode, update] as const;
}
