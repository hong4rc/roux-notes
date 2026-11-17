import { useMemo, useState } from "react";
import { CaseTop } from "./case-views";
import { AlgText, CopyButton, ScrambleLine } from "./ui";
import { caseScrambleOf, stateOfScramble, tidy } from "../lib/scramble";
import { invertAlg } from "../../shared/cube";
import { fullAlg, moveCount, type CmllCase } from "../data/cmll";
import { SWAP_PAIRS, type PermuteAlg } from "../data/two-look";
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
const doublesOf = (alg: string) => alg.split(" ").filter((t) => t.includes("2")).length;

/** One kind of corner swap (step 2 of 2-look): which corners change places, and a choice of algorithms. */
export function PermuteCard({ p, base }: { p: PermuteAlg; base: CmllCase }) {
  const { perm } = useSettings();
  const [sc, setSc] = useState(() => tidy(invertAlg(fullAlg(base.algs[0]))));
  const state = useMemo(() => stateOfScramble(sc), [sc]);
  const picked = Math.min(perm[p.id], p.options.length - 1);
  const swap = SWAP_PAIRS[p.id];
  const shortest = Math.min(...p.options.map((o) => moveCount(o.alg)));
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

      <fieldset className="perm-options">
        <legend className="small muted">
          {tr(`Chọn công thức (${p.options.length} cách, bạn chọn cái ưng)`, `Pick an algorithm (${p.options.length} ways; choose the one you like)`)}
        </legend>
        {p.options.map((o, i) => {
          const moves = moveCount(o.alg);
          const doubles = doublesOf(o.alg);
          return (
            <label key={o.alg} className={`perm-opt ${i === picked ? "on" : ""}`}>
              <input type="radio" name={`perm-${p.id}`} checked={i === picked} onChange={() => setPermPick(p.id, i)} />
              <span className="perm-body">
                <span className="perm-head">
                  <strong>{o.title}</strong>
                  <span className="chip-static">{tr(`${moves} nước`, `${moves} moves`)}</span>
                  {moves === shortest && <span className="chip-static good">{tr("ngắn nhất", "shortest")}</span>}
                  <span className="chip-static">{tr(`dùng ${facesOf(o.alg)}`, `uses ${facesOf(o.alg)}`)}</span>
                  <span className="chip-static">{tr(`${doubles} xoay đôi`, `${doubles} double turns`)}</span>
                </span>
                <span className="alg-row">
                  <AlgText alg={o.alg} />
                </span>
                <span className="alg-row">
                  <CopyButton text={o.alg} />
                </span>
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
              </span>
            </label>
          );
        })}
        <p className="small muted" style={{ margin: "6px 0 0" }}>
          {tr(
            "Mỗi công thức đã được kiểm bằng mô phỏng: giữ nguyên hai khối và các tâm, chỉ đổi chỗ góc. Việc nào bấm nhanh và thuận tay hơn thì bạn cần tự thử; mình chưa đo thời gian.",
            "Every algorithm was checked in the simulation: both blocks and the centres stay intact and only corners change places. Which one is faster and more comfortable you have to try yourself; I did not time them.",
          )}
        </p>
      </fieldset>
    </div>
  );
}
