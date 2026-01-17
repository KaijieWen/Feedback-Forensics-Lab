import { Env } from "../types";
import { errorResponse, jsonResponse } from "./responses";
import { updateFeedbackStatus } from "../db";

export async function handleRetry(
  env: Env,
  request: Request,
  feedbackId: string
): Promise<Response> {
  if (!isAdminRequest(env, request)) {
    return errorResponse("Unauthorized", 401, "unauthorized");
  }

  await updateFeedbackStatus(env.DB, feedbackId, "queued");

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
  });
}

function isAdminRequest(env: Env, request: Request): boolean {
  if (!env.ADMIN_API_KEY) {
    return true;
  }
  const provided = request.headers.get("x-ffl-admin-key");
  return Boolean(provided && provided === env.ADMIN_API_KEY);
}
