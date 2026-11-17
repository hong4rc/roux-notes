import rough from "roughjs";
import type { Options } from "roughjs/bin/core";

const gen = rough.generator();

export interface PathPiece {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill?: string;
}

export function polygonPaths(points: [number, number][], opts: Options): PathPiece[] {
  return gen.toPaths(gen.polygon(points, opts)) as PathPiece[];
}

export function linePaths(x1: number, y1: number, x2: number, y2: number, opts: Options): PathPiece[] {
  return gen.toPaths(gen.line(x1, y1, x2, y2, opts)) as PathPiece[];
}

export function curvePaths(points: [number, number][], opts: Options): PathPiece[] {
  return gen.toPaths(gen.curve(points, opts)) as PathPiece[];
}

export function rectPaths(x: number, y: number, w: number, h: number, opts: Options): PathPiece[] {
  return gen.toPaths(gen.rectangle(x, y, w, h, opts)) as PathPiece[];
}
