import { memo, useMemo } from "react";
import { stickerIndex, stateKey, type State, type Vec } from "../../shared/cube";
import { tr } from "../lib/i18n";
import { INK } from "../lib/palette";
import { useSettings } from "../lib/store";
import { curvePaths, linePaths, polygonPaths } from "../lib/rough-util";
import { drawSticker, PathList, type StickerShape } from "./sticker-shapes";

const U = 44; // pixels per cell
const GAP = 0.07;
const T = 0.3; // side strip thickness
const IN = 0.07; // inset of stickers inside their cell

export interface TopArrow {
  /** cell coordinates on the top face, (0,0) = back-left, (2,2) = front-right */
  from: [number, number];
  to: [number, number];
  curved?: boolean;
}

export interface LLTopProps {
  state: State;
  /** which U-layer pieces to draw in colour: "corners", "edges", "all" (centre is always coloured) */
  show?: "corners" | "edges" | "all";
  /** draw an extra heavy outline around these sticker indices */
  mark?: (i: number) => boolean;
  arrows?: TopArrow[];
  /** draw only stickers of this colour id (everything else becomes a grey placeholder) */
  onlyColor?: number;
  width?: number;
  seed?: number;
  title?: string;
  variant?: string;
}

const cellRect = (col: number, row: number): [number, number, number, number] => [col, row, col + 1, row + 1];

function quad(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  return [
    [x0 + IN, y0 + IN],
    [x1 - IN, y0 + IN],
    [x1 - IN, y1 - IN],
    [x0 + IN, y1 - IN],
  ].map(([x, y]) => [x * U, y * U] as [number, number]);
}

function LLTopBase({ state, show = "corners", mark, arrows, onlyColor, width = 160, seed = 3, title, variant }: LLTopProps) {
  const { top: schemeTop, front: schemeFront } = useSettings();
  const stKey = stateKey(state);
  const shapes = useMemo(() => {
    const out: StickerShape[] = [];
    const isCorner = (x: number, z: number) => x !== 0 && z !== 0;
    const visible = (x: number, z: number) => {
      const corner = isCorner(x, z);
      const centre = x === 0 && z === 0;
      if (centre) return true;
      if (show === "all") return true;
      return show === "corners" ? corner : !corner;
    };
    for (let z = -1; z <= 1; z++) {
      for (let x = -1; x <= 1; x++) {
        const col = x + 1;
        const row = z + 1;
        const top = stickerIndex([x, 1, z], [0, 1, 0]);
        const [x0, y0, x1, y1] = cellRect(col, row);
        out.push({
          points: quad(x0, y0, x1, y1),
          colorId: visible(x, z) && (onlyColor === undefined || state[top] === onlyColor) ? state[top] : 9,
          marked: mark?.(top),
          seed: seed * 53 + top,
        });
        // side stickers: only for the outer ring
        const sides: { n: Vec; rect: [number, number, number, number] }[] = [];
        if (z === 1) sides.push({ n: [0, 0, 1], rect: [col, 3 + GAP, col + 1, 3 + GAP + T] });
        if (z === -1) sides.push({ n: [0, 0, -1], rect: [col, -GAP - T, col + 1, -GAP] });
        if (x === 1) sides.push({ n: [1, 0, 0], rect: [3 + GAP, row, 3 + GAP + T, row + 1] });
        if (x === -1) sides.push({ n: [-1, 0, 0], rect: [-GAP - T, row, -GAP, row + 1] });
        for (const s of sides) {
          const idx = stickerIndex([x, 1, z], s.n);
          out.push({
            points: quad(s.rect[0], s.rect[1], s.rect[2], s.rect[3]).map(([px, py]) => [px, py] as [number, number]),
            colorId: visible(x, z) && (onlyColor === undefined || state[idx] === onlyColor) ? state[idx] : 9,
            marked: mark?.(idx),
            seed: seed * 71 + idx,
          });
        }
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stKey, show, seed, variant, onlyColor, schemeTop, schemeFront]);
  const drawn = useMemo(() => shapes.map((sh) => drawSticker(sh)), [shapes]);

  const arrowPaths = useMemo(() => {
    return (arrows ?? []).flatMap((a, k) => {
      const [fx, fy] = [(a.from[0] + 0.5) * U, (a.from[1] + 0.5) * U];
      const [tx, ty] = [(a.to[0] + 0.5) * U, (a.to[1] + 0.5) * U];
      const dx = tx - fx;
      const dy = ty - fy;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const sx = fx + ux * 9;
      const sy = fy + uy * 9;
      const ex = tx - ux * 9;
      const ey = ty - uy * 9;
      const nx = -uy;
      const ny = ux;
      const body = a.curved
        ? curvePaths(
            [
              [sx, sy],
              [(sx + ex) / 2 + nx * 16, (sy + ey) / 2 + ny * 16],
              [ex, ey],
            ],
            { seed: seed + k, roughness: 0.8, stroke: INK, strokeWidth: 2.2 },
          )
        : linePaths(sx, sy, ex, ey, { seed: seed + k, roughness: 0.8, stroke: INK, strokeWidth: 2.2 });
      const hx = ex - ux * 9;
      const hy = ey - uy * 9;
      const head = polygonPaths(
        [
          [ex, ey],
          [hx + nx * 5.5, hy + ny * 5.5],
          [hx - nx * 5.5, hy - ny * 5.5],
        ],
        { seed: seed + k + 5, roughness: 0.5, stroke: INK, strokeWidth: 1.6, fill: INK, fillStyle: "solid" },
      );
      return [...body, ...head];
    });
  }, [arrows, seed]);

  const total = 3 + 2 * (GAP + T);
  const pad = 0.12;
  const min = -(GAP + T) - pad;
  const size = (total + 2 * pad) * U;
  return (
    <svg
      viewBox={`${min * U} ${min * U} ${size} ${size}`}
      width={width}
      height={width}
      role="img"
      aria-label={title ?? tr("Hình nhìn từ trên xuống", "Top-down view")}
      className="cube-svg"
    >
      {title && <title>{title}</title>}
      {shapes.map((_, i) => (
        <PathList key={i} prefix={`t${i}`} paths={drawn[i]} />
      ))}
      <PathList prefix="a" paths={arrowPaths} />
    </svg>
  );
}

export const LLTop = memo(LLTopBase);
