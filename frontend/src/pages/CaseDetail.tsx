import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchCase } from "../api";
import type { CaseResponse } from "../types";

export function CaseDetail() {
  const { id } = useParams();
  const [data, setData] = useState<CaseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("Missing case id");
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const response = await fetchCase(id);
        if (active) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load case");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    const interval = setInterval(load, 6000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return <div className="page">Loading case...</div>;
  }

  if (error || !data) {
    return (
      <div className="page">
        <p className="muted">{error ?? "Case not available."}</p>
      </div>
    );
  }

  const caseJson = data.caseFile?.case_json as Record<string, unknown> | undefined;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Case {data.feedback.id}</h1>
          <p className="muted">{data.feedback.snippet}</p>
        </div>
        <span className={`status ${data.feedback.status}`}>
          {data.feedback.status}
        </span>
      </header>

      <section className="card">
        <h2>Case file</h2>
        {data.caseFile ? (
          <div className="grid two-col">
            <div>
              <p>
                <strong>Priority</strong>: {data.caseFile.priority_score}
              </p>
              <p>
                <strong>Cluster</strong>:{" "}
                {data.caseFile.cluster_id ? (
                  <a href={`/cluster/${data.caseFile.cluster_id}`}>
                    {data.caseFile.cluster_id}
                  </a>
                ) : (
                  "Unassigned"
                )}
              </p>
              <p className="muted">Updated {data.caseFile.updated_at}</p>
            </div>
            <div>
              <pre className="code-block">
                {JSON.stringify(caseJson, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p className="muted">Case file not ready yet.</p>
        )}
      </section>

      <section className="card">
        <h2>Similar evidence</h2>
        {data.similar.length === 0 ? (
          <p className="muted">No similar feedback found yet.</p>
        ) : (
          <div className="list">
            {data.similar.map((item) => (
              <a key={item.id} className="list-item" href={`/case/${item.id}`}>
                <div>
                  <strong>{item.id}</strong>
                  <p className="muted">{item.snippet ?? "No snippet"}</p>
                </div>
                <span className="pill">
                  {item.score ? item.score.toFixed(2) : "-"}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
