# Part 1 — Harness Engineering

*Includes context & memory management. Retail domain. TypeScript/Node examples.*

---

## 1.1 WHAT is a harness?

Start with the equation everyone in the field has converged on:

```
coding agent = AI model(s) + harness
```

A raw model takes in text (and images, audio) and outputs text. That's it. Out of the
box it **cannot**:

- keep durable state between interactions,
- execute code,
- access real-time knowledge (a new library version, today's order data),
- set up an environment or install packages.

Every one of those is a *harness* feature. The harness is the code, configuration, and
execution logic wrapped around the model that turns it from a text predictor into
something that finishes real work. Viv Trivedy's one-liner is the cleanest definition:
*"If you're not the model, you're the harness"*
([Trivedy](https://vtrivedy.com/posts/the-anatomy-of-an-agent-harness/)).

Concretely, Addy Osmani lists the harness as six components — this is the exact set we'll
work through ([Osmani](https://addyosmani.com/blog/agent-harness-engineering/)):

| # | Component | The behavior it delivers (that the model can't do alone) |
|---|-----------|----------------------------------------------------------|
| a | System prompts, `CLAUDE.md`, `AGENTS.md`, skill files, subagent prompts | Inject durable priors and project knowledge every turn |
| b | Tools, skills, MCP servers, and their descriptions | Extend the action space beyond generating text |
| c | Bundled infrastructure (filesystem, sandbox, browser) | Durable state, safe execution, self-verification |
| d | Orchestration logic (subagent spawning, handoffs, model routing) | Coherence across many context windows; cost control |
| e | Hooks and middleware (compaction, continuation, lint checks) | Deterministic enforcement the model can't be trusted to remember |
| f | Observability (logs, traces, cost and latency metering) | See what the agent did; find and fix failure modes |

### The "working backwards" method

The most useful way to think about harness design (from Trivedy) is: **start with a
behavior you want, then derive the harness piece that delivers it.** If you can't name the
behavior a component exists to deliver, it probably shouldn't be there.

```
Behavior we want (or want to fix)  →  Harness design that delivers it
--------------------------------------------------------------------
Work with real data, durably       →  Filesystem + Git
Write and execute code             →  Bash + code execution
Execute safely, at scale           →  Sandboxes with good default tooling
Remember & learn new knowledge     →  Memory files (CLAUDE.md), web search, MCP
Stay sharp over long context       →  Compaction, tool-output offloading, skills
Finish long-horizon work           →  Loops, planning, verification (see Part 2)
```

### Where harness ends and loop begins

Keep the two-layer model straight, because it's the backbone of this whole document:

- A **harness** is the environment a *single* agent run lives inside.
- A **loop** (Part 2) sits one floor above: it runs the harness on a timer, spawns
  helpers, and feeds itself ([Osmani, Loop Engineering](https://addyosmani.com/blog/loop-engineering/)).

Harness engineering makes one run *reliable*. Loop engineering makes many runs
*autonomous*.

---

## 1.2 WHY do we use harness engineering?

This section makes the case directly: **a smart model on its own is not enough to ship
production retail software, and no near-term model will change that.** Not because models
are weak — they're extraordinary — but because the problems a harness solves are *not
intelligence problems*. Understanding that distinction is what lets you decide, correctly,
when harness work is worth doing.

> **A note on balance before we start.** This section argues hard *for* harness
> engineering, but it is **not** an argument against loops. Harness and loop engineering
> are two *layers* of the same stack, not two options you pick between. A harness makes one
> run reliable; a loop makes many runs autonomous. You will almost always want a solid
> harness first, and *sometimes* wrap it in a loop. Part 2 makes the equal-and-opposite
> case for loops, and Part 3 gives you a framework for choosing. The goal of this whole
> document is *clarity about when to use what* — not a winner.

### The mental model: intelligence vs. everything else

A frontier model, out of the box, does exactly one thing: it takes in text and produces
text. That is the *intelligence*. But shipping a corrected discount rule to your checkout
service requires a long list of things that are **not** acts of intelligence:

- reading the *right* files out of a 4,000-file monorepo,
- running the pricing tests and *observing* whether they pass,
- remembering that money is integer cents *in this codebase*,
- not running `DROP TABLE orders` while "cleaning up,"
- persisting progress when the task outlives a single context window,
- knowing about the promotions library version released last month, after training cut off.

No amount of raw IQ supplies these. They are supplied by the **harness**. This is why
"just use a smarter model" is a category error: you're asking a better *thinker* to solve
problems that are actually about *state, tools, safety, and memory*.

### The seven concrete problems harness engineering solves

Every harness component exists to solve a specific, recurring failure. Here they are, each
mapped to the retail reality and the component that fixes it. If you recognize these pains,
you need a harness — regardless of which model you're on.

1. **Amnesia between sessions.** The model starts every session cold and will confidently
   guess at anything you didn't tell it. It re-derives your conventions from scratch, and
   guesses wrong. *Solved by:* memory files (`CLAUDE.md`), skills, the LLM-wiki/OKF pattern
   (§1.4). The knowledge lives in the repo, not in the head of whoever prompted last.

2. **No way to verify its own work.** Without the ability to run your tests, the model
   *cannot know* if its pricing fix is correct — and it will report success anyway, because
   models skew positive about their own output. *Solved by:* sandboxed execution + hooks
   that run tests and feed failures back (§1.3e). This is the single highest-leverage thing
   you can add.

3. **Context rot on anything non-trivial.** As the window fills with file reads and tool
   output, the model gets *measurably worse* at reasoning (§1.4). A real returns-feature
   build overflows the window and the model loses the plot. *Solved by:* compaction, tool-
   output offloading, sub-agent context firewalls, structured note-taking.

4. **Dangerous actions.** An agent with shell access can delete a database or force-push to
   `main` while "helping." *Solved by:* hooks that block destructive commands and require
   approval for high-blast-radius operations, run inside a sandbox (§1.3c, §1.3e).

5. **Stale knowledge.** The model's training has a cutoff. It doesn't know your promotions
   library's new API, or today's inventory. *Solved by:* web search and MCP tools that pull
   current knowledge into context (§1.3b).

6. **Losing coherence on long-horizon work.** Multi-file features exceed one context window;
   models exhibit early stopping and poor decomposition. *Solved by:* orchestration —
   planner/generator/evaluator, file-based handoffs, model routing (§1.3d).

7. **No visibility into what went wrong.** When an agent fails, you can't improve anything
   if you can't see which tool it called, which file it misread, or where its judgment
   diverged from yours. *Solved by:* observability — traces and per-phase cost/latency
   metering (§1.3f).

Notice that **none of these are fixed by a smarter model.** A smarter model reads files
better, but it still can't read a file that was never put in its context. It reasons
better, but it still can't run your test suite without a sandbox. It's more careful, but
"more careful" is not the same as "structurally prevented from dropping a table."

### The proof: same model, different harness, wildly different results

If the argument above is theoretical, here is the hard evidence. On the Terminal Bench 2.0
benchmark, the *same* Claude model placed around **#33** inside the stock Claude Code
harness but near **#5** when placed in a harness tuned for the task — moved from Top 30 to
Top 5 *by changing only the harness, not the model*
([Trivedy](https://vtrivedy.com/posts/the-anatomy-of-an-agent-harness/),
[HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents)).

Sit with that number. The intelligence was held constant. Everything that changed was the
scaffolding — the tools, the prompt, the back-pressure. The gap between #33 and #5 was
*pure harness*. HumanLayer's field summary from hundreds of agent sessions is the same:
*"it's not a model problem. It's a configuration problem."* And Anthropic frames the
positive version: the space of what a harness can unlock doesn't shrink as models improve
— it *moves* to harder tasks
([Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)).

**The practical implication for a retail org:** before you wait months for the next model
release to fix your agent's behavior, tune the harness you already have. It's faster,
cheaper, and — per the benchmark — often has more headroom than a model upgrade.

### What if we *didn't* use a harness? A concrete retail walk-through

Make it tangible. You ask a bare model (a chat box, no harness) to fix a discount-
calculation bug in checkout. Here is what actually happens, step by step:

- **It can't find the bug.** You paste in the file you *think* is relevant. It's not the
  one with the bug — that's in a helper two directories over you forgot about. The model
  reasons brilliantly about the wrong code.
- **It can't check itself.** It proposes a fix. Is it right? Neither of you knows, because
  there's no way to run the promotions test suite. It says "This should resolve the issue!"
  with total confidence.
- **It introduces a new bug.** Not knowing your convention, it writes `price * 0.85` in
  floating-point dollars. Your system stores integer cents. You've now got a rounding error
  that will surface as off-by-a-penny refunds three weeks from now.
- **It forgets everything tomorrow.** The next engineer asks it a related question and it
  re-makes the same float mistake, because nothing was written down.

Now add a harness: `CLAUDE.md` states the cents convention (no more float bug), a sandbox
lets it run the promotions tests (it *knows* when the fix works), a hook blocks it from
finishing while tests are red (no false "done"), and the conventions persist for the next
engineer. Same model. The difference between "a smart text generator that sometimes helps"
and "a teammate that ships a correct, tested change" is *entirely the harness*.

### When is harness work actually warranted? (so you don't over-build)

Harness engineering has a cost — it's engineering time, and over-built harnesses add token
overhead and maintenance (§1.6). Reach for it when:

- the task **recurs** (you'll pay the setup cost back many times),
- correctness is **verifiable** (tests, types, a running app to click through),
- the work touches **real state or real risk** (money, data, production),
- or the model **keeps making the same mistake** (that's the ratchet signal — §1.3a).

*Don't* over-build for a one-off throwaway exploration — there, plain prompting is fine,
and reaching for a full planner/generator/evaluator rig is waste. Knowing this boundary is
part of using the technology well; Part 3 formalizes it into a decision matrix.

---

## 1.3 HOW to build a harness — the six components in Claude Code

This section walks each component with the design rules that recur across every source,
then Section 1.4 puts them to work in three retail examples.

### (a) System prompts, CLAUDE.md, AGENTS.md, skills, subagent prompts

`CLAUDE.md` / `AGENTS.md` is a markdown file at the repo root that gets injected into the
system prompt **every single turn**. It's the single highest-leverage configuration point
because it's always in context ([Pocock](https://www.aihero.dev/a-complete-guide-to-agents-md)).

Two hard-won rules:

1. **The ratchet** — every line earns its place by tracing to a real failure. You add a
   constraint only *after* you've seen the agent get it wrong; you remove it when a
   capable model makes it redundant ([Osmani](https://addyosmani.com/blog/agent-harness-engineering/)).
2. **The instruction budget** — frontier thinking models reliably follow only ~150–200
   instructions. Every token in `CLAUDE.md` competes for attention on every request, so
   keep it small (HumanLayer keep theirs under ~60 lines) and push everything else into
   *progressively disclosed* files and skills
   ([Pocock](https://www.aihero.dev/a-complete-guide-to-agents-md), [HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents)).

A cautionary data point: an ETH Zurich study of 138 agentfiles found that
*LLM-generated* `CLAUDE.md` files actually *hurt* performance while costing 20%+ more
tokens; human-written ones helped only ~4%. Do not auto-generate this file — craft it by
hand (cited via HumanLayer).

**Skills** (`SKILL.md`) are folders of instructions and optional scripts that the harness
loads *only when the task matches* — progressive disclosure so you don't blow the
instruction budget up front.

### (b) Tools, skills, MCP servers

Tools extend the action space. The dominant strategy today is to give the agent **bash +
code execution** as a general-purpose tool rather than pre-building a tool for every
action — "the difference between teaching someone to use one kitchen gadget and handing
them a kitchen" ([Osmani](https://addyosmani.com/blog/agent-harness-engineering/),
[Willison](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/)).

Rules that matter:

- **Ten focused tools beat fifty overlapping ones.** Every tool's name/description/schema
  is stamped into the prompt every request. Too many tools fills context with menus and
  pushes the model into "the dumb zone" ([HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents),
  [Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)).
- **Prefer a CLI the model already knows** over a bespoke MCP server. The model has seen
  `git`, `docker`, `psql` a million times; a custom MCP for the same job just costs tokens.
- **MCP is a trust boundary.** Tool descriptions are injected text the model will obey —
  a malicious or sloppy MCP server can prompt-inject your agent before you type anything.
  Never connect one you don't trust ([HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents)).

### (c) Bundled infrastructure — filesystem, sandbox, browser

- **Filesystem + Git** is the most foundational primitive: a workspace to read/write, a
  place to offload work that doesn't fit in context, and a shared surface for multiple
  agents. Git adds versioning, rollback, and branching for free
  ([Trivedy](https://vtrivedy.com/posts/the-anatomy-of-an-agent-harness/)).
- **Sandbox**: agent-generated code has to run *somewhere safe*. A sandbox gives isolated
  execution, allow-listed commands, network isolation, and scales to many parallel agents.
  Simon Willison's "YOLO mode" warning applies: an agent with shell access can do anything
  you can, so run it in a container or someone else's machine, and lock down network egress
  to prevent exfiltration ([Willison](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/)).
- **Browser** (e.g., Playwright): lets the agent *observe its own work* — click through a
  running storefront, screenshot it, verify a checkout actually completes. This closes the
  self-verification loop.

### (d) Orchestration — subagents, handoffs, model routing

Sub-agents are the highest-leverage structural lever, for two reasons:

1. **Context firewall.** A sub-agent does a big, messy task (grep 40 files, read logs) in
   its *own* context window and returns only a distilled 1–2k-token answer. None of the
   intermediate noise pollutes the parent's context. This is how you keep a long task
   coherent across many context windows ([HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents),
   [Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)).
2. **Cost control via model routing.** Run the expensive model (Opus) as the orchestrating
   parent and cheaper models (Sonnet/Haiku) for the sub-agents. No need to burn Opus tokens
   on a codebase grep.

The other orchestration pattern is the **maker/checker split**: one agent writes, a
*different* one verifies. Agents are far too generous grading their own work; a separate,
skeptical evaluator catches what the maker talked itself into
([Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)).

### (e) Hooks and middleware — deterministic enforcement

A hook is a script that runs at a fixed lifecycle point (before a tool call, after a file
edit, on stop). Hooks are the difference between *"I told the agent to do X"* and *"the
system enforces X."* Good uses:

- Run typecheck/lint/tests after edits and surface failures.
- Block destructive commands (`rm -rf`, `git push --force`, `DROP TABLE`).
- Require approval before opening a PR or pushing to `main`.
- Auto-format on write so the agent doesn't waste tokens on whitespace.

The governing principle: **success is silent, failures are verbose.** If typecheck passes,
the agent hears nothing. If it fails, the error text is injected back into the loop and the
agent self-corrects. That makes the feedback loop nearly free in the common case
([HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents)).

### (f) Observability — logs, traces, cost and latency metering

You can't tune what you can't see. Traces of what the agent did (which tools, which files,
which errors), plus per-phase cost and latency metering, are what let you find failure
modes and feed them back into the ratchet. Anthropic's own harness work is essentially a
loop of *read the traces → find where judgment diverged from mine → update the prompt*
([Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)).
Our examples all emit a small **cost ledger** to make this concrete.

---

## 1.4 Context & memory management (the enabling pillar)

Harness engineering is really a *subset of context engineering* — the discipline of
curating what tokens the model sees ([HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents),
building on Dex Horthy's 12-factor agents). Anthropic frames the whole goal in one line:
find *"the smallest set of high-signal tokens that maximize the likelihood of the desired
outcome"* ([Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)).

### Why context is scarce: context rot

Context is not free real estate. Models have a finite **attention budget**, and as the
context window fills, their ability to recall and reason *degrades* — a phenomenon called
**context rot**, backed by Chroma's empirical needle-in-a-haystack research. The cause is
architectural: transformers compute attention across every pair of tokens (n² relationships
for n tokens), so more tokens stretch attention thinner. A bigger context window doesn't
make the model smarter — it just makes the haystack bigger
([Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents),
[HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents)).

This is *why* the instruction budget, focused tool sets, and sub-agent firewalls all
matter: they're all forms of protecting a scarce resource.

### The four techniques for staying sharp over long work

1. **Compaction** — when the window nears full, summarize the conversation and continue
   with the summary plus the few most-recent files. Same agent, shortened history. The art
   is choosing what to keep (architectural decisions, unresolved bugs) vs discard (redundant
   tool outputs).
2. **Context reset** — tear the session down entirely and rebuild from a *structured
   handoff file*. A clean slate, at the cost of the handoff carrying enough state. Anthropic
   found this necessary because compaction alone left "context anxiety" (models wrapping up
   prematurely as they sense a limit approaching) on some model versions
   ([Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)).
3. **Structured note-taking (agentic memory)** — the agent writes progress to a `NOTES.md`
   / to-do file *outside* the context window and reads it back later. Simple, and it's how
   long-running agents survive across sessions.
4. **Sub-agent isolation** — covered above: each child gets a fresh instruction budget.

### Memory strategies: how to give the agent durable knowledge

The model's weights are frozen; the only way to "add knowledge" is context injection. Four
patterns, and the retail decision of when to use each:

| Strategy | How it works | Retail use case | When it wins |
|----------|--------------|-----------------|--------------|
| **Karpathy LLM Wiki** | Compile knowledge to markdown at *write time*; load into context; no lookup step. The agent maintains it (adds/merges/prunes) → a compounding knowledge loop. | Your pricing rules, money-handling conventions, checkout invariants, "why we don't do X because of that Black Friday incident." | Stable, bounded knowledge that must be understood holistically. |
| **OKF (Open Knowledge Format)** | Google's open spec that *formalizes* the LLM-wiki pattern: a directory of markdown + YAML frontmatter (`type`, `title`, `description`, `resource`, `tags`, `timestamp`), with `index.md` and `log.md` conventions. Portable, vendor-neutral. | A shared, portable catalog of your table schemas, metrics ("what 'weekly active buyers' means"), and runbooks that many agents/teams consume. | You need the wiki to be *interoperable* across teams and tools. |
| **RAG / vector DB** | Embed documents; retrieve semantically similar chunks at *runtime*. | Searching thousands of support articles or product descriptions that change weekly. | Large, growing corpus too big for context. |
| **Structured DB / SQL** | Query records at runtime for exact answers. | "All orders over $500 placed this week"; live inventory counts. | Exact lookups, filters, user-specific/multi-tenant data, fast-changing facts. |

Karpathy's insight, via the *compiler analogy*: the wiki is *compiled* knowledge, ready to
execute; a database is *source code* re-interpreted on every run. "LLMs don't get bored,
don't forget to update a cross-reference, and can touch 15 files in one pass" — the
bookkeeping that makes humans abandon personal wikis is exactly what LLMs are good at
([Karpathy via Google OKF](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing),
[MindStudio](https://www.mindstudio.ai/blog/karpathy-wiki-vs-structured-database-ai-memory)).

**Most production retail systems use a hybrid**: an LLM-wiki/OKF layer for *how to think*
(conventions, domain rules) loaded every session, plus a structured DB for *facts to act
on* (orders, inventory) queried just-in-time. See the full sub-matrix in Part 3.

---

## 1.5 Three retail worked examples

Each example uses the same template:
**(a) the problem in plain English → (b) why plain prompting fails → (c) the harness
solution → (d) runnable TypeScript code (mock LLM, own sandbox) → (e) token & cost →
(f) why harness engineering was the right choice.**

> All examples live in [`examples/`](../examples/) and run with mocked model calls, so they
> are deterministic and free to run. Each prints a cost ledger computed from the verified
> July 2026 Claude rate card (Opus $5/$25, Sonnet $3/$15, Haiku $1/$5 per 1M input/output
> tokens). Token counts are realistic estimates for the described work; see Part 3 for the
> methodology.

### Example 1 (Simple) — "The agent keeps forgetting our money conventions"

**(a) The problem.** Your team owns a checkout service. Every retail engineer knows two
iron rules: money is stored as **integer cents** (never floats), and all logging goes
through the shared `logger`, never `console.log`. A coding agent doesn't know this. Left to
its own devices it writes `price * 1.2` in dollars and sprinkles `console.log`, introducing
rounding bugs and breaking log aggregation.

**(b) Why plain prompting fails.** You *could* re-explain the rules in every prompt, but
you'll forget, and a teammate won't know to. The knowledge lives in your head, not in the
repo. Every session starts cold.

**(c) The harness solution.** Two of the cheapest harness components:
- A minimal `CLAUDE.md` (under ~60 lines, ratcheted from real incidents) that states the
  two conventions. It's injected every turn.
- A **format/lint hook** that runs after each edit: it fails loudly if it sees a float
  money literal or a `console.log`, and re-injects the error so the agent fixes it.

**(d) Code.** See [`examples/01-simple-conventions/`](../examples/01-simple-conventions/).
It contains a real `CLAUDE.md`, a lint hook (`check.ts`) that scans a diff for the two
violations, and a mock agent runner showing the "success is silent, failure is verbose"
cycle.

**(e) Token & cost.** The `CLAUDE.md` is ~250 tokens injected per turn. Over a 6-turn fix
that's ~1,500 extra input tokens ≈ **$0.0075 on Sonnet**. The hook runs locally and costs
**zero tokens on success**. Contrast: without conventions, the agent ships a rounding bug
that a human spends 30 minutes catching in review — the harness cost is a rounding error
against an engineer's time.

**(f) Why harness, not a loop?** This is a *single run* reliability problem. There's no
schedule, no autonomous iteration — just "make this one run get the conventions right." A
loop would be over-engineering. This is the textbook case for the two cheapest harness
levers: a memory file and a hook.

### Example 2 (Medium) — "The agent 'finishes' broken pricing code"

**(a) The problem.** You ask the agent to add a "buy 3, get 15% off" promotion to the
pricing engine. It confidently reports "Done!" — but the promotion test suite is red, and
one edge case (the discount stacking with an existing coupon) is wrong.

**(b) Why plain prompting fails.** Models skew positive about their own work. Asking "are
you sure it's correct?" just gets you a more confident "yes." Self-evaluation is unreliable
([Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)).

**(c) The harness solution.** **Back-pressure** via a `Stop` hook plus a scoped tool set:
- On every attempt to finish, a hook runs `tsc --noEmit` and the *pricing test subset*
  (not the whole suite — that would flood context).
- Success → silent, the agent is allowed to stop. Failure → the failing test names and
  error text are injected, exit code signals "keep working." The agent can't declare done
  while the pricing math is wrong.

**(d) Code.** See [`examples/02-medium-backpressure/`](../examples/02-medium-backpressure/).
A tiny pricing module with a deliberately failing promotion test, a `stop-hook.ts` that
runs the typecheck + test subset and gates completion, and a mock agent loop that iterates
until green.

**(e) Token & cost.** Each verification cycle re-injects ~400 tokens of error text on
failure. A 3-iteration fix costs ~1,200 extra input tokens ≈ **$0.0036 on Sonnet** — plus
the generation tokens for the fixes. The verifier itself is *local* (tests run on your
machine), so it costs no model tokens. This is the "verification is cheap" principle in
miniature.

**(f) Why harness, not a loop?** Still a single task, but now with *iteration until
correct*. The harness supplies the correctness signal (the hook) that turns one shot into a
reliable self-correcting run. It becomes a loop only when you want this to happen *on a
schedule* or *unattended* — which is exactly Example 2's counterpart in Part 2.

### Example 3 (Complex) — "Build the product-returns (RMA) feature unattended"

**(a) The problem.** A one-line ask: *"Add a product returns / RMA flow to the order-
management service: customers request a return, we approve/deny, and issue a refund."*
You want a working, tested slice without babysitting it.

**(b) Why plain prompting fails.** This spans many files and many context windows. A single
agent loses coherence, under-scopes ("I added a `/returns` endpoint, done!"), and grades
its own broken work as complete.

**(c) The harness solution.** The **planner → generator → evaluator** architecture from
Anthropic's long-running harness work, with:
- **Planner** (Opus): expands the one-liner into a spec (request return, state machine
  pending→approved/denied, refund to original payment, restock inventory, audit log).
- **Sprint contract**: generator and evaluator agree on what "done" means *before* code is
  written, so scope doesn't drift.
- **Generator** (Sonnet): implements one feature at a time, using filesystem + git.
- **Evaluator** (cheaper model): a *skeptical* checker that exercises the running feature
  (via a browser/API tool) and files specific bugs against the contract.
- **File-based handoff** between agents; **compaction** as context grows.
- **Model routing** to control cost (expensive orchestration, cheap verification).

**(d) Code.** See [`examples/03-complex-planner-generator-evaluator/`](../examples/03-complex-planner-generator-evaluator/).
A fully mocked three-agent orchestration with recorded transcripts, a file-based handoff
directory, a sprint-contract negotiation, and a cost ledger that breaks spend down by
agent/phase — mirroring the shape of Anthropic's published run.

**(e) Token & cost.** Modeled on Anthropic's real DAW run
([$124.70 total](https://www.anthropic.com/engineering/harness-design-long-running-apps)):
the *generator* dominates (~90% of spend), the *planner* is a fraction of a dollar, and
each *QA/evaluator* pass is a few dollars. Our sandbox prints an analogous ledger scaled to
the RMA feature. The headline: paying ~20x a naive solo run buys you a feature that
*actually works* instead of one whose core flow is broken — the retro-game-maker lesson
($9 broken vs $200 working).

**(f) Why harness, not just a bigger prompt?** No prompt makes a single context window hold
a multi-file feature coherently and verify itself honestly. The *architecture* — separate
planner/generator/evaluator, file handoff, sprint contract, back-pressure — is the harness.
This is the ceiling of what harness engineering delivers for one build. When you want this
to run *every night across many services in parallel*, you wrap it in a loop (Part 2,
Example 3).

---

## 1.6 Harnesses move, they don't shrink

A natural objection: "won't better models make all this scaffolding obsolete?" Partly.
When Opus 4.6 gained the ability to sustain long tasks, Anthropic *deleted* the
context-reset scaffolding they'd built for 4.5 — it had become load-bearing for nothing
([Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)).

But the ceiling moves *with* the model. Tasks that were unreachable come into play, and
they bring new failure modes needing new scaffolding. As Anthropic put it: *"every
component in a harness encodes an assumption about what the model can't do on its own."*
When the model gets better at something, remove that component; when it unlocks something
new, add scaffolding to reach the new ceiling. Harness engineering is therefore a *living
discipline*, not a one-time setup — which is exactly why the **ratchet** (add on real
failure, remove on real redundancy) is the core habit.

**Next:** [Part 2 — Modern AI Loops](02-loop-engineering.md).
