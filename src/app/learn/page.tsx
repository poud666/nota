"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Music2, Search, X, Play, ChevronDown } from "lucide-react";
import { techniques, categories, levelColors, type Level } from "@/lib/techniques";

const ALL_LEVELS: (Level | "all")[] = ["all", "beginner", "intermediate", "advanced"];
const levelLabels = { all: "全部", beginner: "初级", intermediate: "中级", advanced: "高级" };

function BilibiliEmbed({ bvid, title, keyword }: { bvid?: string; title: string; keyword: string }) {
  const [playing, setPlaying] = useState(false);
  const searchUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`;

  if (bvid && playing) {
    return (
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-t-xl"
          src={`https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0`}
          title={title}
          allowFullScreen
          scrolling="no"
          frameBorder="0"
        />
      </div>
    );
  }

  if (bvid) {
    return (
      <div
        className="relative w-full cursor-pointer group"
        style={{ paddingTop: "56.25%", background: "rgba(0,0,0,0.4)" }}
        onClick={() => setPlaying(true)}
      >
        <img
          src={`https://i0.hdslb.com/bfs/archive/default_cover.png`}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover rounded-t-xl opacity-30"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-t-xl">
          <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: "rgba(0,161,214,0.9)" }}>
            <Play size={22} fill="white" className="text-white ml-1" />
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>点击播放 B站视频</span>
        </div>
      </div>
    );
  }

  // 没有 BV 号，显示跳转 B站搜索按钮
  return (
    <a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative w-full flex flex-col items-center justify-center gap-3 group cursor-pointer rounded-t-xl"
      style={{ paddingTop: "56.25%", background: "linear-gradient(135deg, rgba(0,161,214,0.1), rgba(0,161,214,0.05))", border: "1px solid rgba(0,161,214,0.15)", borderBottom: "none", position: "relative", display: "block" }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: "rgba(0,161,214,0.2)", border: "1px solid rgba(0,161,214,0.3)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M7.172 2.757L8.414 1.515C8.805 1.124 9.266.928 9.798.928c.53 0 .992.196 1.383.587l1.698 1.698h.242c2.803 0 5.197 1.01 7.181 2.994C22.286 8.19 23.29 10.592 23.29 13.4c0 2.809-1.003 5.21-2.988 7.194C18.318 22.578 15.924 23.58 13.114 23.58H10.77c-2.81 0-5.203-1.003-7.187-2.986C1.598 18.61.594 16.21.594 13.4c0-2.372.736-4.49 2.212-6.354L1.172 5.414A.999.999 0 011.172 4l1.586-1.586a.999.999 0 011.414 0l2 2zm2.757 1.585l-.97-.97-.97.97.97.97.97-.97zM13.114 21.58c2.254 0 4.19-.8 5.804-2.414 1.614-1.614 2.414-3.55 2.414-5.804 0-2.254-.8-4.19-2.414-5.804C17.304 5.944 15.368 5.144 13.114 5.144h-2.343c-2.254 0-4.19.8-5.804 2.414C3.353 9.172 2.553 11.108 2.553 13.362c0 2.254.8 4.19 2.414 5.804 1.614 1.614 3.55 2.414 5.804 2.414h2.343zm-1-9v4a1 1 0 01-2 0v-4a1 1 0 012 0zm4 0v4a1 1 0 01-2 0v-4a1 1 0 012 0z" fill="rgb(0,161,214)"/>
          </svg>
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-semibold" style={{ color: "rgb(0,161,214)" }}>在 B站 搜索教程</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{keyword}</p>
        </div>
      </div>
    </a>
  );
}

const levelLabelCN: Record<string, string> = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

function TechniqueCard({ t, highlight = false }: { t: typeof techniques[0]; highlight?: boolean }) {
  const lc = levelColors[t.level];
  return (
    <div id={`technique-${t.id}`} className={`glass rounded-2xl overflow-hidden glass-hover transition-all ${highlight ? "glow-purple" : ""}`}>
      <BilibiliEmbed bvid={t.bvid} title={t.name} keyword={t.bilibiliKeyword} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm leading-snug">{t.name}</h3>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${lc.text} ${lc.bg} ${lc.border}`}>
            {levelLabelCN[t.level]}
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>{t.nameEn}</p>
        <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>{t.description}</p>
        <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
          {t.category}
        </span>
      </div>
    </div>
  );
}

function LearnContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("technique");

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level | "all">("all");
  const [category, setCategory] = useState("all");
  const [showCatMenu, setShowCatMenu] = useState(false);

  useEffect(() => {
    if (highlightId) {
      setTimeout(() => {
        const el = document.getElementById(`technique-${highlightId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [highlightId]);

  const filtered = techniques.filter((t) => {
    const matchLevel = level === "all" || t.level === level;
    const matchCat = category === "all" || t.category === category;
    const matchQuery = !query || t.name.toLowerCase().includes(query.toLowerCase()) || t.tags.some((tag) => tag.includes(query.toLowerCase()));
    return matchLevel && matchCat && matchQuery;
  });

  const grouped = ALL_LEVELS.filter((l) => l !== "all").reduce((acc, l) => {
    const items = filtered.filter((t) => t.level === l);
    if (items.length) acc[l as Level] = items;
    return acc;
  }, {} as Record<Level, typeof techniques>);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f", color: "#f0f0ff" }}>
      {/* Background */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(168,85,247,0.05)" }} />

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
              <Music2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">nota</span>
          </Link>
          <Link href="/analyze" className="btn-primary px-5 py-2 rounded-full text-sm font-semibold">
            Analyze My Voice
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">技巧训练库</h1>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>共 {techniques.length} 个唱歌技巧，覆盖初级、中级、高级全阶段</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          {/* Search */}
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 flex-1 min-w-[200px]" style={{ maxWidth: "320px" }}>
            <Search size={15} style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              type="text"
              placeholder="搜索技巧…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-white/20"
            />
            {query && <button onClick={() => setQuery("")}><X size={14} style={{ color: "rgba(255,255,255,0.3)" }} /></button>}
          </div>

          {/* Level tabs */}
          <div className="flex gap-1 glass rounded-xl p-1">
            {ALL_LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={level === l
                  ? { background: "rgba(168,85,247,0.25)", color: "#c084fc" }
                  : { color: "rgba(255,255,255,0.4)" }
                }
              >
                {levelLabels[l]}
              </button>
            ))}
          </div>

          {/* Category dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCatMenu(!showCatMenu)}
              className="flex items-center gap-2 glass glass-hover rounded-xl px-4 py-2.5 text-sm"
              style={{ color: category === "all" ? "rgba(255,255,255,0.4)" : "#c084fc" }}
            >
              {category === "all" ? "All Categories" : category}
              <ChevronDown size={14} />
            </button>
            {showCatMenu && (
              <div className="absolute top-full mt-2 right-0 w-56 glass rounded-xl py-1 z-10" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  onClick={() => { setCategory("all"); setShowCatMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                  style={{ color: category === "all" ? "#c084fc" : "rgba(255,255,255,0.65)" }}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setShowCatMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                    style={{ color: category === c ? "#c084fc" : "rgba(255,255,255,0.65)" }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results count */}
        {query && (
          <p className="mb-6 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
          </p>
        )}

        {/* Grouped by level */}
        {level === "all" ? (
          <div className="space-y-14">
            {(Object.entries(grouped) as [Level, typeof techniques][]).map(([lvl, items]) => {
              const lc = levelColors[lvl];
              return (
                <section key={lvl}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-3 h-3 rounded-full ${lc.dot}`} />
                    <h2 className={`text-xl font-bold capitalize ${lc.text}`}>{lvl}</h2>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>{items.length} skills</span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((t) => <TechniqueCard key={t.id} t={t} highlight={t.id === highlightId} />)}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => <TechniqueCard key={t.id} t={t} highlight={t.id === highlightId} />)}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-semibold mb-2">No techniques found</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Try a different search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense>
      <LearnContent />
    </Suspense>
  );
}
