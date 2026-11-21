import { useCallback, useEffect, useRef, useState } from "react";
import { CaseTop } from "../components/case-views";
import { UPRIGHT_BY_GROUP } from "../components/case-recognition";
import { PageHead } from "../components/ui";
import { CMLL_CASES, GROUP_ORDER, GROUPS, type CmllCase, type GroupId } from "../data/cmll";
import { tr, useLang } from "../lib/i18n";
import { caseLabel, placementOf, placementSentence, swapKindOf, swapKindWords, type SwapKind } from "../lib/recognize";
import { href } from "../lib/router";

const SWAP_KINDS: SwapKind[] = ["none", "adjacent", "diagonal"];

const swapLabel = (k: SwapKind) =>
  k === "none" ? tr("Đúng chỗ cả bốn", "All four in place") : k === "adjacent" ? tr("Hai góc kề nhau đổi chỗ", "Two neighbouring corners swap") : tr("Hai góc chéo nhau đổi chỗ", "Two diagonal corners swap");

const answerOf = (c: CmllCase) => ({ family: c.group, swap: swapKindOf(placementOf(c.state)) });

/** random case; a case answered right in a row comes back sooner, and the same case never comes twice in a row */
function pickCase(runs: Record<string, number>, last?: string): CmllCase {
  const pool = CMLL_CASES.filter((c) => c.id !== last);
  const warm = pool.filter((c) => (runs[c.id] ?? 0) > 0);
  const from = warm.length && Math.random() < 0.5 ? warm : pool;
  return from[Math.floor(Math.random() * from.length)];
}

type Step = "family" | "swap" | "done";

export function RecognizeDrill() {
  useLang();
  const [runs, setRuns] = useState<Record<string, number>>({});
  const [c, setC] = useState<CmllCase>(() => pickCase({}));
  const [step, setStep] = useState<Step>("family");
  const [family, setFamily] = useState<GroupId>();
  const [swap, setSwap] = useState<SwapKind>();
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0, best: 0 });
  const [real, setReal] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  const truth = answerOf(c);

  const finish = useCallback(
    (f: GroupId, s: SwapKind) => {
      const ok = f === truth.family && s === truth.swap;
      const run = ok ? (runs[c.id] ?? 0) + 1 : 0;
      setRuns({ ...runs, [c.id]: run });
      setScore((p) => {
        const streak = ok ? p.streak + 1 : 0;
        return { right: p.right + (ok ? 1 : 0), total: p.total + 1, streak, best: Math.max(p.best, streak) };
      });
      setStep("done");
    },
    [c.id, runs, truth.family, truth.swap],
  );

  const chooseFamily = (f: GroupId) => {
    setFamily(f);
    setStep("swap");
  };
  const chooseSwap = (s: SwapKind) => {
    setSwap(s);
    finish(family!, s);
  };
  const next = useCallback(() => {
    setC(pickCase(runs, c.id));
    setStep("family");
    setFamily(undefined);
    setSwap(undefined);
  }, [runs, c.id]);

  // keyboard: 1 to 8 pick the family, 1 to 3 pick the swap, N or Enter (when no button has focus) goes on
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      const n = Number(e.key);
      if (step === "family" && n >= 1 && n <= GROUP_ORDER.length) chooseFamily(GROUP_ORDER[n - 1]);
      else if (step === "swap" && n >= 1 && n <= SWAP_KINDS.length) chooseSwap(SWAP_KINDS[n - 1]);
      else if (step === "done" && (e.key === "n" || e.key === "N")) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  // after the answer, focus goes to the "next" button so Enter or Space continues
  useEffect(() => {
    if (step === "done") nextRef.current?.focus();
  }, [step]);

  const p = placementOf(c.state);
  const ok = family === truth.family && swap === truth.swap;
  const run = runs[c.id] ?? 0;

  return (
    <>
      <PageHead
        title={tr("Nhận dạng nhanh", "Quick recognition")}
        crumbs={<a href={href("/cmll")}>CMLL</a>}
        lead={tr(
          "Nhìn hình, gọi tên nhóm và kiểu đổi chỗ. Không cần thuật toán, không cần đúng màu: chỉ cần nhìn ra hình dạng và các sticker cùng màu.",
          "Look at the picture, name the family and the kind of swap. No algorithm and no exact colours needed: just see the shape and the stickers of the same colour.",
        )}
      />
      <p className="small muted">
        {tr(
          "Trong hình, sticker xám nghĩa là “màu nào cũng được”; chỉ màu mặt trên giữ nguyên màu. Viền cam nối hai sticker cùng màu. Phím tắt: số 1 đến 8 chọn nhóm, số 1 đến 3 chọn kiểu đổi chỗ, N sang hình sau.",
          "In the picture a grey sticker means “any colour”; only the top colour keeps its colour. An orange outline joins two stickers of the same colour. Keys: 1 to 8 pick the family, 1 to 3 pick the swap, N goes to the next picture.",
        )}
      </p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "0 0 auto", maxWidth: "100%" }}>
          <CaseTop
            state={c.state}
            width={240}
            neutral={!real}
            outlinePairs={!real}
            title={tr("Một case CMLL, tên được giấu", "A CMLL case with its name hidden")}
          />
          <label className="small" style={{ display: "block" }}>
            <input type="checkbox" checked={real} onChange={(e) => setReal(e.target.checked)} /> {tr("Hiện màu thật", "Show real colours")}
          </label>
          <p className="small" aria-live="polite" style={{ margin: "8px 0 0" }}>
            {tr(
              `Đúng ${score.right}/${score.total} · chuỗi đúng liền nhau: ${score.streak} (tốt nhất ${score.best})`,
              `Right ${score.right}/${score.total} · streak: ${score.streak} (best ${score.best})`,
            )}
          </p>
        </div>

        <div style={{ flex: "1 1 300px", minWidth: 0 }}>
          {step === "family" && (
            <>
              <h2 style={{ marginTop: 0 }}>{tr("1. Đây là nhóm nào?", "1. Which family is it?")}</h2>
              <p className="small muted" style={{ marginTop: 0 }}>
                {tr("Gợi ý: đếm các góc có màu mặt trên nằm trên mặt trên, rồi xem các góc còn lại xoay về phía nào.", "Hint: count the corners with the top colour on the top face, then see which way the other corners turn.")}
              </p>
              <div className="bar" role="group" aria-label={tr("Chọn nhóm", "Choose the family")}>
                {GROUP_ORDER.map((g, i) => (
                  <button key={g} className="btn" onClick={() => chooseFamily(g)}>
                    <span className="muted">{i + 1}</span> {GROUPS[g].label}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === "swap" && (
            <>
              <h2 style={{ marginTop: 0 }}>{tr("2. Các góc cần đổi chỗ thế nào?", "2. How do the corners need to swap?")}</h2>
              <p className="small muted" style={{ marginTop: 0 }}>
                {tr(`Bạn đã chọn nhóm ${GROUPS[family!].label}.`, `You chose the ${GROUPS[family!].label} family.`)}{" "}
                {tr("Hình dung xoay cả tầng trên cho nhiều góc đúng chỗ nhất rồi xem còn góc nào sai.", "Picture the whole top layer turned so the most corners are in place, then see which corners are still wrong.")}
              </p>
              <div className="bar" role="group" aria-label={tr("Chọn kiểu đổi chỗ", "Choose the swap")}>
                {SWAP_KINDS.map((k, i) => (
                  <button key={k} className="btn" onClick={() => chooseSwap(k)}>
                    <span className="muted">{i + 1}</span> {swapLabel(k)}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === "done" && (
            <div className="card" role="status">
              <h2 style={{ marginTop: 0 }}>{ok ? tr("Đúng rồi", "Correct") : tr("Chưa đúng", "Not quite")}</h2>
              <p>
                {tr("Nhóm:", "Family:")} <strong>{GROUPS[truth.family].label}</strong>{" "}
                {family === truth.family ? "✓" : tr(`(bạn chọn ${GROUPS[family!].label})`, `(you chose ${GROUPS[family!].label})`)}
                <br />
                {tr("Kiểu đổi chỗ:", "Kind of swap:")} <strong>{swapKindWords(truth.swap)}</strong>{" "}
                {swap === truth.swap ? "✓" : tr(`(bạn chọn: ${swapLabel(swap!).toLowerCase()})`, `(you chose: ${swapLabel(swap!).toLowerCase()})`)}
              </p>
              <p className="small">
                {tr(
                  `Vì sao: có ${UPRIGHT_BY_GROUP[c.group]} góc có màu mặt trên nằm trên mặt trên, tức là nhóm ${[...new Set(Object.entries(UPRIGHT_BY_GROUP).filter(([, n]) => n === UPRIGHT_BY_GROUP[c.group]).map(([k]) => GROUPS[k as GroupId].label))].join(" hoặc ")}; hướng xoay của các góc còn lại chọn ra nhóm ${GROUPS[c.group].label}. `,
                  `Why: ${UPRIGHT_BY_GROUP[c.group]} ${UPRIGHT_BY_GROUP[c.group] === 1 ? "corner has" : "corners have"} the top colour on the top face, which means the ${[...new Set(Object.entries(UPRIGHT_BY_GROUP).filter(([, n]) => n === UPRIGHT_BY_GROUP[c.group]).map(([k]) => GROUPS[k as GroupId].label))].join(" or ")} family; the twist of the other corners picks the ${GROUPS[c.group].label} family. `,
                )}
                {placementSentence(p)}
              </p>
              <p className="small">
                <a href={href(`/cmll/${c.id}`)}>
                  {tr(`Xem trang case ${GROUPS[c.group].label} · ${caseLabel(c)} →`, `Open the page of the ${GROUPS[c.group].label} · ${caseLabel(c)} case →`)}
                </a>
              </p>
              <p className="small muted">
                {tr(
                  `Bài này chỉ hỏi nhóm và kiểu đổi chỗ nên không tự đánh dấu “đã thuộc” (cách nhận ra đúng từng case nằm ở trang case). Đúng liên tiếp với case này: ${run}.`,
                  `This drill only asks for the family and the kind of swap, so it does not mark a case as learned (how to tell each exact case apart is on the case page). Right in a row on this case: ${run}.`,
                )}
              </p>
              <button ref={nextRef} className="btn primary" onClick={next}>
                {tr("Hình tiếp theo (N)", "Next picture (N)")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
