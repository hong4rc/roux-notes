import { useEffect, useRef, useState } from "react";
import { jump, useRoute } from "../lib/router";
import { tr } from "../lib/i18n";

export interface TocItem {
  id: string;
  label: string;
}

const atOf = () => new URLSearchParams(location.hash.split("?")[1] ?? "").get("at");

/**
 * Table of contents that stays on screen: a column on the left on wide screens, a thin bar under the top bar on narrow ones.
 * The section being read is highlighted. A click puts `?at=<id>` in the address, so the link opens at that section again.
 */
export function Toc({ items }: { items: TocItem[] }) {
  const { path } = useRoute();
  const [on, setOn] = useState(items[0]?.id);
  const ids = items.map((i) => i.id).join(",");
  const navRef = useRef<HTMLElement>(null);

  // on the narrow bar, keep the highlighted link in view
  useEffect(() => {
    const nav = navRef.current;
    const a = nav?.querySelector<HTMLElement>("a.on");
    if (nav && a && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = a.offsetLeft - nav.clientWidth / 3;
  }, [on]);

  useEffect(() => {
    // the page itself scrolls to ?at= (see app.tsx); only the highlight is set here
    const at = atOf();
    if (at) setOn(at);
  }, [ids]);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const pick = () => {
      // the last heading that has passed the line just under the sticky bars
      let cur = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top < 140) cur = el.id;
      if (cur) setOn(cur);
    };
    pick();
    addEventListener("scroll", pick, { passive: true });
    return () => removeEventListener("scroll", pick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return (
    <nav ref={navRef} className="toc" aria-label={tr("Mục lục", "Table of contents")}>
      {items.map((it) => (
        <a
          key={it.id}
          href={`#${path}?at=${it.id}`}
          className={on === it.id ? "on" : undefined}
          aria-current={on === it.id ? "location" : undefined}
          onClick={(e) => {
            e.preventDefault();
            history.replaceState(null, "", `#${path}?at=${it.id}`);
            setOn(it.id);
            jump(it.id);
          }}
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}
