export interface AnalyzeFeedbackInput {
  feedbackId: string;
}

export interface WorkflowBinding {
  start(input: { payload: AnalyzeFeedbackInput }): Promise<void>;
}

export interface EvidencePayload {
  source: string;
  source_url?: string;
  timestamp: string;
  author?: string;
  title?: string;
  text: string;
  raw?: Record<string, unknown>;
}

export interface JurorVote {
  persona: string;
  priority: number;
  rationale: string;
}

export interface CaseFile {
  summary: string;
  category: "bug" | "confusion" | "feature" | "praise" | "other";
  sentiment: number;
  urgency: number;
  product_area: string;
  repro_steps_md: string;
  clarifying_question: string;
  jurors: JurorVote[];
  keywords: string[];
  cluster_hint: string;
  priority_score: number;
}

export interface Env {
  DB: D1Database;
  EVIDENCE_BUCKET: R2Bucket;
  AI: {
    run: (model: string, input: unknown) => Promise<unknown>;
  };
  AI_SEARCH?: {
    query: (input: { query: string; limit?: number }) => Promise<unknown>;
  };
  FFL_WORKFLOW: WorkflowBinding;
  ASSETS: Fetcher;
  ADMIN_API_KEY?: string;
}
