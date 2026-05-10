"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Music2, ArrowLeft, ThumbsUp, AlertTriangle, BookOpen, ChevronRight, MusicIcon } from "lucide-react";
import { techniques } from "@/lib/techniques";
import { scoreColor, scoreLabel } from "@/lib/utils";

interface Tonality {
  detectedKeyZh: string; confidence: number;
  inKeyRatio: number; offKeyRatio: number; avgOffKeyCents: number; inTuneScore: number;
}
interface VoiceQuality {
  hnr: number; jitter: number; shimmer: number; shimmerDb: number; cpps: number; qualityScore: number;
}
interface Vibrato {
  detected: boolean; rate: number; extent: number; regularity: number; score: number;
}
interface SpectrumData {
  spr: number; centroid: number; tilt: number; flatness: number; brightness: number;
  lowRatio: number; midRatio: number; highRatio: number;
}

interface Analysis {
  overallScore: number;
  level: "beginner" | "intermediate" | "advanced";
  scores: { pitch: number; rhythm: number; tone: number; breath: number; expression: number };
  strengths: string[]; weaknesses: string[]; summary: string; recommendedTechniqueIds: string[];
  tonality?: Tonality;
  voiceQuality?: VoiceQuality;
  vibrato?: Vibrato;
  spectrum?: SpectrumData;
}

const scoreKeys = ["pitch", "rhythm", "tone", "breath", "expression"] as const;
const scoreLabels: Record<string, string> = {
  pitch: "音准",
  rhythm: "节奏",
  tone: "音色",
  breath: "气息",
  expression: "表现力",
};

const levelStyles = {
  beginner:     { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25", label: "初级" },
  intermediate: { text: "text-purple-400",  bg: "bg-purple-400/10",  border: "border-purple-400/25",  label: "中级" },
  advanced:     { text: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/25",   label: "高级" },
};

const scoreLabelCN = (score: number) => {
  if (score >= 85) return "优秀";
  if (score >= 70) return "良好";
  if (score >= 55) return "进步中";
  if (score >= 40) return "需要练习";
  return "入门阶段";
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
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{scoreLabelCN(score)}</span>
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
        {/* 顶部导航 */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/analyze" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Music2 size={20} className="text-purple-400" />
            <span className="font-bold text-lg">nota</span>
          </div>
        </div>

        {/* 综合得分 */}
        <div className="glass rounded-3xl p-8 mb-6 text-center glow-purple">
          <p className="text-sm font-medium mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>你的唱功得分</p>
          <CircleScore score={analysis.overallScore} />
          <div className={`inline-flex items-center gap-2 mt-5 px-4 py-1.5 rounded-full border text-sm font-semibold ${lvl.text} ${lvl.bg} ${lvl.border}`}>
            <div className="w-2 h-2 rounded-full" style={{ background: "currentColor" }} />
            {lvl.label}水平
          </div>
          <p className="mt-5 leading-relaxed text-sm max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            {analysis.summary}
          </p>
        </div>

        {/* 详细评分 */}
        <div className="glass rounded-2xl p-7 mb-6">
          <h2 className="font-semibold mb-5">各维度评分</h2>
          <div className="space-y-4">
            {scoreKeys.map((k, i) => (
              <ScoreBar key={k} label={scoreLabels[k]} score={analysis.scores[k]} delay={i * 100} />
            ))}
          </div>
        </div>

        {/* 调性跑音分析 */}
        {analysis.tonality && analysis.tonality.confidence > 20 && (
          <div className="glass rounded-2xl p-7 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <MusicIcon size={18} className="text-purple-400" />
              <h2 className="font-semibold">调性与跑音分析</h2>
              <span className="ml-auto text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(168,85,247,0.1)", color: "#c084fc" }}>
                检测调性：{analysis.tonality.detectedKeyZh}
              </span>
            </div>

            {/* 跑音评分环 */}
            <div className="flex items-center gap-6 mb-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="24"
                    fill="none"
                    stroke={analysis.tonality.inTuneScore >= 70 ? "#34d399" : analysis.tonality.inTuneScore >= 45 ? "#a855f7" : "#f87171"}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="150.8"
                    strokeDashoffset={150.8 - (analysis.tonality.inTuneScore / 100) * 150.8}
                    style={{ transition: "stroke-dashoffset 1.4s ease-out" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold">{analysis.tonality.inTuneScore}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>跑音</span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <span>在调音符</span>
                    <span className="text-emerald-400 font-semibold">{analysis.tonality.inKeyRatio}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-1000" style={{ width: `${analysis.tonality.inKeyRatio}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <span>跑调音符</span>
                    <span className="text-red-400 font-semibold">{analysis.tonality.offKeyRatio}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full bg-red-400 transition-all duration-1000" style={{ width: `${analysis.tonality.offKeyRatio}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p style={{ color: "rgba(255,255,255,0.35)" }} className="text-xs mb-1">平均跑调偏差</p>
                <p className="font-semibold">{analysis.tonality.avgOffKeyCents} <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>音分</span></p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p style={{ color: "rgba(255,255,255,0.35)" }} className="text-xs mb-1">调性置信度</p>
                <p className="font-semibold">{analysis.tonality.confidence}<span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>%</span></p>
              </div>
            </div>

            <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              * 100音分 = 1个半音。跑调偏差 &gt; 150音分表示明显跑调，&lt; 50音分属于正常波动。
            </p>
          </div>
        )}

        {/* 声音质量卡片（HNR / Jitter / Shimmer / CPPS） */}
        {analysis.voiceQuality && (
          <div className="glass rounded-2xl p-7 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">声音质量检测</h2>
              <span className="text-sm font-bold" style={{ color: analysis.voiceQuality.qualityScore>=70?"#34d399":analysis.voiceQuality.qualityScore>=45?"#a855f7":"#f87171" }}>
                {analysis.voiceQuality.qualityScore}/100
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label:"HNR 谐波噪声比", val:`${analysis.voiceQuality.hnr} dB`, ref:"理想 >20 dB", ok:analysis.voiceQuality.hnr>=20 },
                { label:"Jitter 基频抖动", val:`${analysis.voiceQuality.jitter}%`, ref:"理想 <0.5%", ok:analysis.voiceQuality.jitter<0.5 },
                { label:"Shimmer 振幅抖动", val:`${analysis.voiceQuality.shimmer}%`, ref:"理想 <3%", ok:analysis.voiceQuality.shimmer<3 },
                { label:"CPPS 倒谱峰突出", val:`${analysis.voiceQuality.cpps} dB`, ref:"理想 >14 dB", ok:analysis.voiceQuality.cpps>=14 },
              ].map((m,i)=>(
                <div key={i} className="rounded-xl p-3" style={{ background:"rgba(255,255,255,0.04)" }}>
                  <p className="text-xs mb-1" style={{ color:"rgba(255,255,255,0.35)" }}>{m.label}</p>
                  <p className="font-semibold" style={{ color:m.ok?"#34d399":"#f87171" }}>{m.val}</p>
                  <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.2)" }}>{m.ref}</p>
                </div>
              ))}
            </div>
            {analysis.spectrum && (
              <div className="mt-4 pt-4" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-medium mb-3" style={{ color:"rgba(255,255,255,0.4)" }}>频谱分析（对标混音 EQ 标准）</p>
                <div className="space-y-2">
                  {[
                    { label:"低频（胸腔/厚度）", val:Math.round(analysis.spectrum.lowRatio*100), color:"#60a5fa" },
                    { label:"中频（人声核心）", val:Math.round(analysis.spectrum.midRatio*100), color:"#a855f7" },
                    { label:"高频（亮度/穿透）", val:Math.round(analysis.spectrum.highRatio*100), color:"#f59e0b" },
                  ].map((b,i)=>(
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="w-28 shrink-0" style={{ color:"rgba(255,255,255,0.5)" }}>{b.label}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background:"rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width:`${Math.min(b.val*2,100)}%`, background:b.color }} />
                      </div>
                      <span className="w-8 text-right font-mono" style={{ color:b.color }}>{b.val}%</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-3 text-xs" style={{ color:"rgba(255,255,255,0.35)" }}>
                  <span>SPR: <span className="font-semibold" style={{ color:analysis.spectrum.spr>0?"#34d399":"#f87171" }}>{analysis.spectrum.spr>0?"+":""}{analysis.spectrum.spr}dB</span></span>
                  <span>质心: {analysis.spectrum.centroid}Hz</span>
                  <span>斜率: {analysis.spectrum.tilt}dB/oct</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 颤音分析 */}
        {analysis.vibrato && (
          <div className="glass rounded-2xl p-7 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">颤音（Vibrato）分析</h2>
              <span className="text-xs px-3 py-1 rounded-full" style={{
                background: analysis.vibrato.detected?"rgba(168,85,247,0.15)":"rgba(255,255,255,0.05)",
                color: analysis.vibrato.detected?"#c084fc":"rgba(255,255,255,0.3)"
              }}>
                {analysis.vibrato.detected?"检测到颤音":"未检测到颤音"}
              </span>
            </div>
            {analysis.vibrato.detected ? (
              <div className="grid grid-cols-3 gap-3 text-sm">
                {[
                  { label:"速率", val:`${analysis.vibrato.rate} Hz`, ref:"理想 4.5-6.5", ok:analysis.vibrato.rate>=4.5&&analysis.vibrato.rate<=6.5 },
                  { label:"深度", val:`${analysis.vibrato.extent}¢`, ref:"理想 50-120 音分", ok:analysis.vibrato.extent>=50&&analysis.vibrato.extent<=120 },
                  { label:"规律性", val:`${analysis.vibrato.regularity}%`, ref:">60% 为稳定", ok:analysis.vibrato.regularity>=60 },
                ].map((m,i)=>(
                  <div key={i} className="rounded-xl p-3" style={{ background:"rgba(255,255,255,0.04)" }}>
                    <p className="text-xs mb-1" style={{ color:"rgba(255,255,255,0.35)" }}>{m.label}</p>
                    <p className="font-semibold" style={{ color:m.ok?"#34d399":"#f59e0b" }}>{m.val}</p>
                    <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.2)" }}>{m.ref}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color:"rgba(255,255,255,0.4)" }}>
                演唱中未发现 4–8 Hz 的规律音高振荡。颤音能让长音更有温度和专业感，建议学习颤音入门技巧。
              </p>
            )}
          </div>
        )}

        {/* 优势与不足 */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-2xl p-6" style={{ borderColor: "rgba(52,211,153,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp size={16} className="text-emerald-400" />
              <h3 className="font-semibold text-emerald-400">你的优势</h3>
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
              <h3 className="font-semibold text-amber-400">需要提升</h3>
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

        {/* 推荐训练计划 */}
        {recommended.length > 0 && (
          <div className="glass rounded-2xl p-7 mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-purple-400" />
                <h2 className="font-semibold">你的专属训练计划</h2>
              </div>
              <Link href="/learn" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                查看全部 <ChevronRight size={12} />
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

        {/* 底部按钮 */}
        <div className="flex gap-3">
          <Link href="/analyze" className="flex-1 glass glass-hover rounded-xl py-3.5 text-center text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
            再次分析
          </Link>
          <Link href="/learn" className="flex-1 btn-primary rounded-xl py-3.5 text-center text-sm font-semibold">
            开始训练 →
          </Link>
        </div>
      </div>
    </div>
  );
}
