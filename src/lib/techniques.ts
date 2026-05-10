export type Level = "beginner" | "intermediate" | "advanced";

export interface Technique {
  id: string;
  name: string;
  nameEn: string;
  level: Level;
  category: string;
  description: string;
  bvid?: string;           // B站视频 BV号（有则直接嵌入）
  bilibiliKeyword: string; // B站搜索关键词（作为备用或无BV时使用）
  tags: string[];
}

export const techniques: Technique[] = [
  // ─── 初级 ────────────────────────────────────────────────────────────
  {
    id: "pitch-basics",
    name: "音准训练",
    nameEn: "Pitch Accuracy",
    level: "beginner",
    category: "音准与节奏",
    description: "学会听音、找音、唱准音。所有唱歌技巧的基础，没有音准其他一切免谈。",
    bvid: "BV18b411p7oX",
    bilibiliKeyword: "唱歌音准训练教学",
    tags: ["音准", "节奏", "基础"],
  },
  {
    id: "breathing-basics",
    name: "横膈膜呼吸",
    nameEn: "Diaphragmatic Breathing",
    level: "beginner",
    category: "气息与支撑",
    description: "用横膈膜而不是胸腔来呼吸，是唱歌力量和控制力的来源。",
    bilibiliKeyword: "横膈膜呼吸唱歌教学",
    tags: ["气息", "横膈膜", "基础"],
  },
  {
    id: "rhythm-basics",
    name: "节奏感训练",
    nameEn: "Rhythm & Timing",
    level: "beginner",
    category: "音准与节奏",
    description: "稳住节拍，让演唱和伴奏完美契合，不抢拍也不拖拍。",
    bvid: "BV18b411p7oX",
    bilibiliKeyword: "唱歌节奏感训练",
    tags: ["节奏", "拍感", "基础"],
  },
  {
    id: "vowel-shaping",
    name: "咬字与母音",
    nameEn: "Vowel Shaping",
    level: "beginner",
    category: "咬字与吐字",
    description: "把字咬清楚、母音开口到位，直接影响音色质量和听众的理解度。",
    bilibiliKeyword: "唱歌咬字吐字技巧教学",
    tags: ["咬字", "母音", "吐字"],
  },
  {
    id: "posture",
    name: "演唱姿态",
    nameEn: "Singing Posture",
    level: "beginner",
    category: "身体技巧",
    description: "站姿坐姿正确，气道才能打开，声音才能自由流动。",
    bilibiliKeyword: "唱歌正确姿势站姿教学",
    tags: ["姿势", "站姿", "基础"],
  },
  {
    id: "warm-up",
    name: "声音热身",
    nameEn: "Vocal Warm-Up",
    level: "beginner",
    category: "声音健康",
    description: "每次开口前必做的热身练习，保护声带、唤醒共鸣、防止拉伤。",
    bvid: "BV1yp4y1k7nF",
    bilibiliKeyword: "唱歌前声音热身练习",
    tags: ["热身", "练声", "保护"],
  },

  // ─── 中级 ────────────────────────────────────────────────────────────
  {
    id: "chest-head-voice",
    name: "真声与假声",
    nameEn: "Chest Voice vs Head Voice",
    level: "intermediate",
    category: "音区与音域",
    description: "认识真声（胸声）和假声（头声）两个主要音区，掌握各自的使用场景。",
    bvid: "BV1nc411G7Jd",
    bilibiliKeyword: "真声假声区别教学唱歌",
    tags: ["真声", "假声", "音区"],
  },
  {
    id: "breath-support",
    name: "气息支撑与控制",
    nameEn: "Breath Support & Control",
    level: "intermediate",
    category: "气息与支撑",
    description: "在整个乐句中管理气流，让长音稳定持续而不憋气、不漏气。",
    bilibiliKeyword: "唱歌气息支撑控制教学",
    tags: ["气息", "支撑", "控制"],
  },
  {
    id: "vibrato-intro",
    name: "颤音入门",
    nameEn: "Introduction to Vibrato",
    level: "intermediate",
    category: "表现力",
    description: "自然的音高波动让长音更有温度和专业感，是声乐表现力的重要工具。",
    bilibiliKeyword: "唱歌颤音训练教学入门",
    tags: ["颤音", "表现力", "音色"],
  },
  {
    id: "resonance",
    name: "共鸣与腔体",
    nameEn: "Resonance & Placement",
    level: "intermediate",
    category: "音色与音感",
    description: "将声音引导到胸腔、鼻腔、头腔等不同共鸣腔，获得不同音色效果。",
    bilibiliKeyword: "唱歌共鸣腔体位置教学",
    tags: ["共鸣", "腔体", "音色"],
  },
  {
    id: "passaggio",
    name: "换声区处理",
    nameEn: "The Passaggio (Bridge)",
    level: "intermediate",
    category: "音区与音域",
    description: "平滑过渡真声和假声之间的换声区，是唱歌最难突破的关卡之一。",
    bvid: "BV16b411p7EE",
    bilibiliKeyword: "唱歌换声区怎么过渡",
    tags: ["换声区", "过渡", "音区"],
  },
  {
    id: "dynamics",
    name: "强弱控制",
    nameEn: "Dynamic Control",
    level: "intermediate",
    category: "表现力",
    description: "掌握渐强、渐弱、突强突弱，让演唱有起伏有张力。",
    bilibiliKeyword: "唱歌强弱变化控制技巧",
    tags: ["强弱", "表现力", "控制"],
  },
  {
    id: "phrasing",
    name: "乐句处理",
    nameEn: "Musical Phrasing",
    level: "intermediate",
    category: "音乐性",
    description: "像说话一样给旋律分句断句，有意图地处理每个乐句的起伏和走向。",
    bilibiliKeyword: "唱歌乐句处理情感表达",
    tags: ["乐句", "音乐性", "表达"],
  },

  // ─── 高级 ────────────────────────────────────────────────────────────
  {
    id: "mixed-voice",
    name: "混声",
    nameEn: "Mixed Voice",
    level: "advanced",
    category: "音区与音域",
    description: "将真声和假声无缝融合，打通全音域，实现林俊杰、李健式的通透高音。",
    bvid: "BV1Tt4y1k7ms",
    bilibiliKeyword: "混声教学唱歌高音技巧",
    tags: ["混声", "高音", "音域"],
  },
  {
    id: "runs-riffs",
    name: "转音与花腔",
    nameEn: "Runs & Riffs",
    level: "advanced",
    category: "灵活性与装饰音",
    description: "快速音阶连续跑动和旋律装饰，是 R&B、流行、民谣演唱的高级技巧。",
    bilibiliKeyword: "唱歌转音花腔技巧教学",
    tags: ["转音", "花腔", "灵活性"],
  },
  {
    id: "twang",
    name: "亮音技术",
    nameEn: "Twang Technique",
    level: "advanced",
    category: "音色与音感",
    description: "通过调节会厌获得明亮穿透的音色，让声音更有存在感且不费力。",
    bilibiliKeyword: "唱歌亮音技巧共鸣教学",
    tags: ["亮音", "穿透力", "音色"],
  },
  {
    id: "belting",
    name: "强力演唱（Belting）",
    nameEn: "Belting Safely",
    level: "advanced",
    category: "力量与投射",
    description: "在高音区用真声发出强劲有力的现代流行唱腔，同时保护声带不受损伤。",
    bilibiliKeyword: "belting强力高音演唱教学",
    tags: ["belting", "强音", "高音"],
  },
  {
    id: "stylistic-control",
    name: "风格与流派适应",
    nameEn: "Genre & Style Adaptation",
    level: "advanced",
    category: "音乐性",
    description: "根据流行、古典、爵士、R&B、民谣等不同风格调整音色和演唱方式。",
    bilibiliKeyword: "唱歌风格技巧流派演唱",
    tags: ["风格", "流派", "适应"],
  },
  {
    id: "vocal-health-advanced",
    name: "声音健康与保护",
    nameEn: "Advanced Vocal Health",
    level: "advanced",
    category: "声音健康",
    description: "长期护嗓方法、如何避免声带结节、蒸汽疗法以及过度使用后的恢复。",
    bilibiliKeyword: "歌手护嗓声带保护方法",
    tags: ["护嗓", "声带", "健康"],
  },
];

export const categories = [...new Set(techniques.map((t) => t.category))];

export const levelColors: Record<Level, { text: string; bg: string; border: string; dot: string }> = {
  beginner: {
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/25",
    dot: "bg-emerald-400",
  },
  intermediate: {
    text: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/25",
    dot: "bg-purple-400",
  },
  advanced: {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/25",
    dot: "bg-amber-400",
  },
};
