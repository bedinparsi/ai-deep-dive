# Part 2 — Modern AI Loops

*Retail domain. TypeScript/Node examples. Anchor: Claude Code / Codex parity.*

---

> ## Same three questions
> - **WHAT** a loop is → §2.1 — the five pieces + memory, and how a loop sits *on top of* a harness.
> - **WHY** you'd use one (and when not to) → §2.2 — the bottleneck problem, the balance, and
>   the three problems loops make sharper.
> - **HOW** to build one → §2.3 conceptually, and the
>   **[Implementation Playbook](05-implementation-playbook.md)** (Examples 4–6) for the
>   file-by-file build — schedulers, worktrees, subagents, and real loop drivers.

---

## 2.1 WHAT is an AI loop?

For about two years, the way you got work out of a coding model was: write a prompt, read
the reply, write the next prompt. You held the tool the entire time, one turn after another.
Loop engineering replaces *you as the prompter*. You design a small system that finds the
work, hands it out, checks it, records what's done, and decides the next thing — and you
let *that system* poke the agent instead of you
([Osmani, Loop Engineering](https://addyosmani.com/blog/loop-engineering/)).

Two practitioners crystallized it:

- Peter Steinberger: *"You shouldn't be prompting coding agents anymore. You should be
  designing loops that prompt your agents."*
- Boris Cherny (head of Claude Code, Anthropic): *"I don't prompt Claude anymore. I have
  loops running that prompt Claude and figuring out what to do. My job is to write loops."*

### The relationship to the harness (read this carefully)

A loop **sits one floor above the harness**. The harness is the environment a single agent
runs inside; the loop runs that harness on a timer, spawns helpers, and feeds itself. You do
not choose "harness *or* loop" — a loop is *built on top of* a harness. A loop with a weak
harness just automates unreliable runs faster. **Get the harness right first, then decide
whether the work deserves a loop.** Part 3 turns that decision into a matrix.

### The five pieces (plus memory)

Osmani identifies five components that make a loop, plus one place to remember things. This
is the exact list we'll cover, and — importantly — the same capabilities exist in both
Claude Code and the Codex app under different names, so the pattern is tool-independent:

| # | Piece | Its job | Claude Code anchor |
|---|-------|---------|--------------------|
| 1 | **Automations / scheduler** | Discovery + triage on a cadence — the heartbeat | `/loop`, cron tasks, hooks, GitHub Actions |
| 2 | **Worktrees** | Isolate parallel agents so they don't collide | `git worktree`, `--worktree`, `isolation: worktree` |
| 3 | **Skills** | Codify project knowledge once, reused every run | `SKILL.md` |
| 4 | **Plugins / connectors** | Touch the real tools you already use | MCP servers + plugins |
| 5 | **Sub-agents** | Split the maker from the checker | `.claude/agents/*`, agent teams |
| 6 | **Memory / state** | What's done + what's next, outside the conversation | markdown (progress files) or Linear via MCP |

Two in-session primitives are worth knowing precisely:

- **`/loop`** re-runs a prompt or command on a **cadence**.
- **`/goal`** keeps going until a **verifiable condition you wrote** is actually true, and
  after every turn a *separate small model checks whether you're done* — so the agent that
  wrote the code isn't the one grading it. You give it something like "all tests in
  `test/checkout` pass and lint is clean," and walk away.

---

## 2.2 WHY do we use AI loops?

### The problem loops solve: you are the bottleneck

Without a loop, *you* are the scheduler, the dispatcher, and the verifier. Every unit of
work waits for you to type the next prompt. That's fine for one task you're actively
working. It falls apart for the large class of retail work that is **recurring, tedious,
and well-defined**:

- triaging yesterday's failed orders and CI failures every morning,
- summarizing what broke overnight in the checkout pipeline,
- keeping dependencies current across a dozen services,
- hunting for the bug someone introduced last week,
- writing commit briefings.

This is work that *should* happen regularly but often doesn't, because a human has to
remember to start it. A loop surfaces it automatically and acts on it while you're asleep.
Simon Willison's test for when this pays off: any time you catch yourself thinking *"ugh,
I'm going to have to try a lot of variations here"* — a problem with clear success criteria
and tedious trial-and-error — is a strong signal a loop is worth it
([Willison](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/)).

### What if we *didn't* use a loop? (the retail picture)

You *can* solve all of the above by hand-prompting a well-harnessed agent. Many teams
should — see the balance note below. But at scale it means:

- Nobody runs the morning triage on the busy days, which are exactly the days it matters.
- Dependency upgrades slip for months because they're never urgent.
- The engineer becomes a full-time agent operator, typing "now do the next one" all day.

A loop converts "work that needs a human to initiate it" into "work that happens on its own
and only surfaces to a human when it needs judgment."

### The balance: when NOT to reach for a loop

This is the equal-and-opposite of Part 1's argument, and it's just as important. **Loops
are not automatically better than hand-prompting.** Prompting your agents directly is still
effective and often the right call. Reach for a loop only when:

- the work **recurs on a cadence** (otherwise there's nothing to schedule),
- there's a **verifiable stopping condition** (otherwise the loop can't know it's done),
- and you have **a verifier you actually trust** (otherwise you've automated mistakes).

If a task is a one-off, or "done" is a matter of taste with no check, or you can't trust an
automated verifier, then a loop *adds* risk and token cost without adding value. Osmani is
blunt about this: *"go ahead and set up your loops, but don't forget that prompting your
agents directly is also effective. It's all about finding the right balance."*

### The three problems loops make *sharper*, not easier

Loop engineering is powerful precisely because it removes you from the moment-to-moment.
That same property is its danger. Three problems get *worse* as the loop gets better
([Osmani](https://addyosmani.com/blog/loop-engineering/)):

1. **Verification is still on you.** A loop running unattended is a loop making mistakes
   unattended. Splitting a verifier sub-agent from the maker is what makes the loop's
   "it's done" mean something — and even then "done" is a claim, not a proof.
2. **Comprehension debt.** The faster the loop ships code you didn't write, the bigger the
   gap between what exists and what you understand. A smooth loop grows that gap faster.
3. **Cognitive surrender.** When the loop runs itself, it's tempting to stop having an
   opinion and take whatever it returns. Osmani's sharpest line: two people can build the
   *exact same loop* and get opposite results — one moves faster on work they understand
   deeply, the other uses it to avoid understanding the work at all. The loop can't tell
   the difference. You can.

That is why the closing principle of this whole document is *build the loop, but stay the
engineer.*

---

## 2.3 HOW to build a loop — the six pieces in Claude Code

### (1) Automations / scheduler — the heartbeat

Automations are what make a loop an actual loop and not a thing you ran once. You define an
autonomous task, give it a cadence, and let findings come to you. In Claude Code this is
`/loop` (re-run on interval), cron tasks, lifecycle hooks, or GitHub Actions for work that
keeps running after you close the laptop. An automation should call a **skill** rather than
paste a wall of instructions into a schedule nobody will maintain.

### (2) Worktrees — parallel without chaos

The moment you run more than one agent, files collide — the same headache as two engineers
committing to the same lines without talking. A **git worktree** is a separate working
directory on its own branch sharing the same repo history, so one agent's edits literally
can't touch another's checkout. Claude Code gives you `git worktree`, a `--worktree` flag,
and an `isolation: worktree` setting on a sub-agent so each helper gets a fresh checkout
that cleans itself up. Caveat (Osmani's "orchestration tax"): worktrees remove the
*mechanical* collision, but *you* are still the ceiling — your review bandwidth decides how
many agents you can actually run, not the tool.

### (3) Skills — stop re-explaining your project

A skill (`SKILL.md`) is your project knowledge written down once, where the agent reads it
every run, instead of re-derived from zero each session. It's the same progressive-disclosure
primitive from Part 1, now serving the loop: the morning automation fires `$triage-skill`
instead of a giant pasted prompt. Skills are where *intent stops costing you over and over*.

### (4) Plugins / connectors — touch real tools

A loop that can only see the filesystem is a tiny loop. Connectors (built on **MCP**) let
the loop read your issue tracker, query a database, hit a staging API, drop a Slack message.
This is the difference between an agent that says *"here's the fix"* and a loop that *opens
the PR, links the ticket, and pings the channel once CI is green* — by itself. Plugins
bundle connectors + skills so a teammate installs your whole setup in one go.

### (5) Sub-agents — keep the maker away from the checker

The most useful structural move in a loop is splitting the agent that writes from the agent
that checks. The maker is too generous grading its own homework; a second agent with
different instructions (and often a different, cheaper model) catches what the first talked
itself into. Inside a loop this matters *more* than in a single run, because the loop acts
while you're not watching — a verifier you trust is the only reason you can walk away. This
is also what `/goal` does under the hood: a fresh model decides if the loop is done.

### (6) Memory / state — the spine of the loop

A markdown file (or a Linear board) that lives *outside* the single conversation and holds
what's done and what's next. It sounds too dumb to matter, but it's the trick every
long-running agent depends on: the model forgets everything between runs, so the memory has
to be on disk, not in context. *The agent forgets; the repo doesn't.* Tomorrow's run reads
the state file and picks up where today's stopped.

---

## 2.4 Three retail worked examples

Same template as Part 1: **(a) problem → (b) why plain prompting/one-shot fails → (c) the
loop solution → (d) runnable TypeScript → (e) token & cost → (f) why a loop (and not just a
harness) was the right choice.** All mocked, deterministic, free to run.

### Example 4 (Simple) — "Run the morning triage on a cadence"

**(a) The problem.** Every morning, someone should review yesterday's failed orders and CI
failures for the storefront and write up what needs attention. Nobody reliably does it.

**(b) Why one-shot fails.** It's not that a single agent *can't* triage — it's that triage
that only happens when a human remembers to start it doesn't happen on the busy days.

**(c) The loop solution.** The two cheapest loop pieces: an **automation** on a cadence that
fires a **triage skill**, writing findings to a **state file** (`state.md`). No sub-agents,
no worktrees yet — just the heartbeat + skill + memory.

**(d) Code.** [`examples/04-loop-simple-scheduler/`](../examples/04-loop-simple-scheduler/):
a fake clock drives three "mornings"; each run reads a mock feed of failed orders / CI logs,
runs the triage skill, and appends findings to `state.md`. You can watch the state file grow
across runs.

**(e) Token & cost.** Each morning run is a single cheap triage pass (Haiku-class). The
cost model shows the real lever: **cost = cadence × per-run cost.** A daily run is trivial;
a per-minute run is not. The scheduler *is* the cost throttle.

**(f) Why a loop, not just a harness?** The value here is *recurrence without a human
initiating it*. A harnessed agent could do one triage perfectly, but the point is that it
happens every morning on its own. That's the defining property of a loop.

### Example 5 (Medium) — "Run until the goal is actually true"

**(a) The problem.** "Make all tests in `inventory-sync` pass and lint clean." This needs
iteration and a trustworthy definition of done.

**(b) Why one-shot fails.** A single pass might fix two of three failures and declare
victory. And a model grading its own work skews positive.

**(c) The loop solution.** A **`/goal`-style loop**: it keeps iterating until a *verifiable*
condition holds, and a **separate verifier** (not the maker) decides "done." A
**continuation hook** (the Ralph-loop pattern) re-injects the goal into a fresh context each
iteration, reading state from the last one — so the loop survives context limits.

**(d) Code.** [`examples/05-loop-run-until-goal/`](../examples/05-loop-run-until-goal/): a
mock repo with three failing inventory tests; each iteration the *maker* fixes one, a
*separate verifier* re-runs the checks and only stops when all pass + lint clean. Shows the
maker/checker split and the fresh-context continuation.

**(e) Token & cost.** Cost scales with the number of iterations to convergence. The verifier
is cheap (local tests + a small model); the maker carries the cost. Fewer, better-targeted
iterations = less spend, which is why a trustworthy stop condition matters economically, not
just for correctness.

**(f) Why a loop, not just a harness?** Example 2 (harness back-pressure) also iterated —
but *you* started it and watched it. Here the loop owns the stopping decision autonomously
via a separate verifier and survives context resets. That autonomy over "when am I done" is
the loop's contribution.

### Example 6 (Complex) — "The self-running overnight loop"

**(a) The problem.** Overnight, autonomously: discover issues across the catalog *and*
checkout services, fix them in isolation, open PRs, and post a summary — surfacing only what
needs human judgment to a triage inbox.

**(b) Why one-shot fails.** This is many tasks, in parallel, across services, over hours —
far beyond one run, and it must not require you to be awake.

**(c) The loop solution.** All six pieces together: an **automation** kicks off overnight →
a **triage skill** finds work and writes it to the **state file** → each finding gets an
isolated **worktree** → a **maker sub-agent** drafts the fix and a **checker sub-agent**
reviews it against skills + tests → **connectors** open the PR and update the ticket →
anything the loop can't handle lands in the triage inbox for you. The state file is the
spine that lets tomorrow continue where tonight stopped.

**(d) Code.** [`examples/06-loop-overnight/`](../examples/06-loop-overnight/): a fully
mocked overnight run that simulates two parallel worktrees (catalog + checkout), maker/checker
sub-agents per finding, a connector that "opens PRs," a triage inbox for the unhandled case,
and a persistent `state.md`. Prints a cost ledger across the whole run.

**(e) Token & cost.** This is where loop economics get real: **cost = findings × (maker +
checker) per finding**, multiplied by cadence over time. The ledger makes the scaling
visible and shows why the cadence and the number of parallel agents are the two dials you
watch. "Be careful about token costs — usage can vary wildly" (Osmani).

**(f) Why a loop, and specifically a loop *on top of* the Example-3 harness?** Each finding's
fix is a harness problem (maker/checker, verification). The *loop* adds discovery, scheduling,
parallel isolation, and unattended operation across many such fixes. This is the clearest
illustration of the two layers stacking: **harness per fix, loop across fixes.**

---

## 2.5 Build the loop. Stay the engineer.

Loops are a preview of how the work evolves, but they don't delete the engineer — they move
the leverage point. The same loop is an accelerant for someone who understands the work and
a trap for someone avoiding it. Verify what it ships, read what it wrote, and keep your
opinion. That's what makes loop design *harder* than prompt engineering, not easier — and
it's why the right answer is almost always a **well-harnessed agent, wrapped in a loop only
where the work truly recurs and can be verified.**

**Next:** [Part 3 — Decision Matrix & Token Economics](03-decision-matrix-and-economics.md).
