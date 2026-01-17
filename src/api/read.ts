import { Env } from "../types";
import { errorResponse, jsonResponse } from "./responses";

export async function handleDashboard(env: Env): Promise<Response> {
  const topCases = await env.DB.prepare(
    `SELECT f.id, f.source, f.snippet, f.status, cf.priority_score, cf.cluster_id
     FROM feedback f
     LEFT JOIN case_file cf ON f.id = cf.feedback_id
     ORDER BY cf.priority_score DESC NULLS LAST, f.created_at DESC
     LIMIT 20`
  ).all();

  const topClusters = await env.DB.prepare(
    `SELECT c.id, c.label,
            COUNT(cm.feedback_id) AS size,
            MAX(cf.priority_score) AS top_priority
     FROM cluster c
     LEFT JOIN cluster_member cm ON c.id = cm.cluster_id
     LEFT JOIN case_file cf ON cm.feedback_id = cf.feedback_id
     GROUP BY c.id
     ORDER BY size DESC, top_priority DESC
     LIMIT 10`
  ).all();

  return jsonResponse({
    topCases: topCases.results ?? [],
    topClusters: topClusters.results ?? []
  });
}

export async function handleCase(
  env: Env,
  feedbackId: string
): Promise<Response> {
  const feedback = await env.DB.prepare("SELECT * FROM feedback WHERE id = ?")
    .bind(feedbackId)
    .first();

  if (!feedback) {
    return errorResponse("Case not found", 404, "not_found");
  }

  const caseFile = await env.DB.prepare(
    "SELECT case_json, priority_score, cluster_id, updated_at FROM case_file WHERE feedback_id = ?"
  )
    .bind(feedbackId)
    .first();

  const similar = await env.DB.prepare(
    `SELECT s.similar_feedback_id AS id, s.score, f.snippet, cf.priority_score
     FROM similarity_edge s
     LEFT JOIN feedback f ON s.similar_feedback_id = f.id
     LEFT JOIN case_file cf ON s.similar_feedback_id = cf.feedback_id
     WHERE s.feedback_id = ?
     ORDER BY s.score DESC
     LIMIT 8`
  )
    .bind(feedbackId)
    .all();

  return jsonResponse({
    feedback,
    caseFile: caseFile
      ? {
          ...caseFile,
          case_json: safeParseCaseJson(caseFile.case_json as string)
        }
      : null,
    similar: similar.results ?? []
  });
}

export async function handleCluster(
  env: Env,
  clusterId: string
): Promise<Response> {
  const cluster = await env.DB.prepare("SELECT * FROM cluster WHERE id = ?")
    .bind(clusterId)
    .first();

  if (!cluster) {
    return errorResponse("Cluster not found", 404, "not_found");
  }

  const members = await env.DB.prepare(
    `SELECT cm.feedback_id AS id, cm.similarity, f.snippet, f.status, cf.priority_score
     FROM cluster_member cm
     LEFT JOIN feedback f ON cm.feedback_id = f.id
     LEFT JOIN case_file cf ON cm.feedback_id = cf.feedback_id
     WHERE cm.cluster_id = ?
     ORDER BY cf.priority_score DESC NULLS LAST, cm.similarity DESC`
  )
    .bind(clusterId)
    .all();

  return jsonResponse({
    cluster,
    members: members.results ?? []
  });
}

export async function handleSearch(
  env: Env,
  query: string
): Promise<Response> {
  const trimmed = query.trim();
  if (!trimmed) {
    return errorResponse("Missing query", 400, "missing_query");
  }

  if (env.AI_SEARCH?.query) {
    try {
      const result = (await env.AI_SEARCH.query({
        query: trimmed,
        limit: 10
      })) as { matches?: Array<Record<string, unknown>> };
      const matches = (result?.matches ?? [])
        .map((match) => {
          const id =
            (match.id as string | undefined) ??
            (match.document_id as string | undefined) ??
            (match.documentId as string | undefined);
          if (!id) {
            return null;
          }
          return {
            id,
            score: match.score ?? null
          };
        })
        .filter(Boolean) as Array<{ id: string; score: number | null }>;

      if (matches.length === 0) {
        return jsonResponse({ results: [] });
      }

      const placeholders = matches.map(() => "?").join(", ");
      const rows = await env.DB.prepare(
        `SELECT id, snippet, source, status FROM feedback WHERE id IN (${placeholders})`
      )
        .bind(...matches.map((match) => match.id))
        .all();

      return jsonResponse({
        results: rows.results ?? [],
        matches
      });
    } catch (error) {
      return errorResponse(
        "AI Search query failed",
        502,
        "ai_search_failed"
      );
    }
  }

  const rows = await env.DB.prepare(
    `SELECT id, snippet, source, status
     FROM feedback
     WHERE snippet LIKE ?
     ORDER BY created_at DESC
     LIMIT 10`
  )
    .bind(`%${trimmed}%`)
    .all();

  return jsonResponse({
    results: rows.results ?? [],
    matches: []
  });
}

function safeParseCaseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}
