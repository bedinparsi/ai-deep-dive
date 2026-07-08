/**
 * EXAMPLE 3 (COMPLEX) — "Build the product-returns (RMA) feature unattended."
 *
 * Demonstrates the full long-running harness architecture from Anthropic's harness-design
 * work, applied to a retail order-management service:
 *
 *   Planner (Opus)     -> expands a 1-line prompt into a spec
 *   [sprint contract]  -> generator & evaluator agree what "done" means BEFORE coding
 *   Generator (Sonnet) -> implements one feature at a time, writes handoff files
 *   Evaluator (Haiku)  -> a SKEPTICAL checker that exercises the feature, files bugs
 *   ...loop until the evaluator's criteria pass...
 *
 * Key harness components on display:
 *   (c) filesystem handoff   (d) orchestration + model routing   (e) verification
 *   (f) observability: a per-agent/phase cost ledger modeled on Anthropic's real run.
 *
 * Everything is MOCKED (scripted transcripts, estimated tokens). Handoff artifacts are
 * written to ./workspace so the file-based handoff is real and inspectable.
 *
 * Run:  npm run ex03
 */

import { mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CostLedger, header } from "../lib/cost.js";

const here = dirname(fileURLToPath(import.meta.url));
const workspace = join(here, "workspace");

const ONE_LINE_PROMPT =
  "Add a product returns / RMA flow: customers request a return, we approve/deny, and issue a refund.";

// ---- Scripted artifacts (what each mock agent "produces") -------------------------------

const SPEC = `# RMA Feature Spec (produced by Planner)
Scope:
1. POST /returns  — customer requests a return for an order line.
2. State machine: pending -> approved | denied.
3. On approved -> issue refund to original payment (integer cents), restock inventory.
4. Audit log entry for every state transition.
AI feature: suggest approve/deny based on return reason + customer history.`;

const SPRINT_CONTRACT = `# Sprint Contract (negotiated: Generator <-> Evaluator)
"Done" for Sprint 1 means ALL of:
- [ ] POST /returns creates a return in 'pending'
- [ ] approve transition issues a refund equal to the line total in cents
- [ ] deny transition issues NO refund
- [ ] every transition writes an audit log row
Verification: evaluator drives the API and asserts refund amounts + audit rows.`;

// Evaluator findings per round (skeptical QA). Round 1 fails, round 2 passes.
const EVAL_ROUND_1 = `# QA Round 1 — 2 FAIL
FAIL: approve issued refund in DOLLARS not CENTS (got 27.54, expected 2754).
FAIL: denied returns still wrote a refund row (should be none).
PASS: pending creation, audit logging.`;

const EVAL_ROUND_2 = `# QA Round 2 — ALL PASS
PASS: refund is integer cents. PASS: denied issues no refund.
PASS: pending creation, audit logging, restock. Contract satisfied.`;

// ---- The orchestration ------------------------------------------------------------------

function writeHandoff(name: string, content: string): void {
  writeFileSync(join(workspace, name), content, "utf8");
  console.log(`    wrote handoff artifact: workspace/${name}`);
}

function main(): void {
  header("EXAMPLE 3 — PLANNER / GENERATOR / EVALUATOR (RMA feature, mocked)");
  console.log("\n  One-line prompt:\n    " + ONE_LINE_PROMPT);

  // Fresh workspace to make the file-based handoff concrete.
  rmSync(workspace, { recursive: true, force: true });
  mkdirSync(workspace, { recursive: true });

  const ledger = new CostLedger();

  // 1) PLANNER (Opus): cheap in tokens, expands the prompt into a spec.
  console.log("\n  [1] PLANNER (Opus) expands the prompt into a spec...");
  writeHandoff("SPEC.md", SPEC);
  ledger.record({ label: "Planner", model: "opus", inputTokens: 1_500, outputTokens: 2_500 });

  // 2) SPRINT CONTRACT: generator & evaluator agree on "done" before any code.
  console.log("\n  [2] SPRINT CONTRACT negotiated (generator <-> evaluator)...");
  writeHandoff("CONTRACT.md", SPRINT_CONTRACT);
  ledger.record({ label: "Contract (generator)", model: "sonnet", inputTokens: 3_000, outputTokens: 1_200 });
  ledger.record({ label: "Contract (evaluator)", model: "haiku", inputTokens: 3_200, outputTokens: 600 });

  // 3) BUILD/QA ROUNDS. Generator dominates cost (mirrors Anthropic's real run).
  const rounds = [
    { build: 620_000, qaFindings: EVAL_ROUND_1, pass: false },
    { build: 180_000, qaFindings: EVAL_ROUND_2, pass: true },
  ];

  let round = 0;
  for (const r of rounds) {
    round++;
    console.log(`\n  [3.${round}] GENERATOR (Sonnet) builds against the contract...`);
    // Generator: large output (writes lots of code), reads spec+contract as input.
    ledger.record({
      label: `Build R${round} (generator)`,
      model: "sonnet",
      inputTokens: Math.round(r.build * 0.35),
      outputTokens: Math.round(r.build * 0.65),
    });
    writeHandoff(`build-r${round}.md`, `# Build round ${round}\n(generated RMA code + notes)`);

    console.log(`  [3.${round}] EVALUATOR (Haiku) exercises the running feature — skeptical QA...`);
    ledger.record({
      label: `QA R${round} (evaluator)`,
      model: "haiku",
      inputTokens: 40_000,
      outputTokens: 3_000,
    });
    writeHandoff(`qa-r${round}.md`, r.qaFindings);
    console.log("\n" + r.qaFindings.split("\n").map((l) => "      " + l).join("\n"));

    if (r.pass) {
      console.log(`\n  Evaluator: contract satisfied at round ${round}. Feature complete.`);
      break;
    }
    console.log(`\n  Evaluator filed bugs; generator will fix in round ${round + 1}.`);
  }

  // Observability: show the handoff artifacts left on disk.
  console.log("\n  Handoff artifacts on disk (workspace/):");
  for (const f of readdirSync(workspace)) console.log("    - " + f);

  ledger.print("Example 3 — RMA build (per-agent/phase)");

  header("READING THE LEDGER (why these numbers)");
  console.log(`
  Modeled on Anthropic's real DAW run ($124.70 total). The shape is the lesson:
    - Planner (Opus): a fraction of a dollar — expanding a prompt is cheap.
    - Generator (Sonnet): ~90% of total spend — WRITING the code is where money goes.
    - Evaluator (Haiku): a few dollars — VERIFICATION IS CHEAP insurance.
  Model routing (Opus plan, Sonnet build, Haiku verify) is a direct cost lever.

  WHY HARNESS, NOT JUST A BIGGER PROMPT? No single context window holds a multi-file
  feature coherently AND verifies itself honestly. The architecture — separate
  planner/generator/evaluator, file handoff, sprint contract, skeptical QA — IS the
  harness. This is the ceiling of what harness engineering does for ONE build.

  WHY NOT A LOOP (yet)? This is a single build you asked for and are reviewing. When
  you want this to run EVERY NIGHT across many services in parallel, you wrap it in a
  loop — see Part 2, Example 6.
`);
}

main();
