export type Level = "beginner" | "intermediate" | "advanced";

export interface Technique {
  id: string;
  name: string;
  level: Level;
  category: string;
  description: string;
  youtubeId: string;
  tags: string[];
}

export const techniques: Technique[] = [
  // ─── BEGINNER ───────────────────────────────────────────────────────
  {
    id: "pitch-basics",
    name: "Pitch Accuracy",
    level: "beginner",
    category: "Pitch & Intonation",
    description: "Learn to hear and reproduce notes correctly. The foundation of all singing.",
    youtubeId: "G9F-6bTKlRQ",
    tags: ["pitch", "intonation", "ear training"],
  },
  {
    id: "breathing-basics",
    name: "Diaphragmatic Breathing",
    level: "beginner",
    category: "Breath & Support",
    description: "Breathe from your diaphragm, not your chest. The source of power and control.",
    youtubeId: "sSJl7zIqHSE",
    tags: ["breathing", "diaphragm", "foundation"],
  },
  {
    id: "rhythm-basics",
    name: "Rhythm & Timing",
    level: "beginner",
    category: "Rhythm & Timing",
    description: "Stay in the pocket. Learn to lock your phrasing to a beat.",
    youtubeId: "WsOd5DmRrxg",
    tags: ["rhythm", "timing", "beat"],
  },
  {
    id: "vowel-shaping",
    name: "Vowel Shaping",
    level: "beginner",
    category: "Diction & Articulation",
    description: "Shape vowels cleanly to improve tone quality and intelligibility.",
    youtubeId: "Qw-PuWj8ZGs",
    tags: ["vowels", "diction", "tone"],
  },
  {
    id: "posture",
    name: "Singing Posture",
    level: "beginner",
    category: "Physical Technique",
    description: "Stand and sit correctly so your airway stays open and voice flows freely.",
    youtubeId: "WiHi-GxBG5E",
    tags: ["posture", "alignment", "beginner"],
  },
  {
    id: "warm-up",
    name: "Vocal Warm-Up",
    level: "beginner",
    category: "Vocal Health",
    description: "Essential daily exercises to warm the voice and prevent strain.",
    youtubeId: "nLSFVMGOWZc",
    tags: ["warm-up", "health", "daily"],
  },

  // ─── INTERMEDIATE ────────────────────────────────────────────────────
  {
    id: "chest-head-voice",
    name: "Chest Voice vs. Head Voice",
    level: "intermediate",
    category: "Register & Range",
    description: "Understand the two main registers and when to use each for the right sound.",
    youtubeId: "wKNwCpnSHi8",
    tags: ["chest voice", "head voice", "register"],
  },
  {
    id: "breath-support",
    name: "Breath Support & Control",
    level: "intermediate",
    category: "Breath & Support",
    description: "Manage airflow throughout long phrases and sustain notes without strain.",
    youtubeId: "eL1PNqKDNWA",
    tags: ["breath", "support", "control"],
  },
  {
    id: "vibrato-intro",
    name: "Introduction to Vibrato",
    level: "intermediate",
    category: "Expression",
    description: "Learn the natural oscillation that adds warmth and professionalism to long notes.",
    youtubeId: "ZYEoGFQ7X_4",
    tags: ["vibrato", "expression", "tone"],
  },
  {
    id: "resonance",
    name: "Resonance & Placement",
    level: "intermediate",
    category: "Tone & Color",
    description: "Direct sound to chest, mask, or head resonators for different tonal colors.",
    youtubeId: "Hzl1s8oNQ94",
    tags: ["resonance", "placement", "tone"],
  },
  {
    id: "passaggio",
    name: "The Passaggio (Bridge)",
    level: "intermediate",
    category: "Register & Range",
    description: "Smooth the transition between chest and head voice — the most challenging shift in singing.",
    youtubeId: "6YPwI4lOFBo",
    tags: ["passaggio", "bridge", "register"],
  },
  {
    id: "dynamics",
    name: "Dynamic Control",
    level: "intermediate",
    category: "Expression",
    description: "Master soft and loud passages — control crescendos, decrescendos, and sudden shifts.",
    youtubeId: "y1O5OKDSHi8",
    tags: ["dynamics", "expression", "control"],
  },
  {
    id: "phrasing",
    name: "Musical Phrasing",
    level: "intermediate",
    category: "Musicianship",
    description: "Shape melodies like sentences — with intention, breath, and flow.",
    youtubeId: "kgx4WGK0oNU",
    tags: ["phrasing", "musicianship", "expression"],
  },

  // ─── ADVANCED ────────────────────────────────────────────────────────
  {
    id: "mixed-voice",
    name: "Mixed Voice",
    level: "advanced",
    category: "Register & Range",
    description: "Blend chest and head voice into a seamless, powerful sound across your full range.",
    youtubeId: "MH3AICVWQDI",
    tags: ["mixed voice", "blend", "range"],
  },
  {
    id: "runs-riffs",
    name: "Runs & Riffs",
    level: "advanced",
    category: "Agility & Ornamentation",
    description: "Rapid scale passages and melodic embellishments — the hallmark of R&B and gospel.",
    youtubeId: "bY6gu5TJToM",
    tags: ["runs", "riffs", "agility"],
  },
  {
    id: "twang",
    name: "Twang Technique",
    level: "advanced",
    category: "Tone & Color",
    description: "Narrow the epiglottis for a bright, cutting sound that projects without strain.",
    youtubeId: "1tWh6DynOMg",
    tags: ["twang", "projection", "advanced"],
  },
  {
    id: "belting",
    name: "Belting Safely",
    level: "advanced",
    category: "Power & Projection",
    description: "Produce a powerful, contemporary sound in your upper chest register without damage.",
    youtubeId: "nUMtv3VJLvE",
    tags: ["belt", "power", "contemporary"],
  },
  {
    id: "stylistic-control",
    name: "Genre & Style Adaptation",
    level: "advanced",
    category: "Musicianship",
    description: "Shift tone, delivery, and technique to match pop, classical, jazz, R&B, and more.",
    youtubeId: "OGWBb8i7O8c",
    tags: ["style", "genre", "versatility"],
  },
  {
    id: "vocal-health-advanced",
    name: "Advanced Vocal Health",
    level: "advanced",
    category: "Vocal Health",
    description: "Long-term care, avoiding nodules, steam therapy, and recovery from overuse.",
    youtubeId: "WwjgSWoZK2Y",
    tags: ["health", "longevity", "care"],
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
