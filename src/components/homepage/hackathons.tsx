"use client";

import {
  useEffect,
  useMemo,
  useState,
  type SyntheticEvent,
} from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-webgl2";

// ─── Rive config ──────────────────────────────────────────────────────────────
const RIVE_SRC = "/magic-cat.riv";
const RIVE_ARTBOARD = "WCT 01";
const RIVE_ANIMATION = "CAT RUN";

// Change if your main hackathon page route is different
const HACKATHON_PAGE_HREF = "/hackathons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hackathon {
  id: number;
  name: string;
  platform: string;
  url: string;
  start_time: number;
  end_time: number;
  duration: number;
  description: string;
  created_at: string;
  hackathon_banner?: string;
  mode?: string;
}

type Status = "live" | "upcoming" | "ended";

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORM_META: Record<
  string,
  { label: string; badge: string; dot: string; logo: string }
> = {
  devfolio: {
    label: "Devfolio",
    badge: "text-violet-400",
    dot: "bg-violet-400",
    logo: "/icons/devfolio.png",
  },
  devpost: {
    label: "Devpost",
    badge: "text-blue-400",
    dot: "bg-blue-400",
    logo: "/icons/devpost.png",
  },
  unstop: {
    label: "Unstop",
    badge: "text-pink-400",
    dot: "bg-pink-400",
    logo: "/icons/unstop.png",
  },
  hackerearth: {
    label: "HackerEarth",
    badge: "text-emerald-400",
    dot: "bg-emerald-400",
    logo: "/icons/hackerearth.png",
  },
};

function getPlatform(p: string) {
  return (
    PLATFORM_META[p?.toLowerCase()] ?? {
      label: p || "Platform",
      badge: "text-purple-400",
      dot: "bg-purple-400",
      logo: "/icons/default.png",
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
  const totalHours = Math.floor(seconds / 3600);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0 && hours > 0) return `${days}d ${hours}h`;
  if (days > 0) return `${days}d`;
  if (totalHours > 0 && minutes > 0) return `${totalHours}h ${minutes}m`;
  if (totalHours > 0) return `${totalHours}h`;
  return `${minutes}m`;
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

function clampText(text: string, max = 110) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
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

// ─── Banner + Platform Logo ───────────────────────────────────────────────────

function HackathonBanner({
  banner,
  fallbackLogo,
  alt,
}: {
  banner?: string;
  fallbackLogo: string;
  alt: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [useContain, setUseContain] = useState(!banner);

  const imageSrc = !imgError && banner ? banner : fallbackLogo;

  function handleLoad(e: SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;

    // Smart fit:
    // - no banner / fallback logo => contain
    // - square-ish or ultra-wide images => contain
    // - normal banner ratios => cover
    const shouldContain =
      !banner || imgError || ratio < 1.45 || ratio > 3.35;

    setUseContain(shouldContain);
  }

  function handleError() {
    setImgError(true);
    setUseContain(true);
  }

  return (
    <div
      className={`relative h-[140px] w-full overflow-hidden rounded-2xl border border-white/10 md:h-[150px] ${
        useContain
          ? "bg-white/[0.06]"
          : "bg-white/[0.04]"
      }`}
    >
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`h-full w-full transition-transform duration-300 group-hover:scale-[1.02] ${
          useContain ? "object-contain p-3" : "object-cover"
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
    </div>
  );
}

function PlatformMiniLogo({
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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
        <span className={`h-3 w-3 rounded-full ${dotClass}`} />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] p-2">
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

// ─── Hackathon Card ───────────────────────────────────────────────────────────

function HackathonListItem({
  hackathon,
  variant,
}: {
  hackathon: Hackathon;
  variant: "upcoming" | "live";
}) {
  const meta = getPlatform(hackathon.platform);

  const statusText =
    variant === "live"
      ? `Ends in ${timeLeft(hackathon.end_time)}`
      : `Starts in ${timeUntil(hackathon.start_time).replace(/^in\s*/, "")}`;

  return (
    <a
      href={hackathon.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block min-h-[285px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-4 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(140,69,255,0.14)]"
    >
      <div className="flex h-full flex-col">
        <HackathonBanner
          banner={hackathon.hackathon_banner}
          fallbackLogo={meta.logo}
          alt={hackathon.name}
        />

        {/* Platform row */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <PlatformMiniLogo
              src={meta.logo}
              alt={meta.label}
              dotClass={meta.dot}
            />

            <div className="min-w-0 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              <span
                className={`truncate text-[0.72rem] font-semibold uppercase tracking-[0.15em] ${meta.badge}`}
              >
                {meta.label}
              </span>
            </div>
          </div>

          {hackathon.mode ? (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/60">
              {hackathon.mode}
            </span>
          ) : null}
        </div>

        {/* Title + status row */}
        <div className="mt-3 flex items-start justify-between gap-3">
          <h4 className="min-h-[3rem] min-w-0 flex-1 line-clamp-2 text-sm font-semibold leading-6 text-white transition-colors duration-200 group-hover:text-purple-300">
            {hackathon.name}
          </h4>

          <span className="mt-0.5 shrink-0 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[0.65rem] font-bold tracking-widest text-purple-400">
            {statusText}
          </span>
        </div>

        {/* Always reserve 2 lines for description */}
        <p className="mt-2 min-h-[2.5rem] line-clamp-2 text-xs leading-5 text-white/45">
          {hackathon.description ? clampText(hackathon.description) : "\u00A0"}
        </p>

        {/* Push meta row to bottom for consistent alignment */}
        <div className="mt-auto flex items-center gap-6 overflow-hidden pt-4 text-xs text-white/55">
          <span className="min-w-0 truncate">
            Starts · {formatDateTime(hackathon.start_time)}
          </span>
          <span className="shrink-0">
            Duration · {formatDuration(hackathon.duration)}
          </span>
        </div>
      </div>
    </a>
  );
}

// ─── Hackathon Column ─────────────────────────────────────────────────────────

function HackathonColumn({
  title,
  items,
  variant,
}: {
  title: string;
  items: Hackathon[];
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
            No {variant} hackathons right now.
          </div>
        ) : (
          items.map((hackathon) => (
            <HackathonListItem
              key={hackathon.id}
              hackathon={hackathon}
              variant={variant}
            />
          ))
        )}
      </div>

      <div className="pt-6">
        <a
          href={HACKATHON_PAGE_HREF}
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
        <div className="h-8 w-44 animate-pulse rounded bg-white/10" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="min-h-[285px] rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="h-[140px] w-full animate-pulse rounded-2xl bg-white/10 md:h-[150px]" />

            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-xl bg-white/10" />
                <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
              </div>

              <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="h-12 w-3/5 animate-pulse rounded bg-white/10" />
              <div className="h-8 w-28 animate-pulse rounded-full bg-white/10" />
            </div>

            <div className="mt-2 h-10 w-full animate-pulse rounded bg-white/10" />
            <div className="mt-auto pt-4">
              <div className="h-3 w-full animate-pulse rounded bg-white/10" />
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

export default function HackathonSection() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const apiUrl = import.meta.env.VITE_HACKATHONS_API_URL;

        if (!apiUrl) {
          throw new Error("VITE_HACKATHONS_API_URL is not defined");
        }

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: Hackathon[] = await res.json();
        setHackathons(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topUpcoming = useMemo(() => {
    return hackathons
      .filter((h) => getStatus(h.start_time, h.end_time) === "upcoming")
      .sort((a, b) => a.start_time - b.start_time)
      .slice(0, 5);
  }, [hackathons]);

  const topLive = useMemo(() => {
    return hackathons
      .filter((h) => getStatus(h.start_time, h.end_time) === "live")
      .sort((a, b) => a.end_time - b.end_time)
      .slice(0, 5);
  }, [hackathons]);

  return (
    <section
      id="hackathons"
      className="relative font-rubik bg-[#020202] px-5 py-16 md:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Trending <span className="text-[#8C45FF]">Hackathons</span>
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

            <HackathonColumn
              title="Upcoming Hackathons"
              items={topUpcoming}
              variant="upcoming"
            />

            <HackathonColumn
              title="Live Hackathons"
              items={topLive}
              variant="live"
            />
          </div>
        )}
      </div>
    </section>
  );
}