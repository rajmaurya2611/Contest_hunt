"use client";

import { useEffect, useMemo, useState } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-webgl2";

// ─── Rive config ──────────────────────────────────────────────────────────────
const RIVE_SRC = "/magic-cat.riv";
const RIVE_ARTBOARD = "WCT 01";
const RIVE_ANIMATION = "CAT RUN";

// Change if your main contest page route is different
const CONTEST_PAGE_HREF = "/contests";

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
  { label: string; badge: string; dot: string; logo: string }
> = {
  leetcode: {
    label: "LeetCode",
    badge: "text-yellow-400",
    dot: "bg-yellow-400",
    logo: "src/assets/icons/leetcode.png",
  },
  codeforces: {
    label: "Codeforces",
    badge: "text-blue-400",
    dot: "bg-blue-400",
    logo: "src/assets/icons/codeforces.png",
  },
  codechef: {
    label: "CodeChef",
    badge: "text-orange-400",
    dot: "bg-orange-400",
    logo: "src/assets/icons/codechef.png",
  },
  atcoder: {
    label: "AtCoder",
    badge: "text-teal-400",
    dot: "bg-teal-400",
    logo: "src/assets/icons/atcoder.png",
  },
  hackerearth: {
    label: "HackerEarth",
    badge: "text-indigo-400",
    dot: "bg-indigo-400",
    logo: "src/assets/icons/hackerearth.png",
  },
  csacademy: {
    label: "CS Academy",
    badge: "text-red-400",
    dot: "bg-red-400",
    logo: "src/assets/icons/csacademy.png",
  },
  code360: {
    label: "Code360",
    badge: "text-rose-400",
    dot: "bg-rose-400",
    logo: "src/assets/icons/code360.png",
  },
};

function getPlatform(p: string) {
  return (
    PLATFORM_META[p.toLowerCase()] ?? {
      label: p,
      badge: "text-purple-400",
      dot: "bg-purple-400",
      logo: "/assets/icons/default.png",
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
      <div className="relative z-10 h-[360px] w-full max-w-[360px] sm:h-[420px] sm:max-w-[420px] lg:h-[520px] lg:max-w-[520px]">
        <RiveComponent className="h-full w-full" />
      </div>
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function PlatformLogo({
  src,
  alt,
  dotClass,
}: {
  src: string;
  alt: string;
  dotClass: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-transform duration-300 group-hover:scale-110 md:h-[68px] md:w-[68px]">
        <span className={`h-3.5 w-3.5 rounded-full ${dotClass}`} />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-transform duration-300 group-hover:scale-110 md:h-[68px] md:w-[68px]">
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

// ─── Contest Card ─────────────────────────────────────────────────────────────

function ContestListItem({
  contest,
  variant,
}: {
  contest: Contest;
  variant: "upcoming" | "live";
}) {
  const meta = getPlatform(contest.platform);

  const statusText =
    variant === "live"
      ? `Ends in ${timeLeft(contest.end_time)}`
      : `Starts in ${timeUntil(contest.start_time).replace(/^in\s*/, "")}`;

  return (
    <a
      href={contest.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block min-h-[146px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-4 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(140,69,255,0.14)]"
    >
      <div className="flex h-full items-start gap-4">
        <PlatformLogo src={meta.logo} alt={meta.label} dotClass={meta.dot} />

        <div className="flex min-h-full min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                <span
                  className={`truncate text-[0.72rem] font-semibold uppercase tracking-[0.15em] ${meta.badge}`}
                >
                  {meta.label}
                </span>
              </div>

              <span className="shrink-0 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[0.65rem] font-bold tracking-widest text-purple-400">
                {statusText}
              </span>
            </div>

            <h4 className="line-clamp-2 text-sm font-semibold leading-6 text-white transition-colors duration-200 group-hover:text-purple-300">
              {contest.name}
            </h4>
          </div>

          <div className="mt-4 flex items-center gap-6 overflow-hidden text-xs text-white/55">
            <span className="min-w-0 truncate">
              Starts · {formatDateTime(contest.start_time)}
            </span>
            <span className="shrink-0">
              Duration · {formatDuration(contest.duration)}
            </span>
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
      <div className="mb-5 border-b border-white/10 pb-4">
        {variant === "live" ? (
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <h3 className="text-2xl font-bold text-white">{title}</h3>
          </div>
        ) : (
          <h3 className="text-2xl font-bold text-white">{title}</h3>
        )}
      </div>

      <div className="space-y-4">
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
          className="inline-flex w-full items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 text-center text-sm font-semibold text-purple-400 transition-all duration-200 hover:bg-purple-500/15"
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
      <div className="mb-5 border-b border-white/10 pb-4">
        <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="min-h-[146px] rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 animate-pulse rounded-2xl bg-white/10" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                  <div className="h-7 w-28 animate-pulse rounded-full bg-white/10" />
                </div>
                <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-white/10" />
                <div className="mt-5 h-3 w-full animate-pulse rounded bg-white/10" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6">
        <div className="h-11 w-full animate-pulse rounded-2xl bg-white/10" />
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
      className="relative font-rubik bg-[#020202] px-5 py-16 md:px-8 lg:px-10"
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