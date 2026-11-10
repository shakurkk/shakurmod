import { useEffect, useState } from "react";

export type ViewMode = "grid" | "list";
const KEY = "shakurmod:view";

export function useViewMode() {
  const [mode, setMode] = useState<ViewMode>("grid");
  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "grid" || saved === "list") setMode(saved);
  }, []);
  const update = (m: ViewMode) => {
    setMode(m);
    window.localStorage.setItem(KEY, m);
  };
  return [mode, update] as const;
}
