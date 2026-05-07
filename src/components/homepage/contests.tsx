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

type ApiContestStatus = "ongoing" | "upcoming" | "ended";

interface Contest {
  id: number;
  name: string;
  url: string;
  start_time: number;
  end_time: number;
  duration: number;
  description: string;
  platform_id: number;
  category_id: number;
  banner: string | null;
  mode: string | null;
  location: string | null;
  prize_pool: string | null;
  amount: number | string | null;
  currency: string | null;
  difficulty: string | null;
  tags: string[] | string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  platform_name: string;
  category_name: string;
  status: ApiContestStatus;
}

interface ContestApiResponse {
  success: boolean;
  data: Contest[];
  message?: string;
  timestamp?: string;
  pagination?: {
    total?: number;
    limit?: number;
    offset?: number;
    has_more?: boolean;
  };
}

type ContestCardVariant = "upcoming" | "live";

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORM_META: Record<
  string,
  { label: string; badge: string; dot: string; logo: string }
> = {
  leetcode: {
    label: "LeetCode",
    badge: "text-yellow-400",
    dot: "bg-yellow-400",
    logo: "/icons/leetcode.png",
  },
  codeforces: {
    label: "Codeforces",
    badge: "text-blue-400",
    dot: "bg-blue-400",
    logo: "/icons/codeforces.png",
  },
  codechef: {
    label: "CodeChef",
    badge: "text-orange-400",
    dot: "bg-orange-400",
    logo: "/icons/codechef.png",
  },
  atcoder: {
    label: "AtCoder",
    badge: "text-teal-400",
    dot: "bg-teal-400",
    logo: "/icons/atcoder.png",
  },
  hackerearth: {
    label: "HackerEarth",
    badge: "text-indigo-400",
    dot: "bg-indigo-400",
    logo: "/icons/hackerearth.png",
  },
  csacademy: {
    label: "CS Academy",
    badge: "text-red-400",
    dot: "bg-red-400",
    logo: "/icons/csacademy.png",
  },
  code360: {
    label: "Code360",
    badge: "text-rose-400",
    dot: "bg-rose-400",
    logo: "/icons/code360.png",
  },
  geeksforgeeks: {
    label: "GeeksforGeeks",
    badge: "text-green-400",
    dot: "bg-green-400",
    logo: "/icons/geeksforgeeks.png",
  },
  topcoder: {
    label: "TopCoder",
    badge: "text-cyan-400",
    dot: "bg-cyan-400",
    logo: "/icons/topcoder.png",
  },
  nowcoder: {
    label: "NowCoder",
    badge: "text-sky-400",
    dot: "bg-sky-400",
    logo: "/icons/nowcoder.png",
  },
  yukicoder: {
    label: "Yukicoder",
    badge: "text-fuchsia-400",
    dot: "bg-fuchsia-400",
    logo: "/icons/yukicoder.png",
  },
};

function getPlatformKey(platformName: string) {
  return platformName.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getPlatform(platformName: string) {
  const safePlatformName = platformName || "Unknown";
  const key = getPlatformKey(safePlatformName);

  return (
    PLATFORM_META[key] ?? {
      label: safePlatformName,
      badge: "text-purple-400",
      dot: "bg-purple-400",
      logo: "/icons/default.png",
    }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);

  const d = Math.floor(safeSeconds / 86400);
  const h = Math.floor((safeSeconds % 86400) / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);

  if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
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

function collectTextFromSlate(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value.map(collectTextFromSlate).filter(Boolean).join(" ");
  }

  if (typeof value === "object") {
    const item = value as Record<string, unknown>;

    const ownText = typeof item.text === "string" ? item.text : "";
    const childText = collectTextFromSlate(item.children);

    return [ownText, childText].filter(Boolean).join(" ");
  }

  return "";
}

function cleanDescription(description: string, maxLength = 500) {
  const raw = String(description || "").trim();

  if (!raw) return "Coding contest";

  let cleaned = raw;

  try {
    const parsed = JSON.parse(raw);
    const parsedText = collectTextFromSlate(parsed).replace(/\s+/g, " ").trim();

    if (parsedText) cleaned = parsedText;
  } catch {
    cleaned = raw
      .replace(/\s+/g, " ")
      .replace(/\[\{.*?'name':\s*'([^']+)'.*?\}\]/g, "$1")
      .trim();
  }

  if (cleaned.length <= maxLength) return cleaned;

  return `${cleaned.slice(0, maxLength).trim()}...`;
}

const APP_DOWNLOAD_URL =
  "https://play.google.com/store/apps/details?id=com.miraidyo.contesthunt&pcampaignid=web_share";

const BRAND_PAGE_NAME = "Contest Calendar";

function toGoogleCalendarDate(unix: number) {
  return new Date(unix * 1000)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function getGoogleCalendarUrl(contest: Contest) {
  const text = encodeURIComponent(contest.name);

  const dates = `${toGoogleCalendarDate(contest.start_time)}/${toGoogleCalendarDate(
    contest.end_time,
  )}`;

  const details = encodeURIComponent(
    `${cleanDescription(contest.description)}\n\nContest Link: ${contest.url}`,
  );

  const location = encodeURIComponent(getPlatform(contest.platform_name).label);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

async function shareContest(contest: Contest) {
  const meta = getPlatform(contest.platform_name);

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : APP_DOWNLOAD_URL;

  const shareTitle = `${contest.name} on ${meta.label}`;

  const shareMessage = `Hey, check out this contest: ${contest.name}

Platform: ${meta.label}
Starts: ${formatDateTime(contest.start_time)}
Duration: ${formatDuration(contest.duration)}

I found it on ${BRAND_PAGE_NAME}. You can track upcoming coding Contests, Hackathons and Bug Bounties, visit their links, and add them to your calendar easily.

Download the app here:
${APP_DOWNLOAD_URL}

Explore more contests:
${pageUrl}`;

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: shareTitle,
        text: shareMessage,
        url: pageUrl,
      });

      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareMessage);
      window.alert("Contest share message copied to clipboard!");
      return;
    }

    window.alert("Sharing is not supported on this browser.");
  } catch (error) {
    console.error("[ContestSection] Failed to share contest:", error);
  }
}

// ─── Action Icons ─────────────────────────────────────────────────────────────

function CalendarPlusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M8 2v4M16 2v4M3.5 9.5h17M6.5 4.5h11A3 3 0 0 1 20.5 7.5v10A3 3 0 0 1 17.5 20.5h-11A3 3 0 0 1 3.5 17.5v-10A3 3 0 0 1 6.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 13v4M10 15h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M14 5h5v5M19 5l-8 8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 6H7.5A2.5 2.5 0 0 0 5 8.5v8A2.5 2.5 0 0 0 7.5 19h8A2.5 2.5 0 0 0 18 16.5V13"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx="18"
        cy="5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle
        cx="6"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle
        cx="18"
        cy="19"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M8.2 10.9L15.7 6.3"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 13.1L15.7 17.7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      console.error("[ContestSection] Rive play error:", err);
    }
  }, [rive]);

  return (
    <div className="relative flex min-h-[70vh] w-full min-w-0 items-center justify-center overflow-hidden rounded-[28px] p-0 lg:min-h-[82vh]">
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
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-transform duration-300 group-hover:scale-110">
        <span className={`h-3.5 w-3.5 rounded-full ${dotClass}`} />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-transform duration-300 group-hover:scale-110">
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
  variant: ContestCardVariant;
}) {
  const meta = getPlatform(contest.platform_name);
  const googleCalendarUrl = getGoogleCalendarUrl(contest);

  const statusText =
    variant === "live"
      ? `Ends · ${timeLeft(contest.end_time)}`
      : `Starts · ${timeUntil(contest.start_time).replace(/^in\s*/, "")}`;

  return (
    <article className="group flex h-56 w-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-4 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(140,69,255,0.14)]">
      <div className="flex min-h-0 min-w-0 flex-1 items-start gap-4">
        <PlatformLogo src={meta.logo} alt={meta.label} dotClass={meta.dot} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />

              <span
                className={`min-w-0 truncate text-[0.72rem] font-semibold uppercase tracking-[0.15em] ${meta.badge}`}
              >
                {meta.label}
              </span>
            </div>

            <span className="max-w-32 shrink-0 truncate rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[0.65rem] font-bold tracking-widest text-purple-400 sm:max-w-none">
              {statusText}
            </span>
          </div>

          <h4 className="line-clamp-2 min-h-12 min-w-0 text-sm font-semibold leading-6 text-white transition-colors duration-200 group-hover:text-purple-300">
            {contest.name}
          </h4>

          <div className="mt-auto grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 overflow-hidden pt-3 text-xs text-white/55">
            <span className="min-w-0 truncate">
              Starts · {formatDateTime(contest.start_time)}
            </span>

            <span className="shrink-0 whitespace-nowrap text-right">
              Duration · {formatDuration(contest.duration)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex w-full min-w-0 shrink-0 items-center justify-between gap-3 border-t border-white/10 pt-3">
        <a
          href={googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-center text-[0.7rem] font-semibold text-purple-300 no-underline transition-all duration-200 hover:bg-purple-500/15"
        >
          <CalendarPlusIcon />
          <span className="truncate">Add Calendar</span>
        </a>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-4">
          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit contest"
            title="Visit contest"
            className="inline-flex items-center justify-center text-white/45 no-underline transition-all duration-200 hover:scale-110 hover:text-purple-300"
          >
            <ExternalLinkIcon />
          </a>

          <button
            type="button"
            onClick={() => shareContest(contest)}
            aria-label="Share contest"
            title="Share contest"
            className="inline-flex items-center justify-center text-white/45 transition-all duration-200 hover:scale-110 hover:text-purple-300"
          >
            <ShareIcon />
          </button>
        </div>
      </div>
    </article>
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
  variant: ContestCardVariant;
}) {
  return (
    <div className="h-full w-full min-w-0">
      <div className="mb-5 border-b border-white/10 pb-4">
        {variant === "live" ? (
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <h3 className="min-w-0 text-2xl font-bold text-white">{title}</h3>
          </div>
        ) : (
          <h3 className="min-w-0 text-2xl font-bold text-white">{title}</h3>
        )}
      </div>

      <div className="w-full min-w-0 space-y-4">
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
    <div className="w-full min-w-0">
      <div className="mb-5 border-b border-white/10 pb-4">
        <div className="h-8 w-40 max-w-full animate-pulse rounded bg-white/10" />
      </div>

      <div className="w-full min-w-0 space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-56 w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex min-w-0 items-start gap-4">
              <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-white/10" />

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="h-3 w-24 min-w-0 animate-pulse rounded bg-white/10" />
                  <div className="h-7 w-28 shrink-0 animate-pulse rounded-full bg-white/10" />
                </div>

                <div className="mt-4 h-4 w-4/5 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-white/10" />
                <div className="mt-8 h-3 w-full animate-pulse rounded bg-white/10" />
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
    let isMounted = true;

    async function fetchContests() {
      try {
        const apiUrl = import.meta.env.VITE_CONTESTS_API_URL;

        if (!apiUrl) {
          throw new Error("VITE_CONTESTS_API_URL is not defined");
        }

        console.info("[ContestSection] Fetching contests from new API:", apiUrl);

        const res = await fetch(apiUrl);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as ContestApiResponse;

        if (!json.success) {
          throw new Error(json.message || "Contest API returned success=false");
        }

        if (!Array.isArray(json.data)) {
          throw new Error("Contest API data is not an array");
        }

        const validContests = json.data.filter((contest) => {
          const isValid =
            contest &&
            typeof contest.id === "number" &&
            Boolean(contest.name) &&
            Boolean(contest.url) &&
            typeof contest.start_time === "number" &&
            typeof contest.end_time === "number" &&
            typeof contest.duration === "number" &&
            Boolean(contest.platform_name) &&
            ["ongoing", "upcoming", "ended"].includes(contest.status);

          if (!isValid) {
            console.warn("[ContestSection] Invalid contest skipped:", contest);
          }

          return isValid;
        });

        console.info("[ContestSection] New API contests loaded:", {
          total: json.data.length,
          valid: validContests.length,
          ongoing: validContests.filter((c) => c.status === "ongoing").length,
          upcoming: validContests.filter((c) => c.status === "upcoming").length,
          ended: validContests.filter((c) => c.status === "ended").length,
        });

        if (isMounted) {
          setContests(validContests);
        }
      } catch (err: unknown) {
        console.error("[ContestSection] Failed to fetch contests:", err);

        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchContests();

    return () => {
      isMounted = false;
    };
  }, []);

  const topUpcoming = useMemo(() => {
    return contests
      .filter((contest) => contest.status === "upcoming")
      .sort((a, b) => a.start_time - b.start_time)
      .slice(0, 5);
  }, [contests]);

  const topLive = useMemo(() => {
    return contests
      .filter((contest) => contest.status === "ongoing")
      .sort((a, b) => a.end_time - b.end_time)
      .slice(0, 5);
  }, [contests]);

  return (
    <section
      id="contests"
      className="relative bg-[#020202] px-5 py-16 font-rubik md:px-8 lg:px-10"
    >
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Coding <span className="text-purple-500">Contests</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid w-full min-w-0 gap-8 lg:min-h-[140vh] lg:grid-cols-3 lg:items-start">
            <div className="w-full min-w-0 lg:sticky lg:top-24 lg:self-start">
              <div className="w-full min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#321255] via-[#1a0d2b] to-[#050505]">
                <div className="h-[70vh] w-full animate-pulse rounded-[28px] bg-white/5 lg:h-[82vh]" />
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
          <div className="grid w-full min-w-0 gap-8 lg:min-h-[140vh] lg:grid-cols-3 lg:items-start">
            <div className="w-full min-w-0 lg:sticky lg:top-24 lg:self-start">
              <CatOnlyPanel />
            </div>

            <ContestColumn
              title="Upcoming Contests"
              items={topUpcoming}
              variant="upcoming"
            />

            <ContestColumn
              title="Live Contests"
              items={topLive}
              variant="live"
            />
          </div>
        )}
      </div>
    </section>
  );
}