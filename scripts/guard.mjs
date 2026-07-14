// Golden-rule guard. Runs in CI and via `npm run guard`.
//
// This script is the enforcement arm of the three golden rules in CLAUDE.md.
// It fails the build if forbidden concepts appear anywhere in src/. It is
// deliberately blunt: a false positive is a two-second annotation, a false
// negative is a broken promise to a 7-year-old.
//
//   Rule 1 (zero failure states): the vocabulary of failure must not exist.
//   Rule 3 (zero words):          Phaser Text objects must not exist in src/.
//
// Rule 2 (literal color mapping) is enforced structurally by the ButtonPrompt
// API (no color parameter), not by grep, so it is not checked here.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");

// Files explicitly allowed to break a rule, with the reason. The dev overlay
// (Observation Mode) is the one place words are permitted: it is parent-facing,
// toggled by a hotkey the child never uses, and stripped from production builds.
const ALLOWLIST = new Map([
  ["src/ui/DebugOverlay.ts", "dev-only Observation Mode; stripped from prod"],
  ["src/scenes/DebugInputScene.ts", "dev-only input-spine verification; reached via ?scene=debug"],
]);

// Rule 1: the vocabulary of failure. Matched case-insensitively as whole-ish
// identifiers. If you are here because a legitimate word tripped this (e.g. a
// variable innocently named `timeLeft`), rename it — do not add it to the
// allowlist. The whole point is that this vocabulary never enters the codebase.
const FORBIDDEN_IDENTIFIERS = [
  "health",
  "damage",
  "\\bdie\\b",
  "respawn",
  "\\blives\\b",
  "gameOver",
  "game_over",
  "timeLeft",
  "time_left",
  "healthBar",
];

// Rule 3: no words on screen. Phaser's text objects are the only way to render
// arbitrary strings, so banning them bans words. Bitmap/DOM text likewise.
const FORBIDDEN_TEXT = [
  "\\.text\\s*\\(", // this.add.text(...)
  "GameObjects\\.Text\\b",
  "BitmapText\\b",
  "\\.dom\\s*\\(",
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".ts")) out.push(full);
  }
  return out;
}

function check() {
  let files;
  try {
    files = walk(SRC);
  } catch {
    console.log("guard: src/ not present yet, nothing to check.");
    return 0;
  }

  const violations = [];
  const idRe = new RegExp(`(${FORBIDDEN_IDENTIFIERS.join("|")})`, "i");
  const textRe = new RegExp(`(${FORBIDDEN_TEXT.join("|")})`);

  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    const allowReason = ALLOWLIST.get(rel);
    const raw = readFileSync(file, "utf8");

    // The rules govern CODE, not documentation: comments must be free to *name*
    // the forbidden concepts in order to forbid them. Blank out all comments
    // (block + line) first, preserving newlines so reported line numbers stay
    // accurate, then scan what remains.
    const stripped = raw
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
      .split(/\r?\n/)
      .map((line) => line.replace(/\/\/.*$/, ""));

    const rawLines = raw.split(/\r?\n/);
    stripped.forEach((code, i) => {
      if (idRe.test(code)) {
        violations.push({ rel, line: i + 1, kind: "failure-state", text: rawLines[i].trim() });
      }
      if (!allowReason && textRe.test(code)) {
        violations.push({ rel, line: i + 1, kind: "words/Text", text: rawLines[i].trim() });
      }
    });
  }

  if (violations.length === 0) {
    console.log(`guard: OK — ${files.length} files clean.`);
    return 0;
  }

  console.error("guard: GOLDEN RULE VIOLATIONS\n");
  for (const v of violations) {
    console.error(`  [${v.kind}] ${v.rel}:${v.line}`);
    console.error(`      ${v.text}`);
  }
  console.error(
    `\n${violations.length} violation(s). See CLAUDE.md "The three golden rules".`
  );
  return 1;
}

process.exit(check());
