import { CMLL_CASES, orientationOf, U_CORNER_SLOTS, ALL_CORNER_STATES, lookupBySignature } from "../src/data/cmll";
import { pieceStickers, faceOfId } from "../shared/cube";
const FACE = (slot: string, o: number) => slot[o];
const seen = new Set<string>();
for (const c of CMLL_CASES) {
  const o = orientationOf(c.state);
  const desc = U_CORNER_SLOTS.map((s, k) => `${s}:${FACE(s, o[k])}`).join(" ");
  const tag = `${c.group}`;
  if (!seen.has(tag + desc)) { seen.add(tag + desc); }
  console.log(c.id.padEnd(28), desc);
}
console.log("cases", CMLL_CASES.length, "states", ALL_CORNER_STATES.length);
void pieceStickers; void faceOfId; void lookupBySignature;
