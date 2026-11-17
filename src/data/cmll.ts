import {
  algToString,
  applyAlg,
  invertAlg,
  parseAlg,
  pieceStickers,
  solvedState,
  stickerIndex,
  type Face,
  type Move,
  type State,
} from "../../shared/cube";
import { tr } from "../lib/i18n";
import { signatureKey, uCornerSignature } from "../../shared/roux";
import { RUWIX, SCHEOPNER, normalizeAlg } from "./cmll-raw";
import COMMUNITY from "./cmll-community.json";

export type GroupId = "S" | "As" | "H" | "Pi" | "U" | "T" | "L" | "O";

export interface AlgOption {
  /** the algorithm itself, without any alignment turns */
  alg: string;
  /** every list it appears in: SpeedCubeDB (community votes), Ruwix, Scheopner */
  sources: string[];
  /** votes on SpeedCubeDB, when it is listed there */
  votes?: number;
  url?: string;
  /** John Mark's finger notation for exactly this algorithm (his own code, explained in his video) */
  finger?: string;
  /** U turns to do before / after so the algorithm fits the picture */
  pre: string;
  post: string;
}

export interface CmllCase {
  id: string;
  group: GroupId;
  /** name as used by the source list (English), kept so the case can be searched elsewhere */
  sourceName: string;
  algs: AlgOption[];
  /** the case as it looks on the cube: the scramble the first algorithm solves */
  state: State;
  sig: string;
}

export const GROUPS: Record<GroupId, { label: string; blurb: string; order: number }> = {
  S: {
    order: 1,
    get label() {
      return "Sune";
    },
    get blurb() {
      return tr(
        "Đúng một góc có sticker vàng nằm trên mặt trên. Ba góc còn lại có vàng ở mặt bên, cùng xoay về một chiều.",
        "Exactly one corner has its yellow sticker on the top face. The other three corners have yellow on a side face, all twisted the same way.",
      );
    },
  },
  As: {
    order: 2,
    get label() {
      return "Antisune";
    },
    get blurb() {
      return tr(
        "Cũng một góc vàng trên mặt trên, ba góc còn lại xoay vàng ra mặt bên theo chiều ngược với Sune.",
        "Also one corner with yellow on the top face; the other three corners have their yellow turned out to the side the opposite way to Sune.",
      );
    },
  },
  H: {
    order: 3,
    get label() {
      return "H";
    },
    get blurb() {
      return tr(
        "Không góc nào có vàng trên mặt trên. Mặt trước có hai sticker vàng, mặt sau cũng có hai sticker vàng.",
        "No corner has yellow on the top face. The front has two yellow stickers, and the back also has two yellow stickers.",
      );
    },
  },
  Pi: {
    order: 4,
    get label() {
      return "Pi";
    },
    get blurb() {
      return tr(
        "Không góc nào có vàng trên mặt trên. Một mặt bên có hai sticker vàng kề nhau, hai mặt đối diện nhau bên cạnh mỗi mặt có một sticker vàng.",
        "No corner has yellow on the top face. One side face has two yellow stickers next to each other, and the two faces opposite each other beside it each have one yellow sticker.",
      );
    },
  },
  U: {
    order: 5,
    get label() {
      return "U";
    },
    get blurb() {
      return tr(
        "Hai góc kề nhau đã có vàng trên mặt trên. Hai góc còn lại cùng quay vàng về một mặt: hai sticker vàng nằm kề nhau trên mặt đó.",
        "Two neighbouring corners already have yellow on the top face. The other two corners turn their yellow to the same face: two yellow stickers sit next to each other on that face.",
      );
    },
  },
  T: {
    order: 6,
    get label() {
      return "T";
    },
    get blurb() {
      return tr(
        "Hai góc kề nhau đã có vàng trên mặt trên. Hai góc còn lại quay vàng ra hai phía đối nhau: một về mặt trái, một về mặt phải.",
        "Two neighbouring corners already have yellow on the top face. The other two corners turn their yellow to opposite sides: one to the left face, one to the right face.",
      );
    },
  },
  L: {
    order: 7,
    get label() {
      return "L";
    },
    get blurb() {
      return tr(
        "Hai góc chéo nhau đã có vàng trên mặt trên. Mỗi góc còn lại có vàng ở một mặt bên, và hai mặt đó vuông góc với nhau.",
        "Two diagonal corners already have yellow on the top face. Each remaining corner has yellow on one side face, and those two faces are at a right angle to each other.",
      );
    },
  },
  O: {
    order: 8,
    get label() {
      return tr("Đã đúng hướng", "Already oriented");
    },
    get blurb() {
      return tr(
        "Cả bốn góc đã có vàng trên mặt trên; chỉ còn phải đổi chỗ hai góc cho đúng vị trí.",
        "All four corners already have yellow on the top face; only two corners are left to swap into place.",
      );
    },
  },
};

export const GROUP_ORDER: GroupId[] = (Object.keys(GROUPS) as GroupId[]).sort((a, b) => GROUPS[a].order - GROUPS[b].order);

// ---------------------------------------------------------------------------------------------

const U_WRAP = ["", "U", "U2", "U'"];
const wrapU = (n: number) => U_WRAP[((n % 4) + 4) % 4];

function splitPrefix(raw: string): { pre: string; alg: string } {
  const toks = raw.replace(/[()]/g, " ").split(/\s+/).filter(Boolean).map((t) => t.replace("2'", "2"));
  const pre: string[] = [];
  while (toks.length && /^U(2|')?$/.test(toks[0])) pre.push(toks.shift()!);
  return { pre: pre.join(" "), alg: normalizeAlg(raw) };
}

const sigOf = (alg: string) => signatureKey(uCornerSignature(applyAlg(solvedState(), invertAlg(alg))));

function classKey(alg: string): string {
  let best = "";
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const k = sigOf(`${wrapU(i)} ${alg} ${wrapU(j)}`);
      if (best === "" || k < best) best = k;
    }
  return best;
}

// find U turns before (i) and after (j) such that `wrapU(i) alg wrapU(j)` solves the state with signature `target`
export function findWrap(alg: string, target: string): { pre: string; post: string } | null {
  let best: { i: number; j: number; cost: number } | null = null;
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      if (sigOf(`${wrapU(i)} ${alg} ${wrapU(j)}`) !== target) continue;
      const cost = (i ? 1 : 0) + (j ? 1 : 0) + (j ? 0.1 : 0);
      if (!best || cost < best.cost) best = { i, j, cost };
    }
  return best ? { pre: wrapU(best.i), post: wrapU(best.j) } : null;
}

/** turns other than R, U, r and M: they usually ask for another finger or a regrip */
const awkward = (alg: string) => parseAlg(alg).filter((m) => !["R", "U", "r", "M"].includes(m.name)).length;

const GROUP_MAP: Record<string, GroupId> = { S: "S", As: "As", H: "H", Pi: "Pi", U: "U", T: "T", L: "L", O: "O" };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function build(): CmllCase[] {
  type Entry = { source: "Ruwix" | "Scheopner"; group: string; name: string; pre: string; alg: string };
  const read = (text: string, source: Entry["source"]): Entry[] =>
    text
      .trim()
      .split("\n")
      .map((line) => {
        const [group, name, raw] = line.split("|");
        const { pre, alg } = splitPrefix(raw);
        return { source, group, name, pre, alg };
      });
  const entries = [...read(RUWIX, "Ruwix"), ...read(SCHEOPNER, "Scheopner")];
  const byClass = new Map<string, Entry[]>();
  for (const e of entries) {
    const k = classKey(e.alg);
    byClass.set(k, [...(byClass.get(k) ?? []), e]);
  }
  const cases: CmllCase[] = [];
  for (const list of byClass.values()) {
    const main = list.find((e) => e.source === "Ruwix")!;
    const state = applyAlg(solvedState(), invertAlg(`${main.pre} ${main.alg}`));
    const sig = signatureKey(uCornerSignature(state));
    // the old lists, one row per different algorithm
    const old: AlgOption[] = [];
    for (const e of list) {
      const same = old.find((a) => a.alg === e.alg);
      if (same) {
        same.sources.push(e.source);
        continue;
      }
      const w = e === main ? { pre: main.pre, post: "" } : findWrap(e.alg, sig);
      if (!w) throw new Error(`cannot align ${e.alg}`);
      old.push({ alg: e.alg, sources: [e.source], pre: w.pre, post: w.post });
    }
    // community picks first, most votes first; on a tie the one with fewer turns outside R, U, r and M (less regripping)
    const id = `${GROUP_MAP[main.group].toLowerCase()}-${slug(main.name)}`;
    const community = COMMUNITY.filter((x) => x.caseId === id).sort((a, b) => b.votes - a.votes || awkward(a.alg) - awkward(b.alg));
    const algs: AlgOption[] = community.map((x) => {
      const w = findWrap(x.alg, sig);
      if (!w) throw new Error(`cannot align ${x.alg}`);
      const prev = old.find((a) => a.alg === x.alg);
      return { alg: x.alg, sources: ["SpeedCubeDB", ...(prev?.sources ?? [])], votes: x.votes, url: x.url, finger: (x as { finger?: string }).finger, pre: w.pre, post: w.post };
    });
    for (const a of old) if (!algs.some((b) => b.alg === a.alg)) algs.push(a);
    const group = GROUP_MAP[main.group];
    // the picture comes from the main algorithm, so its practice scramble gives exactly this cube (corners as `sig`, edges as that algorithm leaves them)
    const shown = applyAlg(solvedState(), invertAlg(`${algs[0].pre} ${algs[0].alg} ${algs[0].post}`));
    if (signatureKey(uCornerSignature(shown)) !== sig) throw new Error(`main algorithm of ${id} does not fit its case`);
    cases.push({ id, group, sourceName: main.name, algs, state: shown, sig });
  }
  const gi = (g: GroupId) => GROUPS[g].order;
  cases.sort((a, b) => gi(a.group) - gi(b.group));
  // keep source order inside a group
  const rank = new Map(read(RUWIX, "Ruwix").map((e, i) => [`${GROUP_MAP[e.group].toLowerCase()}-${slug(e.name)}`, i]));
  cases.sort((a, b) => gi(a.group) - gi(b.group) || (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  return cases;
}

export const CMLL_CASES: CmllCase[] = build();
export const CMLL_BY_ID = new Map(CMLL_CASES.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------------------------
// every one of the 648 corner arrangements, mapped to the case that solves it

export interface Lookup {
  caseId: string | null; // null: only a U turn is needed
  pre: string;
  post: string;
  state: State;
  /** moves that turn a solved cube into this state */
  scramble: string;
}

const TABLE = new Map<string, Lookup>();
function buildTable() {
  const consider = (sig: string, cand: Lookup & { cost: number }) => {
    const hit = TABLE.get(sig) as (Lookup & { cost: number }) | undefined;
    if (!hit || cand.cost < hit.cost) TABLE.set(sig, cand as Lookup);
  };
  for (let k = 0; k < 4; k++) {
    const wrap = wrapU(k);
    const st = applyAlg(solvedState(), wrap);
    consider(signatureKey(uCornerSignature(st)), { caseId: null, pre: "", post: invertAlg(wrap), state: st, scramble: wrap.trim(), cost: k ? 1 : 0 });
  }
  for (const c of CMLL_CASES) {
    const main = c.algs[0].alg;
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const full = `${wrapU(i)} ${main} ${wrapU(j)}`;
        const st = applyAlg(solvedState(), invertAlg(full));
        const scramble = invertAlg(full);
        const cost = 2 + (i ? 1 : 0) + (j ? 1 : 0) + (j ? 0.1 : 0);
        consider(signatureKey(uCornerSignature(st)), { caseId: c.id, pre: wrapU(i), post: wrapU(j), state: st, scramble, cost });
      }
  }
}
buildTable();

export const ALL_CORNER_STATES: Lookup[] = [...TABLE.values()];
export const lookupBySignature = (sig: string) => TABLE.get(sig);

// ---------------------------------------------------------------------------------------------
// facts read off a state

export const U_CORNER_SLOTS = ["UFR", "UFL", "UBL", "UBR"] as const;
export type CornerSlot = (typeof U_CORNER_SLOTS)[number];

/** For each U corner slot, which of its three stickers (0 = top, 1 = first side, 2 = second side) shows the top colour. */
export function orientationOf(state: State): number[] {
  return U_CORNER_SLOTS.map((slot) => pieceStickers(slot).findIndex((i) => state[i] === 0));
}

export const SIDE_PAIRS: { face: Face; label: string; a: [CornerSlot, number]; b: [CornerSlot, number] }[] = [
  { face: "F", get label() { return tr("trước", "front"); }, a: ["UFL", 1], b: ["UFR", 1] },
  { face: "R", get label() { return tr("phải", "right"); }, a: ["UFR", 2], b: ["UBR", 1] },
  { face: "B", get label() { return tr("sau", "back"); }, a: ["UBR", 2], b: ["UBL", 1] },
  { face: "L", get label() { return tr("trái", "left"); }, a: ["UBL", 2], b: ["UFL", 2] },
];

// sticker index order: pieceStickers("UFL") = [U, F, L], "UFR" = [U, F, R], "UBR" = [U, B, R], "UBL" = [U, B, L]
function sideSticker(state: State, slot: CornerSlot, face: Face): number {
  const faces = slot.split("") as Face[];
  return state[pieceStickers(slot)[faces.indexOf(face)]];
}

/** faces whose two corner stickers show the same colour ("headlights", or a yellow bar when both are yellow) */
export function sameColorFaces(state: State): { face: Face; label: string; color: number }[] {
  const out: { face: Face; label: string; color: number }[] = [];
  for (const side of SIDE_PAIRS) {
    const ca = sideSticker(state, side.a[0], side.face);
    const cb = sideSticker(state, side.b[0], side.face);
    if (ca === cb) out.push({ face: side.face, label: side.label, color: ca });
  }
  return out;
}

/** headlights = a same-colour pair on a face whose colour is not the top colour */
export const headlightFaces = (state: State) => sameColorFaces(state).filter((x) => x.color !== 0);

export const movesOf = (alg: string): Move[] => parseAlg(alg);
export const moveCount = (alg: string) => parseAlg(alg).length;
export const fullAlg = (o: AlgOption) => [o.pre, o.alg, o.post].filter(Boolean).join(" ");

// ---------------------------------------------------------------------------------------------
// mirror and inverse cases

const MIRROR: Record<string, string> = { R: "L", L: "R", r: "l", l: "r", M: "M", U: "U", D: "D", F: "F", B: "B", u: "u", d: "d", f: "f", b: "b" };
export function mirrorAlg(alg: string): string {
  const ms = parseAlg(alg).map((m) => {
    const name = MIRROR[m.name];
    // a mirrored turn runs the other way round, except M (its slice swaps sides with itself)
    const flip = m.name !== "M";
    const cw = m.cw === 2 ? 2 : flip ? (m.cw === 1 ? 3 : 1) : m.cw;
    return { name, cw: cw as 1 | 2 | 3 };
  });
  return algToString(ms);
}

const CLASS_TO_CASE = new Map<string, CmllCase>();
for (const c of CMLL_CASES) CLASS_TO_CASE.set(classKey(c.algs[0].alg), c);

export const caseOfAlg = (alg: string): CmllCase | undefined => CLASS_TO_CASE.get(classKey(alg));
export const mirrorCase = (c: CmllCase) => caseOfAlg(mirrorAlg(c.algs[0].alg));
export const inverseCase = (c: CmllCase) => caseOfAlg(invertAlg(c.algs[0].alg));

export { stickerIndex };
