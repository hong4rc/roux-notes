// Solving the last six edges by idea, the way a learner does it by hand: a few short pieces, each with an optional U turn
// before it. The search keeps the answer with the fewest pieces, then the fewest moves, so the drill shows what a person
// who knows only these pieces would do.
import { applyAlg, faceIdOf, pieceStickers, type State } from "./cube";
import { badEdges, edgeColours, ulurDone } from "./lse-space";

export type DrillStep = "eo" | "ulur" | "l4e";

/**
 * How the learner turns the middle slice: "std" uses M and M' as the guides write them; "easy" keeps to M' and M2 wherever
 * that works. A quarter M and a quarter M' flip the slice edges the same way, so EO and UL/UR need no M at all; a 4c cycle
 * cannot avoid one M (with M' alone it costs eight flicks), so there "easy" keeps the cycles with one M and builds the other
 * two by putting M2 before and after.
 */
export type DrillHand = "std" | "easy";

/** the pieces a learner keeps in mind for each step (Rouxvolution's guides, and their M'-only forms) */
export const DRILL_PIECES: Record<DrillHand, Record<DrillStep, string[]>> = {
  std: {
    eo: ["M' U M", "M U M'"],
    // bringing the edges up is "turn U, M2, turn U back" (Rouxvolution writes it U M2 U'): M2 with the U turns around it
    ulur: ["M2", "U2 M U2 M'"],
    l4e: ["U2 M U2 M'", "M' U2 M U2", "M U2 M U2 M2", "M2 U2 M U2 M", "U2 M2 U2 M2", "M' U2 M2 U2 M'"],
  },
  easy: {
    eo: ["M' U M'", "M2"],
    ulur: ["M2", "M' U2 M'"],
    l4e: ["U2 M U2 M'", "M' U2 M U2", "M2", "U2 M2 U2 M2", "M' U2 M2 U2 M'"],
  },
};
const FREE: Record<DrillStep, string[]> = {
  eo: ["", "U", "U'", "U2"],
  ulur: ["", "U", "U'", "U2"],
  l4e: ["", "U2"],
};

const keyOf = (s: State) => Array.from(s).join(",");

/** whether a step's job is finished (EO: no bad edge; UL/UR: both in place; 4c: the cube is solved) */
export function stepDone(step: DrillStep, s: State, solved: State): boolean {
  if (step === "eo") return badEdges(s).length === 0;
  if (step === "ulur") return ulurDone(s);
  return keyOf(s) === keyOf(solved);
}

export interface DrillPart {
  pre: string; // a U turn before the piece, or ""
  piece: string; // one of DRILL_PIECES, or "" for the last U turn alone
}

/**
 * The answer a learner following the page would give: fewest pieces, then fewest moves. UL/UR follows the taught recipe in
 * two halves (both edges down to the bottom, then M2 brings them up) rather than the shortest path, so every answer reads
 * the same way. null when nothing is found within `maxPieces` per half.
 */
export function solveByIdea(step: DrillStep, start: State, solved: State, hand: DrillHand = "std", maxPieces = 5): DrillPart[] | null {
  const pieces = DRILL_PIECES[hand][step];
  if (step !== "ulur") return search(step, pieces, start, (s) => stepDone(step, s, solved), maxPieces);
  const down = search(step, pieces, start, bothDown, maxPieces);
  if (!down) return null;
  const mid = applyAlg(start, partsAlg(down) || "");
  const up = search(step, pieces, mid, (s) => stepDone(step, s, solved), maxPieces);
  return up && [...down, ...up];
}

const SIDE_PAIRS = [
  [faceIdOf("U"), faceIdOf("L")],
  [faceIdOf("U"), faceIdOf("R")],
].map((p) => p.sort((a, b) => a - b).join());
const U_CENTRE = pieceStickers("U")[0];
/**
 * Ready for the last M2: the left and right edges both sit at the bottom (DF and DB, either way round) and the top centre is
 * at the bottom too, so the one M2 that brings the edges up also puts the centres back.
 */
export const bothDown = (s: State) => {
  const d = [edgeColours(s, "DF"), edgeColours(s, "DB")].sort().join("|");
  return d === [...SIDE_PAIRS].sort().join("|") && s[U_CENTRE] === faceIdOf("D");
};

function search(step: DrillStep, pieces: string[], start: State, done: (s: State) => boolean, maxPieces: number): DrillPart[] | null {
  const len = (a: string) => (a ? a.split(" ").length : 0);
  type Node = { s: State; parts: DrillPart[]; moves: number };
  let layer: Node[] = [{ s: start, parts: [], moves: 0 }];
  const seen = new Map<string, number>([[keyOf(start), 0]]);
  for (let depth = 0; depth <= maxPieces; depth++) {
    // finish on this layer: a final U turn (or none)
    let best: { parts: DrillPart[]; moves: number } | null = null;
    for (const n of layer)
      for (const u of FREE[step]) {
        const s = u ? applyAlg(n.s, u) : n.s;
        if (!done(s)) continue;
        const m = n.moves + len(u);
        if (!best || m < best.moves) best = { parts: u ? [...n.parts, { pre: u, piece: "" }] : n.parts, moves: m };
      }
    if (best) return best.parts;
    if (depth === maxPieces) break;
    const next = new Map<string, Node>();
    for (const n of layer)
      for (const u of FREE[step])
        for (const p of pieces) {
          const s = applyAlg(n.s, `${u} ${p}`.trim());
          const k = keyOf(s);
          const m = n.moves + len(u) + len(p);
          if ((seen.get(k) ?? Infinity) <= depth) continue;
          const old = next.get(k);
          if (!old || m < old.moves) next.set(k, { s, parts: [...n.parts, { pre: u, piece: p }], moves: m });
        }
    for (const k of next.keys()) seen.set(k, depth + 1);
    layer = [...next.values()];
  }
  return null;
}

/** "U' · (M' U M) · U2" */
export const partsText = (parts: DrillPart[]) =>
  parts.map((p) => (p.piece ? `${p.pre ? `${p.pre} ` : ""}(${p.piece})` : p.pre)).join(" · ");
export const partsAlg = (parts: DrillPart[]) =>
  parts.map((p) => `${p.pre} ${p.piece}`.trim()).filter(Boolean).join(" ");

/**
 * Short sequences to repeat for the hands, each brought back to a solved cube after `times` repeats, so they can be drilled
 * without a scramble. `trains` says which step's hand movement it builds.
 */
export const HAND_DRILLS: { alg: string; times: number; trains: DrillStep; hasM: boolean }[] = [
  { alg: "M' U M' U", times: 4, trains: "eo", hasM: false },
  { alg: "M' U' M' U'", times: 4, trains: "eo", hasM: false },
  { alg: "M2 U2", times: 4, trains: "ulur", hasM: false },
  { alg: "M' U2 M' U2", times: 6, trains: "ulur", hasM: false },
  { alg: "U2 M U2 M'", times: 3, trains: "l4e", hasM: true },
  { alg: "M' U2 M U2", times: 3, trains: "l4e", hasM: true },
];
