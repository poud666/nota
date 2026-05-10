import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { songTitle = "一首歌", audioFeatures: f, selfDescription } = body;

    if (!f) return NextResponse.json({ error: "缺少音频数据" }, { status: 400 });

    const techReport = `
【音准分析】
- 音高稳定性：${f.pitch?.stability ?? 50}/100（数值越高说明每个音持续期间越稳，不飘不抖）
- 音准准确度：${f.pitch?.intonation ?? 50}/100（基于偏离最近半音的音分数，越高说明音越准）
- 演唱音域：${f.pitch?.rangeOctaves ?? 1} 个八度
- 平均音高：${f.pitch?.avgHz ?? 0} Hz（女声通常 180-700Hz，男声 80-400Hz）
- 有声占比：${Math.round((f.pitch?.voicedRatio ?? 0.6) * 100)}%

【节奏分析】
- 节奏规律性：${f.rhythm?.regularity ?? 50}/100（发声起点间隔的稳定程度）
- 检测乐句数：${f.rhythm?.phraseCount ?? 3}
- 平均发声间隔：${f.rhythm?.avgOnsetIntervalMs ?? 500} ms

【气息分析】
- 平均乐句时长：${f.breath?.avgPhraseDuration ?? 3} 秒（越长说明气息越足）
- 最长乐句：${f.breath?.maxPhraseDuration ?? 5} 秒
- 句内音量稳定性：${f.breath?.volumeStability ?? 60}/100（句中音量是否平稳，不忽大忽小）
- 句尾音高下坠率：${f.breath?.phraseEndDrop ?? 30}%（越低越好，高说明气息用尽时音高往下掉）

【频谱分析】
- 低频占比（80-300Hz，胸腔共鸣/厚度）：${Math.round((f.spectrum?.lowRatio ?? 0.3) * 100)}%
- 中频占比（300-3kHz，人声核心/清晰度）：${Math.round((f.spectrum?.midRatio ?? 0.5) * 100)}%
- 高频占比（3k-8kHz，亮度/穿透力）：${Math.round((f.spectrum?.highRatio ?? 0.2) * 100)}%
- 整体亮度：${f.spectrum?.brightness ?? 40}/100

录音时长：${f.duration ?? 30} 秒
`;

    const selfDesc = selfDescription ? `\n歌手自我描述："${selfDescription}"` : "";

    const prompt = `你是一位专业声乐教练，正在对一段演唱《${songTitle}》的录音做客观分析。

以下是通过音频算法检测到的真实数据：
${techReport}${selfDesc}

请严格根据以上客观数据评分，不要凭感觉随机给分。评分逻辑：
- pitch（音准）= 主要看"音准准确度"和"音高稳定性"
- rhythm（节奏）= 主要看"节奏规律性"
- breath（气息）= 主要看"平均乐句时长"和"句内音量稳定性"，句尾下坠率高则扣分
- tone（音色）= 主要看"整体亮度"和频谱平衡（低中高频是否合理）
- expression（表现力）= 综合音域、动态和乐句数

只返回以下 JSON，不要有任何多余文字或 markdown：

{
  "overallScore": <综合分 0-100>,
  "level": <"beginner"|"intermediate"|"advanced">,
  "scores": {
    "pitch": <0-100>,
    "rhythm": <0-100>,
    "tone": <0-100>,
    "breath": <0-100>,
    "expression": <0-100>
  },
  "strengths": ["<优势1，结合具体数据>", "<优势2>"],
  "weaknesses": ["<不足1，结合具体数据>", "<不足2>", "<不足3>"],
  "summary": "<2句话点评，必须引用至少一个具体检测数值>",
  "recommendedTechniqueIds": ["<3-5个ID，从: pitch-basics,breathing-basics,rhythm-basics,vowel-shaping,posture,warm-up,chest-head-voice,breath-support,vibrato-intro,resonance,passaggio,dynamics,phrasing,mixed-voice,runs-riffs,twang,belting,stylistic-control,vocal-health-advanced 中选>"]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "分析失败，请重试" }, { status: 500 });
  }
}
