"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const EMPTY_STATE_LOTTIE = "/animations/coding.lottie";

export default function BugBountySection() {
  return (
    <section
      id="bug-bounties"
      className="font-rubik flex min-h-[calc(100svh-72px)] items-center justify-center bg-[#020202] px-4 py-10 text-center sm:px-5 sm:py-12 md:px-8 md:py-16 lg:px-10"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center">
        {/* Uncomment this if you want heading back */}
        {/* 
        <h2 className="mb-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:mb-10 md:text-5xl">
          Bug <span className="text-purple-500">Bounties</span>
        </h2> 
        */}

        <div className="flex w-full flex-col items-center justify-center">
          <div className="h-[150px] w-[150px] sm:h-[190px] sm:w-[190px] md:h-[240px] md:w-[240px] lg:h-[260px] lg:w-[260px]">
            <DotLottieReact src={EMPTY_STATE_LOTTIE} loop autoplay />
          </div>

          <p className="mt-4 max-w-[300px] text-xs leading-5 text-white/60 sm:max-w-md sm:text-sm md:text-base md:leading-6">
            No bug bounties available right now. Updates will be added soon.
          </p>
        </div>
      </div>
    </section>
  );
}