// Practice scrambles. Every scramble is meant to be done on a SOLVED cube, held the usual way, and leaves the cube exactly at the start of a step.
import { applyAlg, invertAlg, parseAlg, solvedState, type State } from "../../shared/cube";
import { badEdges, buildSpace, centresAligned, cornersAligned, eoDone, scrambleTo, ulurDone, type Space } from "../../shared/lse-space";
import { CMLL_CASES, fullAlg, type CmllCase } from "../data/cmll";

export type StepKind = "full" | "second-block" | "cmll" | "lse" | "eo" | "ulur" | "l4e";

const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const SUFFIX = ["", "'", "2"];

/** join sequences and merge neighbouring turns of the same face (U U' vanishes, U U becomes U2) */
export function tidy(alg: string): string {
  const out: { name: string; q: number }[] = [];
  for (const m of parseAlg(alg)) {
    const q = m.cw === 3 ? 3 : m.cw;
    const last = out[out.length - 1];
    if (last && last.name === m.name) {
      last.q = (last.q + q) % 4;
      if (last.q === 0) out.pop();
    } else out.push({ name: m.name, q });
  }
  return out.map((m) => m.name + (m.q === 3 ? "'" : m.q === 2 ? "2" : "")).join(" ");
}

/**
 * A WCA-style 3x3 scramble: a random state, made by the cubing.js scramble generator (the library is loaded only when a scramble is needed).
 * The generator decides the length; the notation is R L U D F B with ' and 2 only.
 */
export async function wcaScramble(): Promise<string> {
  const { randomScrambleForEvent } = await import("cubing/scramble");
  return (await randomScrambleForEvent("333")).toString().trim();
}

/** random walk that never disturbs the left block: R, r, M and U only */
export function randomSecondBlockScramble(n = 26): string {
  const group: Record<string, string> = { R: "x", r: "x", M: "x", U: "y" };
  const letters = Object.keys(group);
  const out: string[] = [];
  while (out.length < n) {
    const l = pick(letters);
    const prev = out[out.length - 1]?.[0];
    if (prev && group[prev] === group[l]) continue;
    out.push(l + pick(SUFFIX));
  }
  return out.join(" ");
}

// M and U states are searched once, the first time they are needed (about half a second)
let space: Space | null = null;
export const lseSpace = (): Space => (space ??= buildSpace());
const pools = new Map<StepKind, number[]>();
function lsePool(kind: "lse" | "eo" | "ulur" | "l4e"): { sp: Space; ids: number[] } {
  const sp = lseSpace();
  let ids = pools.get(kind);
  if (!ids) {
    ids = [];
    sp.states.forEach((s, i) => {
      if (!cornersAligned(s) || !centresAligned(s)) return;
      const done = eoDone(s);
      const good = kind === "lse" ? true : kind === "eo" ? badEdges(s).length > 0 : kind === "ulur" ? done && !ulurDone(s) : ulurDone(s);
      if (good && scrambleTo(sp, i).split(" ").length >= 6) ids!.push(i);
    });
    pools.set(kind, ids);
  }
  return { sp, ids };
}

export function lseScramble(kind: "lse" | "eo" | "ulur" | "l4e"): string {
  const { sp, ids } = lsePool(kind);
  return scrambleTo(sp, pick(ids));
}

/** both blocks solved, the four corners in a random CMLL case, the edges mixed */
export function cmllScramble(): string {
  const c = pick(CMLL_CASES);
  const auf = pick(["", "U", "U'", "U2"]);
  return tidy(`${lseScramble("lse")} ${auf} ${invertAlg(fullAlg(c.algs[0]))}`);
}

export async function makeScramble(kind: StepKind): Promise<string> {
  switch (kind) {
    case "full":
      return wcaScramble();
    case "second-block":
      return randomSecondBlockScramble();
    case "cmll":
      return cmllScramble();
    default:
      return lseScramble(kind);
  }
}

/**
 * A fresh scramble for one CMLL case: a random M/U sequence that leaves the blocks, the centres and the four corners in place
 * (so the edges are moved for real), then the inverse of one of the case's algorithms, then an optional U turn (the AUF).
 * The picture after the scramble is the case seen after that U turn, so turning U to match the picture is the first thing to do.
 */
export function caseScramble(alg: string): string {
  return tidy(`${lseScramble("lse")} ${invertAlg(alg)} ${pick(["", "U", "U'", "U2"])}`);
}

/** a scramble for a case, using one of its algorithms chosen at random */
export function caseScrambleOf(c: CmllCase): string {
  return caseScramble(fullAlg(pick(c.algs)));
}

export const stateOfScramble = (scramble: string): State => applyAlg(solvedState(), scramble);
