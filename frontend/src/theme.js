import { useEffect, useState } from "react";

function initialTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Ripoti zichapishwe kila mara kwa rangi za mwanga
  useEffect(() => {
    let previous = null;
    const before = () => {
      previous = document.documentElement.getAttribute("data-bs-theme");
      document.documentElement.setAttribute("data-bs-theme", "light");
    };
    const after = () => {
      if (previous) document.documentElement.setAttribute("data-bs-theme", previous);
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}
