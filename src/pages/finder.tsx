import { useEffect, useMemo, useRef, useState } from "react";
import { AlgStepper } from "../components/alg-stepper";
import { CaseTop } from "../components/case-views";
import { LLTop } from "../components/ll-top";
import { SchemePicker } from "../components/scheme-picker";
import { AlgText, Callout, CopyButton, PageHead, Why } from "../components/ui";
import {
  ALL_CORNER_STATES,
  CMLL_BY_ID,
  GROUPS,
  U_CORNER_SLOTS,
  findWrap,
  headlightFaces,
  orientationOf,
  moveCount,
  type Lookup,
} from "../data/cmll";
import { planTwoLook } from "../data/two-look-plan";
import { colorName, tr, useLang } from "../lib/i18n";
import { href } from "../lib/router";
import { arrangementCaption } from "../lib/recognize";
import { useSettings } from "../lib/store";
import { signatureKey, uCornerSignature } from "../../shared/roux";

// geometry shared with LLTop (cell units); stickers of each corner in the order [top, side 1, side 2]
const GAP = 0.07;
const T = 0.3;
const PAD = 0.12;
const MIN = -(GAP + T) - PAD;
const SIZE = 3 + 2 * (GAP + T) + 2 * PAD;
const RECTS: Record<string, [number, number, number, number][]> = {
  UFR: [[2, 2, 3, 3], [2, 3 + GAP, 3, 3 + GAP + T], [3 + GAP, 2, 3 + GAP + T, 3]],
  UFL: [[0, 2, 1, 3], [0, 3 + GAP, 1, 3 + GAP + T], [-GAP - T, 2, -GAP, 3]],
  UBL: [[0, 0, 1, 1], [0, -GAP - T, 1, -GAP], [-GAP - T, 0, -GAP, 1]],
  UBR: [[2, 0, 3, 1], [2, -GAP - T, 3, -GAP], [3 + GAP, 0, 3 + GAP + T, 1]],
};
// the face each of the three stickers of a corner sits on, in the order [top, side 1, side 2]
const SIDE_FACES: Record<string, string[]> = {
  UFR: ["U", "F", "R"],
  UFL: ["U", "F", "L"],
  UBL: ["U", "B", "L"],
  UBR: ["U", "B", "R"],
};
const faceName = (f: string) =>
  ({
    U: tr("mặt trên", "top face"),
    F: tr("mặt trước", "front face"),
    B: tr("mặt sau", "back face"),
    L: tr("mặt trái", "left face"),
    R: tr("mặt phải", "right face"),
  })[f] ?? f;
const cornerName = (slot: string) =>
  ({
    UFR: tr("trước-phải", "front-right"),
    UFL: tr("trước-trái", "front-left"),
    UBL: tr("sau-trái", "back-left"),
    UBR: tr("sau-phải", "back-right"),
  })[slot] ?? slot;

type Headlight = "any" | "none" | "F" | "R" | "B" | "L";

export function Finder() {
  const { top } = useSettings();
  useLang();
  const [o, setO] = useState<number[]>([0, 0, 0, 0]);
  const [hl, setHl] = useState<Headlight>("any");
  const [picked, setPicked] = useState<number | null>(null);
  const [real, setReal] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  // the colour picker is open from the start: a learner with another colour scheme must see it before anything else
  useEffect(() => {
    pickerRef.current?.querySelector("details")?.setAttribute("open", "");
  }, []);

  const candidates = useMemo(() => {
    const list = ALL_CORNER_STATES.filter((s) => orientationOf(s.state).join() === o.join());
    list.sort((a, b) => cost(a) - cost(b));
    return list;
  }, [o]);
  const filtered = candidates.filter((s) => {
    const h = headlightFaces(s.state).map((x) => x.face);
    if (hl === "any") return true;
    if (hl === "none") return h.length === 0;
    return h.includes(hl);
  });
  const sel: Lookup | undefined = picked === null ? undefined : filtered[picked];
  const shown = candidates[0]?.state;
  const valid = candidates.length > 0;

  const setCorner = (k: number, v: number) => {
    setO(o.map((x, i) => (i === k ? v : x)));
    setPicked(null);
  };

  return (
    <>
      <PageHead
        title={tr("Tìm case CMLL của bạn", "Find your CMLL case")}
        crumbs={<a href={href("/cmll")}>CMLL</a>}
        lead={tr(
          "Làm đúng ba bước: chạm vào các sticker màu mặt trên, chọn đèn pha, rồi chọn hình giống cube của bạn.",
          "Follow three steps: tap the top-colour stickers, choose the headlights, then pick the picture that looks like your cube.",
        )}
      />
      <div ref={pickerRef}>
        <SchemePicker />
      </div>

      <h2>{tr("Bước 1. Sticker màu mặt trên nằm ở đâu?", "Step 1. Where are the top-colour stickers?")}</h2>
      <p>
        {tr(
          <>
            Cầm cube với <strong>mặt trước hướng về phía bạn</strong>. Ở mỗi góc của tầng trên có đúng một sticker mang <strong>màu mặt trên</strong> (màu của tâm
            mặt trên, trong bảng chọn màu đang là {colorName(top)}). Chạm vào đúng vị trí sticker đó: trên mặt trên hoặc ở một trong hai mặt bên. Ban đầu cả bốn góc đang để “màu mặt trên nằm trên”.
          </>,
          <>
            Hold the cube with the <strong>front face towards you</strong>. Each corner of the top layer has exactly one sticker with the <strong>top colour</strong> (the
            colour of the top centre, currently {colorName(top)} in the colour picker). Tap the place where that sticker is: on the top face or on one of the two side faces. At first all four corners are set to
            “top colour on top”.
          </>,
        )}
      </p>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", width: 300, maxWidth: "100%" }}>
          {shown && <LLTop state={shown} show="corners" onlyColor={0} width={300} title={tr("Hình để chạm chọn sticker", "Picture for tapping the stickers")} />}
          {U_CORNER_SLOTS.map((slot, k) =>
            RECTS[slot].map((r, j) => {
              const pad = 0.1;
              const [x0, y0, x1, y1] = r;
              const on = o[k] === j;
              return (
                <button
                  key={`${slot}${j}`}
                  className="tap-btn"
                  aria-label={tr(
                    `Góc ${cornerName(slot)}: sticker ở ${faceName(SIDE_FACES[slot][j])}${on ? " (đang chọn)" : ""}`,
                    `${cornerName(slot)} corner: sticker on the ${faceName(SIDE_FACES[slot][j])}${on ? " (selected)" : ""}`,
                  )}
                  aria-pressed={on}
                  onClick={() => setCorner(k, j)}
                  style={{
                    position: "absolute",
                    left: `${((x0 - pad - MIN) / SIZE) * 100}%`,
                    top: `${((y0 - pad - MIN) / SIZE) * 100}%`,
                    width: `${((x1 - x0 + 2 * pad) / SIZE) * 100}%`,
                    height: `${((y1 - y0 + 2 * pad) / SIZE) * 100}%`,
                    background: "transparent",
                    border: on ? "2.5px solid var(--accent)" : "1.5px dashed transparent",
                    borderRadius: 8,
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              );
            }),
          )}
        </div>
        <div style={{ flex: 1, minWidth: 230 }}>
          <p className="small muted" style={{ marginTop: 0 }}>
            {tr(
              "Mặt trước nằm ở phía dưới hình. Viền cam quanh sticker là chỗ bạn đang chọn.",
              "The front face is at the bottom of the picture. The orange outline around a sticker shows your choice.",
            )}
          </p>
          <button className="btn small" onClick={() => { setO([0, 0, 0, 0]); setPicked(null); setHl("any"); }}>
            {tr("↺ Đặt lại", "↺ Reset")}
          </button>
          {!valid && (
            <Callout kind="warn" title={tr("Tổ hợp này không thể có trên cube thật", "This combination cannot happen on a real cube")}>
              <p style={{ margin: 0 }}>
                {tr(
                  `Trên cube thật, các góc không thể xoay lẻ: kiểm tra lại từng góc xem sticker ${colorName(top)} nằm ở đâu. Một cách thử nhanh: số góc “xoay theo chiều kim đồng hồ” phải bằng số góc “ngược chiều” hoặc cách nhau 3.`,
                  `On a real cube, a single corner cannot be twisted on its own: check each corner again to see where its ${colorName(top)} sticker is. A quick test: the number of corners twisted “clockwise” must equal the number twisted “counter-clockwise”, or differ from it by 3.`,
                )}
              </p>
            </Callout>
          )}
          <Why title={tr("Vì sao chỉ cần chạm bốn sticker?", "Why do you only need to tap four stickers?")}>
            <p>
              {tr(
                `Hướng của một góc chỉ có ba khả năng: sticker màu mặt trên nằm trên, hoặc nằm ở một trong hai mặt bên. Bốn góc cho ba lựa chọn mỗi góc, nhưng trên cube thật chỉ 27 trong 81 tổ hợp là có thể (tổng độ xoay phải chia hết cho 3). Biết hướng là đã loại gần hết các case; phần còn lại chỉ là hỏi xem màu bên hông khớp thế nào.`,
                `A corner can be oriented in only three ways: its top-colour sticker is on top, or on one of the two side faces. Four corners with three choices each give 81 combinations, but on a real cube only 27 of them are possible (the total twist must be divisible by 3). Knowing the orientation already rules out almost every case; what is left is just asking how the side colours match.`,
              )}
            </p>
          </Why>
        </div>
      </div>

      {valid && (
        <>
          <h2>{tr("Bước 2. Có đèn pha không?", "Step 2. Are there headlights?")}</h2>
          <p>
            {tr(
              <>
                Đèn pha là hai sticker <strong>nằm cạnh nhau, cùng một màu, trên cùng một mặt bên</strong> (không tính màu mặt trên). Chỉ cần thấy hai sticker giống nhau, không cần biết đó là màu gì.
              </>,
              <>
                Headlights are two stickers that <strong>sit side by side, have the same colour, and are on the same side face</strong> (not counting the{" "}
                top colour). You only need to see that the two match; which colour it is does not matter.
              </>,
            )}
          </p>
          <div className="bar" role="group" aria-label={tr("Đèn pha", "Headlights")}>
            {(["any", "none", "F", "R", "B", "L"] as Headlight[]).map((h) => (
              <button key={h} className="chip" aria-pressed={hl === h} onClick={() => { setHl(h); setPicked(null); }}>
                {h === "any"
                  ? tr("Chưa rõ", "Not sure")
                  : h === "none"
                    ? tr("Không có đèn pha", "No headlights")
                    : tr(`Có, ở ${faceName(h)}`, `Yes, on the ${faceName(h)}`)}
              </button>
            ))}
          </div>
          <Why title={tr("Vì sao đèn pha lại hữu ích?", "Why are headlights useful?")}>
            <p>
              {tr(
                `Với cùng hình sticker màu mặt trên, vẫn còn tới 24 cách xếp các góc. Đèn pha là dấu hiệu nhìn nhanh nhất để chia 24 cách đó thành các nhóm nhỏ, vì nó chỉ xuất hiện khi hai góc kề nhau đã đứng đúng cặp với nhau.`,
                `With the same top-colour sticker picture, there are still up to 24 ways to arrange the corners. Headlights are the fastest sign to split those 24 ways into small groups, because they only appear when two neighbouring corners already form the right pair.`,
              )}
            </p>
          </Why>

          <h2>{tr("Bước 3. Chọn hình giống cube của bạn", "Step 3. Pick the picture that looks like your cube")}</h2>
          <p>
            {tr(
              "Mỗi hình có một dòng chữ mô tả chỗ đứng của bốn góc, tính theo các tâm của cube bạn (một góc đúng chỗ khi hai màu bên hông của nó khớp hai tâm kề nó). Sticker xám nghĩa là “màu nào cũng được”; viền cam nối hai sticker cùng màu (đèn pha). Hai hình khác nhau luôn có dòng chữ khác nhau.",
              "Each picture has a line of words describing where the four corners stand, measured against the centres of your cube (a corner is in place when its two side colours match the two centres next to it). A grey sticker means “any colour”; an orange outline joins two stickers of the same colour (headlights). Two different pictures always have different words.",
            )}
          </p>
          <label className="small" style={{ display: "inline-block", marginBottom: 8 }}>
            <input type="checkbox" checked={real} onChange={(e) => setReal(e.target.checked)} /> {tr("Hiện màu thật", "Show real colours")}
          </label>
          {filtered.length === 0 ? (
            <p className="muted">
              {tr("Không hình nào khớp với lựa chọn đèn pha này. Thử chọn “Chưa rõ”.", "No picture matches this headlight choice. Try “Not sure”.")}
            </p>
          ) : (
            <div className="finder-grid" role="group" aria-label={tr("Các hình có thể là cube của bạn", "The pictures that could be your cube")}>
              {filtered.map((s, i) => {
                const c = s.caseId ? CMLL_BY_ID.get(s.caseId) : undefined;
                const active = sel === s;
                return (
                  <button
                    key={signatureKey(uCornerSignature(s.state))}
                    className="pick"
                    aria-pressed={active}
                    onClick={() => {
                      setPicked(i);
                      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
                    }}
                    style={active ? { background: "var(--hi)", outline: "3px solid var(--accent)" } : undefined}
                  >
                    <CaseTop state={s.state} width={130} neutral={!real} outlinePairs={!real} />
                    <span className="small">{arrangementCaption(s.state)}</span>
                    <span className="small muted">{c ? `${GROUPS[c.group].label} · ${c.sourceName}` : tr("Đã xong (chỉ xoay U)", "Solved (only turn U)")}</span>
                  </button>
                );
              })}
            </div>
          )}

          {sel ? (
            <div ref={resultRef} tabIndex={-1} style={{ scrollMarginTop: 70 }}>
              <Result sel={sel} />
            </div>
          ) : (
            filtered.length > 0 && (
              <p className="muted">{tr("Chạm vào hình giống cube của bạn nhất để xem thuật toán.", "Tap the picture that looks most like your cube to see the algorithm.")}</p>
            )
          )}
        </>
      )}
    </>
  );
}

const auf = (s: string) => (s ? 1 : 0);
const cost = (s: Lookup) => (s.caseId ? 2 : 0) + auf(s.pre) + auf(s.post);

function Result({ sel }: { sel: Lookup }) {
  const c = sel.caseId ? CMLL_BY_ID.get(sel.caseId) : undefined;
  const lang = useLang();
  // the plan holds translated look titles, so it is rebuilt when the language changes
  const { perm } = useSettings();
  const plan = useMemo(() => planTwoLook(sel.state), [sel, lang, perm]);
  const sig = signatureKey(uCornerSignature(sel.state));
  if (!c)
    return (
      <Callout kind="tip" title={tr("Tuyệt: bốn góc đã đúng", "Great: all four corners are right")}>
        <p style={{ margin: 0 }}>
          {tr(
            <>
              Chỉ cần xoay tầng trên: <AlgText alg="" post={sel.post} /> (nếu trống thì không cần làm gì). Rồi sang LSE.
            </>,
            <>
              Just turn the top layer: <AlgText alg="" post={sel.post} /> (if it is empty, there is nothing to do). Then go on to LSE.
            </>,
          )}
        </p>
      </Callout>
    );
  return (
    <div className="card" style={{ marginTop: 18 }}>
      <h2 style={{ marginTop: 0 }}>
        {tr("Đây là", "This is")} {GROUPS[c.group].label} · {c.sourceName}
      </h2>
      <p>
        {tr("Làm theo thứ tự: phần gạch chấm là nước U căn chỉnh.", "Follow them in order: the dotted part is the aligning U move.")}{" "}
        <a href={href(`/cmll/${c.id}`)}>{tr("Xem trang đầy đủ của case này →", "See the full page of this case →")}</a>
      </p>
      {c.algs.map((a, i) => {
        const w = i === 0 ? { pre: sel.pre, post: sel.post } : findWrap(a.alg, sig);
        if (!w) return null;
        const full = [w.pre, a.alg, w.post].filter(Boolean).join(" ");
        return (
          <div className="alg-row" key={i}>
            <span className="small muted">{i === 0 ? tr("Chính", "Main") : tr("Khác", "Other")}</span>
            <AlgText alg={a.alg} pre={w.pre} post={w.post} />
            <CopyButton text={full} />
            <span className="tag" translate="no">
              {tr(`${moveCount(a.alg)} nước`, `${moveCount(a.alg)} ${moveCount(a.alg) === 1 ? "move" : "moves"}`)}
            </span>
          </div>
        );
      })}
      <Why title={tr("Vì sao có thêm nước U ở đầu hoặc cuối?", "Why is there an extra U move at the start or the end?")}>
        <p>
          {tr(
            "Mỗi thuật toán chỉ chạy đúng khi case nằm ở một góc nhìn nhất định (vì nó xoay những vị trí cố định). Hình của bạn có thể đang lệch tầng trên một, hai hoặc ba nấc so với góc nhìn đó, nên xoay U trước. Nước U cuối cùng khớp bốn góc với hai khối nếu cần.",
            "Each algorithm only works when the case is seen from one particular angle (because it turns fixed positions). Your picture may be off by one, two or three steps of the top layer from that angle, so turn U first. The final U move matches the four corners with the two blocks if needed.",
          )}
        </p>
      </Why>
      {plan && (
        <>
          <h3>{tr(`Hoặc giải bằng 2-look (${plan.moves} nước)`, `Or solve with 2-look (${plan.moves} ${plan.moves === 1 ? "move" : "moves"})`)}</h3>
          {plan.looks.map((l, i) => (
            <div className="alg-row" key={i}>
              <span className="small muted">{l.title}</span>
              {l.alg ? <AlgText alg={l.alg} pre={l.pre} post={l.post} /> : <AlgText alg="" post={l.post} />}
            </div>
          ))}
        </>
      )}
      <h3>{tr("Xem từng bước thuật toán chính", "Step through the main algorithm")}</h3>
      <AlgStepper start={sel.state} alg={c.algs[0].alg} pre={sel.pre} post={sel.post} doneText={tr("Xong: bốn góc đã đúng", "Done: all four corners are right")} />
    </div>
  );
}
