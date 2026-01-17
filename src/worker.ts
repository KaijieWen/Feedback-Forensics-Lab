import { Env } from "./types";
import { handleIngest } from "./api/ingest";
import { handleCase, handleCluster, handleDashboard, handleSearch } from "./api/read";
import { handleRetry } from "./api/retry";
import { errorResponse } from "./api/responses";
import { AnalyzeFeedbackWorkflow } from "./workflows/AnalyzeFeedbackWorkflow";

export { AnalyzeFeedbackWorkflow };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    return serveAsset(request, env, url);
  }
};

async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === "/api/ingest" && request.method === "POST") {
    return handleIngest(request, env);
  }
  if (pathname === "/api/dashboard" && request.method === "GET") {
    return handleDashboard(env);
  }
  if (pathname.startsWith("/api/case/") && request.method === "GET") {
    const id = decodeURIComponent(pathname.split("/").pop() ?? "");
    return handleCase(env, id);
  }
  if (pathname.startsWith("/api/cluster/") && request.method === "GET") {
    const id = decodeURIComponent(pathname.split("/").pop() ?? "");
    return handleCluster(env, id);
  }
  if (pathname === "/api/search" && request.method === "GET") {
    const query = url.searchParams.get("q") ?? "";
    return handleSearch(env, query);
  }
  if (pathname.startsWith("/api/retry/") && request.method === "POST") {
    const id = decodeURIComponent(pathname.split("/").pop() ?? "");
    return handleRetry(env, request, id);
  }

  return errorResponse("Not found", 404, "not_found");
}

async function serveAsset(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  const fallbackUrl = new URL("/index.html", url.origin);
  return env.ASSETS.fetch(new Request(fallbackUrl.toString(), request));
}
