"use client";

type PlatformItem = {
  name: string;
  icon: string;
  url: string;
};

const platforms: PlatformItem[] = [
  { name: "Devfolio", icon: "/icons/devfolio.png", url: "https://devfolio.co" },
  { name: "Devpost", icon: "/icons/devpost.png", url: "https://devpost.com" },
  { name: "Unstop", icon: "/icons/unstop.png", url: "https://unstop.com" },
  {
    name: "HackerEarth",
    icon: "/icons/hackerearth.png",
    url: "https://www.hackerearth.com",
  },
  {
    name: "Codeforces",
    icon: "/icons/codeforces.png",
    url: "https://codeforces.com",
  },
  {
    name: "LeetCode",
    icon: "/icons/leetcode.png",
    url: "https://leetcode.com",
  },
  {
    name: "CodeChef",
    icon: "/icons/codechef.png",
    url: "https://www.codechef.com",
  },
  {
    name: "AtCoder",
    icon: "/icons/atcoder.png",
    url: "https://atcoder.jp",
  },
  {
    name: "HackerRank",
    icon: "/icons/hackerrank.png",
    url: "https://www.hackerrank.com",
  },
  {
    name:"Coding Ninjas",
    icon:"/icons/code360.png",
    url:"https://www.codingninjas.com"
  },
  {
    name: "CS Academy",
    icon: "/icons/csacademy.png",
    url: "https://csacademy.com",
  },
  {
    name:"GeeksforGeeks",
    icon:"/icons/geeksforgeeks.png",
    url:"https://practice.geeksforgeeks.org"
  },
  {
    name: "Now Coder",
    icon: "/icons/nowcoder.png",
    url: "https://www.nowcoder.com"
  },
  {
    name:"Replit",
    icon:"/icons/replit.png",
    url:"https://replit.com"
  },
  {
    name:"TopCoder",
    icon:"/icons/topcoder.png",
    url:"https://www.topcoder.com"
  }
];

function PlatformCard({ item }: { item: PlatformItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${item.name}`}
      className="group mx-5 flex min-w-[120px] flex-col items-center justify-center gap-3 text-center no-underline"
    >
      <div className="flex h-14 w-14 items-center justify-center">
        <img
          src={item.icon}
          alt={item.name}
          className="max-h-full max-w-full object-contain transition-all duration-300 group-hover:scale-110"
          loading="lazy"
        />
      </div>

      <span className="max-w-[120px] truncate text-sm font-semibold text-white/65 transition-colors duration-300 group-hover:text-purple-300">
        {item.name}
      </span>
    </a>
  );
}

export default function PlatformCoveredMarquee() {
  const marqueeItems = [...platforms, ...platforms];

  return (
    <section className="relative overflow-hidden bg-[#020202] px-5 py-16 font-rubik md:px-8 lg:px-10">
      <style>{`
        @keyframes platformMarquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .platform-marquee-track {
          animation: platformMarquee 28s linear infinite;
        }

        .platform-marquee-wrapper:hover .platform-marquee-track {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .platform-marquee-track {
            animation: none;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#8C45FF]/12 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Platforms <span className="text-[#8C45FF]">Covered</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/45 md:text-base">
            ContestHunt tracks opportunities across leading coding, hackathon,
            and bug bounty platforms.
          </p>
        </div>

        <div className="platform-marquee-wrapper relative overflow-hidden rounded-[28px] py-5 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-gradient-to-r from-[#020202] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-[#020202] to-transparent" />

          <div className="platform-marquee-track flex w-max items-center">
            {marqueeItems.map((item, index) => (
              <PlatformCard key={`${item.name}-${index}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
    
  );
}