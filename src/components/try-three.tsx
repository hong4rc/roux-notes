import { useState } from "react";
import { tr } from "../lib/i18n";
import { markLearned, useSettings } from "../lib/store";

/**
 * "Thử 3 lần liền": the learner does the case from the scramble and reports each try. Three right in a row marks the case as
 * learned (once; it never un-marks). One wrong try starts the count again.
 */
export function TryThree({ id }: { id: string }) {
  const { learned } = useSettings();
  const [n, setN] = useState(0);
  const isLearned = learned.includes(id);
  const right = () => {
    const next = n + 1;
    setN(Math.min(next, 3));
    if (next >= 3 && !isLearned) markLearned(id);
  };
  return (
    <div className="card" style={{ marginTop: 10 }}>
      <h3 style={{ margin: "0 0 4px" }}>{tr("Thử 3 lần liền", "Three in a row")}</h3>
      <p className="small muted" style={{ margin: "0 0 6px" }}>
        {tr(
          "Làm chuỗi trộn ở trên, rồi giải bằng thuật toán, không nhìn công thức. Đúng cả ba lần liền thì mình tự đánh dấu “đã thuộc” cho bạn.",
          "Do the scramble above, then solve it with the algorithm without looking. Three right in a row and the case is marked as learned for you.",
        )}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span aria-live="polite" style={{ fontWeight: 600 }}>
          {tr(`Đúng liên tiếp: ${n}/3`, `Right in a row: ${n}/3`)} {"●".repeat(n)}
          {"○".repeat(3 - n)}
        </span>
        <button type="button" className="btn small" onClick={right} disabled={n >= 3}>
          {tr("Lần này đúng", "This try was right")}
        </button>
        <button type="button" className="btn small" onClick={() => setN(0)} disabled={n === 0}>
          {tr("Lần này sai, đếm lại", "Wrong, start again")}
        </button>
      </div>
      {n >= 3 && (
        <p className="small" style={{ margin: "6px 0 0" }}>
          {isLearned ? tr("Đủ ba lần. Case này đã được đánh dấu đã thuộc.", "Three in a row. This case is marked as learned.") : ""}
        </p>
      )}
    </div>
  );
}
