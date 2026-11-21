import { Layout } from "./components/layout";
import { CmllDetail, CmllHome, CmllLibrary, CmllTwoLook } from "./pages/cmll";
import { Finder } from "./pages/finder";
import { RecognizeDrill } from "./pages/recognize-drill";
import { LSE_ANCHOR_PAGE, LseAdvancedPage, LseLookupPage, LseOverviewPage } from "./pages/lse";
import { Advanced, FirstBlock, LearnHub, SecondBlock } from "./pages/learn";
import { GlossaryPage } from "./pages/glossary";
import { HomePage } from "./pages/home";
import { AboutPage } from "./pages/about";
import { PracticePage } from "./pages/practice";
import { SolvePage } from "./pages/solve";
import { href, jump, useRoute } from "./lib/router";
import { useEffect } from "react";
import { tr, useLang } from "./lib/i18n";
import { ErrorBoundary } from "./components/error-boundary";
import { PageHead } from "./components/ui";

function NotFound() {
  return (
    <>
      <PageHead
        title={tr("Không tìm thấy trang này", "Page not found")}
        lead={tr("Đường dẫn không đúng hoặc trang đã đổi chỗ.", "The link is wrong or the page has moved.")}
      />
      <p>
        <a href={href("/")}>{tr("← Về trang chủ", "← Back to home")}</a> · <a href={href("/finder")}>{tr("Tìm case của tôi", "Find my case")}</a>
      </p>
    </>
  );
}

export function App() {
  const { parts, query } = useRoute();
  const at = query.get("at");
  // a link like #/cmll/2-look?at=perm-diagonal opens the page at that part
  useEffect(() => {
    if (!at) return;
    const t = window.setTimeout(() => jump(at), 120);
    return () => window.clearTimeout(t);
  }, [parts.join("/"), at]);
  useLang(); // re-render the whole page when the language changes
  const [a, b] = parts;
  let page;
  if (!a) page = <HomePage />;
  else if (a === "about") page = <AboutPage />;
  else if (a === "learn") {
    if (!b) page = <LearnHub />;
    else if (b === "first-block") page = <FirstBlock />;
    else if (b === "second-block") page = <SecondBlock />;
    else if (b === "advanced") page = <Advanced />;
    else page = <NotFound />;
  } else if (a === "glossary") page = <GlossaryPage />;
  else if (a === "lse") {
    // old links such as #/lse?at=ulur still open the part that now holds that section
    const part = b ?? (at && at in LSE_ANCHOR_PAGE ? LSE_ANCHOR_PAGE[at] : "");
    if (part === "") page = <LseOverviewPage />;
    else if (part === "tra-cuu") page = <LseLookupPage />;
    else if (part === "nang-cao") page = <LseAdvancedPage />;
    else page = <NotFound />;
  }
  else if (a === "finder") page = <Finder />;
  else if (a === "nhan-dang") page = <RecognizeDrill />;
  else if (a === "practice") page = <PracticePage />;
  else if (a === "solve") page = <SolvePage />;
  else if (a === "cmll") {
    if (!b) page = <CmllHome />;
    else if (b === "2-look") page = <CmllTwoLook />;
    else if (b === "all") page = <CmllLibrary />;
    else page = <CmllDetail id={b} />;
  } else page = <NotFound />;
  return (
    <Layout>
      <ErrorBoundary resetKey={parts.join("/")}>{page}</ErrorBoundary>
    </Layout>
  );
}
