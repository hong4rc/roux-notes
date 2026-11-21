// Practice helpers: the "when you are done" state of each LSE step must really satisfy the step's goal on the real cube.
import { solvedState } from "../shared/cube";
import { badEdges, eoDone, ulurDone } from "../shared/lse-space";
import { lseFinishedState, lseScramble, stateOfScramble } from "../src/lib/scramble";

let fails = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) { fails++; console.log("FAIL", msg); }
};
const S = solvedState();
const isSolved = (s: Uint8Array) => s.every((v, i) => v === S[i]);
for (let t = 0; t < 12; t++) {
  const eo = lseScramble("eo");
  check(eoDone(lseFinishedState("eo", eo)), `eo: ${eo}`);
  check(badEdges(stateOfScramble(eo)).length % 2 === 0, `eo: odd number of bad edges in ${eo}`);
  const ul = lseScramble("ulur");
  check(ulurDone(lseFinishedState("ulur", ul)), `ulur: ${ul}`);
  const l4 = lseScramble("l4e");
  check(isSolved(lseFinishedState("l4e", l4)) && !isSolved(stateOfScramble(l4)), `l4e: ${l4}`);
}
check(isSolved(lseFinishedState("lse", lseScramble("lse"))), "lse");
if (fails) process.exit(1);
console.log("practice OK");
