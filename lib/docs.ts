export interface DocMeta {
  slug: string;
  title: string;
  file: string;
}

// Ordered list of docs presented in the site. Files live in /docs at the repo root.
// Pure data only (no Node built-ins) so this is safe to import from client components.
export const DOCS: DocMeta[] = [
  { slug: "00-executive-summary", title: "Executive Summary", file: "00-executive-summary.md" },
  { slug: "01-harness-engineering", title: "Part 1 — Harness Engineering", file: "01-harness-engineering.md" },
  { slug: "02-loop-engineering", title: "Part 2 — Modern AI Loops", file: "02-loop-engineering.md" },
  { slug: "03-decision-matrix-and-economics", title: "Part 3 — Decision Matrix & Economics", file: "03-decision-matrix-and-economics.md" },
  { slug: "04-synthesis", title: "Part 4 — Synthesis", file: "04-synthesis.md" },
  { slug: "05-implementation-playbook", title: "Part 5 — Implementation Playbook", file: "05-implementation-playbook.md" },
];
