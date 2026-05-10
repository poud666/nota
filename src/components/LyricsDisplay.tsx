"use client";

import { useEffect, useRef } from "react";
import type { LyricLine } from "@/lib/lrcParser";

interface Props {
  lines: LyricLine[];
  currentTime: number;
  currentIndex: number;
}

export function LyricsDisplay({ lines, currentTime, currentIndex }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // 自动滚动到当前行
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIndex]);

  if (lines.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl"
      style={{ height: "180px", background: "rgba(0,0,0,0.4)" }}
    >
      {/* 上下渐变遮罩 */}
      <div className="absolute inset-x-0 top-0 h-12 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }} />
      <div className="absolute inset-x-0 bottom-0 h-12 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }} />

      <div className="overflow-y-auto h-full px-6 py-10 space-y-2" style={{ scrollbarWidth: "none" }}>
        {lines.map((line, i) => {
          const isActive = i === currentIndex;
          const isPrev = i === currentIndex - 1;
          const isNext = i === currentIndex + 1;
          const dist = Math.abs(i - currentIndex);

          // 当前行的进度（0-1）
          const progress = isActive
            ? Math.min(1, (currentTime - line.time) / Math.max(0.1, line.endTime - line.time))
            : 0;

          return (
            <div
              key={i}
              ref={isActive ? activeRef : undefined}
              className="relative text-center transition-all duration-300 select-none"
              style={{
                fontSize: isActive ? "1.25rem" : isPrev || isNext ? "1rem" : "0.875rem",
                fontWeight: isActive ? 700 : isPrev || isNext ? 500 : 400,
                color: isActive
                  ? "#ffffff"
                  : dist === 1 ? "rgba(255,255,255,0.5)"
                  : dist === 2 ? "rgba(255,255,255,0.25)"
                  : "rgba(255,255,255,0.12)",
                transform: `scale(${isActive ? 1 : isPrev || isNext ? 0.95 : 0.9})`,
                lineHeight: 1.6,
              }}
            >
              {/* 当前行：文字进度渐亮效果 */}
              {isActive ? (
                <span className="relative inline-block">
                  {/* 底层：灰色全文 */}
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>{line.text}</span>
                  {/* 叠加：亮色裁剪遮罩 */}
                  <span
                    className="absolute inset-0 overflow-hidden whitespace-nowrap"
                    style={{ width: `${progress * 100}%`, color: "#a855f7" }}
                  >
                    {line.text}
                  </span>
                </span>
              ) : (
                line.text
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
