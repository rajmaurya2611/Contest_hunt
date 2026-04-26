"use client";


const Footer = () => {
  return (
    <footer className="w-full bg-black px-4 pb-6 pt-10">

        {/* Bottom Footer */}
        <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center md:flex-row">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} ContestHunt
          </p>

          <p className="text-xs text-white/40">
            Made with <span className="text-[#8C45FF]">love</span> in India by{" "}
            <span className="font-semibold text-white/60">Team Miraidyo</span>
          </p>
        </div>
    </footer>
  );
};

export default Footer;