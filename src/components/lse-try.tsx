import { useEffect, useMemo, useState } from "react";
import { applyAlg, solvedState, type State } from "../../shared/cube";
import { LSE_MOVE_TEXT, badEdges, distToGoal, lookupState, ulurDone, type Dist } from "../../shared/lse-space";
import { tr } from "../lib/i18n";
import { lseScramble, lseSpace } from "../lib/scramble";
import { EdgeMoves } from "./edge-story";
import { LseView } from "./lse-view";
import { ScrambleLine } from "./ui";

export type TryStep = "eo" | "ulur" | "l4e" | "eolr";

const S = solvedState();
const isSolved = (s: State) => s.every((v, i) => v === S[i]);
const GOAL: Record<TryStep, (s: State) => boolean> = {
  eo: (s) => badEdges(s).length === 0,
  ulur: ulurDone,
  l4e: isSolved,
  eolr: ulurDone,
};
/** the kind of start position each step is practised from (EOLR starts from any lined-up cube) */
const SCRAMBLE_KIND: Record<TryStep, "lse" | "eo" | "ulur" | "l4e"> = { eo: "eo", ulur: "ulur", l4e: "l4e", eolr: "lse" };

const dists = new Map<TryStep, Dist>();
function distOf(step: TryStep): Dist {
  let d = dists.get(step);
  if (!d) {
    d = distToGoal(lseSpace(), GOAL[step]);
    dists.set(step, d);
  }
  return d;
}

const TABS: { id: TryStep; label: () => string; goal: () => string }[] = [
  { id: "eo", label: () => tr("1. EO", "1. EO"), goal: () => tr("không còn cạnh xấu", "no bad edge left") },
  { id: "ulur", label: () => tr("2. UL/UR", "2. UL/UR"), goal: () => tr("cạnh trái ở UL, cạnh phải ở UR, góc khớp hai khối", "left edge at UL, right edge at UR, corners matching the blocks") },
  { id: "l4e", label: () => tr("3. 4c", "3. 4c"), goal: () => tr("giải xong cube", "the cube solved") },
  { id: "eolr", label: () => tr("EOLR (bước 1 và 2 gộp)", "EOLR (steps 1 and 2 merged)"), goal: () => tr("mọi cạnh đúng hướng, UL và UR đúng chỗ", "every edge oriented, UL and UR in place") },
];

const MOVE_BUTTONS = ["M'", "M", "M2", "U'", "U", "U2"];

/** the moves of a typed sequence, or the first word that is not an M or U turn */
function parseSeq(text: string): { moves: string[] } | { bad: string } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const bad = words.find((w) => !LSE_MOVE_TEXT.includes(w));
  return bad ? { bad } : { moves: words };
}

/**
 * A sandbox for working a step out yourself: build a sequence move by move on a random case and watch the cube, the list of
 * what still has to move where, and the fewest moves the solver still needs. A move that lowers the number is a move in the
 * right direction. `describe` words the state of a step (the page passes its own wording).
 */
export function LseTryLab({ initial = "eo", describe }: { initial?: TryStep; describe: (step: "eo" | "ulur" | "l4e", s: State) => string }) {
  const [step, setStep] = useState<TryStep>(initial);
  const [scramble, setScramble] = useState<string | null>(null);
  // built after the first paint: the search behind a scramble takes about a second
  useEffect(() => {
    const id = setTimeout(() => setScramble((s) => s ?? lseScramble(SCRAMBLE_KIND[initial])), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [moves, setMoves] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [hint, setHint] = useState(false);

  const start = useMemo(() => (scramble ? applyAlg(S, scramble) : null), [scramble]);
  const states = useMemo(() => {
    if (!start) return [];
    const out = [start];
    for (const m of moves) out.push(applyAlg(out[out.length - 1], m));
    return out;
  }, [start, moves]);
  const now = states[states.length - 1];
  const d = scramble ? distOf(step) : null;
  const left = useMemo(() => {
    if (!d) return [];
    return states.map((s) => {
      const i = lookupState(lseSpace(), s);
      return i === undefined ? -1 : d.dist[i];
    });
  }, [states, d]);

  const begin = (k: TryStep = step) => {
    setStep(k);
    setMoves([]);
    setTyped("");
    setHint(false);
    setScramble(lseScramble(SCRAMBLE_KIND[k]));
  };
  const add = (m: string) => {
    setMoves([...moves, m]);
    setHint(false);
  };
  const parsed = typed.trim() ? parseSeq(typed) : null;
  const tab = TABS.find((t) => t.id === step)!;
  const done = !!now && GOAL[step](now);
  const remaining = left[left.length - 1];
  const best = left[0];
  const suggestion = d && now && !done ? LSE_MOVE_TEXT[d.next[lookupState(lseSpace(), now) ?? 0]] : null;

  return (
    <div className="card drill" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>{tr("Tự thử và kiểm tra: tự dựng chuỗi, chương trình báo còn bao xa", "Try it yourself and check: build a sequence, the solver tells how far you are")}</h3>
      <p className="small">
        {tr(
          "Chọn một bước, làm scramble, rồi bấm từng nước M và U (hoặc gõ cả chuỗi của bạn). Sau mỗi nước, trang cho biết cạnh nào còn xấu, cạnh nào phải đi đâu, và chương trình còn cần tối thiểu bao nhiêu nước. Số đó giảm là nước của bạn đi đúng hướng; tăng là đi xa. Đây là cách tự học bằng thử rồi kiểm tra: không cần nhớ chuỗi, chỉ cần biết mỗi nước làm gì.",
          "Pick a step, do the scramble, then press the M and U moves one by one (or type your whole sequence). After each move the page shows which edges are still bad, which edge has to go where, and the fewest moves the solver still needs. When that number drops your move went the right way; when it rises you went away. This is learning by trying yourself and checking: you do not memorise sequences, you only need to know what each move does.",
        )}
      </p>
      <div className="bar" role="group" aria-label={tr("Chọn bước để thử", "Choose the step to try")}>
        {TABS.map((t) => (
          <button key={t.id} type="button" className="chip" aria-pressed={step === t.id} onClick={() => begin(t.id)}>
            {t.label()}
          </button>
        ))}
      </div>
      {!scramble || !start || !now ? (
        <p className="muted">{tr("Chọn một bước để nhận scramble.", "Pick a step to get a scramble.")}</p>
      ) : (
        <>
          <ScrambleLine scramble={scramble} onReroll={() => begin()} />
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <LseView state={now} mode={step === "eo" ? "eo" : "all"} width={170} />
              <p className="small muted" style={{ margin: "4px 0 0", maxWidth: 190 }}>
                {tr("Mục tiêu: ", "Goal: ")}
                {tab.goal()}.
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 230 }}>
              <div className="bar" role="group" aria-label={tr("Các nước M và U", "The M and U moves")}>
                {MOVE_BUTTONS.map((m) => (
                  <button key={m} type="button" className="btn small" onClick={() => add(m)} disabled={done}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="bar">
                <button type="button" className="btn small" onClick={() => setMoves(moves.slice(0, -1))} disabled={!moves.length}>
                  {tr("↶ Hoàn tác", "↶ Undo")}
                </button>
                <button type="button" className="btn small" onClick={() => setMoves([])} disabled={!moves.length}>
                  {tr("Làm lại từ đầu", "Start over")}
                </button>
                <button type="button" className="btn small" onClick={() => begin()}>
                  {tr("↻ Bài khác", "↻ Another one")}
                </button>
              </div>
              <p className="small" style={{ margin: "6px 0" }}>
                <b>{tr("Đã làm:", "Done so far:")}</b> <code translate="no">{moves.length ? moves.join(" ") : "—"}</code>
              </p>
              <label className="small" style={{ display: "block" }}>
                {tr("Hoặc gõ chuỗi của bạn (chỉ M, M', M2, U, U', U2):", "Or type your own sequence (only M, M', M2, U, U', U2):")}
                <div className="bar" style={{ marginTop: 4 }}>
                  <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="M' U M'" spellCheck={false} style={{ minWidth: 160 }} />
                  <button
                    type="button"
                    className="btn small"
                    disabled={!parsed || "bad" in parsed}
                    onClick={() => {
                      if (parsed && "moves" in parsed) {
                        setMoves(parsed.moves);
                        setTyped("");
                        setHint(false);
                      }
                    }}
                  >
                    {tr("Áp dụng", "Apply")}
                  </button>
                </div>
              </label>
              {parsed && "bad" in parsed && (
                <p className="small bad-text" role="alert" style={{ margin: "4px 0 0" }}>
                  {tr(`“${parsed.bad}” không phải nước M hoặc U.`, `“${parsed.bad}” is not an M or U move.`)}
                </p>
              )}
            </div>
          </div>

          <div aria-live="polite" style={{ marginTop: 10 }}>
            {done ? (
              <p>
                <b style={{ color: "var(--green)" }}>{tr("Xong!", "Done!")}</b>{" "}
                {tr(
                  `Bạn dùng ${moves.length} nước; ngắn nhất từ đầu là ${best} nước.${moves.length === best ? " Bạn đã làm đúng cách ngắn nhất." : ""}`,
                  `You used ${moves.length} ${moves.length === 1 ? "move" : "moves"}; the shortest from the start is ${best}.${moves.length === best ? " You found a shortest way." : ""}`,
                )}
              </p>
            ) : (
              <>
                <p style={{ margin: "0 0 4px" }}>
                  <b>{tr("Chương trình còn cần tối thiểu:", "The solver still needs at least:")}</b> {remaining} {tr("nước", remaining === 1 ? "move" : "moves")}
                  {left.length > 1 &&
                    (() => {
                      const before = left[left.length - 2];
                      const diff = before - remaining;
                      return (
                        <span className={diff < 0 ? "bad-text" : "muted"} style={diff > 0 ? { color: "var(--green)" } : undefined}>
                          {" "}
                          {diff > 0 ? tr("(nước vừa rồi đi đúng hướng ✓)", "(your last move went the right way ✓)") : diff < 0 ? tr("(nước vừa rồi đi xa hơn ✗)", "(your last move went away ✗)") : tr("(nước vừa rồi không đổi khoảng cách)", "(your last move did not change the distance)")}
                        </span>
                      );
                    })()}
                </p>
                <div className="small">
                  {step === "l4e" ? (
                    <EdgeMoves state={now} positions={["UF", "UB", "DF", "DB"]} />
                  ) : (
                    <>
                      {(step === "eo" || step === "eolr" || badEdges(now).length > 0) && <div>{describe("eo", now)}</div>}
                      {(step === "ulur" || step === "eolr") && <div>{describe("ulur", now)}</div>}
                      {(step === "ulur" || step === "eolr") && <EdgeMoves state={now} positions={["UL", "UR"]} />}
                    </>
                  )}
                </div>
                <div className="bar" style={{ marginTop: 6 }}>
                  <button type="button" className="btn small" onClick={() => setHint(true)}>
                    {tr("Gợi ý nước tiếp theo", "Hint for the next move")}
                  </button>
                  {hint && suggestion && (
                    <span className="small">
                      {tr("Một nước đi đúng hướng: ", "A move that goes the right way: ")}
                      <b>{suggestion}</b>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {left.length > 1 && (
            <p className="small muted" style={{ marginTop: 8 }}>
              {tr("Đường bạn đã đi (số nước còn lại sau mỗi nước): ", "Your path (moves left after each move): ")}
              {moves.map((m, i) => `${m} → ${left[i + 1]}`).join(" · ")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
