"use client";



import {

  useEffect,

  useMemo,

  useRef,

  useState,

  type MouseEvent,

  type RefObject,

} from "react";



// ─── Types ────────────────────────────────────────────────────────────────────

type ApiStatusFilter = "active" | "upcoming";

type RawContest = {
  id?: unknown;
  name?: unknown;
  url?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  duration?: unknown;
  description?: unknown;
  platform_id?: unknown;
  category_id?: unknown;
  banner?: unknown;
  mode?: unknown;
  location?: unknown;
  prize_pool?: unknown;
  amount?: unknown;
  currency?: unknown;
  difficulty?: unknown;
  tags?: unknown;
  is_active?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  platform_name?: unknown;
  category_name?: unknown;
  status?: unknown;
};

interface Contest {
  id: number;
  platform_id?: number | null;
  category_id?: number | null;
  name: string;
  platform: string;
  url: string;
  start_time: number;
  end_time: number;
  duration: number;
  description: string;
  created_at: string;
  updated_at?: string | null;
  banner?: string | null;
  mode?: string | null;
  location?: string | null;
  prize_pool?: string | number | null;
  amount?: string | number | null;
  currency?: string | null;
  difficulty?: string | null;
  tags?: string[];
  category_name?: string | null;
  is_active?: boolean | null;
  status: Status;
}

type ContestApiQuery = {
  skip: number;
  limit: number;
  statusFilter?: ApiStatusFilter;
  platformId?: number | null;
  q?: string | null;
};

type ContestPagination = {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};

type ContestPage = {
  contests: Contest[];
  pagination: ContestPagination;
  // Raw rows, before filtering malformed records. Offset pagination must
  // advance by the number returned from the API, not only valid UI cards.
  rawCount: number;
};

type CompleteCatalog = {
  contests: Contest[];
  total: number;
};

type Status = "live" | "upcoming" | "ended";
type Tab = Exclude<Status, "ended">;

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

  hackerrank: {

    label: "HackerRank",

    text: "text-green-400",

    dot: "bg-green-400",

    logo: "/icons/hackerrank.png",

    pill: "border-green-500/30 bg-green-500/10 text-green-400",

  },

  topcoder:{

    label: "TopCoder",

    text: "text-cyan-400",

    dot: "bg-cyan-400",

    logo: "/icons/topcoder.png",

    pill: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",

  },

  toph:{

    label: "Toph",

    text: "text-purple-400",

    dot: "bg-purple-400",

    logo: "/icons/toph.png",

    pill: "border-purple-500/30 bg-purple-500/10 text-purple-400",

  },

};



function getPlatform(platform: string): PlatformMeta {

  return (

    PLATFORM_META[platform.toLowerCase().replace(/[^a-z0-9]/g, "")] ?? {

      label: platform,

      text: "text-purple-400",

      dot: "bg-purple-400",

      logo: "/icons/default.png",

      pill: "border-purple-500/30 bg-purple-500/10 text-purple-400",

    }

  );

}



// ─── API Helpers ──────────────────────────────────────────────────────────────

const CARD_PAGE_SIZE = 20;
const MASTER_PAGE_SIZE = 1000;
const SEARCH_DEBOUNCE_MS = 350;
const LOAD_MORE_THRESHOLD_PX = 500;

function toFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toOptionalString(value: unknown) {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  return result || null;
}

function toOptionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function mapApiStatusToUiStatus(
  apiStatus: unknown,
  start: number,
  end: number,
): Status {
  const value = toOptionalString(apiStatus)?.toLowerCase();

  if (value === "ongoing" || value === "active" || value === "live") {
    return "live";
  }

  if (value === "upcoming") return "upcoming";
  if (value === "ended" || value === "past") return "ended";

  return getStatus(start, end);
}

function toApiStatusFilter(status: Tab): ApiStatusFilter {
  if (status === "live") return "active";
  return "upcoming";
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeApiContest(raw: RawContest): Contest | null {
  const startTime = toFiniteNumber(raw.start_time);
  const endTime = toFiniteNumber(raw.end_time);
  const id = toFiniteNumber(raw.id);
  const name = toOptionalString(raw.name);
  const url = toOptionalString(raw.url);
  const platform = toOptionalString(raw.platform_name) ?? "Unknown";

  if (id === null || !Number.isInteger(id) || !name || !url || startTime === null || endTime === null) {
    return null;
  }

  const apiDuration = toFiniteNumber(raw.duration);
  const duration =
    apiDuration !== null ? apiDuration : Math.max(0, endTime - startTime);

  return {
    id,
    platform_id: toFiniteNumber(raw.platform_id),
    category_id: toFiniteNumber(raw.category_id),
    name,
    platform,
    url,
    start_time: startTime,
    end_time: endTime,
    duration,
    description: toOptionalString(raw.description) ?? "",
    created_at: toOptionalString(raw.created_at) ?? "",
    updated_at: toOptionalString(raw.updated_at),
    banner: toOptionalString(raw.banner),
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
    tags: normalizeTags(raw.tags),
    category_name: toOptionalString(raw.category_name),
    is_active: toOptionalBoolean(raw.is_active),
    status: mapApiStatusToUiStatus(raw.status, startTime, endTime),
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
    .map((row) =>
      row && typeof row === "object"
        ? normalizeApiContest(row as RawContest)
        : null,
    )
    .filter((contest): contest is Contest => contest !== null);
}

function mergeUniqueContests(existing: Contest[], incoming: Contest[]) {
  const map = new Map<number, Contest>();

  existing.forEach((contest) => map.set(contest.id, contest));
  incoming.forEach((contest) => map.set(contest.id, contest));

  return Array.from(map.values());
}

function buildContestApiUrl(baseUrl: string, query: ContestApiQuery) {
  const url = new URL(baseUrl, window.location.origin);

  url.searchParams.set("skip", String(query.skip));
  url.searchParams.set("limit", String(query.limit));

  if (query.statusFilter) {
    url.searchParams.set("status_filter", query.statusFilter);
  }

  if (query.platformId !== null && query.platformId !== undefined) {
    url.searchParams.set("platform_id", String(query.platformId));
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
  requestedSkip: number,
): ContestPagination {
  // A fabricated fallback total gives misleading counts. The endpoint
  // promises pagination metadata, so require it for accurate UI numbers.
  const record = payload && typeof payload === "object"
    ? (payload as { pagination?: unknown })
    : null;
  const pagination = record?.pagination;
  if (!pagination || typeof pagination !== "object") {
    throw new Error("Contest API response is missing pagination metadata");
  }

  const value = pagination as {
    total?: unknown;
    limit?: unknown;
    offset?: unknown;
    has_more?: unknown;
  };
  const total = toFiniteNumber(value.total);
  const limit = toFiniteNumber(value.limit);
  const offset = toFiniteNumber(value.offset);
  if (
    total === null || !Number.isInteger(total) || total < 0 ||
    limit === null || !Number.isInteger(limit) || limit < 1 ||
    offset === null || !Number.isInteger(offset) || offset < 0 ||
    typeof value.has_more !== "boolean"
  ) {
    throw new Error("Contest API returned invalid pagination metadata");
  }
  if (offset !== requestedSkip) {
    throw new Error(`Contest API offset mismatch (requested ${requestedSkip}, received ${offset})`);
  }
  return { total, limit, offset, has_more: value.has_more };
}

async function fetchContestPage(
  baseUrl: string,
  query: ContestApiQuery,
  signal?: AbortSignal,
): Promise<ContestPage> {
  const url = buildContestApiUrl(baseUrl, query);

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(payload, `Contest API failed with HTTP ${response.status}`),
    );
  }

  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success?: unknown }).success === false
  ) {
    throw new Error(getApiErrorMessage(payload, "Contest API returned success=false"));
  }

  const contests = normalizeContestResponse(payload);
  const rawData = payload && typeof payload === "object"
    ? (payload as { data?: unknown }).data
    : null;
  const rawCount = Array.isArray(rawData) ? rawData.length : 0;
  const pagination = normalizePagination(payload, query.skip);

  if (pagination.has_more && rawCount === 0) {
    throw new Error("Contest API reported more pages but returned zero records");
  }
  return { contests, pagination, rawCount };
}

async function fetchCompleteContestCatalog(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<CompleteCatalog> {
  // The endpoint has no month/date-range filter. To populate a calendar for
  // every month, we must retrieve *all* pages without status/platform filters.
  // Page size 1000 is the backend's documented maximum.
  let skip = 0;
  let expectedTotal: number | null = null;
  let allContests: Contest[] = [];

  while (true) {
    const page = await fetchContestPage(
      baseUrl,
      { skip, limit: MASTER_PAGE_SIZE },
      signal,
    );
    if (expectedTotal !== null && expectedTotal !== page.pagination.total) {
      throw new Error("Contest catalogue changed during pagination; reload required");
    }
    expectedTotal = page.pagination.total;
    allContests = mergeUniqueContests(allContests, page.contests);

    if (!page.pagination.has_more) break;
    const nextSkip = page.pagination.offset + page.rawCount;
    if (nextSkip <= skip) {
      throw new Error("Contest catalogue pagination made no progress");
    }
    skip = nextSkip;
  }

  // Counts must not be presented as exact if malformed/duplicate rows were
  // dropped or the collection changed during an offset-paginated scan.
  if (allContests.length !== (expectedTotal ?? 0)) {
    throw new Error(
      `Incomplete contest catalogue (${allContests.length} unique of ${expectedTotal ?? 0} API records)`,
    );
  }
  return { contests: allContests, total: expectedTotal ?? 0 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────



function getStatus(start: number, end: number): Status {

  const now = Math.floor(Date.now() / 1000);



  if (now >= start && now <= end) return "live";

  if (now < start) return "upcoming";



  return "ended";

}



function formatDuration(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${Math.max(m, 0)}m`;
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



function clampText(text: string, max = 150) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function collectStructuredText(value: unknown, output: string[]) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectStructuredText(item, output));
    return;
  }

  if (typeof value !== "object") return;

  const record = value as {
    text?: unknown;
    children?: unknown;
  };

  if (typeof record.text === "string" && record.text.trim()) {
    output.push(record.text.trim());
  }

  if (record.children) {
    collectStructuredText(record.children, output);
  }
}

function cleanContestDescription(text: string) {
  if (!text) return "";

  let source = text.trim();

  if (
    (source.startsWith("[") && source.endsWith("]")) ||
    (source.startsWith("{") && source.endsWith("}"))
  ) {
    try {
      const parsed: unknown = JSON.parse(source);
      const parts: string[] = [];
      collectStructuredText(parsed, parts);

      if (parts.length > 0) {
        source = parts.join(" ");
      }
    } catch {
      // Keep the original text if the source merely looks like JSON.
    }
  }

  return source
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

  if (
    rawAmount === null ||
    rawAmount === undefined ||
    String(rawAmount).trim() === ""
  ) {
    return null;
  }

  const numericAmount = Number(String(rawAmount).replace(/,/g, ""));
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

    `${clampText(cleanContestDescription(contest.description) || "Coding contest", 800)}\n\nContest Link: ${contest.url}`,

  );



  const location = encodeURIComponent(getPlatform(contest.platform).label);



  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;

}



// ─── Strict Linked Scroll Handoff ─────────────────────────────────────────────



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



    if (!canCurrentScrollAtStart && !canPairedScrollAtStart) {

      return;

    }



    event.preventDefault();

    event.stopPropagation();



    let remainingDelta = deltaY;



    if (canCurrentScrollAtStart) {

      remainingDelta = scrollElementAndReturnRemaining(

        currentElement,

        remainingDelta,

      );

    }



    if (

      Math.abs(remainingDelta) > 1 &&

      pairedElement &&

      canScrollElement(pairedElement, remainingDelta)

    ) {

      scrollElementAndReturnRemaining(pairedElement, remainingDelta);

    }

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



// ─── Share Config ─────────────────────────────────────────────────────────────



const APP_DOWNLOAD_URL =

  "https://play.google.com/store/apps/details?id=com.miraidyo.contesthunt&pcampaignid=web_share";

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
// Homepage-inspired information hierarchy. The existing card interaction,
// status colours, buttons and hover treatment are intentionally retained.

function ContestVisual({ contest, meta }: { contest: Contest; meta: PlatformMeta }) {
  const [bannerError, setBannerError] = useState(false);

  if (contest.banner && !bannerError) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        <img
          src={contest.banner}
          alt={`${contest.name} banner`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setBannerError(true)}
        />
      </div>
    );
  }

  return <PlatformLogo src={meta.logo} alt={meta.label} dotClass={meta.dot} />;
}

function getContestExtras(contest: Contest): string[] {
  const mode = formatMode(contest.mode);
  const location = contest.location?.trim();
  const prize = formatPrize(contest);
  const difficulty = contest.difficulty?.trim();
  const category = contest.category_name?.trim();

  return [
    category && category.toLowerCase() !== "contests" ? category : null,
    mode ? `Mode: ${mode}` : null,
    location && location.toLowerCase() !== "online"
      ? `Location: ${location}`
      : null,
    prize ? `Prize: ${prize}` : null,
    difficulty ? `Difficulty: ${difficulty}` : null,
    ...(contest.tags ?? []).slice(0, 2),
  ].filter((value): value is string => Boolean(value));
}

function ContestCard({ contest }: { contest: Contest }) {
  const meta = getPlatform(contest.platform);
  const status = contest.status;
  const styles = STATUS_STYLES[status];
  const googleCalendarUrl = getGoogleCalendarUrl(contest);
  const description = cleanContestDescription(contest.description) || "Coding contest";
  const extras = getContestExtras(contest);
  const timingLabel =
    status === "live"
      ? `Ends · ${timeLeft(contest.end_time)}`
      : status === "upcoming"
        ? `Starts · ${timeUntil(contest.start_time)}`
        : "Contest completed";

  return (
    <article className="group relative flex h-full min-h-[340px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(140,69,255,0.14)] 2xl:p-6">
      <div
        className={`absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r ${styles.borderTop}`}
      />

      {/* Logo + platform and status, as on the homepage card. */}
      <div className="flex min-w-0 shrink-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ContestVisual contest={contest} meta={meta} />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
              <span className={`truncate text-[0.7rem] font-semibold uppercase tracking-[0.13em] ${meta.text}`}>
                {meta.label}
              </span>
            </div>
            <p className="mt-1 truncate text-[0.66rem] text-white/35" title={timingLabel}>
              {timingLabel}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.64rem] font-bold uppercase tracking-wider ${styles.badge}`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
          {status}
        </span>
      </div>

      {/* Reserve exactly two title lines, even for a short contest name. */}
      <h3
        title={contest.name}
        className="mt-4 h-12 min-h-12 shrink-0 overflow-hidden line-clamp-2 text-[1rem] font-semibold leading-6 text-white transition-colors duration-200 group-hover:text-purple-300"
      >
        {contest.name}
      </h3>

      {/* Primary data from the API, no empty fields or decorative placeholders. */}
      <div className="mt-3 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-[0.64rem] font-semibold uppercase tracking-wider text-white/35">Starts</p>
          <p className="mt-1 truncate text-[0.75rem] font-medium text-white/75" title={formatDateTime(contest.start_time)}>
            {formatDateTime(contest.start_time)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="h-9 w-px bg-white/10" />
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-wider text-white/35">Duration</p>
            <p className="mt-1 whitespace-nowrap text-[0.75rem] font-medium text-white/75">
              {formatDuration(contest.duration)}
            </p>
          </div>
        </div>
      </div>

      {/* The description is ALWAYS two lines high; nothing is reserved below it. */}
      <p
        title={description}
        className="mt-3 h-10 min-h-10 shrink-0 overflow-hidden line-clamp-2 text-xs leading-5 text-white/45"
      >
        {description}
      </p>

      {/* Show optional API fields only if present. Never create an empty row. */}
      {extras.length > 0 && (
        <div className="mt-2 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[0.65rem] text-white/40">
          {extras.slice(0, 3).map((extra, index) => (
            <span key={`${index}-${extra}`} className="inline-flex min-w-0 items-center gap-1.5">
              {index > 0 && <span className="shrink-0 text-white/20">·</span>}
              <span className="truncate" title={extra}>{extra}</span>
            </span>
          ))}
        </div>
      )}

      {/* Same actions and behaviour, aligned at bottom of equal-height grid cards. */}
      <div className="mt-auto flex min-w-0 shrink-0 items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
        <a
          href={googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-3 py-2.5 text-center text-[0.72rem] font-semibold text-purple-300 no-underline transition-all duration-200 hover:bg-purple-500/15 sm:px-4 sm:text-xs"
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

  const status = contest.status;

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
  const monthStarts = useMemo(
    () => contests.filter((contest) => isSameMonth(new Date(contest.start_time * 1000), month)).length,
    [contests, month],
  );



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
            <p className="mt-1 text-[0.65rem] text-white/35">
              {monthStarts} starting this month · {contests.length} in all months
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
// The card stays concise; the modal exposes all useful non-null API metadata.

function ContestDetailsModal({
  contest,
  onClose,
}: {
  contest: Contest | null;
  onClose: () => void;
}) {
  if (!contest) return null;

  const meta = getPlatform(contest.platform);
  const status = contest.status;
  const styles = STATUS_STYLES[status];
  const googleCalendarUrl = getGoogleCalendarUrl(contest);
  const description = cleanContestDescription(contest.description);
  const prize = formatPrize(contest);
  const timingLabel =
    status === "live"
      ? timeLeft(contest.end_time)
      : status === "upcoming"
        ? timeUntil(contest.start_time)
        : "Completed";

  const metadata = [
    { label: "Category", value: contest.category_name },
    { label: "Mode", value: formatMode(contest.mode) },
    { label: "Location", value: contest.location },
    { label: "Difficulty", value: contest.difficulty },
    { label: "Prize", value: prize },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value?.trim()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Contest details: ${contest.name}`}
        className="contest-hidden-scrollbar relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#050505] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`absolute inset-x-0 top-0 h-px rounded-t-[28px] bg-gradient-to-r ${styles.borderTop}`} />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/45 transition hover:bg-white/[0.08] hover:text-white"
        >
          Close
        </button>

        <div className="pr-20">
          <div className="mb-4 flex items-center gap-3">
            <ContestVisual contest={contest} meta={meta} />
            <div>
              <p className={`text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${meta.text}`}>
                {meta.label}
              </p>
              <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-widest ${styles.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                {status}
              </span>
            </div>
          </div>
          <h3 className="text-2xl font-bold leading-snug text-white">{contest.name}</h3>
        </div>

        {description && (
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-white/45">
            {description}
          </p>
        )}

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-white/35">Starts</span>
            <span className="text-right font-medium text-white/70">{formatDateTime(contest.start_time)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/35">Ends</span>
            <span className="text-right font-medium text-white/70">{formatDateTime(contest.end_time)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/35">Duration</span>
            <span className="font-medium text-white/70">{formatDuration(contest.duration)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/35">
              {status === "live" ? "Ends In" : status === "upcoming" ? "Timeline" : "Status"}
            </span>
            <span className={`text-right font-semibold ${styles.text}`}>{timingLabel}</span>
          </div>
          {metadata.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="shrink-0 text-white/35">{label}</span>
              <span className="min-w-0 break-words text-right font-medium text-white/70">{value}</span>
            </div>
          ))}
          {!!contest.tags?.length && (
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-white/35">Tags</span>
              <span className="min-w-0 break-words text-right font-medium text-white/70">
                {contest.tags.join(" · ")}
              </span>
            </div>
          )}
        </div>

        {contest.updated_at && (
          <p className="mt-3 text-right text-[0.65rem] text-white/25">
            Updated {new Date(contest.updated_at).toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </p>
        )}

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
    <div className="min-h-[340px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-5 2xl:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            <div className="h-2 w-24 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-white/10" />
      </div>
      <div className="mt-4 h-[68px] w-full animate-pulse rounded-xl bg-white/[0.06]" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-white/10" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3">
        <div className="h-9 w-32 animate-pulse rounded-xl bg-white/10" />
        <div className="flex gap-3">
          <div className="h-6 w-6 animate-pulse rounded bg-white/10" />
          <div className="h-6 w-6 animate-pulse rounded bg-white/10" />
        </div>
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

  onChange,

}: {

  value: Tab;

  counts: Record<Tab, number | null>;

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

            {counts[value] ?? "—"}

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

                  {counts[option] ?? "—"}

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
  const apiUrl = import.meta.env.VITE_CONTESTS_API_URL as string | undefined;

  // Server-filtered card feed: 20 contests per API page.
  const [contests, setContests] = useState<Contest[]>([]);
  const [feedNextOffset, setFeedNextOffset] = useState(0);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedLastPageSize, setFeedLastPageSize] = useState(0);
  const [feedLoading, setFeedLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  // Full catalog: calendar, platform choices and exact status counts.
  const [masterContests, setMasterContests] = useState<Contest[]>([]);
  const [masterTotal, setMasterTotal] = useState<number | null>(null);
  const [masterLoading, setMasterLoading] = useState(true);
  const [masterError, setMasterError] = useState(false);
  const [catalogRetry, setCatalogRetry] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [activePlatform, setActivePlatform] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [focusedCalendarDate, setFocusedCalendarDate] = useState<string | null>(
    null,
  );

  const calendarScrollRef = useRef<HTMLDivElement | null>(null);
  const cardsScrollRef = useRef<HTMLDivElement | null>(null);
  const paginationSentinelRef = useRef<HTMLDivElement | null>(null);

  const feedGenerationRef = useRef(0);
  const loadMoreAbortRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);

  // Keep typing responsive while avoiding an API request for every keystroke.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  // Load all API records to ground exact counts and the complete calendar.
  // Ended contests are filtered out before rendering. Limit=1000 is the API max;
  // the loader follows pagination.has_more until every API page is retrieved.
  useEffect(() => {
    if (!apiUrl) {
      setMasterLoading(false);
      setMasterError(true);
      return;
    }

    const controller = new AbortController();
    setMasterLoading(true);
    setMasterError(false);

    (async () => {
      try {
        const completeCatalog = await fetchCompleteContestCatalog(
          apiUrl,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setMasterContests(completeCatalog.contests);
          setMasterTotal(completeCatalog.total);
          setMasterError(false);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setMasterError(true);
          setMasterTotal(null); // Incomplete scans must never expose exact counts.
        }

        // Non-fatal: the card feed remains usable even if the background
        // catalog request fails.
        console.error("[ContestSection] Failed to load master contest catalog:", err);
      } finally {
        if (!controller.signal.aborted) setMasterLoading(false);
      }
    })();

    return () => controller.abort();
  }, [apiUrl, catalogRetry]);

  const platformIdByName = useMemo(() => {
    const map = new Map<string, number>();

    masterContests.forEach((contest) => {
      if (contest.platform_id === null || contest.platform_id === undefined) return;
      map.set(contest.platform.toLowerCase(), contest.platform_id);
    });

    // Fallback while the master catalog is still loading.
    contests.forEach((contest) => {
      if (contest.platform_id === null || contest.platform_id === undefined) return;

      if (!map.has(contest.platform.toLowerCase())) {
        map.set(contest.platform.toLowerCase(), contest.platform_id);
      }
    });

    return map;
  }, [masterContests, contests]);

  const activePlatformId = useMemo(() => {
    if (activePlatform === "all") return null;
    return platformIdByName.get(activePlatform.toLowerCase()) ?? null;
  }, [activePlatform, platformIdByName]);

  // The server's pagination.total/has_more can be global even on filtered
  // requests. The fully fetched master catalogue gives us the exact count for
  // status + platform filters (when there is no free-text search).
  const verifiedMatchingCount = useMemo<number | null>(() => {
    if (masterTotal === null || masterLoading || masterError || debouncedSearch) {
      return null;
    }
    return masterContests.filter((contest) =>
      contest.status === activeTab &&
      (activePlatform === "all" || contest.platform.toLowerCase() === activePlatform.toLowerCase()),
    ).length;
  }, [masterContests, masterTotal, masterLoading, masterError, debouncedSearch, activeTab, activePlatform]);

  // A short API page cannot justify another automatic fetch on metadata alone.
  // Exception: when the complete catalogue proves more matching contests exist,
  // continue paging to retrieve them. This handles inconsistent API metadata
  // without generating empty retries for the 7-of-31 Upcoming case.
  const canFetchNextPage = feedHasMore && (verifiedMatchingCount !== null
    ? contests.length < verifiedMatchingCount
    : feedLastPageSize >= CARD_PAGE_SIZE);

  // Don't present the global 31 as the total for the 7 upcoming cards.
  // Text-search totals are not inferred from master because the API may search
  // fields that the UI does not; show a lower bound until the last page.
  const displayedMatchingCount = verifiedMatchingCount !== null
    ? String(verifiedMatchingCount)
    : canFetchNextPage
      ? `${contests.length}+`
      : String(contests.length);

  // Upcoming is selected by default, therefore the first card request is:
  // ?status_filter=upcoming&skip=0&limit=20
  // instead of loading 100 mixed contests and filtering them locally.
  useEffect(() => {
    if (!apiUrl) {
      setError("VITE_CONTESTS_API_URL is not defined");
      setLoading(false);
      return;
    }

    if (activePlatform !== "all" && activePlatformId === null) {
      return;
    }

    const generation = ++feedGenerationRef.current;
    const controller = new AbortController();

    loadMoreAbortRef.current?.abort();
    loadMoreAbortRef.current = null;
    loadingMoreRef.current = false;

    setLoadingMore(false);
    setLoadMoreError(false);
    setFeedHasMore(false);
    setFeedLastPageSize(0);
    setFeedLoading(true);
    setError(null);

    (async () => {
      try {
        const page = await fetchContestPage(
          apiUrl,
          {
            skip: 0,
            limit: CARD_PAGE_SIZE,
            statusFilter: toApiStatusFilter(activeTab),
            platformId: activePlatformId,
            q: debouncedSearch || null,
          },
          controller.signal,
        );

        if (controller.signal.aborted || generation !== feedGenerationRef.current) {
          return;
        }

        setContests(page.contests.filter((contest) => contest.status === activeTab));
        setFeedHasMore(page.pagination.has_more);
        setFeedLastPageSize(page.rawCount);
        setFeedNextOffset(page.pagination.offset + page.rawCount);
        setError(null);

        window.requestAnimationFrame(() => {
          cardsScrollRef.current?.scrollTo({ top: 0 });
        });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (generation !== feedGenerationRef.current) return;

        setError(err instanceof Error ? err.message : "Failed to fetch contests");
      } finally {
        if (generation === feedGenerationRef.current) {
          setLoading(false);
          setFeedLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [
    apiUrl,
    activeTab,
    activePlatform,
    activePlatformId,
    debouncedSearch,
  ]);

  async function loadMoreContests(retry = false) {
    if (!apiUrl || loading || feedLoading || (!retry && loadMoreError) || !canFetchNextPage || loadingMoreRef.current) return;
    if (activePlatform !== "all" && activePlatformId === null) return;

    const generation = feedGenerationRef.current;
    const controller = new AbortController();

    loadMoreAbortRef.current?.abort();
    loadMoreAbortRef.current = controller;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(false);

    try {
      const page = await fetchContestPage(
        apiUrl,
        {
          skip: feedNextOffset,
          limit: CARD_PAGE_SIZE,
          statusFilter: toApiStatusFilter(activeTab),
          platformId: activePlatformId,
          q: debouncedSearch || null,
        },
        controller.signal,
      );

      if (controller.signal.aborted || generation !== feedGenerationRef.current) {
        return;
      }

      // A bad backend page can repeat records. Never retry it indefinitely.
      const existingIds = new Set(contests.map((contest) => contest.id));
      const matchingItems = page.contests.filter((contest) => contest.status === activeTab);
      const newItems = matchingItems.filter((contest) => !existingIds.has(contest.id));
      setContests((previous) => mergeUniqueContests(previous, matchingItems));
      setFeedHasMore(page.pagination.has_more && newItems.length > 0);
      setFeedLastPageSize(page.rawCount);
      setFeedNextOffset(page.pagination.offset + page.rawCount);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (generation !== feedGenerationRef.current) return;

      // Never remove already-loaded cards if a later page fails.
      console.error("[ContestSection] Failed to load more contests:", err);
      setLoadMoreError(true);
    } finally {
      if (generation === feedGenerationRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }

      if (loadMoreAbortRef.current === controller) {
        loadMoreAbortRef.current = null;
      }
    }
  }

  function handleCardsScroll() {
    const element = cardsScrollRef.current;

    if (!element || feedLoading || !canFetchNextPage || loadingMoreRef.current || loadMoreError) return;

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceFromBottom <= LOAD_MORE_THRESHOLD_PX) {
      void loadMoreContests();
    }
  }

  useEffect(() => {
    const panel = cardsScrollRef.current;
    if (!panel || loading || feedLoading || error || !canFetchNextPage || loadingMore || loadMoreError) return;
    if (panel.scrollHeight - panel.clientHeight <= LOAD_MORE_THRESHOLD_PX) {
      void loadMoreContests();
    }
  }, [contests.length, canFetchNextPage, loading, feedLoading, error, loadingMore, loadMoreError, calendarExpanded]);

  // The sentinel handles automatic pagination even when the browser does not
  // dispatch a normal scroll event (for example, when a linked wheel handler
  // moves scrollTop programmatically). The scroll handler above remains a fallback.
  // A desktop panel is its own scroll root; mobile uses the window viewport.
  useEffect(() => {
    const sentinel = paginationSentinelRef.current;
    const panel = cardsScrollRef.current;
    if (
      !sentinel || !panel || !canFetchNextPage || loading || feedLoading ||
      loadingMore || loadMoreError || error || typeof IntersectionObserver === "undefined"
    ) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMoreContests();
        }
      },
      {
        root: window.matchMedia("(min-width: 1024px)").matches ? panel : null,
        rootMargin: "0px 0px 360px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    contests.length,
    feedNextOffset,
    canFetchNextPage,
    loading,
    feedLoading,
    loadingMore,
    loadMoreError,
    error,
    calendarExpanded,
    activeTab,
    activePlatformId,
    debouncedSearch,
  ]);

  // Preserve the existing strict linked wheel behavior exactly.
  useEffect(() => {
    if (loading || error) return;

    const calendarElement = calendarScrollRef.current;
    const cardsElement = cardsScrollRef.current;

    if (!calendarElement || !cardsElement) return;

    const handleCalendarWheel = createStrictLinkedWheelHandler(
      calendarScrollRef,
      cardsScrollRef,
    );

    const handleCardsWheel = createStrictLinkedWheelHandler(
      cardsScrollRef,
      calendarScrollRef,
    );

    const wheelOptions: AddEventListenerOptions = {
      passive: false,
    };

    calendarElement.addEventListener("wheel", handleCalendarWheel, wheelOptions);
    cardsElement.addEventListener("wheel", handleCardsWheel, wheelOptions);

    return () => {
      calendarElement.removeEventListener("wheel", handleCalendarWheel);
      cardsElement.removeEventListener("wheel", handleCardsWheel);
    };
  }, [loading, error, calendarExpanded, contests.length, masterContests.length]);

  // Platform choices include only upcoming/live contests, not ended-only platforms.
  const platforms = useMemo(() => {
    const source = masterContests.length > 0
      ? masterContests.filter((contest) => contest.status !== "ended")
      : contests;

    return [
      "all",
      ...Array.from(new Set(source.map((contest) => contest.platform))).sort(
        (a, b) => a.localeCompare(b),
      ),
    ];
  }, [masterContests, contests]);

  // Exact status counts come from the COMPLETE API catalogue, never from
  // whatever pages of cards happen to be loaded. Ended contests are excluded.
  const counts = useMemo<Record<Tab, number | null>>(() => {
    if (masterTotal === null || masterError || masterLoading) {
      return { live: null, upcoming: null };
    }
    const result: Record<Tab, number> = { live: 0, upcoming: 0 };
    masterContests.forEach((contest) => {
      if (contest.status !== "ended") result[contest.status] += 1;
    });
    return result;
  }, [masterContests, masterTotal, masterError, masterLoading]);

  const visibleTotal = counts.upcoming !== null && counts.live !== null
    ? counts.upcoming + counts.live
    : null;

  // Calendar shows ALL upcoming and live contests across the full API catalogue,
  // irrespective of card pagination, status tab, platform filter or search.
  const calendarContests = useMemo(
    () => masterContests.filter((contest) => contest.status !== "ended"),
    [masterContests],
  );

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



      <div className="relative z-10 mx-auto max-w-7xl 2xl:max-w-[1880px] min-[2200px]:max-w-[2160px]">

        <div className="mb-8 grid gap-3 md:grid-cols-12 md:items-center">

          <div className="relative w-full md:col-span-8">

            <input

              type="text"

              placeholder="Search contests or platforms..."

              value={search}
              maxLength={100}

              onChange={(e) => setSearch(e.target.value)}

              className="h-[46px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-purple-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(140,69,255,0.08)]"

            />

          </div>



          <div className="md:col-span-2">

            <StatusDropdown

              value={activeTab}

              counts={counts}

              onChange={(nextTab) => setActiveTab(nextTab)}

            />

          </div>



          <div className="md:col-span-2">

            <PlatformDropdown

              value={activePlatform}

              platforms={platforms}

              onChange={(nextPlatform) => setActivePlatform(nextPlatform)}

            />

          </div>

        </div>



        {loading ? (

          <div className="grid gap-6 lg:grid-cols-3 2xl:gap-8">

            <CalendarSkeleton />



            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2 2xl:gap-6">

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

          <div className="grid gap-6 transition-all duration-500 ease-out pb-24 lg:h-[calc(100vh-260px)] lg:min-h-[560px] lg:grid-cols-3 lg:overflow-visible 2xl:h-[calc(100dvh-240px)] 2xl:min-h-[680px] 2xl:grid-cols-5 2xl:gap-8 min-[2200px]:grid-cols-6">

            <aside

              className={`min-h-0 transition-all duration-500 ease-out ${

                calendarExpanded
                  ? "lg:col-span-2 2xl:col-span-3 min-[2200px]:col-span-3"
                  : "lg:col-span-1 2xl:col-span-2 min-[2200px]:col-span-2"

              }`}

            >

              <div

                ref={calendarScrollRef}

                className="contest-hidden-scrollbar h-full overflow-y-auto overscroll-y-auto lg:pr-1"

              >

                {masterLoading ? (
                  <div className="px-2">
                    <p className="mb-2 text-[0.68rem] text-white/35">Loading all calendar contests…</p>
                    <CalendarSkeleton />
                  </div>
                ) : masterError ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-sm text-white/55">The complete calendar catalogue is unavailable. The card list still works.</p>
                    <button
                      type="button"
                      onClick={() => setCatalogRetry((previous) => previous + 1)}
                      className="mt-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/15"
                    >
                      Retry calendar
                    </button>
                  </div>
                ) : (
                  <ContestCalendar
                    month={calendarMonth}
                    contests={calendarContests}
                    expanded={calendarExpanded}
                    focusedDateKey={focusedCalendarDate}
                    onExpandToggle={handleCalendarExpandToggle}
                    onMonthChange={handleCalendarMonthChange}
                    onDetails={setSelectedContest}
                    onShowAllForDay={handleShowAllForDay}
                  />
                )}

              </div>

            </aside>



            <main

              className={`min-h-0 transition-all duration-500 ease-out ${

                calendarExpanded
                  ? "lg:col-span-1 2xl:col-span-2 min-[2200px]:col-span-3"
                  : "lg:col-span-2 2xl:col-span-3 min-[2200px]:col-span-4"

              }`}

            >

              <div

                ref={cardsScrollRef}
                onScroll={handleCardsScroll}
                aria-busy={loadingMore}

                className="contest-hidden-scrollbar h-full overflow-y-auto overscroll-y-auto lg:pr-1"

              >

                <div className="mb-4 flex items-end justify-between border-b border-white/10 pb-4">

                  <div>

                    <h3 className="mt-1 text-2xl font-bold text-white">

                      {activeTab === "upcoming" ? "Upcoming" : "Live"}{" "}

                      <span className="text-purple-500">Contests</span>

                    </h3>
                    {visibleTotal !== null && (
                      <p className="mt-1 text-[0.67rem] text-white/35">
                        All {visibleTotal} · Upcoming {counts.upcoming} · Live {counts.live}
                      </p>
                    )}

                  </div>



                  <span
                    title="Contests matching the selected status, platform and search"
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/40"
                  >
                    {feedLoading ? "…" : displayedMatchingCount} matching
                  </span>

                </div>



                {feedLoading ? (
                  <div className={calendarExpanded ? "grid gap-5" : "grid gap-5 sm:grid-cols-2"}>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))}
                  </div>
                ) : contests.length === 0 ? (

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

                        ? "grid w-full gap-5 pb-1 2xl:grid-cols-1 2xl:gap-6 min-[2200px]:grid-cols-2"

                        : "grid w-full gap-5 pb-1 sm:grid-cols-2 2xl:grid-cols-2 2xl:gap-6 min-[2200px]:grid-cols-3"

                    }

                  >

                    {contests.map((contest) => (

                      <ContestCard key={contest.id} contest={contest} />

                    ))}

                  </div>

                )}

                {!feedLoading && contests.length > 0 && (
                  <div className="mt-5 flex flex-col items-center gap-2 pb-6 text-center" aria-live="polite">
                    <p className="text-xs text-white/35">
                      Showing {contests.length} of {displayedMatchingCount} matching {activeTab} contests
                    </p>
                    {canFetchNextPage && (
                      <>
                        {/* This sentinel triggers the next API page near the bottom. */}
                        <div ref={paginationSentinelRef} className="h-px w-full" aria-hidden="true" />
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          {loadingMore ? (
                            <>
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" aria-hidden="true" />
                              Loading next contests…
                            </>
                          ) : loadMoreError ? (
                            <span className="text-red-400">Couldn't load the next page</span>
                          ) : (
                            <span>Scroll for more · {CARD_PAGE_SIZE} per request</span>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={loadingMore}
                          onClick={() => void loadMoreContests(true)}
                          className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-2.5 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/15 disabled:cursor-wait disabled:opacity-60"
                        >
                          {loadingMore ? "Loading…" : loadMoreError ? "Retry loading contests" : "Load more now"}
                        </button>
                      </>
                    )}
                    {!canFetchNextPage && <p className="text-xs text-white/30">All matching contests loaded</p>}
                  </div>
                )}

              </div>

            </main>

          </div>

        )}



        {!loading && !error && !feedLoading && (
          <p className="mt-0 text-center text-xs text-white/25">
            Showing {contests.length} of {displayedMatchingCount} matching {activeTab} contests
            {visibleTotal !== null
              ? ` · ${visibleTotal} available contests across all months`
              : " · Full calendar count unavailable"}
            {" · Calendar includes upcoming and live contests only"}
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