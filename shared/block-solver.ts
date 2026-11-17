// Shortest-solution search for a set of pieces (the Roux blocks): IDA* with exact distance tables of piece subsets as the estimate.
// A piece is followed by the sticker that sits on its reference sticker at home, so one number holds both where it is and how it is turned.
import { applyMove, pieceStickers, solvedState, type Move, type State } from "./cube";

const IDENTITY = Uint8Array.from({ length: 54 }, (_, i) => i);

/** where each sticker goes under a move */
function forward(m: Move): Int16Array {
  const back = applyMove(IDENTITY, m); // back[new] = old
  const f = new Int16Array(54);
  for (let j = 0; j < 54; j++) f[back[j]] = j;
  return f;
}

const AXIS: Record<string, number> = { R: 0, L: 0, M: 0, r: 0, l: 0, U: 1, D: 1, E: 1, u: 1, d: 1, F: 2, B: 2, S: 2, f: 2, b: 2 };

export interface BlockProblem {
  /** move names allowed, in the order the search prefers them */
  faces: string[];
  /** pieces that must reach home: "DL", "DFL", or a single face letter for a centre */
  pieces: string[];
  /** subsets (indices into pieces) that get an exact distance table each */
  tables: number[][];
}

export interface BlockSolver {
  solve(s: State, maxDepth?: number, budget?: number): { alg: string; moves: number } | null;
  /** distance estimate (a lower bound) for a state */
  estimate(s: State): number;
}

export function makeBlockSolver(p: BlockProblem): BlockSolver {
  const moves: Move[] = p.faces.flatMap((name) => [1, 3, 2].map((cw) => ({ name, cw: cw as 1 | 2 | 3 })));
  const fwd = moves.map(forward);
  const ref = p.pieces.map((name) => pieceStickers(name)[0]);
  // reachable reference-sticker positions of each piece, numbered 0..n-1
  const slots = ref.map((r) => {
    const seen = [r];
    for (let i = 0; i < seen.length; i++) for (const f of fwd) if (!seen.includes(f[seen[i]])) seen.push(f[seen[i]]);
    return seen;
  });
  const slotOf = slots.map((list) => {
    const a = new Int16Array(54).fill(-1);
    list.forEach((st, i) => (a[st] = i));
    return a;
  });
  // trans[piece][move * n + slot] = slot after the move
  const trans = slots.map((list, k) => {
    const n = list.length;
    const t = new Int16Array(moves.length * n);
    moves.forEach((_, m) => list.forEach((st, i) => (t[m * n + i] = slotOf[k][fwd[m][st]])));
    return t;
  });
  const radix = slots.map((l) => l.length);

  const tables = p.tables.map((subset) => {
    const size = subset.reduce((n, k) => n * radix[k], 1);
    const dist = new Uint8Array(size).fill(255);
    const enc = (c: number[]) => subset.reduce((n, k, j) => n * radix[k] + c[j], 0);
    const dec = (code: number, out: number[]) => {
      for (let j = subset.length - 1; j >= 0; j--) {
        out[j] = code % radix[subset[j]];
        code = (code - out[j]) / radix[subset[j]];
      }
    };
    let frontier = [enc(subset.map(() => 0))];
    dist[frontier[0]] = 0;
    const c: number[] = new Array(subset.length).fill(0);
    const nc: number[] = new Array(subset.length).fill(0);
    for (let d = 0; frontier.length; d++) {
      const next: number[] = [];
      for (const code of frontier) {
        dec(code, c);
        for (let m = 0; m < moves.length; m++) {
          for (let j = 0; j < subset.length; j++) {
            const k = subset[j];
            nc[j] = trans[k][m * radix[k] + c[j]];
          }
          const e = enc(nc);
          if (dist[e] === 255) {
            dist[e] = d + 1;
            next.push(e);
          }
        }
      }
      frontier = next;
    }
    return { subset, dist };
  });

  // the piece is the cubie showing its home colours; its slot is the sticker that shows its reference colour
  const homeSet = p.pieces.map((name) => pieceStickers(name).map((i) => SOLVED[i]).sort().join());
  const read = (s: State): number[] =>
    p.pieces.map((_, k) => {
      const want = SOLVED[ref[k]];
      for (const st of slots[k]) {
        if (s[st] !== want) continue;
        if (CUBIE_OF.get(st)!.map((i) => s[i]).sort().join() === homeSet[k]) return slotOf[k][st];
      }
      return -1;
    });

  const h = (c: number[]) => {
    let best = 0;
    for (const t of tables) {
      let code = 0;
      for (const k of t.subset) code = code * radix[k] + c[k];
      const v = t.dist[code];
      if (v > best) best = v;
    }
    return best;
  };

  const axisOf = moves.map((m) => AXIS[m.name]);
  const faceOf = moves.map((m) => p.faces.indexOf(m.name));

  return {
    estimate: (s) => h(read(s)),
    solve(s, maxDepth = 20, budget = 5_000_000) {
      const start = read(s);
      if (start.some((v) => v < 0)) return null;
      const path: number[] = [];
      let nodes = 0;
      const dfs = (c: number[], g: number, bound: number, last: number): boolean => {
        const est = h(c);
        if (est === 0) return true;
        if (g + est > bound) return false;
        if (++nodes > budget) throw new Error("budget");
        for (let m = 0; m < moves.length; m++) {
          if (last >= 0) {
            if (faceOf[m] === faceOf[last]) continue;
            // turns on one axis commute: keep only one order of them
            if (axisOf[m] === axisOf[last] && faceOf[m] < faceOf[last]) continue;
          }
          const nc = c.map((v, k) => trans[k][m * radix[k] + v]);
          path.push(m);
          if (dfs(nc, g + 1, bound, m)) return true;
          path.pop();
        }
        return false;
      };
      try {
        for (let bound = h(start); bound <= maxDepth; bound++) {
          if (dfs(start, 0, bound, -1)) {
            const alg = path.map((m) => moves[m].name + (moves[m].cw === 3 ? "'" : moves[m].cw === 2 ? "2" : "")).join(" ");
            return { alg, moves: path.length };
          }
        }
      } catch (e) {
        if (String(e).includes("budget")) return null;
        throw e;
      }
      return null;
    },
  };
}

// sticker index -> every sticker of the cubie it sits on
const SOLVED = solvedState();
const CUBIE_OF = new Map<number, number[]>();
for (const name of ["UF", "UR", "UB", "UL", "DF", "DR", "DB", "DL", "FR", "FL", "BR", "BL", "UFR", "UFL", "UBR", "UBL", "DFR", "DFL", "DBR", "DBL", "U", "R", "F", "D", "L", "B"]) {
  const st = pieceStickers(name);
  for (const i of st) CUBIE_OF.set(i, st);
}
