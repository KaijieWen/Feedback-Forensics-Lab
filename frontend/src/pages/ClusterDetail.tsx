import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchCluster } from "../api";
import type { ClusterResponse } from "../types";

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

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Cluster</h1>
          <p className="muted">{data.cluster.label}</p>
        </div>
      </header>

      <section className="card">
        <h2>Member cases</h2>
        {data.members.length === 0 ? (
          <p className="muted">No members yet.</p>
        ) : (
          <div className="list">
            {data.members.map((member) => (
              <a key={member.id} className="list-item" href={`/case/${member.id}`}>
                <div>
                  <strong>{member.id}</strong>
                  <p className="muted">{member.snippet ?? "No snippet"}</p>
                </div>
                <span className="pill">
                  {member.priority_score ?? "-"}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
