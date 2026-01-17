import type {
  CaseResponse,
  ClusterResponse,
  DashboardResponse,
  SearchResponse
} from "./types";

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      (errorBody as { error?: string }).error ?? response.statusText;
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export function fetchDashboard(): Promise<DashboardResponse> {
  return requestJson("/api/dashboard");
}

export function fetchCase(id: string): Promise<CaseResponse> {
  return requestJson(`/api/case/${encodeURIComponent(id)}`);
}

export function fetchCluster(id: string): Promise<ClusterResponse> {
  return requestJson(`/api/cluster/${encodeURIComponent(id)}`);
}

export function searchFeedback(query: string): Promise<SearchResponse> {
  return requestJson(`/api/search?q=${encodeURIComponent(query)}`);
}

export function ingestFeedback(payload: Record<string, unknown>): Promise<{ id: string }> {
  return requestJson("/api/ingest", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
