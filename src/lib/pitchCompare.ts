/**
 * 伴奏参考音高提取 & 演唱对比
 */

export interface RefFrame {
  f0: number;      // Hz，0 = 该帧无旋律音
  clarity: number; // 置信度 0-1
}

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
  // 取最近八度等价距离（允许演唱者唱高/低八度）
  return Math.min(raw % 1200, 1200 - (raw % 1200));
}

export interface PitchCompareResult {
  totalComparable: number;   // 有参考音的帧数
  inTuneFrames: number;      // ±50 音分内
  slightOffFrames: number;   // 50-100 音分
  offTuneFrames: number;     // >100 音分
  inTuneRatio: number;       // 0-100
  avgDeviationCents: number;
  pitchAccuracyScore: number; // 0-100 音准得分
}

/** 汇总对比结果 */
export function summarize(
  voiceF0s: number[],
  refFrames: RefFrame[],
): PitchCompareResult {
  let inTune = 0, slightOff = 0, offTune = 0;
  let devSum = 0, devCount = 0;

  const n = Math.min(voiceF0s.length, refFrames.length);
  for (let i = 0; i < n; i++) {
    const vf = voiceF0s[i];
    const rf = refFrames[i];
    if (!rf || rf.f0 === 0 || rf.clarity < 0.82) continue; // 无参考跳过
    if (!vf || vf < 60) continue;                           // 无人声跳过

    const dev = centsDiff(vf, rf.f0);
    devSum += dev; devCount++;

    if (dev <= 50)        inTune++;
    else if (dev <= 100)  slightOff++;
    else                  offTune++;
  }

  const total = inTune + slightOff + offTune;
  const inTuneRatio = total > 0 ? Math.round((inTune / total) * 100) : 0;
  const avgDev = devCount > 0 ? Math.round(devSum / devCount) : 0;

  // 音准得分：在调率 70% + 偏差精度 30%
  const devScore = Math.max(0, Math.min(100, 100 - avgDev * 0.8));
  const pitchAccuracyScore = Math.round(inTuneRatio * 0.7 + devScore * 0.3);

  return { totalComparable: total, inTuneFrames: inTune, slightOffFrames: slightOff,
    offTuneFrames: offTune, inTuneRatio, avgDeviationCents: avgDev, pitchAccuracyScore };
}
