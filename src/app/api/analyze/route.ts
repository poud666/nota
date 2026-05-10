import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { songTitle = "一首歌", audioFeatures, selfDescription } = body;

    const f = audioFeatures ?? {};

    // 把技术数据翻译成自然语言给 Claude 理解
    const techSummary = f.detectedNoteCount > 0 ? `
技术检测数据（来自真实音频分析）：
- 录音时长：${f.durationSeconds} 秒
- 有效音高帧数：${f.detectedNoteCount}（数量越多说明发声越充分）
- 有声占比：${Math.round(f.voicedRatio * 100)}%（正常演唱应在 40%~80%）
- 音高稳定性：${Math.round(f.pitchStability * 100)}%（100% 为最稳定，低于 50% 说明音高飘忽）
- 音域跨度：${f.pitchRangeSemitones} 个半音（12 = 1 个八度，正常演唱 8~20）
- 平均音高：${f.avgPitchHz} Hz（女声通常 180~700 Hz，男声 80~400 Hz）
- 动态范围：${Math.round(f.dynamicRange * 100)}%（越高说明强弱变化越丰富）
- 音色清晰度：${Math.round(f.avgClarity * 100)}%（越高说明发音越干净纯正）
` : `录音时长：${f.durationSeconds ?? 30} 秒。未能检测到足够的音高数据，可能录音时间过短或音量过低。`;

    const selfDesc = selfDescription
      ? `歌手自我描述："${selfDescription}"`
      : "";

    const prompt = `你是一位专业声乐教练，正在分析一段演唱录音。歌手演唱的是《${songTitle}》。

${techSummary}
${selfDesc}

请根据以上客观数据，给出专业、客观、有建设性的声乐分析。

评分参考标准：
- 音准（pitch）：主要参考音高稳定性和清晰度
- 节奏（rhythm）：参考有声占比和演唱连贯性
- 音色（tone）：参考音色清晰度和平均音高合理性
- 气息（breath）：参考动态范围和有声占比
- 表现力（expression）：参考音域跨度和动态范围

只返回以下 JSON，不要有任何多余文字：

{
  "overallScore": <综合分 0-100，基于数据客观打分>,
  "level": <"beginner" 或 "intermediate" 或 "advanced">,
  "scores": {
    "pitch": <0-100>,
    "rhythm": <0-100>,
    "tone": <0-100>,
    "breath": <0-100>,
    "expression": <0-100>
  },
  "strengths": [<优势1>, <优势2>],
  "weaknesses": [<不足1>, <不足2>, <不足3>],
  "summary": "<2句话的个性化点评，结合具体数据说明>",
  "recommendedTechniqueIds": [<3~5个技巧ID，从以下选择: "pitch-basics","breathing-basics","rhythm-basics","vowel-shaping","posture","warm-up","chest-head-voice","breath-support","vibrato-intro","resonance","passaggio","dynamics","phrasing","mixed-voice","runs-riffs","twang","belting","stylistic-control","vocal-health-advanced">]
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
