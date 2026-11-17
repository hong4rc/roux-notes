// Roux-specific checks built on the geometric cube engine.
import {
  applyAlg,
  applyMove,
  isPieceSolved,
  parseAlg,
  pieceStickers,
  solvedState,
  stateKey,
  type State,
} from "./cube";

export const LEFT_BLOCK = ["DL", "FL", "BL", "DFL", "DBL"];
export const RIGHT_BLOCK = ["DR", "FR", "BR", "DFR", "DBR"];
export const U_CORNERS = ["UFR", "UFL", "UBL", "UBR"] as const;
export const LSE_EDGES = ["UF", "UB", "UL", "UR", "DF", "DB"];
// Pieces a CMLL algorithm must leave intact (blocks) — M-slice centres must also come back.
const CENTERS = ["U", "F", "D", "B", "L", "R"];

export const blocksSolved = (s: State) =>
  [...LEFT_BLOCK, ...RIGHT_BLOCK].every((p) => isPieceSolved(s, p));
export const centersSolved = (s: State) => CENTERS.every((p) => isPieceSolved(s, p));
export const uCornersSolved = (s: State) => U_CORNERS.every((p) => isPieceSolved(s, p));

// U corners solved after some final U turn (AUF)?
export function uCornersSolvedUpToAuf(s: State): number | null {
  let cur = s;
  for (let k = 0; k < 4; k++) {
    if (uCornersSolved(cur)) return k;
    cur = applyMove(cur, { name: "U", cw: 1 });
  }
  return null;
}

export interface CmllCheck {
  ok: boolean;
  reason?: string;
}

// A valid CMLL algorithm applied to a solved cube must leave both blocks, the four bottom
// corners and every centre untouched, and must really scramble the U corners. Edges of the
// M slice and U layer are free (that is exactly what LSE solves afterwards).
export function checkCmll(alg: string): CmllCheck {
  try {
    parseAlg(alg);
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
  const s = applyAlg(solvedState(), alg);
  if (!blocksSolved(s)) return { ok: false, reason: "blocks are disturbed" };
  if (!centersSolved(s)) return { ok: false, reason: "centres are not restored" };
  if (uCornersSolvedUpToAuf(s) !== null) return { ok: false, reason: "does not change the U corners" };
  return { ok: true };
}

// colours of the 12 stickers of the four U corners, in a fixed order (the "visible case")
export function uCornerSignature(s: State): number[] {
  const out: number[] = [];
  for (const c of U_CORNERS) for (const i of pieceStickers(c)) out.push(s[i]);
  return out;
}

export const signatureKey = (sig: number[]) => sig.join("");

export { stateKey };
