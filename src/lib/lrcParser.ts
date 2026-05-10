/**
 * LRC 歌词解析器
 * 格式：[mm:ss.xx]歌词文本
 */

export interface LyricLine {
  time: number;    // 开始时间（秒）
  endTime: number; // 结束时间（由下一句推算）
  text: string;
}

export function parseLRC(content: string): LyricLine[] {
  const lines: { time: number; text: string }[] = [];
  const timeRe = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  for (const raw of content.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("[ti:") || trimmed.startsWith("[ar:") ||
        trimmed.startsWith("[al:") || trimmed.startsWith("[by:")) continue;

    const times: number[] = [];
    let match: RegExpExecArray | null;
    timeRe.lastIndex = 0;
    while ((match = timeRe.exec(trimmed)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms  = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0;
      times.push(min * 60 + sec + ms / 1000);
    }

    const text = trimmed.replace(/\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/g, "").trim();
    if (text) {
      for (const t of times) lines.push({ time: t, text });
    }
  }

  lines.sort((a, b) => a.time - b.time);

  return lines.map((l, i) => ({
    time: l.time,
    endTime: i + 1 < lines.length ? lines[i + 1].time : l.time + 5,
    text: l.text,
  }));
}

/** 根据当前播放时间找当前行索引 */
export function getCurrentLineIndex(lines: LyricLine[], currentTime: number): number {
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (currentTime >= lines[i].time) idx = i;
    else break;
  }
  return idx;
}
