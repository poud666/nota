"use client";

import Link from "next/link";
import { Mic, BarChart3, BookOpen, Star, ChevronRight, Music2, Zap, Target, Radio } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "录音 & 分析",
    desc: "直接在浏览器录音或上传音频文件，AI 自动分析音准、节奏、音色和气息控制。",
    color: "from-purple-500 to-violet-600",
  },
  {
    icon: BarChart3,
    title: "详细评分报告",
    desc: "全方位拆解你的唱功优缺点，数据直观清晰，不猜测、不含糊。",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: BookOpen,
    title: "针对性训练",
    desc: "根据你的薄弱项匹配专项技巧，每个技巧配套 B站精选教学视频，直接练起来。",
    color: "from-amber-500 to-orange-600",
  },
];

const levels = [
  {
    level: "初级",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    dot: "bg-emerald-400",
    skills: ["音准训练", "节奏感", "自然呼吸", "咬字基础"],
  },
  {
    level: "中级",
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
    dot: "bg-purple-400",
    skills: ["气息支撑", "真声与假声", "颤音入门", "乐句处理"],
  },
  {
    level: "高级",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    dot: "bg-amber-400",
    skills: ["混声技术", "转音花腔", "风格把控", "共鸣精通"],
  },
];

const testimonials = [
  { name: "林晓雨", handle: "@xiaoyu_sings", text: "终于知道自己该练什么了，音准分析准得有点吓人。", stars: 5 },
  { name: "陈浩明", handle: "@haoming", text: "三个月从浴室歌手到登上小舞台，Nota 给了我清晰的方向。", stars: 5 },
  { name: "周梦琪", handle: "@mengqi_music", text: "技巧库太实用了，每个视频都刚好对应我的弱点。", stars: 5 },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden" style={{ background: "#0a0a0f", color: "#f0f0ff" }}>
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
              <Music2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">nota</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            <a href="#features" className="hover:text-white transition-colors">功能介绍</a>
            <Link href="/sing" className="hover:text-white transition-colors flex items-center gap-1">
              <Radio size={13} />K 歌练习
            </Link>
            <Link href="/learn" className="hover:text-white transition-colors">技巧库</Link>
          </div>
          <Link href="/analyze" className="btn-primary px-5 py-2 rounded-full text-sm font-semibold">
            免费试用
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-28">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(168,85,247,0.12)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(236,72,153,0.08)" }} />

        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm mb-8 animate-float" style={{ color: "#c084fc" }}>
          <Zap size={14} />
          AI 声乐智能分析
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6">
          发现你的声音<br />
          <span className="text-gradient">真正的潜力</span>
        </h1>

        <p className="text-lg md:text-xl max-w-xl mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          录一段，AI 立刻分析你的音准、节奏、气息和音色。
          再根据你的薄弱项，匹配专属的技巧训练视频。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/analyze" className="btn-primary flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold glow-purple">
            <Mic size={18} />
            分析我的声音
            <ChevronRight size={16} />
          </Link>
          <Link href="/sing" className="glass glass-hover flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>
            <Radio size={18} />
            K 歌练习
          </Link>
        </div>

        <div className="flex items-end gap-1 mt-16 h-10">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      </section>

      {/* 功能介绍 */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Nota 怎么帮到你</h2>
          <p className="text-center mb-16 text-lg" style={{ color: "rgba(255,255,255,0.35)" }}>从原始录音到真正进步，只需三步</p>
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

      {/* 适合人群 */}
      <section id="levels" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">适合每个阶段的歌手</h2>
          <p className="text-center mb-16 text-lg" style={{ color: "rgba(255,255,255,0.35)" }}>从零基础到专业演唱，都有对应的训练路径</p>
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

      {/* 用户评价 */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">他们都在用 Nota 练声</h2>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">准备好听真相了吗？</h2>
            <p className="mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>录 30 秒，不到 1 分钟拿到你的专属声乐报告。</p>
            <Link href="/analyze" className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-semibold">
              <Mic size={18} />
              立即免费分析
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
        <p>© 2025 Nota · 发现你的声音</p>
      </footer>
    </div>
  );
}
