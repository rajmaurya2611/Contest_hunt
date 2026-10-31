
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE = "https://contesthunt.in";

const seoPages: Record<
  string,
  { title: string; description: string }
> = {
  "/": {
    title: "ContestHunt | Coding Contests, Hackathons & Bug Bounties",
    description:
      "Discover upcoming coding contests, hackathons and bug bounty programs. Explore competition schedules, deadlines and registration links.",
  },
  "/contests": {
    title: "Upcoming Coding Contests | ContestHunt",
    description:
      "Explore upcoming coding competitions from platforms including LeetCode, CodeChef and AtCoder. Find schedules and contest links.",
  },
  "/hackathons": {
    title: "Upcoming Hackathons | ContestHunt",
    description:
      "Find upcoming hackathons and developer competitions. Explore event details, deadlines and registration opportunities.",
  },
  "/bug-bounties": {
    title: "Bug Bounty Programs | ContestHunt",
    description:
      "Explore bug bounty opportunities and security challenges for developers and cybersecurity enthusiasts.",
  },
};

export default function SEO() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const page = seoPages[path];

  if (!page) return null;

  const canonical = `${SITE}${path === "/" ? "/" : path}`;

  return (
    <Helmet>
      <title>{page.title}</title>
      <meta
        name="description"
        content={page.description}
      />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={page.title} />
      <meta
        property="og:description"
        content={page.description}
      />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
    </Helmet>
  );
}
