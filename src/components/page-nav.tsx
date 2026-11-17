import { href, useRoute } from "../lib/router";
import { tr } from "../lib/i18n";

interface Stop {
  to: string;
  title: string;
  hint?: string;
}

// The learning path (the same order as the list on "Learn"), with the side road to the full CMLL list.
function stops(): Record<string, { prev?: Stop; next: Stop[] }> {
  const glossary: Stop = { to: "/glossary", title: tr("Ký hiệu", "Notation") };
  const first: Stop = { to: "/learn/first-block", title: tr("Khối đầu", "First block") };
  const second: Stop = { to: "/learn/second-block", title: tr("Khối thứ hai", "Second block") };
  const twoLook: Stop = { to: "/cmll/2-look", title: "CMLL 2-look", hint: tr("giải bốn góc bằng chín thuật toán", "solve the four corners with nine algorithms") };
  const lse: Stop = { to: "/lse", title: tr("LSE: giải phần cạnh", "LSE: solve the edges"), hint: tr("sáu cạnh cuối chỉ bằng M và U", "the last six edges with only M and U") };
  const all: Stop = { to: "/cmll/all", title: tr("Đủ 42 case CMLL", "All 42 CMLL cases"), hint: tr("một thuật toán cho mỗi case, bớt gần một nửa số nước", "one algorithm per case, saving almost half of the moves") };
  const advanced: Stop = { to: "/learn/advanced", title: tr("Tối ưu", "Optimization"), hint: tr("nhìn trước, EOLR, luyện tập", "lookahead, EOLR, practice") };
  return {
    "learn/first-block": { prev: glossary, next: [second] },
    "learn/second-block": { prev: first, next: [twoLook] },
    cmll: { prev: second, next: [twoLook] },
    "cmll/2-look": { prev: second, next: [lse, all] },
    "cmll/all": { prev: twoLook, next: [lse, advanced] },
    lse: { prev: twoLook, next: [all, advanced] },
    "learn/advanced": { prev: lse, next: [] },
  };
}

/** Previous / next links at the foot of the pages that belong to the learning path. */
export function PageNav() {
  const { parts } = useRoute();
  const here = stops()[parts.join("/")];
  if (!here || (!here.prev && here.next.length === 0)) return null;
  return (
    <nav className="page-nav" aria-label={tr("Chuyển trang", "Next and previous page")}>
      {here.prev && (
        <a className="card page-nav-prev" href={href(here.prev.to)}>
          <span className="small muted">{tr("← Trước", "← Previous")}</span>
          <strong>{here.prev.title}</strong>
        </a>
      )}
      {here.next.map((n, i) => (
        <a key={n.to} className={`card page-nav-next ${i === 0 ? "primary" : ""}`} href={href(n.to)}>
          <span className="small muted">{i === 0 ? tr("Tiếp theo →", "Next →") : tr("Hoặc →", "Or →")}</span>
          <strong>{n.title}</strong>
          {n.hint && <span className="small">{n.hint}</span>}
        </a>
      ))}
    </nav>
  );
}
