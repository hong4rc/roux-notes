import { colorName, tr, useLang } from "../lib/i18n";
import { COLOR_NAMES, frontChoices } from "../lib/palette";
import { setColors, useSettings } from "../lib/store";
import { Icon } from "./icons";

export function SchemePicker() {
  const { top, front } = useSettings();
  useLang();
  const fronts = frontChoices(top);
  return (
    <details className="callout info">
      <summary>
        <Icon name="palette" className="ico-inline" /> {tr(`Màu cube của bạn: mặt trên ${colorName(top)}, mặt trước ${colorName(front)}`, `Your cube colours: top ${colorName(top)}, front ${colorName(front)}`)}
      </summary>
      <p className="small">
        {tr(
          "Chọn đúng màu cube bạn đang cầm để mọi hình trên trang trùng với cube thật. Màu các mặt còn lại tự suy ra từ hai lựa chọn này (cube thật chỉ có một cách sắp xếp).",
          "Choose the colours of the cube you are holding so every picture on the page matches your real cube. The colours of the other faces follow from these two choices (a real cube has only one possible arrangement).",
        )}
      </p>
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
          <select className="input" value={front} onChange={(e) => setColors(top, e.target.value as (typeof COLOR_NAMES)[number])}>
            {fronts.map((c) => (
              <option key={c} value={c}>
                {colorName(c)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>
  );
}
