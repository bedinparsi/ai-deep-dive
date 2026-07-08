import type { ExampleMeta } from "./types";
import { runEx01 } from "./ex01";
import { runEx02 } from "./ex02";
import { runEx03 } from "./ex03";
import { runEx04 } from "./ex04";
import { runEx05 } from "./ex05";
import { runEx06 } from "./ex06";

export const EXAMPLES: ExampleMeta[] = [
  {
    id: "ex01",
    number: 1,
    kind: "harness",
    tier: "Simple",
    title: "The agent keeps forgetting our money conventions",
    problem:
      "A coding agent doesn't know money is integer cents or that logging goes through the shared logger. Left alone it introduces rounding bugs and breaks log aggregation.",
    components: ["CLAUDE.md (memory file)", "lint hook"],
    docHref: "/docs/01-harness-engineering",
    run: runEx01,
  },
  {
    id: "ex02",
    number: 2,
    kind: "harness",
    tier: "Medium",
    title: "The agent 'finishes' broken pricing code",
    problem:
      "Asked to add a 'buy 3, get 15% off' promotion, the agent reports 'Done!' while the promotion tests are red and coupon-stacking is wrong.",
    components: ["Stop hook (back-pressure)", "scoped test subset"],
    docHref: "/docs/01-harness-engineering",
    run: runEx02,
  },
  {
    id: "ex03",
    number: 3,
    kind: "harness",
    tier: "Complex",
    title: "Build the product-returns (RMA) feature unattended",
    problem:
      "One-line ask: add a returns/RMA flow (request, approve/deny, refund). Spans many files and context windows — a single agent loses coherence and grades its own broken work as complete.",
    components: ["planner/generator/evaluator", "model routing", "file handoff", "sprint contract"],
    docHref: "/docs/01-harness-engineering",
    run: runEx03,
  },
  {
    id: "ex04",
    number: 4,
    kind: "loop",
    tier: "Simple",
    title: "Run the morning triage on a cadence",
    problem:
      "Every morning someone should review yesterday's failed orders and CI failures for the storefront and write up what needs attention. Nobody reliably does it.",
    components: ["automation/scheduler", "triage skill", "state file"],
    docHref: "/docs/02-loop-engineering",
    run: runEx04,
  },
  {
    id: "ex05",
    number: 5,
    kind: "loop",
    tier: "Medium",
    title: "Run until the goal is actually true",
    problem:
      "'Make all tests in inventory-sync pass and lint clean.' Needs iteration and a trustworthy definition of done.",
    components: ["/goal", "maker/checker split", "continuation (Ralph) hook"],
    docHref: "/docs/02-loop-engineering",
    run: runEx05,
  },
  {
    id: "ex06",
    number: 6,
    kind: "loop",
    tier: "Complex",
    title: "The self-running overnight loop",
    problem:
      "Overnight, autonomously: discover issues across catalog and checkout, fix them in isolation, open PRs, and post a summary — escalating only what needs human judgment.",
    components: ["all six loop pieces", "worktrees", "sub-agents", "connectors", "memory"],
    docHref: "/docs/02-loop-engineering",
    run: runEx06,
  },
];

export function getExample(id: string): ExampleMeta | undefined {
  return EXAMPLES.find((e) => e.id === id);
}
