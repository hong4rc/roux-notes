import { useState, type ReactNode } from "react";
import { toggleLearned, useSettings } from "../lib/store";
import { tr } from "../lib/i18n";
import { Icon } from "./icons";

export function Callout({ kind = "info", title, children }: { kind?: "why" | "tip" | "warn" | "info"; title?: string; children: ReactNode }) {
  const icon = ({ why: "why", tip: "tip", warn: "warn", info: "info" } as const)[kind];
  return (
    <div className={`callout ${kind}`} role="note">
      {title && (
        <div className="ttl">
          <Icon name={icon} className="ico-inline" /> {title}
        </div>
      )}
      {children}
    </div>
  );
}

/** "Vì sao?" note. Open by default so the reasoning is always in front of the learner; the nav switch folds them all. */
export function Why({ title = tr("Vì sao làm như vậy?", "Why do it this way?"), children }: { title?: string; children: ReactNode }) {
  const { showWhy } = useSettings();
  return (
    <details className="callout why" open={showWhy} key={String(showWhy)}>
      <summary>
        <Icon name="why" className="ico-inline" /> {title}
      </summary>
      {children}
    </details>
  );
}

const isAuf = (t: string) => /^U(2|')?$/.test(t);

export function AlgText({ alg, pre, post, className }: { alg: string; pre?: string; post?: string; className?: string }) {
  const toks = [
    ...(pre ? pre.split(" ").map((t) => ({ t, auf: true })) : []),
    ...alg.split(" ").filter(Boolean).map((t) => ({ t, auf: false })),
    ...(post ? post.split(" ").map((t) => ({ t, auf: true })) : []),
  ];
  return (
    <span className={`alg ${className ?? ""}`} translate="no">
      {toks.map((x, i) => (
        <span key={i} className={x.auf && isAuf(x.t) ? "auf" : undefined}>
          {x.t}
          {i < toks.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/** a scramble that, done on a solved cube, produces exactly the picture next to it */
export function ScrambleLine({ scramble, compact, onReroll }: { scramble: string; compact?: boolean; onReroll?: () => void }) {
  if (!scramble) return null;
  return (
    <>
    <div className={`alg-row ${compact ? "small" : ""}`} style={{ alignItems: "center" }}>
      <span className="muted small">{tr("Scramble luyện:", "Practice scramble:")}</span>
      <span className="alg" translate="no">
        {scramble}
      </span>
    </div>
    <div className="alg-row">
      <CopyButton text={scramble} />
      {onReroll && (
        <button type="button" className="btn small" onClick={onReroll}>
          <Icon name="reroll" /> {tr("Đổi scramble", "New scramble")}
        </button>
      )}
    </div>
    </>
  );
}

export function CopyButton({ text, label = tr("Chép", "Copy") }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard blocked */
        }
      }}
      aria-label={`${label} ${tr("thuật toán", "algorithm")}: ${text}`}
    >
      {done ? <><Icon name="check" /> {tr("Đã chép", "Copied")}</> : <><Icon name="copy" /> {label}</>}
    </button>
  );
}

export function LearnedBox({ id, label = tr("Đã thuộc", "Learned") }: { id: string; label?: string }) {
  const { learned } = useSettings();
  return (
    <label className="learned-box" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={learned.includes(id)} onChange={() => toggleLearned(id)} />
      {label}
    </label>
  );
}

export function Fig({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <figure className="fig">
      {children}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function PageHead({ title, lead, crumbs }: { title: string; lead?: ReactNode; crumbs?: ReactNode }) {
  return (
    <header className="page-head">
      {crumbs && <div className="crumbs">{crumbs}</div>}
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
    </header>
  );
}
