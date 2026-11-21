import { useEffect, useRef } from "react";
import { colorName, tr, useLang } from "../lib/i18n";
import { useRoute } from "../lib/router";
import { COLOR_NAMES, frontChoices } from "../lib/palette";
import { markSchemeAsked, setColors, useSettings } from "../lib/store";
import { Icon } from "./icons";

/** The two colour choices (top centre and front centre). The other faces follow from them. */
export function SchemeFields({ onAnswer }: { onAnswer?: () => void }) {
  const { top, front } = useSettings();
  useLang();
  const fronts = frontChoices(top);
  return (
    <div className="bar">
      <label>
        {tr(
          <>
            Màu tâm mặt <strong>trên</strong>
          </>,
          <>
            Colour of the <strong>top</strong> centre
          </>,
        )}{" "}
        <select
          className="input"
          value={top}
          onChange={(e) => {
            const t = e.target.value as (typeof COLOR_NAMES)[number];
            const f = frontChoices(t);
            setColors(t, f.includes(front) ? front : f[0]);
            onAnswer?.();
          }}
        >
          {COLOR_NAMES.map((c) => (
            <option key={c} value={c}>
              {colorName(c)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {tr(
          <>
            Màu tâm mặt <strong>trước</strong>
          </>,
          <>
            Colour of the <strong>front</strong> centre
          </>,
        )}{" "}
        <select
          className="input"
          value={front}
          onChange={(e) => {
            setColors(top, e.target.value as (typeof COLOR_NAMES)[number]);
            onAnswer?.();
          }}
        >
          {fronts.map((c) => (
            <option key={c} value={c}>
              {colorName(c)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

const explain = () =>
  tr(
    "Chọn đúng màu cube bạn đang cầm để mọi hình trên trang trùng với cube thật. Màu các mặt còn lại tự suy ra từ hai lựa chọn này (cube thật chỉ có một cách sắp xếp). Các định nghĩa trong bài đều viết theo tâm của chính cube bạn, nên màu chỉ để hình khớp với cube thật.",
    "Choose the colours of the cube you are holding so every picture on the page matches your real cube. The colours of the other faces follow from these two choices (a real cube has only one possible arrangement). Definitions in the lessons are written relative to your own cube's centres, so the colours only make the pictures match your real cube.",
  );

const summary = (top: Parameters<typeof colorName>[0], front: Parameters<typeof colorName>[0]) =>
  tr(`Màu cube của bạn: mặt trên ${colorName(top)}, mặt trước ${colorName(front)}`, `Your cube colours: top ${colorName(top)}, front ${colorName(front)}`);

/** Collapsible version, used on pages where the colours matter most (the case finder). */
export function SchemePicker() {
  const { top, front } = useSettings();
  useLang();
  return (
    <details className="callout info">
      <summary>
        <Icon name="palette" className="ico-inline" /> {summary(top, front)}
      </summary>
      <p className="small">{explain()}</p>
      <SchemeFields onAnswer={markSchemeAsked} />
    </details>
  );
}

/** Header button that opens the colour choice on every page. It closes on Escape, on a press outside and when the page changes. */
export function SchemeMenu() {
  const { top, front } = useSettings();
  const { path } = useRoute();
  const ref = useRef<HTMLDetailsElement>(null);
  useLang();
  useEffect(() => {
    const el = ref.current;
    if (el) el.open = false;
  }, [path]);
  useEffect(() => {
    const close = (refocus: boolean) => {
      const el = ref.current;
      if (!el || !el.open) return;
      el.open = false;
      if (refocus) el.querySelector("summary")?.focus();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(true);
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close(false);
    };
    addEventListener("keydown", onKey);
    addEventListener("pointerdown", onDown);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("pointerdown", onDown);
    };
  }, []);
  return (
    <details className="scheme-menu" ref={ref}>
      <summary className="icon-btn" title={summary(top, front)} aria-label={summary(top, front)}>
        <Icon name="palette" className="ico-inline" />
        <span className="scheme-menu-label">{tr("Màu cube", "Cube colours")}</span>
      </summary>
      <div className="scheme-pop card">
        <strong>{tr("Màu cube của bạn?", "Your cube colours?")}</strong>
        <p className="small">{explain()}</p>
        <SchemeFields onAnswer={markSchemeAsked} />
      </div>
    </details>
  );
}

/** One-time question on the first visit. Answering or dismissing it is remembered. */
export function SchemeAsk() {
  const { schemeAsked } = useSettings();
  useLang();
  if (schemeAsked) return null;
  return (
    <div className="scheme-ask" role="region" aria-label={tr("Màu cube của bạn", "Your cube colours")}>
      <div className="scheme-ask-in">
        <strong>
          <Icon name="palette" className="ico-inline" /> {tr("Màu cube của bạn?", "Your cube colours?")}
        </strong>
        <span className="small">{tr("Chọn để hình trên trang giống cube thật. Bạn đổi lại được bất cứ lúc nào ở nút “Màu cube” trên đầu trang.", "Choose so the pictures match your real cube. You can change it any time with the “Cube colours” button at the top.")}</span>
        <SchemeFields />
        <button className="btn small accent" onClick={markSchemeAsked}>
          {tr("Xong, giữ màu này", "Done, keep these")}
        </button>
      </div>
    </div>
  );
}
