"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Music2, ArrowLeft, Upload, Play, Square, Loader2,
  AlertCircle, Headphones, Library, ChevronRight, X, FileText,
} from "lucide-react";
import { extractReferenceF0, hzToNoteName, centsDiff, summarize, type RefFrame, THRESH_IN_TUNE, THRESH_ACCEPTABLE } from "@/lib/pitchCompare";
import { analyzeAudio } from "@/lib/audioAnalysis";
import { parseLRC, getCurrentLineIndex, type LyricLine } from "@/lib/lrcParser";
import { LyricsDisplay } from "@/components/LyricsDisplay";
import { SONG_LIBRARY, DIFFICULTY_LABELS, DIFFICULTY_COLORS, type Song } from "@/lib/songLibrary";
import { synthesizeTrack, JASMINE_NOTES, LITTLE_STAR_NOTES } from "@/lib/synthesizer";
import type { PitchFrame } from "@/components/PitchChart";

type State = "setup" | "loading" | "ready" | "countdown" | "singing" | "processing" | "error";
type SetupTab = "library" | "upload";

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
  const [tab, setTab] = useState<SetupTab>("library");
  const [songTitle, setSongTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [currentDeviation, setCurrentDeviation] = useState(Infinity);
  const [currentNote, setCurrentNote] = useState("--");
  const [inTuneRatio, setInTuneRatio] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [processingMsg, setProcessingMsg] = useState("");
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyricIdx, setCurrentLyricIdx] = useState(0);

  const audioCtxRef        = useRef<AudioContext | null>(null);
  const backingBufferRef   = useRef<AudioBuffer | null>(null);
  const refFramesRef       = useRef<RefFrame[]>([]);
  const voiceF0sRef        = useRef<number[]>([]);
  const startTimeRef       = useRef(0);
  const analyserRef        = useRef<AnalyserNode | null>(null);
  const rafRef             = useRef<number>(0);
  const timerRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const micStreamRef       = useRef<MediaStream | null>(null);
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
  const recordChunksRef    = useRef<Blob[]>([]);
  const elapsedRef         = useRef(0);
  const pitchFramesRef     = useRef<PitchFrame[]>([]);
  const lastFrameTimeRef   = useRef(0);
  const lyricsRef          = useRef<LyricLine[]>([]);
  const audioFileRef       = useRef<HTMLInputElement>(null);
  const lrcFileRef         = useRef<HTMLInputElement>(null);

  // ── 从歌曲库选歌（自动加载或合成）──────────────────────────────────
  const loadFromLibrary = useCallback(async (song: Song) => {
    setState("loading");
    setSongTitle(`${song.title} — ${song.artist}`);
    const parsed = parseLRC(song.lrc);
    setLyrics(parsed);
    lyricsRef.current = parsed;
    try {
      let audioBuffer: AudioBuffer;

      if (song.synthId) {
        // Web Audio 合成旋律伴奏（无需网络）
        const notes = song.synthId === "jasmine" ? JASMINE_NOTES : LITTLE_STAR_NOTES;
        const bpm   = song.synthId === "jasmine" ? 72 : 90;
        audioBuffer = await synthesizeTrack(notes, bpm);
      } else if (song.audioUrl) {
        const res = await fetch(song.audioUrl);
        if (!res.ok) throw new Error("网络错误");
        audioBuffer = await new AudioContext().decodeAudioData(await res.arrayBuffer());
      } else {
        throw new Error("无音频源");
      }

      backingBufferRef.current = audioBuffer;
      refFramesRef.current = await extractReferenceF0(audioBuffer, HOP);
      setState("ready");
    } catch (e) {
      console.error(e);
      setErrorMsg("无法加载伴奏，请检查网络或选择「上传伴奏」。");
      setState("error");
    }
  }, []);

  // ── 从歌曲库预加载歌词，并切换到上传伴奏 tab ──────────────────────
  const loadLyricsOnly = useCallback((song: Song) => {
    setSongTitle(`${song.title} — ${song.artist}`);
    const parsed = parseLRC(song.lrc);
    setLyrics(parsed);
    lyricsRef.current = parsed;
    setTab("upload");
  }, []);

  // ── 上传伴奏文件 ───────────────────────────────────────────────────
  const handleAudioFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (!songTitle) setSongTitle(file.name.replace(/\.[^.]+$/, ""));
      setState("ready");
    } catch {
      setErrorMsg("无法解析音频文件，请换一个格式（MP3/WAV/M4A）。");
      setState("error");
    }
  }, [songTitle]);

  // ── 上传 LRC 歌词文件 ──────────────────────────────────────────────
  const handleLrcFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseLRC(text);
    setLyrics(parsed);
    lyricsRef.current = parsed;
  }, []);

  // ── 倒计时 ─────────────────────────────────────────────────────────
  const startSinging = useCallback(() => {
    setState("countdown");
    setCountdown(3);
    let c = 3;
    const cd = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) { clearInterval(cd); beginSinging(); }
    }, 1000);
  }, []); // eslint-disable-line

  // ── 开始演唱 ───────────────────────────────────────────────────────
  const beginSinging = useCallback(async () => {
    if (!backingBufferRef.current) return;
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });
      micStreamRef.current = micStream;

      // MediaRecorder 录音
      recordChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(micStream, { mimeType });
      recorder.ondataavailable = e => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      recorder.start(100);
      mediaRecorderRef.current = recorder;

      // AudioContext
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
      setCurrentLyricIdx(0);
      elapsedRef.current = 0;

      timerRef.current = setInterval(() => {
        const t = Math.round(ctx.currentTime - startTimeRef.current);
        setElapsed(t);
        elapsedRef.current = t;
      }, 200);

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

        // 更新歌词行
        if (lyricsRef.current.length > 0) {
          const idx = getCurrentLineIndex(lyricsRef.current, elapsedNow);
          setCurrentLyricIdx(idx);
        }

        if (voiceHz > 0 && refFrame?.f0 > 0) {
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

        // 每 100ms 采集走势图帧
        if (elapsedNow - lastFrameTimeRef.current >= 0.1) {
          pitchFramesRef.current.push({
            t: Math.round(elapsedNow * 10) / 10,
            voice: voiceHz,
            ref: refFrame?.f0 ?? 0,
          });
          lastFrameTimeRef.current = elapsedNow;
        }

        if (elapsedNow >= (backingBufferRef.current?.duration ?? 0)) { stopSinging(); return; }
        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);
      source.onended = () => stopSinging();
    } catch {
      setErrorMsg("无法获取麦克风权限，请允许后重试。");
      setState("error");
    }
  }, []);

  // ── 停止演唱 ───────────────────────────────────────────────────────
  const stopSinging = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    audioCtxRef.current?.close();
    setState("processing");

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
  }, []); // eslint-disable-line

  const runFullAnalysis = useCallback(async () => {
    const pitchCompare = summarize(voiceF0sRef.current, refFramesRef.current);
    setProcessingMsg("正在分析声音质量…");
    let audioFeatures = null;
    try {
      const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
      if (blob.size > 1000) audioFeatures = await analyzeAudio(blob);
    } catch (e) { console.warn("完整分析失败", e); }

    setProcessingMsg("AI 正在生成报告…");
    sessionStorage.setItem("nota_sing_result", JSON.stringify({
      songTitle,
      duration: elapsedRef.current,
      pitchCompare,
      audioFeatures,
      pitchFrames: pitchFramesRef.current,
      lyrics: lyricsRef.current,
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
    ? 50 : Math.max(5, Math.min(95, 50 + (currentDeviation > 100 ? 40 : currentDeviation * 0.4)));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#0a0a0f", color: "#f0f0ff" }}>
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(168,85,247,0.07)" }} />

      <div className="w-full max-w-lg relative z-10">
        {/* 顶栏 */}
        <div className="flex items-center justify-between mb-8">
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

        {/* ── 选歌界面 ── */}
        {state === "setup" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">K 歌练习</h1>
            <p className="mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
              选择免费伴奏或上传自己的音频，AI 实时分析音准。
            </p>

            {/* Tab 切换 */}
            <div className="flex glass rounded-xl p-1 mb-6 gap-1">
              {[
                { id: "library" as SetupTab, icon: Library, label: "免费伴奏库" },
                { id: "upload"  as SetupTab, icon: Upload,  label: "上传伴奏" },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={tab === t.id
                    ? { background: "rgba(168,85,247,0.25)", color: "#c084fc" }
                    : { color: "rgba(255,255,255,0.4)" }}>
                  <t.icon size={15} />{t.label}
                </button>
              ))}
            </div>

            {/* 歌曲库 */}
            {tab === "library" && (
              <div className="space-y-4">
                {(["beginner","intermediate","advanced"] as const).map(level => {
                  const songs = SONG_LIBRARY.filter(s => s.language === "zh" && s.difficulty === level);
                  if (!songs.length) return null;
                  const dc = DIFFICULTY_COLORS[level];
                  return (
                    <div key={level}>
                      <p className={`text-xs font-semibold mb-2 ${dc.text}`}>
                        {DIFFICULTY_LABELS[level]}
                      </p>
                      <div className="space-y-2">
                        {songs.map(song => {
                          const canAutoLoad = !!song.audioUrl || !!song.synthId;
                          return (
                            <div key={song.id} className="glass rounded-xl p-4 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{song.title}</p>
                                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                                  {song.artist}
                                </p>
                              </div>
                              {canAutoLoad ? (
                                <button onClick={() => loadFromLibrary(song)}
                                  className="btn-primary shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold">
                                  直接练习
                                </button>
                              ) : (
                                <button onClick={() => loadLyricsOnly(song)}
                                  className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                                  style={{ background: "rgba(168,85,247,0.12)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.25)" }}>
                                  <Upload size={11} />
                                  上传伴奏
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-center pt-1" style={{ color: "rgba(255,255,255,0.18)" }}>
                  「直接练习」= Pixabay CC0 免费音频 · 「上传伴奏」= 歌词已内置，自备伴奏文件
                </p>
              </div>
            )}

            {/* 上传区域 */}
            {tab === "upload" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                    歌曲名称（可选）
                  </label>
                  <input type="text" placeholder="例如：稻香 — 周杰伦"
                    value={songTitle} onChange={e => setSongTitle(e.target.value)}
                    className="w-full glass rounded-xl px-4 py-3 text-sm outline-none placeholder:text-white/20"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>

                <button onClick={() => audioFileRef.current?.click()}
                  className="w-full glass glass-hover rounded-2xl py-6 flex flex-col items-center gap-2 group">
                  <Upload size={22} className="text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">上传伴奏文件</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>MP3 / WAV / M4A / OGG</span>
                </button>
                <input ref={audioFileRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioFile} />

                {/* LRC 上传 */}
                <div>
                  <button onClick={() => lrcFileRef.current?.click()}
                    className="w-full glass glass-hover rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm"
                    style={{ color: lyrics.length > 0 ? "#c084fc" : "rgba(255,255,255,0.4)" }}>
                    <FileText size={15} />
                    {lyrics.length > 0 ? `已加载歌词 ${lyrics.length} 行 ✓` : "上传 LRC 歌词文件（可选）"}
                  </button>
                  <input ref={lrcFileRef} type="file" accept=".lrc,.txt" className="hidden" onChange={handleLrcFile} />
                  {lyrics.length > 0 && (
                    <button onClick={() => { setLyrics([]); lyricsRef.current = []; }}
                      className="flex items-center gap-1 mt-1 mx-auto text-xs"
                      style={{ color: "rgba(255,255,255,0.25)" }}>
                      <X size={11} /> 移除歌词
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-xl p-4"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <Headphones size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    建议戴耳机收听伴奏，麦克风只录到你的声音，分析更准确。
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 加载 ── */}
        {state === "loading" && (
          <div className="glass rounded-2xl p-12 flex flex-col items-center gap-5">
            <Loader2 size={40} className="text-purple-400 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-lg">正在加载伴奏…</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>提取参考旋律，约需 3-10 秒</p>
            </div>
          </div>
        )}

        {/* ── 准备好了 ── */}
        {state === "ready" && (
          <div className="space-y-5">
            <div className="glass rounded-2xl p-6 text-center">
              <p className="font-semibold text-emerald-400 mb-1">伴奏分析完成</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                {songTitle}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                参考旋律 {refFramesRef.current.filter(f => f.f0 > 0).length} 帧
                {lyrics.length > 0 && ` · 歌词 ${lyrics.length} 行`}
              </p>
            </div>
            <button onClick={startSinging}
              className="w-full btn-primary rounded-2xl py-5 flex items-center justify-center gap-3 text-lg font-semibold glow-purple">
              <Play size={22} fill="white" /> 开始演唱
            </button>
            <button onClick={() => { setState("setup"); if (audioFileRef.current) audioFileRef.current.value = ""; }}
              className="w-full glass glass-hover rounded-xl py-3 text-sm font-medium text-center"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              换一首
            </button>
          </div>
        )}

        {/* ── 倒计时 ── */}
        {state === "countdown" && (
          <div className="glass rounded-3xl p-16 flex flex-col items-center gap-4">
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>准备好了吗…</p>
            <span className="text-8xl font-bold text-gradient">{countdown}</span>
          </div>
        )}

        {/* ── 演唱中 ── */}
        {state === "singing" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm truncate max-w-[200px]">{songTitle || "演唱中"}</p>
              <span className="font-mono text-purple-300">{fmt(elapsed)}</span>
            </div>

            {/* 歌词显示 */}
            {lyrics.length > 0 && (
              <LyricsDisplay lines={lyrics} currentTime={elapsed} currentIndex={currentLyricIdx} />
            )}

            {/* 实时音准仪 */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-4xl font-bold" style={{ color: devColor }}>{currentNote}</p>
                <span className="text-sm font-medium" style={{ color: devColor }}>
                  {currentDeviation === Infinity ? "等待演唱…" :
                    currentDeviation <= THRESH_IN_TUNE ? "✓ 在调" :
                    currentDeviation <= THRESH_ACCEPTABLE ? `偏差 ${Math.round(currentDeviation)}¢` :
                    `跑调 ${Math.round(currentDeviation)}¢`}
                </span>
              </div>
              <div className="relative h-4 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="absolute top-0 bottom-0 rounded-full"
                  style={{ left: "38%", right: "38%", background: "rgba(52,211,153,0.2)" }} />
                <div className="absolute top-0.5 bottom-0.5 w-3 rounded-full transition-all duration-100"
                  style={{ left: `calc(${needlePos}% - 6px)`, background: devColor }} />
              </div>
            </div>

            {/* 在调率 */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>在调率</span>
                <span className="text-xl font-bold" style={{
                  color: inTuneRatio >= 65 ? "#34d399" : inTuneRatio >= 45 ? "#f59e0b" : "#f87171"
                }}>{inTuneRatio}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${inTuneRatio}%`, background: inTuneRatio >= 65 ? "#34d399" : inTuneRatio >= 45 ? "#f59e0b" : "#f87171" }} />
              </div>
            </div>

            <div className="flex items-end justify-center gap-1 h-6 opacity-50">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── 处理中 ── */}
        {state === "processing" && (
          <div className="glass rounded-2xl p-12 flex flex-col items-center gap-5">
            <Loader2 size={40} className="text-purple-400 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-lg">{processingMsg || "正在分析…"}</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                音准、声音质量、气息、频谱全面分析中
              </p>
            </div>
          </div>
        )}

        {/* ── 错误 ── */}
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
