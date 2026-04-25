"use client";


import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const EMPTY_STATE_LOTTIE = "/animations/coding.lottie";

export default function BugBountySection() {
  return (
    <section
      id="bug-bounties"
      className="font-rubik bg-[#020202] px-5 py-16 text-center md:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
          Bug <span className="text-purple-500">Bounties</span>
        </h2>

        <div className="flex flex-col items-center justify-center pt-12">
          <div className="h-[180px] w-[180px] sm:h-[220px] sm:w-[220px] md:h-[260px] md:w-[260px]">
            <DotLottieReact src={EMPTY_STATE_LOTTIE} loop autoplay />
          </div>

          <p className="mt-3 text-sm text-white/60 md:text-base">
            No bug bounties available right now. Updates will be added soon.
          </p>
        </div>
      </div>
    </section>
  );
}