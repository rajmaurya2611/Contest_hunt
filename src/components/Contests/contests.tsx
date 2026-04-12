"use client";

import { useEffect, useMemo, useState } from "react";

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
  {
    label: string;
    badge: string;
    dot: string;
    logo: string;
    glow: string;
  }
> = {
  leetcode: {
    label: "LeetCode",
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
    logo: "/icons/leetcode.png",
    glow: "shadow-[0_0_20px_rgba(250,204,21,0.18)]",
  },
  codeforces: {
    label: "Codeforces",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
    logo: "/icons/codeforces.png",
    glow: "shadow-[0_0_20px_rgba(96,165,250,0.18)]",
  },
  codechef: {
    label: "CodeChef",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
    logo: "/icons/codechef.png",
    glow: "shadow-[0_0_20px_rgba(251,146,60,0.18)]",
  },
  atcoder: {
    label: "AtCoder",
    badge: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    dot: "bg-teal-400",
    logo: "/icons/atcoder.png",
    glow: "shadow-[0_0_20px_rgba(45,212,191,0.18)]",
  },
  hackerearth: {
    label: "HackerEarth",
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    dot: "bg-indigo-400",
    logo: "/icons/hackerearth.png",
    glow: "shadow-[0_0_20px_rgba(129,140,248,0.18)]",
  },
  csacademy: {
    label: "CS Academy",
    badge: "bg-red-500/10 text-red-400 border-red-500/30",
    dot: "bg-red-400",
    logo: "/icons/csacademy.png",
    glow: "shadow-[0_0_20px_rgba(248,113,113,0.18)]",
  },
  code360: {
    label: "Code360",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    dot: "bg-rose-400",
    logo: "/icons/code360.png",
    glow: "shadow-[0_0_20px_rgba(251,113,133,0.18)]",
  },
};

function getPlatform(p: string) {
  return (
    PLATFORM_META[p.toLowerCase()] ?? {
      label: p,
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      dot: "bg-purple-400",
      logo: "/icons/default.png",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.18)]",
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
  return `in ${Math.max(m, 0)}m`;
}

function timeLeft(unix: number) {
  const diff = unix * 1000 - Date.now();
  if (diff <= 0) return "Ending soon";

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${Math.max(m, 0)}m left`;
}

// ─── Logo Components ──────────────────────────────────────────────────────────

function PlatformLogo({
  src,
  alt,
  size = "md",
  glow = "",
}: {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  glow?: string;
}) {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: "h-9 w-9 rounded-xl p-2",
    md: "h-11 w-11 rounded-2xl p-2.5",
    lg: "h-14 w-14 rounded-2xl p-3",
  };

  if (imgError) {
    return (
      <div
        className={`flex items-center justify-center border border-white/10 bg-white/[0.05] ${sizeMap[size]} ${glow}`}
        title={alt}
      >
        <span className="text-xs font-bold uppercase text-white/70">
          {alt.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden border border-white/10 bg-white/[0.05] backdrop-blur-sm ${sizeMap[size]} ${glow}`}
      title={alt}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

// ─── Contest Card ─────────────────────────────────────────────────────────────

function ContestCard({ contest }: { contest: Contest }) {
  const meta = getPlatform(contest.platform);
  const status = getStatus(contest.start_time, contest.end_time);

  const statusBadge = {
    live: "bg-green-500/10 text-green-400 border-green-500/40",
    upcoming: "bg-purple-500/10 text-purple-400 border-purple-500/40",
    ended: "bg-white/5 text-white/35 border-white/10",
  }[status];

  const statusText =
    status === "live"
      ? timeLeft(contest.end_time)
      : status === "upcoming"
      ? timeUntil(contest.start_time)
      : "Ended";

  return (
    <a
      href={contest.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(140,69,255,0.07)_45%,rgba(255,255,255,0.02)_100%)] p-5 no-underline backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-purple-500/40 hover:shadow-[0_18px_50px_rgba(140,69,255,0.18)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(140,69,255,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_30%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {status === "live" && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-green-400 via-green-300 to-transparent" />
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlatformLogo
              src={meta.logo}
              alt={meta.label}
              size="md"
              glow={meta.glow}
            />

            <div className="min-w-0">
              <p className="truncate text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                Platform
              </p>
              <p className="truncate text-sm font-medium text-white/80">
                {meta.label}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] ${statusBadge}`}
          >
            {status === "live" && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            )}
            {status}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="m-0 line-clamp-2 text-[1rem] font-semibold leading-7 text-white transition-colors duration-200 group-hover:text-purple-200">
            {contest.name}
          </h3>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/45">
            {contest.description?.trim()
              ? contest.description
              : "Stay prepared and lock in your next competitive programming challenge."}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/35">
              Start Time
            </p>
            <p className="mt-1 text-xs font-medium leading-5 text-white/75">
              {formatDateTime(contest.start_time)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/35">
              Duration
            </p>
            <p className="mt-1 text-xs font-medium leading-5 text-white/75">
              {formatDuration(contest.duration)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-purple-300/90">
            {statusText}
          </span>

          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white">
            Open
            <span className="text-base">↗</span>
          </span>
        </div>
      </div>
    </a>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex min-h-[220px] flex-col gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-2xl bg-white/10" />
          <div>
            <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
      </div>

      <div className="mt-2 h-5 w-4/5 animate-pulse rounded bg-white/10" />
      <div className="h-5 w-3/5 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-full animate-pulse rounded bg-white/10" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />

      <div className="mt-auto grid grid-cols-2 gap-3">
        <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
      </div>
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
        const apiUrl = import.meta.env.VITE_CONTESTS_API_URL;

        if (!apiUrl) {
          throw new Error("VITE_CONTESTS_API_URL is not defined");
        }

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: Contest[] = await res.json();
        setContests(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const platforms = useMemo(() => {
    return ["all", ...Array.from(new Set(contests.map((c) => c.platform)))];
  }, [contests]);

  const counts: Record<Tab, number> = useMemo(
    () => ({
      live: contests.filter((c) => getStatus(c.start_time, c.end_time) === "live")
        .length,
      upcoming: contests.filter(
        (c) => getStatus(c.start_time, c.end_time) === "upcoming"
      ).length,
      ended: contests.filter((c) => getStatus(c.start_time, c.end_time) === "ended")
        .length,
    }),
    [contests]
  );

  const filtered = useMemo(() => {
    const result = contests.filter((c) => {
      const s = getStatus(c.start_time, c.end_time);

      return (
        s === activeTab &&
        (activePlatform === "all" || c.platform === activePlatform) &&
        (search.trim() === "" ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.platform.toLowerCase().includes(search.toLowerCase()))
      );
    });

    if (activeTab === "upcoming") {
      return result.sort((a, b) => a.start_time - b.start_time);
    }

    if (activeTab === "live") {
      return result.sort((a, b) => a.end_time - b.end_time);
    }

    return result.sort((a, b) => b.end_time - a.end_time);
  }, [contests, activePlatform, activeTab, search]);

  const tabActive: Record<Tab, string> = {
    live: "border-green-400/40 bg-green-400/10 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.12)]",
    upcoming:
      "border-purple-500/40 bg-purple-500/10 text-purple-300 shadow-[0_0_20px_rgba(140,69,255,0.16)]",
    ended: "border-white/20 bg-white/[0.06] text-white/70",
  };

  const countActive: Record<Tab, string> = {
    live: "bg-green-400 text-black",
    upcoming: "bg-purple-500 text-white",
    ended: "bg-white/20 text-white",
  };

  return (
    <section
      id="contests"
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#2C114A] via-[#14071F] to-[#020202] px-5 py-20 font-rubik"
    >
      <div className="pointer-events-none absolute left-[-10%] top-0 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-8%] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-purple-300">
            <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]" />
            All Platforms · Real-time
          </div>

          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Discover Live & Upcoming{" "}
            <span className="bg-gradient-to-r from-[#c48cff] to-[#8C45FF] bg-clip-text text-transparent">
              Coding Contests
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/55 md:text-[15px]">
            A cleaner contest discovery layer built for competitive programmers.
            Search faster, filter smarter, and jump directly into the right challenge.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/35">
              Upcoming
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{counts.upcoming}</p>
            <p className="mt-1 text-sm text-purple-300/80">Plan your next run</p>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/35">
              Live
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{counts.live}</p>
            <p className="mt-1 text-sm text-green-300/80">Happening right now</p>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/35">
              Ended
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{counts.ended}</p>
            <p className="mt-1 text-sm text-white/45">Browse recent contests</p>
          </div>
        </div>

        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl md:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-white/30">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search contests or platforms…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.05] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:border-purple-500/60 focus:bg-white/[0.08]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium capitalize transition-all duration-200 ${
                        isActive
                          ? tabActive[tab]
                          : "border-white/15 text-white/45 hover:border-white/30 hover:bg-white/[0.03] hover:text-white/75"
                      }`}
                    >
                      {tab}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          isActive ? countActive[tab] : "bg-white/10 text-white/40"
                        }`}
                      >
                        {counts[tab]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 md:justify-start">
              {platforms.map((p) => {
                const isActive = activePlatform === p;

                if (p === "all") {
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setActivePlatform(p)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
                          : "border-white/15 bg-white/[0.03] text-white/45 hover:border-white/30 hover:text-white/75"
                      }`}
                    >
                      <span className="text-sm">✦</span>
                      All Platforms
                    </button>
                  );
                }

                const meta = getPlatform(p);

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePlatform(p)}
                    title={meta.label}
                    className={`inline-flex items-center justify-center rounded-full border p-1.5 transition-all duration-200 ${
                      isActive
                        ? "border-purple-500/40 bg-purple-500/10 shadow-[0_0_20px_rgba(140,69,255,0.14)]"
                        : "border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05]"
                    }`}
                  >
                    <PlatformLogo
                      src={meta.logo}
                      alt={meta.label}
                      size="sm"
                      glow=""
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 px-6 py-14 text-center text-sm text-red-400">
            ⚠️ {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-20 text-center backdrop-blur-xl">
            <div className="mb-4 text-5xl">🏆</div>
            <h3 className="text-xl font-semibold text-white">No contests found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Try switching the status tab, clearing the search, or choosing another platform.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <ContestCard key={c.id} contest={c} />
            ))}
          </div>
        )}

        {!loading && !error && (
          <p className="mt-10 text-center text-xs tracking-wide text-white/25">
            Showing {filtered.length} contest{filtered.length !== 1 ? "s" : ""} ·
            Refined for faster scanning
          </p>
        )}
      </div>
    </section>
  );
}