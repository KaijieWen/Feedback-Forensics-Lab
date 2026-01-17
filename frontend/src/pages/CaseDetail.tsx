import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCase } from "../api";
import type { CaseResponse } from "../types";
import {
  getStatusColor,
  getSourceColor,
  getCategoryColor,
  getPriorityColor,
  getUrgencyColor,
  getSentimentColor,
  formatShortId
} from "../utils/badges";

interface CaseFileData {
  summary?: string;
  category?: "bug" | "confusion" | "feature" | "praise" | "other";
  sentiment?: number;
  urgency?: number;
  product_area?: string;
  repro_steps_md?: string;
  clarifying_question?: string;
  jurors?: Array<{
    persona: string;
    priority: number;
    rationale: string;
  }>;
  keywords?: string[];
  cluster_hint?: string;
  priority_score?: number;
}

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

  const caseJson = (data.caseFile?.case_json as CaseFileData | undefined) || {};
  const caseFile = data.caseFile;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0 }}>Case {formatShortId(data.feedback.id)}</h1>
            <span className={`badge ${getSourceColor(data.feedback.source)}`}>
              {data.feedback.source.replace(/_/g, " ")}
            </span>
            <span className={`badge ${getStatusColor(data.feedback.status)}`}>
              {data.feedback.status}
            </span>
            {caseJson.category && (
              <span className={`badge ${getCategoryColor(caseJson.category)}`}>
                {caseJson.category}
              </span>
            )}
            {caseJson.urgency !== undefined && (
              <span className={`badge ${getUrgencyColor(caseJson.urgency)}`}>
                Urgency: {caseJson.urgency}/5
              </span>
            )}
            {caseFile && (
              <span className={`badge ${getPriorityColor(caseFile.priority_score)}`}>
                Priority: {caseFile.priority_score}
              </span>
            )}
          </div>
          {data.feedback.title && (
            <h2 style={{ fontSize: "1.1rem", margin: "0.5rem 0", fontWeight: 600 }}>
              {data.feedback.title}
            </h2>
          )}
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            {data.feedback.snippet}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap", fontSize: "0.8rem" }}>
            <span className="muted">Created: {new Date(data.feedback.created_at).toLocaleString()}</span>
            {caseFile && (
              <span className="muted">Updated: {new Date(caseFile.updated_at).toLocaleString()}</span>
            )}
          </div>
        </div>
      </header>

      {caseFile && (
        <>
          <section className="card">
            <h2>Analysis Summary</h2>
            <div className="grid two-col">
              <div>
                <div className="badge-group" style={{ marginBottom: "1rem" }}>
                  {caseJson.category && (
                    <span className={`badge ${getCategoryColor(caseJson.category)}`}>
                      {caseJson.category}
                    </span>
                  )}
                  {caseJson.urgency !== undefined && (
                    <span className={`badge ${getUrgencyColor(caseJson.urgency)}`}>
                      U{caseJson.urgency}
                    </span>
                  )}
                  {caseJson.sentiment !== undefined && (
                    <span className={`badge ${getSentimentColor(caseJson.sentiment)}`}>
                      {caseJson.sentiment > 0.2 ? "Positive" : caseJson.sentiment < -0.2 ? "Negative" : "Neutral"}
                    </span>
                  )}
                  <span className={`badge ${getPriorityColor(caseFile.priority_score)}`}>
                    Priority: {caseFile.priority_score}
                  </span>
                </div>
                
                {caseJson.summary && (
                  <div className="info-box" style={{ marginBottom: "0.75rem" }}>
                    <strong style={{ display: "block", marginBottom: "0.25rem" }}>Summary:</strong>
                    {caseJson.summary}
                  </div>
                )}

                {caseJson.product_area && (
                  <p style={{ margin: "0.5rem 0", fontSize: "0.85rem" }}>
                    <strong>Product Area:</strong> {caseJson.product_area}
                  </p>
                )}

                {caseFile.cluster_id && (
                  <p style={{ margin: "0.5rem 0", fontSize: "0.85rem" }}>
                    <strong>Cluster:</strong>{" "}
                    <Link to={`/cluster/${caseFile.cluster_id}`} style={{ color: "#60a5fa" }}>
                      {formatShortId(caseFile.cluster_id)}
                    </Link>
                  </p>
                )}

                {caseJson.keywords && caseJson.keywords.length > 0 && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>Keywords:</strong>
                    <div className="badge-group">
                      {caseJson.keywords.map((keyword, idx) => (
                        <span key={idx} className="badge badge-small badge-source-email">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {caseJson.jurors && caseJson.jurors.length > 0 && (
                <div>
                  <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "0.5rem" }}>Juror Votes:</strong>
                  <div className="list">
                    {caseJson.jurors.map((juror, idx) => (
                      <div key={idx} className="info-box" style={{ padding: "0.625rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{juror.persona}</span>
                          <span className={`badge badge-small ${getPriorityColor(juror.priority * 20)}`}>
                            P{juror.priority}/5
                          </span>
                        </div>
                        <p className="muted" style={{ fontSize: "0.75rem", margin: 0 }}>
                          {juror.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {caseJson.repro_steps_md && (
            <section className="card">
              <h2>Reproduction Steps</h2>
              <div className="info-box warning">
                <div style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
                  {caseJson.repro_steps_md}
                </div>
              </div>
            </section>
          )}

          {caseJson.clarifying_question && (
            <section className="card">
              <h2>Clarifying Question</h2>
              <div className="info-box">
                <strong>Question:</strong> {caseJson.clarifying_question}
              </div>
            </section>
          )}
        </>
      )}

      {!caseFile && (
        <section className="card">
          <div className="info-box warning">
            Case file is still being processed. Status: <span className={`badge badge-small ${getStatusColor(data.feedback.status)}`}>
              {data.feedback.status}
            </span>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Similar Evidence ({data.similar.length})</h2>
        {data.similar.length === 0 ? (
          <p className="muted" style={{ padding: "0.5rem" }}>No similar feedback found yet.</p>
        ) : (
          <div className="list">
            {data.similar.map((item) => (
              <Link key={item.id} className="list-item" to={`/case/${item.id}`}>
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                    <strong className="font-mono">{formatShortId(item.id)}</strong>
                    {item.score !== null && item.score !== undefined && (
                      <span className="badge badge-small badge-similarity">
                        {Math.round(item.score * 100)}% match
                      </span>
                    )}
                    {item.priority_score !== null && (
                      <span className={`badge badge-small ${getPriorityColor(item.priority_score)}`}>
                        {item.priority_score}
                      </span>
                    )}
                  </div>
                  <p className="muted text-truncate">{item.snippet ?? "No snippet available"}</p>
                </div>
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
