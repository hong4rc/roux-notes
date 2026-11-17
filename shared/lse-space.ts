// The whole <M, U> state space (edges + M-slice centres + U-layer corners), searchable by BFS.
import { applyMove, faceIdOf, pieceStickers, solvedState, type Move, type State } from "./cube";

export const LSE_MOVES: Move[] = [
  { name: "M", cw: 1 },
  { name: "M", cw: 3 },
  { name: "M", cw: 2 },
  { name: "U", cw: 1 },
  { name: "U", cw: 3 },
  { name: "U", cw: 2 },
];
export const LSE_MOVE_TEXT = ["M", "M'", "M2", "U", "U'", "U2"];
const INVERSE = [1, 0, 2, 4, 3, 5];

export const EDGE_POS = ["UF", "UB", "UL", "UR", "DF", "DB"] as const;
const TRACKED = [
  ...EDGE_POS.flatMap((p) => pieceStickers(p)),
  ...["U", "F", "D", "B"].flatMap((p) => pieceStickers(p)),
  ...["UFR", "UFL", "UBL", "UBR"].flatMap((p) => pieceStickers(p)),
];
const keyOf = (s: State) => String.fromCharCode(...TRACKED.map((i) => s[i]));

const U_ID = faceIdOf("U");
const D_ID = faceIdOf("D");
export const edgeOriented = (s: State, pos: (typeof EDGE_POS)[number]) => {
  const c = s[pieceStickers(pos)[0]]; // sticker on the U or D face
  return c === U_ID || c === D_ID;
};
export const badEdges = (s: State) => EDGE_POS.filter((p) => !edgeOriented(s, p));
export const centresAligned = (s: State) => ["U", "F", "D", "B"].every((p) => s[pieceStickers(p)[0]] === faceIdOf(p as "U"));
export const cornersAligned = (s: State) => ["UFR", "UFL", "UBL", "UBR"].every((p) => pieceStickers(p).every((i) => s[i] === solvedState()[i]));

/** colour pair (as sorted ids) at an edge position */
export const edgeColours = (s: State, pos: (typeof EDGE_POS)[number]) =>
  pieceStickers(pos).map((i) => s[i]).sort((a, b) => a - b).join();
const LEFT_PAIR = [U_ID, faceIdOf("L")].sort((a, b) => a - b).join();
const RIGHT_PAIR = [U_ID, faceIdOf("R")].sort((a, b) => a - b).join();

export const eoDone = (s: State) => badEdges(s).length === 0 && centresAligned(s);
export const ulurDone = (s: State) =>
  eoDone(s) && cornersAligned(s) && edgeColours(s, "UL") === LEFT_PAIR && edgeColours(s, "UR") === RIGHT_PAIR;

export interface Space {
  states: State[];
  nbr: Int32Array; // nbr[i*6+m]
  parent: Int32Array;
  parentMove: Int8Array;
  index: Map<string, number>;
}

export function buildSpace(): Space {
  const start = solvedState();
  const states: State[] = [start];
  const index = new Map<string, number>([[keyOf(start), 0]]);
  const parent: number[] = [-1];
  const parentMove: number[] = [-1];
  const nbrList: number[] = [];
  for (let i = 0; i < states.length; i++) {
    for (let m = 0; m < 6; m++) {
      const ns = applyMove(states[i], LSE_MOVES[m]);
      const k = keyOf(ns);
      let j = index.get(k);
      if (j === undefined) {
        j = states.length;
        index.set(k, j);
        states.push(ns);
        parent.push(i);
        parentMove.push(m);
      }
      nbrList[i * 6 + m] = j;
    }
  }
  return { states, nbr: Int32Array.from(nbrList), parent: Int32Array.from(parent), parentMove: Int8Array.from(parentMove), index };
}

/** position of a state in the space (undefined when no M/U sequence can reach it) */
export function lookupState(sp: Space, s: State): number | undefined {
  return sp.index.get(keyOf(s));
}

export interface Dist {
  dist: Int16Array;
  next: Int8Array; // move to apply to get closer to a goal
}

export function distToGoal(sp: Space, isGoal: (s: State) => boolean): Dist {
  const n = sp.states.length;
  const dist = new Int16Array(n).fill(-1);
  const next = new Int8Array(n).fill(-1);
  const queue: number[] = [];
  for (let i = 0; i < n; i++)
    if (isGoal(sp.states[i])) {
      dist[i] = 0;
      queue.push(i);
    }
  for (let h = 0; h < queue.length; h++) {
    const u = queue[h];
    for (let m = 0; m < 6; m++) {
      const v = sp.nbr[u * 6 + m];
      if (dist[v] === -1) {
        dist[v] = dist[u] + 1;
        next[v] = INVERSE[m];
        queue.push(v);
      }
    }
  }
  return { dist, next };
}

export function pathFrom(sp: Space, d: Dist, i: number): string {
  const out: string[] = [];
  let cur = i;
  while (d.dist[cur] > 0) {
    const m = d.next[cur];
    out.push(LSE_MOVE_TEXT[m]);
    cur = sp.nbr[cur * 6 + m];
  }
  return out.join(" ");
}

/** moves from solved to reach state i (so applying the inverse solves it) */
export function scrambleTo(sp: Space, i: number): string {
  const out: string[] = [];
  for (let cur = i; sp.parent[cur] >= 0; cur = sp.parent[cur]) out.push(LSE_MOVE_TEXT[sp.parentMove[cur]]);
  return out.reverse().join(" ");
}

/** physically flip the given edge positions of a state (swap their two stickers) */
export function flipEdges(s: State, positions: readonly string[]): State {
  const out = Uint8Array.from(s);
  for (const p of positions) {
    const [a, b] = pieceStickers(p);
    [out[a], out[b]] = [out[b], out[a]];
  }
  return out;
}
