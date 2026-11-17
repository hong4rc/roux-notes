// usage: bun run scripts/shot.ts <outdir> <name>=<hash> [...]   e.g. cmll=#/cmll/day-du
import { chromium } from "playwright-core";
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const [outdir, ...jobs] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: exe });
const width = Number(process.env.W ?? 1100);
const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
for (const job of jobs) {
  const [name, hash] = job.split("=");
  await page.goto(`http://localhost:5273/${hash}`);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outdir}/${name}.png`, fullPage: process.env.FULL !== "0" });
}
if (errors.length) console.log("PAGE ERRORS:\n" + errors.join("\n"));
await browser.close();
