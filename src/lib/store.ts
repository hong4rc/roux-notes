import { useSyncExternalStore } from "react";
import { COLOR_NAMES, schemeFor, setScheme, type ColorName } from "./palette";

/** 2-look orientation groups that offer more than one algorithm */
export const ORIENT_CHOICES = ["L", "Pi", "H"] as const;
export type OrientChoice = (typeof ORIENT_CHOICES)[number];

export type Lang = "vi" | "en";

/** the four steps of the course that can be marked as finished */
export const STEP_IDS = ["first-block", "second-block", "cmll-2-look", "lse"] as const;
export type StepId = (typeof STEP_IDS)[number];

interface Settings {
  lang: Lang;
  theme: "light" | "dark";
  showWhy: boolean;
  learned: string[];
  /** course steps the learner marked as finished */
  stepsDone: StepId[];
  /** the learner has been asked, once, which colours their cube has */
  schemeAsked: boolean;
  /** index of the chosen algorithm for each corner swap of 2-look step 2 */
  perm: { adjacent: number; diagonal: number };
  /** index of the chosen algorithm for orientation groups that offer more than one (2-look step 1) */
  orient: Record<OrientChoice, number>;
  top: ColorName;
  front: ColorName;
  /** LSE practice: "easy" keeps to M' and M2 wherever that is possible, "std" uses M and M' as the guides do */
  lseHand: "std" | "easy";
}

const KEY = "roux-vn:settings:v1";
// Vietnamese is the primary language: it is the default whatever the browser says.
const defaults: Settings = { lang: "vi", theme: "light", showWhy: true, learned: [], stepsDone: [], schemeAsked: false, perm: { adjacent: 0, diagonal: 0 }, orient: { L: 0, Pi: 0, H: 0 }, top: "yellow", front: "green", lseHand: "easy" };

// saved data may be stale or hand-edited: keep only fields of the right shape
function sanitize(v: unknown): Settings {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const top = COLOR_NAMES.includes(o.top as ColorName) ? (o.top as ColorName) : defaults.top;
  const front = COLOR_NAMES.includes(o.front as ColorName) ? (o.front as ColorName) : defaults.front;
  const validPair = !!schemeFor(top, front);
  return {
    lang: o.lang === "en" || o.lang === "vi" ? o.lang : defaults.lang,
    theme: o.theme === "dark" || o.theme === "light" ? o.theme : defaults.theme,
    showWhy: typeof o.showWhy === "boolean" ? o.showWhy : defaults.showWhy,
    learned: Array.isArray(o.learned) ? o.learned.filter((x): x is string => typeof x === "string") : [],
    stepsDone: Array.isArray(o.stepsDone) ? STEP_IDS.filter((id) => (o.stepsDone as unknown[]).includes(id)) : [],
    schemeAsked: typeof o.schemeAsked === "boolean" ? o.schemeAsked : defaults.schemeAsked,
    perm: {
      adjacent: Number.isInteger((o.perm as any)?.adjacent) && (o.perm as any).adjacent >= 0 ? (o.perm as any).adjacent : 0,
      diagonal: Number.isInteger((o.perm as any)?.diagonal) && (o.perm as any).diagonal >= 0 ? (o.perm as any).diagonal : 0,
    },
    orient: Object.fromEntries(
      ORIENT_CHOICES.map((g) => {
        const v = (o.orient as any)?.[g];
        return [g, Number.isInteger(v) && v >= 0 ? v : 0];
      }),
    ) as Settings["orient"],
    top: validPair ? top : defaults.top,
    front: validPair ? front : defaults.front,
    lseHand: o.lseHand === "std" || o.lseHand === "easy" ? o.lseHand : defaults.lseHand,
  };
}

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitize(JSON.parse(raw));
  } catch {
    /* storage unavailable: fall back to defaults */
  }
  const prefersDark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
  return { ...defaults, theme: prefersDark ? "dark" : "light" };
}

let state: Settings = read();
const listeners = new Set<() => void>();

function apply() {
  setScheme(state.top, state.front);
  if (typeof document === "undefined") return; // scripts that run without a browser
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.lang = state.lang;
  document.title = state.lang === "en" ? "Roux Notes: learn the Roux method" : "Roux Notes: học phương pháp Roux";
}
apply();

function set(patch: Partial<Settings>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  apply();
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSettings = () => useSyncExternalStore(subscribe, () => state);

export const getLang = (): Lang => state.lang;
export const setLang = (lang: Lang) => set({ lang });
export const toggleTheme = () => set({ theme: state.theme === "dark" ? "light" : "dark" });
export const toggleWhy = () => set({ showWhy: !state.showWhy });
export function toggleLearned(id: string) {
  const has = state.learned.includes(id);
  set({ learned: has ? state.learned.filter((x) => x !== id) : [...state.learned, id] });
}
export function markLearned(id: string) {
  if (!state.learned.includes(id)) set({ learned: [...state.learned, id] });
}
export function toggleStepDone(id: StepId) {
  const has = state.stepsDone.includes(id);
  set({ stepsDone: STEP_IDS.filter((x) => (x === id ? !has : state.stepsDone.includes(x))) });
}
export const markSchemeAsked = () => set({ schemeAsked: true });
export const getPermPick = (id: "adjacent" | "diagonal") => state.perm[id];
export const setPermPick = (id: "adjacent" | "diagonal", i: number) => set({ perm: { ...state.perm, [id]: i } });
export const getOrientPick = (g: OrientChoice) => state.orient[g];
export const setOrientPick = (g: OrientChoice, i: number) => set({ orient: { ...state.orient, [g]: i } });
export const clearLearned = () => set({ learned: [] });
export const setLseHand = (lseHand: Settings["lseHand"]) => set({ lseHand });
export const setColors = (top: ColorName, front: ColorName) => set({ top, front });
