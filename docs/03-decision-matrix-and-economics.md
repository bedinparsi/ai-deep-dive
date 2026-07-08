# Part 3 — Decision Matrix & Token Economics

This part answers the two questions a decision-maker actually has: **which technology do I
use for a given problem, and what will it cost?** It also gives you a repeatable way to
*break down a project* so each piece gets the right AI architecture.

---

## 3.1 First principle: they stack, they don't compete

Say it one more time, because it's the thing people get wrong:

- A **harness** makes *one agent run* reliable.
- A **loop** makes *many runs* autonomous over time, by running a harness on a cadence.

So the real question is never "harness *or* loop." It's two questions in order:

1. **How good does this single run need to be?** → how much harness.
2. **Does this run need to happen repeatedly, unattended?** → whether to add a loop.

You can have a strong harness with no loop (Examples 1–3). You should almost never have a
loop with a weak harness — that's just automating unreliable work faster.

---

## 3.2 How to break down a retail project

Use this four-step triage on any initiative before choosing an architecture:

1. **Is it a one-off or does it recur?** One-off → no loop. Recurring on a cadence →
   candidate for a loop.
2. **Is "done" verifiable?** Tests / types / a running app to click → you can add
   back-pressure and (if recurring) a `/goal` loop. Pure taste with no check → keep a human
   in the seat; use at most a generator/evaluator harness with human review.
3. **What's the blast radius?** Touches money, customer data, or production → more harness
   (hooks that block, approvals, skeptical evaluator), and if looped, escalate risky items
   to a human inbox rather than auto-acting.
4. **How long is the horizon?** Fits in one context window → single harnessed run. Spans
   many windows / hours → orchestration (planner/generator/evaluator), and if it must run
   unattended, a loop.

Worked example — a "modernize the checkout service" initiative decomposes cleanly:

| Sub-task | One-off/recurring | Verifiable? | Architecture |
|----------|-------------------|-------------|--------------|
| Enforce money/logging conventions | recurring, every edit | yes (lint) | Harness: CLAUDE.md + hook (Ex 1) |
| Add a promotion, don't ship it broken | one-off, iterate | yes (tests) | Harness: back-pressure (Ex 2) |
| Build the RMA/returns feature | one-off, multi-file | yes (running app) | Harness: planner/gen/eval (Ex 3) |
| Morning failed-order triage | recurring daily | n/a (report) | Loop: scheduler + skill + memory (Ex 4) |
| Get inventory-sync tests green | one-off but iterative | yes (tests) | Loop (light): /goal run-until-true (Ex 5) |
| Overnight fix-and-PR across services | recurring nightly | yes (tests+review) | Loop on harness: all six pieces (Ex 6) |

---

## 3.3 The decision matrix

"When to use which," with the dominant cost driver and the example that demonstrates it.
Cost bands use the verified July 2026 rate card (Opus $5/$25, Sonnet $3/$15, Haiku $1/$5
per 1M input/output tokens) and the measured/estimated numbers from our sandboxes.

| Situation | Harness | Loop | Both | Dominant cost driver | Est. cost/run | Demo |
|-----------|:------:|:---:|:---:|----------------------|---------------|------|
| One well-scoped task, you're watching | ✅ | — | — | A little memory + a hook | < $0.01 | Ex 1 |
| Task that must not "finish" broken | ✅ | — | — | Iterations to green (maker) | ~$0.02–0.05 | Ex 2 |
| Multi-file feature, one build | ✅ | — | — | The **generator** (~90%) | $5–$200 | Ex 3 |
| Recurring report/triage, no code change | — | ✅ | — | **Cadence** × cheap pass | pennies/run | Ex 4 |
| Iterate until a verifiable condition holds | partial | ✅ | ✅ | Iterations to convergence | ~$0.05–0.50 | Ex 5 |
| Unattended, parallel, across services | ✅ | ✅ | ✅ | **Findings × (maker+checker)** × cadence | $0.20–$5+/night | Ex 6 |
| Subjective quality (design/taste) | ✅ | — | maybe | Generator + evaluator rounds | varies | (Anthropic frontend) |
| One-off throwaway exploration | — | — | — | Just prompt it | ~free | n/a |

Reading the matrix:

- **The cheap wins are cheap.** Conventions (Ex 1) and back-pressure (Ex 2) cost fractions
  of a cent per run and prevent bugs that cost human hours. This is the highest ROI in the
  entire document — do this first, always.
- **The expensive work is bounded and predictable.** A full multi-file build (Ex 3) is
  dominated by the generator; you control cost by *model routing* (cheap planner/verifier)
  and by not over-scoping.
- **Loops multiply, so watch the multiplier.** A loop's cost is per-run cost × cadence ×
  parallelism. The scheduler is your throttle.

---

## 3.4 Token economics — the honest numbers

### The rate card (per 1M tokens, verified July 2026)

| Model | Input | Output | Use it for |
|-------|-------|--------|------------|
| Opus | $5 | $25 | Planning, orchestration, hard reasoning (the parent) |
| Sonnet | $3 | $15 | The workhorse generator |
| Haiku | $1 | $5 | Cheap sub-agents: verification, triage, grep |

Discounts to remember: **batch processing ~50% off**, and **prompt caching** heavily
discounts repeated input (e.g., a stable `CLAUDE.md` or system prompt read every turn).
Confirm exact cache multipliers on the official pricing page before publishing hard totals.

### The two measured anchor runs (Anthropic)

These are *real* published measurements, and they anchor our whole cost model
([Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)):

**Retro game maker — the reliability premium.**

| Approach | Duration | Cost | Result |
|----------|----------|------|--------|
| Solo (no harness) | 20 min | **$9** | Core feature broken |
| Full harness | 6 hr | **$200** | Working |

~20x more expensive — and worth it, because the cheap version didn't work. This is the
number to cite when someone asks "why not just one prompt?"

**DAW build — where the money actually goes** (V2 harness, $124.70 total):

| Phase | Cost | Share |
|-------|------|-------|
| Planner | $0.46 | ~0.4% |
| Build (generator), 3 rounds | ~$113.85 | ~91% |
| QA (evaluator), 3 rounds | ~$10.39 | ~8% |

**The single most important economic insight: generation is expensive, verification is
cheap.** Our Example 3 ledger reproduces this shape ($8.85 total, generator ~97%, evaluator
~1%). That's why adding a skeptical evaluator is a *low-cost insurance policy*, not a luxury
— and why you route the evaluator to a cheap model.

### Cost levers you actually control

1. **Model routing.** Opus to plan, Sonnet to build, Haiku to verify/triage. Our examples
   apply this throughout. Running everything on Opus can multiply spend several-fold for no
   quality gain on the cheap tasks.
2. **Verification is cheap — spend it freely.** A local test run costs *zero* model tokens
   (Ex 1, 2); a small-model evaluator costs a few percent of the build. Never skip it to
   save money; the math doesn't favor that.
3. **Context discipline lowers input cost every turn.** A tight `CLAUDE.md` (< ~60 lines),
   focused tool sets, and sub-agent firewalls keep per-turn input tokens down — and input
   tokens are paid *every single turn*, so this compounds.
4. **Cadence is the loop throttle.** Daily triage (Ex 4) is pennies; per-minute is ~1,440×
   that. Pick the slowest cadence that still catches problems in time.
5. **Caching stable prefixes.** If your system prompt / `CLAUDE.md` is constant, caching
   turns its repeated cost into a fraction.

### A back-of-envelope for a retail org

Say the overnight loop (Ex 6) runs nightly, averaging 4 auto-fixable findings at ~$0.10
(maker) + ~$0.01 (checker) each, plus a ~$0.006 triage pass:

```
per night  ≈ $0.006 + 4 × ($0.096 + $0.0095)  ≈ $0.43
per month  ≈ $0.43 × 30                        ≈ $13
```

Thirteen dollars a month to keep two services triaged and PR'd overnight — versus the
engineer-hours that work would otherwise consume. The economics favor the loop *here*
precisely because the work recurs and is verifiable. For a one-off, the same machinery would
be pure overhead. That contrast *is* the decision framework.

> **Caveat on all numbers.** Our per-example figures are realistic *estimates* computed
> exactly against the rate card (model calls are mocked for reproducibility). The two anchor
> runs are Anthropic's real measurements. Treat the estimates as order-of-magnitude planning
> numbers, and measure your own workloads before committing a budget.

**Next:** [Part 4 — Synthesis](04-synthesis.md).
