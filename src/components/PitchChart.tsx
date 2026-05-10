"use client";

import { useRef, useEffect } from "react";
import { THRESH_IN_TUNE, THRESH_ACCEPTABLE } from "@/lib/pitchCompare";

export interface PitchFrame {
  t: number;     // 时间（秒）
  voice: number; // 人声 Hz（0 = 无声）
  ref: number;   // 参考 Hz（0 = 无参考）
}

const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function hzToMidi(hz: number): number {
  return 12 * Math.log2(hz / 440) + 69;
}

function midiLabel(midi: number): string {
  const n = NOTE_NAMES[((Math.round(midi) % 12) + 12) % 12];
  const o = Math.floor(Math.round(midi) / 12) - 1;
  return `${n}${o}`;
}

function centsDev(vHz: number, rHz: number): number {
  if (!vHz || !rHz) return Infinity;
  const raw = Math.abs(1200 * Math.log2(vHz / rHz));
  return Math.min(raw % 1200, 1200 - (raw % 1200));
}

function voiceColor(cents: number): string {
  if (cents === Infinity) return "rgba(168,85,247,0.7)"; // 无参考时紫色
  if (cents <= THRESH_IN_TUNE) return "#34d399";
  if (cents <= THRESH_ACCEPTABLE) return "#f59e0b";
  return "#f87171";
}

export function PitchChart({ frames, duration }: { frames: PitchFrame[]; duration: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length < 2) return;

    const DPR = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);

    // ── 确定 MIDI 音高范围 ───────────────────────────────────────────
    const allMidi: number[] = [];
    for (const f of frames) {
      if (f.voice > 60) allMidi.push(hzToMidi(f.voice));
      if (f.ref   > 60) allMidi.push(hzToMidi(f.ref));
    }
    if (allMidi.length === 0) return;

    const midiRaw = { min: Math.min(...allMidi), max: Math.max(...allMidi) };
    const midiMin = Math.floor(midiRaw.min) - 1;
    const midiMax = Math.ceil(midiRaw.max)  + 1;
    const midiSpan = Math.max(midiMax - midiMin, 4);

    // ── 布局 ────────────────────────────────────────────────────────
    const PAD = { top: 12, bottom: 24, left: 38, right: 12 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top  - PAD.bottom;

    const midiToY = (midi: number) =>
      PAD.top + cH - ((midi - midiMin) / midiSpan) * cH;
    const timeToX = (t: number) =>
      PAD.left + (t / Math.max(duration, 1)) * cW;

    // ── 背景 ────────────────────────────────────────────────────────
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, W, H);

    // ── 水平格线 & 音名标签 ──────────────────────────────────────────
    for (let m = midiMin; m <= midiMax; m++) {
      const y = midiToY(m);
      const isC = m % 12 === 0;

      ctx.strokeStyle = isC ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)";
      ctx.lineWidth = isC ? 1 : 0.5;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + cW, y); ctx.stroke();

      if (isC || m % 12 === 5 || m % 12 === 9) {
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.font = `${isC ? "bold " : ""}10px system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.fillText(midiLabel(m), PAD.left - 5, y + 3.5);
      }
    }

    // ── 时间轴标签 ───────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    const tStep = duration <= 30 ? 5 : duration <= 60 ? 10 : 15;
    for (let t = 0; t <= duration; t += tStep) {
      ctx.fillText(`${t}s`, timeToX(t), H - 7);
    }

    // ── 参考旋律（灰色台阶） ──────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.beginPath();
    let refStarted = false;
    let prevRefMidi = 0;

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      if (f.ref < 60) { refStarted = false; continue; }
      const midi = hzToMidi(f.ref);
      const x = timeToX(f.t);
      const y = midiToY(midi);

      if (!refStarted || Math.abs(midi - prevRefMidi) > 0.8) {
        if (refStarted) {
          // 台阶垂直线
          ctx.lineTo(x, midiToY(prevRefMidi));
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
        }
        refStarted = true;
      } else {
        ctx.lineTo(x, y);
      }
      prevRefMidi = midi;
    }
    ctx.stroke();

    // ── 人声音高（彩色线段） ─────────────────────────────────────────
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    let i = 0;
    while (i < frames.length) {
      const f = frames[i];
      if (f.voice < 60) { i++; continue; }

      // 找连续有声段
      let j = i;
      while (j < frames.length && frames[j].voice >= 60) j++;
      const segment = frames.slice(i, j);
      i = j;

      if (segment.length < 2) continue;

      // 逐小段渲染颜色
      for (let k = 0; k < segment.length - 1; k++) {
        const cur  = segment[k];
        const next = segment[k + 1];
        const cents = centsDev(cur.voice, cur.ref);
        const midi  = hzToMidi(cur.voice);

        ctx.strokeStyle = voiceColor(cents);
        ctx.beginPath();
        ctx.moveTo(timeToX(cur.t),  midiToY(midi));
        ctx.lineTo(timeToX(next.t), midiToY(hzToMidi(next.voice)));
        ctx.stroke();
      }
    }

    // ── 当前时刻竖线（装饰）──────────────────────────────────────────
    // （静态图不需要，留空）

  }, [frames, duration]);

  if (frames.length < 2) return (
    <div className="flex items-center justify-center h-40 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
      数据不足，无法生成走势图
    </div>
  );

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full rounded-xl" style={{ height: "220px", display: "block" }} />
      {/* 图例 */}
      <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 rounded-full inline-block" style={{ background: "rgba(255,255,255,0.3)" }} />
          参考旋律
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block bg-emerald-400" />
          在调（±25¢）
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block bg-amber-400" />
          偏差（25-50¢）
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block bg-red-400" />
          跑调（{">"}50¢）
        </span>
      </div>
    </div>
  );
}
