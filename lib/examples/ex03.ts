import { CostLedger } from "../cost";
import type { Artifact, RunResult } from "./types";

const ONE_LINE = "Add a product returns / RMA flow: customers request a return, we approve/deny, and issue a refund.";

const SPEC = `# RMA Feature Spec (Planner)
1. POST /returns — request a return for an order line.
2. State machine: pending -> approved | denied.
3. approved -> refund to original payment (integer cents), restock inventory.
4. Audit log for every transition.
AI feature: suggest approve/deny from reason + customer history.`;

const CONTRACT = `# Sprint Contract (Generator <-> Evaluator)
"Done" = ALL of:
- POST /returns creates a return in 'pending'
- approve issues a refund equal to line total in cents
- deny issues NO refund
- every transition writes an audit row`;

const QA1 = `# QA Round 1 — 2 FAIL
FAIL: approve issued refund in DOLLARS not CENTS (27.54 vs 2754).
FAIL: denied returns still wrote a refund row.
PASS: pending creation, audit logging.`;

const QA2 = `# QA Round 2 — ALL PASS
PASS: refund integer cents. PASS: denied issues no refund.
PASS: pending, audit, restock. Contract satisfied.`;

export function runEx03(): RunResult {
  const logs: string[] = [];
  const ledger = new CostLedger();
  const artifacts: Artifact[] = [];

  logs.push(`One-line prompt: ${ONE_LINE}`);
  logs.push("");
  logs.push("[1] PLANNER (Opus) expands the prompt into a spec");
  artifacts.push({ name: "SPEC.md", content: SPEC });
  ledger.record({ label: "Planner", model: "opus", inputTokens: 1500, outputTokens: 2500 });

  logs.push("[2] SPRINT CONTRACT negotiated (generator <-> evaluator)");
  artifacts.push({ name: "CONTRACT.md", content: CONTRACT });
  ledger.record({ label: "Contract (generator)", model: "sonnet", inputTokens: 3000, outputTokens: 1200 });
  ledger.record({ label: "Contract (evaluator)", model: "haiku", inputTokens: 3200, outputTokens: 600 });

  const rounds = [
    { build: 620000, qa: QA1, pass: false },
    { build: 180000, qa: QA2, pass: true },
  ];
  let round = 0;
  for (const r of rounds) {
    round++;
    logs.push(`[3.${round}] GENERATOR (Sonnet) builds against the contract`);
    ledger.record({ label: `Build R${round} (generator)`, model: "sonnet", inputTokens: Math.round(r.build * 0.35), outputTokens: Math.round(r.build * 0.65) });
    logs.push(`[3.${round}] EVALUATOR (Haiku) exercises the feature — skeptical QA`);
    ledger.record({ label: `QA R${round} (evaluator)`, model: "haiku", inputTokens: 40000, outputTokens: 3000 });
    artifacts.push({ name: `qa-r${round}.md`, content: r.qa });
    logs.push(...r.qa.split("\n").map((l) => "    " + l));
    if (r.pass) {
      logs.push(`  Evaluator: contract satisfied at round ${round}. Feature complete.`);
      break;
    }
    logs.push(`  Evaluator filed bugs; generator fixes in round ${round + 1}.`);
  }

  return {
    logs,
    ledger,
    artifacts,
    takeaway:
      "Modeled on Anthropic's real DAW run ($124.70). Shape is the lesson: Planner (Opus) a fraction of a dollar; Generator (Sonnet) ~90% of spend; Evaluator (Haiku) a few percent — VERIFICATION IS CHEAP. Model routing is a direct cost lever. WHY HARNESS, NOT A BIGGER PROMPT? No single context window holds a multi-file feature coherently AND verifies itself honestly — the architecture IS the harness.",
  };
}
