"use client";

import { useRef, useEffect } from "react";
import { THRESH_IN_TUNE, THRESH_ACCEPTABLE } from "@/lib/pitchCompare";
import type { LyricLine } from "@/lib/lrcParser";

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
  if (cents === Infinity) return "rgba(168,85,247,0.8)";
  if (cents <= THRESH_IN_TUNE) return "#34d399";
  if (cents <= THRESH_ACCEPTABLE) return "#f59e0b";
  return "#f87171";
}

interface Props {
  frames: PitchFrame[];
  duration: number;
  lyrics?: LyricLine[]; // 可选：歌词时间轴标注
}

export function PitchChart({ frames, duration, lyrics = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length < 2) return;

    const DPR = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const hasLyrics = lyrics.length > 0;
    const H = canvas.offsetHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);

    // ── 计算音高范围 ─────────────────────────────────────────────────
    const allMidi: number[] = [];
    for (const f of frames) {
      if (f.voice > 60) allMidi.push(hzToMidi(f.voice));
      if (f.ref   > 60) allMidi.push(hzToMidi(f.ref));
    }
    if (!allMidi.length) return;

    const midiMin = Math.floor(Math.min(...allMidi)) - 1;
    const midiMax = Math.ceil(Math.max(...allMidi))  + 1;
    const midiSpan = Math.max(midiMax - midiMin, 4);

    // ── 布局 ────────────────────────────────────────────────────────
    const PAD = {
      top: 12,
      bottom: hasLyrics ? 52 : 24, // 歌词行需要更多底部空间
      left: 38,
      right: 12,
    };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top  - PAD.bottom;

    const midiToY = (m: number) => PAD.top + cH - ((m - midiMin) / midiSpan) * cH;
    const timeToX = (t: number) => PAD.left + (t / Math.max(duration, 1)) * cW;

    // ── 背景 ────────────────────────────────────────────────────────
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, W, H);

    // ── 格线 & 音名 ──────────────────────────────────────────────────
    for (let m = midiMin; m <= midiMax; m++) {
      const y = midiToY(m);
      const isC = m % 12 === 0;
      ctx.strokeStyle = isC ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.025)";
      ctx.lineWidth = isC ? 1 : 0.5;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + cW, y); ctx.stroke();
      if (isC || m % 12 === 5 || m % 12 === 9) {
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.font = `${isC ? "bold " : ""}10px system-ui`;
        ctx.textAlign = "right";
        ctx.fillText(midiLabel(m), PAD.left - 5, y + 3.5);
      }
    }

    // ── 歌词分割线 & 标签 ────────────────────────────────────────────
    if (hasLyrics) {
      for (let i = 0; i < lyrics.length; i++) {
        const line = lyrics[i];
        const x = timeToX(line.time);
        if (x < PAD.left || x > PAD.left + cW) continue;

        // 竖向分割线
        ctx.strokeStyle = "rgba(168,85,247,0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + cH); ctx.stroke();
        ctx.setLineDash([]);

        // 歌词文字（底部区域）
        const endX = i + 1 < lyrics.length ? timeToX(lyrics[i + 1].time) : PAD.left + cW;
        const midX = (x + Math.min(endX, PAD.left + cW)) / 2;
        const maxW = Math.min(endX - x - 6, 120);

        ctx.save();
        ctx.fillStyle = "rgba(200,180,255,0.8)";
        ctx.font = "11px system-ui";
        ctx.textAlign = "center";

        // 截断过长歌词
        let label = line.text;
        while (ctx.measureText(label).width > maxW && label.length > 1) {
          label = label.slice(0, -1);
        }
        if (label !== line.text) label += "…";
        ctx.fillText(label, midX, H - 10);
        ctx.restore();
      }

      // 底部歌词区域背景
      ctx.fillStyle = "rgba(168,85,247,0.05)";
      ctx.fillRect(PAD.left, PAD.top + cH + 2, cW, PAD.bottom - 2);
    }

    // ── 时间轴 ───────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    if (!hasLyrics) {
      const tStep = duration <= 30 ? 5 : duration <= 60 ? 10 : 15;
      for (let t = 0; t <= duration; t += tStep) {
        ctx.fillText(`${t}s`, timeToX(t), H - 7);
      }
    }

    // ── 参考旋律（台阶） ─────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.beginPath();
    let refOn = false, prevMidi = 0;

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      if (f.ref < 60) { refOn = false; continue; }
      const m = hzToMidi(f.ref);
      const x = timeToX(f.t);
      const y = midiToY(m);

      if (!refOn) {
        ctx.moveTo(x, y); refOn = true;
      } else if (Math.abs(m - prevMidi) > 0.8) {
        // 台阶：先水平到换音点，再垂直跳到新音高
        ctx.lineTo(x, midiToY(prevMidi));
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      prevMidi = m;
    }
    ctx.stroke();

    // ── 人声（彩色线段） ─────────────────────────────────────────────
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    let i = 0;
    while (i < frames.length) {
      if (frames[i].voice < 60) { i++; continue; }
      let j = i;
      while (j < frames.length && frames[j].voice >= 60) j++;
      const seg = frames.slice(i, j);
      i = j;
      if (seg.length < 2) continue;
      for (let k = 0; k < seg.length - 1; k++) {
        const cur = seg[k], nxt = seg[k + 1];
        const cents = centsDev(cur.voice, cur.ref);
        ctx.strokeStyle = voiceColor(cents);
        ctx.beginPath();
        ctx.moveTo(timeToX(cur.t), midiToY(hzToMidi(cur.voice)));
        ctx.lineTo(timeToX(nxt.t), midiToY(hzToMidi(nxt.voice)));
        ctx.stroke();
      }
    }

  }, [frames, duration, lyrics]);

  if (frames.length < 2) return (
    <div className="flex items-center justify-center h-40 text-sm"
      style={{ color: "rgba(255,255,255,0.25)" }}>
      数据不足，无法生成走势图
    </div>
  );

  const chartHeight = lyrics.length > 0 ? 260 : 220;

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl"
        style={{ height: `${chartHeight}px`, display: "block" }}
      />
      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs"
        style={{ color: "rgba(255,255,255,0.4)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 rounded-full inline-block" style={{ background: "rgba(255,255,255,0.35)" }} />
          参考旋律
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block bg-emerald-400" />在调（±25¢）
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block bg-amber-400" />偏差（25-50¢）
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block bg-red-400" />跑调（{">"} 50¢）
        </span>
        {lyrics.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded inline-block" style={{ background: "rgba(168,85,247,0.4)" }} />歌词分段
          </span>
        )}
      </div>
    </div>
  );
}
