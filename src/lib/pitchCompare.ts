/**
 * 伴奏参考音高提取 & 演唱对比
 *
 * 阈值依据（学术文献）：
 *  - Sundberg et al.：顶级歌手平均偏差 ~30 音分，录音中最大 ±44 音分被认可
 *  - 感知研究：±25 音分为受训听众的感知阈值，±50 音分普通听众明显察觉
 *  - 录音室标准：Auto-tune 修正到 ±10 音分；±25 音分以内感知为"在调"
 *  - 颤音处理：颤音自然振荡 ±50-100 音分，需先做移动平均取中心音高再对比
 *
 * 三档分类：
 *  ✅ 在调（±25¢）   — 感知在调，专业标准
 *  ⚠️ 尚可（25-50¢）— 功能性准确，轻微偏差
 *  ❌ 跑调（>50¢）   — 普通听众可察觉
 */

export interface RefFrame {
  f0: number;      // Hz，0 = 该帧无旋律音
  clarity: number; // 置信度 0-1
}

// ── 感知阈值（基于学术研究） ──────────────────────────────────────────────────
export const THRESH_IN_TUNE   = 25;  // ±25¢：感知在调（Sundberg / 感知研究）
export const THRESH_ACCEPTABLE = 50; // ±50¢：尚可接受（普通听众察觉边界）

// ── 各水平参考标准（基于文献均值）────────────────────────────────────────────
export const LEVEL_STANDARDS = {
  professional: { avgCents: 20, inTuneRatio: 80 }, // 职业歌手：平均 ~30¢，但许多场景 20¢ 内
  advanced:     { avgCents: 35, inTuneRatio: 65 }, // 进阶：±35¢，65% 在调
  intermediate: { avgCents: 50, inTuneRatio: 50 }, // 中级：±50¢，50% 在调
  beginner:     { avgCents: 70, inTuneRatio: 35 }, // 初级：±70¢，35% 在调
};

/** 预分析伴奏，提取逐帧参考 F0 */
export async function extractReferenceF0(
  audioBuffer: AudioBuffer,
  hop = 512,
): Promise<RefFrame[]> {
  const { PitchDetector } = await import("pitchy");
  const data = audioBuffer.getChannelData(0);
  const sr = audioBuffer.sampleRate;
  const BUF = 2048;
  const detector = PitchDetector.forFloat32Array(BUF);
  const frames: RefFrame[] = [];

  for (let i = 0; i + BUF < data.length; i += hop) {
    const chunk = data.slice(i, i + BUF) as unknown as Float32Array;
    const [pitch, clarity] = detector.findPitch(chunk, sr);
    frames.push({
      f0: clarity > 0.82 && pitch > 60 && pitch < 1500 ? pitch : 0,
      clarity,
    });
  }
  return frames;
}

/**
 * 对 F0 序列做移动平均（中位数窗口），消除颤音影响，提取"中心音高"
 * 窗口约 200ms（@ 44100Hz, hop=512 → 约 17 帧）
 */
export function smoothPitch(f0s: number[], windowFrames = 17): number[] {
  const out: number[] = [];
  for (let i = 0; i < f0s.length; i++) {
    const half = Math.floor(windowFrames / 2);
    const lo = Math.max(0, i - half);
    const hi = Math.min(f0s.length - 1, i + half);
    const valid = f0s.slice(lo, hi + 1).filter(v => v > 0);
    if (valid.length === 0) { out.push(0); continue; }
    // 中位数比均值更抗异常帧
    valid.sort((a, b) => a - b);
    out.push(valid[Math.floor(valid.length / 2)]);
  }
  return out;
}

/** 把 Hz 转为音名，如 "A4"、"C5" */
export function hzToNoteName(hz: number): string {
  if (!hz || hz < 60) return "--";
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const midi = Math.round(12 * Math.log2(hz / 440) + 69);
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

/** 计算演唱音与参考音的偏差（音分），支持八度等价 */
export function centsDiff(voiceHz: number, refHz: number): number {
  if (!voiceHz || !refHz) return Infinity;
  const raw = Math.abs(1200 * Math.log2(voiceHz / refHz));
  return Math.min(raw % 1200, 1200 - (raw % 1200));
}

export interface PitchCompareResult {
  totalComparable: number;
  inTuneFrames: number;      // ±25¢（感知在调）
  acceptableFrames: number;  // 25-50¢（尚可接受）
  offTuneFrames: number;     // >50¢（可察觉跑调）
  inTuneRatio: number;       // 0-100，±25¢ 在调率
  acceptableRatio: number;   // 0-100，±50¢ 内的率（含 inTune）
  avgDeviationCents: number;
  pitchAccuracyScore: number; // 0-100
  // 对照专业歌手标准
  vsProLabel: string;         // "达到职业标准" / "接近职业标准" / "进阶水平" 等
}

/** 汇总对比结果（先对人声 F0 做平滑，消除颤音干扰） */
export function summarize(
  rawVoiceF0s: number[],
  refFrames: RefFrame[],
): PitchCompareResult {
  // 平滑人声 F0（消除颤音逐帧振荡）
  const voiceF0s = smoothPitch(rawVoiceF0s);

  let inTune = 0, acceptable = 0, offTune = 0;
  let devSum = 0, devCount = 0;

  const n = Math.min(voiceF0s.length, refFrames.length);
  for (let i = 0; i < n; i++) {
    const vf = voiceF0s[i];
    const rf = refFrames[i];
    if (!rf || rf.f0 === 0 || rf.clarity < 0.82) continue;
    if (!vf || vf < 60) continue;

    const dev = centsDiff(vf, rf.f0);
    devSum += dev; devCount++;

    if (dev <= THRESH_IN_TUNE)        inTune++;
    else if (dev <= THRESH_ACCEPTABLE) acceptable++;
    else                               offTune++;
  }

  const total = inTune + acceptable + offTune;
  const inTuneRatio    = total > 0 ? Math.round((inTune / total) * 100) : 0;
  const acceptableRatio = total > 0 ? Math.round(((inTune + acceptable) / total) * 100) : 0;
  const avgDev = devCount > 0 ? Math.round(devSum / devCount) : 0;

  // 评分：以 ±25¢ 在调率为主（70%），偏差精度为辅（30%）
  // 参考：职业歌手均值 ~30¢ → 对应约 65-75 分是"良好"水平
  const devScore = Math.max(0, Math.min(100, 100 - avgDev * 1.2));
  const pitchAccuracyScore = Math.round(inTuneRatio * 0.7 + devScore * 0.3);

  // 对照职业标准给出定性描述
  let vsProLabel: string;
  if (avgDev <= 20 && inTuneRatio >= 80)      vsProLabel = "达到职业水准";
  else if (avgDev <= 30 && inTuneRatio >= 65) vsProLabel = "接近职业水准";
  else if (avgDev <= 50 && inTuneRatio >= 50) vsProLabel = "进阶演唱水平";
  else if (avgDev <= 70 && inTuneRatio >= 35) vsProLabel = "初中级水平";
  else                                         vsProLabel = "需要大量练习";

  return {
    totalComparable: total,
    inTuneFrames: inTune,
    acceptableFrames: acceptable,
    offTuneFrames: offTune,
    inTuneRatio,
    acceptableRatio,
    avgDeviationCents: avgDev,
    pitchAccuracyScore,
    vsProLabel,
  };
}
