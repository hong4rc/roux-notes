// Every CMLL case must be recognisable from centre-relative facts alone, and every claim the recognition steps make
// must hold on the real cube engine.
import { ALL_CORNER_STATES, CMLL_CASES, GROUPS, orientationOf } from "../src/data/cmll";
import { applyAlg } from "../shared/cube";
import { arrangementCaption, cornerFacts, placementOf, placementPhrase, placementSentence, recognitionOf, swapKindOf } from "../src/lib/recognize";
import { UPRIGHT_BY_GROUP } from "../src/components/case-recognition";

let fails = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) { fails++; console.log("FAIL", msg); }
};
const TURNS = ["", "U", "U2", "U'"];
const turned = (s: Parameters<typeof applyAlg>[0], t: string) => (t ? applyAlg(s, t) : s);

for (const c of CMLL_CASES) {
  const facts = cornerFacts(c.state);
  check(new Set(facts.map((f) => f.home)).size === 4, `${c.id}: homes are not a permutation`);
  const r = recognitionOf(c.state);
  // step 1: the count of corners with the top colour on top fixes the family
  check(r.uprightCount === UPRIGHT_BY_GROUP[c.group], `${c.id}: ${r.uprightCount} upright corners for group ${c.group}`);
  check(facts.every((f) => f.upright === (f.twistFace === undefined)), `${c.id}: twist face inconsistent`);
  // step 2 lists only the twisted corners, or says all four are face up
  check(r.orientation.length === 4 - r.uprightCount && r.allUpright === (r.uprightCount === 4), `${c.id}: orientation lines ${r.orientation.length}`);
  // step 3: the virtual turn gives that many corners in place, on the real cube
  const p = placementOf(c.state);
  const after = cornerFacts(turned(c.state, p.auf));
  check(after.filter((f) => f.inPlace).length === p.inPlace, `${c.id}: after ${p.auf || "no turn"} engine has ${after.filter((f) => f.inPlace).length} in place, model ${p.inPlace}`);
  check(p.inPlace === 4 || (p.inPlace === 2 && !!p.swap && !!p.swapNow), `${c.id}: unexpected placement ${p.inPlace}`);
  if (p.swap && p.swapNow) {
    const wrongSlots = after.filter((f) => !f.inPlace).map((f) => f.slot).sort().join();
    check(wrongSlots === [p.swap.a, p.swap.b].sort().join(), `${c.id}: swap pair ${[p.swap.a, p.swap.b]} vs engine ${wrongSlots}`);
    // the pair named as it stands in the picture: those two corners of the picture are the ones that are wrong after the turn
    const nowWrong = facts.map((f, i) => ({ f, i })).filter(({ i }) => cornerFacts(turned(c.state, p.auf))[(i + p.offset) % 4].inPlace === false).map(({ f }) => f.slot).sort().join();
    check(nowWrong === [p.swapNow.a, p.swapNow.b].sort().join(), `${c.id}: picture pair ${[p.swapNow.a, p.swapNow.b]} vs ${nowWrong}`);
    check(p.swap.kind === p.swapNow.kind, `${c.id}: kind differs between turned and picture`);
  }
  // the kind of swap must not depend on which U turn the learner stops at, among turns that match the twist picture
  const kind = swapKindOf(p);
  for (const t of TURNS) {
    const s = turned(c.state, t);
    if (orientationOf(s).join() !== orientationOf(c.state).join()) continue;
    check(swapKindOf(placementOf(s)) === kind, `${c.id}: swap kind changes after ${t || "no turn"}`);
    check(placementOf(s).inPlace === p.inPlace, `${c.id}: in-place count changes after ${t || "no turn"}`);
  }
  check(placementSentence(p).length > 20 && placementPhrase(c.state).length > 5, `${c.id}: empty sentence`);
  check(r.placement.length === 4 && r.pairs.length >= 1, `${c.id}: incomplete`);
  check(GROUPS[c.group].label.length > 0, `${c.id}: group label`);
}

// the finder: within every twist picture, the 24 arrangements must have 24 different captions
const rows = new Map<string, Set<string>>();
const counts = new Map<string, number>();
for (const l of ALL_CORNER_STATES) {
  const key = orientationOf(l.state).join();
  const cap = arrangementCaption(l.state);
  (rows.get(key) ?? rows.set(key, new Set()).get(key)!).add(cap);
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
for (const [key, caps] of rows) check(caps.size === counts.get(key), `finder row ${key}: ${caps.size} captions for ${counts.get(key)} pictures`);
console.log(`checked ${CMLL_CASES.length} cases, ${ALL_CORNER_STATES.length} finder pictures in ${rows.size} twist rows`);
const s = CMLL_CASES.find((c) => c.id === "s-left-bar")!;
console.log(JSON.stringify(recognitionOf(s.state), null, 1));
if (fails) process.exit(1);
console.log("recognize OK");
