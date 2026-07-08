# Proposed Documentation Outline + Example Plan

Phase 1 deliverable = the content below in markdown. Phase 2 = a NextJS site to present it.
Anchor technology: Claude Code / Anthropic (Claude Agent SDK). Audience: technical-managerial engineers.

## Document structure

### Part 0 — Executive summary (1-2 pages)
The two-layer mental model (harness = one reliable run; loop = many autonomous runs),
the one equation, and the headline cost/quality tradeoff. For skim-readers/decision-makers.

### Part 1 — Harness Engineering
1. WHAT it is: `agent = model + harness`; the six components; working-backwards method.
2. WHY: the "skill issue" reframe; Terminal Bench Top 30→Top 5; the "what if we didn't" scenarios.
3. HOW: the six components with Claude Code specifics + design rules (ratchet, instruction
   budget, silent success, context firewall).
4. Three worked examples (simple / medium / complex) — see example plan below.

### Part 2 — Modern AI Loops
1. WHAT it is: loop sits above the harness; the five pieces + memory; `/loop` vs `/goal`.
2. WHY: you are the bottleneck; what loops surface; the three sharpened problems.
3. HOW: the six loop components with Claude Code anchors; the morning-triage reference loop.
4. Three worked examples (simple / medium / complex) — see example plan below.

### Part 3 — Context & Memory Management (the enabling pillar)
1. Context engineering: attention budget, context rot, right-altitude prompts.
2. Techniques: compaction, context reset, structured note-taking, JIT retrieval, sub-agent isolation.
3. Memory strategies: Karpathy LLM Wiki, Google OKF, RAG/DB, and the hybrid — with a
   "when to use which" sub-matrix.

### Part 4 — Decision Matrix + Token Economics
1. When to use harness vs loop vs both (matrix below).
2. Token/cost model with the measured Anthropic runs + rate card.
3. Cost levers: model routing, verification-is-cheap, cadence throttling, caching.

### Part 5 — Synthesis
The engineer stays in the loop; harnesses move, don't shrink; start simple, ratchet up.

---

## Three-tier worked-example plan

Each example follows the same template so the docs are consistent:
**(a) The problem in plain English → (b) Why plain prompting fails → (c) The harness/loop
solution → (d) The code (runs in its own sandbox, mocked LLM calls) → (e) Measured/estimated
token + cost → (f) Why THIS technology was the right choice.**

### HARNESS examples

- **Simple — "The agent keeps forgetting our conventions."**
  Problem: agent uses the wrong package manager / reformats files / ignores the logger.
  Solution: a minimal CLAUDE.md (<60 lines) + a format-on-save hook.
  Demonstrates: components (a) + (e), the ratchet, instruction budget.
  Sandbox: a tiny repo; a mock agent runner that reads CLAUDE.md and applies a hook.

- **Medium — "The agent 'finishes' broken code."**
  Problem: agent declares done while typecheck/tests fail.
  Solution: a Stop hook that runs typecheck + a test subset; success silent, failures
  re-injected (back-pressure); a scoped tool set.
  Demonstrates: components (b) + (e) + observability; "success is silent."
  Sandbox: repo with a failing test; mock loop that shows the error re-injection cycle.

- **Complex — "Build a small full-stack feature unattended."**
  Problem: one-line prompt → working feature, no babysitting.
  Solution: planner → generator → evaluator (GAN-style), file-based handoff, sprint
  contract, model routing (Opus planner/parent, Sonnet generator, Haiku-ish evaluator).
  Demonstrates: components (c) + (d) + (e) + (f); context resets/compaction.
  Sandbox: mocked three-agent orchestration with recorded transcripts + a cost ledger.

### LOOP examples

- **Simple — "Run a check on a cadence."**
  Problem: nobody remembers to triage yesterday's CI failures.
  Solution: a scheduled automation that runs a triage skill and writes findings to a
  markdown state file.
  Demonstrates: automations + skills + memory; `/loop`.
  Sandbox: a fake clock + fake CI log; the loop writes `state.md`.

- **Medium — "Run until the goal is actually true."**
  Problem: "make all tests in test/auth pass and lint clean" — needs iteration.
  Solution: `/goal`-style loop with a *separate* verifier deciding done; continuation
  hook re-injects the goal into a fresh context.
  Demonstrates: maker/checker split, continuation (Ralph) pattern, verifiable stop condition.
  Sandbox: mock repo where each iteration fixes one failing test; verifier gates completion.

- **Complex — "The self-running morning loop."**
  Problem: autonomous discover→fix→PR→notify overnight.
  Solution: automation → triage skill → per-finding worktree → maker subagent + checker
  subagent → connector opens PR / updates ticket → state file is the spine.
  Demonstrates: all six loop pieces together; worktrees for parallelism; the three risks.
  Sandbox: fully mocked; simulates two parallel worktrees and a triage inbox.

---

## Decision matrix (skeleton — to be filled with prose + numbers)

| Situation | Use harness | Use loop | Use both | Notes |
|---|---|---|---|---|
| One well-scoped task, you're watching | ✅ | — | — | Tighten prompt/tools/hooks |
| Same task, recurring on a schedule | ✅ | ✅ | ✅ | Loop wraps the tuned harness |
| Clear success criteria + tedious trial-and-error | ✅ | ✅ | ✅ | Willison's "ugh, many variations" test |
| Many independent tasks in parallel | ✅ | ✅ | ✅ | Worktrees + sub-agents |
| Subjective quality (design/taste) | ✅ | — | ✅ | Generator/evaluator; loop if iterated |
| Unattended overnight work | — | ✅ | ✅ | Verifier you trust is mandatory |
| One-off exploration, throwaway | ✅ | — | — | Don't over-engineer; just prompt |

Cost/time columns to add per row: est. tokens, $ range (using measured anchors),
wall-clock, and the dominant cost driver.

## Memory strategy sub-matrix (skeleton)

| Need | LLM Wiki / OKF | RAG / Vector DB | Structured DB | Hybrid |
|---|---|---|---|---|
| Stable, bounded, holistic knowledge | ✅ | — | — | ✅ |
| Large / growing corpus | — | ✅ | — | ✅ |
| Exact lookups + filters | — | — | ✅ | ✅ |
| User-specific / multi-tenant | — | — | ✅ | ✅ |
| Frequently changing facts | — | ✅ | ✅ | ✅ |
| Write-time vs runtime intelligence | write | runtime | runtime | both |
