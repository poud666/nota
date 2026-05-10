/**
 * Web Audio API 旋律合成器
 * 将音符序列渲染为 AudioBuffer，无需任何外部音频文件
 */

export interface SynthNote {
  note: string;     // "C4" "D#4" "G5" 或 "rest"
  dur: number;      // 时值（拍数，1 = 一个四分音符）
  vel?: number;     // 力度 0-1，默认 0.65
}

const NOTE_MAP: Record<string, number> = {
  C:0, "C#":1, Db:1, D:2, "D#":3, Eb:3,
  E:4, F:5, "F#":6, Gb:6, G:7, "G#":8,
  Ab:8, A:9, "A#":10, Bb:10, B:11,
};

function noteToHz(name: string): number {
  if (name === "rest") return 0;
  const m = name.match(/^([A-G]#?b?)(\d)$/);
  if (!m) return 0;
  const pc = NOTE_MAP[m[1]] ?? 0;
  const oct = parseInt(m[2], 10);
  const midi = (oct + 1) * 12 + pc;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** 将音符序列渲染为 AudioBuffer（使用 OfflineAudioContext） */
export async function synthesizeTrack(
  notes: SynthNote[],
  bpm = 80,
  sr = 44100,
): Promise<AudioBuffer> {
  const beatSec = 60 / bpm;
  const totalSec = notes.reduce((s, n) => s + n.dur * beatSec, 0) + 1; // +1s 尾音

  const offCtx = new OfflineAudioContext(1, Math.ceil(totalSec * sr), sr);

  let t = 0;
  for (const note of notes) {
    const dur = note.dur * beatSec;
    const hz  = noteToHz(note.note);

    if (hz > 0) {
      const vel = note.vel ?? 0.65;

      // 主音（三角波，类似竹笛/古筝音色）
      const osc = offCtx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = hz;

      // 泛音（八度上方，较弱）
      const osc2 = offCtx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = hz * 2;

      const gain  = offCtx.createGain();
      const gain2 = offCtx.createGain();

      osc.connect(gain);   gain.connect(offCtx.destination);
      osc2.connect(gain2); gain2.connect(offCtx.destination);

      // ADSR 包络
      const A = 0.03, D = 0.08, S = vel * 0.45, R = Math.min(0.25, dur * 0.3);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vel, t + A);
      gain.gain.linearRampToValueAtTime(S, t + A + D);
      gain.gain.setValueAtTime(S, t + dur - R);
      gain.gain.linearRampToValueAtTime(0, t + dur);

      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(vel * 0.15, t + A);
      gain2.gain.linearRampToValueAtTime(vel * 0.06, t + A + D);
      gain2.gain.setValueAtTime(vel * 0.06, t + dur - R);
      gain2.gain.linearRampToValueAtTime(0, t + dur);

      osc.start(t);  osc.stop(t + dur + 0.01);
      osc2.start(t); osc2.stop(t + dur + 0.01);
    }
    t += dur;
  }

  return offCtx.startRendering();
}

// ══════════════════════════════════════════════════════════════════════
// 内置曲谱
// ══════════════════════════════════════════════════════════════════════

/** 茉莉花（G 大调，BPM=72） */
export const JASMINE_NOTES: SynthNote[] = [
  // 好一朵美丽的茉莉花
  {note:"G4",dur:0.5},{note:"A4",dur:0.5},{note:"G4",dur:0.5},{note:"E4",dur:0.5},
  {note:"D4",dur:0.5},{note:"E4",dur:0.5},{note:"G4",dur:0.5},{note:"A4",dur:0.5},
  {note:"G4",dur:2},{note:"rest",dur:0.5},
  // 好一朵美丽的茉莉花
  {note:"G4",dur:0.5},{note:"A4",dur:0.5},{note:"G4",dur:0.5},{note:"E4",dur:0.5},
  {note:"D4",dur:0.5},{note:"E4",dur:0.5},{note:"G4",dur:0.5},{note:"A4",dur:0.5},
  {note:"G4",dur:2},{note:"rest",dur:0.5},
  // 芬芳美丽满枝桠
  {note:"A4",dur:0.5},{note:"B4",dur:0.5},{note:"A4",dur:0.5},{note:"G4",dur:0.5},
  {note:"E4",dur:0.5},{note:"G4",dur:0.5},{note:"A4",dur:1},{note:"rest",dur:0.5},
  // 又香又白人人夸
  {note:"A4",dur:0.5},{note:"G4",dur:0.5},{note:"E4",dur:0.5},{note:"G4",dur:0.5},
  {note:"D4",dur:2},{note:"rest",dur:0.5},
  // 让我来将你摘下
  {note:"D5",dur:0.5},{note:"B4",dur:0.5},{note:"A4",dur:0.5},{note:"G4",dur:0.5},
  {note:"A4",dur:0.5},{note:"G4",dur:0.5},{note:"E4",dur:1},{note:"rest",dur:0.5},
  // 送给别人家
  {note:"G4",dur:0.5},{note:"A4",dur:0.5},{note:"G4",dur:0.5},{note:"E4",dur:0.5},
  {note:"D4",dur:2},{note:"rest",dur:0.5},
  // 茉莉花呀茉莉花
  {note:"G4",dur:0.5},{note:"A4",dur:0.5},{note:"G4",dur:1},
  {note:"E4",dur:0.5},{note:"D4",dur:0.5},{note:"E4",dur:0.5},{note:"G4",dur:0.5},
  {note:"G4",dur:3},{note:"rest",dur:1},
];

/** 小星星（C 大调，BPM=90） */
export const LITTLE_STAR_NOTES: SynthNote[] = [
  // 一闪一闪亮晶晶
  {note:"C4",dur:1},{note:"C4",dur:1},{note:"G4",dur:1},{note:"G4",dur:1},
  {note:"A4",dur:1},{note:"A4",dur:1},{note:"G4",dur:2},
  // 满天都是小星星
  {note:"F4",dur:1},{note:"F4",dur:1},{note:"E4",dur:1},{note:"E4",dur:1},
  {note:"D4",dur:1},{note:"D4",dur:1},{note:"C4",dur:2},
  // 挂在天上放光明
  {note:"G4",dur:1},{note:"G4",dur:1},{note:"F4",dur:1},{note:"F4",dur:1},
  {note:"E4",dur:1},{note:"E4",dur:1},{note:"D4",dur:2},
  // 好像许多小眼睛
  {note:"G4",dur:1},{note:"G4",dur:1},{note:"F4",dur:1},{note:"F4",dur:1},
  {note:"E4",dur:1},{note:"E4",dur:1},{note:"D4",dur:2},
  // 一闪一闪亮晶晶
  {note:"C4",dur:1},{note:"C4",dur:1},{note:"G4",dur:1},{note:"G4",dur:1},
  {note:"A4",dur:1},{note:"A4",dur:1},{note:"G4",dur:2},
  // 满天都是小星星
  {note:"F4",dur:1},{note:"F4",dur:1},{note:"E4",dur:1},{note:"E4",dur:1},
  {note:"D4",dur:1},{note:"D4",dur:1},{note:"C4",dur:3},
];
