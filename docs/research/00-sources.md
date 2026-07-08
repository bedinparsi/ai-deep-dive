# Annotated Sources

This is the citation backbone for the PoV. Every factual claim in the documentation
should trace to one of these. Sources are grouped by theme. Access dates: July 2026.

> Note on quotation: per content policy we paraphrase and summarize; we do not
> reproduce long verbatim passages. Each source is linked inline where used.

## Primary: Harness Engineering

1. **Addy Osmani — "Agent Harness Engineering"** (Apr 19, 2026)
   https://addyosmani.com/blog/agent-harness-engineering/
   - Core equation: `coding agent = AI model(s) + harness`.
   - The six harness components (system prompts/CLAUDE.md/AGENTS.md/skills/subagent
     prompts; tools/skills/MCP; bundled infrastructure; orchestration; hooks/middleware;
     observability). This is the exact component list the user asked us to cover.
   - "The ratchet": every agent mistake becomes a permanent rule. Every line in
     AGENTS.md should trace to a specific failure.
   - Terminal Bench 2.0 data point: same model (Opus) scores far lower in default
     Claude Code harness than in a tuned custom harness (Top 30 → Top 5 by changing
     only the harness).
   - Harnesses "don't shrink, they move" as models improve.

2. **Viv Trivedy — "The Anatomy of an Agent Harness"** (Mar 10, 2026)
   https://vtrivedy.com/posts/the-anatomy-of-an-agent-harness/
   (also on LangChain blog: https://blog.langchain.com/the-anatomy-of-an-agent-harness/)
   - Coined "harness engineering." "If you're not the model, you're the harness."
   - Working-backwards method: start from a behavior the model can't do natively,
     derive the harness component that delivers it.
   - Behavior→component map: durable state→filesystem/git; execute code→bash;
     safe execution→sandboxes; new knowledge→memory files/web search/MCP;
     long context→compaction/offloading/skills; long-horizon→Ralph loops/planning/verification.
   - Harness-as-a-Service (HaaS): building on runtimes (Claude Agent SDK, Codex SDK,
     OpenAI Agents SDK) rather than raw completion APIs.
   - Model-harness training loop (co-training / overfitting to harness).

3. **HumanLayer (Kyle) — "Skill Issue: Harness Engineering for Coding Agents"** (Mar 12, 2026)
   https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents
   - "It's not a model problem. It's a configuration problem."
   - Harness engineering as a subset of context engineering (Dex Horthy, 12-factor agents).
   - Sub-agents as a "context firewall" — the highest-leverage lever for coherence
     across many context windows.
   - Concrete hook example (biome + typecheck on Stop; success silent, failures verbose).
   - MCP security warning: tool descriptions are trusted text injected into the prompt.
   - ETH Zurich study (138 agentfiles): LLM-generated agentfiles hurt performance and
     cost 20%+ more; human-written ones helped ~4%. Keep CLAUDE.md under ~60 lines.
   - "Success is silent, failures are verbose" (back-pressure principle).

## Primary: Loop Engineering

4. **Addy Osmani — "Loop Engineering"** (Jun 7, 2026)
   https://addyosmani.com/blog/loop-engineering/
   - "You should be designing loops that prompt your agents" (Steinberger / Boris Cherny).
   - The five pieces + memory: (1) Automations/scheduler, (2) Worktrees, (3) Skills,
     (4) Plugins/connectors (MCP), (5) Sub-agents, + (6) State/memory on disk.
   - Codex vs Claude Code capability mapping table (same capabilities, different names).
   - `/loop` (cadence) vs `/goal` (run-until-verifiable-condition, separate model grades).
   - "What one loop looks like" — the morning-triage worked example we can adapt.
   - The three unsolved problems: verification, comprehension debt, cognitive surrender.

5. **Simon Willison — "Designing agentic loops"** (Sep 30, 2025)
   https://simonwillison.net/2025/Sep/30/designing-agentic-loops/
   - "An agent is a system that runs tools in a loop to achieve a goal."
   - YOLO mode + sandboxing tradeoffs; tightly-scoped credentials; budget limits.
   - When to design a loop: problems with clear success criteria + tedious trial-and-error
     (debugging, perf optimization, dependency upgrades, container size).
   - Tests as the amplifier for agent value.

## Primary: Context Engineering + Memory

6. **Anthropic — "Effective context engineering for AI agents"** (Sep 29, 2025)
   https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
   - Context engineering = "smallest set of high-signal tokens that maximize the
     likelihood of the desired outcome."
   - Context rot / attention budget / n² attention cost rationale.
   - System-prompt "right altitude" (Goldilocks between brittle if-else and vague).
   - Just-in-time retrieval vs pre-inference retrieval; hybrid (CLAUDE.md up front + grep/glob JIT).
   - Long-horizon techniques: compaction, structured note-taking, sub-agent architectures.

7. **Anthropic — "Harness design for long-running application development"** (Mar 24, 2026)
   https://www.anthropic.com/engineering/harness-design-long-running-apps
   - GAN-inspired generator/evaluator; then planner/generator/evaluator three-agent architecture.
   - Context resets vs compaction (clean slate vs summarize-in-place; context anxiety).
   - Real measured cost data (our token-economics anchor):
     - Retro game maker: Solo 20 min / $9 vs Full harness 6 hr / $200 (~20x cost, big quality delta).
     - DAW (V2 harness, Opus 4.5): 3 hr 50 min / $124.70 total, with per-phase breakdown.
   - "Every component in a harness encodes an assumption about what the model can't do."
   - Sprint contracts (negotiate "done" before writing code).

8. **Anthropic — "Effective harnesses for long-running agents"** (Nov 2025)
   https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
   - Initializer agent + coding agent + artifact handoff across sessions.

9. **Karpathy — "LLM Wiki" pattern** (gist 442a6bf...)
   Described via: https://www.mindstudio.ai/blog/karpathy-wiki-vs-structured-database-ai-memory
   and the Google OKF post below.
   - Compile knowledge to markdown at WRITE time; load into context; no retrieval step.
   - Compiler analogy: the wiki is pre-processed/distilled knowledge ready to execute.
   - Agent maintains the wiki (adds, merges, prunes) → compounding knowledge loop.
   - Wiki vs structured DB/RAG: write-time vs runtime intelligence; when to use each; hybrid.

10. **Google Cloud — "Introducing the Open Knowledge Format (OKF)"** (Jun 13, 2026)
    https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing
    - Formalizes the LLM-wiki pattern into a portable spec: directory of markdown +
      YAML frontmatter (type/title/description/resource/tags/timestamp).
    - "Just markdown, just files, just YAML frontmatter." Producer/consumer independence.
    - index.md (progressive disclosure) + log.md (chronological history) conventions.
    - Positions OKF as lingua franca vs fragmented catalogs/wikis/AGENTS.md family.

## Primary: Configuration surfaces

11. **Matt Pocock — "A Complete Guide to AGENTS.md"** (aihero.dev)
    https://www.aihero.dev/a-complete-guide-to-agents-md
    - AGENTS.md sits right below the system prompt, loaded every request.
    - Instruction budget: frontier thinking models follow ~150-200 instructions reliably.
    - Progressive disclosure: minimal root file + linked docs/ tree + skills.
    - Don't document file paths (they go stale and poison context); document capabilities/domain concepts.
    - Monorepo: nested AGENTS.md merge.

## Pricing (token economics anchor — verified July 2026)

12. **Claude API pricing** (per 1M tokens, input / output), cross-checked across
    multiple trackers (cloudzero.com, puter.com, usagebox.com, fast.io):
    - Claude Opus (4.6/4.7/4.8 tier): **$5 in / $25 out**
    - Claude Sonnet (4.6 tier): **$3 in / $15 out**
    - Claude Haiku (4.5 tier): **$1 in / $5 out**
    - Prompt caching and batch discounts exist (batch ~50% off); cached input reads
      are heavily discounted. Exact cache multipliers to confirm on official pricing
      page before publishing final numbers.
    - NOTE: older trackers cite legacy Claude 3.x numbers (Opus $15/$75, Haiku $0.25/$1.25).
      Use the current 4.x rate card above; flag the discrepancy in the economics section.

## Supporting concepts (to cite as needed)
- Chroma — "Context Rot" research (empirical basis for degradation at long context).
- Dex Horthy — 12-factor agents (context engineering superset).
- Geoffrey Huntley — the Ralph / Ralph Wiggum loop (origin of the continuation-hook pattern).
- Mitchell Hashimoto — "engineer the harness" framing.
- ETH Zurich — study of 138 agentfiles (arxiv, cited via HumanLayer).
