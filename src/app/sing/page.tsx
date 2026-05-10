"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Music2, ArrowLeft, Upload, Play, Square, Loader2, AlertCircle, Headphones } from "lucide-react";
import { extractReferenceF0, hzToNoteName, centsDiff, summarize, type RefFrame, THRESH_IN_TUNE, THRESH_ACCEPTABLE } from "@/lib/pitchCompare";
import type { PitchFrame } from "@/components/PitchChart";
import { analyzeAudio } from "@/lib/audioAnalysis";

type State = "setup" | "loading" | "ready" | "countdown" | "singing" | "processing" | "error";

const HOP = 512;
const BUF = 2048;

function deviationColor(cents: number): string {
  if (cents === Infinity || cents > THRESH_ACCEPTABLE) return "#f87171";
  if (cents > THRESH_IN_TUNE) return "#f59e0b";
  return "#34d399";
}

export default function SingPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("setup");
  const [songTitle, setSongTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [currentDeviation, setCurrentDeviation] = useState(Infinity);
  const [currentNote, setCurrentNote] = useState("--");
  const [inTuneRatio, setInTuneRatio] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [processingMsg, setProcessingMsg] = useState("正在生成分析报告…");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const backingBufferRef = useRef<AudioBuffer | null>(null);
  const refFramesRef = useRef<RefFrame[]>([]);
  const voiceF0sRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const elapsedRef = useRef(0);
  const pitchFramesRef = useRef<PitchFrame[]>([]);  // 降采样时间戳帧
  const lastFrameTimeRef = useRef(0);               // 控制降采样间隔
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState("loading");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = new AudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      await ctx.close();
      backingBufferRef.current = audioBuffer;
      refFramesRef.current = await extractReferenceF0(audioBuffer, HOP);
      setState("ready");
    } catch {
      setErrorMsg("无法解析音频文件，请换一个格式试试（MP3/WAV/M4A）。");
      setState("error");
    }
  }, []);

  const startSinging = useCallback(async () => {
    setState("countdown");
    setCountdown(3);
    let c = 3;
    const cd = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) { clearInterval(cd); beginSinging(); }
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const beginSinging = useCallback(async () => {
    if (!backingBufferRef.current) return;
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });
      micStreamRef.current = micStream;

      // ── MediaRecorder：录制人声供后期完整分析 ──────────────────────
      recordChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(micStream, { mimeType });
      recorder.ondataavailable = e => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      recorder.start(100); // 每 100ms 收集一次
      mediaRecorderRef.current = recorder;

      // ── AudioContext：实时音准检测 ────────────────────────────────
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createBufferSource();
      source.buffer = backingBufferRef.current;
      source.connect(ctx.destination);
      source.start();
      startTimeRef.current = ctx.currentTime;

      const micSource = ctx.createMediaStreamSource(micStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = BUF;
      micSource.connect(analyser);
      analyserRef.current = analyser;

      voiceF0sRef.current = [];
      pitchFramesRef.current = [];
      lastFrameTimeRef.current = 0;
      setState("singing");
      setElapsed(0);
      elapsedRef.current = 0;

      timerRef.current = setInterval(() => {
        const t = Math.round(ctx.currentTime - startTimeRef.current);
        setElapsed(t);
        elapsedRef.current = t;
      }, 500);

      const { PitchDetector } = await import("pitchy");
      const detector = PitchDetector.forFloat32Array(BUF);
      const buf = new Float32Array(BUF);
      let inTuneCount = 0, totalCount = 0;

      const detect = () => {
        analyser.getFloatTimeDomainData(buf);
        const [pitch, clarity] = detector.findPitch(buf, ctx.sampleRate);
        const elapsedNow = ctx.currentTime - startTimeRef.current;
        const frame = Math.floor(elapsedNow * ctx.sampleRate / HOP);
        const refFrame = refFramesRef.current[frame];
        const voiceHz = clarity > 0.85 && pitch > 60 && pitch < 1500 ? pitch : 0;
        voiceF0sRef.current.push(voiceHz);

        if (voiceHz > 0 && refFrame && refFrame.f0 > 0) {
          const dev = centsDiff(voiceHz, refFrame.f0);
          setCurrentDeviation(dev);
          setCurrentNote(hzToNoteName(voiceHz));
          totalCount++;
          if (dev <= THRESH_IN_TUNE) inTuneCount++;
          setInTuneRatio(Math.round((inTuneCount / totalCount) * 100));
        } else if (voiceHz > 0) {
          setCurrentNote(hzToNoteName(voiceHz));
          setCurrentDeviation(Infinity);
        } else {
          setCurrentNote("--");
        }

        // 每 100ms 采集一帧用于走势图（降采样）
        const elapsedNowSec = elapsedNow;
        if (elapsedNowSec - lastFrameTimeRef.current >= 0.1) {
          pitchFramesRef.current.push({
            t: Math.round(elapsedNowSec * 10) / 10,
            voice: voiceHz,
            ref: refFrame?.f0 ?? 0,
          });
          lastFrameTimeRef.current = elapsedNowSec;
        }

        if (elapsedNow >= (backingBufferRef.current?.duration ?? 0)) {
          stopSinging(); return;
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);
      source.onended = () => stopSinging();
    } catch {
      setErrorMsg("无法获取麦克风权限，请允许后重试。");
      setState("error");
    }
  }, []);

  const stopSinging = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    audioCtxRef.current?.close();
    setState("processing");

    // 停止 MediaRecorder，然后做完整分析
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = async () => {
        micStreamRef.current?.getTracks().forEach(t => t.stop());
        await runFullAnalysis();
      };
      recorder.stop();
    } else {
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      runFullAnalysis();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runFullAnalysis = useCallback(async () => {
    const pitchCompare = summarize(voiceF0sRef.current, refFramesRef.current);

    // ── 完整声乐分析（HNR / Jitter / Shimmer / CPPS / Vibrato / 频谱…）──
    setProcessingMsg("正在分析声音质量…");
    let audioFeatures = null;
    try {
      const voiceBlob = new Blob(recordChunksRef.current, { type: "audio/webm" });
      if (voiceBlob.size > 1000) {
        audioFeatures = await analyzeAudio(voiceBlob);
      }
    } catch (e) {
      console.warn("完整分析失败，继续使用音准数据", e);
    }

    setProcessingMsg("AI 正在生成评分报告…");
    sessionStorage.setItem("nota_sing_result", JSON.stringify({
      songTitle,
      duration: elapsedRef.current,
      pitchCompare,
      audioFeatures,
      pitchFrames: pitchFramesRef.current,
    }));
    router.push("/sing/results");
  }, [songTitle, router]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const devColor = deviationColor(currentDeviation);
  const needlePos = currentDeviation === Infinity
    ? 50
    : Math.max(5, Math.min(95, 50 + (currentDeviation > 100 ? 40 : currentDeviation * 0.4)));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "#0a0a0f", color: "#f0f0ff" }}>
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(168,85,247,0.07)" }} />

      <div className="w-full max-w-lg relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Link href="/" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <Music2 size={20} className="text-purple-400" />
              <span className="font-bold text-lg">nota</span>
            </div>
          </div>
          {state === "singing" && (
            <button onClick={stopSinging}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              <Square size={14} fill="currentColor" /> 结束演唱
            </button>
          )}
        </div>

        {state === "setup" && (
          <div className="space-y-5">
            <h1 className="text-3xl font-bold mb-2">K 歌练习</h1>
            <p style={{ color: "rgba(255,255,255,0.4)" }} className="mb-8">
              上传伴奏，AI 实时检测音准，唱完出完整声乐报告。
            </p>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                歌曲名称（可选）
              </label>
              <input type="text" placeholder="例如：稻香 — 周杰伦"
                value={songTitle} onChange={e => setSongTitle(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 text-sm outline-none placeholder:text-white/20"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="w-full glass glass-hover rounded-2xl py-8 flex flex-col items-center gap-3 group">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                <Upload size={22} className="text-purple-400" />
              </div>
              <span className="font-semibold">上传伴奏文件</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>MP3 / WAV / M4A / OGG</span>
            </button>
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
            <div className="flex items-start gap-3 rounded-xl p-4"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Headphones size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                建议戴耳机收听伴奏，麦克风只录到你的声音，分析更准确。
              </p>
            </div>
          </div>
        )}

        {state === "loading" && (
          <div className="glass rounded-2xl p-12 flex flex-col items-center gap-5">
            <Loader2 size={40} className="text-purple-400 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-lg">正在分析伴奏…</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>提取参考旋律，约需 3-10 秒</p>
            </div>
          </div>
        )}

        {state === "ready" && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(52,211,153,0.15)" }}>
                <Music2 size={22} className="text-emerald-400" />
              </div>
              <p className="font-semibold text-emerald-400 mb-1">伴奏分析完成</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                提取到 {refFramesRef.current.filter(f => f.f0 > 0).length} 帧参考旋律
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                时长：{fmt(Math.round(backingBufferRef.current?.duration ?? 0))}
              </p>
            </div>
            <button onClick={startSinging}
              className="w-full btn-primary rounded-2xl py-5 flex items-center justify-center gap-3 text-lg font-semibold glow-purple">
              <Play size={22} fill="white" /> 开始演唱
            </button>
            <button onClick={() => { setState("setup"); if (fileRef.current) fileRef.current.value = ""; }}
              className="w-full glass glass-hover rounded-xl py-3 text-sm font-medium text-center"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              换一首
            </button>
          </div>
        )}

        {state === "countdown" && (
          <div className="glass rounded-3xl p-16 flex flex-col items-center gap-4">
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>准备好了吗…</p>
            <span className="text-8xl font-bold text-gradient">{countdown}</span>
          </div>
        )}

        {state === "singing" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{songTitle || "演唱中"}</p>
              <span className="font-mono text-purple-300">{fmt(elapsed)}</span>
            </div>
            <div className="glass rounded-2xl p-6">
              <p className="text-xs text-center mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>实时音准</p>
              <p className="text-5xl font-bold text-center mb-4" style={{ color: devColor }}>{currentNote}</p>
              <div className="relative h-6 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="absolute top-0 bottom-0 rounded-full"
                  style={{ left: "38%", right: "38%", background: "rgba(52,211,153,0.2)" }} />
                <div className="absolute top-1 bottom-1 w-4 rounded-full transition-all duration-100"
                  style={{ left: `calc(${needlePos}% - 8px)`, background: devColor }} />
              </div>
              <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                <span>偏低</span>
                <span style={{ color: devColor }}>
                  {currentDeviation === Infinity ? "等待演唱…" :
                    currentDeviation <= THRESH_IN_TUNE ? "✓ 在调" :
                    currentDeviation <= THRESH_ACCEPTABLE ? `轻微偏差 ${Math.round(currentDeviation)}¢` :
                    `跑调 ${Math.round(currentDeviation)}¢`}
                </span>
                <span>偏高</span>
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">当前在调率</span>
                <span className="text-2xl font-bold" style={{
                  color: inTuneRatio >= 70 ? "#34d399" : inTuneRatio >= 45 ? "#f59e0b" : "#f87171"
                }}>{inTuneRatio}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${inTuneRatio}%`, background: inTuneRatio >= 70 ? "#34d399" : inTuneRatio >= 45 ? "#f59e0b" : "#f87171" }} />
              </div>
            </div>
            <div className="flex items-end justify-center gap-1 h-8 opacity-60">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}

        {state === "processing" && (
          <div className="glass rounded-2xl p-12 flex flex-col items-center gap-5">
            <Loader2 size={40} className="text-purple-400 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-lg">{processingMsg}</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                正在分析音准、声音质量、气息、频谱…
              </p>
            </div>
            <div className="flex items-end gap-1 h-8 opacity-50">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl p-6"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300 mb-1">出错了</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{errorMsg}</p>
                <button onClick={() => setState("setup")}
                  className="mt-4 text-sm font-medium text-purple-400 hover:text-purple-300">重试 →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
