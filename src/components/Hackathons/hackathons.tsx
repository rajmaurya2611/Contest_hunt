"use client";



import {

  useEffect,

  useMemo,

  useRef,

  useState,

  type MouseEvent,

  type RefObject,

  type SyntheticEvent,

} from "react";



// ─── Types ────────────────────────────────────────────────────────────────────



interface Contest {

  id: number;

  platform_id?: number | null;

  name: string;

  platform: string;

  url: string;

  start_time: number;

  end_time: number;

  duration: number;

  description: string;

  created_at: string;

  hackathon_banner?: string;

  mode?: string | null;

  location?: string | null;

  prize_pool?: string | number | null;

  amount?: string | number | null;

  currency?: string | null;

  difficulty?: string | null;

  tags?: string[] | string | null;

  category_name?: string | null;

  api_status?: string | null;

}

type RawContest = {
  id?: unknown;
  platform_id?: unknown;
  name?: unknown;
  platform?: unknown;
  platform_name?: unknown;
  url?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  duration?: unknown;
  description?: unknown;
  created_at?: unknown;
  hackathon_banner?: unknown;
  banner?: unknown;
  mode?: unknown;
  location?: unknown;
  prize_pool?: unknown;
  amount?: unknown;
  currency?: unknown;
  difficulty?: unknown;
  tags?: unknown;
  category_name?: unknown;
  status?: unknown;
};

type ApiStatusFilter = "active" | "upcoming" | "past";

type HackathonApiQuery = {
  skip: number;
  limit: number;
  statusFilter?: ApiStatusFilter;
  platformId?: number | null;
  mode?: string | null;
  q?: string | null;
};

type HackathonPagination = {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};

type HackathonPage = {
  contests: Contest[];
  pagination: HackathonPagination;
  receivedCount: number;
};



type Status = "live" | "upcoming" | "ended";

type Tab = "live" | "upcoming";



type PlatformMeta = {

  label: string;

  text: string;

  dot: string;

  logo: string;

  pill: string;

};



// ─── Platform Config ──────────────────────────────────────────────────────────



const PLATFORM_META: Record<string, PlatformMeta> = {

  devfolio: {

    label: "Devfolio",

    text: "text-violet-400",

    dot: "bg-violet-400",

    logo: "/icons/devfolio.png",

    pill: "border-violet-500/30 bg-violet-500/10 text-violet-400",

  },

  devpost: {

    label: "Devpost",

    text: "text-blue-400",

    dot: "bg-blue-400",

    logo: "/icons/devpost.png",

    pill: "border-blue-500/30 bg-blue-500/10 text-blue-400",

  },

  unstop: {

    label: "Unstop",

    text: "text-pink-400",

    dot: "bg-pink-400",

    logo: "/icons/unstop.png",

    pill: "border-pink-500/30 bg-pink-500/10 text-pink-400",

  },

  hackerearth: {

    label: "HackerEarth",

    text: "text-emerald-400",

    dot: "bg-emerald-400",

    logo: "/icons/hackerearth.png",

    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",

  },

};



function getPlatform(platform: string): PlatformMeta {

  return (

    PLATFORM_META[platform?.toLowerCase()] ?? {

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

function getContestStatus(contest: Contest): Status {
  const apiStatus = contest.api_status?.trim().toLowerCase();

  if (apiStatus === "ongoing" || apiStatus === "active" || apiStatus === "live") {
    return "live";
  }

  if (apiStatus === "upcoming") return "upcoming";
  if (apiStatus === "ended" || apiStatus === "past") return "ended";

  return getStatus(contest.start_time, contest.end_time);
}

function toApiStatusFilter(status: Tab): ApiStatusFilter {
  return status === "live" ? "active" : "upcoming";
}



function formatDuration(seconds: number) {
  const duration = Math.max(0, Number(seconds) || 0);
  const d = Math.floor(duration / 86400);
  const h = Math.floor((duration % 86400) / 3600);
  const m = Math.floor((duration % 3600) / 60);
  if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
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



function clampText(text: string, max = 110) {

  if (!text) return "";

  return text.length > max ? `${text.slice(0, max).trim()}...` : text;

}

function cleanDescription(text: string) {
  if (!text) return "";

  return text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMode(mode?: string | null) {
  const value = mode?.trim();
  if (!value) return null;

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatPrize(contest: Contest) {
  const prizePool = contest.prize_pool;

  if (prizePool !== null && prizePool !== undefined && String(prizePool).trim()) {
    return String(prizePool).trim();
  }

  const rawAmount = contest.amount;
  if (rawAmount === null || rawAmount === undefined || String(rawAmount).trim() === "") {
    return null;
  }

  const numericAmount = Number(rawAmount);
  const currency = contest.currency?.trim().toUpperCase();

  if (Number.isFinite(numericAmount) && currency) {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(numericAmount);
    } catch {
      return `${currency} ${numericAmount.toLocaleString("en-IN")}`;
    }
  }

  if (currency) return `${currency} ${String(rawAmount).trim()}`;
  return String(rawAmount).trim();
}

function getTagList(tags?: Contest["tags"]) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(/[,|]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function toFiniteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toOptionalString(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeContest(raw: RawContest, index: number): Contest | null {
  const startTime = toFiniteNumber(raw.start_time);
  const endTime = toFiniteNumber(raw.end_time);
  const id = toFiniteNumber(raw.id) ?? index;
  const name = toOptionalString(raw.name);
  const url = toOptionalString(raw.url);
  const platform =
    toOptionalString(raw.platform) ?? toOptionalString(raw.platform_name) ?? "Unknown";

  if (!name || !url || startTime === null || endTime === null) {
    return null;
  }

  const apiDuration = toFiniteNumber(raw.duration);
  const duration =
    apiDuration !== null ? apiDuration : Math.max(0, endTime - startTime);

  const rawTags = raw.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.map((tag) => String(tag)).filter(Boolean)
    : typeof rawTags === "string"
      ? rawTags
      : null;

  return {
    id,
    platform_id: toFiniteNumber(raw.platform_id),
    name,
    platform,
    url,
    start_time: startTime,
    end_time: endTime,
    duration,
    description: toOptionalString(raw.description) ?? "",
    created_at: toOptionalString(raw.created_at) ?? "",
    hackathon_banner:
      toOptionalString(raw.hackathon_banner) ??
      toOptionalString(raw.banner) ??
      undefined,
    mode: toOptionalString(raw.mode),
    location: toOptionalString(raw.location),
    prize_pool:
      typeof raw.prize_pool === "number"
        ? raw.prize_pool
        : toOptionalString(raw.prize_pool),
    amount:
      typeof raw.amount === "number" ? raw.amount : toOptionalString(raw.amount),
    currency: toOptionalString(raw.currency),
    difficulty: toOptionalString(raw.difficulty),
    tags,
    category_name: toOptionalString(raw.category_name),
    api_status: toOptionalString(raw.status),
  };
}

function normalizeContestResponse(payload: unknown): Contest[] {
  let rows: unknown[] = [];

  if (Array.isArray(payload)) {
    rows = payload;
  } else if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) rows = data;
  }

  return rows
    .map((row, index) =>
      row && typeof row === "object"
        ? normalizeContest(row as RawContest, index)
        : null,
    )
    .filter((contest): contest is Contest => contest !== null);
}

const CARD_PAGE_SIZE = 20;
const MASTER_PAGE_SIZE = 1000;
const SEARCH_DEBOUNCE_MS = 350;
const LOAD_MORE_THRESHOLD_PX = 500;

function mergeUniqueContests(existing: Contest[], incoming: Contest[]) {
  const map = new Map<number, Contest>();

  existing.forEach((contest) => map.set(contest.id, contest));
  incoming.forEach((contest) => map.set(contest.id, contest));

  return Array.from(map.values());
}

function buildHackathonApiUrl(baseUrl: string, query: HackathonApiQuery) {
  const url = new URL(baseUrl, window.location.origin);

  url.searchParams.set("skip", String(query.skip));
  url.searchParams.set("limit", String(query.limit));

  if (query.statusFilter) {
    url.searchParams.set("status_filter", query.statusFilter);
  }

  if (query.platformId !== null && query.platformId !== undefined) {
    url.searchParams.set("platform_id", String(query.platformId));
  }

  if (query.mode?.trim()) {
    url.searchParams.set("mode", query.mode.trim());
  }

  if (query.q?.trim()) {
    url.searchParams.set("q", query.q.trim());
  }

  return url.toString();
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;

  const record = payload as {
    message?: unknown;
    detail?: unknown;
    error?: { message?: unknown };
  };

  if (typeof record.error?.message === "string" && record.error.message.trim()) {
    return record.error.message;
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail;
  }

  return fallback;
}

function normalizePagination(
  payload: unknown,
  contests: Contest[],
  requestedSkip: number,
  requestedLimit: number,
): HackathonPagination {
  const record =
    payload && typeof payload === "object"
      ? (payload as { pagination?: unknown })
      : null;

  const pagination =
    record?.pagination && typeof record.pagination === "object"
      ? (record.pagination as {
          total?: unknown;
          limit?: unknown;
          offset?: unknown;
          has_more?: unknown;
        })
      : null;

  const total = toFiniteNumber(pagination?.total) ?? contests.length;
  const limit = toFiniteNumber(pagination?.limit) ?? requestedLimit;
  const offset = toFiniteNumber(pagination?.offset) ?? requestedSkip;

  const inferredHasMore = offset + contests.length < total;
  const hasMore =
    typeof pagination?.has_more === "boolean"
      ? pagination.has_more
      : inferredHasMore;

  return {
    total,
    limit,
    offset,
    has_more: hasMore,
  };
}

async function fetchHackathonPage(
  baseUrl: string,
  query: HackathonApiQuery,
  signal?: AbortSignal,
): Promise<HackathonPage> {
  const url = buildHackathonApiUrl(baseUrl, query);

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(payload, `Hackathon API failed with HTTP ${response.status}`),
    );
  }

  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success?: unknown }).success === false
  ) {
    throw new Error(getApiErrorMessage(payload, "Hackathon API returned success=false"));
  }

  const contests = normalizeContestResponse(payload);
  const pagination = normalizePagination(
    payload,
    contests,
    query.skip,
    query.limit,
  );

  const record = payload && typeof payload === "object" ? payload as { data?: unknown } : null;
  const receivedCount = Array.isArray(payload)
    ? payload.length
    : Array.isArray(record?.data) ? record.data.length : 0;

  return {
    contests,
    pagination,
    receivedCount,
  };
}

async function fetchCompleteHackathonCatalog(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<Contest[]> {
  let skip = 0;
  let allContests: Contest[] = [];
  const maxPages = 200;

  for (let pageNumber = 0; pageNumber < maxPages; pageNumber += 1) {
    const page = await fetchHackathonPage(
      baseUrl,
      { skip, limit: MASTER_PAGE_SIZE },
      signal,
    );
    const before = allContests.length;
    allContests = mergeUniqueContests(allContests, page.contests);

    if (!page.pagination.has_more) {
      // Never claim the calendar is complete when the master API is truncated.
      if (allContests.length < page.pagination.total) {
        throw new Error(
          `Hackathon catalogue incomplete: ${allContests.length} of ${page.pagination.total} records`,
        );
      }
      return allContests;
    }

    const nextSkip = Math.max(skip + page.receivedCount,
      page.pagination.offset + page.receivedCount);
    if (page.receivedCount === 0 || nextSkip <= skip ||
        allContests.length === before) {
      throw new Error("Hackathon catalogue pagination did not advance");
    }
    skip = nextSkip;
  }
  throw new Error("Hackathon catalogue exceeded the safety pagination limit");
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

    `${contest.description || "Hackathon"}\n\nHackathon Link: ${contest.url}`,

  );



  const location = encodeURIComponent(

    `${getPlatform(contest.platform).label}${contest.mode ? ` · ${contest.mode}` : ""}`,

  );



  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;

}



// ─── Strict Linked Scroll Handoff ─────────────────────────────────────────────

// Rule:

// 1. Column under cursor scrolls first.

// 2. After it reaches top/bottom, the other column scrolls.

// 3. Page scroll is allowed ONLY when both columns are already at top/bottom.



function getNormalizedNativeWheelDelta(

  event: globalThis.WheelEvent,

  fallbackHeight: number,

) {

  if (event.deltaMode === 1) return event.deltaY * 16;

  if (event.deltaMode === 2) return event.deltaY * fallbackHeight;



  return event.deltaY;

}



function getMaxScrollTop(element: HTMLDivElement) {

  return Math.max(0, element.scrollHeight - element.clientHeight);

}



function canScrollElement(element: HTMLDivElement, deltaY: number) {

  const maxScrollTop = getMaxScrollTop(element);



  if (maxScrollTop <= 0) return false;



  if (deltaY > 0) {

    return element.scrollTop < maxScrollTop - 1;

  }



  if (deltaY < 0) {

    return element.scrollTop > 1;

  }



  return false;

}



function scrollElementAndReturnRemaining(

  element: HTMLDivElement,

  deltaY: number,

) {

  const maxScrollTop = getMaxScrollTop(element);



  if (maxScrollTop <= 0) return deltaY;



  const previousScrollTop = element.scrollTop;



  const nextScrollTop = Math.min(

    maxScrollTop,

    Math.max(0, previousScrollTop + deltaY),

  );



  element.scrollTop = nextScrollTop;



  const consumedDelta = nextScrollTop - previousScrollTop;



  return deltaY - consumedDelta;

}



function createStrictLinkedWheelHandler(

  currentRef: RefObject<HTMLDivElement | null>,

  pairedRef: RefObject<HTMLDivElement | null>,

) {

  return (event: globalThis.WheelEvent) => {

    const currentElement = currentRef.current;

    const pairedElement = pairedRef.current;



    if (!currentElement) return;



    const deltaY = getNormalizedNativeWheelDelta(

      event,

      currentElement.clientHeight,

    );



    if (Math.abs(deltaY) < 1) return;



    const canCurrentScrollAtStart = canScrollElement(currentElement, deltaY);

    const canPairedScrollAtStart = pairedElement

      ? canScrollElement(pairedElement, deltaY)

      : false;



    /**

     * Critical rule:

     * If both columns are already exhausted in this direction,

     * let the browser scroll the full page naturally.

     */

    if (!canCurrentScrollAtStart && !canPairedScrollAtStart) {

      return;

    }



    /**

     * If even one inner column can still scroll,

     * block page scroll completely.

     */

    event.preventDefault();

    event.stopPropagation();



    let remainingDelta = deltaY;



    /**

     * Priority 1:

     * Scroll column under cursor first.

     */

    if (canCurrentScrollAtStart) {

      remainingDelta = scrollElementAndReturnRemaining(

        currentElement,

        remainingDelta,

      );

    }



    /**

     * Priority 2:

     * Scroll the other column only after current column hits boundary.

     */

    if (

      Math.abs(remainingDelta) > 1 &&

      pairedElement &&

      canScrollElement(pairedElement, remainingDelta)

    ) {

      scrollElementAndReturnRemaining(pairedElement, remainingDelta);

    }



    /**

     * No window.scrollBy here.

     * Page scroll unlocks only on the next wheel event when both columns

     * are already at top/bottom.

     */

  };

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

    borderTop: "from-transparent via-purple-500 to-transparent",

  },

  upcoming: {

    badge: "border-purple-500/30 bg-purple-500/10 text-purple-400",

    dot: "bg-purple-500",

    pill:

      "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15",

    text: "text-purple-400",

    borderTop: "from-transparent via-purple-500 to-transparent",

  },

  ended: {

    badge: "border-white/10 bg-white/[0.04] text-white/35",

    dot: "bg-white/25",

    pill: "border-white/10 bg-white/[0.04] text-white/40 hover:bg-white/[0.06]",

    text: "text-white/35",

    borderTop: "from-transparent via-white/10 to-transparent",

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







// ─── Hackathon-Style Banner + Mini Logo ──────────────────────────────────────



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



  function handleLoad(event: SyntheticEvent<HTMLImageElement>) {

    const img = event.currentTarget;

    const ratio = img.naturalWidth / img.naturalHeight;



    const shouldContain = !banner || imgError || ratio < 1.45 || ratio > 3.35;

    setUseContain(shouldContain);

  }



  function handleError() {

    setImgError(true);

    setUseContain(true);

  }



  return (

    <div

      className={`relative h-[140px] w-full overflow-hidden rounded-2xl border border-white/10 md:h-[150px] ${

        useContain ? "bg-white/[0.06]" : "bg-white/[0.04]"

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



// ─── Share Config ─────────────────────────────────────────────────────────────



const APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.miraidyo.contesthunt&pcampaignid=web_share";

const BRAND_PAGE_NAME = "Hackathon Calendar";



async function shareHackathon(contest: Contest) {

  const meta = getPlatform(contest.platform);



  const pageUrl =

    typeof window !== "undefined" ? window.location.href : APP_DOWNLOAD_URL;



  const shareTitle = `${contest.name} on ${meta.label}`;



  const shareMessage = `Hey, check out this hackathon: ${contest.name}



Platform: ${meta.label}

Starts: ${formatDateTime(contest.start_time)}

Duration: ${formatDuration(contest.duration)}



I found it on ${BRAND_PAGE_NAME}. You can track upcoming coding Contests, Hackathons and Bug Bounties, visit their links, and add them to your calendar easily.



Download the app here:

${APP_DOWNLOAD_URL}



Explore more hackathons:

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

      window.alert("Hackathon share message copied to clipboard!");

      return;

    }



    window.alert("Sharing is not supported on this browser.");

  } catch (error) {

    console.error("[ContestSection] Failed to share hackathon:", error);

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



// ─── Hackathon-style Card ─────────────────────────────────────────────────────────────



function ContestCard({ contest }: { contest: Contest }) {

  const meta = getPlatform(contest.platform);

  const status = getContestStatus(contest);

  const styles = STATUS_STYLES[status];

  const googleCalendarUrl = getGoogleCalendarUrl(contest);

  const description = cleanDescription(contest.description);

  // Mode is present on every hackathon in the shared API sample.
  // A venue should only appear when the API actually provides a place,
  // rather than duplicating "Online" beside the Online mode badge.
  const modeLabel =
    formatMode(contest.mode) ??
    (contest.location?.trim().toLowerCase() === "online" ? "Online" : null);

  const rawLocation = contest.location?.trim() || null;
  const locationLabel =
    rawLocation && rawLocation.toLowerCase() !== "online" ? rawLocation : null;

  // These attributes are absent in the supplied 31-item dataset; render them
  // only if a future API response provides actual values.
  const prizeLabel = formatPrize(contest);
  const difficultyLabel = contest.difficulty?.trim() || null;
  const visibleTags = getTagList(contest.tags).slice(0, 2);

  const statusText =

    status === "live"

      ? `Ends in ${timeLeft(contest.end_time)}`

      : status === "upcoming"

        ? `Starts in ${timeUntil(contest.start_time).replace(/^in\s*/, "")}`

        : "Completed";



  return (

    <article className="group block min-h-[285px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-4 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(140,69,255,0.14)]">

      <div className="flex h-full flex-col">

        <HackathonBanner

          banner={contest.hackathon_banner}

          fallbackLogo={meta.logo}

          alt={contest.name}

        />



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

                className={`truncate text-[0.72rem] font-semibold uppercase tracking-[0.15em] ${meta.text}`}

              >

                {meta.label}

              </span>

            </div>

          </div>



          <span

            className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${styles.badge}`}

          >

            {status}

          </span>

        </div>



        <div className="mt-3 flex items-start justify-between gap-3">

          <h4 className="min-h-[3rem] min-w-0 flex-1 line-clamp-2 text-sm font-semibold leading-6 text-white transition-colors duration-200 group-hover:text-purple-300">

            {contest.name}

          </h4>



          <span

            className={`mt-0.5 shrink-0 rounded-full border px-3 py-1 text-[0.65rem] font-bold tracking-widest ${styles.badge}`}

          >

            {statusText}

          </span>

        </div>



        <p className="mt-2 min-h-[2.5rem] line-clamp-2 text-xs leading-5 text-white/45">

          {description ? clampText(description) : "\u00A0"}

        </p>



        {/* Participation details: prominent mode and readable venue, no empty fields. */}
        {(modeLabel || locationLabel) && (
          <div className="mt-3 flex min-w-0 items-center gap-2">
            {modeLabel && (
              <span
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-purple-500/25 bg-purple-500/[0.09] px-2.5 text-[0.68rem] font-semibold text-purple-200"
                title={`Mode: ${modeLabel}`}
              >
                {modeLabel.toLowerCase() === "online" ? (
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                )}
                {modeLabel}
              </span>
            )}

            {locationLabel && (
              <span
                className="inline-flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 text-[0.68rem] font-medium text-white/60"
                title={rawLocation ?? undefined}
              >
                <svg className="h-3.5 w-3.5 shrink-0 text-white/45" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span className="min-w-0 truncate">{locationLabel}</span>
              </span>
            )}
          </div>
        )}

        {(prizeLabel || difficultyLabel || visibleTags.length > 0) && (
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
            {prizeLabel && (
              <span title={`Prize: ${prizeLabel}`} className="inline-flex max-w-full items-center rounded-lg border border-white/[0.08] bg-white/[0.025] px-2 py-1 text-[0.65rem] text-white/60">
                <span className="mr-1 text-white/35">Prize</span>
                <span className="min-w-0 truncate">{prizeLabel}</span>
              </span>
            )}
            {difficultyLabel && (
              <span title={`Difficulty: ${difficultyLabel}`} className="inline-flex max-w-full items-center rounded-lg border border-white/[0.08] bg-white/[0.025] px-2 py-1 text-[0.65rem] text-white/60">
                <span className="mr-1 text-white/35">Level</span>
                <span className="min-w-0 truncate">{difficultyLabel}</span>
              </span>
            )}
            {visibleTags.map((tag) => (
              <span key={tag} title={tag} className="inline-flex max-w-[140px] items-center rounded-lg border border-purple-500/15 bg-purple-500/[0.04] px-2 py-1 text-[0.65rem] text-purple-200/65">
                <span className="truncate">{tag}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-4 overflow-hidden pt-4 text-xs text-white/55">

          <span className="min-w-0 truncate">

            Starts · {formatDateTime(contest.start_time)}

          </span>



          <span className="ml-auto shrink-0 text-right">

            Duration · {formatDuration(contest.duration)}

          </span>

        </div>



        <div className="mt-4 flex w-full items-center justify-between gap-3 border-t border-white/10 pt-3">

          <a

            href={googleCalendarUrl}

            target="_blank"

            rel="noopener noreferrer"

            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-center text-[0.7rem] font-semibold text-purple-300 no-underline transition-all duration-200 hover:bg-purple-500/15"

          >

            <CalendarPlusIcon />

            <span>Add Calendar</span>

          </a>



          <div className="ml-auto flex items-center justify-end gap-4">

            <a

              href={contest.url}

              target="_blank"

              rel="noopener noreferrer"

              aria-label="Visit hackathon"

              title="Visit hackathon"

              className="inline-flex items-center justify-center text-white/45 no-underline transition-all duration-200 hover:scale-110 hover:text-purple-300"

            >

              <ExternalLinkIcon />

            </a>



            <button

              type="button"

              onClick={() => shareHackathon(contest)}

              aria-label="Share hackathon"

              title="Share hackathon"

              className="inline-flex items-center justify-center text-white/45 transition-all duration-200 hover:scale-110 hover:text-purple-300"

            >

              <ShareIcon />

            </button>

          </div>

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

  const status = getContestStatus(contest);

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
  const monthStartCount = useMemo(() => contests.filter((contest) => {
    const day = new Date(contest.start_time * 1000);
    return day.getMonth() === month.getMonth() && day.getFullYear() === month.getFullYear();
  }).length, [contests, month]);



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

              Hackathon Calendar

            </p>



            <h3

              className={`mt-1 font-bold text-white ${

                expanded ? "text-2xl" : "text-xl"

              }`}

            >

              {getMonthLabel(month)}

            </h3>
            <p className="mt-1 text-[0.68rem] text-white/35">
              {monthStartCount} starting this month · {contests.length} active in all months
            </p>

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

            This Month

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

  const status = getContestStatus(contest);

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

              aria-label="Visit hackathon"

              title="Visit hackathon"

              className="inline-flex items-center justify-center text-white/45 no-underline transition-all duration-200 hover:scale-110 hover:text-purple-300"

            >

              <ExternalLinkIcon />

            </a>



            <button

              type="button"

              onClick={() => shareHackathon(contest)}

              aria-label="Share hackathon"

              title="Share hackathon"

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

    <div className="min-h-[285px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-4">

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



      <div className="mt-4 border-t border-white/10 pt-3">

        <div className="h-9 w-full animate-pulse rounded-2xl bg-white/10" />

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



// ─── Dropdown Icons ───────────────────────────────────────────────────────────



function ChevronDownIcon() {

  return (

    <svg

      width="16"

      height="16"

      viewBox="0 0 24 24"

      fill="none"

      aria-hidden="true"

      className="shrink-0"

    >

      <path

        d="M6 9l6 6 6-6"

        stroke="currentColor"

        strokeWidth="2"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

    </svg>

  );

}



function SmallPlatformLogo({

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

    return <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />;

  }



  return (

    <img

      src={src}

      alt={alt}

      className="h-5 w-5 shrink-0 object-contain"

      onError={() => setImgError(true)}

    />

  );

}



// ─── Status Dropdown ──────────────────────────────────────────────────────────



function StatusDropdown({

  value,

  counts,

  countsReady = true,

  onChange,

}: {

  value: Tab;

  counts: Record<Tab, number>;

  countsReady?: boolean;

  onChange: (value: Tab) => void;

}) {

  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);



  useEffect(() => {

    if (!open) return;



    const handleClickOutside = (event: PointerEvent) => {

      const target = event.target;



      if (!(target instanceof Node)) return;



      if (!dropdownRef.current?.contains(target)) {

        setOpen(false);

      }

    };



    const handleEscape = (event: KeyboardEvent) => {

      if (event.key === "Escape") {

        setOpen(false);

      }

    };



    document.addEventListener("pointerdown", handleClickOutside);

    document.addEventListener("keydown", handleEscape);



    return () => {

      document.removeEventListener("pointerdown", handleClickOutside);

      document.removeEventListener("keydown", handleEscape);

    };

  }, [open]);



  const options: Tab[] = ["upcoming", "live"];



  const statusMeta: Record<

    Tab,

    {

      label: string;

      dot: string;

      active: string;

    }

  > = {

    upcoming: {

      label: "Upcoming",

      dot: "bg-purple-500",

      active: "text-purple-300",

    },

    live: {

      label: "Live",

      dot: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]",

      active: "text-red-300",

    },



  };



  const selected = statusMeta[value];



  return (

    <div ref={dropdownRef} className="relative">

      <button

        type="button"

        onClick={() => setOpen((prev) => !prev)}

        className="flex h-[46px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/70 transition-all duration-200 hover:border-purple-500/30 hover:bg-white/[0.06]"

      >

        <span className="flex min-w-0 items-center gap-2">

          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${selected.dot}`} />

          <span className={`truncate ${selected.active}`}>{selected.label}</span>

          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">

            {countsReady ? counts[value] : "…"}

          </span>

        </span>



        <ChevronDownIcon />

      </button>



      {open && (

        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-white/10 bg-[#080808] p-1 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">

          {options.map((option) => {

            const meta = statusMeta[option];

            const isActive = value === option;



            return (

              <button

                key={option}

                type="button"

                onClick={() => {

                  onChange(option);

                  setOpen(false);

                }}

                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${

                  isActive

                    ? "bg-purple-500/10 text-white"

                    : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"

                }`}

              >

                <span className="flex items-center gap-2">

                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />

                  <span>{meta.label}</span>

                </span>



                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">

                  {countsReady ? counts[option] : "…"}

                </span>

              </button>

            );

          })}

        </div>

      )}

    </div>

  );

}



// ─── Platform Dropdown ────────────────────────────────────────────────────────



function PlatformDropdown({

  value,

  platforms,

  onChange,

}: {

  value: string;

  platforms: string[];

  onChange: (value: string) => void;

}) {

  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);



  useEffect(() => {

    if (!open) return;



    const handleClickOutside = (event: PointerEvent) => {

      const target = event.target;



      if (!(target instanceof Node)) return;



      if (!dropdownRef.current?.contains(target)) {

        setOpen(false);

      }

    };



    const handleEscape = (event: KeyboardEvent) => {

      if (event.key === "Escape") {

        setOpen(false);

      }

    };



    document.addEventListener("pointerdown", handleClickOutside);

    document.addEventListener("keydown", handleEscape);



    return () => {

      document.removeEventListener("pointerdown", handleClickOutside);

      document.removeEventListener("keydown", handleEscape);

    };

  }, [open]);



  const selectedMeta =

    value === "all"

      ? {

          label: "All Platforms",

          text: "text-purple-300",

          dot: "bg-purple-400",

          logo: "",

        }

      : getPlatform(value);



  return (

    <div ref={dropdownRef} className="relative">

      <button

        type="button"

        onClick={() => setOpen((prev) => !prev)}

        className="flex h-[46px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/70 transition-all duration-200 hover:border-purple-500/30 hover:bg-white/[0.06]"

      >

        <span className="flex min-w-0 items-center gap-2">

          {value === "all" ? (

            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-purple-400" />

          ) : (

            <SmallPlatformLogo

              src={selectedMeta.logo}

              alt={selectedMeta.label}

              dotClass={selectedMeta.dot}

            />

          )}



          <span className={`truncate ${selectedMeta.text}`}>

            {selectedMeta.label}

          </span>

        </span>



        <ChevronDownIcon />

      </button>



      {open && (

        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[280px] overflow-y-auto rounded-2xl border border-white/10 bg-[#080808] p-1 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">

          {platforms.map((platform) => {

            const isAll = platform === "all";



            const meta = isAll

              ? {

                  label: "All Platforms",

                  text: "text-purple-300",

                  dot: "bg-purple-400",

                  logo: "",

                }

              : getPlatform(platform);



            const isActive = value === platform;



            return (

              <button

                key={platform}

                type="button"

                onClick={() => {

                  onChange(platform);

                  setOpen(false);

                }}

                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${

                  isActive

                    ? "bg-purple-500/10 text-white"

                    : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"

                }`}

              >

                {isAll ? (

                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-purple-400" />

                ) : (

                  <SmallPlatformLogo

                    src={meta.logo}

                    alt={meta.label}

                    dotClass={meta.dot}

                  />

                )}



                <span className={`truncate ${isActive ? meta.text : ""}`}>

                  {meta.label}

                </span>

              </button>

            );

          })}

        </div>

      )}

    </div>

  );

}





// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ContestSection() {
  const apiUrl = import.meta.env.VITE_HACKATHONS_API_URL as string | undefined;

  // The cards and calendar intentionally have independent retrieval lifecycles.
  // Cards: server-filtered pages of 20, appended on scroll.
  // Calendar: complete unfiltered dataset, then hide ended hackathons.
  const [contests, setContests] = useState<Contest[]>([]);
  const [feedServerTotal, setFeedServerTotal] = useState(0);
  const [feedNextOffset, setFeedNextOffset] = useState(0);
  const [serverHasMore, setServerHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [masterContests, setMasterContests] = useState<Contest[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [activePlatform, setActivePlatform] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [focusedCalendarDate, setFocusedCalendarDate] = useState<string | null>(null);

  const calendarScrollRef = useRef<HTMLDivElement | null>(null);
  const cardsScrollRef = useRef<HTMLDivElement | null>(null);
  const feedGenerationRef = useRef(0);
  const feedControllerRef = useRef<AbortController | null>(null);
  const loadMoreAbortRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!apiUrl) {
      setCatalogError("VITE_HACKATHONS_API_URL is not defined");
      return;
    }
    const controller = new AbortController();
    setCatalogReady(false);
    setCatalogError(null);

    void fetchCompleteHackathonCatalog(apiUrl, controller.signal)
      .then((catalog) => {
        if (controller.signal.aborted) return;
        setMasterContests(catalog);
        setCatalogReady(true);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Failed to load the full hackathon calendar";
        console.error("[Hackathons] Catalogue error:", err);
        setCatalogError(message);
      });

    return () => controller.abort();
  }, [apiUrl, catalogReloadKey]);

  // Platform choices and global counts MUST NOT depend on loaded card pages.
  const availableContests = useMemo(() => masterContests.filter(
    (contest) => getContestStatus(contest) !== "ended",
  ), [masterContests]);

  const counts = useMemo<Record<Tab, number>>(() => {
    const result: Record<Tab, number> = { upcoming: 0, live: 0 };
    for (const contest of availableContests) {
      const status = getContestStatus(contest);
      if (status === "upcoming" || status === "live") result[status] += 1;
    }
    return result;
  }, [availableContests]);

  const platformIdByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const contest of [...availableContests, ...contests]) {
      if (contest.platform_id != null) map.set(contest.platform.toLowerCase(), contest.platform_id);
    }
    return map;
  }, [availableContests, contests]);

  const platforms = useMemo(() => {
    const source = catalogReady ? availableContests : contests.filter(
      (contest) => getContestStatus(contest) !== "ended",
    );
    return ["all", ...Array.from(new Set(source.map((contest) => contest.platform)))
      .sort((a, b) => a.localeCompare(b))];
  }, [catalogReady, availableContests, contests]);

  const activePlatformId = activePlatform === "all"
    ? null
    : platformIdByName.get(activePlatform.toLowerCase()) ?? null;

  const knownMatchingCount = useMemo(() => {
    if (!catalogReady || debouncedSearch) return null;
    return availableContests.filter((contest) =>
      getContestStatus(contest) === activeTab &&
      (activePlatform === "all" || contest.platform.toLowerCase() === activePlatform.toLowerCase())
    ).length;
  }, [catalogReady, availableContests, activeTab, activePlatform, debouncedSearch]);

  // A filtered server may incorrectly report the unfiltered total. The fully
  // loaded catalog wins for non-search counts; for search we never exceed the
  // number of possible records in the chosen status/platform.
  const matchingTotal = knownMatchingCount ?? feedServerTotal;
  const canLoadMore = serverHasMore &&
    (knownMatchingCount === null || contests.length < knownMatchingCount);

  useEffect(() => {
    if (!apiUrl) {
      setError("VITE_HACKATHONS_API_URL is not defined");
      setLoading(false);
      return;
    }
    if (activePlatform !== "all" && activePlatformId === null) {
      setError("Selected platform is missing a platform_id in the API response");
      setLoading(false);
      setFeedRefreshing(false);
      return;
    }

    const generation = ++feedGenerationRef.current;
    const controller = new AbortController();
    feedControllerRef.current?.abort();
    loadMoreAbortRef.current?.abort();
    feedControllerRef.current = controller;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setPageError(null);
    setFeedRefreshing(true);
    setError(null);
    setContests([]);
    setFeedNextOffset(0);
    setServerHasMore(false);
    setFeedServerTotal(0);

    void fetchHackathonPage(apiUrl, {
      skip: 0,
      limit: CARD_PAGE_SIZE,
      statusFilter: toApiStatusFilter(activeTab),
      platformId: activePlatformId,
      q: debouncedSearch || null,
    }, controller.signal)
      .then((page) => {
        if (controller.signal.aborted || generation !== feedGenerationRef.current) return;
        const matching = page.contests.filter((contest) =>
          getContestStatus(contest) === activeTab &&
          (activePlatform === "all" || contest.platform.toLowerCase() === activePlatform.toLowerCase())
        );
        setContests(mergeUniqueContests([], matching));
        setFeedServerTotal(page.pagination.total);
        setFeedNextOffset(page.pagination.offset + page.receivedCount);
        // Short filtered pages are exhausted even when the server mistakenly
        // returns global 'has_more' metadata. Other pages fetch on demand.
        setServerHasMore(page.pagination.has_more && page.receivedCount >= CARD_PAGE_SIZE);
        setError(null);
        window.requestAnimationFrame(() => {
          if (generation === feedGenerationRef.current) {
            cardsScrollRef.current?.scrollTo({ top: 0 });
          }
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || generation !== feedGenerationRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to fetch hackathons");
      })
      .finally(() => {
        if (generation === feedGenerationRef.current) {
          setLoading(false);
          setFeedRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [apiUrl, activeTab, activePlatform, activePlatformId, debouncedSearch]);

  async function loadMoreContests(forceRetry = false) {
    if (!apiUrl || !canLoadMore || loadingMoreRef.current || feedRefreshing || (pageError && !forceRetry)) return;
    setPageError(null);
    if (activePlatform !== "all" && activePlatformId === null) return;

    const generation = feedGenerationRef.current;
    const controller = new AbortController();
    loadMoreAbortRef.current?.abort();
    loadMoreAbortRef.current = controller;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const page = await fetchHackathonPage(apiUrl, {
        skip: feedNextOffset,
        limit: CARD_PAGE_SIZE,
        statusFilter: toApiStatusFilter(activeTab),
        platformId: activePlatformId,
        q: debouncedSearch || null,
      }, controller.signal);
      if (controller.signal.aborted || generation !== feedGenerationRef.current) return;
      const matching = page.contests.filter((contest) =>
          getContestStatus(contest) === activeTab &&
          (activePlatform === "all" || contest.platform.toLowerCase() === activePlatform.toLowerCase())
        );
      const nextOffset = page.pagination.offset + page.receivedCount;
      if (page.receivedCount === 0 || nextOffset <= feedNextOffset) {
        setServerHasMore(false);
      } else {
        setContests((previous) => mergeUniqueContests(previous, matching));
        setFeedNextOffset(nextOffset);
        setServerHasMore(page.pagination.has_more && page.receivedCount >= CARD_PAGE_SIZE);
      }
      setFeedServerTotal(page.pagination.total);
    } catch (err: unknown) {
      if (controller.signal.aborted || generation !== feedGenerationRef.current) return;
      console.error("[Hackathons] Next page error:", err);
      setPageError(err instanceof Error ? err.message : "Failed to load more hackathons");
    } finally {
      if (generation === feedGenerationRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
      if (loadMoreAbortRef.current === controller) loadMoreAbortRef.current = null;
    }
  }

  function handleCardsScroll() {
    const element = cardsScrollRef.current;
    if (!element || !canLoadMore || loadingMoreRef.current || pageError || feedRefreshing) return;
    if (element.scrollHeight - element.scrollTop - element.clientHeight <= LOAD_MORE_THRESHOLD_PX) {
      void loadMoreContests();
    }
  }

  // If the first page cannot fill an extra-large scroll viewport, fetch the
  // following page automatically. This never modifies the linked-wheel handler.
  useEffect(() => {
    if (loading || feedRefreshing || loadingMore || pageError || !canLoadMore) return;
    const element = cardsScrollRef.current;
    if (element && element.scrollHeight <= element.clientHeight + LOAD_MORE_THRESHOLD_PX) {
      void loadMoreContests();
    }
  }, [loading, feedRefreshing, loadingMore, pageError, canLoadMore, contests.length]);

  // Preserve the exact strict linked-wheel handoff algorithm.
  useEffect(() => {
    if (loading || error) return;
    const calendarElement = calendarScrollRef.current;
    const cardsElement = cardsScrollRef.current;
    if (!calendarElement || !cardsElement) return;
    const handleCalendarWheel = createStrictLinkedWheelHandler(calendarScrollRef, cardsScrollRef);
    const handleCardsWheel = createStrictLinkedWheelHandler(cardsScrollRef, calendarScrollRef);
    const wheelOptions: AddEventListenerOptions = { passive: false };
    calendarElement.addEventListener("wheel", handleCalendarWheel, wheelOptions);
    cardsElement.addEventListener("wheel", handleCardsWheel, wheelOptions);
    return () => {
      calendarElement.removeEventListener("wheel", handleCalendarWheel);
      cardsElement.removeEventListener("wheel", handleCardsWheel);
    };
  }, [loading, error, calendarExpanded, contests.length, masterContests.length]);

  const handleCalendarExpandToggle = () => {
    if (calendarExpanded) setFocusedCalendarDate(null);
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

      <div className="relative z-10 mx-auto max-w-7xl 2xl:max-w-[1740px]">
        <div className="mb-8 grid gap-3 md:grid-cols-12 md:items-center">
          <div className="relative w-full md:col-span-8">
            <input
              type="text"
              placeholder="Search hackathons or platforms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[46px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-purple-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(140,69,255,0.08)]"
            />
          </div>
          <div className="md:col-span-2">
            <StatusDropdown
              value={activeTab}
              counts={counts}
              countsReady={catalogReady}
              onChange={setActiveTab}
            />
          </div>
          <div className="md:col-span-2">
            <PlatformDropdown value={activePlatform} platforms={platforms} onChange={setActivePlatform} />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 xl:grid-cols-3">
            <CalendarSkeleton />
            <div className="grid gap-5 sm:grid-cols-2 xl:col-span-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-10 text-center text-sm text-red-400">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 pb-24 transition-all duration-500 ease-out xl:h-[calc(100vh-260px)] xl:min-h-[560px] xl:grid-cols-3 xl:overflow-visible 2xl:h-[calc(100vh-230px)] 2xl:min-h-[680px] 2xl:gap-8">
            <aside className={`min-h-0 transition-all duration-500 ease-out ${calendarExpanded ? "xl:col-span-2" : "xl:col-span-1"}`}>
              <div ref={calendarScrollRef} className="contest-hidden-scrollbar h-full overflow-y-auto overscroll-y-auto pr-1">
                {catalogReady ? (
                  <ContestCalendar
                    month={calendarMonth}
                    contests={availableContests}
                    expanded={calendarExpanded}
                    focusedDateKey={focusedCalendarDate}
                    onExpandToggle={handleCalendarExpandToggle}
                    onMonthChange={handleCalendarMonthChange}
                    onDetails={setSelectedContest}
                    onShowAllForDay={handleShowAllForDay}
                  />
                ) : catalogError ? (
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-sm text-white/55">
                    <p>Calendar data couldn't be fully loaded. Totals are temporarily unavailable.</p>
                    <button type="button" onClick={() => setCatalogReloadKey((v) => v + 1)} className="mt-4 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 font-semibold text-purple-300">Retry calendar</button>
                  </div>
                ) : (
                  <CalendarSkeleton />
                )}
              </div>
            </aside>

            <main className={`min-h-0 transition-all duration-500 ease-out ${calendarExpanded ? "xl:col-span-1" : "xl:col-span-2"}`}>
              <div
                ref={cardsScrollRef}
                onScroll={handleCardsScroll}
                aria-busy={loadingMore || feedRefreshing}
                className="contest-hidden-scrollbar h-full overflow-y-auto overscroll-y-auto pr-1"
              >
                <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="mt-1 text-2xl font-bold text-white">
                      {activeTab === "upcoming" ? "Upcoming" : "Live"} <span className="text-purple-500">Hackathons</span>
                    </h3>
                    <p className="mt-2 text-xs text-white/35">
                      {catalogReady
                        ? `All ${counts.upcoming + counts.live} · Upcoming ${counts.upcoming} · Live ${counts.live}`
                        : "Loading complete hackathon counts…"}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/40">
                    {catalogReady && !debouncedSearch ? `${matchingTotal} matching` : `${contests.length} loaded`}
                  </span>
                </div>

                {feedRefreshing ? (
                  <div className="py-16 text-center text-sm text-white/40">Loading hackathons…</div>
                ) : contests.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 px-6 py-20 text-center">
                    <p className="text-lg font-semibold text-white">No hackathons found</p>
                    <p className="mt-2 text-sm text-white/40">Try changing the status, platform, or search keyword.</p>
                  </div>
                ) : (
                  <div className={calendarExpanded ? "grid gap-5 pb-1" : "grid gap-5 pb-1 sm:grid-cols-2 2xl:grid-cols-3"}>
                    {contests.map((contest) => <ContestCard key={contest.id} contest={contest} />)}
                  </div>
                )}

                {!feedRefreshing && (
                  <div className="mt-5 pb-3 text-center text-xs text-white/35">
                    Showing {contests.length}{catalogReady && !debouncedSearch ? ` of ${matchingTotal}` : ""} {activeTab} hackathons{debouncedSearch ? " (search results)" : ""}
                    {loadingMore && <p className="mt-2">Loading more hackathons…</p>}
                    {pageError && (
                      <div className="mt-3">
                        <p className="text-red-400">Couldn't load the next page: {pageError}</p>
                        <button type="button" onClick={() => void loadMoreContests(true)} className="mt-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 font-semibold text-purple-300">Retry loading hackathons</button>
                      </div>
                    )}
                    {canLoadMore && !pageError && !loadingMore && (
                      <button type="button" onClick={() => void loadMoreContests()} className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 font-semibold text-white/55 hover:border-purple-500/30 hover:text-purple-300">Load more</button>
                    )}
                    {!canLoadMore && contests.length > 0 && <p className="mt-2 text-white/25">All matching hackathons loaded</p>}
                  </div>
                )}
              </div>
            </main>
          </div>
        )}

        {!loading && !error && (
          <p className="mt-0 text-center text-xs text-white/25">
            Showing {contests.length}{catalogReady && !debouncedSearch ? ` of ${matchingTotal}` : ""} {activeTab} hackathons · {catalogReady ? `${availableContests.length} live and upcoming in the full catalogue` : "Calendar catalogue loading"} · Calendar includes all non-ended hackathons
          </p>
        )}
      </div>
      <ContestDetailsModal contest={selectedContest} onClose={() => setSelectedContest(null)} />
    </section>
  );
}
