import { COLOR_EN, COLOR_VI, type ColorName } from "./palette";
import { getLang, useSettings, type Lang } from "./store";

/**
 * Pick the Vietnamese or the English version of a text (or of any value, such as JSX).
 * Vietnamese is written first because it is the primary language.
 * The answer depends on the language at the moment of the call, so call it while rendering
 * and list `useLang()` among the dependencies of any `useMemo` that builds text with it.
 */
export function tr<T>(vi: T, en: T): T {
  return getLang() === "en" ? en : vi;
}

/** Subscribe a component to language changes and return the current language. */
export const useLang = (): Lang => useSettings().lang;

/** Colour name in the current language. */
export const colorName = (c: ColorName) => (getLang() === "en" ? COLOR_EN[c] : COLOR_VI[c]);
