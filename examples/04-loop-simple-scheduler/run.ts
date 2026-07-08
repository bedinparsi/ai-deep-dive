/**
 * EXAMPLE 4 (SIMPLE LOOP) — "Run the morning triage on a cadence."
 *
 * The two cheapest loop pieces:
 *   (1) automation/scheduler — a fake clock drives 3 "mornings"
 *   (3) a triage skill       — reads a feed, produces findings
 *   (6) memory/state         — findings are appended to state.md, which persists across runs
 *
 * The point: recurrence WITHOUT a human initiating it. Watch state.md grow across runs.
 *
 * Run:  npm run ex04
 */

import { writeFileSync, appendFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CostLedger, header } from "../lib/cost.js";

const here = dirname(fileURLToPath(import.meta.url));
const stateFile = join(here, "state.md");

// A mock feed of what happened "yesterday" on each of three mornings.
const FEED: Record<string, { failedOrders: number; ciFailures: string[] }> = {
  "2026-07-06": { failedOrders: 3, ciFailures: ["checkout-e2e: timeout on /pay"] },
  "2026-07-07": { failedOrders: 0, ciFailures: [] },
  "2026-07-08": { failedOrders: 7, ciFailures: ["catalog-unit: null SKU", "inventory-sync: drift"] },
};

/** The TRIAGE SKILL: turns a raw feed into prioritized findings (mocked model reasoning). */
function triageSkill(date: string, feed: (typeof FEED)[string]): { summary: string; actionable: boolean } {
  const issues: string[] = [];
  if (feed.failedOrders > 5) issues.push(`HIGH: ${feed.failedOrders} failed orders — investigate payment gateway`);
  else if (feed.failedOrders > 0) issues.push(`LOW: ${feed.failedOrders} failed orders — monitor`);
  for (const ci of feed.ciFailures) issues.push(`CI: ${ci}`);
  const actionable = issues.length > 0;
  const summary = actionable ? issues.map((i) => "  - " + i).join("\n") : "  - all clear; nothing to triage";
  return { summary, actionable };
}

function morningRun(date: string, ledger: CostLedger): void {
  const feed = FEED[date];
  console.log(`\n  [SCHEDULER] ${date} 06:00 — automation fires $triage-skill`);

  // Skill run = one cheap model pass (Haiku-class). Input scales with feed size.
  const inputTokens = 1_200 + feed.failedOrders * 30 + feed.ciFailures.length * 120;
  ledger.record({ label: `triage ${date}`, model: "haiku", inputTokens, outputTokens: 220 });

  const { summary, actionable } = triageSkill(date, feed);

  if (!actionable) {
    console.log("  [TRIAGE] all clear — run archives itself, nothing written to state.");
    return;
  }
  // (6) Append findings to the persistent state file.
  const block = `\n## ${date}\n${summary}\n`;
  appendFileSync(stateFile, block, "utf8");
  console.log("  [TRIAGE] findings:");
  console.log(summary);
  console.log("  -> appended to state.md");
}

function main(): void {
  header("EXAMPLE 4 — MORNING TRIAGE LOOP (scheduler + skill + memory)");

  // Fresh state file (the memory that outlives any single conversation).
  rmSync(stateFile, { force: true });
  writeFileSync(stateFile, "# Triage State — Storefront\n(kept on disk; the agent forgets, the repo doesn't)\n", "utf8");

  const ledger = new CostLedger();
  for (const date of Object.keys(FEED)) morningRun(date, ledger);

  console.log("\n  Final state.md on disk:\n");
  console.log(readFileSync(stateFile, "utf8").split("\n").map((l) => "    " + l).join("\n"));

  ledger.print("Example 4 — 3 morning runs");

  header("TAKEAWAY");
  console.log(`
  COST = CADENCE x PER-RUN COST. Three daily runs cost pennies. The same loop at
  per-minute cadence would cost ~1,440x more. The scheduler IS the cost throttle.

  WHY A LOOP, NOT JUST A HARNESS? A harnessed agent could do one triage perfectly.
  The loop's contribution is that it happens EVERY morning on its own, and the
  state file lets each run build on the last. That recurrence is the whole point.

  Note: 2026-07-07 was "all clear" — the run archived itself and wrote nothing.
  Loops should be quiet when there's nothing to say (success is silent).
`);
}

main();
