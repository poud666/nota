"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Music2, ArrowLeft, ThumbsUp, AlertTriangle, BookOpen, ChevronRight } from "lucide-react";
import { techniques } from "@/lib/techniques";
import { scoreColor, scoreLabel } from "@/lib/utils";

interface Analysis {
  overallScore: number;
  level: "beginner" | "intermediate" | "advanced";
  scores: { pitch: number; rhythm: number; tone: number; breath: number; expression: number };
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendedTechniqueIds: string[];
}

const scoreKeys = ["pitch", "rhythm", "tone", "breath", "expression"] as const;
const scoreLabels: Record<string, string> = {
  pitch: "Pitch Accuracy",
  rhythm: "Rhythm & Timing",
  tone: "Tone Quality",
  breath: "Breath Control",
  expression: "Expression",
};

const levelStyles = {
  beginner: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25", label: "Beginner" },
  intermediate: { text: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/25", label: "Intermediate" },
  advanced: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/25", label: "Advanced" },
};

function ScoreBar({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 100 + delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
        <span className="font-semibold" style={{ color: scoreColor(score) }}>{score}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, background: scoreColor(score) }}
        />
      </div>
    </div>
  );
}

function CircleScore({ score }: { score: number }) {
  const [offset, setOffset] = useState(251.2);
  useEffect(() => {
    const t = setTimeout(() => setOffset(251.2 - (score / 100) * 251.2), 200);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="44" cy="44" r="40"
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="251.2"
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{score}</span>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("nota_result");
    if (!raw) { router.replace("/analyze"); return; }
    setAnalysis(JSON.parse(raw));
  }, [router]);

  if (!analysis) return null;

  const lvl = levelStyles[analysis.level];
  const recommended = techniques.filter((t) => analysis.recommendedTechniqueIds.includes(t.id));

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: "#0a0a0f", color: "#f0f0ff" }}>
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(168,85,247,0.06)" }} />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/analyze" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Music2 size={20} className="text-purple-400" />
            <span className="font-bold text-lg">nota</span>
          </div>
        </div>

        {/* Overall score */}
        <div className="glass rounded-3xl p-8 mb-6 text-center glow-purple">
          <p className="text-sm font-medium mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>Your Vocal Score</p>
          <CircleScore score={analysis.overallScore} />
          <div className={`inline-flex items-center gap-2 mt-5 px-4 py-1.5 rounded-full border text-sm font-semibold ${lvl.text} ${lvl.bg} ${lvl.border}`}>
            <div className={`w-2 h-2 rounded-full ${lvl.text.replace("text-", "bg-")}`} />
            {lvl.label} Level
          </div>
          <p className="mt-5 leading-relaxed text-sm max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            {analysis.summary}
          </p>
        </div>

        {/* Score breakdown */}
        <div className="glass rounded-2xl p-7 mb-6">
          <h2 className="font-semibold mb-5">Score Breakdown</h2>
          <div className="space-y-4">
            {scoreKeys.map((k, i) => (
              <ScoreBar key={k} label={scoreLabels[k]} score={analysis.scores[k]} delay={i * 100} />
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-2xl p-6" style={{ borderColor: "rgba(52,211,153,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp size={16} className="text-emerald-400" />
              <h3 className="font-semibold text-emerald-400">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-6" style={{ borderColor: "rgba(251,146,60,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-400" />
              <h3 className="font-semibold text-amber-400">Work On</h3>
            </div>
            <ul className="space-y-2">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span className="text-amber-400 mt-0.5">→</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommended techniques */}
        {recommended.length > 0 && (
          <div className="glass rounded-2xl p-7 mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-purple-400" />
                <h2 className="font-semibold">Your Training Plan</h2>
              </div>
              <Link href="/learn" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                See all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {recommended.map((t) => (
                <Link key={t.id} href={`/learn?technique=${t.id}`} className="glass glass-hover rounded-xl p-4 flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(168,85,247,0.15)" }}>
                    <BookOpen size={16} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{t.category}</p>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-purple-400 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-3">
          <Link href="/analyze" className="flex-1 glass glass-hover rounded-xl py-3.5 text-center text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
            Analyze Again
          </Link>
          <Link href="/learn" className="flex-1 btn-primary rounded-xl py-3.5 text-center text-sm font-semibold">
            Start Training →
          </Link>
        </div>
      </div>
    </div>
  );
}
