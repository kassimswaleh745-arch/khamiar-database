import { useTheme } from "../theme.js";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      className={"icon-btn theme-toggle " + className}
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle light or dark mode"
    >
      <i className={"bi " + (dark ? "bi-sun-fill" : "bi-moon-stars-fill")} />
    </button>
  );
}
