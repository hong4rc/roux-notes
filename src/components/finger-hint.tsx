import { trickOf, tricksOfAlg } from "../data/fingertricks";
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
export function MoveTricks({ alg, open }: { alg: string; open?: boolean }) {
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
    </details>
  );
}
