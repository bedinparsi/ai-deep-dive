# Runnable Examples

Six standalone, **mocked** sandboxes for the Harness & Loop Engineering PoV. Retail domain,
TypeScript on Node.js. Every model call is scripted (deterministic, free, no API key), while
the harness/loop *mechanics* around the calls are real code. Each script prints a **cost
ledger** computed exactly against the verified July 2026 Claude rate card
(Opus $5/$25, Sonnet $3/$15, Haiku $1/$5 per 1M input/output tokens).

## Setup

```bash
cd examples
npm install
```

## Run

```bash
# Harness examples (Part 1)
npm run ex01   # Simple  — CLAUDE.md + lint hook enforce money conventions
npm run ex02   # Medium  — Stop-hook back-pressure won't let broken pricing "finish"
npm run ex03   # Complex — planner/generator/evaluator builds an RMA feature

# Loop examples (Part 2)
npm run ex04   # Simple  — morning triage on a cadence (scheduler + skill + memory)
npm run ex05   # Medium  — /goal: run until tests pass, separate verifier decides "done"
npm run ex06   # Complex — overnight loop: all six pieces, harness-per-fix + loop-across-fixes

npm run all    # run everything
```

## What each demonstrates

| # | Example | Harness/Loop components | Key lesson |
|---|---------|-------------------------|------------|
| 1 | conventions | memory file + hook | Cheap scaffolding prevents money bugs |
| 2 | back-pressure | Stop hook + scoped tests | "Success is silent, failures verbose"; verification is free |
| 3 | planner/gen/eval | orchestration + model routing + file handoff | Generation is expensive, verification is cheap |
| 4 | scheduler | automation + skill + state file | Recurrence without a human; cadence = cost throttle |
| 5 | run-until-goal | /goal + maker/checker + continuation | Loop owns the "am I done?" decision |
| 6 | overnight | all six loop pieces on a harness | Harness per fix, loop across fixes; escalate risk to humans |

## How to make these call a real model later

Each example isolates the mock in `lib/mockLlm.ts` (scripted turns + token estimates).
Swap `ScriptedAgent`/estimates for a call to the Claude Agent SDK or Messages API and read
real `usage` off the response — the surrounding harness/loop code stays the same.

## Files

```
examples/
├── package.json
├── lib/
│   ├── cost.ts        # rate card + CostLedger (the "observability" component)
│   └── mockLlm.ts     # deterministic, offline mock of a model call
├── 01-simple-conventions/       CLAUDE.md, check.ts (hook), run.ts
├── 02-medium-backpressure/      pricing.ts, tests.ts, stopHook.ts, run.ts
├── 03-complex-planner-generator-evaluator/  run.ts (+ generated workspace/)
├── 04-loop-simple-scheduler/    run.ts (+ generated state.md)
├── 05-loop-run-until-goal/      run.ts
└── 06-loop-overnight/           run.ts (+ generated state.md, triage-inbox.md)
```
