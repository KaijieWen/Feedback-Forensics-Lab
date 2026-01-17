import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCluster } from "../api";
import type { ClusterResponse } from "../types";
import {
  getStatusColor,
  getPriorityColor,
  formatShortId
} from "../utils/badges";

export function ClusterDetail() {
  const { id } = useParams();
  const [data, setData] = useState<ClusterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("Missing cluster id");
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const response = await fetchCluster(id);
        if (active) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load cluster");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="page">Loading cluster...</div>;
  }

  if (error || !data) {
    return (
      <div className="page">
        <p className="muted">{error ?? "Cluster not available."}</p>
      </div>
    );
  }

  const memberCount = data.members.length;
  const readyMembers = data.members.filter(m => m.status === "ready").length;
  const avgPriority = memberCount > 0
    ? Math.round(
        data.members
          .filter(m => m.priority_score !== null)
          .reduce((sum, m) => sum + (m.priority_score || 0), 0) /
        data.members.filter(m => m.priority_score !== null).length
      )
    : null;
  const topPriority = Math.max(
    ...data.members.map(m => m.priority_score || 0).filter(p => p > 0),
    0
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0 }}>Cluster: {data.cluster.label}</h1>
            <span className="badge badge-source-support-ticket">
              {memberCount} case{memberCount !== 1 ? "s" : ""}
            </span>
            {topPriority > 0 && (
              <span className={`badge ${getPriorityColor(topPriority)}`}>
                Top Priority: {topPriority}
              </span>
            )}
          </div>
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            Cluster ID: <span className="font-mono">{formatShortId(data.cluster.id)}</span>
          </p>
        </div>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-value">{memberCount}</span>
            <span className="metric-label">Total</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{readyMembers}</span>
            <span className="metric-label">Ready</span>
          </div>
          {avgPriority !== null && (
            <div className="metric-item">
              <span className="metric-value">{avgPriority}</span>
              <span className="metric-label">Avg Priority</span>
            </div>
          )}
        </div>
      </header>

      <section className="card">
        <h2>Member Cases ({memberCount})</h2>
        {data.members.length === 0 ? (
          <p className="muted" style={{ padding: "0.5rem" }}>No members yet.</p>
        ) : (
          <div className="list">
            {data.members.map((member) => (
              <Link key={member.id} className="list-item" to={`/case/${member.id}`}>
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                    <strong className="font-mono">{formatShortId(member.id)}</strong>
                    {member.status && (
                      <span className={`badge badge-small ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    )}
                    {member.similarity !== null && member.similarity !== undefined && (
                      <span className="badge badge-small badge-similarity">
                        {Math.round(member.similarity * 100)}% similar
                      </span>
                    )}
                  </div>
                  <p className="muted text-truncate">{member.snippet ?? "No snippet available"}</p>
                </div>
                {member.priority_score !== null && (
                  <span className={`badge badge-small ${getPriorityColor(member.priority_score)}`}>
                    {member.priority_score}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <Link to="/" style={{ color: "#60a5fa", fontSize: "0.85rem" }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
