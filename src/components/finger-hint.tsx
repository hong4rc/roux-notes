import { handTags, trickOf, tricksOfAlg } from "../data/fingertricks";
import { href } from "../lib/router";
import { AlgText } from "./ui";
import { tr } from "../lib/i18n";

/**
 * How to turn one move with the fingers: the written guide for this move of this algorithm when there is one,
 * otherwise the usual finger trick for the move.
 */
export function FingerHint({ move, guide }: { move: string; guide?: { by: string; text: string } | null }) {
  if (guide)
    return (
      <span className="finger-hint">
        {tr("Ngón tay", "Fingers")} ({guide.by}): {guide.text}
      </span>
    );
  const t = trickOf(move);
  if (!t) return null;
  return (
    <span className="finger-hint muted">
      {tr("Lướt tay:", "Fingers:")} {t.how()}
      {!t.sources.length && tr(" (thói quen, chưa có nguồn viết)", " (habit, no written source)")}
    </span>
  );
}

/** every kind of move in an algorithm, each with how to turn it and where that comes from */
export function MoveTricks({ alg, open, note }: { alg: string; open?: boolean; note?: string }) {
  const list = tricksOfAlg(alg).filter((x) => x.trick);
  if (!list.length) return null;
  return (
    <details className="move-tricks small" open={open}>
      <summary>{tr(`Cách xoay từng nước (${list.map((x) => x.move).join(", ")})`, `How to turn each move (${list.map((x) => x.move).join(", ")})`)}</summary>
      <ul>
        {list.map(({ move, trick }) => (
          <li key={move}>
            <AlgText alg={move} /> {trick!.how()}{" "}
            {trick!.sources.length ? (
              <span className="muted">
                ({tr("nguồn", "source")}:{" "}
                {trick!.sources.map((s, i) => (
                  <span key={s.url}>
                    {i > 0 && ", "}
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.name}
                    </a>
                  </span>
                ))}
                )
              </span>
            ) : (
              <span className="muted">{tr("(thói quen, chưa có nguồn viết)", "(habit, no written source)")}</span>
            )}
          </li>
        ))}
      </ul>
      {note && <p className="muted" style={{ margin: "4px 0 0" }}>{note}</p>}
    </details>
  );
}

/** the "gợi ý cho tay" tag(s) of an algorithm, to compare options at a glance */
export function HandTags({ alg }: { alg: string }) {
  const tags = handTags(alg);
  return (
    <span className="hand-tags" style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <span className="small muted">{tr("Gợi ý cho tay:", "Hand hint:")}</span>
      {tags.map((t) => (
        <span key={t} className="chip-static">
          {t}
        </span>
      ))}
    </span>
  );
}

/** finger advice for a 2-look algorithm, built only from the general finger rules in fingertricks.ts */
export function RuleFingers({ alg }: { alg: string }) {
  return (
    <MoveTricks
      alg={alg}
      note={tr(
        "Gợi ý theo quy tắc ngón chung, chưa phải bảng của John Mark: mình ghép từ cách xoay từng nước ở trên, chưa đo thời gian.",
        "A hint from the general finger rules, not John Mark's table: put together from the way each move is turned above, not timed.",
      )}
    />
  );
}

/** under an algorithm that writes R2' or U2': what the ' means (the cube ends the same as with R2 / U2) */
export function HalfTurnNote({ alg }: { alg: string }) {
  const marks = [...new Set(alg.split(" ").filter((t) => t.includes("2'")))];
  if (!marks.length) return null;
  const plain = marks.map((m) => m.replace("2'", "2")).join(", ");
  return (
    <p className="small muted" style={{ margin: "4px 0 0" }}>
      {tr(
        <>
          Sao có <code>{marks.join(", ")}</code>? Dấu <code>'</code> chỉ chiều tay quay, kết quả trên cube vẫn như <code>{plain}</code>: nửa vòng chiều nào cũng ra như nhau. Chọn đúng chiều thì cổ tay đi qua đi lại, khỏi buông ra cầm lại.{" "}
          <a href={href("/glossary")}>Xem giải thích</a>
        </>,
        <>
          Why <code>{marks.join(", ")}</code>? The <code>'</code> only tells you which way the hand turns; on the cube the result is the same as <code>{plain}</code>: half a turn either way ends the same. The right direction lets the wrist swing back and forth instead of letting go to regrip.{" "}
          <a href={href("/glossary")}>See the explanation</a>
        </>,
      )}
    </p>
  );
}

/** a hand drill for the algorithms learned first: do it six times in a row (the cube is back as it was) */
export function HandDrill() {
  return (
    <p className="small" style={{ margin: "4px 0 0" }}>
      <strong>{tr("Thử tay:", "Hand drill:")}</strong>{" "}
      {tr(
        "làm liên tiếp 6 lần, tay không rời cube. Làm đúng thì sau 6 lần cube về lại như lúc đầu.",
        "do it 6 times in a row without letting go of the cube. Done right, the cube is back as it started after 6 times.",
      )}
    </p>
  );
}
