"use client";

import Link from "next/link";
import { Mic, BarChart3, BookOpen, Star, ChevronRight, Music2, Zap, Target } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Record & Analyze",
    desc: "Upload or record your voice directly in the browser. Our AI listens to pitch, rhythm, tone, and breath control.",
    color: "from-purple-500 to-violet-600",
  },
  {
    icon: BarChart3,
    title: "Detailed Scorecard",
    desc: "Get a full breakdown of your vocal strengths and weaknesses — no guessing, just clear data.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: BookOpen,
    title: "Targeted Training",
    desc: "A curated list of techniques matched to your gaps, with hand-picked YouTube tutorials for each skill.",
    color: "from-amber-500 to-orange-600",
  },
];

const levels = [
  {
    level: "Beginner",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    dot: "bg-emerald-400",
    skills: ["Pitch Accuracy", "Basic Rhythm", "Natural Breathing", "Vowel Shaping"],
  },
  {
    level: "Intermediate",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
    dot: "bg-purple-400",
    skills: ["Breath Support", "Chest/Head Voice", "Vibrato Intro", "Phrasing"],
  },
  {
    level: "Advanced",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    dot: "bg-amber-400",
    skills: ["Mixed Voice", "Runs & Riffs", "Stylistic Control", "Resonance Mastery"],
  },
];

const testimonials = [
  { name: "Sarah K.", handle: "@sarahsings", text: "Finally know exactly what I need to work on. The pitch analysis is scary accurate.", stars: 5 },
  { name: "Marcus T.", handle: "@marcust", text: "Went from bathroom singer to open mic performer in 3 months. Nota showed me the path.", stars: 5 },
  { name: "Yuki M.", handle: "@yukimusic", text: "The technique library is gold. Every video is actually relevant to my weak spots.", stars: 5 },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden" style={{ background: "#0a0a0f", color: "#f0f0ff" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
              <Music2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">nota</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#levels" className="hover:text-white transition-colors">Levels</a>
            <Link href="/learn" className="hover:text-white transition-colors">Techniques</Link>
          </div>
          <Link href="/analyze" className="btn-primary px-5 py-2 rounded-full text-sm font-semibold">
            Try Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-28">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(168,85,247,0.12)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(236,72,153,0.08)" }} />

        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm mb-8 animate-float" style={{ color: "#c084fc" }}>
          <Zap size={14} />
          AI-Powered Vocal Analysis
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6">
          Discover what your<br />
          <span className="text-gradient">voice is capable of</span>
        </h1>

        <p className="text-lg md:text-xl max-w-xl mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          Record a clip. Get instant AI feedback on pitch, rhythm, breath, and tone.
          Then train with expert videos matched to your exact gaps.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/analyze" className="btn-primary flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold glow-purple">
            <Mic size={18} />
            Analyze My Voice
            <ChevronRight size={16} />
          </Link>
          <Link href="/learn" className="glass glass-hover flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>
            <BookOpen size={18} />
            Browse Techniques
          </Link>
        </div>

        <div className="flex items-end gap-1 mt-16 h-10">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How Nota works</h2>
          <p className="text-center mb-16 text-lg" style={{ color: "rgba(255,255,255,0.35)" }}>Three steps from raw recording to real improvement</p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass glass-hover rounded-2xl p-8 group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{f.title}</h3>
                <p className="leading-relaxed text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill levels */}
      <section id="levels" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Built for every level</h2>
          <p className="text-center mb-16 text-lg" style={{ color: "rgba(255,255,255,0.35)" }}>From first-time singers to aspiring professionals</p>
          <div className="grid md:grid-cols-3 gap-6">
            {levels.map((l, i) => (
              <div key={i} className={`glass rounded-2xl p-8 border ${l.bg}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-3 h-3 rounded-full ${l.dot}`} />
                  <span className={`font-bold text-lg ${l.color}`}>{l.level}</span>
                </div>
                <ul className="space-y-3">
                  {l.skills.map((s, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                      <Target size={14} className={l.color} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Singers love Nota</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass glass-hover rounded-2xl p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{t.handle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 glow-purple">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to hear the truth?</h2>
            <p className="mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>Record 30 seconds. Get your full vocal report in under a minute.</p>
            <Link href="/analyze" className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-semibold">
              <Mic size={18} />
              Start Free Analysis
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Music2 size={14} />
          <span className="font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>nota</span>
        </div>
        <p>© 2025 Nota. Discover your voice.</p>
      </footer>
    </div>
  );
}
