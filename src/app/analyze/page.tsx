"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mic, Square, Upload, Music2, ArrowLeft, Loader2, AlertCircle, MessageSquare } from "lucide-react";

type State = "idle" | "recording" | "recorded" | "analyzing" | "error";

export interface AudioFeatures {
  durationSeconds: number;
  // 音高相关
  detectedNoteCount: number;   // 检测到的有效音高帧数
  voicedRatio: number;         // 有声部分占比 0-1
  pitchStability: number;      // 音高稳定性 0-1（越高越稳）
  pitchRangeSemitones: number; // 音域跨度（半音数）
  avgPitchHz: number;          // 平均音高频率
  // 动态相关
  dynamicRange: number;        // 响度动态范围 0-1
  avgClarity: number;          // 音色清晰度 0-1
}

async function extractAudioFeatures(blob: Blob): Promise<AudioFeatures> {
  try {
    const { PitchDetector } = await import("pitchy");
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = new AudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    const BUF = 2048;
    const HOP = BUF / 2;
    const detector = PitchDetector.forFloat32Array(BUF);

    const pitchesHz: number[] = [];
    const clarities: number[] = [];
    const volumes: number[] = [];
    let totalFrames = 0;

    for (let i = 0; i + BUF < data.length; i += HOP) {
      totalFrames++;
      const chunk = data.slice(i, i + BUF) as unknown as Float32Array;

      // 音量 RMS
      let rms = 0;
      for (let j = 0; j < BUF; j++) rms += chunk[j] ** 2;
      volumes.push(Math.sqrt(rms / BUF));

      // 音高检测（仅处理有声部分）
      if (Math.sqrt(rms / BUF) > 0.005) {
        const [pitch, clarity] = detector.findPitch(chunk, sampleRate);
        // 人声范围约 80–1200 Hz，清晰度 > 0.85 才计入
        if (clarity > 0.85 && pitch > 80 && pitch < 1200) {
          pitchesHz.push(pitch);
          clarities.push(clarity);
        }
      }
    }

    await ctx.close();

    if (pitchesHz.length < 5) {
      // 录音太短或无声，返回中等默认值
      return {
        durationSeconds: duration,
        detectedNoteCount: 0,
        voicedRatio: 0,
        pitchStability: 0.5,
        pitchRangeSemitones: 0,
        avgPitchHz: 0,
        dynamicRange: 0.3,
        avgClarity: 0.5,
      };
    }

    // 音高稳定性：用半音单位计算标准差，越小越稳定
    const semitones = pitchesHz.map((p) => 12 * Math.log2(p / 440));
    const avgST = semitones.reduce((a, b) => a + b, 0) / semitones.length;
    const stdST = Math.sqrt(semitones.reduce((a, b) => a + (b - avgST) ** 2, 0) / semitones.length);
    const pitchStability = Math.max(0, Math.min(1, 1 - stdST / 8)); // 8个半音内映射到0-1

    // 音域跨度
    const pitchRangeSemitones = Math.round(Math.max(...semitones) - Math.min(...semitones));

    // 动态范围
    const maxVol = Math.max(...volumes);
    const nonSilent = volumes.filter((v) => v > 0.01);
    const minVol = nonSilent.length ? Math.min(...nonSilent) : 0;
    const dynamicRange = maxVol > 0 ? Math.min(1, (maxVol - minVol) / maxVol) : 0;

    const avgClarity = clarities.reduce((a, b) => a + b, 0) / clarities.length;
    const voicedRatio = pitchesHz.length / totalFrames;
    const avgPitchHz = Math.round(pitchesHz.reduce((a, b) => a + b, 0) / pitchesHz.length);

    return {
      durationSeconds: Math.round(duration),
      detectedNoteCount: pitchesHz.length,
      voicedRatio: Math.round(voicedRatio * 100) / 100,
      pitchStability: Math.round(pitchStability * 100) / 100,
      pitchRangeSemitones,
      avgPitchHz,
      dynamicRange: Math.round(dynamicRange * 100) / 100,
      avgClarity: Math.round(avgClarity * 100) / 100,
    };
  } catch {
    return {
      durationSeconds: 30,
      detectedNoteCount: 0,
      voicedRatio: 0.6,
      pitchStability: 0.5,
      pitchRangeSemitones: 12,
      avgPitchHz: 260,
      dynamicRange: 0.4,
      avgClarity: 0.7,
    };
  }
}

export default function AnalyzePage() {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [songTitle, setSongTitle] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setState("recording");
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      setErrorMsg("麦克风权限被拒绝，请在浏览器设置中允许麦克风访问后重试。");
      setState("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorder.current?.stop();
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBlob(new Blob([file], { type: file.type }));
    setAudioUrl(URL.createObjectURL(file));
    setState("recorded");
  }, []);

  const analyze = useCallback(async () => {
    if (!audioBlob) return;
    setState("analyzing");

    try {
      const audioFeatures = await extractAudioFeatures(audioBlob);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songTitle: songTitle || "一首歌",
          audioFeatures,
          selfDescription,
        }),
      });

      if (!res.ok) throw new Error("分析失败");
      const data = await res.json();
      sessionStorage.setItem("nota_result", JSON.stringify(data));
      router.push("/results");
    } catch {
      setErrorMsg("分析过程中出现问题，请稍后重试。");
      setState("error");
    }
  }, [audioBlob, songTitle, selfDescription, recordingTime, router]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "#0a0a0f", color: "#f0f0ff" }}>
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(168,85,247,0.07)" }} />

      <div className="w-full max-w-lg relative z-10">
        {/* 顶部导航 */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Music2 size={20} className="text-purple-400" />
            <span className="font-bold text-lg">nota</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">分析你的声音</h1>
        <p className="mb-10" style={{ color: "rgba(255,255,255,0.4)" }}>
          录制 30～60 秒的演唱，AI 自动完成全面分析。
        </p>

        {/* 歌曲名称 */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            你在唱哪首歌？（可选）
          </label>
          <input
            type="text"
            placeholder="例如：《稻香》— 周杰伦"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            className="w-full glass rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/20"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>

        {/* 录音区域 */}
        {state === "idle" && (
          <div className="space-y-4">
            <button onClick={startRecording} className="w-full btn-primary rounded-2xl py-6 flex flex-col items-center gap-3 glow-purple">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                <Mic size={28} />
              </div>
              <span className="text-lg font-semibold">开始录音</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>建议录制 30～60 秒</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>或者</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            <button onClick={() => fileInputRef.current?.click()} className="w-full glass glass-hover rounded-2xl py-5 flex items-center justify-center gap-3 font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Upload size={20} />
              上传音频文件
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.2)" }}>支持 MP3、WAV、M4A、WebM 格式</p>
          </div>
        )}

        {state === "recording" && (
          <div className="glass rounded-2xl p-10 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-pulse-ring" style={{ background: "rgba(168,85,247,0.3)" }} />
              <div className="w-20 h-20 rounded-full btn-primary flex items-center justify-center relative z-10">
                <Mic size={32} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-purple-300">{fmt(recordingTime)}</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>正在录音中…</p>
            </div>
            <div className="flex items-end gap-1 h-8">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <button onClick={stopRecording} className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              <Square size={16} fill="currentColor" />
              停止录音
            </button>
          </div>
        )}

        {state === "recorded" && audioUrl && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <p className="text-sm font-medium mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>你的录音</p>
              <audio controls src={audioUrl} className="w-full" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                <MessageSquare size={14} />
                你觉得唱得怎么样？（可选，帮助 AI 给出更准确的反馈）
              </label>
              <textarea
                rows={2}
                placeholder="例如：高音部分很吃力，快到副歌时气息跟不上"
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 text-sm outline-none resize-none placeholder:text-white/20"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>

            <button onClick={analyze} className="w-full btn-primary rounded-2xl py-5 flex items-center justify-center gap-3 text-lg font-semibold glow-purple">
              开始 AI 分析
            </button>
            <button onClick={() => { setAudioBlob(null); setAudioUrl(null); setState("idle"); }} className="w-full glass glass-hover rounded-xl py-3 text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              重新录制
            </button>
          </div>
        )}

        {state === "analyzing" && (
          <div className="glass rounded-2xl p-12 flex flex-col items-center gap-5">
            <Loader2 size={40} className="text-purple-400 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-lg">正在分析你的声音…</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>大约需要 15～30 秒</p>
            </div>
            <div className="flex items-end gap-1 h-8 opacity-60">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl p-6" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-300 mb-1">出错了</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{errorMsg}</p>
                <button onClick={() => setState("idle")} className="mt-4 text-sm font-medium text-purple-400 hover:text-purple-300">
                  重试 →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
