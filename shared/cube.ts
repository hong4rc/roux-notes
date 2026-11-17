// Geometric 3x3x3 engine. A sticker is (cubie position, face normal); a move rotates the
// stickers inside a layer. Colours are face letters, so "solved" is state[i] === homeFace[i].

export type Face = "U" | "R" | "F" | "D" | "L" | "B";
export const FACES: Face[] = ["U", "R", "F", "D", "L", "B"];

export type Vec = [number, number, number];

export interface Sticker {
  pos: Vec; // cubie coordinates in {-1,0,1}
  nor: Vec; // outward normal of this sticker
  home: Face; // face this sticker belongs to when solved
}

const NORMAL_FACE: Record<string, Face> = {
  "0,1,0": "U",
  "0,-1,0": "D",
  "1,0,0": "R",
  "-1,0,0": "L",
  "0,0,1": "F",
  "0,0,-1": "B",
};

export const STICKERS: Sticker[] = [];
const INDEX = new Map<string, number>();
const key = (p: Vec, n: Vec) => `${p.join(",")}|${n.join(",")}`;

for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      if (x === 0 && y === 0 && z === 0) continue;
      const pos: Vec = [x, y, z];
      for (let axis = 0; axis < 3; axis++) {
        if (pos[axis] === 0) continue;
        const nor: Vec = [0, 0, 0];
        nor[axis] = pos[axis];
        INDEX.set(key(pos, nor), STICKERS.length);
        STICKERS.push({ pos, nor, home: NORMAL_FACE[nor.join(",")] });
      }
    }
  }
}

export const stickerIndex = (pos: Vec, nor: Vec): number => {
  const i = INDEX.get(key(pos, nor));
  if (i === undefined) throw new Error(`no sticker at ${key(pos, nor)}`);
  return i;
};

// rotate a vector by quarter-turns (turns > 0 = counter-clockwise by the right-hand rule) around an axis
function rotate(v: Vec, axis: number, turns: number): Vec {
  let [x, y, z] = v;
  const t = ((turns % 4) + 4) % 4;
  for (let i = 0; i < t; i++) {
    if (axis === 0) [y, z] = [-z, y];
    else if (axis === 1) [z, x] = [-x, z];
    else [x, y] = [-y, x];
  }
  return [x + 0, y + 0, z + 0] as Vec; // + 0 normalises -0
}

interface MoveDef {
  axis: number;
  // layers selected by cubie coordinate along the axis
  layers: (c: number) => boolean;
  // quarter-turns for the clockwise (non-prime) version; sign follows right-hand rule about +axis
  turns: number;
}

const only = (v: number) => (c: number) => c === v;
const atLeast = (v: number) => (c: number) => c >= v;
const atMost = (v: number) => (c: number) => c <= v;
const all = () => true;

const MOVES: Record<string, MoveDef> = {
  R: { axis: 0, layers: only(1), turns: -1 },
  L: { axis: 0, layers: only(-1), turns: 1 },
  M: { axis: 0, layers: only(0), turns: 1 },
  r: { axis: 0, layers: atLeast(0), turns: -1 },
  l: { axis: 0, layers: atMost(0), turns: 1 },
  x: { axis: 0, layers: all, turns: -1 },
  U: { axis: 1, layers: only(1), turns: -1 },
  D: { axis: 1, layers: only(-1), turns: 1 },
  E: { axis: 1, layers: only(0), turns: 1 },
  u: { axis: 1, layers: atLeast(0), turns: -1 },
  d: { axis: 1, layers: atMost(0), turns: 1 },
  y: { axis: 1, layers: all, turns: -1 },
  F: { axis: 2, layers: only(1), turns: -1 },
  B: { axis: 2, layers: only(-1), turns: 1 },
  S: { axis: 2, layers: only(0), turns: -1 },
  f: { axis: 2, layers: atLeast(0), turns: -1 },
  b: { axis: 2, layers: atMost(0), turns: 1 },
  z: { axis: 2, layers: all, turns: -1 },
};

export type State = Uint8Array;
const FACE_ID: Record<Face, number> = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
export const faceOfId = (id: number): Face => FACES[id];

export function solvedState(): State {
  const s = new Uint8Array(54);
  STICKERS.forEach((st, i) => (s[i] = FACE_ID[st.home]));
  return s;
}

// permutation table for a base move name and a number of clockwise turns (1, 2, 3)
const PERM_CACHE = new Map<string, Int8Array>();
function perm(name: string, cw: number): Int8Array {
  const k = `${name}${cw}`;
  const hit = PERM_CACHE.get(k);
  if (hit) return hit;
  const def = MOVES[name];
  if (!def) throw new Error(`unknown move ${name}`);
  const p = new Int8Array(54);
  STICKERS.forEach((st, i) => {
    if (def.layers(st.pos[def.axis])) {
      const np = rotate(st.pos, def.axis, def.turns * cw);
      const nn = rotate(st.nor, def.axis, def.turns * cw);
      p[i] = stickerIndex(np, nn);
    } else p[i] = i;
  });
  PERM_CACHE.set(k, p);
  return p;
}

export interface Move {
  name: string;
  cw: 1 | 2 | 3; // 3 = prime
  /** a half turn written X2': it ends the same as X2, but is turned the X' way (it matters for the hands, not for the cube) */
  back?: boolean;
}

export function parseAlg(alg: string): Move[] {
  const out: Move[] = [];
  const re = /([RLUDFBMESrludfbxyz])(2'|2|')?/g;
  const cleaned = alg.replace(/[()]/g, " ").trim();
  if (!cleaned) return out;
  const leftover = cleaned.replace(re, "").replace(/\s+/g, "");
  if (leftover.length) throw new Error(`cannot parse alg "${alg}" (leftover "${leftover}")`);
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned))) {
    const suf = m[2];
    out.push(suf === "2'" ? { name: m[1], cw: 2, back: true } : { name: m[1], cw: suf === "'" ? 3 : suf ? 2 : 1 });
  }
  return out;
}

export function moveToString(m: Move): string {
  return m.name + (m.cw === 3 ? "'" : m.cw === 2 ? "2" : "");
}

/** turn a vector by any angle (radians) about an axis, the same way round as the quarter-turns of the moves */
export function rotateBy([x, y, z]: Vec, axis: number, th: number): Vec {
  const c = Math.cos(th), s = Math.sin(th);
  if (axis === 0) return [x, y * c - z * s, y * s + z * c];
  if (axis === 1) return [z * s + x * c, y, z * c - x * s];
  return [x * c - y * s, x * s + y * c, z];
}

/** the geometry of a move, for drawing it half done: the axis, which cubies turn, and how many quarter-turns (sign by the right-hand rule) */
export function moveTurn(m: Move): { axis: number; inLayer: (pos: Vec) => boolean; quarterTurns: number } {
  const def = MOVES[m.name];
  if (!def) throw new Error(`unknown move ${m.name}`);
  const q = m.cw === 3 ? -1 : m.cw === 2 && m.back ? -2 : m.cw;
  return { axis: def.axis, inLayer: (pos) => def.layers(pos[def.axis]), quarterTurns: def.turns * q };
}

export const algToString = (ms: Move[]) => ms.map(moveToString).join(" ");

export function invertMoves(ms: Move[]): Move[] {
  return ms
    .slice()
    .reverse()
    .map((m) => (m.cw === 2 ? { name: m.name, cw: 2 as const, ...(m.back ? {} : { back: true }) } : { name: m.name, cw: (m.cw === 1 ? 3 : 1) as 1 | 2 | 3 }));
}

export const invertAlg = (alg: string) => algToString(invertMoves(parseAlg(alg)));

export function applyMove(s: State, m: Move): State {
  const p = perm(m.name, m.cw);
  const out = new Uint8Array(54);
  for (let i = 0; i < 54; i++) out[p[i]] = s[i];
  return out;
}

export function applyMoves(s: State, ms: Move[]): State {
  let cur = s;
  for (const m of ms) cur = applyMove(cur, m);
  return cur;
}

export const applyAlg = (s: State, alg: string) => applyMoves(s, parseAlg(alg));

// A state reached by applying `alg` to a solved cube.
export const stateAfter = (alg: string) => applyAlg(solvedState(), alg);
// The scramble state that `alg` solves (alg applied to it gives solved).
export const stateSolvedBy = (alg: string) => applyAlg(solvedState(), invertAlg(alg));

export const stateKey = (s: State) => String.fromCharCode(...s);

// ---- piece helpers -------------------------------------------------------------------------

export const faceVec = (f: Face): Vec =>
  f === "U" ? [0, 1, 0] : f === "D" ? [0, -1, 0] : f === "R" ? [1, 0, 0] : f === "L" ? [-1, 0, 0] : f === "F" ? [0, 0, 1] : [0, 0, -1];

// stickers of the cubie at the position named by faces, e.g. "UFR" or "DL"
export function pieceStickers(name: string): number[] {
  const faces = name.split("") as Face[];
  const pos: Vec = [0, 0, 0];
  for (const f of faces) {
    const v = faceVec(f);
    for (let i = 0; i < 3; i++) pos[i] += v[i];
  }
  return faces.map((f) => stickerIndex(pos, faceVec(f)));
}

export const isPieceSolved = (s: State, name: string): boolean =>
  pieceStickers(name).every((i) => s[i] === FACE_ID[STICKERS[i].home]);

export const faceIdOf = (f: Face) => FACE_ID[f];
