// Badge utility functions for color coding

export type Status = "ready" | "processing" | "queued" | "failed";
export type Source = "github" | "discord" | "support_ticket" | "twitter" | "email" | "forum";
export type Category = "bug" | "feature" | "confusion" | "praise" | "other";
export type PriorityLevel = "high" | "medium" | "low";

export function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "ready") return "badge-status-ready";
  if (s === "processing") return "badge-status-processing";
  if (s === "queued") return "badge-status-queued";
  if (s === "failed") return "badge-status-failed";
  return "badge-status-default";
}

export function getSourceColor(source: string): string {
  const s = source.toLowerCase().replace(/_/g, "-");
  return `badge-source-${s}`;
}

export function getCategoryColor(category: string | null | undefined): string {
  if (!category) return "badge-category-other";
  const c = category.toLowerCase();
  return `badge-category-${c}`;
}

export function getPriorityLevel(score: number | null | undefined): PriorityLevel {
  if (score === null || score === undefined) return "medium";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function getPriorityColor(score: number | null | undefined): string {
  const level = getPriorityLevel(score);
  return `badge-priority-${level}`;
}

export function getUrgencyColor(urgency: number | null | undefined): string {
  if (!urgency || urgency < 1 || urgency > 5) return "badge-urgency-3";
  return `badge-urgency-${Math.round(urgency)}`;
}

export function formatPriority(score: number | null | undefined): string {
  if (score === null || score === undefined) return "-";
  return String(score);
}

export function formatShortId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}...`;
}

export function getSentimentColor(sentiment: number | null | undefined): string {
  if (sentiment === null || sentiment === undefined) return "badge-sentiment-neutral";
  if (sentiment > 0.2) return "badge-sentiment-positive";
  if (sentiment < -0.2) return "badge-sentiment-negative";
  return "badge-sentiment-neutral";
}
