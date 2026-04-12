"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contest {
  id: number;
  name: string;
  platform: string;
  url: string;
  start_time: number;
  end_time: number;
  duration: number;
  description: string;
  created_at: string;
}

type Status = "live" | "upcoming" | "ended";
type Tab = Status;

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORM_META: Record<
  string,
  { label: string; badge: string; dot: string; icon: string }
> = {
  leetcode: {
    label: "LeetCode",
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
    icon: "/icons/leetcode.png",
  },
  codeforces: {
    label: "Codeforces",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
    icon: "/icons/codeforces.png",
  },
  codechef: {
    label: "CodeChef",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
    icon: "/icons/codechef.png",
  },
  atcoder: {
    label: "AtCoder",
    badge: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    dot: "bg-teal-400",
    icon: "/icons/atcoder.png",
  },
  hackerearth: {
    label: "HackerEarth",
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    dot: "bg-indigo-400",
    icon: "/icons/hackerearth.png",
  },
  csacademy: {
    label: "CS Academy",
    badge: "bg-red-500/10 text-red-400 border-red-500/30",
    dot: "bg-red-400",
    icon: "/icons/csacademy.png",
  },
  code360: {
    label: "Code360",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    dot: "bg-rose-400",
    icon: "/icons/code360.png",
  },
};

function getPlatform(p: string) {
  return (
    PLATFORM_META[p.toLowerCase()] ?? {
      label: p,
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      dot: "bg-purple-400",
      icon: "/icons/default.png",
    }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(start: number, end: number): Status {
  const now = Math.floor(Date.now() / 1000);
  if (now >= start && now <= end) return "live";
  if (now < start) return "upcoming";
  return "ended";
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateTime(unix: number) {
  return new Date(unix * 1000).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function timeUntil(unix: number) {
  const diff = unix * 1000 - Date.now();
  if (diff <= 0) return "Started";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `in ${d}d ${h}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

// ─── Contest Card ─────────────────────────────────────────────────────────────

function ContestCard({ contest }: { contest: Contest }) {
  const meta = getPlatform(contest.platform);
  const status = getStatus(contest.start_time, contest.end_time);

  const statusBadge = {
    live: "bg-green-500/10 text-green-400 border-green-500/40",
    upcoming: "bg-purple-500/10 text-purple-400 border-purple-500/40",
    ended: "bg-white/5 text-white/30 border-white/10",
  }[status];

  return (
    <a
      href={contest.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-5 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-[0_8px_32px_rgba(140,69,255,0.15)]"
    >
      {status === "live" && (
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-green-400 via-green-400/50 to-transparent" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col items-start">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2 transition-transform duration-300 group-hover:scale-110">
            <img
              src={meta.icon}
              alt={meta.label}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="mt-2 text-xs font-medium text-white">
            {meta.label}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-widest ${statusBadge}`}
        >
          {status === "live" && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
          )}
          {status}
        </span>
      </div>

      <h3 className="m-0 font-rubik text-[0.95rem] font-semibold leading-snug text-white line-clamp-2">
        {contest.name}
      </h3>

      <div className="flex flex-wrap gap-x-4 gap-y-1 font-rubik text-xs text-white/50">
        <span>🕐 {formatDateTime(contest.start_time)}</span>
        <span>⏱ {formatDuration(contest.duration)}</span>
        {status === "upcoming" && (
          <span className="font-semibold text-purple-400">
            🚀 {timeUntil(contest.start_time)}
          </span>
        )}
      </div>
    </a>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="h-5 w-24 animate-pulse rounded-md bg-white/8" />
      <div className="h-5 w-3/4 animate-pulse rounded-md bg-white/8" />
      <div className="h-4 w-1/2 animate-pulse rounded-md bg-white/8" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS: Tab[] = ["upcoming", "live", "ended"];

export default function ContestSection() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [activePlatform, setActivePlatform] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(import.meta.env.VITE_CONTESTS_API_URL!);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Contest[] = await res.json();
        setContests(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const platforms = ["all", ...Array.from(new Set(contests.map((c) => c.platform)))];

  const filtered = contests.filter((c) => {
    const s = getStatus(c.start_time, c.end_time);
    return (
      s === activeTab &&
      (activePlatform === "all" || c.platform === activePlatform) &&
      (search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.platform.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const counts: Record<Tab, number> = {
    live: contests.filter((c) => getStatus(c.start_time, c.end_time) === "live").length,
    upcoming: contests.filter((c) => getStatus(c.start_time, c.end_time) === "upcoming").length,
    ended: contests.filter((c) => getStatus(c.start_time, c.end_time) === "ended").length,
  };

  const tabActive: Record<Tab, string> = {
    live: "border-green-400 bg-green-400/10 text-green-400",
    upcoming: "border-purple-500 bg-purple-500/10 text-purple-400",
    ended: "border-white/30 bg-white/5 text-white/60",
  };

  const countActive: Record<Tab, string> = {
    live: "bg-green-400 text-black",
    upcoming: "bg-purple-500 text-white",
    ended: "bg-white/20 text-white",
  };

  return (
    <section
      id="contests"
      className="min-h-screen bg-gradient-to-b from-[#2C114A] to-[#020202] px-5 py-20 font-rubik"
    >
      <div className="mx-auto max-w-5xl">
        {/* ── Heading ───────────────────────────────── */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-purple-400">
            All Platforms · Real-time
          </p>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Upcoming <span className="text-[#8C45FF]">Contests</span>
          </h2>
          <p className="mt-3 text-sm text-white/50">
            Never miss a competitive programming contest again.
          </p>
        </div>

        {/* ── Search ────────────────────────────────── */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-white/30">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search contests or platforms…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition duration-200 focus:border-purple-500 focus:bg-white/[0.08]"
            />
          </div>
        </div>

        {/* ── Status Tabs ───────────────────────────── */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-5 py-2 text-sm font-medium capitalize transition-all duration-200 ${
                  isActive
                    ? tabActive[tab]
                    : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/60"
                }`}
              >
                {tab}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold transition-all ${
                    isActive ? countActive[tab] : "bg-white/10 text-white/40"
                  }`}
                >
                  {counts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Platform Pills ────────────────────────── */}
        <div className="mb-10 flex flex-wrap justify-center gap-5">
          {platforms.map((p) => {
            const isActive = activePlatform === p;
            const meta =
              p === "all"
                ? {
                    label: "All Platforms",
                    badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
                    icon: "",
                  }
                : getPlatform(p);

            return (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`group flex min-w-[90px] cursor-pointer flex-col items-center rounded-2xl border px-4 py-3 transition-all duration-300 ${
                  isActive
                    ? `${meta.badge} shadow-[0_8px_24px_rgba(140,69,255,0.18)]`
                    : "border-white/15 bg-white/[0.03] text-white/40 hover:border-white/30 hover:bg-white/[0.05]"
                }`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border p-2 transition-transform duration-300 group-hover:scale-110 ${
                    isActive
                      ? "border-purple-500/40 bg-white/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  {p === "all" ? (
                    <span className="text-2xl">🌐</span>
                  ) : (
                    <img
                      src={meta.icon}
                      alt={meta.label}
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>

                <span className="mt-2 text-center text-xs font-medium text-white">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Contest Grid ──────────────────────────── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-red-400">
            ⚠️ {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-white/30">
            <div className="mb-3 text-4xl">🏆</div>
            <p className="text-sm">No contests found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <ContestCard key={c.id} contest={c} />
            ))}
          </div>
        )}

        {/* ── Footer ────────────────────────────────── */}
        {!loading && !error && (
          <p className="mt-10 text-center text-xs text-white/20">
            Showing {filtered.length} contest
            {filtered.length !== 1 ? "s" : ""} · Data refreshes on reload
          </p>
        )}
      </div>
    </section>
  );
}