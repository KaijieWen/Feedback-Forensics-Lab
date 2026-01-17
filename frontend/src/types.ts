export interface DashboardCase {
  id: string;
  source: string;
  snippet: string;
  status: string;
  priority_score?: number | null;
  cluster_id?: string | null;
  category?: string | null;
  urgency?: number | null;
}

export interface DashboardCluster {
  id: string;
  label: string;
  size: number;
  top_priority?: number | null;
}

export interface DashboardResponse {
  topCases: DashboardCase[];
  topClusters: DashboardCluster[];
}

export interface CaseResponse {
  feedback: {
    id: string;
    source: string;
    title?: string | null;
    snippet: string;
    status: string;
    created_at: string;
  };
  caseFile: {
    case_json: unknown;
    priority_score: number;
    cluster_id?: string | null;
    updated_at: string;
  } | null;
  similar: Array<{
    id: string;
    score?: number | null;
    snippet?: string | null;
    priority_score?: number | null;
  }>;
}

export interface ClusterResponse {
  cluster: {
    id: string;
    label: string;
  };
  members: Array<{
    id: string;
    similarity?: number | null;
    snippet?: string | null;
    status?: string | null;
    priority_score?: number | null;
  }>;
}

export interface SearchResponse {
  results: Array<{
    id: string;
    snippet: string;
    source: string;
    status: string;
    category?: string | null;
    priority_score?: number | null;
  }>;
  matches?: Array<{ id: string; score: number | null }>;
}
