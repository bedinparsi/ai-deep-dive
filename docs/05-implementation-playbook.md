# Implementation Playbook — Building the Six Examples in Claude Code

*This is the hands-on **HOW**. Put yourself in the seat of an AI developer setting up a real
Claude Code project. For each of the six examples you'll see the **file/folder structure**,
the **actual contents** of every AI markdown file (`CLAUDE.md`, `SKILL.md`, subagent files),
the **tools, hooks, and MCP config**, and a **step-by-step** setup — including how to wire up
a loop with Claude.*

Each example here mirrors a runnable sandbox in [`examples/`](../examples/). The sandbox
proves the *logic* with mocked model calls; this playbook shows the *real Claude Code wiring*
you'd use in a retail repo.

---

## 0. Claude Code building blocks (read this once)

Everything below is assembled from a small set of files Claude Code looks for. Here's the
canonical layout of a retail service repo wired for agents:

```
checkout-service/
├── CLAUDE.md                     # always-on project memory (injected every turn)
├── .mcp.json                     # MCP server connections (tools)
├── .claude/
│   ├── settings.json             # hooks, permissions, model config (checked into git)
│   ├── settings.local.json       # personal overrides (gitignored)
│   ├── skills/                   # progressively-disclosed knowledge/procedures
│   │   └── <skill-name>/
│   │       └── SKILL.md
│   ├── agents/                   # subagent definitions (maker, checker, planner…)
│   │   └── <agent-name>.md
│   ├── commands/                 # custom slash commands (/triage, /goal…)
│   │   └── <command>.md
│   └── hooks/                    # hook scripts invoked by settings.json
│       └── <hook>.sh|.ts
├── src/ …                        # your actual code
└── tests/ …
```

What each piece is, and how it's written:

**`CLAUDE.md`** — plain markdown at the repo root, auto-injected into the system prompt every
turn. Keep it short (< ~60 lines). Nested `CLAUDE.md` files in subfolders merge when the agent
works there.

**Skill** — a folder `.claude/skills/<name>/SKILL.md` with YAML frontmatter. Loaded *only when
the task matches the description* (progressive disclosure):

```markdown
---
name: promo-testing
description: How to run and interpret the pricing/promotion test subset. Use whenever changing discounts, coupons, or promotions.
---
Body instructions the agent reads when the skill activates…
```

**Subagent** — a file `.claude/agents/<name>.md` with frontmatter. Runs in its *own* context
window (context firewall) and can be pinned to a cheaper model (cost control):

```markdown
---
name: pricing-checker
description: Skeptical QA reviewer for pricing changes. Use after any pricing edit.
tools: Read, Bash, Grep          # omit to inherit all tools
model: haiku                     # route cheap work to a cheap model
---
System prompt for this subagent…
```

**Hook** — configured in `.claude/settings.json`, keyed by lifecycle event. The contract that
makes "success silent, failures verbose" work: a hook **exit code 0** is silent; **exit code
2** blocks the action and feeds the hook's `stderr` back to Claude to fix.

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write|MultiEdit",
        "hooks": [ { "type": "command", "command": ".claude/hooks/check.sh" } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": ".claude/hooks/verify.sh" } ] }
    ]
  }
}
```

Key hook events: `PreToolUse` (gate/approve before a tool runs), `PostToolUse` (verify after an
edit/command), `Stop` (gate whether the agent may finish), `SubagentStop`, `SessionStart`,
`PreCompact`.

**MCP** — `.mcp.json` connects external tools. Remember the context tax (§1.3b): only connect
what a task needs.

```json
{ "mcpServers": {
    "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] }
} }
```

**Loop mechanisms** (used in Examples 4–6). Four real ways to run Claude on a loop today:

1. **Stop-hook continuation** — a `Stop` hook checks a completion condition; if unmet it exits
   2 and tells Claude to keep going. This is the deterministic core of the "Ralph loop."
2. **Headless while-loop** — `claude -p` (print/non-interactive mode) driven by a shell loop:
   ```bash
   while :; do cat PROMPT.md | claude -p --dangerously-skip-permissions; done
   ```
3. **Scheduler** — cron, Windows Task Scheduler, or a GitHub Actions `schedule` trigger runs
   `claude -p` on a cadence.
4. **In-session primitives** — `/loop` (re-run on a cadence) and `/goal` (run until a verifiable
   condition holds, with a separate model grading "done"), per Osmani's loop-engineering writeup.

> Run agents in a **sandbox** (container, or `--dangerously-skip-permissions` only inside an
> isolated environment with locked-down network egress). An agent with shell access can do
> anything you can (Willison's "YOLO mode" warning).

The rest of this playbook builds the six examples on these primitives.

---

## Example 1 (Harness · Simple) — Enforce money conventions with CLAUDE.md + a lint hook

**Goal:** stop the agent from writing float money math or `console.log` in the checkout
service. Sandbox: [`examples/01-simple-conventions/`](../examples/01-simple-conventions/).

### File tree

```
checkout-service/
├── CLAUDE.md
├── .claude/
│   ├── settings.json
│   └── hooks/
│       └── check-conventions.sh
└── src/
    └── pricing.ts
```

### `CLAUDE.md`  (the always-on memory — every line earns its place)

```markdown
# Checkout Service — Agent Guide

This service calculates carts, discounts, and refunds.

## Money
- Money is ALWAYS integer cents (`number`), never floating-point dollars.
  $12.00 is `1200`. Never write `price * 0.85`; compute in cents and round with Math.round.

## Logging
- Use the shared `logger` from `./logger`. Never use `console.log` in service code.

## Commands
- Test: `npm test`
- Typecheck: `npm run typecheck`

<!-- Ratchet log (why each rule exists):
 2026-02: a float discount shipped a 1-cent refund error -> "integer cents".
 2026-03: console.log broke prod log aggregation      -> "use logger". -->
```

### `.claude/settings.json`  (fire the hook after every edit)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/check-conventions.sh" }
        ]
      }
    ]
  }
}
```

### `.claude/hooks/check-conventions.sh`  (success silent, failure verbose)

```bash
#!/usr/bin/env bash
# Scans staged/edited TypeScript for the two banned patterns. Exit 2 => Claude must fix.
set -euo pipefail
violations=""

# float money math on a price-like name
if git diff --cached -U0 -- 'src/**/*.ts' | grep -nE '\b(price|amount|total|subtotal|cost)\w*\s*\*\s*[0-9]*\.[0-9]+'; then
  violations+="[integer-cents] floating-point money math detected. Compute in cents: Math.round(priceCents * 85 / 100).\n"
fi
# console.log in service code
if git diff --cached -U0 -- 'src/**/*.ts' | grep -nE '\bconsole\.log\s*\('; then
  violations+="[use-logger] console.log in service code. Import { logger } and use logger.info(...).\n"
fi

if [ -n "$violations" ]; then
  echo -e "HOOK FAILED — fix before finishing:\n$violations" >&2
  exit 2      # non-zero + stderr => fed back to Claude to self-correct
fi
exit 0        # silent success
```

### Step by step

1. `mkdir -p .claude/hooks` and add the three files above.
2. Make the hook executable: `chmod +x .claude/hooks/check-conventions.sh`.
3. Start Claude Code in the repo and give it a task, e.g. *"apply a 15% discount to the cart
   subtotal and log the result."*
4. When Claude edits `pricing.ts`, the `PostToolUse` hook runs. If it wrote `subtotal * 0.85`
   or `console.log`, the hook exits 2 and the violation text is injected — Claude fixes it and
   re-submits. On clean code the hook is silent and Claude finishes.
5. **Cost:** `CLAUDE.md` adds ~250 input tokens/turn; the hook is local (zero model tokens).
   Matches the sandbox ledger (Run B ≈ $0.0035).

**Why this is a harness, not a loop:** single run, no schedule. The two cheapest harness
levers — a memory file and a hook — fully solve it.

---

## Example 2 (Harness · Medium) — Back-pressure so broken pricing can't "finish"

**Goal:** the agent may not declare "done" while the promotion test subset is red. Adds a
`Stop` hook and a skill that teaches it how to run the right tests. Sandbox:
[`examples/02-medium-backpressure/`](../examples/02-medium-backpressure/).

### File tree

```
checkout-service/
├── CLAUDE.md
├── .claude/
│   ├── settings.json
│   ├── skills/
│   │   └── promo-testing/
│   │       └── SKILL.md
│   └── hooks/
│       └── verify-pricing.sh
├── src/pricing.ts
└── tests/promotion.test.ts
```

### `.claude/skills/promo-testing/SKILL.md`  (progressive disclosure — loads only for pricing work)

```markdown
---
name: promo-testing
description: How to run and interpret the pricing/promotion test subset. Use whenever changing discounts, coupons, or promotions.
---

# Promotion testing

Run ONLY the promotion subset (not the whole suite — that floods context):

    npm test -- tests/promotion.test.ts

Invariants to preserve:
- Money is integer cents.
- Order of operations: apply the buy-3+ promo FIRST, then any coupon on the promo price.
- A denied/invalid coupon must not silently drop the promo.

If a case fails, fix the ordering before touching anything else.
```

### `.claude/hooks/verify-pricing.sh`  (the Stop hook — gates completion)

```bash
#!/usr/bin/env bash
# Runs typecheck + the promotion subset when Claude tries to stop.
# Silent on green; on red, exit 2 so Claude keeps working.
set -uo pipefail

out=$(npm run typecheck --silent 2>&1 && npx vitest run tests/promotion.test.ts 2>&1)
if [ $? -ne 0 ]; then
  echo "STOP HOOK: pricing checks are RED — you cannot finish yet." >&2
  echo "$out" | tail -n 40 >&2
  exit 2
fi
exit 0
```

### `.claude/settings.json`

```json
{
  "hooks": {
    "Stop": [
      { "hooks": [ { "type": "command", "command": ".claude/hooks/verify-pricing.sh" } ] }
    ]
  }
}
```

### Step by step

1. Add the skill folder, the Stop hook, and register it in `settings.json`.
2. Ask Claude: *"Add a 'buy 3+, 15% off' promotion that stacks correctly with coupons."*
3. The `promo-testing` skill activates (its description matches), so Claude knows to run the
   subset and the ordering invariant.
4. When Claude tries to finish, the `Stop` hook runs typecheck + the promotion tests. Red →
   exit 2 → failing tests injected → Claude iterates. Green → silent → Claude finishes.
5. **Cost:** the check is local (zero model tokens); only re-injected failure text adds input
   tokens per iteration. Matches sandbox Run B (~$0.024 across 3 attempts).

**Why harness, not loop:** one task with iterate-until-correct. You start it and watch it. It
becomes a loop when this must run unattended/on a schedule (Example 5).

---

## Example 3 (Harness · Complex) — Planner / Generator / Evaluator builds the RMA feature

**Goal:** turn a one-line ask ("add a returns/RMA flow") into a working, tested feature via
three subagents with model routing, a sprint contract, file-based handoff, and browser
verification. Sandbox:
[`examples/03-complex-planner-generator-evaluator/`](../examples/03-complex-planner-generator-evaluator/).

### File tree

```
order-management/
├── CLAUDE.md
├── .mcp.json                         # Playwright MCP for the evaluator
├── .claude/
│   ├── settings.json
│   ├── commands/
│   │   └── build-feature.md          # /build-feature orchestration command
│   ├── agents/
│   │   ├── planner.md                # Opus  — spec from one-liner
│   │   ├── generator.md              # Sonnet — implements one feature at a time
│   │   └── evaluator.md              # Haiku  — skeptical QA against a contract
│   └── skills/
│       └── frontend-design/
│           └── SKILL.md
└── workspace/                        # file-based handoff artifacts
    ├── SPEC.md   CONTRACT.md   qa-r1.md …
```

### `.claude/agents/planner.md`

```markdown
---
name: planner
description: Expands a 1-4 sentence product ask into a full, ambitious spec. Use at the start of any feature build.
model: opus
tools: Read, Grep, Glob
---
You are a product planner. Expand the user's short prompt into a spec in workspace/SPEC.md:
scope, a state machine, data model, and acceptance criteria. Be ambitious about scope but
stay at product/architecture altitude — do NOT specify low-level implementation (that
cascades errors downstream). Weave in one AI-assisted feature where it genuinely helps.
```

### `.claude/agents/generator.md`

```markdown
---
name: generator
description: Implements one feature at a time against the agreed sprint contract. Use to build/modify application code.
model: sonnet
tools: Read, Write, Edit, Bash, Grep, Glob
---
You implement against workspace/CONTRACT.md, one feature at a time, on a React+Vite+FastAPI
+SQLite stack. Money is integer cents. Commit after each green step. Before finishing a
sprint, self-check, then hand off to the evaluator by writing what you built.
```

### `.claude/agents/evaluator.md`  (skeptical — the maker/checker split)

```markdown
---
name: evaluator
description: Skeptical QA. Exercises the running feature via a browser and files specific bugs against the contract. Use after each generator sprint.
model: haiku
tools: Read, Bash, mcp__playwright
---
You are a skeptical QA reviewer. Do NOT be generous. Using the Playwright MCP, click through
the running app the way a user would. Check each criterion in workspace/CONTRACT.md. For each
FAIL, write the exact expected vs. actual and a file:line if you can, into workspace/qa-rN.md.
Only pass a sprint if EVERY criterion holds. Refund amounts must be integer cents.
```

### `.mcp.json`  (give only the evaluator a browser)

```json
{ "mcpServers": {
    "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] }
} }
```

### `.claude/commands/build-feature.md`  (the orchestration — invoke as `/build-feature`)

```markdown
Build the feature described in: $ARGUMENTS

1. Use the `planner` subagent to write workspace/SPEC.md.
2. Have the `generator` and `evaluator` negotiate workspace/CONTRACT.md (what "done" means)
   BEFORE any code is written. Iterate until both agree.
3. Loop: `generator` implements the next sprint → `evaluator` reviews via Playwright and
   writes workspace/qa-rN.md. If any criterion fails, the generator fixes it. Repeat until
   the evaluator passes the contract.
4. Summarize what shipped and the per-agent token cost.
```

### Step by step

1. Define the three agents in `.claude/agents/`, the `/build-feature` command, and the
   Playwright MCP in `.mcp.json`.
2. Run: `/build-feature Add a product returns / RMA flow: request, approve/deny, refund.`
3. The **planner (Opus)** writes `SPEC.md`. Generator + evaluator negotiate `CONTRACT.md`
   (the sprint contract). The **generator (Sonnet)** builds; the **evaluator (Haiku)** drives
   the running app with Playwright and files bugs into `qa-rN.md`. Loop until green.
4. **Model routing is the cost lever:** Opus plans (cheap, small output), Sonnet builds (the
   ~90% of spend), Haiku verifies (a few %). Matches Anthropic's real DAW run shape and the
   sandbox ledger (generator dominates).

**Why harness, not a bigger prompt:** no single context window holds a multi-file feature
coherently *and* verifies itself honestly. The architecture — separate agents, file handoff,
sprint contract, skeptical browser QA — *is* the harness. Wrap it in a loop (Example 6) when
it must run nightly across services.

---

## Example 4 (Loop · Simple) — Morning triage on a cadence

**Goal:** every morning, review yesterday's failed orders + CI failures and append findings
to a state file — with no human starting it. Sandbox:
[`examples/04-loop-simple-scheduler/`](../examples/04-loop-simple-scheduler/).

The loop pieces here: **automation/scheduler + skill + memory (state file)**.

### File tree

```
storefront-ops/
├── CLAUDE.md
├── state.md                          # the memory that outlives any conversation
├── .claude/
│   └── skills/
│       └── triage/
│           └── SKILL.md
└── .github/
    └── workflows/
        └── morning-triage.yml        # the scheduler (cron)
```

### `.claude/skills/triage/SKILL.md`

```markdown
---
name: triage
description: Summarize yesterday's failed orders and CI failures into prioritized findings. Use for the daily morning triage run.
---

# Morning triage

1. Read yesterday's failed-order count and the CI failure list (from the tools/logs provided).
2. Prioritize: >5 failed orders = HIGH (investigate payment gateway); 1-5 = LOW (monitor).
3. List each CI failure as `CI: <suite>: <reason>`.
4. Append a dated section to state.md. If nothing is actionable, write nothing and exit quietly.
```

### `.github/workflows/morning-triage.yml`  (the cadence — runs headless Claude)

```yaml
name: morning-triage
on:
  schedule:
    - cron: "0 6 * * *"        # 06:00 UTC daily
  workflow_dispatch: {}         # allow manual runs too
jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g @anthropic-ai/claude-code
      - name: Run triage
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude -p "Run the $triage skill for yesterday. Append findings to state.md." \
            --allowedTools "Read,Write,Bash" --model haiku
      - name: Commit findings
        run: |
          git config user.name "triage-bot"; git config user.email "bot@local"
          git add state.md && git commit -m "triage $(date +%F)" || echo "nothing to commit"
          git push
```

> Local alternatives to GitHub Actions: a cron entry
> `0 6 * * * cd /repo && claude -p "run $triage" --model haiku` on Linux/macOS, or a
> **Windows Task Scheduler** task running the same `claude -p` command. Same idea: a cadence
> firing headless Claude.

### Step by step

1. Add the `triage` skill and the workflow (store `ANTHROPIC_API_KEY` as a repo secret).
2. The schedule fires `claude -p` headless each morning; the skill activates by description.
3. Findings append to `state.md`, committed back to the repo — tomorrow's run reads it and
   builds on it. Quiet mornings write nothing (success is silent).
4. **Cost = cadence × per-run cost.** A daily Haiku pass is pennies; per-minute would be
   ~1,440× more. The schedule *is* the throttle.

**Why a loop, not just a harness:** the value is recurrence without a human initiating it,
plus the state file compounding across runs.

---

## Example 5 (Loop · Medium) — Run until the goal is verifiably true

**Goal:** "make all tests in `inventory-sync` pass and lint clean" — iterate autonomously
until a *verifiable* condition holds, with a **separate** verifier deciding "done." Sandbox:
[`examples/05-loop-run-until-goal/`](../examples/05-loop-run-until-goal/).

Loop pieces: **`/goal`-style continuation + maker/checker split + fresh-context continuation
(the Ralph pattern)**.

### File tree

```
inventory-service/
├── PROMPT.md                         # the goal, read fresh each iteration
├── progress.md                       # state carried between fresh contexts
├── .claude/
│   ├── settings.json
│   ├── agents/
│   │   └── verifier.md               # separate model decides "done"
│   └── hooks/
│       └── goal-gate.sh              # Stop-hook continuation
└── run-until-goal.sh                 # headless while-loop driver
```

### `PROMPT.md`  (the goal + the continuation contract)

```markdown
GOAL: all tests in tests/inventory-sync pass AND `npm run lint` is clean.

Read progress.md for what's already done. Fix ONE failing test or lint group, run the
checks, update progress.md with what you changed and what remains, then stop.
Do not claim done — the verifier decides that.
```

### `.claude/agents/verifier.md`  (the checker — not the maker)

```markdown
---
name: verifier
description: Independently decides whether the goal is met. Never edits code. Use to grade completion.
model: haiku
tools: Bash, Read
---
Run: `npx vitest run tests/inventory-sync` and `npm run lint`.
Respond with exactly `DONE` if BOTH pass, otherwise `NOT DONE:` followed by the failing
items. You do not fix anything — you only grade.
```

### `.claude/hooks/goal-gate.sh`  (Stop-hook continuation — keeps the loop going)

```bash
#!/usr/bin/env bash
# When the maker tries to stop, run the objective checks. If unmet, block the stop (exit 2)
# and re-inject the goal so the agent continues in a fresh turn.
set -uo pipefail
if npx vitest run tests/inventory-sync >/dev/null 2>&1 && npm run lint >/dev/null 2>&1; then
  exit 0                                   # goal met -> allow stop
fi
echo "GOAL NOT MET. Read progress.md and fix the next failing item. Do not stop yet." >&2
exit 2                                     # block stop -> continue
```

Register it:

```json
{ "hooks": {
    "Stop": [ { "hooks": [ { "type": "command", "command": ".claude/hooks/goal-gate.sh" } ] } ]
} }
```

### `run-until-goal.sh`  (alternative/explicit driver — fresh context each pass)

```bash
#!/usr/bin/env bash
# The Ralph loop: each iteration is a FRESH Claude context that reads progress.md from disk.
set -euo pipefail
for i in $(seq 1 12); do
  echo "── iteration $i ──"
  cat PROMPT.md | claude -p --model sonnet --allowedTools "Read,Write,Edit,Bash"
  # separate verifier decides done
  if claude -p "Use the verifier subagent." --model haiku | grep -q '^DONE'; then
    echo "Goal met at iteration $i"; break
  fi
done
```

### Step by step

1. Write `PROMPT.md` (the goal) and create `progress.md` empty. Add the verifier subagent.
2. **Pick a continuation mechanism:** either the `Stop` hook (in-session, keeps one Claude
   session iterating) *or* `run-until-goal.sh` (fresh context per pass — survives context
   limits, closest to Ralph). Both keep the *maker* and *checker* separate.
3. Run it and walk away. Each pass fixes one item, updates `progress.md`, and the **separate
   verifier** — not the maker — decides when to stop.
4. **Cost** scales with iterations-to-convergence; the verifier is cheap (Haiku + local
   tests), the maker carries the cost. Matches sandbox (~$0.056 over 4 iterations).

**Why a loop, not just a harness:** Example 2 also iterated, but *you* started and watched it.
Here the loop owns the "am I done?" decision autonomously via a separate verifier, and (with
the while-loop) each pass runs in a fresh context so it survives context limits.

---

## Example 6 (Loop · Complex) — The self-running overnight loop

**Goal:** overnight, discover issues across the catalog *and* checkout services, fix
auto-fixable ones in isolated worktrees via maker+checker subagents, open PRs, and escalate
risky items to a human inbox. Sandbox:
[`examples/06-loop-overnight/`](../examples/06-loop-overnight/).

**All six loop pieces**: scheduler + worktrees + skill + sub-agents + connectors + memory.
This is the clearest picture of the two layers stacking — **a harness per fix, a loop across
fixes.**

### File tree

```
storefront-platform/
├── state.md                          # spine: what was found / fixed / escalated
├── triage-inbox.md                   # items needing human judgment
├── .mcp.json                         # GitHub/Linear/Slack connectors
├── .claude/
│   ├── settings.json
│   ├── skills/
│   │   └── overnight-triage/SKILL.md
│   └── agents/
│       ├── maker.md                  # drafts a fix in an isolated worktree
│       └── checker.md                # reviews against skills + tests
├── overnight.sh                      # the driver (worktrees + subagents + connectors)
└── .github/workflows/overnight.yml   # the cadence
```

### `.claude/agents/maker.md`  (isolated per finding via worktree)

```markdown
---
name: maker
description: Drafts a fix for a single triaged finding inside an isolated git worktree.
model: sonnet
tools: Read, Write, Edit, Bash, Grep, Glob
---
You fix exactly ONE finding, in the worktree you're launched in. Money is integer cents.
Add/adjust tests. Do not touch security-sensitive areas (auth, PCI, payments) — if the fix
requires that, STOP and report "ESCALATE" with the reason.
```

### `.claude/agents/checker.md`  (the skeptical reviewer)

```markdown
---
name: checker
description: Reviews a maker's draft fix against project skills and tests. Approves or rejects.
model: haiku
tools: Read, Bash, Grep
---
Run the relevant test subset. Verify the fix matches conventions in CLAUDE.md and the skills.
Respond `APPROVED` only if tests pass and the change is in scope; otherwise `REJECTED:` with
specific reasons. Reject anything touching auth/PCI/payments — those go to the human inbox.
```

### `.claude/skills/overnight-triage/SKILL.md`

```markdown
---
name: overnight-triage
description: Discover overnight issues across services and classify each as auto-fixable or escalate. Use for the nightly loop.
---
# Overnight triage
Scan CI failures, error logs, and open bug tickets across the catalog and checkout services.
For each finding write to state.md: `<id> [service] <desc>` and classify:
- auto-fixable (bounded code/test fix), or
- escalate (security/PCI/payments, schema migrations, or ambiguous scope).
```

### `.mcp.json`  (connectors so the loop touches real tools)

```json
{ "mcpServers": {
    "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"],
                "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" } }
} }
```

### `overnight.sh`  (worktrees + subagents + connectors + memory)

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1) discover work (skill) -> writes findings to state.md
claude -p "Run the \$overnight-triage skill. Write findings to state.md." --model haiku

# 2) for each auto-fixable finding, isolate in a worktree and run maker -> checker
while read -r id service desc; do
  wt="../wt-$service-$id"
  git worktree add "$wt" -b "fix/$id"                 # parallel isolation, no collisions
  (
    cd "$wt"
    claude -p "Use the maker subagent to fix $id: $desc" --model sonnet \
      --allowedTools "Read,Write,Edit,Bash"
    if claude -p "Use the checker subagent on $id." --model haiku | grep -q '^APPROVED'; then
      gh pr create --fill --head "fix/$id"             # connector: open PR
      echo "  - $id: PR OPENED" >> ../state.md
    else
      echo "- $id: needs human judgment" >> ../triage-inbox.md
      echo "  - $id: ESCALATED" >> ../state.md
    fi
  )
  git worktree remove "$wt" --force                    # self-cleaning
done < <(grep '^AUTO ' state.md | awk '{print $2, $3, substr($0, index($0,$4))}')
```

### `.github/workflows/overnight.yml`

```yaml
name: overnight-loop
on:
  schedule: [{ cron: "30 0 * * *" }]     # 00:30 UTC nightly
jobs:
  loop:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g @anthropic-ai/claude-code
      - env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bash overnight.sh
```

### Step by step

1. Define `maker`/`checker` subagents, the `overnight-triage` skill, the GitHub connector,
   and the driver + workflow.
2. Nightly, the workflow runs `overnight.sh`: the skill discovers findings → each auto-fixable
   one gets an **isolated worktree** → **maker** drafts → **checker** reviews → **connector**
   opens a PR → **state.md** records outcomes; risky items land in **triage-inbox.md** for you.
3. **Cost = findings × (maker + checker) × cadence.** Cadence and parallelism are the two
   dials you watch. Matches sandbox (~$0.22 for one night with two fixes).

**Why a loop on top of a harness:** each fix is a harness problem (maker/checker, verification);
the loop adds discovery, scheduling, parallel isolation, connectors, and unattended operation
across many fixes. **Stay the engineer:** the loop escalates the PCI change to a human inbox
rather than "fixing" a security-sensitive area unattended.

---

## Where to go next

- Concepts and the WHY behind each piece: [Part 1 — Harness Engineering](01-harness-engineering.md)
  and [Part 2 — Modern AI Loops](02-loop-engineering.md).
- When to use which, and what it costs: [Part 3 — Decision Matrix & Economics](03-decision-matrix-and-economics.md).
- The mocked, runnable versions of all six: [`examples/`](../examples/) (`npm run ex01 … ex06`).

> Honesty note: `/loop` and `/goal` are described in Osmani's loop-engineering writeup as
> Claude Code in-session primitives; the hook-continuation, headless `while`-loop, cron, and
> GitHub Actions mechanisms shown here are the concrete, available-today ways to implement the
> same behavior. Always run autonomous loops in a sandboxed environment with scoped credentials.
