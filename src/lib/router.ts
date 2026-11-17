import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  addEventListener("hashchange", cb);
  return () => removeEventListener("hashchange", cb);
};
const snapshot = () => location.hash || "#/";

export function useRoute(): { path: string; parts: string[]; query: URLSearchParams } {
  const hash = useSyncExternalStore(subscribe, snapshot);
  const [pathRaw, q = ""] = hash.replace(/^#/, "").split("?");
  const path = pathRaw || "/";
  return { path, parts: path.split("/").filter(Boolean), query: new URLSearchParams(q) };
}

/** Scroll to an element on the current page. A plain "#id" link would be read as a route. */
export function jump(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

export const href = (path: string) => `#${path}`;
export const go = (path: string) => {
  location.hash = path;
};
