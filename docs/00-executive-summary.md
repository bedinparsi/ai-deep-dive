# Modern AI Engineering: Harness Engineering & AI Loops
## A Point-of-View for Engineering Leaders

*Domain: Retail / e-commerce. Anchor technology: Claude Code / Anthropic (Claude Agent SDK).
Examples in TypeScript on Node.js.*

---

## The 60-second version

For two years, getting value out of a coding model meant writing a good prompt,
reading the reply, and typing the next one. You were holding the tool the whole time.
That era is ending. Two disciplines have emerged to replace it, and they stack:

**1. Harness engineering — making a *single* agent run reliable.**
There is one equation the whole field agrees on:

```
coding agent = AI model(s) + harness
```

The model is the intelligence. The **harness** is everything you build around it so it
can actually finish work: system prompts and `CLAUDE.md`, tools and MCP servers, a
filesystem and sandbox, orchestration between sub-agents, hooks that enforce rules, and
observability. As Viv Trivedy put it: *if you're not the model, you're the harness.*

**2. Loop engineering — making *many* runs autonomous over time.**
A loop sits one floor above the harness. Instead of you prompting the agent, you build a
small system that finds work, hands it out, checks it, records what's done, and decides
the next thing — on a schedule, feeding itself. In the words of Boris Cherny (head of
Claude Code): *"I don't prompt Claude anymore. I have loops running that prompt Claude...
My job is to write loops."*

## Why this matters to a retail engineering org

Consider a typical retail platform: a catalog service, a pricing/promotions engine, a
checkout flow, inventory sync, and an order-management system. The work is endless and
much of it is *tedious but well-defined*: fixing flaky tests, triaging failed orders,
upgrading dependencies, keeping money math correct to the cent. This is exactly the shape
of work these two disciplines were built for.

- **Harness engineering** is why one agent run reliably ships a correct discount-rule
  change instead of "finishing" broken pricing code.
- **Loop engineering** is why that fix can happen overnight, unattended, as a scheduled
  job that opens the PR and pings the channel when CI is green.

## The single most important data point

The gap between what a model *can* do and what you *see* it do is largely a **harness
gap**, not a model gap. On the Terminal Bench 2.0 benchmark, the *same* Claude model
scored around position #33 inside the default Claude Code harness but near #5 when placed
in a harness tuned for the task — a Top 30 → Top 5 jump *by changing only the harness*
([Trivedy](https://vtrivedy.com/posts/the-anatomy-of-an-agent-harness/),
[HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents)).

HumanLayer's reframe captures the mindset: when an agent fails, *"it's not a model
problem. It's a configuration problem."*

## The single most important cost fact

Reliability is not free, and the cost is lopsided in a useful way. Anthropic published a
real measured run: building a retro game maker cost **$9 solo (20 min, core feature
broken)** versus **$200 with a full harness (6 hours, working)** — roughly 20x the cost.
But the per-phase breakdown of a second build (a browser DAW, $124.70 total) shows the
*generator* consumed ~90% of the spend while the *evaluator/QA* cost a few dollars
([Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)).

The lesson that drives our whole cost model: **generation is expensive, verification is
cheap.** Adding a checker is a low-cost insurance policy against shipping broken work.

## What you'll find in this document

- **Part 1 — Harness Engineering** (what, why, how) including context & memory management,
  with three retail worked examples (simple / medium / complex), each with runnable
  TypeScript sandboxes and honest token/cost numbers.
- **Part 2 — Modern AI Loops** (what, why, how) with three retail worked examples.
- **Part 3 — Decision Matrix & Token Economics** — when to use which, and what it costs.
- **Part 4 — Synthesis** — how to adopt this without surrendering engineering judgment.

Every factual claim traces to a cited source in
[`research/00-sources.md`](research/00-sources.md).
