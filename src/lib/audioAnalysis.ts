/**
 * 音频特征提取模块
 * 在浏览器端分析录音，提取音准、节奏、气息、频谱、调性跑音等客观指标
 */

export interface AudioAnalysisResult {
  duration: number;

  /** 音准：音高稳定性与惰性偏差 */
  pitch: {
    stability: number;       // 0-100：音高稳定性（越高越好）
    intonation: number;      // 0-100：接近半音的程度（音准准确度）
    rangeOctaves: number;    // 演唱音域（八度）
    avgHz: number;           // 平均音高频率
    voicedRatio: number;     // 有声发音占总录音比例
  };

  /** 调性与跑音分析 */
  tonality: {
    detectedKey: string;      // 检测到的调性，如 "C Major"
    detectedKeyZh: string;    // 中文，如 "C大调"
    confidence: number;       // 调性检测置信度 0-100
    inKeyRatio: number;       // 在调内的音符比例 0-100
    offKeyRatio: number;      // 跑调音符比例 0-100
    avgOffKeyCents: number;   // 跑调时平均偏差（音分，100音分=1半音）
    inTuneScore: number;      // 综合跑调评分 0-100（越高越不跑调）
  };

  /** 节奏：发声规律性 */
  rhythm: {
    regularity: number;      // 0-100：发声间隔规律性
    phraseCount: number;     // 检测到的乐句数
    avgOnsetIntervalMs: number; // 平均发声起点间隔（毫秒）
  };

  /** 气息：乐句连贯性与音量稳定 */
  breath: {
    avgPhraseDuration: number;  // 平均乐句时长（秒）
    maxPhraseDuration: number;  // 最长乐句（秒）
    volumeStability: number;    // 0-100：句内音量稳定性
    phraseEndDrop: number;      // 0-100：句尾音高下坠程度（越低越好）
  };

  /** 频谱：低中高频能量分布 */
  spectrum: {
    lowRatio: number;   // 低频占比（80-300Hz，胸腔共鸣、厚度）
    midRatio: number;   // 中频占比（300-3kHz，人声核心、清晰度）
    highRatio: number;  // 高频占比（3k-8kHz，亮度、穿透力）
    brightness: number; // 综合亮度 0-100
  };
}

// ─── FFT（Cooley-Tukey 基-2 原位算法）────────────────────────────────────────

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // bit-reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // butterfly
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uRe = re[i + j], uIm = im[i + j];
        const vRe = re[i + j + len / 2] * curRe - im[i + j + len / 2] * curIm;
        const vIm = re[i + j + len / 2] * curIm + im[i + j + len / 2] * curRe;
        re[i + j] = uRe + vRe; im[i + j] = uIm + vIm;
        re[i + j + len / 2] = uRe - vRe; im[i + j + len / 2] = uIm - vIm;
        const tmp = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = tmp;
      }
    }
  }
}

function computeSpectrum(chunk: Float32Array, sampleRate: number) {
  const N = 2048;
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  const len = Math.min(chunk.length, N);
  // Hann 窗
  for (let i = 0; i < len; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (len - 1)));
    re[i] = chunk[i] * w;
  }
  fft(re, im);

  const binHz = sampleRate / N;
  const mag = new Float32Array(N / 2);
  for (let i = 0; i < N / 2; i++) {
    mag[i] = Math.sqrt(re[i] ** 2 + im[i] ** 2);
  }

  // 各频段能量
  let low = 0, mid = 0, high = 0, total = 0;
  for (let i = 1; i < N / 2; i++) {
    const hz = i * binHz;
    const e = mag[i] ** 2;
    total += e;
    if (hz < 300) low += e;
    else if (hz < 3000) mid += e;
    else if (hz < 8000) high += e;
  }
  return { low, mid, high, total };
}

// ─── 调性检测：Krumhansl-Schmuckler 算法 ─────────────────────────────────────

// 大调 / 小调音高分布轮廓（Krumhansl & Kessler 1982）
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];
const NOTE_EN  = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTE_ZH  = ['C','♭D','D','♭E','E','F','♯F','G','♭A','A','♭B','B'];

function pearsonCorr(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da2 = 0, db2 = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma, db = b[i] - mb;
    num += da * db; da2 += da * da; db2 += db * db;
  }
  return da2 && db2 ? num / Math.sqrt(da2 * db2) : 0;
}

function detectKey(pitchesHz: number[]) {
  // 建立音级（pitch class）直方图
  const hist = new Array(12).fill(0);
  for (const hz of pitchesHz) {
    const midi = 12 * Math.log2(hz / 440) + 69;
    hist[((Math.round(midi) % 12) + 12) % 12]++;
  }
  const total = hist.reduce((a, b) => a + b, 1);
  const norm = hist.map(v => v / total);

  let bestKey = 0, bestMode: 'major' | 'minor' = 'major', bestCorr = -Infinity;
  for (let k = 0; k < 12; k++) {
    const majR = [...KK_MAJOR.slice(k), ...KK_MAJOR.slice(0, k)];
    const minR = [...KK_MINOR.slice(k), ...KK_MINOR.slice(0, k)];
    const cMaj = pearsonCorr(norm, majR);
    const cMin = pearsonCorr(norm, minR);
    if (cMaj > bestCorr) { bestCorr = cMaj; bestKey = k; bestMode = 'major'; }
    if (cMin > bestCorr) { bestCorr = cMin; bestKey = k; bestMode = 'minor'; }
  }

  // 置信度：最佳相关系数映射到 0-100
  const confidence = Math.round(Math.max(0, Math.min(100, (bestCorr + 1) / 2 * 100)));

  return {
    key: bestKey,
    mode: bestMode,
    confidence,
    keyName: `${NOTE_EN[bestKey]} ${bestMode === 'major' ? 'Major' : 'Minor'}`,
    keyNameZh: `${NOTE_ZH[bestKey]}${bestMode === 'major' ? '大调' : '小调'}`,
  };
}

function analyzeOffKey(pitchesHz: number[], keyRoot: number, mode: 'major' | 'minor') {
  const intervals = mode === 'major' ? MAJOR_SCALE_INTERVALS : MINOR_SCALE_INTERVALS;
  // 该调的音级集合（0-11）
  const scaleNotes = new Set(intervals.map(i => (keyRoot + i) % 12));

  let offKeyCount = 0;
  let offKeyCentsSum = 0;
  let totalCentsFromChromatic = 0;

  for (const hz of pitchesHz) {
    const midiFloat = 12 * Math.log2(hz / 440) + 69;
    const pc = ((Math.round(midiFloat) % 12) + 12) % 12;
    // 偏离最近半音的音分（chromatic intonation）
    const centsFromChromatic = Math.abs((midiFloat - Math.round(midiFloat)) * 100);
    totalCentsFromChromatic += centsFromChromatic;

    // 偏离最近调内音的半音数
    let minScaleDist = Infinity;
    for (const sn of scaleNotes) {
      const d = Math.min(Math.abs(pc - sn), 12 - Math.abs(pc - sn));
      if (d < minScaleDist) minScaleDist = d;
    }

    // 总偏差 = 音分偏差 + 调外半音 × 100
    const totalDev = centsFromChromatic + minScaleDist * 100;
    if (totalDev > 80) {   // 超过 80 音分认定为跑调
      offKeyCount++;
      offKeyCentsSum += totalDev;
    }
  }

  const n = pitchesHz.length || 1;
  const offKeyRatio = Math.round((offKeyCount / n) * 100);
  const avgOffKeyCents = offKeyCount > 0 ? Math.round(offKeyCentsSum / offKeyCount) : 0;
  const avgChromatic = totalCentsFromChromatic / n;
  // 综合评分：在调比例权重 70%，音分精准度权重 30%
  const inTuneScore = Math.round(Math.max(0, Math.min(100,
    (100 - offKeyRatio) * 0.7 + Math.max(0, 100 - avgChromatic * 2) * 0.3
  )));

  return {
    inKeyRatio: 100 - offKeyRatio,
    offKeyRatio,
    avgOffKeyCents,
    inTuneScore,
  };
}

// ─── 音准检测（McLeod 风格，使用 pitchy）─────────────────────────────────────

function hzToMidi(hz: number): number {
  return 12 * Math.log2(hz / 440) + 69;
}

function midiToCents(midi: number): number {
  return (midi - Math.round(midi)) * 100; // 偏离最近半音的音分
}

// ─── 包络与节奏 ───────────────────────────────────────────────────────────────

function rms(chunk: Float32Array | Float64Array): number {
  let s = 0;
  for (const v of chunk) s += v ** 2;
  return Math.sqrt(s / chunk.length);
}

// ─── 主分析函数 ───────────────────────────────────────────────────────────────

export async function analyzeAudio(blob: Blob): Promise<AudioAnalysisResult> {
  const { PitchDetector } = await import("pitchy");
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  await ctx.close();

  const data = audioBuffer.getChannelData(0);
  const sr = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  const HOP = 512;
  const BUF = 2048;
  const detector = PitchDetector.forFloat32Array(BUF);

  // ── 逐帧分析 ─────────────────────────────────────────────────────────────
  const pitchesHz: number[] = [];
  const clarities: number[] = [];
  const centsDeviations: number[] = [];
  const frameVolumes: number[] = [];
  const spectrumAcc = { low: 0, mid: 0, high: 0, total: 0, count: 0 };

  for (let i = 0; i + BUF < data.length; i += HOP) {
    const chunk = data.slice(i, i + BUF) as unknown as Float32Array;
    const vol = rms(chunk);
    frameVolumes.push(vol);

    // 频谱（每 10 帧采样一次，节省计算）
    if ((frameVolumes.length % 10) === 0 && vol > 0.005) {
      const sp = computeSpectrum(chunk, sr);
      spectrumAcc.low += sp.low;
      spectrumAcc.mid += sp.mid;
      spectrumAcc.high += sp.high;
      spectrumAcc.total += sp.total;
      spectrumAcc.count++;
    }

    if (vol > 0.005) {
      const [pitch, clarity] = detector.findPitch(chunk, sr);
      if (clarity > 0.85 && pitch > 80 && pitch < 1200) {
        pitchesHz.push(pitch);
        clarities.push(clarity);
        const midi = hzToMidi(pitch);
        centsDeviations.push(Math.abs(midiToCents(midi)));
      }
    }
  }

  // ── 调性检测 & 跑音分析 ────────────────────────────────────────────────
  const hasEnoughPitch = pitchesHz.length >= 10;
  let tonality: AudioAnalysisResult["tonality"];

  if (hasEnoughPitch) {
    const keyInfo = detectKey(pitchesHz);
    const offKeyInfo = analyzeOffKey(pitchesHz, keyInfo.key, keyInfo.mode);
    tonality = {
      detectedKey: keyInfo.keyName,
      detectedKeyZh: keyInfo.keyNameZh,
      confidence: keyInfo.confidence,
      ...offKeyInfo,
    };
  } else {
    tonality = {
      detectedKey: "Unknown",
      detectedKeyZh: "未知",
      confidence: 0,
      inKeyRatio: 50,
      offKeyRatio: 50,
      avgOffKeyCents: 0,
      inTuneScore: 50,
    };
  }

  // ── 音准计算 ────────────────────────────────────────────────────────────

  const semitones = pitchesHz.map((p) => 12 * Math.log2(p / 440));
  const avgST = semitones.length ? semitones.reduce((a, b) => a + b) / semitones.length : 0;
  const stdST = semitones.length
    ? Math.sqrt(semitones.reduce((a, b) => a + (b - avgST) ** 2, 0) / semitones.length)
    : 4;

  // 稳定性：标准差越小越好（0-8 个半音映射到 100-0）
  const pitchStability = Math.round(Math.max(0, Math.min(100, 100 - (stdST / 8) * 100)));

  // 音准：偏离最近半音的平均音分（0-50 音分映射到 100-0）
  const avgCentsDev = centsDeviations.length
    ? centsDeviations.reduce((a, b) => a + b) / centsDeviations.length
    : 30;
  const intonation = Math.round(Math.max(0, Math.min(100, 100 - (avgCentsDev / 50) * 100)));

  const rangeOctaves = semitones.length
    ? Math.round(((Math.max(...semitones) - Math.min(...semitones)) / 12) * 10) / 10
    : 0;

  const avgHz = pitchesHz.length
    ? Math.round(pitchesHz.reduce((a, b) => a + b) / pitchesHz.length)
    : 0;

  const voicedRatio = Math.round((pitchesHz.length / (data.length / HOP)) * 100) / 100;

  // ── 节奏：发声起点检测 ──────────────────────────────────────────────────
  const ONSET_THRESH = 0.015;
  const onsets: number[] = [];
  let prevVol = 0;
  for (let i = 0; i < frameVolumes.length; i++) {
    const vol = frameVolumes[i];
    if (vol > ONSET_THRESH && prevVol <= ONSET_THRESH) {
      onsets.push(i * HOP / sr * 1000); // ms
    }
    prevVol = vol;
  }

  const intervals = onsets.slice(1).map((t, i) => t - onsets[i]);
  const avgInterval = intervals.length
    ? intervals.reduce((a, b) => a + b) / intervals.length
    : 500;
  const stdInterval = intervals.length
    ? Math.sqrt(intervals.reduce((a, b) => a + (b - avgInterval) ** 2, 0) / intervals.length)
    : 300;
  const rhythmRegularity = Math.round(Math.max(0, Math.min(100, 100 - (stdInterval / avgInterval) * 50)));

  // ── 气息：乐句长度分析 ──────────────────────────────────────────────────
  const SILENCE_GAP = Math.floor(sr * 0.15 / HOP); // 150ms 以上算断句
  const phrases: { start: number; end: number }[] = [];
  let phraseStart = -1;
  let silenceCount = 0;

  for (let i = 0; i < frameVolumes.length; i++) {
    const voiced = frameVolumes[i] > ONSET_THRESH;
    if (voiced) {
      if (phraseStart === -1) phraseStart = i;
      silenceCount = 0;
    } else {
      silenceCount++;
      if (phraseStart !== -1 && silenceCount > SILENCE_GAP) {
        phrases.push({ start: phraseStart, end: i - SILENCE_GAP });
        phraseStart = -1;
        silenceCount = 0;
      }
    }
  }
  if (phraseStart !== -1) {
    phrases.push({ start: phraseStart, end: frameVolumes.length - 1 });
  }

  const phraseDurations = phrases.map((p) => ((p.end - p.start) * HOP) / sr);
  const avgPhraseDuration = phraseDurations.length
    ? Math.round((phraseDurations.reduce((a, b) => a + b) / phraseDurations.length) * 10) / 10
    : 3;
  const maxPhraseDuration = phraseDurations.length ? Math.round(Math.max(...phraseDurations) * 10) / 10 : 5;

  // 句内音量稳定性
  let volStabilitySum = 0;
  let volStabilityCount = 0;
  for (const phrase of phrases) {
    const vols = frameVolumes.slice(phrase.start, phrase.end + 1).filter((v) => v > ONSET_THRESH);
    if (vols.length < 3) continue;
    const avg = vols.reduce((a, b) => a + b) / vols.length;
    const std = Math.sqrt(vols.reduce((a, b) => a + (b - avg) ** 2, 0) / vols.length);
    volStabilitySum += 1 - std / avg;
    volStabilityCount++;
  }
  const volumeStability = Math.round(Math.max(0, Math.min(100,
    (volStabilityCount > 0 ? volStabilitySum / volStabilityCount : 0.6) * 100)));

  // 句尾音高下坠检测
  let dropCount = 0;
  for (const phrase of phrases) {
    const end = phrase.end;
    const start = Math.max(phrase.start, end - Math.floor(0.3 * sr / HOP));
    const tailVols = frameVolumes.slice(start, end + 1);
    if (tailVols.length < 3) continue;
    const first = tailVols.slice(0, Math.ceil(tailVols.length / 2)).reduce((a, b) => a + b) / Math.ceil(tailVols.length / 2);
    const last = tailVols.slice(Math.floor(tailVols.length / 2)).reduce((a, b) => a + b) / Math.floor(tailVols.length / 2);
    if (last < first * 0.5) dropCount++;
  }
  const phraseEndDrop = phrases.length
    ? Math.round((dropCount / phrases.length) * 100)
    : 30;

  // ── 频谱计算 ────────────────────────────────────────────────────────────
  const totalSpec = spectrumAcc.total || 1;
  const lowRatio = Math.round((spectrumAcc.low / totalSpec) * 100) / 100;
  const midRatio = Math.round((spectrumAcc.mid / totalSpec) * 100) / 100;
  const highRatio = Math.round((spectrumAcc.high / totalSpec) * 100) / 100;
  const brightness = Math.round(Math.min(100, (highRatio / (lowRatio + 0.01)) * 60));

  return {
    duration: Math.round(duration),
    pitch: {
      stability: hasEnoughPitch ? pitchStability : 50,
      intonation: hasEnoughPitch ? intonation : 50,
      rangeOctaves: hasEnoughPitch ? rangeOctaves : 0,
      avgHz,
      voicedRatio,
    },
    tonality,
    rhythm: {
      regularity: rhythmRegularity,
      phraseCount: phrases.length,
      avgOnsetIntervalMs: Math.round(avgInterval),
    },
    breath: {
      avgPhraseDuration,
      maxPhraseDuration,
      volumeStability,
      phraseEndDrop,
    },
    spectrum: {
      lowRatio,
      midRatio,
      highRatio,
      brightness,
    },
  };
}
