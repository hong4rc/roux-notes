// Hand-drawn style line icons. One stroke weight and one size for all of them, so they sit together
// on every page. Decorative by default (aria-hidden); a button that shows only an icon must pass a label.
import type { CSSProperties } from "react";

const PATHS: Record<string, string[]> = {
  search: ["M10.5 4.5a6 6 0 1 1-.1 0", "M15 15l5.5 5.5"],
  blocks: ["M3.5 13.5h9v6h-9z", "M12.5 7.5h8v6h-8z", "M12.5 13.5v6h8v-6"],
  puzzle: ["M4 8h4.5a2 2 0 1 1 4 0H17v4.5a2 2 0 1 1 0 4V20H4z"],
  dial: ["M12 3.5a8.5 8.5 0 1 1-.1 0", "M12 12l0-5", "M12 12l4 2.5"],
  scroll: ["M6 4.5h11.5v13.5a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2z", "M9 9h6", "M9 13h6"],
  dice: ["M4.5 4.5h15v15h-15z", "M8.5 8.5h.1", "M12 12h.1", "M15.5 15.5h.1"],
  list: ["M5 6.5h.1", "M5 12h.1", "M5 17.5h.1", "M9 6.5h10", "M9 12h10", "M9 17.5h7"],
  book: ["M3.5 5.5c3-1 5.5-1 8.5 1 3-2 5.5-2 8.5-1v13c-3-1-5.5-1-8.5 1-3-2-5.5-2-8.5-1z", "M12 6.5v13"],
  why: ["M9.5 9.5a2.6 2.6 0 1 1 3.8 2.3c-.8.4-1.3 1-1.3 1.9v.8", "M12 17.8h.1"],
  tip: ["M9.5 18h5", "M10.5 21h3", "M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.6.5.9 1.1.9 1.8v.7h5v-.7c0-.7.3-1.3.9-1.8A5.8 5.8 0 0 0 12 3.5z"],
  warn: ["M12 4.5l8.5 14.5h-17z", "M12 10v4", "M12 16.8h.1"],
  info: ["M12 3.5a8.5 8.5 0 1 1-.1 0", "M12 11v5.5", "M12 7.8h.1"],
  reroll: ["M19.5 12a7.5 7.5 0 1 1-2.2-5.3", "M19.5 4v4.2h-4.2"],
  copy: ["M8.5 8.5h11v11h-11z", "M15.5 8.5V5h-11v11h3.5"],
  palette: ["M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.1-.9-1.6-.9-2.7 0-.9.7-1.6 1.6-1.6h2.1a4 4 0 0 0 4-4c0-4.2-3.8-7-8.6-7z", "M7.5 11h.1", "M10.5 7.5h.1", "M15 8.5h.1"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  cross: ["M6 6l12 12", "M18 6L6 18"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className, style }: { name: IconName; className?: string; style?: CSSProperties }) {
  return (
    <svg
      className={`icon ${className ?? ""}`}
      style={style}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
