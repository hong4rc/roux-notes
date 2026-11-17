import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./app";

// Draw the page only once Mali is ready, so text never flashes from the fallback font to Mali.
// The sample text pulls in the Latin, Latin-extended and Vietnamese subsets of both weights.
// A slow or failed font load still shows the page after FONT_WAIT_MS, in the fallback font.
const FONT_WAIT_MS = 3000;
const FONT_SAMPLE = "Aa Ăă Đđ Ơơ Ưư ạệ";

const render = () =>
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

const fontsReady = Promise.all(["400", "600"].map((weight) => document.fonts.load(`${weight} 1em Mali`, FONT_SAMPLE)));
const giveUp = new Promise((resolve) => window.setTimeout(resolve, FONT_WAIT_MS));
Promise.race([fontsReady, giveUp]).catch(() => undefined).finally(render);
