# Key Findings (Research Synthesis)

Distilled from the sources in `00-sources.md`. This is the raw material for the
documentation prose. Written plain, for technical-managerial engineers.

## The one equation everything hangs off

`coding agent = AI model(s) + harness` — Viv Trivedy, echoed by Addy Osmani and HumanLayer.

The model is the intelligence. The harness is *everything else you build around it*
so it can finish real work: prompts, tools, context policies, sandboxes, hooks,
sub-agents, feedback loops, recovery paths. A raw model is not an agent; it becomes
one when a harness gives it state, tool execution, feedback loops, and constraints.

**Loop engineering sits one floor above the harness** (Osmani). The harness is the
environment one agent runs inside. A loop is a system that finds work, hands it out,
checks it, records what's done, and decides the next thing — on a timer, feeding
itself, so *the system prompts the agent instead of you*.

This gives us the clean two-layer story the PoV needs:
- **Harness engineering** = make a *single agent run* reliable.
- **Loop engineering** = make *many runs over time* autonomous.

## Why harness engineering (the "what if we didn't" case)

- Without a harness the model can only operate on what fits in its context window.
  No durable state, no code execution, no real-time knowledge, no environment setup.
  You're copy-pasting into a chat box — not a workflow (Trivedy).
- The "skill issue" reframe (HumanLayer): most agent failures are *configuration*
  problems, not model problems. The fix for a bad run is a harness change, not
  "wait for the next model."
- Hard proof: Terminal Bench 2.0 — the *same* model scores far lower in the default
  harness than in a tuned one (Top 30 → Top 5 by changing only the harness). The gap
  between what a model *can* do and what you *see* it do is largely a harness gap (Osmani).

## Why loop engineering (the "what if we didn't" case)

- Without a loop you are the scheduler, the dispatcher, and the verifier. Every unit
  of work needs you to type the next prompt. You are the bottleneck.
- Two years of "write a good prompt, read the reply, type the next thing" is the thing
  loop engineering replaces (Osmani, quoting Steinberger and Cherny).
- Loops surface work you'd never get around to (daily triage, CI failure summaries,
  bug hunts) and act on it while you're not watching.
- BUT loops sharpen three problems, not soften them (Osmani): **verification**
  (unattended mistakes), **comprehension debt** (code you didn't read piling up),
  and **cognitive surrender** (taking whatever it gives). The engineer stays in the loop.

## The six harness components (user's exact list) — what each is FOR

Each component exists to deliver a behavior the model can't do alone (Trivedy's method):

| Component | Behavior it delivers | Anchor in Claude Code |
|---|---|---|
| a. System prompts, CLAUDE.md, AGENTS.md, skills, subagent prompts | Inject durable priors/knowledge every turn | CLAUDE.md, `.claude/agents/*`, `SKILL.md` |
| b. Tools, skills, MCP servers + descriptions | Extend action space beyond text | Bash, built-in tools, MCP connectors |
| c. Bundled infrastructure (filesystem, sandbox, browser) | Durable state, safe execution, self-verification | fs + git, sandbox, Playwright MCP |
| d. Orchestration (subagent spawning, handoffs, model routing) | Coherence across many context windows; cost control | Task subagents, agent teams, Opus↔Haiku routing |
| e. Hooks/middleware (compaction, continuation, lint) | Deterministic enforcement the model can't forget | Claude Code hooks (Stop/PreToolUse/etc.) |
| f. Observability (logs, traces, cost/latency metering) | See what the agent did; find failure modes | SDK traces, per-phase cost logs |

Key design rules that recur across all sources:
- **The ratchet**: add a constraint only after a real failure; remove it when the model
  makes it redundant. Every AGENTS.md line traces to a specific incident (Osmani).
- **Instruction budget**: frontier thinking models follow ~150-200 instructions
  reliably; keep CLAUDE.md < ~60 lines; progressive disclosure for the rest (Pocock, HumanLayer).
- **Success is silent, failures are verbose**: hooks inject only errors back into the
  loop, keeping feedback nearly free (HumanLayer).
- **Ten focused tools beat fifty overlapping ones**: tool descriptions cost prompt
  tokens every request; too many tools pushes you into the "dumb zone" (HumanLayer, Anthropic).
- **Sub-agents = context firewall**: intermediate noise stays in the child; only the
  distilled result (often 1-2k tokens) returns to the parent (HumanLayer, Anthropic).

## The six loop components (user's exact list)

| Piece | Job | Claude Code anchor |
|---|---|---|
| Automations / scheduler | Discovery + triage on a cadence (the heartbeat) | `/loop`, cron, hooks, GitHub Actions |
| Worktrees | Isolate parallel agents so they don't collide | `git worktree`, `--worktree`, `isolation: worktree` |
| Skills | Codify project knowledge once, reused every run | `SKILL.md` |
| Plugins / connectors | Touch real tools (issues, DB, Slack, staging) | MCP servers + plugins |
| Sub-agents | Split the maker from the checker | `.claude/agents/*`, agent teams |
| Memory / state | What's done + what's next, outside the conversation | markdown (AGENTS.md, progress files) or Linear via MCP |

`/loop` = re-run on a cadence. `/goal` = run until a *verifiable* condition holds, with
a *separate* model grading "done" (maker/checker split applied to the stop condition).

## Context & memory management (the third pillar)

Harness engineering is a subset of **context engineering** (HumanLayer/Horthy):
curating the smallest set of high-signal tokens (Anthropic). Techniques:
- **Compaction**: summarize a near-full window and continue (same agent, shortened history).
- **Context reset**: tear down and rebuild from a structured handoff (clean slate;
  needed when compaction alone leaves "context anxiety" — Anthropic).
- **Structured note-taking / agentic memory**: NOTES.md, to-do lists, progress files.
- **Just-in-time retrieval**: keep lightweight identifiers (paths, queries), load on demand.
- **Sub-agent isolation**: each child gets a fresh instruction budget.

**Memory strategies** the PoV should contrast:
- **Karpathy LLM Wiki**: compile knowledge to markdown at *write time*; load directly;
  agent maintains it → compounding loop. Best for stable, bounded knowledge.
- **OKF (Google)**: a portable *spec* for the wiki pattern — markdown + YAML frontmatter,
  index.md/log.md conventions, producer/consumer independence.
- **Structured DB / RAG**: query at *runtime*. Best for large, dynamic, user-specific,
  exact-lookup data.
- **Hybrid**: wiki for how-to-think, DB for facts-to-act-on. Most production systems use both.

## Token economics anchor (measured + rate card)

Rate card (per 1M tokens, verified July 2026): Opus $5/$25, Sonnet $3/$15, Haiku $1/$5.

Measured real runs (Anthropic long-running harness post) — our headline cost/quality lever:
- Retro game maker: **Solo 20 min / $9** vs **Full harness 6 hr / $200** (~20x cost).
  The solo app's core feature was broken; the harness app worked. Cost bought correctness.
- DAW (V2 harness): **3 hr 50 min / $124.70**, per-phase: Planner $0.46; Build R1 $71.08;
  QA R1 $3.24; Build R2 $36.89; QA R2 $3.09; Build R3 $5.88; QA R3 $4.06.
  Insight: the *evaluator (QA) is cheap*; the *builder is where the money goes*.

Design implications for our decision matrix:
- Harness cost is dominated by generation, not verification → verification is a cheap
  insurance policy.
- Sub-agent model routing (Opus parent + Haiku/Sonnet children) is a direct cost lever.
- Loops multiply run count → cost scales with cadence × runs; the scheduler is the
  cost throttle. "Be careful about token costs" (Osmani).
