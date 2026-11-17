import { FACES, type Face } from "../../shared/cube";

export type ColorName = "white" | "yellow" | "green" | "blue" | "red" | "orange";

export const COLOR_HEX: Record<ColorName, string> = {
  white: "#fbf7ea",
  yellow: "#f4cf2a",
  green: "#2a955e",
  blue: "#3f7fd6",
  red: "#c61211",
  orange: "#f3853c",
};
export const COLOR_VI: Record<ColorName, string> = {
  white: "trắng",
  yellow: "vàng",
  green: "xanh lá",
  blue: "xanh dương",
  red: "đỏ",
  orange: "cam",
};
export const COLOR_EN: Record<ColorName, string> = {
  white: "white",
  yellow: "yellow",
  green: "green",
  blue: "blue",
  red: "red",
  orange: "orange",
};
export const COLOR_NAMES = Object.keys(COLOR_HEX) as ColorName[];

type Scheme = Record<Face, ColorName>;

// A real (non-mirrored) Western cube: white top, green front, red right.
const BASE: Scheme = { U: "white", F: "green", R: "red", B: "blue", L: "orange", D: "yellow" };

const rotX = (s: Scheme): Scheme => ({ ...s, U: s.F, F: s.D, D: s.B, B: s.U });
const rotY = (s: Scheme): Scheme => ({ ...s, F: s.R, R: s.B, B: s.L, L: s.F });

// all 24 orientations of the physical cube, so any (top, front) pair gives a legal scheme
const ALL: Scheme[] = (() => {
  const seen = new Map<string, Scheme>();
  const queue = [BASE];
  while (queue.length) {
    const s = queue.pop()!;
    const k = FACES.map((f) => s[f]).join();
    if (seen.has(k)) continue;
    seen.set(k, s);
    queue.push(rotX(s), rotY(s));
  }
  return [...seen.values()];
})();

export function schemeFor(top: ColorName, front: ColorName): Scheme | undefined {
  return ALL.find((s) => s.U === top && s.F === front);
}

/** front colours that can sit next to a given top colour (not the same or the opposite colour) */
export const frontChoices = (top: ColorName): ColorName[] => [...new Set(ALL.filter((s) => s.U === top).map((s) => s.F))];

let current: Scheme = schemeFor("yellow", "green")!;
export const setScheme = (top: ColorName, front: ColorName) => {
  current = schemeFor(top, front) ?? current;
};
export const currentScheme = () => current;

export const colorOfId = (id: number) => COLOR_HEX[current[FACES[id]]];
export const GHOST_FILL = "#e4dfd2";
export const INK = "#2a2622";
