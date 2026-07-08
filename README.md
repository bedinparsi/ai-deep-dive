# ai-deep-dive

A Point-of-View (PoV) on modern AI engineering: **Harness Engineering** and **Modern AI
Loops**, written for technical-managerial software engineers. Domain: retail / e-commerce.
Anchor technology: Claude Code / Anthropic (Claude Agent SDK). Examples in TypeScript/Node.

## Phase 1 — Documentation (in progress)

Read in order:

1. [Executive Summary](docs/00-executive-summary.md)
2. [Part 1 — Harness Engineering](docs/01-harness-engineering.md) (includes context & memory)
3. [Part 2 — Modern AI Loops](docs/02-loop-engineering.md)
4. [Part 3 — Decision Matrix & Token Economics](docs/03-decision-matrix-and-economics.md)
5. [Part 4 — Synthesis](docs/04-synthesis.md)

Supporting material:
- [Research notes & annotated sources](docs/research/) — every claim traces to a cited source.
- [Runnable examples](examples/) — six mocked sandboxes that print real cost ledgers.

## Running the examples

```bash
cd examples
npm install
npm run all      # or ex01 .. ex06 individually
```

Every model call is mocked for reproducibility; the harness/loop mechanics are real code,
and cost ledgers are computed against the verified July 2026 Claude rate card.

## Phase 2 — Next.js site

A Next.js (App Router) app presents everything above:

- **Docs** — the four parts rendered from the same markdown in `docs/`, with in-app navigation.
- **Decision Matrix** (`/matrix`) — interactive: filter situations by harness / loop / both.
- **Token Economics** (`/economics`) — the rate card and Anthropic's real measured runs as charts.
- **Runnable Examples** (`/examples/[id]`) — all six sandboxes run in-browser and print a live
  cost ledger, artifacts, and takeaway. Same logic as the CLI examples, browser-safe.

```bash
# from the repo root
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static-generates all 18 pages)
```

Stack: Next.js 14 (App Router) · React 18 · TypeScript · Tailwind · react-markdown/remark-gfm.
Charts are dependency-free (CSS). No API keys or network calls — example model calls are mocked.

### Project layout

```
app/            routes: home, /docs/[slug], /matrix, /economics, /examples[/id]
components/     Sidebar, Markdown, MatrixTable, BarChart, LedgerView, ExampleRunner
lib/            docs (metadata) + docs.server (md reader), cost model, matrix data,
                examples/ (browser-safe versions of the six sandboxes)
docs/           the source markdown (Phase 1)
examples/       the CLI sandboxes (Phase 1)
```
