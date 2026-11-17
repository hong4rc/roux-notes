import { RAW_CMLL } from "../src/data/cmll-raw";
import { applyAlg, invertAlg, solvedState, stickerIndex, faceOfId, type Vec } from "../shared/cube";

// For a corner-only view: for each side face, the two corner side-stickers on that face.
const SIDES: Record<string, [Vec, Vec, Vec]> = {
  F: [[0, 0, 1], [-1, 1, 1], [1, 1, 1]],
  B: [[0, 0, -1], [-1, 1, -1], [1, 1, -1]],
  R: [[1, 0, 0], [1, 1, -1], [1, 1, 1]],
  L: [[-1, 0, 0], [-1, 1, -1], [-1, 1, 1]],
};
const nameOf = (s: Uint8Array) => {
  const out: string[] = [];
  for (const [f, [n, a, b]] of Object.entries(SIDES)) {
    const ca = s[stickerIndex(a, n)], cb = s[stickerIndex(b, n)];
    if (ca === cb) out.push(`${f}:bar(${faceOfId(ca)})`);
  }
  const top = ["UFR","UFL","UBL","UBR"];
  void top;
  const yel: string[] = [];
  for (const [x,z,l] of [[1,1,"FR"],[-1,1,"FL"],[-1,-1,"BL"],[1,-1,"BR"]] as [number,number,string][])
    if (s[stickerIndex([x,1,z],[0,1,0])] === 0) yel.push(l);
  return `${out.join(" ")} | yellow-top: ${yel.join(",") || "none"}`;
};
for (const r of RAW_CMLL.filter(r => r.source === "ruwix")) {
  const pre = RAW_CMLL.find(x => x === r)!;
  void pre;
}
// recompute with the raw (unstripped) prefix, re-read from the original text
import { RUWIX } from "../src/data/cmll-raw";
for (const line of RUWIX.trim().split("\n")) {
  const [g, n, a] = line.split("|");
  const st = applyAlg(solvedState(), invertAlg(a.replace(/2'/g, "2")));
  console.log(`${g.padEnd(3)} ${n.padEnd(18)} ${nameOf(st)}`);
}
