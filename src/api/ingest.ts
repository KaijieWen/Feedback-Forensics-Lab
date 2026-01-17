import { EvidencePayload, Env } from "../types";
import { errorResponse, jsonResponse } from "./responses";
import { insertFeedback, updateFeedbackStatus } from "../db";
import { processFeedbackInline } from "./process";

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

  // Try workflow first, fallback to inline processing if it fails
  try {
    await env.FFL_WORKFLOW.start({ payload: { feedbackId } });
    return jsonResponse({
      id: feedbackId,
      status: "queued"
    }, 202);
  } catch (error) {
    // Fallback: process inline (synchronous) for demo purposes
    // This allows clustering to work even if Workflows aren't configured correctly
    // Note: This blocks the request until processing completes
    try {
      await processFeedbackInline(env, feedbackId);
      return jsonResponse({
        id: feedbackId,
        status: "ready",
        note: "Processed inline (workflow unavailable)"
      }, 200);
    } catch (fallbackError) {
      await updateFeedbackStatus(
        env.DB,
        feedbackId,
        "failed",
        "process_failed",
        fallbackError instanceof Error ? fallbackError.message : "Processing failed"
      );
      return errorResponse(
        "Failed to process feedback",
        500,
        "process_failed"
      );
    }
  }
}
