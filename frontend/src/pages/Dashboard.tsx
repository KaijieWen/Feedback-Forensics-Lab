import { useEffect, useState, type FormEvent } from "react";
import { fetchDashboard, ingestFeedback, searchFeedback } from "../api";
import type { DashboardResponse, SearchResponse } from "../types";

const emptyDashboard: DashboardResponse = { topCases: [], topClusters: [] };

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);

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
      setIngestStatus(`Queued feedback ${response.id}`);
      form.reset();
    } catch (err) {
      setIngestStatus(err instanceof Error ? err.message : "Ingest failed");
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Feedback Forensics Lab</h1>
          <p className="muted">
            Aggregate feedback, generate evidence-backed case files, and de-duplicate
            issues with semantic search.
          </p>
        </div>
      </header>

      <section className="card">
        <h2>Ingest feedback</h2>
        <form className="grid" onSubmit={handleIngest}>
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
            <textarea name="text" rows={4} placeholder="Paste feedback here" />
          </label>
          <div className="full">
            <button type="submit">Submit feedback</button>
            {ingestStatus && <span className="muted">{ingestStatus}</span>}
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Semantic search</h2>
        <div className="search-row">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search for similar complaints..."
          />
          <button onClick={handleSearch} disabled={searchLoading}>
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>
        {searchResults && (
          <div className="list">
            {searchResults.results.length === 0 && (
              <p className="muted">No results yet.</p>
            )}
            {searchResults.results.map((result) => (
              <a className="list-item" key={result.id} href={`/case/${result.id}`}>
                <div>
                  <strong>{result.source}</strong>
                  <p className="muted">{result.snippet}</p>
                </div>
                <span className={`status ${result.status}`}>{result.status}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="grid two-col">
        <div className="card">
          <h2>Top clusters</h2>
          {loading ? (
            <p className="muted">Loading clusters...</p>
          ) : (
            <div className="list">
              {dashboard.topClusters.map((cluster) => (
                <a className="list-item" key={cluster.id} href={`/cluster/${cluster.id}`}>
                  <div>
                    <strong>{cluster.label}</strong>
                    <p className="muted">{cluster.size} cases</p>
                  </div>
                  <span className="pill">
                    Priority {cluster.top_priority ?? "-"}
                  </span>
                </a>
              ))}
              {dashboard.topClusters.length === 0 && (
                <p className="muted">No clusters yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Recent cases</h2>
          {loading ? (
            <p className="muted">Loading cases...</p>
          ) : error ? (
            <p className="muted">{error}</p>
          ) : (
            <div className="list">
              {dashboard.topCases.map((item) => (
                <a className="list-item" key={item.id} href={`/case/${item.id}`}>
                  <div>
                    <strong>{item.source}</strong>
                    <p className="muted">{item.snippet}</p>
                  </div>
                  <span className="pill">
                    {item.priority_score ?? "-"}
                  </span>
                </a>
              ))}
              {dashboard.topCases.length === 0 && (
                <p className="muted">No cases yet.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
