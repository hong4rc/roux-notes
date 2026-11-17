import { useEffect, useMemo, useState } from "react";
import { applyMove, parseAlg, type State } from "../../shared/cube";
import { tr } from "../lib/i18n";
import { CubeIso } from "./cube-iso";
import { useTurnAnim } from "./use-turn-anim";
import { FingerHint } from "./finger-hint";

/** what a move does, in plain words, for someone holding the cube the usual way */
export function moveWords(token: string): string {
  const face = token[0];
  const half = token.includes("2");
  const back = token.includes("'");
  const pick = (cw: [string, string], ccw: [string, string]) => (back ? tr(...ccw) : tr(...cw));
  const turn = half ? tr("nửa vòng", "half a turn") : tr("một phần tư vòng", "a quarter turn");
  const what: Record<string, () => string> = {
    R: () => tr("mặt phải", "the right face"),
    L: () => tr("mặt trái", "the left face"),
    U: () => tr("mặt trên", "the top face"),
    D: () => tr("mặt dưới", "the bottom face"),
    F: () => tr("mặt trước", "the front face"),
    B: () => tr("mặt sau", "the back face"),
    M: () => tr("lát giữa (giữa trái và phải)", "the middle slice (between left and right)"),
    r: () => tr("hai lớp bên phải (mặt phải và lát giữa)", "the two right layers (right face and middle slice)"),
  };
  // which way the stickers you can see go
  const dir: Record<string, () => string> = {
    R: () => pick(["phía trước đi lên", "the front goes up"], ["phía trước đi xuống", "the front goes down"]),
    r: () => pick(["phía trước đi lên", "the front goes up"], ["phía trước đi xuống", "the front goes down"]),
    L: () => pick(["phía trước đi xuống", "the front goes down"], ["phía trước đi lên", "the front goes up"]),
    M: () => pick(["phía trước đi xuống (như L)", "the front goes down (like L)"], ["phía trước đi lên (như L')", "the front goes up (like L')"]),
    U: () => pick(["phía trước đi sang trái", "the front goes to the left"], ["phía trước đi sang phải", "the front goes to the right"]),
    D: () => pick(["phía trước đi sang phải", "the front goes to the right"], ["phía trước đi sang trái", "the front goes to the left"]),
    F: () => pick(["xoay như kim đồng hồ, phía trên đi sang phải", "clockwise, the top goes to the right"], ["ngược kim đồng hồ, phía trên đi sang trái", "anticlockwise, the top goes to the left"]),
    B: () => pick(["nhìn từ trước: phía trên đi sang trái", "seen from the front: the top goes to the left"], ["nhìn từ trước: phía trên đi sang phải", "seen from the front: the top goes to the right"]),
  };
  if (!what[face]) return token;
  // X2' ends like X2; the prime only says which way the hand turns it
  if (half && back) return `${tr("Xoay", "Turn")} ${what[face]()} ${turn}, ${tr(`theo chiều ${face}'`, `the ${face}' way`)}: ${dir[face]()}.`;
  return half ? `${tr("Xoay", "Turn")} ${what[face]()} ${turn}.` : `${tr("Xoay", "Turn")} ${what[face]()} ${turn}: ${dir[face]()}.`;
}

/** step through a list of moves on a cube picture with the face letters on it */
export function MovePlayer({
  start,
  moves,
  aligning,
  fingers,
  width = 220,
  turn,
}: {
  start: State;
  moves: string[];
  aligning?: boolean[];
  /** per move: the written finger guide for it, when its algorithm has one */
  fingers?: ({ by: string; text: string } | null)[];
  width?: number;
  turn?: number;
}) {
  const states = useMemo(() => {
    const out: State[] = [start];
    for (const m of moves) out.push(applyMove(out[out.length - 1], parseAlg(m)[0]));
    return out;
  }, [start, moves]);
  const [kRaw, setK] = useState(0);
  // the reset effect runs after a render, so clamp here when a shorter list arrives
  const k = Math.min(kRaw, moves.length);
  const moveList = useMemo(() => moves.map((m) => parseAlg(m)[0]), [moves]);
  const pic = useTurnAnim(states, moveList, k);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    setK(0);
    setPlaying(false);
  }, [start, moves]);
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setK((x) => (x >= moves.length ? (setPlaying(false), x) : x + 1)), 900);
    return () => window.clearInterval(t);
  }, [playing, moves.length]);
  const done = k === moves.length;
  return (
    <div className="move-player">
      <CubeIso state={pic.state} anim={pic.anim} width={width} turn={turn} labels title={tr(`Cube sau ${k} nước`, `The cube after ${k} moves`)} />
      <div className="small" aria-live="polite" style={{ minHeight: "2.6em" }}>
        {k === 0 ? (
          tr("Chưa làm nước nào. Bấm ▶ hoặc chọn một nước.", "No move made yet. Press ▶ or pick a move.")
        ) : (
          <>
            <b translate="no">{moves[k - 1]}</b> ({k}/{moves.length}) · {moveWords(moves[k - 1])}
            {aligning?.[k - 1] && <> {tr("Đây là nước xoay cho khớp hình, chưa phải công thức.", "This is a lining-up turn, not part of the algorithm.")}</>}
            {" "}
            <FingerHint move={moves[k - 1]} guide={fingers?.[k - 1]} />
          </>
        )}
      </div>
      <div className="transport">
        <button className="btn small" onClick={() => setK(0)} disabled={k === 0} aria-label={tr("Về đầu", "Back to start")}>
          ⏮
        </button>
        <button className="btn small" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0} aria-label={tr("Lùi một nước", "Back one move")}>
          ◀
        </button>
        <button
          className="btn small primary"
          onClick={() => {
            if (done) setK(0);
            setPlaying(!playing);
          }}
          disabled={!moves.length}
        >
          {playing ? tr("⏸ Dừng", "⏸ Pause") : done && moves.length ? tr("↺ Phát lại", "↺ Play again") : tr("▶ Phát", "▶ Play")}
        </button>
        <button className="btn small" onClick={() => setK(Math.min(moves.length, k + 1))} disabled={done} aria-label={tr("Tiến một nước", "Forward one move")}>
          ▶|
        </button>
      </div>
      <div className="move-strip" role="group" aria-label={tr("Các nước đi", "Moves")}>
        {moves.map((m, i) => (
          <button key={i} className={`move-btn ${i < k ? "done" : ""} ${i === k - 1 ? "now" : ""} ${aligning?.[i] ? "auf" : ""}`} onClick={() => setK(i + 1)} translate="no">
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
