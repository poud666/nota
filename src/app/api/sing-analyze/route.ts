import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { songTitle = "一首歌", duration = 0, pitchCompare: pc } = await req.json();
    if (!pc) return NextResponse.json({ error: "缺少数据" }, { status: 400 });

    const prompt = `你是专业声乐教练，以下是用户演唱《${songTitle}》（时长 ${duration}s）的客观检测数据：

【伴奏对比音准分析】
- 有效对比帧数：${pc.totalComparable}（伴奏中有旋律音、用户也在唱的帧）
- 在调帧（±50音分内）：${pc.inTuneFrames}帧 = ${pc.inTuneRatio}%
- 轻微跑调（50-100音分）：${pc.slightOffFrames}帧
- 明显跑调（>100音分）：${pc.offTuneFrames}帧
- 平均偏差：${pc.avgDeviationCents}音分（100音分=1个半音；<50正常，>100明显跑调）
- 音准得分：${pc.pitchAccuracyScore}/100

评分标准参考：
- 在调率 >85%：优秀
- 在调率 70-85%：良好
- 在调率 50-70%：需要练习
- 在调率 <50%：跑调较严重

只返回以下 JSON，不要有任何多余文字：

{
  "overallScore": <综合分 0-100，以 pitchAccuracyScore 为主要依据>,
  "level": <"beginner"|"intermediate"|"advanced">,
  "scores": {
    "pitch": <0-100，直接用 pitchAccuracyScore>,
    "rhythm": <0-100，根据演唱时长和对比帧数估算稳定性>,
    "tone": <0-100，根据在调率估算音色>,
    "breath": <0-100，根据在调帧的连续性估算>,
    "expression": <0-100，综合评估>
  },
  "strengths": ["<优势1，引用具体数值>", "<优势2>"],
  "weaknesses": ["<不足1，引用具体数值>", "<不足2>", "<不足3>"],
  "summary": "<2句专业点评，必须引用在调率或平均偏差的具体数值>",
  "recommendedTechniqueIds": ["<3-5个ID，从: pitch-basics,breathing-basics,rhythm-basics,vowel-shaping,posture,warm-up,chest-head-voice,breath-support,vibrato-intro,resonance,passaggio,dynamics,phrasing,mixed-voice,runs-riffs,twang,belting,stylistic-control,vocal-health-advanced 中选>"]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");

    const result = JSON.parse(jsonMatch[0]);
    result.pitchCompare = pc;
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "分析失败，请重试" }, { status: 500 });
  }
}
