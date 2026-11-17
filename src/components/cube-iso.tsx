import { memo, useMemo } from "react";
import { moveTurn, rotateBy, STICKERS, stateKey, type Move, type State, type Vec } from "../../shared/cube";
import { tr } from "../lib/i18n";
import { colorOfId, GHOST_FILL, INK } from "../lib/palette";
import { useSettings } from "../lib/store";
import { polygonPaths } from "../lib/rough-util";
import { drawSticker, PathList, type StickerShape } from "./sticker-shapes";

const C = Math.cos(Math.PI / 6);
const S = 0.5;
const H = 0.455; // half sticker size
const U = 38; // pixels per cubie

export interface CubeIsoProps {
  state: State;
  /** sticker index → true when the sticker should be drawn as an empty (grey) placeholder */
  ghost?: (i: number) => boolean;
  /** sticker index → true when the sticker should get a heavy outline */
  mark?: (i: number) => boolean;
  /** quarter-turns around the vertical axis, to look at the cube from another corner */
  yaw?: number;
  /** "below": look up at the cube from underneath (the bottom face shows, the cube is not turned over) */
  view?: "above" | "below";
  width?: number;
  seed?: number;
  title?: string;
  /** cache key for ghost/mark functions (they are recreated on every render) */
  variant?: string;
  /** write the face letter (U, F, R…) on the centre sticker of each visible face */
  labels?: boolean;
  /** camera position round the cube in degrees from straight-on to the front; 45 (default) shows front and right equally */
  turn?: number;
  /** draw `move` part done: `state` is the cube before the move and t (0..1) how far the layer has turned */
  anim?: { move: Move; t: number };
}

const FACE_VEC: Record<"U" | "D" | "F" | "B" | "R" | "L", Vec> = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0] };

function yawRotate(v: Vec, yaw: number): Vec {
  let [x, y, z] = v;
  for (let i = 0; i < ((yaw % 4) + 4) % 4; i++) [x, z] = [z, -x];
  return [x + 0, y + 0, z + 0];
}
// orthographic views from the front-right corner, from above and from below
const project = ([x, y, z]: Vec): [number, number] => [(x - z) * C * U, ((x + z) * S - y) * U];
const projectBelow = ([x, y, z]: Vec): [number, number] => [(x - z) * C * U, (-(x + z) * S - y) * U];
// the same kind of view, with the camera moved round towards the front face: `deg` is how far right of straight-on it sits (45 = the default corner view)
const ISO_SCALE = Math.sqrt(1.5); // keeps the cube the same size as the default view
function projectTurned(deg: number, below: boolean) {
  const a = (deg * Math.PI) / 180;
  const e = Math.atan(Math.SQRT1_2) * (below ? -1 : 1);
  const [ca, sa, ce, se] = [Math.cos(a), Math.sin(a), Math.cos(e), Math.sin(e)];
  return ([x, y, z]: Vec): [number, number] => [(x * ca - z * sa) * ISO_SCALE * U, (x * sa * se + z * ca * se - y * ce) * ISO_SCALE * U];
}

/** convex hull of points (monotone chain): the outline of the cube whichever way it is seen */
function hull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (list: [number, number][]) => {
    const out: [number, number][] = [];
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 1e-9) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return [...build(p), ...build([...p].reverse())];
}

function CubeIsoBase({ state, ghost, mark, yaw = 0, view = "above", width = 200, seed = 1, title, variant, labels, turn = 45, anim }: CubeIsoProps) {
  const proj = useMemo(() => (turn === 45 ? (view === "below" ? projectBelow : project) : projectTurned(turn, view === "below")), [turn, view]);
  const { top, front } = useSettings();
  const stKey = stateKey(state);
  const shapes = useMemo(() => {
    const list: StickerShape[] = [];
    STICKERS.forEach((st, i) => {
      let p: Vec = st.pos;
      let n: Vec = st.nor;
      p = yawRotate(p, yaw);
      n = yawRotate(n, yaw);
      const below = view === "below";
      const visible = (below ? n[1] < 0 : n[1] > 0) || n[2] > 0 || n[0] > 0;
      if (!visible) return;
      const c: Vec = [p[0] + n[0] * 0.5, p[1] + n[1] * 0.5, p[2] + n[2] * 0.5];
      const axes = [0, 1, 2].filter((a) => n[a] === 0);
      const [a1, a2] = axes;
      const pts: [number, number][] = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([u, v]) => {
        const q: Vec = [c[0], c[1], c[2]];
        q[a1] += u * H;
        q[a2] += v * H;
        return proj(q);
      });
      list.push({
        points: pts,
        colorId: ghost?.(i) ? 9 : state[i],
        marked: mark?.(i),
        seed: seed * 97 + i,
      });
    });
    return list;
    // ghost/mark are identified by `variant`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stKey, yaw, view, seed, variant, top, front, proj]);
  const drawn = useMemo(() => shapes.map((sh) => drawSticker(sh)), [shapes]);

  // the letter names the place (front, right…), not the colour, so it stays put while centres move
  const letters = useMemo(() => {
    if (!labels) return [];
    const out: { x: number; y: number; t: string }[] = [];
    for (const f of ["U", "D", "F", "B", "R", "L"] as const) {
      const v = FACE_VEC[f];
      const n = yawRotate(v, yaw);
      const below = view === "below";
      if (!((below ? n[1] < 0 : n[1] > 0) || n[2] > 0 || n[0] > 0)) continue;
      const c: Vec = [n[0] * 1.5, n[1] * 1.5, n[2] * 1.5];
      const [x, y] = proj(c);
      out.push({ x, y, t: f });
    }
    return out;
  }, [labels, yaw, view, proj]);

  const outline = useMemo(() => {
    const corners: Vec[] = [];
    for (const x of [-1.5, 1.5]) for (const y of [-1.5, 1.5]) for (const z of [-1.5, 1.5]) corners.push([x, y, z]);
    return polygonPaths(hull(corners.map((v) => proj(v))), { seed: seed + 7, roughness: 1.1, bowing: 1, stroke: INK, strokeWidth: 2.6 });
  }, [seed, proj]);

  // while a layer turns: plain polygons (the hand-drawn look is too slow to redraw every frame). The cube is cut into its three
  // slices across the turning axis; each slice is a box drawn far one first, then its stickers, so the gap a turning layer
  // opens shows the box's inner face instead of a hole.
  const moving = useMemo(() => {
    if (!anim) return null;
    const g = moveTurn(anim.move);
    const th = (g.quarterTurns * Math.PI * anim.t) / 2;
    const deg = (turn * Math.PI) / 180;
    const e = Math.atan(Math.SQRT1_2) * (view === "below" ? -1 : 1);
    const cam: Vec = [Math.sin(deg) * Math.cos(e), Math.sin(e), Math.cos(deg) * Math.cos(e)];
    const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const unit = (a: number, len = 1): Vec => [0, 1, 2].map((i) => (i === a ? len : 0)) as Vec;
    const add = (...vs: Vec[]): Vec => [0, 1, 2].map((i) => vs.reduce((n, v) => n + v[i], 0)) as Vec;
    const toPts = (q: Vec[]) => q.map((v) => proj(v).join(",")).join(" ");
    const axisSeen = dot(yawRotate(unit(g.axis), yaw), cam);
    const slices = [-1, 0, 1].map((k) => {
      const pos = unit(g.axis, k);
      const turning = g.inLayer(pos);
      const r = (v: Vec) => yawRotate(turning ? rotateBy(v, g.axis, th) : v, yaw);
      const faces: string[] = [];
      for (const a of [0, 1, 2])
        for (const sgn of [-1, 1]) {
          const n = r(unit(a, sgn));
          if (dot(n, cam) <= 1e-6) continue;
          const [b1, b2] = [0, 1, 2].filter((x) => x !== a);
          const half = (x: number) => (x === g.axis ? 0.5 : 1.5);
          const centre = add(pos, unit(a, sgn * half(a)));
          const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => r(add(centre, unit(b1, u * half(b1)), unit(b2, v * half(b2)))));
          faces.push(toPts(corners));
        }
      const stickers: { pts: string; fill: string; ghost: boolean }[] = [];
      STICKERS.forEach((st, i) => {
        if (st.pos[g.axis] !== k) return;
        const n = r(st.nor);
        if (dot(n, cam) <= 1e-6) return;
        const [a1, a2] = [0, 1, 2].filter((a) => st.nor[a] === 0);
        const c = add(st.pos, [st.nor[0] * 0.5, st.nor[1] * 0.5, st.nor[2] * 0.5]);
        const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => r(add(c, unit(a1, u * H), unit(a2, v * H))));
        const ghosted = !!ghost?.(i);
        stickers.push({ pts: toPts(corners), fill: ghosted ? GHOST_FILL : colorOfId(state[i]), ghost: ghosted });
      });
      return { k, faces, stickers };
    });
    // slices stay apart along the axis, so the one further from the eye is simply drawn first
    slices.sort((x, y) => (x.k - y.k) * axisSeen);
    return slices;
    // ghost is identified by `variant`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim?.move.name, anim?.move.cw, anim?.t, stKey, yaw, view, turn, variant, top, front, proj]);

  const pad = 0.35 * U;
  const vbW = 6 * C * U + pad * 2;
  const vbH = 6 * U + pad * 2;
  return (
    <svg
      viewBox={`${-vbW / 2} ${-vbH / 2} ${vbW} ${vbH}`}
      width={width}
      height={(width * vbH) / vbW}
      role="img"
      aria-label={title ?? tr("Hình khối Rubik", "Rubik's cube picture")}
      className="cube-svg"
    >
      {title && <title>{title}</title>}
      <g>
        {moving ? (
          <>
            {moving.map((sl) => (
              <g key={sl.k}>
                {sl.faces.map((f, i) => (
                  <polygon key={`f${i}`} points={f} fill="var(--paper)" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
                ))}
                {sl.stickers.map((q, i) => (
                  <polygon key={i} points={q.pts} fill={q.fill} stroke={q.ghost ? "#8f897a" : INK} strokeWidth={q.ghost ? 0.9 : 1.4} strokeLinejoin="round" />
                ))}
              </g>
            ))}
          </>
        ) : (
          <>
            {shapes.map((_, i) => (
              <PathList key={i} prefix={`s${i}`} paths={drawn[i]} />
            ))}
            <PathList prefix="o" paths={outline} />
          </>
        )}
        {letters.map((l) => (
          <text key={l.t} x={l.x} y={l.y} className="face-letter" textAnchor="middle" dominantBaseline="central" aria-hidden="true">
            {l.t}
          </text>
        ))}
      </g>
    </svg>
  );
}

export const CubeIso = memo(CubeIsoBase);
