import { href, useRoute } from "../lib/router";
import { tr, useLang } from "../lib/i18n";
import { toggleStepDone, useSettings, type StepId } from "../lib/store";

interface Stop {
  to: string;
  title: string;
  hint?: string;
}

// The learning path (the same order as the list on "Learn"), with the side road to the full CMLL list.
function stops(): Record<string, { prev?: Stop; next: Stop[] }> {
  const glossary: Stop = { to: "/glossary", title: tr("Chuẩn bị: Ký hiệu", "Preparation: Notation") };
  const first: Stop = { to: "/learn/first-block", title: tr("Bước 1: Khối đầu", "Step 1: First block") };
  const second: Stop = { to: "/learn/second-block", title: tr("Bước 2: Khối thứ hai", "Step 2: Second block") };
  const twoLook: Stop = { to: "/cmll/2-look", title: tr("Bước 3: CMLL 2-look", "Step 3: CMLL 2-look"), hint: tr("giải bốn góc bằng chín thuật toán", "solve the four corners with nine algorithms") };
  const lse: Stop = { to: "/lse", title: tr("Bước 4: LSE, giải sáu cạnh cuối", "Step 4: LSE, solve the last six edges"), hint: tr("sáu cạnh cuối chỉ bằng M và U", "the last six edges with only M and U") };
  const all: Stop = { to: "/cmll/all", title: tr("Nâng cao A: đủ 42 case CMLL", "Advanced A: all 42 CMLL cases"), hint: tr("một thuật toán cho mỗi case, bớt gần một nửa số nước", "one algorithm per case, saving almost half of the moves") };
  const advanced: Stop = { to: "/learn/advanced", title: tr("Nâng cao B: tối ưu", "Advanced B: optimization"), hint: tr("nhìn trước, gộp hai bước cạnh làm một, luyện tập", "lookahead, merging two edge steps into one, practice") };
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
const STEP_OF_ROUTE: Record<string, StepId> = {
  "learn/first-block": "first-block",
  "learn/second-block": "second-block",
  "cmll/2-look": "cmll-2-look",
  lse: "lse",
};

function StepDone({ id }: { id: StepId }) {
  const { stepsDone } = useSettings();
  const done = stepsDone.includes(id);
  return (
    <label className={`step-done ${done ? "on" : ""}`}>
      <input type="checkbox" checked={done} onChange={() => toggleStepDone(id)} />
      <span>{done ? tr("Bạn đã đánh dấu xong bước này", "You marked this step as done") : tr("Đánh dấu đã xong bước này", "Mark this step as done")}</span>
    </label>
  );
}

export function PageNav() {
  const { parts } = useRoute();
  useLang();
  const key = parts.join("/");
  const here = stops()[key];
  const stepId = STEP_OF_ROUTE[key];
  if (!here || (!here.prev && here.next.length === 0)) return null;
  return (
    <>
      {stepId && <StepDone id={stepId} />}
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
    </>
  );
}
