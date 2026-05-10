import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { songTitle = "一首歌", duration = 0, pitchCompare: pc, audioFeatures: f } = await req.json();
    if (!pc) return NextResponse.json({ error: "缺少数据" }, { status: 400 });

    const p = f?.pitch ?? {};
    const q = f?.voiceQuality ?? {};
    const v = f?.vibrato ?? {};
    const s = f?.spectrum ?? {};
    const b = f?.breath ?? {};
    const r = f?.rhythm ?? {};
    const t = f?.tonality ?? {};

    const pitchSection = `
【伴奏对比音准（最核心指标）】
- 在调帧（±50音分）  ：${pc.inTuneFrames} 帧 = ${pc.inTuneRatio}%
- 轻微跑调（50-100¢）：${pc.slightOffFrames} 帧
- 明显跑调（>100¢）  ：${pc.offTuneFrames} 帧
- 平均偏差           ：${pc.avgDeviationCents} 音分（<50 优秀，>100 明显跑调）
- 音准得分           ：${pc.pitchAccuracyScore}/100`;

    const voiceSection = f ? `
【声音质量（Praat 标准）】
- HNR 谐波噪声比   ：${q.hnr ?? "--"} dB  （理想 >20）
- Jitter 基频抖动  ：${q.jitter ?? "--"}%  （理想 <0.5）
- Shimmer 振幅抖动 ：${q.shimmer ?? "--"}% （理想 <3）
- CPPS 倒谱峰      ：${q.cpps ?? "--"} dB  （理想 >14）
- 综合质量          ：${q.qualityScore ?? "--"}/100

【颤音】
- 检测到颤音       ：${v.detected ? `是，速率 ${v.rate}Hz，深度 ${v.extent}¢` : "否"}

【气息】
- 平均乐句时长     ：${b.avgPhraseDuration ?? "--"}s
- 句内音量稳定性   ：${b.volumeStability ?? "--"}/100
- 句尾下坠率       ：${b.phraseEndDrop ?? "--"}%

【节奏】
- 规律性           ：${r.regularity ?? "--"}/100

【频谱（EQ 参考）】
- 低频占比         ：${Math.round((s.lowRatio ?? 0.3) * 100)}%（胸腔共鸣）
- 中频占比         ：${Math.round((s.midRatio ?? 0.5) * 100)}%（人声核心）
- 高频占比         ：${Math.round((s.highRatio ?? 0.2) * 100)}%（亮度）
- SPR 歌手共振峰   ：${s.spr ?? "--"} dB（>0 受训歌手特征）
- 频谱斜率         ：${s.tilt ?? "--"} dB/oct

【调性（独立音高分析）】
- 检测调性         ：${t.detectedKeyZh ?? "--"}（置信度 ${t.confidence ?? 0}%）
- 在调音符比例     ：${t.inKeyRatio ?? "--"}%` : "（声音质量数据不可用）";

    const prompt = `你是专业声乐教练，以下是用户演唱《${songTitle}》（时长 ${duration}s）的完整检测数据：
${pitchSection}
${voiceSection}

【评分规则——必须严格遵守】
- pitch（音准）     = pitchAccuracyScore 直接使用（这是和伴奏对比的真实音准）
- rhythm（节奏）    = 节奏规律性
- tone（音色）      = 综合质量评分×0.5 + 亮度×0.3 + SPR>0加10分
- breath（气息）    = 句内稳定性×0.4 + 乐句时长评分×0.4 + 句尾下坠×0.2
- expression（表现力）= 颤音评分×0.3 + 音域×0.3 + 综合表现×0.4
- 在调率<50% 则 pitch 不得超过 45
- Jitter>2% 则 tone 不得超过 50
- HNR<10dB 则 tone 不得超过 55

只返回 JSON，不要任何多余文字：

{
  "overallScore": <0-100>,
  "level": <"beginner"|"intermediate"|"advanced">,
  "scores": {
    "pitch": <0-100>,
    "rhythm": <0-100>,
    "tone": <0-100>,
    "breath": <0-100>,
    "expression": <0-100>
  },
  "strengths": ["<引用具体数值>", "<优势2>"],
  "weaknesses": ["<引用具体数值>", "<不足2>", "<不足3>"],
  "summary": "<2句点评，必须引用在调率或偏差具体数值>",
  "recommendedTechniqueIds": ["<3-5个ID>"]
}

可选ID: pitch-basics,breathing-basics,rhythm-basics,vowel-shaping,posture,warm-up,chest-head-voice,breath-support,vibrato-intro,resonance,passaggio,dynamics,phrasing,mixed-voice,runs-riffs,twang,belting,stylistic-control,vocal-health-advanced`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");

    const result = JSON.parse(jsonMatch[0]);
    result.pitchCompare = pc;
    if (f) {
      result.voiceQuality = f.voiceQuality;
      result.vibrato = f.vibrato;
      result.spectrum = f.spectrum;
      result.tonality = f.tonality;
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "分析失败，请重试" }, { status: 500 });
  }
}
