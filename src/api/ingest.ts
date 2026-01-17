import { EvidencePayload, Env } from "../types";
import { errorResponse, jsonResponse } from "./responses";
import { insertFeedback, updateFeedbackStatus } from "../db";

const MAX_TEXT_LENGTH = 6000;
const SNIPPET_LENGTH = 200;

function normalizeText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_TEXT_LENGTH) {
    return trimmed;
  }
  return trimmed.slice(0, MAX_TEXT_LENGTH);
}

function toSnippet(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.slice(0, SNIPPET_LENGTH);
}

export async function handleIngest(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.headers.get("content-type")?.includes("application/json") !== true) {
    return errorResponse("Expected application/json body", 415, "unsupported_media");
  }

  let payload: EvidencePayload;
  try {
    payload = (await request.json()) as EvidencePayload;
  } catch (error) {
    return errorResponse("Invalid JSON payload", 400, "invalid_json");
  }

  if (!payload?.text || typeof payload.text !== "string") {
    return errorResponse("Missing required field: text", 400, "missing_text");
  }
  if (!payload?.source || typeof payload.source !== "string") {
    return errorResponse("Missing required field: source", 400, "missing_source");
  }

  const feedbackId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const normalizedText = normalizeText(payload.text);
  const r2Key = `evidence/${feedbackId}.json`;
  const evidence: EvidencePayload = {
    source: payload.source,
    source_url: payload.source_url,
    timestamp: payload.timestamp ?? createdAt,
    author: payload.author,
    title: payload.title,
    text: normalizedText,
    raw: payload.raw
  };

  await env.EVIDENCE_BUCKET.put(r2Key, JSON.stringify(evidence), {
    httpMetadata: {
      contentType: "application/json"
    }
  });

  await insertFeedback(env.DB, {
    id: feedbackId,
    source: payload.source,
    title: payload.title ?? null,
    snippet: toSnippet(normalizedText),
    r2_key: r2Key,
    status: "queued",
    created_at: createdAt
  });

  try {
    await env.FFL_WORKFLOW.start({ payload: { feedbackId } });
  } catch (error) {
    await updateFeedbackStatus(
      env.DB,
      feedbackId,
      "failed",
      "workflow_start_failed",
      error instanceof Error ? error.message : "Workflow start failed"
    );
    return errorResponse(
      "Failed to start analysis workflow",
      500,
      "workflow_start_failed"
    );
  }

  return jsonResponse({
    id: feedbackId,
    status: "queued"
  }, 202);
}
