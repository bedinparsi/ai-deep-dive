/**
 * EXAMPLE 6 (COMPLEX LOOP) — "The self-running overnight loop."
 *
 * All six loop pieces working together, on top of the Example-3 harness pattern:
 *   (1) automation  — overnight kickoff
 *   (2) worktrees   — two services fixed in parallel, isolated
 *   (3) skill       — triage skill discovers work
 *   (4) connectors  — "open PR", "update ticket" (mocked)
 *   (5) sub-agents  — maker + checker per finding (harness-per-fix)
 *   (6) memory      — state.md is the spine; unhandled work -> triage inbox
 *
 * This is the clearest picture of the two layers stacking: HARNESS per fix, LOOP across
 * fixes. Fully mocked. Prints a cost ledger for the whole run.
 *
 * Run:  npm run ex06
 */

import { writeFileSync, appendFileSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CostLedger, header } from "../lib/cost.js";

const here = dirname(fileURLToPath(import.meta.url));
const stateFile = join(here, "state.md");
const inboxFile = join(here, "triage-inbox.md");

interface Finding {
  id: string;
  service: "catalog" | "checkout";
  desc: string;
  autoFixable: boolean; // if false -> escalates to the human triage inbox
}

// What the triage skill discovers overnight.
const FINDINGS: Finding[] = [
  { id: "CAT-101", service: "catalog", desc: "null SKU crashes product page", autoFixable: true },
  { id: "CHK-205", service: "checkout", desc: "coupon+promo stacking rounding bug", autoFixable: true },
  { id: "CHK-206", service: "checkout", desc: "PCI change needs security sign-off", autoFixable: false },
];

/** A maker sub-agent drafts a fix inside an isolated worktree (harness-per-fix). */
function makerSubagent(f: Finding, ledger: CostLedger): string {
  ledger.record({ label: `${f.id} maker`, model: "sonnet", inputTokens: 12_000, outputTokens: 4_000 });
  return `draft fix for ${f.id} (${f.desc})`;
}

/** A checker sub-agent reviews the draft against skills + tests. Cheap, skeptical. */
function checkerSubagent(f: Finding, ledger: CostLedger): boolean {
  ledger.record({ label: `${f.id} checker`, model: "haiku", inputTokens: 6_000, outputTokens: 700 });
  return true; // in this scripted run, both auto-fixable findings pass review
}

/** Mocked connectors. */
function openPR(f: Finding): void {
  console.log(`      [connector] opened PR for ${f.id}, linked ticket, pinged #eng-storefront`);
}

function main(): void {
  header("EXAMPLE 6 — OVERNIGHT LOOP (all six pieces; harness per fix, loop across fixes)");

  rmSync(stateFile, { force: true });
  rmSync(inboxFile, { force: true });
  writeFileSync(stateFile, "# Overnight Loop State\n", "utf8");
  writeFileSync(inboxFile, "# Human Triage Inbox (needs judgment)\n", "utf8");

  const ledger = new CostLedger();

  // (1)+(3) automation fires the triage skill to discover work.
  console.log("\n  [00:30] automation fires $overnight-triage");
  ledger.record({ label: "triage skill", model: "haiku", inputTokens: 3_000, outputTokens: 500 });
  console.log(`  [triage] discovered ${FINDINGS.length} findings; writing to state.md`);
  for (const f of FINDINGS) appendFileSync(stateFile, `- ${f.id} [${f.service}] ${f.desc}\n`, "utf8");

  // (2) process each finding; auto-fixable ones run in isolated parallel worktrees.
  for (const f of FINDINGS) {
    console.log(`\n  ---- ${f.id} [${f.service}] ----`);
    if (!f.autoFixable) {
      console.log("    not auto-fixable -> escalate to human triage inbox");
      appendFileSync(inboxFile, `- ${f.id}: ${f.desc} (needs human judgment)\n`, "utf8");
      appendFileSync(stateFile, `  - ${f.id}: ESCALATED\n`, "utf8");
      continue;
    }
    console.log(`    [worktree] git worktree add ../wt-${f.service} (isolated checkout)`);
    console.log("    " + makerSubagent(f, ledger));
    const approved = checkerSubagent(f, ledger);
    console.log(`    [checker] review ${approved ? "APPROVED ✔" : "REJECTED"}`);
    if (approved) {
      openPR(f);
      appendFileSync(stateFile, `  - ${f.id}: PR OPENED\n`, "utf8");
    }
  }

  console.log("\n  Final state.md:\n");
  console.log(readFileSync(stateFile, "utf8").split("\n").map((l) => "    " + l).join("\n"));
  console.log("\n  Human triage inbox (morning surprise for the engineer):\n");
  console.log(readFileSync(inboxFile, "utf8").split("\n").map((l) => "    " + l).join("\n"));

  ledger.print("Example 6 — one overnight run");

  header("TAKEAWAY");
  console.log(`
  COST = findings x (maker + checker) per finding, x cadence over time. The ledger
  makes the scaling visible: cadence and parallelism are the two dials you watch.

  HARNESS vs LOOP, made concrete: each fix is a HARNESS problem (maker/checker,
  verification). The LOOP adds discovery, scheduling, parallel isolation (worktrees),
  connectors, and unattended operation ACROSS many fixes. Two layers, stacked.

  STAY THE ENGINEER: the loop escalated the PCI change to a human inbox instead of
  "fixing" a security-sensitive area unattended. The unhandled case surfacing to you
  is a feature, not a failure — verification and judgment remain yours.
`);
}

main();
