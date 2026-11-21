import { useState } from "react";
import { CMLL_CASES, GROUPS, orientationOf, type CmllCase, type GroupId } from "../data/cmll";
import { href } from "../lib/router";
import { tr } from "../lib/i18n";
import { caseLabel, placementPhrase, placementSentence, recognitionOf, slotName } from "../lib/recognize";
import { applyAlg } from "../../shared/cube";
import { CaseTop } from "./case-views";

/** how many corners already show the top colour on top, per family */
export const UPRIGHT_BY_GROUP: Record<GroupId, number> = { S: 1, As: 1, H: 0, Pi: 0, U: 2, T: 2, L: 2, O: 4 };

/** the U turns after which the four corners are twisted exactly as in this picture (one, or several when the picture is symmetric) */
const matchingTurns = (c: CmllCase): number =>
  ["", "U", "U2", "U'"].filter((t) => orientationOf(t ? applyAlg(c.state, t) : c.state).join() === orientationOf(c.state).join()).length;

/**
 * How to tell this case from the others without relying on any particular colour. One ordered check on a real cube:
 * 1. count the corners that show the top colour on top (the family),
 * 2. turn U until the corners are twisted like the picture,
 * 3. look, without turning, at which place each corner belongs to.
 */
export function CaseRecognition({ c }: { c: CmllCase }) {
  const [real, setReal] = useState(false);
  const r = recognitionOf(c.state);
  const row = orientationOf(c.state).join("");
  const siblings = CMLL_CASES.filter((x) => x.group === c.group && orientationOf(x.state).join("") === row);
  const g = GROUPS[c.group];
  const sameCount = (Object.keys(UPRIGHT_BY_GROUP) as GroupId[]).filter((k) => UPRIGHT_BY_GROUP[k] === r.uprightCount);
  const symmetric = matchingTurns(c) > 1;
  return (
    <>
      <h2 id="nhan-ra">{tr("Cách nhận ra case này", "How to recognise this case")}</h2>
      <p className="small muted" style={{ marginTop: 0 }}>
        {tr(
          "Không cần khớp màu trong hình. “Màu mặt trên” là màu tâm mặt trên của cube bạn; mọi so sánh khác là so với các tâm của chính cube bạn. Màu hơi khác (cam hay đỏ, trắng ngả vàng) không ảnh hưởng. Làm lần lượt ba bước, không bỏ bước nào.",
          "No need to match the colours in the picture. “The top colour” is the colour of your own top centre; every other comparison is against your own centres. A slightly different shade (orange or red, off-white) does not matter. Do the three steps in order, without skipping any.",
        )}
      </p>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <figure style={{ margin: 0, flex: "0 0 auto", maxWidth: "100%" }}>
          <CaseTop
            state={c.state}
            width={190}
            neutral={!real}
            outlinePairs={!real}
            title={tr("Hình của case để so với cube: sticker xám chỉ đánh dấu chỗ", "The picture of the case to compare with your cube: grey stickers only mark places")}
          />
          <figcaption className="small muted" style={{ maxWidth: 200 }}>
            {tr(
              "Hình để so. Mặt trước nằm ở phía dưới hình. Sticker xám là “một màu nào đó”; viền cam nối hai sticker cùng màu.",
              "The picture to compare with. The front face is at the bottom of the picture. A grey sticker means “some colour”; an orange outline joins two stickers of the same colour.",
            )}
            <label style={{ display: "block", marginTop: 4 }}>
              <input type="checkbox" checked={real} onChange={(e) => setReal(e.target.checked)} /> {tr("Hiện màu thật", "Show real colours")}
            </label>
          </figcaption>
        </figure>
        <ol className="recog-steps" style={{ flex: "1 1 280px", minWidth: 0, margin: 0 }}>
          <li>
            <strong>{tr("Đếm góc có màu mặt trên nằm trên mặt trên.", "Count the corners that have the top colour on the top face.")}</strong>{" "}
            {tr(
              `Ở case này bạn đếm được ${r.uprightCount} góc. Số góc ${r.uprightCount} thuộc nhóm ${sameCount.map((k) => GROUPS[k].label).join(" hoặc ")}; bước 2 chọn trong số đó, và case này thuộc nhóm ${g.label}.`,
              `In this case you count ${r.uprightCount}. A count of ${r.uprightCount} means the ${sameCount.map((k) => GROUPS[k].label).join(" or ")} ${sameCount.length > 1 ? "families" : "family"}; step 2 chooses between them, and this case is in the ${g.label} family.`,
            )}
          </li>
          <li>
            <strong>{tr("Xoay U cho đến khi các góc trông như hình bên.", "Turn U until the corners look like the picture.")}</strong>{" "}
            {tr("Lúc này chỉ so hướng của bốn góc, chưa nhìn màu bên hông.", "At this point only compare how the four corners are twisted; do not look at the side colours yet.")}
            {r.allUpright ? (
              <div>{tr("Cả bốn góc đều ngửa (màu mặt trên nằm trên mặt trên), nên xoay U thế nào cũng khớp.", "All four corners are face up (the top colour is on the top face), so any U turn matches.")}</div>
            ) : (
              <ul style={{ margin: "4px 0" }}>
                {r.orientation.map((o) => (
                  <li key={o.slot}>
                    {tr("Góc", "Corner")} {slotName(o.slot)}: {o.text}
                  </li>
                ))}
                {r.uprightCount > 0 && (
                  <li className="muted">
                    {tr(
                      `${r.uprightCount === 1 ? "Góc còn lại" : "Các góc còn lại"} có màu mặt trên nằm trên mặt trên.`,
                      `The other ${r.uprightCount === 1 ? "corner has" : "corners have"} the top colour on the top face.`,
                    )}
                  </li>
                )}
              </ul>
            )}
            {symmetric && !r.allUpright && (
              <div className="small muted">
                {tr(
                  "Hình này đối xứng nên hai cách xoay đều khớp. Cách nào cũng được: bước 3 chỉ cần kiểu đổi chỗ, và kiểu đó không đổi theo cách xoay (tên góc trong hình bên chỉ là ví dụ).",
                  "This picture is symmetric, so two turns both match. Either is fine: step 3 only needs the kind of swap, which does not change with the turn (the corner names in the picture are only an example).",
                )}
              </div>
            )}
            {r.allUpright && (
              <div className="small muted">
                {tr(
                  "Vì cách xoay nào cũng khớp, tên góc ở bước 3 chỉ là ví dụ theo hình bên; kiểu đổi chỗ không đổi.",
                  "Because every turn matches, the corner names in step 3 are only an example from the picture; the kind of swap does not change.",
                )}
              </div>
            )}
          </li>
          <li>
            <strong>{tr("Chỉ nhìn, không xoay thêm.", "Look only; do not turn again.")}</strong>{" "}
            {tr(
              "Mỗi góc có hai màu bên hông: tìm hai tâm có đúng hai màu đó, góc thuộc chỗ nằm giữa hai tâm ấy. Trong hình bên:",
              "Each corner has two side colours: find the two centres with exactly those colours; the corner belongs at the place between those centres. In the picture:",
            )}
            <ul style={{ margin: "4px 0" }}>
              {r.placement.map((p) => (
                <li key={p.slot}>
                  {tr("Góc", "Corner")} {slotName(p.slot)}: {p.text}.
                </li>
              ))}
            </ul>
            <div>
              <strong>{tr("Kết quả:", "Result:")}</strong> {placementSentence(r.placementSummary)}
            </div>
            <div className="small muted" style={{ marginTop: 4 }}>
              {tr(
                "Nước U chỉnh cuối cùng (AUF, nét chấm trong thuật toán ở trên) chỉ là bước chỉnh cho thẳng hàng, không phải thêm một bước nhận dạng: bạn không cần làm gì với nó lúc nhìn.",
                "The final adjusting U turn (AUF, dotted in the algorithm above) is only an adjustment to line things up, not one more recognition step: you do nothing with it while you are looking.",
              )}
            </div>
            <div className="small muted" style={{ marginTop: 4 }}>
              {tr("Dấu hiệu phụ, nếu có: ", "Extra clue, if there is one: ")}
              {r.pairs.join(" ")}
            </div>
          </li>
        </ol>
      </div>
      <p>
        <strong>{tr("Khớp?", "Does it match?")}</strong> {tr("Đúng case này.", "This is the case.")} <strong>{tr("Không khớp?", "No match?")}</strong>{" "}
        <a href={href("/finder")}>{tr("Dùng công cụ tìm case.", "Use the case finder.")}</a>
      </p>
      <p className="small muted">
        {tr(
          `Tên “${caseLabel(c)}” chỉ là nhãn trong danh sách Ruwix để tra cứu. Ba bước nhìn ở trên mới là cách nhận ra case; bước 3 là chỗ các case cùng nhóm ${g.label} khác nhau.`,
          `The name “${caseLabel(c)}” is just a label from the Ruwix list for looking things up. The three looks above are how you recognise the case; step 3 is where the cases of the ${g.label} family differ.`,
        )}
      </p>
      {siblings.length > 1 && (
        <table className="small">
          <caption style={{ textAlign: "left" }}>
            <strong>{tr(`Các case nhóm ${g.label} (cùng hướng, khác chỗ đứng)`, `The ${g.label} family (same twist, different positions)`)}</strong>
          </caption>
          <tbody>
            {siblings.map((x) => (
              <tr key={x.id} style={x.id === c.id ? { background: "var(--accent-soft, #ffe8cc)" } : undefined}>
                <td>{x.id === c.id ? <strong>{caseLabel(x)}</strong> : <a href={href(`/cmll/${x.id}`)}>{caseLabel(x)}</a>}</td>
                <td>{placementPhrase(x.state)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
