import { useEffect, useMemo, useRef, useState } from "react";
import { applyMove, parseAlg, pieceStickers, type State } from "../../shared/cube";
import { tr, useLang } from "../lib/i18n";
import { explainChunks, type Chunk, factsOf, factsSentence, type Token } from "../lib/explain";
import { CubeIso } from "./cube-iso";
import { useTurnAnim } from "./use-turn-anim";
import { FingerHint } from "./finger-hint";
import { guideFor } from "../data/finger-guides";

const LSE_EDGE_POS = ["UF", "UB", "UL", "UR", "DF", "DB"];
const LSE_GHOST = new Set(LSE_EDGE_POS.flatMap((p) => pieceStickers(p)));
const ghostEdges = (i: number) => LSE_GHOST.has(i);

export interface StepperProps {
  start: State;
  alg: string;
  pre?: string;
  post?: string;
  /** hide the LSE edges (they are scrambled by CMLL and not the point of the picture) */
  hideEdges?: boolean;
  yaw?: number;
  /** what is true once the last move is done */
  doneText?: string;
  /** the caller's own split into steps (number of moves in each, in order), used instead of the automatic one */
  steps?: { moves: number; title: string; what: string }[];
}

export function AlgStepper({ start, alg, pre, post, hideEdges = true, yaw = 0, doneText, steps }: StepperProps) {
  const lang = useLang();
  const tokens: Token[] = useMemo(() => {
    const list: Token[] = [];
    const push = (s: string | undefined, auf: boolean) => {
      if (!s) return;
      const raw = s.split(" ").filter(Boolean);
      const mv = parseAlg(s);
      mv.forEach((m, i) => list.push({ text: raw[i], move: m, auf }));
    };
    push(pre, true);
    push(alg, false);
    push(post, true);
    return list;
  }, [alg, pre, post]);

  const states = useMemo(() => {
    const out: State[] = [start];
    for (const t of tokens) out.push(applyMove(out[out.length - 1], t.move));
    return out;
  }, [start, tokens]);

  const chunks = useMemo((): Chunk[] => {
    if (!steps) return explainChunks(tokens, states);
    let from = 0;
    return steps.map((s) => ({ from, to: (from += s.moves), title: s.title, what: s.what }));
  }, [tokens, states, lang, steps]);
  const [kRaw, setK] = useState(0);
  // the reset effect runs after a render, so clamp here when a shorter algorithm arrives
  const k = Math.min(kRaw, tokens.length);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setK(0);
    setPlaying(false);
  }, [start, alg, pre, post]);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setK((x) => {
        if (x >= tokens.length) {
          setPlaying(false);
          return x;
        }
        return x + 1;
      });
    }, 850);
    return () => window.clearInterval(timer.current);
  }, [playing, tokens.length]);

  const cur = states[k];
  // one entry per token: the written guide for the moves of the algorithm itself, nothing for the U alignment turns
  const guides = useMemo(() => {
    const g = guideFor(alg);
    const nPre = pre ? parseAlg(pre).length : 0;
    return tokens.map((t, i) => {
      const text = t.auf || !g ? null : (g.steps[i - nPre] ?? null);
      return text ? { by: g!.by, text } : null;
    });
  }, [tokens, alg, pre, lang]);
  const moveList = useMemo(() => tokens.map((t) => t.move), [tokens]);
  const pic = useTurnAnim(states, moveList, k);
  const facts = factsOf(cur);
  const chunkIdx = chunks.findIndex((c) => k > c.from && k <= c.to);
  const active = chunks[chunkIdx];
  const done = k === tokens.length;

  return (
    <div className="stepper">
      <div style={{ textAlign: "center" }}>
        <CubeIso
          state={pic.state}
          anim={pic.anim}
          width={250}
          yaw={yaw}
          ghost={hideEdges ? ghostEdges : undefined}
          variant={hideEdges ? "no-edges" : "all"}
          title={tr(`Khối sau ${k} nước`, `Cube after ${k} moves`)}
        />
        <div className="small muted" aria-live="polite">
          {k === 0
            ? tr("Trạng thái ban đầu của case", "Starting state of the case")
            : done
              ? (doneText ?? tr("Xong", "Done"))
              : tr(`Sau nước ${k}/${tokens.length}: ${tokens[k - 1].text}`, `After move ${k}/${tokens.length}: ${tokens[k - 1].text}`)}
        </div>
        <div className="small finger-line" aria-live="polite">
          {k > 0 && <FingerHint move={tokens[k - 1].text} guide={guides[k - 1]} />}
        </div>
        <div className="transport" style={{ justifyContent: "center" }}>
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
            aria-label={playing ? tr("Dừng", "Pause") : tr("Phát", "Play")}
          >
            {playing ? tr("⏸ Dừng", "⏸ Pause") : done ? tr("↺ Phát lại", "↺ Play again") : tr("▶ Phát", "▶ Play")}
          </button>
          <button className="btn small" onClick={() => setK(Math.min(tokens.length, k + 1))} disabled={done} aria-label={tr("Tiến một nước", "Forward one move")}>
            ▶|
          </button>
        </div>
      </div>

      <div>
        <div className="move-strip" role="group" aria-label={tr("Các nước đi", "Moves")}>
          {tokens.map((t, i) => (
            <button
              key={i}
              className={`move-btn ${i < k ? "done" : ""} ${i === k - 1 ? "now" : ""} ${t.auf ? "auf" : ""}`}
              onClick={() => setK(i + 1)}
              aria-label={tr(`Đến nước ${i + 1}: ${t.text}`, `Go to move ${i + 1}: ${t.text}`)}
              translate="no"
            >
              {t.text}
            </button>
          ))}
        </div>

        <div className="callout info" style={{ margin: "6px 0 12px" }}>
          <div className="ttl">{tr("Đang ở đây", "You are here")}</div>
          {k === 0 ? (
            <p style={{ margin: 0 }}>{tr("Chưa làm nước nào. Bấm ▶ hoặc chọn một nước để xem từng bước.", "No move made yet. Press ▶ or pick a move to see each step.")}</p>
          ) : (
            <>
              {active && (
                <p style={{ margin: "0 0 6px" }}>
                  <strong>{active.title}</strong>: {active.what}
                </p>
              )}
              <ul className="small" style={{ margin: 0 }}>
                {factsSentence(facts).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <h4 style={{ margin: "8px 0 4px" }}>{tr("Chia thành các bước", "Split into steps")}</h4>
        <ol className="step-chunks" style={{ paddingLeft: "1.2em" }}>
          {chunks.map((c, i) => {
            const text = tokens.slice(c.from, c.to).map((t) => t.text).join(" ");
            const isActive = i === chunkIdx;
            return (
              <li key={i} style={{ background: isActive ? "var(--hi)" : undefined, borderRadius: 8, padding: "2px 6px" }}>
                <button
                  className="chip"
                  style={{ fontFamily: "var(--font-mono)", marginRight: 8 }}
                  onClick={() => setK(c.to)}
                  aria-label={tr(`Chạy đến hết bước ${i + 1}`, `Run to the end of step ${i + 1}`)}
                  translate="no"
                >
                  {text}
                </button>
                <strong>{c.title}</strong>
                <div className="small muted">{c.what}</div>
                {c.why && <div className="small">↳ {tr("Vì sao", "Why")}: {c.why}</div>}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
