"use client";

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type WheelEvent,
} from "react";

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

type PlatformMeta = {
  label: string;
  text: string;
  dot: string;
  logo: string;
  pill: string;
};

// ─── Platform Config ──────────────────────────────────────────────────────────

const PLATFORM_META: Record<string, PlatformMeta> = {
  leetcode: {
    label: "LeetCode",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
    logo: "/icons/leetcode.png",
    pill: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  },
  codeforces: {
    label: "Codeforces",
    text: "text-blue-400",
    dot: "bg-blue-400",
    logo: "/icons/codeforces.png",
    pill: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  codechef: {
    label: "CodeChef",
    text: "text-orange-400",
    dot: "bg-orange-400",
    logo: "/icons/codechef.png",
    pill: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  },
  atcoder: {
    label: "AtCoder",
    text: "text-teal-400",
    dot: "bg-teal-400",
    logo: "/icons/atcoder.png",
    pill: "border-teal-500/30 bg-teal-500/10 text-teal-400",
  },
  hackerearth: {
    label: "HackerEarth",
    text: "text-indigo-400",
    dot: "bg-indigo-400",
    logo: "/icons/hackerearth.png",
    pill: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  },
  csacademy: {
    label: "CS Academy",
    text: "text-red-400",
    dot: "bg-red-400",
    logo: "/icons/csacademy.png",
    pill: "border-red-500/30 bg-red-500/10 text-red-400",
  },
  code360: {
    label: "Code360",
    text: "text-rose-400",
    dot: "bg-rose-400",
    logo: "/icons/code360.png",
    pill: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  },
  geeksforgeeks: {
    label: "GeeksforGeeks",
    text: "text-green-400",
    dot: "bg-green-400",
    logo: "/icons/geeksforgeeks.png",
    pill: "border-green-500/30 bg-green-500/10 text-green-400",
  },
};

function getPlatform(platform: string): PlatformMeta {
  return (
    PLATFORM_META[platform.toLowerCase()] ?? {
      label: platform,
      text: "text-purple-400",
      dot: "bg-purple-400",
      logo: "/icons/default.png",
      pill: "border-purple-500/30 bg-purple-500/10 text-purple-400",
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

function formatTime(unix: number) {
  return new Date(unix * 1000).toLocaleTimeString("en-IN", {
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

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getContestDateKey(contest: Contest) {
  return toDateKey(new Date(contest.start_time * 1000));
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day;
  });
}

function isSameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function isToday(date: Date) {
  return toDateKey(date) === toDateKey(new Date());
}

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
    `${contest.description || "Coding contest"}\n\nContest Link: ${contest.url}`,
  );

  const location = encodeURIComponent(getPlatform(contest.platform).label);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

function handleScrollHandoff(event: WheelEvent<HTMLDivElement>) {
  const element = event.currentTarget;

  const isScrollingDown = event.deltaY > 0;
  const isScrollingUp = event.deltaY < 0;

  const scrollTop = element.scrollTop;
  const clientHeight = element.clientHeight;
  const scrollHeight = element.scrollHeight;

  const atTop = scrollTop <= 0;
  const atBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;

  const canScrollInside =
    (isScrollingDown && !atBottom) || (isScrollingUp && !atTop);

  if (canScrollInside) {
    event.stopPropagation();
  }
}

// ─── Status Styles ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  Status,
  {
    badge: string;
    dot: string;
    pill: string;
    text: string;
    borderTop: string;
  }
> = {
  live: {
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]",
    pill: "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15",
    text: "text-red-400",
    borderTop: "from-red-500 via-red-500/50 to-transparent",
  },
  upcoming: {
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    dot: "bg-purple-500",
    pill:
      "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15",
    text: "text-purple-400",
    borderTop: "from-purple-500 via-purple-500/50 to-transparent",
  },
  ended: {
    badge: "border-white/10 bg-white/[0.04] text-white/35",
    dot: "bg-white/25",
    pill: "border-white/10 bg-white/[0.04] text-white/40 hover:bg-white/[0.06]",
    text: "text-white/35",
    borderTop: "from-white/20 via-white/10 to-transparent",
  },
};

// ─── Platform Logo ────────────────────────────────────────────────────────────

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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-transform duration-300 group-hover:scale-110">
        <span className={`h-3 w-3 rounded-full ${dotClass}`} />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 transition-transform duration-300 group-hover:scale-110">
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

// ─── Share Config ─────────────────────────────────────────────────────────────

const APP_DOWNLOAD_URL = "https://your-app-download-link.com";
const BRAND_PAGE_NAME = "Contest Calendar";

async function shareContest(contest: Contest) {
  const meta = getPlatform(contest.platform);

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : APP_DOWNLOAD_URL;

  const shareTitle = `${contest.name} on ${meta.label}`;

  const shareMessage = `Hey, check out this contest: ${contest.name}

Platform: ${meta.label}
Starts: ${formatDateTime(contest.start_time)}
Duration: ${formatDuration(contest.duration)}

I found it on ${BRAND_PAGE_NAME}. You can track upcoming coding contests, visit contest links, and add them to your calendar easily.

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

// ─── Icons ────────────────────────────────────────────────────────────────────

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
      width="25"
      height="25"
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
      width="23"
      height="23"
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

// ─── Contest Card ─────────────────────────────────────────────────────────────

function ContestCard({ contest }: { contest: Contest }) {
  const meta = getPlatform(contest.platform);
  const status = getStatus(contest.start_time, contest.end_time);
  const styles = STATUS_STYLES[status];
  const googleCalendarUrl = getGoogleCalendarUrl(contest);

  const timingLabel =
    status === "live"
      ? timeLeft(contest.end_time)
      : status === "upcoming"
        ? timeUntil(contest.start_time)
        : "Completed";

  return (
    <article className="group relative min-h-[210px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(140,69,255,0.14)]">
      <div
        className={`absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r ${styles.borderTop}`}
      />

      <div className="flex items-start gap-4">
        <PlatformLogo src={meta.logo} alt={meta.label} dotClass={meta.dot} />

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              <span
                className={`truncate text-[0.72rem] font-semibold uppercase tracking-[0.15em] ${meta.text}`}
              >
                {meta.label}
              </span>
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest ${styles.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
              {status}
            </span>
          </div>

          <h3 className="line-clamp-2 text-[0.98rem] font-semibold leading-6 text-white transition-colors duration-200 group-hover:text-purple-300">
            {contest.name}
          </h3>
        </div>
      </div>

      <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-xs text-white/50">
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/35">Starts</span>
          <span className="min-w-0 truncate text-right text-white/60">
            {formatDateTime(contest.start_time)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-white/35">Duration</span>
          <span className="text-white/60">{formatDuration(contest.duration)}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-white/35">
            {status === "live"
              ? "Ends"
              : status === "upcoming"
                ? "Timeline"
                : "Status"}
          </span>
          <span className={`font-semibold ${styles.text}`}>{timingLabel}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <a
          href={googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-center text-[0.72rem] font-semibold text-purple-300 no-underline transition-all duration-200 hover:bg-purple-500/15 sm:text-xs"
        >
          <CalendarPlusIcon />
          <span>Add Calendar</span>
        </a>

        <div className="ml-auto flex items-center justify-end gap-4">
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

// ─── Calendar Pill ────────────────────────────────────────────────────────────

function CalendarPill({
  contest,
  compact,
  onDetails,
}: {
  contest: Contest;
  compact: boolean;
  onDetails: (contest: Contest) => void;
}) {
  const status = getStatus(contest.start_time, contest.end_time);
  const styles = STATUS_STYLES[status];
  const meta = getPlatform(contest.platform);
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onDetails(contest);
      }}
      className={`flex w-full items-center gap-1.5 truncate rounded-lg border px-2 py-1 text-left font-semibold transition-all duration-200 ${styles.pill} ${
        compact ? "text-[0.58rem]" : "text-[0.68rem]"
      }`}
      title={contest.name}
    >
      {!compact && (
        <span className="shrink-0 text-white/45">
          {formatTime(contest.start_time)}
        </span>
      )}

      {imgError ? (
        <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
      ) : (
        <img
          src={meta.logo}
          alt={meta.label}
          className={`shrink-0 object-contain ${
            compact ? "h-3.5 w-3.5" : "h-4 w-4"
          }`}
          onError={() => setImgError(true)}
        />
      )}

      <span className="truncate text-white/80">{contest.name}</span>
    </button>
  );
}

// ─── Calendar Board ───────────────────────────────────────────────────────────

function ContestCalendar({
  month,
  contests,
  expanded,
  focusedDateKey,
  onExpandToggle,
  onMonthChange,
  onDetails,
  onShowAllForDay,
}: {
  month: Date;
  contests: Contest[];
  expanded: boolean;
  focusedDateKey: string | null;
  onExpandToggle: () => void;
  onMonthChange: (nextMonth: Date) => void;
  onDetails: (contest: Contest) => void;
  onShowAllForDay: (dateKey: string, day: Date) => void;
}) {
  const days = useMemo(() => getCalendarDays(month), [month]);

  const contestsByDate = useMemo(() => {
    const map: Record<string, Contest[]> = {};

    contests.forEach((contest) => {
      const key = getContestDateKey(contest);

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(contest);
    });

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.start_time - b.start_time);
    });

    return map;
  }, [contests]);

  const contestRows = useMemo(() => {
    const rows: Record<number, boolean> = {};

    days.forEach((day, index) => {
      const rowIndex = Math.floor(index / 7);
      const key = toDateKey(day);

      if ((contestsByDate[key] ?? []).length > 0) {
        rows[rowIndex] = true;
      }
    });

    return rows;
  }, [days, contestsByDate]);

  const goToPreviousMonth = () => {
    const next = new Date(month);
    next.setMonth(month.getMonth() - 1);
    onMonthChange(next);
  };

  const goToNextMonth = () => {
    const next = new Date(month);
    next.setMonth(month.getMonth() + 1);
    onMonthChange(next);
  };

  const goToToday = () => {
    onMonthChange(new Date());
  };

  const handleCalendarSurfaceClick = () => {
    onExpandToggle();
  };

  const stopCalendarToggle = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      onClick={handleCalendarSurfaceClick}
      className={`cursor-pointer rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.035] to-purple-950/20 shadow-[0_20px_80px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out ${
        expanded
          ? "p-4 md:p-5 hover:border-purple-500/20"
          : "p-4 hover:border-purple-500/35 hover:bg-white/[0.045]"
      }`}
    >
      <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-purple-400">
              Contest Calendar
            </p>

            <h3
              className={`mt-1 font-bold text-white ${
                expanded ? "text-2xl" : "text-xl"
              }`}
            >
              {getMonthLabel(month)}
            </h3>
          </div>

          <button
            type="button"
            onClick={(event) => {
              stopCalendarToggle(event);
              onExpandToggle();
            }}
            className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/15"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              stopCalendarToggle(event);
              goToPreviousMonth();
            }}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-purple-500/30 hover:text-white"
          >
            Prev Month
          </button>

          <button
            type="button"
            onClick={(event) => {
              stopCalendarToggle(event);
              goToToday();
            }}
            className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/15"
          >
            Today
          </button>

          <button
            type="button"
            onClick={(event) => {
              stopCalendarToggle(event);
              goToNextMonth();
            }}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60 transition hover:border-purple-500/30 hover:text-white"
          >
            Next Month
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-7 border-b border-white/10 pb-3 text-center font-semibold uppercase tracking-[0.14em] text-white/35 ${
          expanded ? "text-[0.68rem]" : "text-[0.58rem]"
        }`}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{expanded ? day : day.slice(0, 1)}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-white/10 transition-all duration-500 ease-out">
        {days.map((day, index) => {
          const key = toDateKey(day);
          const dayContests = contestsByDate[key] ?? [];
          const isFocusedDay = focusedDateKey === key;
          const rowIndex = Math.floor(index / 7);
          const rowHasContest = contestRows[rowIndex];

          const visibleLimit =
            expanded && isFocusedDay ? dayContests.length : expanded ? 3 : 2;

          const visibleContests = dayContests.slice(0, visibleLimit);
          const hiddenCount = dayContests.length - visibleContests.length;

          return (
            <div
              key={key}
              className={`border-b border-r border-white/10 p-1.5 transition-all duration-500 ease-out ${
                expanded
                  ? "min-h-[118px] md:p-2"
                  : rowHasContest
                    ? "min-h-[104px]"
                    : "min-h-[56px]"
              } ${
                isFocusedDay
                  ? "bg-purple-500/[0.08] ring-1 ring-purple-500/30"
                  : isSameMonth(day, month)
                    ? "bg-[#050505]/60"
                    : "bg-black/30 text-white/20"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className={`flex items-center justify-center rounded-full font-semibold ${
                    expanded ? "h-7 w-7 text-xs" : "h-5 w-5 text-[0.65rem]"
                  } ${
                    isToday(day)
                      ? "bg-purple-500 text-white"
                      : isSameMonth(day, month)
                        ? "text-white/65"
                        : "text-white/20"
                  }`}
                >
                  {day.getDate()}
                </span>

                {dayContests.length > 0 && (
                  <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[0.55rem] font-semibold text-white/35">
                    {dayContests.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {visibleContests.map((contest) => (
                  <CalendarPill
                    key={contest.id}
                    contest={contest}
                    compact={!expanded}
                    onDetails={onDetails}
                  />
                ))}

                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onShowAllForDay(key, day);
                    }}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-left text-[0.58rem] font-semibold text-white/35 transition hover:bg-white/[0.06] hover:text-white/55"
                  >
                    +{hiddenCount} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Details Modal ────────────────────────────────────────────────────────────

function ContestDetailsModal({
  contest,
  onClose,
}: {
  contest: Contest | null;
  onClose: () => void;
}) {
  if (!contest) return null;

  const meta = getPlatform(contest.platform);
  const status = getStatus(contest.start_time, contest.end_time);
  const styles = STATUS_STYLES[status];
  const googleCalendarUrl = getGoogleCalendarUrl(contest);

  const timingLabel =
    status === "live"
      ? timeLeft(contest.end_time)
      : status === "upcoming"
        ? timeUntil(contest.start_time)
        : "Completed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-[28px] border border-white/10 bg-[#050505] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`absolute inset-x-0 top-0 h-px rounded-t-[28px] bg-gradient-to-r ${styles.borderTop}`}
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/45 transition hover:bg-white/[0.08] hover:text-white"
        >
          Close
        </button>

        <div className="pr-20">
          <div className="mb-4 flex items-center gap-3">
            <PlatformLogo src={meta.logo} alt={meta.label} dotClass={meta.dot} />

            <div>
              <p
                className={`text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${meta.text}`}
              >
                {meta.label}
              </p>

              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-widest ${styles.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                {status}
              </span>
            </div>
          </div>

          <h3 className="text-2xl font-bold leading-snug text-white">
            {contest.name}
          </h3>
        </div>

        {contest.description && (
          <p className="mt-4 line-clamp-4 text-sm leading-6 text-white/45">
            {contest.description}
          </p>
        )}

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-white/35">Starts</span>
            <span className="text-right font-medium text-white/70">
              {formatDateTime(contest.start_time)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-white/35">Ends</span>
            <span className="text-right font-medium text-white/70">
              {formatDateTime(contest.end_time)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-white/35">Duration</span>
            <span className="font-medium text-white/70">
              {formatDuration(contest.duration)}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-white/35">
              {status === "live"
                ? "Ends In"
                : status === "upcoming"
                  ? "Timeline"
                  : "Status"}
            </span>
            <span className={`text-right font-semibold ${styles.text}`}>
              {timingLabel}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-center text-[0.72rem] font-semibold text-purple-300 no-underline transition-all duration-200 hover:bg-purple-500/15 sm:text-xs"
          >
            <CalendarPlusIcon />
            <span>Add Calendar</span>
          </a>

          <div className="ml-auto flex items-center justify-end gap-4">
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
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="min-h-[210px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-white/10" />

        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
          </div>

          <div className="mt-4 h-4 w-4/5 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-white/10" />
        </div>
      </div>

      <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
        <div className="h-3 w-full animate-pulse rounded bg-white/10" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="min-h-[520px] rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.035] to-purple-950/20 p-4">
      <div className="h-full animate-pulse rounded-[24px] bg-white/[0.03]" />
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
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [focusedCalendarDate, setFocusedCalendarDate] = useState<string | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      try {
        const apiUrl = import.meta.env.VITE_CONTESTS_API_URL;

        if (!apiUrl) {
          throw new Error("VITE_CONTESTS_API_URL is not defined");
        }

        const res = await fetch(apiUrl);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: Contest[] = await res.json();
        setContests(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch contests");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const platforms = useMemo(() => {
    return ["all", ...Array.from(new Set(contests.map((c) => c.platform)))];
  }, [contests]);

  const counts = useMemo<Record<Tab, number>>(() => {
    return {
      live: contests.filter((c) => getStatus(c.start_time, c.end_time) === "live")
        .length,
      upcoming: contests.filter(
        (c) => getStatus(c.start_time, c.end_time) === "upcoming",
      ).length,
      ended: contests.filter((c) => getStatus(c.start_time, c.end_time) === "ended")
        .length,
    };
  }, [contests]);

  const filteredContests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return contests
      .filter((contest) => {
        const status = getStatus(contest.start_time, contest.end_time);

        const matchesTab = status === activeTab;
        const matchesPlatform =
          activePlatform === "all" || contest.platform === activePlatform;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          contest.name.toLowerCase().includes(normalizedSearch) ||
          contest.platform.toLowerCase().includes(normalizedSearch);

        return matchesTab && matchesPlatform && matchesSearch;
      })
      .sort((a, b) => {
        if (activeTab === "live") return a.end_time - b.end_time;
        if (activeTab === "upcoming") return a.start_time - b.start_time;
        return b.end_time - a.end_time;
      });
  }, [activePlatform, activeTab, contests, search]);

  const handleCalendarExpandToggle = () => {
    if (calendarExpanded) {
      setFocusedCalendarDate(null);
    }

    setCalendarExpanded((prev) => !prev);
  };

  const handleCalendarMonthChange = (nextMonth: Date) => {
    setCalendarMonth(nextMonth);
    setFocusedCalendarDate(null);
  };

  const handleShowAllForDay = (dateKey: string, day: Date) => {
    setCalendarExpanded(true);
    setFocusedCalendarDate(dateKey);
    setCalendarMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  };

  const tabActive: Record<Tab, string> = {
    live: "border-red-500/40 bg-red-500/10 text-red-400",
    upcoming: "border-purple-500/40 bg-purple-500/10 text-purple-400",
    ended: "border-white/20 bg-white/[0.04] text-white/55",
  };

  const countActive: Record<Tab, string> = {
    live: "bg-red-500 text-white",
    upcoming: "bg-purple-500 text-white",
    ended: "bg-white/20 text-white",
  };

  return (
    <section
      id="contests"
      className="relative min-h-screen overflow-hidden bg-[#020202] px-5 py-20 font-rubik md:px-8 lg:px-10"
    >
      <style>
        {`
          .contest-hidden-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .contest-hidden-scrollbar::-webkit-scrollbar {
            width: 0px;
            height: 0px;
            display: none;
          }
        `}
      </style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute bottom-20 right-0 h-[320px] w-[320px] rounded-full bg-[#8C45FF]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-xl">
            <input
              type="text"
              placeholder="Search contests or platforms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-purple-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(140,69,255,0.08)]"
            />
          </div>
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-semibold capitalize transition-all duration-200 ${
                  isActive
                    ? tabActive[tab]
                    : "border-white/10 bg-white/[0.03] text-white/40 hover:border-purple-500/30 hover:bg-white/[0.05] hover:text-white/70"
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

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <CalendarSkeleton />

            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-10 text-center text-sm text-red-400">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 transition-all duration-500 ease-out lg:h-[calc(100vh-260px)] lg:min-h-[560px] lg:grid-cols-3 lg:overflow-visible">
            <aside
              className={`min-h-0 transition-all duration-500 ease-out ${
                calendarExpanded ? "lg:col-span-2" : "lg:col-span-1"
              }`}
            >
              <div
                onWheel={handleScrollHandoff}
                className="contest-hidden-scrollbar h-full overflow-y-auto overscroll-y-auto pr-1"
              >
                <ContestCalendar
                  month={calendarMonth}
                  contests={filteredContests}
                  expanded={calendarExpanded}
                  focusedDateKey={focusedCalendarDate}
                  onExpandToggle={handleCalendarExpandToggle}
                  onMonthChange={handleCalendarMonthChange}
                  onDetails={setSelectedContest}
                  onShowAllForDay={handleShowAllForDay}
                />
              </div>
            </aside>

            <main
              className={`min-h-0 transition-all duration-500 ease-out ${
                calendarExpanded ? "lg:col-span-1" : "lg:col-span-2"
              }`}
            >
              <div
                onWheel={handleScrollHandoff}
                className="contest-hidden-scrollbar h-full overflow-y-auto overscroll-y-auto pr-1"
              >
                <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/45">
                      Browse contest cards, inspect dates in calendar view, and
                      add events directly to Google Calendar.
                    </p>

                    <h3 className="mt-1 text-2xl font-bold capitalize text-white">
                      {activeTab}
                    </h3>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/40">
                    {filteredContests.length}
                  </span>
                </div>

                {filteredContests.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 px-6 py-20 text-center">
                    <p className="text-lg font-semibold text-white">
                      No contests found
                    </p>

                    <p className="mt-2 text-sm text-white/40">
                      Try changing the status tab, platform filter, or search keyword.
                    </p>
                  </div>
                ) : (
                  <div
                    className={
                      calendarExpanded
                        ? "grid gap-5 pb-1"
                        : "grid gap-5 pb-1 sm:grid-cols-2"
                    }
                  >
                    {filteredContests.map((contest) => (
                      <ContestCard key={contest.id} contest={contest} />
                    ))}
                  </div>
                )}
              </div>
            </main>
          </div>
        )}

        {!loading && !error && (
          <p className="mt-10 text-center text-xs text-white/25">
            Showing {filteredContests.length} contest
            {filteredContests.length !== 1 ? "s" : ""} · Expand calendar for a
            larger monthly planning view
          </p>
        )}
      </div>

      <ContestDetailsModal
        contest={selectedContest}
        onClose={() => setSelectedContest(null)}
      />
    </section>
  );
}