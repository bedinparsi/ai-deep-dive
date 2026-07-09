# Harness Engineering — Supplementary Knowledge (harness-extra)

This document is a gap analysis. It compares an external guide —
*"The Complete Guide to Agent Harness: What It Is and Why It Matters"*
(`docs/external/harness1.md`, from harness-engineering.ai, dated March 2026) — against
what our PoV already covers in [Part 1](01-harness-engineering.md), then captures the
pieces we were genuinely missing.

## Honesty note on the source

`harness1.md` comes from **harness-engineering.ai**, the same site as the deployment guide
we reviewed earlier. It is an SEO/content operation (bylined "Dr. Sarah Chen," footer
credits "Kai Renner," GeneratePress marketing template, daily "AI Agent News" posts). So:

- **The concepts are largely sound** and most trace to *legitimate primary sources* —
  Phil Schmid (Hugging Face), the OpenAI harness-engineering post, Anthropic's
  effective-harnesses post, Martin Fowler's team, and the Manus / LangGraph / Vercel v0
  teams. Where a concept has a real primary source, it's cited below.
- **The specific statistics are not independently verified** (e.g., "60% vs 98%,"
  "83%→96%," "40-point difference," "30-50% token savings," "95%×20 = 36%"). They are
  plausible and directionally consistent with what we cite from Anthropic and Chroma, but
  treat them as *claims from a secondary source*, not measured facts, until confirmed.

Everything below is graded on that basis.

---

## Part A — What harness1 covers that we ALREADY have

We did not miss these; they're already in Part 1 / research. Listed so the overlap is explicit.

| Concept in harness1 | Where we cover it |
|---------------------|-------------------|
| `agent = model + harness`; "model is commodity, harness is moat" | §1.1 (the equation), executive summary |
| Same model, different harness → different behavior; harness gap | §1.2 (Terminal Bench #33→#5) |
| Context engineering + context rot + active context management | §1.4 (context rot, compaction, note-taking, JIT) |
| Tool minimalism ("Vercel cut 80% of tools") | §1.3b ("ten focused tools beat fifty"); Vercel is a fresh example of our existing point |
| Verification loops = highest-impact pattern | §1.2 problem #2, §1.3e (back-pressure), Examples 2 & 3 |
| Anthropic initializer + coding agent + `claude-progress.txt` handoff | §1.4 (context reset + structured handoff); research/00-sources #8 |
| "Start simple, add on real failure modes" | §1.2 ("when is harness work warranted"), §1.6 (the ratchet) |
| Generation expensive / verification cheap | §1.3d, Part 3 economics |

---

## Part B — Genuinely missing knowledge (the additive material)

These are the important pieces our PoV did not have. Each is written in our plain,
retail-anchored style so it can be folded into Part 1 later if we choose.

### B1. Framework vs. Harness — a distinction we never drew explicitly

We discuss Harness-as-a-Service (the Claude Agent SDK, etc.) but we never crisply separated
a **framework** from a **harness**, and that distinction is genuinely useful for build-vs-buy
decisions.

- A **framework** is *build-time* — a library of components you assemble an agent from
  (LangChain, CrewAI, AutoGen, Semantic Kernel). It's the blueprint and the building materials.
- A **harness** is the *runtime* environment that governs how the assembled agent executes:
  what context it sees each step, how tool calls are verified, what happens on failure, when
  a human is paged. The Claude Agent SDK and OpenAI's Codex harness are harnesses.

| Dimension | Framework | Harness |
|-----------|-----------|---------|
| Scope | Build-time components | Runtime execution environment |
| Purpose | Assemble the agent | Govern its behavior in production |
| Examples | LangChain, CrewAI, AutoGen | Claude Agent SDK, Codex harness |
| When it matters | Design & implementation | Deployment & operations |

**Why it matters (retail):** a team can build a returns-agent with LangChain in a week, then
spend two months on the harness that makes it safe to run against real refunds. The common
failure is shipping a framework-built agent straight to production with no runtime harness.

### B2. The compounding-reliability argument — a sharper "WHY"

Our WHY leans on the Terminal Bench result. harness1 adds a second, complementary argument
that's very persuasive to a technical-managerial reader: **per-step reliability compounds
badly over multi-step tasks.**

If each step succeeds 95% of the time, a 20-step task completes end-to-end only
`0.95^20 ≈ 36%` of the time. That's why an agent that "works 95% of the time" still fails a
third of real tasks. The harness (verification loops, retry-with-backoff, checkpoint-resume)
is what pushes the compounded rate back up.

**Why it matters (retail):** an RMA flow (request → validate → refund → restock → audit) is
5+ dependent steps. Even at 95%/step that's `~77%` end-to-end — unacceptable for money
movement. This is a concrete, defensible reason verification isn't optional.

> Sourcing: the arithmetic is real and matches the multi-agent-reliability point in
> research/01-key-findings (MindStudio's "5 agents → 77%"). The "36%" figure itself is from
> the secondary source; the math is trivially reproducible.

### B3. Checkpoint-resume — distinct from our "context reset"

We cover *context* reset (rebuild the context window from a handoff). We did **not** cover
**checkpoint-resume for state/compute**, which is a different mechanism:

- After each successful step/tool call, **serialize the agent's state** to durable storage.
- On crash or failure, **resume from the last checkpoint** instead of replaying the whole task.
- On resume, **validate preconditions** — don't blindly replay; the external world may have
  changed (see failure mode B6, state corruption).

**Why it matters (retail):** if an overnight job dies at step 4 of a 6-step inventory
reconciliation, checkpoint-resume avoids re-running (and re-charging tokens for) steps 1–3,
and avoids double-issuing a refund. harness1 claims 30–50% token savings during degraded
conditions (unverified, but directionally sensible).

### B4. Lifecycle management — an operational component we omitted

Our six components (prompts, tools, infra, orchestration, hooks, observability) don't include
**lifecycle management** as a first-class concern. It covers the agent as a long-running
*process*, not a request-response function:

- **Health checks:** is the agent making progress, or stuck in a loop?
- **Resource limits:** max tokens per task, max wall-clock time.
- **Graceful shutdown:** save state, release resources, report final status.
- **Crash recovery:** detect failure, load checkpoint, resume with backoff.

**Why it matters (retail):** the canonical horror story is an agent hitting a flaky payment
API at 3 AM, entering a retry loop, and burning hundreds of dollars producing nothing. A
resource limit + loop detection turns that into a bounded, logged failure.

### B5. Human-in-the-loop (HITL) calibration — beyond "require approval"

We mention hooks that "require approval before opening a PR." harness1 elevates this into a
design discipline worth naming: **approval-gate calibration.**

- Gate the *high-risk, irreversible* actions: deleting data, external communications,
  financial transactions, infrastructure changes.
- **Start strict, relax with confidence.** Begin with aggressive approval requirements, then
  loosen per action-category as the team trusts the agent there.
- The tradeoff is real: too many gates and the agent is slower than doing it by hand; too few
  and one hallucinated call causes an incident.

**Why it matters (retail):** issuing a refund or emailing a customer should sit behind a gate
initially; reading an order's status should not. This is exactly the "escalate the PCI change
to a human" behavior our Example 6 already demonstrates — B5 gives it a name and a tuning rule.

### B6. Two failure modes we hadn't catalogued

We cover context rot, tool explosion, and silent failures. harness1 adds two we didn't:

- **Infinite loops.** Agent errors → retries → same error → retries, indefinitely. Fix:
  enforce max retry counts, exponential backoff, and heuristic loop detection (same action,
  no progress). This is the mechanism behind the "$400 overnight" story.
- **State corruption on resume.** After a crash, the checkpoint says "step 7 of 10 done," but
  the world changed during downtime (files moved, API state shifted). Fix: validate
  preconditions on resume rather than blindly continuing.

### B7. The build-cost reality — for the managerial reader

A point our PoV underplays: **a production-grade harness takes months, not days**, and the
harness effort is often larger than the agent logic itself.

- Manus: ~6 months and 5 complete architectural rewrites before production-ready.
- LangChain: ~1 year across 4 architectures for LangGraph's execution engine.
- Martin Fowler's team documented that the harness effort typically exceeds the agent logic.

**Why it matters:** for a technical-managerial audience this is the build-vs-buy and staffing
signal. Budget for harness engineering as serious infrastructure work (like building a
database or a scheduler), or adopt an existing harness/SDK and add custom layers.

> Sourcing: Manus, LangGraph, and Martin Fowler are real, citable references; the exact
> durations come via the secondary source and should be spot-checked before publishing.

### B8. A phased adoption roadmap

harness1 offers a build order that complements our decision matrix — highest reliability-per-
engineering-hour first:

1. **Verification loops** (tests / schema checks / a second-model check before irreversible actions).
2. **State persistence** (checkpoint-resume).
3. **Observability** (execution traces, token/cost/latency per task, dashboards).
4. **Human-in-the-loop controls** (approval gates, calibrated).

This maps onto our examples: Ex 1–2 are step 1, Ex 3 adds step 3 (the cost ledger), Ex 6 adds
step 4 (escalation). We were missing an explicit step 2 (checkpoint-resume) — see B3.

### B9. Case study we can cite: OpenAI's Codex harness

A concrete, primary-source-backed illustration of "the harness is the product":
over ~5 months, OpenAI's team wrote *zero* application code by hand and let agents generate
1M+ lines *through the harness* — using machine-readable artifacts (architectural constraint
docs, API contracts) for context and closed-loop verification (pre-commit hooks, custom
linters, structural tests) that auto-rejected failing output and fed the reason back for a
retry. Source: OpenAI's harness-engineering post (a real primary source we can cite directly).

### B10. Two teaching metaphors (optional, pedagogy)

Useful for the eventual site/intro, if we want them:
- **Horse tack:** the model is a powerful horse (raw capability, no sense of "stop"); the
  harness is the bridle, reins, and saddle that channel it into useful work.
- **CPU / OS** (Phil Schmid, Hugging Face): the model is a CPU; the harness is the operating
  system that manages memory, scheduling, I/O, permissions, and crash recovery. "A CPU
  without an OS is a heating element; a model without a harness is a demo."

---

## Part C — Recommendation

Worth promoting into the main PoV (Part 1 or a short new "operations" section), because they
fill real gaps and serve the managerial audience:

- **B1** (framework vs harness), **B2** (compounding reliability), **B3** (checkpoint-resume),
  **B4** (lifecycle management), **B6** (infinite loops / state corruption), **B7** (build-cost reality).

Nice-to-have: **B5** (HITL calibration — mostly reinforces Example 6), **B8** (phased roadmap
— overlaps our matrix), **B9/B10** (a case study and metaphors for color).

Before publishing any of the numeric claims, replace secondary-source stats with our
already-verified primary numbers (Anthropic's measured runs, Chroma context-rot, the rate
card), and cite the primary sources (OpenAI harness post, Anthropic effective-harnesses,
Phil Schmid, Martin Fowler, Vercel v0, Manus, LangGraph) rather than the content site.
