"use client";

import { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const CONTACT_EMAIL = "mail.miraidyo@gmail.com";
const SEND_LOTTIE_SRC = "/animations/Gibli Tribute.lottie";

export default function ContactUs() {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const subject = encodeURIComponent("Message from ContestHunt Website");
    const body = encodeURIComponent(trimmedMessage);

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <footer className="relative overflow-hidden bg-[#020202] px-5 py-16 font-rubik md:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-[#8C45FF]/10 blur-[120px]" />
        <div className="absolute -left-28 bottom-10 h-[280px] w-[280px] rounded-full bg-purple-700/10 blur-[110px]" />
        <div className="absolute -right-28 bottom-10 h-[280px] w-[280px] rounded-full bg-violet-500/10 blur-[110px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      </div>

      <div className="">
        {/* Top Center Heading */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Want to tell us{" "}
            <span className="text-purple-500">something?</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/45 md:text-base">
            Found a bug, want a platform added, or have feedback for
            ContestHunt? Write to us directly.
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-5 inline-block text-sm font-semibold text-purple-400 no-underline transition-colors duration-200 hover:text-purple-300"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        {/* Left Lottie + Right Message Box */}
        <div className="grid lg:grid-cols-2 lg:items-center">
          {/* Left Lottie */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-[420px] md:h-[340px] md:max-w-[520px]">
              <DotLottieReact src={SEND_LOTTIE_SRC} loop autoplay />
            </div>
          </div>

          {/* Right Message Box */}
          <div className="w-full">
            {/* <label
              htmlFor="footer-message"
              className="text-xs font-bold uppercase tracking-[0.18em] text-white/35"
            >
              Write your message
            </label> */}

            <textarea
              id="footer-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder="Type your message and send this opens your mail app with the message prefilled."
              className="mt-4 w-full resize-none rounded-[26px] border border-white/10 bg-white/[0.025] px-5 py-5 text-sm leading-6 text-white outline-none transition-all duration-200 placeholder:text-white/25 focus:border-purple-500/50 focus:bg-white/[0.035]"
            />

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="mt-4 w-full rounded-full border border-purple-500/30 bg-purple-500/10 px-6 py-3.5 text-sm font-semibold text-purple-300 transition-all duration-200 hover:bg-purple-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}