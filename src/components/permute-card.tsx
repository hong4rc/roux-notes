import { useMemo, useState } from "react";
import { CaseTop } from "./case-views";
import { AlgText, CopyButton, ScrambleLine } from "./ui";
import { HalfTurnNote, HandDrill, HandTags, RuleFingers } from "./finger-hint";
import { caseScrambleOf, stateOfScramble, tidy } from "../lib/scramble";
import { invertAlg } from "../../shared/cube";
import { fullAlg, moveCount, type CmllCase } from "../data/cmll";
import { SWAP_PAIRS, defaultPermuteIndex, doubleTurns, type PermuteAlg, type PermuteOption } from "../data/two-look";
import { tr } from "../lib/i18n";
import { setPermPick, useSettings } from "../lib/store";

const CORNER = (p: string) =>
  ({
    UFR: tr("trước-phải", "front-right"),
    UFL: tr("trước-trái", "front-left"),
    UBL: tr("sau-trái", "back-left"),
    UBR: tr("sau-phải", "back-right"),
  })[p] ?? p;

const FACES_USED = "RUFLDrMBxyz";
const facesOf = (alg: string) =>
  [...new Set(alg.split(" ").filter(Boolean).map((t) => t[0]))].sort((a, b) => FACES_USED.indexOf(a) - FACES_USED.indexOf(b)).join(" ");

function OptionBody({ o, shortest, drill }: { o: PermuteOption; shortest: boolean; drill?: boolean }) {
  const moves = moveCount(o.alg);
  const doubles = doubleTurns(o.alg);
  return (
    <>
      <span className="perm-head" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <strong>{o.title}</strong>
        <span className="chip-static">{tr(`${moves} nước`, `${moves} moves`)}</span>
        {shortest && <span className="chip-static good">{tr("ngắn nhất", "shortest")}</span>}
        <span className="chip-static">{tr(`dùng ${facesOf(o.alg)}`, `uses ${facesOf(o.alg)}`)}</span>
        <span className="chip-static">{tr(`${doubles} xoay đôi`, `${doubles} double turns`)}</span>
      </span>
      <span className="alg-row" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <AlgText alg={o.alg} />
        <CopyButton text={o.alg} />
      </span>
      <span style={{ display: "block", margin: "2px 0" }}>
        <HandTags alg={o.alg} />
      </span>
      <HalfTurnNote alg={o.alg} />
      <span className="perm-notes small">
        {o.pros.map((t) => (
          <span key={t} className="pro">
            + {t}
          </span>
        ))}
        {o.cons.map((t) => (
          <span key={t} className="con">
            − {t}
          </span>
        ))}
      </span>
      <RuleFingers alg={o.alg} />
      {drill && <HandDrill />}
    </>
  );
}

/** One kind of corner swap (step 2 of 2-look): which corners change places, one default algorithm, the others on request. */
export function PermuteCard({ p, base }: { p: PermuteAlg; base: CmllCase }) {
  const { perm } = useSettings();
  const [sc, setSc] = useState(() => tidy(invertAlg(fullAlg(base.algs[0]))));
  const state = useMemo(() => stateOfScramble(sc), [sc]);
  const picked = Math.min(perm[p.id], p.options.length - 1);
  const def = defaultPermuteIndex(p.options);
  const swap = SWAP_PAIRS[p.id];
  const shortest = Math.min(...p.options.map((o) => moveCount(o.alg)));
  const others = p.options.map((o, i) => ({ o, i })).filter((x) => x.i !== picked);
  const defDoubles = doubleTurns(p.options[def].alg);
  return (
    <div id={`perm-${p.id}`} className="card perm-card">
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <CaseTop state={state} width={126} title={p.name} />
        <div style={{ flex: 1, minWidth: 190 }}>
          <h3 style={{ margin: "0 0 2px" }}>{p.name}</h3>
          <ScrambleLine scramble={sc} compact onReroll={() => setSc(caseScrambleOf(base))} />
          <p className="small" style={{ margin: "0 0 4px" }}>
            {p.note}
          </p>
          <p className="small" style={{ margin: 0 }}>
            <strong>{tr("Đổi chỗ:", "Swaps:")}</strong>{" "}
            {tr(
              <>
                góc {CORNER(swap.pair[0])} ⇄ góc {CORNER(swap.pair[1])}
                {swap.headlightFace ? ". Xoay U cho đèn pha ở mặt trái (như hình): hai góc cần đổi là hai góc ở bên phải." : ". Xoay U cho hai góc cần đổi nằm chéo nhau ở vị trí này (như hình)."}
              </>,
              <>
                the {CORNER(swap.pair[0])} corner ⇄ the {CORNER(swap.pair[1])} corner
                {swap.headlightFace ? ". Turn U so the headlights are on the left face (as in the picture): the two corners to swap are the two on the right." : ". Turn U so the two corners to swap sit diagonally in these places (as in the picture)."}
              </>,
            )}
          </p>
        </div>
      </div>

      <div className="perm-opt on" style={{ display: "block", marginTop: 10 }}>
        <p className="small muted" style={{ margin: "0 0 4px" }}>
          {picked === def ? tr("Công thức mặc định", "The default algorithm") : tr("Công thức bạn đã chọn", "The algorithm you picked")}
        </p>
        <OptionBody o={p.options[picked]} shortest={moveCount(p.options[picked].alg) === shortest} drill={p.id === "adjacent"} />
      </div>
      {picked === def && (
        <p className="small muted" style={{ margin: "6px 0 0" }}>
          {tr(
            `Vì sao đây là mặc định: trong các cách chỉ dùng R, U, F, đây là cách ít nước xoay đôi nhất (${defDoubles === 0 ? "không có" : `chỉ ${defDoubles}`}), và có trong cả hai nguồn đã tra. Các cách ngắn hơn nằm ở nút bên dưới.`,
            `Why this is the default: among the ways that use only R, U and F, it has the fewest double turns (${defDoubles === 0 ? "none" : `only ${defDoubles}`}), and both sources checked list it. The shorter ways are under the button below.`,
          )}
        </p>
      )}

      <details className="orient-options" style={{ marginTop: 8 }}>
        <summary className="small">{tr(`Xem cách khác (${others.length})`, `See other ways (${others.length})`)}</summary>
        <fieldset className="perm-options">
          {others.map(({ o, i }) => (
            <div key={o.alg} className="perm-opt" style={{ display: "block" }}>
              <OptionBody o={o} shortest={moveCount(o.alg) === shortest} />
              <button type="button" className="btn small" style={{ marginTop: 6 }} onClick={() => setPermPick(p.id, i)}>
                {tr("Dùng cách này", "Use this way")}
              </button>
            </div>
          ))}
          <p className="small muted" style={{ margin: "6px 0 0" }}>
            {tr(
              "Mỗi công thức đã được kiểm bằng mô phỏng: giữ nguyên hai khối và các tâm, chỉ đổi chỗ góc. Việc nào bấm nhanh và thuận tay hơn thì bạn cần tự thử; mình chưa đo thời gian. Công thức bạn chọn cũng được dùng ở trang “Giải scramble”.",
              "Every algorithm was checked in the simulation: both blocks and the centres stay intact and only corners change places. Which one is faster and more comfortable you have to try yourself; I did not time them. The algorithm you pick is also used on the “Solve” page.",
            )}
          </p>
        </fieldset>
      </details>
    </div>
  );
}
