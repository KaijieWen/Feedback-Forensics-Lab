import { CaseFile } from "./types";

export interface FeedbackRow {
  id: string;
  source: string;
  title?: string | null;
  snippet: string;
  r2_key: string;
  status: string;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
}

export async function insertFeedback(
  db: D1Database,
  row: FeedbackRow
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO feedback (id, source, title, snippet, r2_key, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      row.id,
      row.source,
      row.title ?? null,
      row.snippet,
      row.r2_key,
      row.status,
      row.created_at
    )
    .run();
}

export async function updateFeedbackStatus(
  db: D1Database,
  feedbackId: string,
  status: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  await db
    .prepare(
      "UPDATE feedback SET status = ?, error_code = ?, error_message = ? WHERE id = ?"
    )
    .bind(status, errorCode ?? null, errorMessage ?? null, feedbackId)
    .run();
}

export async function getFeedback(
  db: D1Database,
  feedbackId: string
): Promise<FeedbackRow | null> {
  const result = await db
    .prepare("SELECT * FROM feedback WHERE id = ?")
    .bind(feedbackId)
    .first<FeedbackRow>();
  return result ?? null;
}

export async function insertCaseFile(
  db: D1Database,
  feedbackId: string,
  caseFile: CaseFile,
  clusterId: string | null
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO case_file (feedback_id, case_json, priority_score, cluster_id, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(
      feedbackId,
      JSON.stringify(caseFile),
      Math.round(caseFile.priority_score),
      clusterId,
      new Date().toISOString()
    )
    .run();
}

export async function ensureCluster(
  db: D1Database,
  label: string,
  existingId?: string | null
): Promise<string> {
  if (existingId) {
    return existingId;
  }
  const clusterId = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      "INSERT INTO cluster (id, label, created_at, updated_at) VALUES (?, ?, ?, ?)"
    )
    .bind(clusterId, label, now, now)
    .run();
  return clusterId;
}

export async function insertClusterMember(
  db: D1Database,
  clusterId: string,
  feedbackId: string,
  similarity?: number
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO cluster_member (cluster_id, feedback_id, similarity, created_at) VALUES (?, ?, ?, ?)"
    )
    .bind(clusterId, feedbackId, similarity ?? null, new Date().toISOString())
    .run();
}

export async function insertSimilarityEdge(
  db: D1Database,
  feedbackId: string,
  similarId: string,
  score?: number
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO similarity_edge (feedback_id, similar_feedback_id, score, created_at) VALUES (?, ?, ?, ?)"
    )
    .bind(
      feedbackId,
      similarId,
      score ?? null,
      new Date().toISOString()
    )
    .run();
}
