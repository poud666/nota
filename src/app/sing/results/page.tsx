"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Music2, ArrowLeft, ThumbsUp, AlertTriangle, BookOpen, ChevronRight, Mic } from "lucide-react";
import { techniques } from "@/lib/techniques";

interface PitchCompare {
  totalComparable: number;
  inTuneFrames: number;
  slightOffFrames: number;
  offTuneFrames: number;
  inTuneRatio: number;
  avgDeviationCents: number;
  pitchAccuracyScore: number;
}

interface SingResult {
  overallScore: number;
  level: "beginner" | "intermediate" | "advanced";
  scores: { pitch: number; rhythm: number; tone: number; breath: number; expression: number };
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendedTechniqueIds: string[];
  pitchCompare: PitchCompare;
}

const levelStyles = {
  beginner:     { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25", label: "初级" },
  intermediate: { text: "text-purple-400",  bg: "bg-purple-400/10",  border: "border-purple-400/25",  label: "中级" },
  advanced:     { text: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/25",   label: "高级" },
};

const scoreLabels: Record<string, string> = {
  pitch: "音准", rhythm: "节奏", tone: "音色", breath: "气息", expression: "表现力"
};

function scoreColor(s: number) {
  if (s >= 80) return "#34d399";
  if (s >= 60) return "#a855f7";
  if (s >= 40) return "#f59e0b";
  return "#f87171";
}

function ScoreBar({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(score), 100 + delay); return () => clearTimeout(t); }, [score, delay]);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
        <span className="font-semibold" style={{ color: scoreColor(score) }}>{score}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${w}%`, background: scoreColor(score) }} />
      </div>
    </div>
  );
}

function CircleScore({ score }: { score: number }) {
  const [offset, setOffset] = useState(251.2);
  useEffect(() => { const t = setTimeout(() => setOffset(251.2 - (score / 100) * 251.2), 200); return () => clearTimeout(t); }, [score]);
  const label = score >= 85 ? "优秀" : score >= 70 ? "良好" : score >= 55 ? "进步中" : score >= 40 ? "需要练习" : "入门阶段";
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="44" cy="44" r="40" fill="none" stroke={scoreColor(score)} strokeWidth="6"
          strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{score}</span>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
    </div>
  );
}

export default function SingResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<SingResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("nota_sing_result");
    if (!raw) { router.replace("/sing"); return; }
    const { songTitle, duration, pitchCompare } = JSON.parse(raw);

    fetch("/api/sing-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songTitle, duration, pitchCompare }),
    })
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false); })
      .catch(() => { router.replace("/sing"); });
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f", color: "#f0f0ff" }}>
      <div className="text-center space-y-4">
        <div className="flex items-end gap-1 justify-center h-10">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)" }}>AI 正在分析你的演唱…</p>
      </div>
    </div>
  );

  if (!result) return null;
  const lvl = levelStyles[result.level];
  const pc = result.pitchCompare;
  const recommended = techniques.filter(t => result.recommendedTechniqueIds.includes(t.id));

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: "#0a0a0f", color: "#f0f0ff" }}>
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(168,85,247,0.06)" }} />
      <div className="max-w-2xl mx-auto relative z-10">

        {/* 顶栏 */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/sing" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Music2 size={20} className="text-purple-400" />
            <span className="font-bold text-lg">nota</span>
          </div>
        </div>

        {/* 综合得分 */}
        <div className="glass rounded-3xl p-8 mb-6 text-center glow-purple">
          <p className="text-sm font-medium mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>演唱成绩</p>
          <CircleScore score={result.overallScore} />
          <div className={`inline-flex items-center gap-2 mt-5 px-4 py-1.5 rounded-full border text-sm font-semibold ${lvl.text} ${lvl.bg} ${lvl.border}`}>
            <div className="w-2 h-2 rounded-full" style={{ background: "currentColor" }} />
            {lvl.label}水平
          </div>
          <p className="mt-5 leading-relaxed text-sm max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            {result.summary}
          </p>
        </div>

        {/* 伴奏对比音准卡片 */}
        <div className="glass rounded-2xl p-7 mb-6">
          <h2 className="font-semibold mb-5">伴奏对比音准</h2>
          {/* 三段式分布 */}
          <div className="flex rounded-xl overflow-hidden h-10 mb-4 text-xs font-semibold">
            <div className="flex items-center justify-center transition-all duration-1000"
              style={{ width: `${pc.totalComparable > 0 ? (pc.inTuneFrames / pc.totalComparable) * 100 : 0}%`,
                background: "rgba(52,211,153,0.3)", color: "#34d399", minWidth: pc.inTuneFrames > 0 ? "2rem" : 0 }}>
              {pc.totalComparable > 0 ? `${Math.round(pc.inTuneFrames / pc.totalComparable * 100)}%` : ""}
            </div>
            <div className="flex items-center justify-center"
              style={{ width: `${pc.totalComparable > 0 ? (pc.slightOffFrames / pc.totalComparable) * 100 : 0}%`,
                background: "rgba(245,158,11,0.3)", color: "#f59e0b", minWidth: pc.slightOffFrames > 0 ? "2rem" : 0 }}>
              {pc.totalComparable > 0 && pc.slightOffFrames > 0 ? `${Math.round(pc.slightOffFrames / pc.totalComparable * 100)}%` : ""}
            </div>
            <div className="flex items-center justify-center"
              style={{ width: `${pc.totalComparable > 0 ? (pc.offTuneFrames / pc.totalComparable) * 100 : 0}%`,
                background: "rgba(248,113,113,0.3)", color: "#f87171", minWidth: pc.offTuneFrames > 0 ? "2rem" : 0 }}>
              {pc.totalComparable > 0 && pc.offTuneFrames > 0 ? `${Math.round(pc.offTuneFrames / pc.totalComparable * 100)}%` : ""}
            </div>
          </div>
          <div className="flex gap-4 text-xs mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />在调（±50音分）</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />轻微跑调</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />明显跑调</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { label: "在调率", val: `${pc.inTuneRatio}%`, color: pc.inTuneRatio >= 70 ? "#34d399" : pc.inTuneRatio >= 50 ? "#f59e0b" : "#f87171" },
              { label: "平均偏差", val: `${pc.avgDeviationCents}¢`, color: pc.avgDeviationCents <= 50 ? "#34d399" : pc.avgDeviationCents <= 100 ? "#f59e0b" : "#f87171" },
              { label: "音准得分", val: `${pc.pitchAccuracyScore}`, color: scoreColor(pc.pitchAccuracyScore) },
            ].map((m, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</p>
                <p className="text-xl font-bold" style={{ color: m.color }}>{m.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 详细评分 */}
        <div className="glass rounded-2xl p-7 mb-6">
          <h2 className="font-semibold mb-5">各维度评分</h2>
          <div className="space-y-4">
            {(Object.keys(scoreLabels) as (keyof typeof result.scores)[]).map((k, i) => (
              <ScoreBar key={k} label={scoreLabels[k]} score={result.scores[k]} delay={i * 100} />
            ))}
          </div>
        </div>

        {/* 优势与不足 */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-2xl p-6" style={{ borderColor: "rgba(52,211,153,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp size={16} className="text-emerald-400" />
              <h3 className="font-semibold text-emerald-400">你的优势</h3>
            </div>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span className="text-emerald-400 mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-6" style={{ borderColor: "rgba(251,146,60,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-400" />
              <h3 className="font-semibold text-amber-400">需要提升</h3>
            </div>
            <ul className="space-y-2">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span className="text-amber-400 mt-0.5">→</span>{w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 推荐训练 */}
        {recommended.length > 0 && (
          <div className="glass rounded-2xl p-7 mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-purple-400" />
                <h2 className="font-semibold">针对性训练计划</h2>
              </div>
              <Link href="/learn" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                查看全部 <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {recommended.map(t => (
                <Link key={t.id} href={`/learn?technique=${t.id}`}
                  className="glass glass-hover rounded-xl p-4 flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(168,85,247,0.15)" }}>
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

        {/* 底部按钮 */}
        <div className="flex gap-3">
          <Link href="/sing" className="flex-1 glass glass-hover rounded-xl py-3.5 text-center text-sm font-semibold flex items-center justify-center gap-2"
            style={{ color: "rgba(255,255,255,0.6)" }}>
            <Mic size={16} /> 再唱一次
          </Link>
          <Link href="/learn" className="flex-1 btn-primary rounded-xl py-3.5 text-center text-sm font-semibold">
            开始训练 →
          </Link>
        </div>
      </div>
    </div>
  );
}
