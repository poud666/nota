export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function scoreColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#a855f7";
  if (score >= 40) return "#f59e0b";
  return "#f87171";
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Developing";
  if (score >= 40) return "Needs Work";
  return "Beginner";
}

export function levelFromScore(overall: number): "beginner" | "intermediate" | "advanced" {
  if (overall >= 75) return "advanced";
  if (overall >= 50) return "intermediate";
  return "beginner";
}
