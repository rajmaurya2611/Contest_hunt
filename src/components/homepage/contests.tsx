"use client";

import { useEffect, useMemo, useState } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-webgl2";

// ─── Rive config ──────────────────────────────────────────────────────────────
const RIVE_SRC = "/magic-cat.riv";
const RIVE_ARTBOARD = "WCT 01";
const RIVE_ANIMATION = "CAT RUN";

// Change if your main contest page route is different
const CONTEST_PAGE_HREF = "/contest";

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

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORM_META: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  leetcode: {
    label: "LeetCode",
    badge: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  codeforces: {
    label: "Codeforces",
    badge: "text-blue-400",
    dot: "bg-blue-400",
  },
  codechef: {
    label: "CodeChef",
    badge: "text-orange-400",
    dot: "bg-orange-400",
  },
  atcoder: {
    label: "AtCoder",
    badge: "text-teal-400",
    dot: "bg-teal-400",
  },
  hackerearth: {
    label: "HackerEarth",
    badge: "text-indigo-400",
    dot: "bg-indigo-400",
  },
  csacademy: {
    label: "CS Academy",
    badge: "text-red-400",
    dot: "bg-red-400",
  },
  code360: {
    label: "Code360",
    badge: "text-rose-400",
    dot: "bg-rose-400",
  },
};

function getPlatform(p: string) {
  return (
    PLATFORM_META[p.toLowerCase()] ?? {
      label: p,
      badge: "text-purple-400",
      dot: "bg-purple-400",
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

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
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

// ─── Cat Only Panel ───────────────────────────────────────────────────────────

function CatOnlyPanel() {
  const { rive, RiveComponent } = useRive({
    src: RIVE_SRC,
    artboard: RIVE_ARTBOARD,
    animations: RIVE_ANIMATION,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  useEffect(() => {
    if (!rive) return;

    try {
      rive.stop();
      rive.play(RIVE_ANIMATION);
    } catch (err) {
      console.error("Rive play error:", err);
    }
  }, [rive]);

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden rounded-[28px] p-0 lg:min-h-[82vh]">
      {/* <div className="pointer-events-none absolute -left-16 top-8 h-44 w-44 rounded-full bg-purple-500/20 blur-3xl" /> */}
      {/* <div className="pointer-events-none absolute -right-12 bottom-10 h-44 w-44 rounded-full bg-fuchsia-500/10 blur-3xl" /> */}

      <div className="relative z-10 h-[360px] w-full max-w-[360px] sm:h-[420px] sm:max-w-[420px] lg:h-[520px] lg:max-w-[520px]">
        <RiveComponent className="h-full w-full" />
      </div>
    </div>
  );
}

// ─── Contest Row ──────────────────────────────────────────────────────────────

function ContestListItem({
  contest,
  variant,
}: {
  contest: Contest;
  variant: "upcoming" | "live";
}) {
  const meta = getPlatform(contest.platform);

  return (
    <a
      href={contest.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-b border-white/10 py-4 transition-all duration-200 hover:border-purple-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
            <span
              className={`text-[0.72rem] font-semibold uppercase tracking-[0.15em] ${meta.badge}`}
            >
              {meta.label}
            </span>
          </div>

          <h4 className="line-clamp-2 text-sm font-semibold leading-6 text-white transition-colors duration-200 group-hover:text-purple-300">
            {contest.name}
          </h4>

          <div className="mt-2 flex flex-col gap-1 text-xs text-white/55">
            <span>
              {variant === "upcoming" ? "Starts" : "Started"} ·{" "}
              {formatDateTime(contest.start_time)}
            </span>
            <span>Duration · {formatDuration(contest.duration)}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest ${
              variant === "live"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-purple-500/30 bg-purple-500/10 text-purple-400"
            }`}
          >
            {variant}
          </span>

          <div
            className={`mt-2 text-xs font-semibold ${
              variant === "live" ? "text-green-400" : "text-purple-400"
            }`}
          >
            {variant === "live"
              ? timeLeft(contest.end_time)
              : timeUntil(contest.start_time)}
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── Contest Column ───────────────────────────────────────────────────────────

function ContestColumn({
  title,
  items,
  variant,
}: {
  title: string;
  items: Contest[];
  variant: "upcoming" | "live";
}) {
  return (
    <div className="h-full">
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
            Top 5
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${
            variant === "live"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-purple-500/30 bg-purple-500/10 text-purple-400"
          }`}
        >
          {items.length}
        </span>
      </div>

      <div>
        {items.length === 0 ? (
          <div className="py-10 text-sm text-white/35">
            No {variant} contests right now.
          </div>
        ) : (
          items.map((contest) => (
            <ContestListItem
              key={contest.id}
              contest={contest}
              variant={variant}
            />
          ))
        )}
      </div>

      <div className="pt-6">
        <a
          href={CONTEST_PAGE_HREF}
          className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-200 ${
            variant === "live"
              ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/15"
              : "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/15"
          }`}
        >
          See All
        </a>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div>
      <div className="mb-4 border-b border-white/10 pb-4">
        <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-8 w-40 animate-pulse rounded bg-white/10" />
      </div>

      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="border-b border-white/10 py-4">
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-white/10" />
        </div>
      ))}

      <div className="pt-6">
        <div className="h-11 w-28 animate-pulse rounded-2xl bg-white/10" />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ContestSection() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const topUpcoming = useMemo(() => {
    return contests
      .filter((c) => getStatus(c.start_time, c.end_time) === "upcoming")
      .sort((a, b) => a.start_time - b.start_time)
      .slice(0, 5);
  }, [contests]);

  const topLive = useMemo(() => {
    return contests
      .filter((c) => getStatus(c.start_time, c.end_time) === "live")
      .sort((a, b) => a.end_time - b.end_time)
      .slice(0, 5);
  }, [contests]);

  return (
    <section
      id="contests"
      className="relative bg-gradient-to-b from-[#020202] to-[#2C114A] px-5 py-16 md:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Coding <span className="text-[#8C45FF]">Contests</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-8 lg:min-h-[140vh] lg:grid-cols-3">
            <div>
              <div className="lg:sticky lg:top-24">
                <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-[#321255] via-[#1a0d2b] to-[#050505]">
                  <div className="h-[70vh] animate-pulse rounded-[28px] bg-white/5 lg:h-[82vh]" />
                </div>
              </div>
            </div>

            <ListSkeleton />
            <ListSkeleton />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-10 text-center text-sm text-red-400">
            ⚠️ {error}
          </div>
        ) : (
          <div className="grid gap-8 lg:min-h-[140vh] lg:grid-cols-3">
            <div>
              <div className="lg:sticky lg:top-24">
                <CatOnlyPanel />
              </div>
            </div>

            <ContestColumn
              title="Upcoming Contest"
              items={topUpcoming}
              variant="upcoming"
            />

            <ContestColumn
              title="Live Contest"
              items={topLive}
              variant="live"
            />
          </div>
        )}
      </div>
    </section>
  );
}