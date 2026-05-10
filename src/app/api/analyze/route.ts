import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { songTitle = "一首歌", audioFeatures: f, selfDescription } = body;
    if (!f) return NextResponse.json({ error: "缺少音频数据" }, { status: 400 });

    const p = f.pitch    ?? {};
    const t = f.tonality ?? {};
    const r = f.rhythm   ?? {};
    const b = f.breath   ?? {};
    const s = f.spectrum ?? {};
    const q = f.voiceQuality ?? {};
    const v = f.vibrato  ?? {};

    // ── 参考标准说明（帮助 Claude 基于数据评分）────────────────────────
    const report = `
═══════════════════════════════════════════════════════
【演唱分析报告】  歌曲：《${songTitle}》  时长：${f.duration ?? 30}s
═══════════════════════════════════════════════════════

┌─ 1. 音准（Pitch）
│  稳定性       ${p.stability ?? 50}/100  （标准：>70 为良好，<40 为明显飘音）
│  音准准确度   ${p.intonation ?? 50}/100  （偏离最近半音均值：${Math.round(50-(p.intonation??50)/2)} 音分）
│  音域跨度     ${p.rangeOctaves ?? 1} 个八度  （一般演唱 0.8-2.0，职业 2.0+）
│  平均音高     ${p.avgHz ?? 0} Hz  （女声 180-700Hz，男声 80-400Hz）
│  有声占比     ${Math.round((p.voicedRatio ?? 0.6)*100)}%

├─ 2. 调性与跑音
│  检测调性     ${t.detectedKeyZh ?? '未知'}  （置信度 ${t.confidence ?? 0}%）
│  在调音符     ${t.inKeyRatio ?? 50}%  （<60% 跑调严重，>85% 优秀）
│  跑调音符     ${t.offKeyRatio ?? 50}%
│  跑调平均偏差 ${t.avgOffKeyCents ?? 0} 音分  （<80 正常，>150 明显跑调）
│  跑音评分     ${t.inTuneScore ?? 50}/100

├─ 3. 声音质量（Voice Quality，参考 Praat 标准）
│  HNR 谐波噪声比  ${q.hnr ?? 12} dB    （理想 >20dB，<10dB 声音嘶哑/漏气）
│  Jitter 基频抖动 ${q.jitter ?? 1}%     （理想 <0.5%，>1% 声音粗糙，>2% 嗓音问题）
│  Shimmer 振幅抖动 ${q.shimmer ?? 3}%   （理想 <3%，>5% 振幅不稳/漏气）
│  Shimmer(dB)    ${q.shimmerDb ?? 0.3} dB  （理想 <0.35dB）
│  CPPS 倒谱峰突出度 ${q.cpps ?? 8} dB   （理想 >14dB，<9dB 声音障碍）
│  综合质量评分   ${q.qualityScore ?? 50}/100

├─ 4. 颤音（Vibrato）
│  检测到颤音   ${v.detected ? '是' : '否（直音或无颤音）'}
│  颤音速率     ${v.rate ?? 0} Hz      （理想 4.5-6.5Hz；<4=颤抖，>7=过快）
│  颤音深度     ${v.extent ?? 0} 音分  （理想 50-120 音分峰-峰值）
│  颤音规律性   ${v.regularity ?? 0}/100
│  颤音评分     ${v.score ?? 0}/100

├─ 5. 气息（Breath）
│  平均乐句时长 ${b.avgPhraseDuration ?? 3}s  （>5s 气息充足，<2s 气息浅短）
│  最长乐句     ${b.maxPhraseDuration ?? 5}s
│  句内音量稳定 ${b.volumeStability ?? 60}/100  （越高气息越均匀）
│  句尾音高下坠率 ${b.phraseEndDrop ?? 30}%    （<20% 优秀，>50% 气息严重不足）

├─ 6. 节奏（Rhythm）
│  规律性       ${r.regularity ?? 50}/100
│  乐句数       ${r.phraseCount ?? 3}
│  平均发声间隔 ${r.avgOnsetIntervalMs ?? 500} ms

└─ 7. 频谱分析（类比混音 EQ，理想人声参考）
   低频 80-300Hz  ${Math.round((s.lowRatio??0.3)*100)}%  （胸腔共鸣/厚度，过多则浑浊）
   中频 300-3kHz  ${Math.round((s.midRatio??0.5)*100)}%  （人声核心，清晰度）
   高频 3-8kHz    ${Math.round((s.highRatio??0.2)*100)}%  （亮度/穿透力，过少则暗淡）
   SPR 歌手共振峰 ${s.spr ?? -5} dB  （>0dB 表示有歌手共振峰，受训歌手特征）
   频谱质心       ${s.centroid ?? 1500} Hz  （演唱理想范围 1500-3500Hz）
   频谱斜率       ${s.tilt ?? -6} dB/oct（理想 -3~-8，越接近 0 越明亮）
   85% 滚降点     ${s.rolloff ?? 3000} Hz
   谐波平坦度     ${s.flatness ?? 0.2}   （<0.1 为纯净谐波，>0.3 气声/噪声多）
   亮度综合分     ${s.brightness ?? 40}/100
${selfDescription ? `\n歌手自评："${selfDescription}"` : ''}
═══════════════════════════════════════════════════════`;

    const prompt = `你是专业声乐教练，以下是对一段演唱的客观声学检测报告：
${report}

【评分规则——必须严格遵守，不得随意给分】
- pitch（音准）     = 音准准确度×0.4 + 音高稳定性×0.3 + 跑音评分×0.3
- rhythm（节奏）    = 节奏规律性分直接使用
- tone（音色）      = 综合质量评分×0.5 + 亮度分×0.3 + (SPR>0?加10:0) + 频谱平坦度低则加分
- breath（气息）    = 句内音量稳定×0.4 + 乐句时长评分×0.4 + (句尾下坠率<30%?加分:扣分)×0.2
- expression（表现力）= 音域×0.3 + 颤音评分×0.3 + 动态综合×0.4

跑调音符>40% 则 pitch 不得超过 45。
Jitter>2% 则 tone 不得超过 50。
HNR<10dB 则 tone 不得超过 55。
CPPS<8 则整体质量下调 5-10 分。

只返回以下 JSON，不要有任何多余文字：

{
  "overallScore": <0-100，各维度加权均值>,
  "level": <"beginner"|"intermediate"|"advanced">,
  "scores": {
    "pitch": <0-100>,
    "rhythm": <0-100>,
    "tone": <0-100>,
    "breath": <0-100>,
    "expression": <0-100>
  },
  "strengths": ["<优势1，必须引用具体数值>", "<优势2>"],
  "weaknesses": ["<不足1，必须引用具体数值>", "<不足2>", "<不足3>"],
  "summary": "<2句专业点评，至少引用2个具体指标数值>",
  "recommendedTechniqueIds": ["<3-5个ID>"]
}

可选技巧ID: pitch-basics,breathing-basics,rhythm-basics,vowel-shaping,posture,warm-up,chest-head-voice,breath-support,vibrato-intro,resonance,passaggio,dynamics,phrasing,mixed-voice,runs-riffs,twang,belting,stylistic-control,vocal-health-advanced`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const result = JSON.parse(jsonMatch[0]);
    // 直接附上客观检测数据，供结果页展示
    if (f.tonality) result.tonality = f.tonality;
    if (f.voiceQuality) result.voiceQuality = f.voiceQuality;
    if (f.vibrato) result.vibrato = f.vibrato;
    if (f.spectrum) result.spectrum = f.spectrum;

    return NextResponse.json(result);
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "分析失败，请重试" }, { status: 500 });
  }
}
