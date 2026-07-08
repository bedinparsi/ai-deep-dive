export interface MatrixRow {
  situation: string;
  harness: "yes" | "no" | "partial";
  loop: "yes" | "no" | "partial";
  both: boolean;
  costDriver: string;
  estCost: string;
  demo: string; // example id or ""
}

export const MATRIX: MatrixRow[] = [
  { situation: "One well-scoped task, you're watching", harness: "yes", loop: "no", both: false, costDriver: "A little memory + a hook", estCost: "< $0.01", demo: "ex01" },
  { situation: "Task that must not 'finish' broken", harness: "yes", loop: "no", both: false, costDriver: "Iterations to green (maker)", estCost: "~$0.02–0.05", demo: "ex02" },
  { situation: "Multi-file feature, one build", harness: "yes", loop: "no", both: false, costDriver: "The generator (~90%)", estCost: "$5–$200", demo: "ex03" },
  { situation: "Recurring report/triage, no code change", harness: "no", loop: "yes", both: false, costDriver: "Cadence × cheap pass", estCost: "pennies/run", demo: "ex04" },
  { situation: "Iterate until a verifiable condition holds", harness: "partial", loop: "yes", both: true, costDriver: "Iterations to convergence", estCost: "~$0.05–0.50", demo: "ex05" },
  { situation: "Unattended, parallel, across services", harness: "yes", loop: "yes", both: true, costDriver: "Findings × (maker+checker) × cadence", estCost: "$0.20–$5+/night", demo: "ex06" },
  { situation: "Subjective quality (design/taste)", harness: "yes", loop: "no", both: false, costDriver: "Generator + evaluator rounds", estCost: "varies", demo: "" },
  { situation: "One-off throwaway exploration", harness: "no", loop: "no", both: false, costDriver: "Just prompt it", estCost: "~free", demo: "" },
];

export interface RateRow {
  model: string;
  input: number; // $ per 1M
  output: number; // $ per 1M
  use: string;
}

export const RATE_CARD: RateRow[] = [
  { model: "Opus", input: 5, output: 25, use: "Planning, orchestration, hard reasoning (the parent)" },
  { model: "Sonnet", input: 3, output: 15, use: "The workhorse generator" },
  { model: "Haiku", input: 1, output: 5, use: "Cheap sub-agents: verification, triage, grep" },
];

// Anthropic's measured DAW build, per phase ($124.70 total).
export interface PhaseCost {
  phase: string;
  cost: number;
  group: "planner" | "generator" | "evaluator";
}

export const DAW_RUN: PhaseCost[] = [
  { phase: "Planner", cost: 0.46, group: "planner" },
  { phase: "Build R1 (generator)", cost: 71.08, group: "generator" },
  { phase: "QA R1 (evaluator)", cost: 3.24, group: "evaluator" },
  { phase: "Build R2 (generator)", cost: 36.89, group: "generator" },
  { phase: "QA R2 (evaluator)", cost: 3.09, group: "evaluator" },
  { phase: "Build R3 (generator)", cost: 5.88, group: "generator" },
  { phase: "QA R3 (evaluator)", cost: 4.06, group: "evaluator" },
];

// Retro game maker: the reliability premium.
export const RELIABILITY_PREMIUM = [
  { approach: "Solo (no harness)", duration: "20 min", cost: 9, result: "Core feature broken" },
  { approach: "Full harness", duration: "6 hr", cost: 200, result: "Working" },
];
