import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { invertMoves, type Move, type State } from "../../shared/cube";

/** how long one layer takes to turn on screen */
export const TURN_MS = 320;

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
// starts slow, speeds up, slows down again: reads like a hand turning the layer
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2);

/**
 * The picture to draw while a stepper moves from one position to the next. One step forward turns that layer; one step back
 * turns it the other way, from the later picture. A jump of more than one move (start, end, a click far along the list) is
 * shown at once, and so is everything when the reader asked the system for less motion.
 */
export function useTurnAnim(states: State[], moves: Move[], k: number): { state: State; anim?: { move: Move; t: number } } {
  const prev = useRef(k);
  const lastStates = useRef(states);
  const [run, setRun] = useState<{ from: State; move: Move; t: number } | null>(null);
  const frame = useRef<number | undefined>(undefined);

  // before paint, so the finished picture never flashes ahead of the turn
  useLayoutEffect(() => {
    const p = prev.current;
    prev.current = k;
    const sameList = lastStates.current === states;
    lastStates.current = states;
    if (frame.current) cancelAnimationFrame(frame.current);
    if (!sameList || reducedMotion() || Math.abs(k - p) !== 1) {
      setRun(null);
      return;
    }
    const step = k > p ? { from: states[p], move: moves[p] } : { from: states[p], move: invertMoves([moves[k]])[0] };
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / TURN_MS);
      if (t >= 1) {
        setRun(null);
        return;
      }
      setRun({ ...step, t: ease(t) });
      frame.current = requestAnimationFrame(tick);
    };
    setRun({ ...step, t: 0 });
    frame.current = requestAnimationFrame(tick);
  }, [k, states, moves]);

  useEffect(() => () => void (frame.current && cancelAnimationFrame(frame.current)), []);

  return run ? { state: run.from, anim: { move: run.move, t: run.t } } : { state: states[Math.min(k, states.length - 1)] };
}
