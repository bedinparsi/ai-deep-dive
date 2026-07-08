# Part 4 — Synthesis

## The whole PoV in one page

Modern AI engineering has settled on one equation and two disciplines built on it:

```
coding agent = AI model(s) + harness          ← harness engineering
loop          = harness, run on a cadence,     ← loop engineering
                feeding itself
```

- **Harness engineering** is how you make a *single* agent run reliable. It exists because
  the hard parts of shipping software — state, tool execution, safe execution, memory,
  verification, long-horizon coherence — are *not intelligence problems*, so a smarter model
  alone doesn't solve them. The proof is the Terminal Bench Top 30 → Top 5 jump from
  *changing only the harness*. If you take one action from this document, make it the two
  cheapest harness levers: a tight `CLAUDE.md` and a verification hook.

- **Loop engineering** is how you make *many* runs autonomous. It exists because you are the
  bottleneck for recurring, well-defined work, and it converts "work that needs a human to
  start it" into "work that happens on its own and only escalates when judgment is needed."
  But it sharpens verification, comprehension debt, and cognitive surrender — so it's the
  right tool *only* when work recurs, "done" is verifiable, and you trust the verifier.

They are **layers, not alternatives.** Get the harness right; add a loop only where the work
truly repeats and can be checked.

## How to choose (the short version)

1. One-off? → prompt a well-harnessed agent. Don't build a loop.
2. Must not ship broken? → back-pressure hook (cheapest high-ROI move there is).
3. Multi-file / long-horizon? → planner/generator/evaluator, with model routing.
4. Recurring + verifiable + trusted verifier? → wrap the harness in a loop.
5. Touches money/data/prod? → more enforcement, and escalate risky items to a human inbox.

## The economics in one line

**Generation is expensive; verification is cheap.** Route cheap models to planning and
verification, spend on generation only where needed, throttle loops with cadence, and keep
context tight because input tokens are paid every turn. Anthropic's real runs ($9 broken vs
$200 working; a $124.70 build that was ~91% generator) are the anchors; our sandboxes
reproduce the shape.

## Context & memory, the quiet enabler

Everything above depends on treating context as a scarce resource (context rot is real and
measured). Compaction, context resets, structured note-taking, and sub-agent firewalls keep
runs sharp. For durable knowledge, the **LLM-wiki / OKF** pattern (compile knowledge to
markdown at write time, agent maintains it, load it every session) is the retail-friendly
default for stable domain rules — paired with a structured DB/RAG for large or dynamic data.

## The principle to end on

Addy Osmani's line is the right note to close on: **build the loop, but build it like
someone who intends to stay the engineer, not just the person who presses go.** The same
tools make one engineer faster on work they understand and let another avoid understanding
the work at all. The tools can't tell the difference. You can.

---

## Where this goes next (Phase 2)

With the content settled, Phase 2 is a Next.js site to present it: the four parts as
readable docs, the decision matrix and cost tables as interactive components, and the six
sandboxes as runnable, in-browser demos that print their cost ledgers live. The examples
were written in TypeScript specifically so they can run both from the CLI today and in the
browser later with minimal change.

## Document map

- [Executive summary](00-executive-summary.md)
- [Part 1 — Harness Engineering](01-harness-engineering.md) (incl. context & memory)
- [Part 2 — Modern AI Loops](02-loop-engineering.md)
- [Part 3 — Decision Matrix & Token Economics](03-decision-matrix-and-economics.md)
- Part 4 — Synthesis (this file)
- Runnable examples: [`examples/`](../examples/)
- Sources & research notes: [`research/`](research/)
