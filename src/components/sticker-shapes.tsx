import { colorOfId, GHOST_FILL, INK } from "../lib/palette";
import { polygonPaths, type PathPiece } from "../lib/rough-util";

export interface StickerShape {
  points: [number, number][];
  colorId: number; // 0-5 face colour, anything else = ghost
  marked?: boolean;
  seed: number;
}

export function drawSticker(sh: StickerShape): PathPiece[] {
  const ghost = sh.colorId > 5;
  const fill = ghost ? GHOST_FILL : colorOfId(sh.colorId);
  return polygonPaths(sh.points, {
    seed: sh.seed,
    roughness: ghost ? 0.7 : 0.8,
    bowing: 0.6,
    stroke: ghost ? "#8f897a" : INK,
    strokeWidth: sh.marked ? 2.4 : ghost ? 0.9 : 1.4,
    fill,
    fillStyle: "solid",
    hachureGap: 3.2,
    fillWeight: 0.8,
    disableMultiStroke: true,
  });
}

export function PathList({ paths, prefix }: { paths: PathPiece[]; prefix: string }) {
  return (
    <>
      {paths.map((p, i) => (
        <path
          key={`${prefix}-${i}`}
          d={p.d}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          fill={p.fill ?? "none"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}
