import { useEffect, useState, type ReactNode } from "react";
import { href, jump, useRoute } from "../lib/router";
import { setLang, toggleTheme, useSettings } from "../lib/store";
import { tr } from "../lib/i18n";
import { PageNav } from "./page-nav";
import { SchemeAsk, SchemeMenu } from "./scheme-picker";
import { Icon } from "./icons";

const links = (): { to: string; label: string; match: string }[] => [
  { to: "/about", label: tr("Roux là gì", "About Roux"), match: "about" },
  { to: "/learn", label: tr("Học", "Learn"), match: "learn" },
  { to: "/finder", label: tr("Tìm case", "Find case"), match: "finder" },
  { to: "/cmll", label: "CMLL", match: "cmll" },
  { to: "/lse", label: "LSE", match: "lse" },
  { to: "/practice", label: tr("Luyện tập", "Practice"), match: "practice" },
  { to: "/solve", label: tr("Giải scramble", "Solve"), match: "solve" },
  { to: "/glossary", label: tr("Thuật ngữ", "Glossary"), match: "glossary" },
];

function Logo() {
  // the same file is the browser tab icon, so the two always match
  return <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width={36} height={36} />;
}

export function Layout({ children }: { children: ReactNode }) {
  const { parts } = useRoute();
  const { theme, lang } = useSettings();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [parts.join("/")]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [parts.join("/")]);
  const first = parts[0] ?? "";
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); jump("main"); }}>
        {tr("Bỏ qua menu", "Skip to content")}
      </a>
      <nav className="nav" aria-label={tr("Điều hướng chính", "Main navigation")}>
        <div className="nav-in">
          <a className="brand" href={href("/")}>
            <Logo /> Roux Notes
          </a>
          <div className="nav-quick">
            <div className="lang-switch" role="group" aria-label={tr("Ngôn ngữ", "Language")}>
              <button className="icon-btn" lang="vi" aria-pressed={lang === "vi"} onClick={() => setLang("vi")} title="Tiếng Việt">
                VI
              </button>
              <button className="icon-btn" lang="en" aria-pressed={lang === "en"} onClick={() => setLang("en")} title="English">
                EN
              </button>
            </div>
            <SchemeMenu />
            <button className="icon-btn menu-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
              <Icon name={open ? "cross" : "menu"} /> {open ? tr("Đóng", "Close") : "Menu"}
            </button>
          </div>
          <div className={`nav-links ${open ? "open" : ""}`}>
            {links().map((l) => (
              <a key={l.to} href={href(l.to)} aria-current={first === l.match ? "page" : undefined}>
                {l.label}
              </a>
            ))}
          </div>
          <div className={`nav-tools ${open ? "open" : ""}`}>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              className="theme-switch"
              onClick={toggleTheme}
              aria-label={tr("Chế độ bảng đen", "Chalkboard mode")}
              title={theme === "dark" ? tr("Đang dùng bảng đen. Bấm để về giấy trắng", "Chalkboard on. Click for paper") : tr("Bấm để chuyển sang bảng đen", "Click for chalkboard")}
            >
              <span className="knob" />
            </button>
          </div>
        </div>
      </nav>
      <SchemeAsk />
      <main id="main" className="wrap">
        {children}
        <PageNav />
      </main>
      <footer className="footer">
        <div className="wrap">
          {tr("Tài liệu tiếng Việt về phương pháp Roux. Nguồn và cách kiểm tra thuật toán: ", "A guide to the Roux method. Sources and how algorithms were checked: ")}
          <a href={href("/about")}>{tr("Roux là gì", "About Roux")}</a>.
        </div>
      </footer>
    </>
  );
}
