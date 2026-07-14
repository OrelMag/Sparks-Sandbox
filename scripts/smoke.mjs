/**
 * smoke.mjs — headless runtime verification.
 *
 * Loads a scene in real Chromium, fails on any console error / page exception,
 * drives it via keyboard (the dev fallback that mirrors the pad), and writes
 * screenshots. This is our automated proxy for "plug in a pad and play" — it
 * won't feel the rumble, but it proves the scene builds and reacts at runtime.
 *
 * Usage: node scripts/smoke.mjs <sceneAlias> [outDir]
 */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const requested = process.argv[2] ?? "phase1";
const progression = requested === "progression";
const scene = progression ? "phase1" : requested;
const outDir = process.argv[3] ?? "scratch-shots";
// Defaults to Vite's dev port; override with SMOKE_BASE for a different port.
const BASE = process.env.SMOKE_BASE ?? "http://localhost:5173";
mkdirSync(outDir, { recursive: true });

const KEY_SEQUENCES = {
  phase1: ["Space", "KeyK", "KeyL", "KeyI", "KeyT", "KeyG", "KeyR", "KeyY"],
  phase2: ["KeyA", "KeyD", "KeyA", "KeyD", "KeyA", "KeyD"],
  phase2a: ["KeyA", "KeyD", "KeyA", "KeyD"],
  phase2b: ["KeyW", "KeyD", "KeyS", "KeyA", "KeyF"],
  phase3: ["KeyW", "ArrowRight", "Enter", "KeyD", "ArrowUp", "Enter"],
  phase4: ["KeyW", "KeyD", "Space", "ShiftLeft", "KeyQ", "KeyE"],
  hub: ["KeyD", "KeyA", "KeyW", "KeyS"],
};

const errors = [];

// Headless Chromium has no GPU, so Phaser's WebGL renderer needs software GL
// (SwiftShader). These flags give it a working WebGL context.
const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

await page.goto(`${BASE}/?scene=${scene}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/${scene}-initial.png` });

// Drive the scene with the keyboard fallback.
const seq = KEY_SEQUENCES[scene] ?? ["Space"];
for (const key of seq) {
  await page.keyboard.down(key);
  await page.waitForTimeout(180);
  await page.keyboard.up(key);
  await page.waitForTimeout(180);
}

if (progression) {
  const activeScene = () =>
    page.evaluate(() =>
      window.__game?.scene
        .getScenes(true)
        .map((s) => s.scene.key)
        .find((key) => key !== "ObservationMode")
    );

  await page.waitForTimeout(1000);
  if ((await activeScene()) !== "P1_BusyBox") {
    errors.push("progression: short A press left Phase 1");
  }
  await page.screenshot({ path: `${outDir}/progression-ready.png` });

  await page.keyboard.down("Space");
  await page.waitForTimeout(1100);
  await page.keyboard.up("Space");
  await page.waitForTimeout(500);
  if ((await activeScene()) !== "P2_GearPen") {
    errors.push("progression: completed Phase 1 did not advance to Phase 2 after holding A");
  }
  await page.screenshot({ path: `${outDir}/progression-after-exit.png` });
} else {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/${scene}-after-input.png` });

  // Let it sit idle long enough for the ghost-hint escalation to kick in.
  await page.waitForTimeout(13000);
  await page.screenshot({ path: `${outDir}/${scene}-idle-hint.png` });
}

await browser.close();

if (errors.length) {
  console.error(`SMOKE FAIL (${requested}):`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(`SMOKE OK (${requested}): no console/page errors; screenshots in ${outDir}/`);
