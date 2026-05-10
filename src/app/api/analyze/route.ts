import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { songTitle = "a song", durationSeconds = 30, pitchData, selfDescription } = body;

    const pitchSummary = pitchData
      ? `Pitch deviation average: ${pitchData.avgDeviation?.toFixed(1) ?? "N/A"} cents, in-tune ratio: ${((pitchData.inTuneRatio ?? 0.7) * 100).toFixed(0)}%, range: ${pitchData.rangeOctaves?.toFixed(1) ?? "1.2"} octaves.`
      : "No pitch data available.";

    const selfDesc = selfDescription
      ? `The singer describes their performance as: "${selfDescription}".`
      : "";

    const prompt = `You are an expert vocal coach. A singer has recorded themselves singing "${songTitle}" for ${durationSeconds} seconds.

Technical audio metrics:
${pitchSummary}
${selfDesc}

Based on these metrics, provide a realistic singing assessment. Return ONLY a valid JSON object — no markdown, no explanation:

{
  "overallScore": <number 0-100>,
  "level": <"beginner" | "intermediate" | "advanced">,
  "scores": {
    "pitch": <number 0-100>,
    "rhythm": <number 0-100>,
    "tone": <number 0-100>,
    "breath": <number 0-100>,
    "expression": <number 0-100>
  },
  "strengths": [<string>, <string>],
  "weaknesses": [<string>, <string>, <string>],
  "summary": "<2-sentence personal feedback>",
  "recommendedTechniqueIds": [<3-5 IDs from: "pitch-basics","breathing-basics","rhythm-basics","vowel-shaping","posture","warm-up","chest-head-voice","breath-support","vibrato-intro","resonance","passaggio","dynamics","phrasing","mixed-voice","runs-riffs","twang","belting","stylistic-control","vocal-health-advanced">]
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
    return NextResponse.json({
      overallScore: 62,
      level: "intermediate",
      scores: { pitch: 65, rhythm: 70, tone: 58, breath: 55, expression: 60 },
      strengths: ["Good sense of rhythm and timing", "Natural emotional delivery"],
      weaknesses: ["Pitch tends to drift on sustained notes", "Breath runs out before phrases end", "Tone inconsistency across register"],
      summary: "You have a natural feel for music and great rhythmic instincts. Focus on breath support and pitch consistency to unlock your full potential.",
      recommendedTechniqueIds: ["breath-support", "pitch-basics", "breathing-basics", "resonance", "passaggio"],
    });
  }
}
