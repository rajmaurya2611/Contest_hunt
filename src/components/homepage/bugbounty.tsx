"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const EMPTY_STATE_LOTTIE = "/animations/coding.lottie";

export default function BugBountySection() {
  return (
    <section
      id="bug-bounties"
      className="font-rubik bg-[#020202] px-4 py-12 text-center sm:px-5 sm:py-14 md:px-8 md:py-16 lg:px-10"
    >
      <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center">
        <h2 className="mb-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:mb-10 md:text-5xl">
          Bug <span className="text-purple-500">Bounties</span>
        </h2>

        <div className="flex w-full flex-col items-center justify-center">
          <div className="h-[150px] w-[150px] sm:h-[190px] sm:w-[190px] md:h-[240px] md:w-[240px] lg:h-[260px] lg:w-[260px]">
            <DotLottieReact src={EMPTY_STATE_LOTTIE} loop autoplay />
          </div>

          <p className="mt-4 max-w-[320px] text-sm leading-6 text-white/60 sm:max-w-md md:text-base">
            No bug bounties available right now. Updates will be added soon.
          </p>
        </div>
      </div>
    </section>
  );
}