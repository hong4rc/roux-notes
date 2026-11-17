// usage: bun run scripts/check-i18n.ts [baseUrl]   (needs the dev or preview server running)
// Opens every page in English and fails when any visible text, aria-label, title or alt still has
// Vietnamese letters. The "Tiếng Việt" language tooltip are allowed.
import { chromium } from "playwright-core";

const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const base = process.argv[2] ?? "http://localhost:5273/";
const ROUTES = [
  "#/", "#/about", "#/learn", "#/learn/first-block", "#/learn/second-block", "#/learn/advanced", "#/glossary",
  "#/finder", "#/cmll", "#/cmll/2-look", "#/cmll/all", "#/cmll/s-columns", "#/lse", "#/lse/tra-cuu", "#/lse/nang-cao", "#/practice", "#/no-such-page", "#/cmll/nope",
];
const VI = /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;
const ALLOW = [/Tiếng Việt/g];

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.addInitScript(() => localStorage.setItem("roux-vn:settings:v1", JSON.stringify({ lang: "en" })));

async function visibleTexts(): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    out.push(document.title);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = (n.textContent ?? "").trim();
      if (t) out.push(t);
    }
    for (const el of document.querySelectorAll("[aria-label],[title],[alt],[placeholder]"))
      for (const a of ["aria-label", "title", "alt", "placeholder"]) {
        const v = el.getAttribute(a);
        if (v) out.push(v);
      }
    return out;
  });
}

let bad = 0;
const seen = new Set<string>();
async function scan(where: string) {
  for (let t of await visibleTexts()) {
    for (const a of ALLOW) t = t.replace(a, "");
    if (VI.test(t) && !seen.has(t)) {
      seen.add(t);
      bad++;
      console.log(`[${where}] ${t.slice(0, 140)}`);
    }
  }
}

for (const r of ROUTES) {
  await page.goto(base + r);
  await page.waitForTimeout(500);
  await scan(r);
}
// states that only appear after interaction
await page.goto(base + "#/finder");
await page.waitForTimeout(400);
await page.locator(".finder-grid button").nth(5).click().catch(() => {});
await page.waitForTimeout(600);
await scan("finder: after pick");
await page.locator(".move-strip button").last().click().catch(() => {});
await page.waitForTimeout(300);
await scan("finder: stepper at the end");
await page.goto(base + "#/cmll/s-columns");
await page.waitForTimeout(500);
await page.locator(".move-strip button").nth(2).click().catch(() => {});
await scan("case: stepper mid");
await page.locator(".move-strip button").last().click().catch(() => {});
await scan("case: stepper end");
await page.goto(base + "#/cmll/2-look");
await page.waitForTimeout(500);
await page.getByRole("button", { name: /Look 2|Lượt 2/ }).first().click().catch(() => {});
await scan("2-look: second look");
await page.goto(base + "#/lse");
await page.waitForTimeout(500);
for (const b of await page.locator("button").all().then((l) => l.slice(0, 40))) await b.click({ timeout: 300 }).catch(() => {});
await scan("lse: after clicking buttons");

const SAMPLE = encodeURIComponent("U2 B R2 D L' U2 B' D L2 F D2 L2 F' R2 B2 U2 F2 U2 R2 U2 R'");
for (const extra of ["", "&cmll=advanced&lse=advanced"]) {
  await page.goto(base + `#/solve?s=${SAMPLE}${extra}`);
  await page.waitForSelector("#step-lse", { timeout: 20000 });
  for (const id of ["fb", "sb", "cmll", "lse"]) await page.locator(`#step-${id} .move-strip button`).nth(1).click().catch(() => {});
  await scan(`solve${extra ? " (advanced)" : ""}: sample scramble, one move shown in each step`);
}
await page.goto(base + "#/solve?s=x2");
await page.waitForTimeout(800);
await scan("solve: a scramble it refuses");

console.log(bad ? `\n${bad} Vietnamese string(s) left in English mode` : "\nno Vietnamese left in English mode");
if (errors.length) console.log("PAGE ERRORS:\n" + errors.slice(0, 5).join("\n"));
await browser.close();
process.exit(bad || errors.length ? 1 : 0);
