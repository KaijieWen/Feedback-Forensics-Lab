import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { fetchDashboard, ingestFeedback, searchFeedback } from "../api";
import type { DashboardResponse, SearchResponse } from "../types";
import {
  getStatusColor,
  getSourceColor,
  getPriorityColor,
  formatShortId,
  getCategoryColor
} from "../utils/badges";

const emptyDashboard: DashboardResponse = { topCases: [], topClusters: [] };

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [showIngest, setShowIngest] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchDashboard();
        if (active) {
          setDashboard(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await searchFeedback(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      setSearchResults({
        results: [],
        matches: []
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleIngest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    if (!payload.text || String(payload.text).trim().length === 0) {
      setIngestStatus("Feedback text is required.");
      return;
    }
    try {
      setIngestStatus("Submitting...");
      const response = await ingestFeedback(payload);
      setIngestStatus(`Queued feedback ${formatShortId(response.id)}`);
      form.reset();
      setTimeout(() => setIngestStatus(null), 3000);
    } catch (err) {
      setIngestStatus(err instanceof Error ? err.message : "Ingest failed");
    }
  };

  const totalCases = dashboard.topCases.length;
  const readyCases = dashboard.topCases.filter(c => c.status === "ready").length;
  const totalClusters = dashboard.topClusters.length;
  const avgPriority = totalCases > 0
    ? Math.round(
        dashboard.topCases
          .filter(c => c.priority_score !== null)
          .reduce((sum, c) => sum + (c.priority_score || 0), 0) /
        dashboard.topCases.filter(c => c.priority_score !== null).length
      )
    : null;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Feedback Forensics Lab</h1>
          <p className="muted">
            Aggregate feedback, generate evidence-backed case files, and de-duplicate issues.
          </p>
        </div>
        {totalCases > 0 && (
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-value">{totalCases}</span>
              <span className="metric-label">Cases</span>
            </div>
            <div className="metric-item">
              <span className="metric-value">{readyCases}</span>
              <span className="metric-label">Ready</span>
            </div>
            <div className="metric-item">
              <span className="metric-value">{totalClusters}</span>
              <span className="metric-label">Clusters</span>
            </div>
            {avgPriority !== null && (
              <div className="metric-item">
                <span className="metric-value">{avgPriority}</span>
                <span className="metric-label">Avg Priority</span>
              </div>
            )}
          </div>
        )}
      </header>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2>Semantic search</h2>
        </div>
        <div className="search-row">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for similar feedback..."
          />
          <button onClick={handleSearch} disabled={searchLoading}>
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>
        {searchResults && (
          <div className="list" style={{ marginTop: "0.75rem" }}>
            {searchResults.results.length === 0 && (
              <p className="muted" style={{ padding: "0.5rem" }}>No results found.</p>
            )}
            {searchResults.results.map((result) => (
              <Link className="list-item" key={result.id} to={`/case/${result.id}`}>
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span className={`badge badge-small ${getSourceColor(result.source)}`}>
                      {result.source.replace(/_/g, " ")}
                    </span>
                    <span className={`badge badge-small ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                    {result.category && (
                      <span className={`badge badge-small ${getCategoryColor(result.category)}`}>
                        {result.category}
                      </span>
                    )}
                  </div>
                  <p className="muted text-truncate">{result.snippet}</p>
                </div>
                {result.priority_score !== null && (
                  <span className={`badge badge-small ${getPriorityColor(result.priority_score)}`}>
                    {result.priority_score}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2>Ingest feedback</h2>
          <button
            type="button"
            onClick={() => setShowIngest(!showIngest)}
            style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem" }}
          >
            {showIngest ? "Hide" : "Show"} Form
          </button>
        </div>
        {showIngest && (
          <form className="compact-form" onSubmit={handleIngest}>
            <label>
              Source
              <input name="source" placeholder="support_ticket / discord / github" />
            </label>
            <label>
              Title
              <input name="title" placeholder="Short title (optional)" />
            </label>
            <label>
              Author
              <input name="author" placeholder="User handle (optional)" />
            </label>
            <label>
              Source URL
              <input name="source_url" placeholder="https://..." />
            </label>
            <label className="full">
              Feedback text
              <textarea name="text" rows={3} placeholder="Paste feedback here" required />
            </label>
            <div className="full" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button type="submit">Submit</button>
              {ingestStatus && <span className="muted" style={{ fontSize: "0.8rem" }}>{ingestStatus}</span>}
            </div>
          </form>
        )}
      </section>

      <section className="grid two-col">
        <div className="card">
          <h2>Top clusters</h2>
          {loading ? (
            <p className="muted" style={{ padding: "0.5rem" }}>Loading clusters...</p>
          ) : (
            <div className="list">
              {dashboard.topClusters.map((cluster) => (
                <Link className="list-item" key={cluster.id} to={`/cluster/${cluster.id}`}>
                  <div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                      <strong>{cluster.label}</strong>
                      <span className="badge badge-small badge-source-support-ticket">
                        {cluster.size} cases
                      </span>
                    </div>
                  </div>
                  {cluster.top_priority !== null && (
                    <span className={`badge badge-small ${getPriorityColor(cluster.top_priority)}`}>
                      {cluster.top_priority}
                    </span>
                  )}
                </Link>
              ))}
              {dashboard.topClusters.length === 0 && (
                <p className="muted" style={{ padding: "0.5rem" }}>No clusters yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Recent cases</h2>
          {loading ? (
            <p className="muted" style={{ padding: "0.5rem" }}>Loading cases...</p>
          ) : error ? (
            <p className="muted" style={{ padding: "0.5rem" }}>{error}</p>
          ) : (
            <div className="list">
              {dashboard.topCases.map((item) => (
                <Link className="list-item" key={item.id} to={`/case/${item.id}`}>
                  <div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                      <span className={`badge badge-small ${getSourceColor(item.source)}`}>
                        {item.source.replace(/_/g, " ")}
                      </span>
                      <span className={`badge badge-small ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      {item.category && (
                        <span className={`badge badge-small ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="muted text-truncate">{item.snippet}</p>
                    <span className="muted font-mono" style={{ fontSize: "0.7rem", marginTop: "0.25rem" }}>
                      {formatShortId(item.id)}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-end" }}>
                    {item.priority_score !== null && (
                      <span className={`badge badge-small ${getPriorityColor(item.priority_score)}`}>
                        {item.priority_score}
                      </span>
                    )}
                    {item.urgency !== null && item.urgency !== undefined && (
                      <span className={`badge badge-small badge-urgency-${Math.round(item.urgency)}`}>
                        U{item.urgency}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {dashboard.topCases.length === 0 && (
                <p className="muted" style={{ padding: "0.5rem" }}>No cases yet.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
