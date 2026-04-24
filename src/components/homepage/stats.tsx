"use client";

import { useEffect, useRef, useState } from "react";

type StatItem = {
  value: number;
  suffix?: string;
  label: string;
};

const stats: StatItem[] = [
  { value: 25, suffix: "+", label: "Platform covered" },
  { value: 300, suffix: "+", label: "Active Coders" },
  { value: 1000, suffix: "+", label: "Contests Tracked Daily" },
  { value: 10, suffix: "K+", label: "Daily Reminders Sent" }
];

function CountUp({
  end,
  duration = 1400,
  suffix = "",
  startAnimation,
}: {
  end: number;
  duration?: number;
  suffix?: string;
  startAnimation: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startAnimation) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * end);

      setCount(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, startAnimation]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export default function ContestStats() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStartAnimation(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative font-rubik bg-[#020202] px-5 py-16 md:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Our <span className="text-[#8C45FF]">Impact</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-purple-950/20 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-white/[0.05] hover:shadow-[0_8px_32px_rgba(140,69,255,0.14)]"
            >
              {/* <div className="mb-3 inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-purple-400">
                CH
              </div> */}

              <h3 className="text-3xl font-bold leading-none text-white sm:text-4xl lg:text-5xl">
                <CountUp
                  end={item.value}
                  suffix={item.suffix}
                  startAnimation={startAnimation}
                />
              </h3>

              <div className="mx-auto mt-4 h-[1px] w-12 bg-white/10 transition-all duration-300 group-hover:w-16 group-hover:bg-purple-500/40" />

              <p className="mt-4 text-sm font-medium leading-6 text-white/55 sm:text-base">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}