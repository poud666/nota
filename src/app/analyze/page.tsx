"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mic, Square, Upload, Music2, ArrowLeft, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { analyzeAudio } from "@/lib/audioAnalysis";

type State = "idle" | "recording" | "recorded" | "analyzing" | "error";

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
      // 客户端真实音频分析：音准 + 节奏 + 气息 + 频谱
      const audioFeatures = await analyzeAudio(audioBlob);

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
  }, [audioBlob, songTitle, selfDescription, router]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "#0a0a0f", color: "#f0f0ff" }}>
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(168,85,247,0.07)" }} />
      <div className="w-full max-w-lg relative z-10">

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
          录制 30～60 秒的演唱，AI 分析音准、节奏、气息和频谱特征。
        </p>

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
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>正在检测音准、节奏、气息和频谱，约需 15～30 秒</p>
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
                <button onClick={() => setState("idle")} className="mt-4 text-sm font-medium text-purple-400 hover:text-purple-300">重试 →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
