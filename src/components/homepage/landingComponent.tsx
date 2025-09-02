// "use client";

// import { useRef, useEffect } from "react";
// import {
//   useRive,
//   useViewModel,
//   useViewModelInstance,
//   useViewModelInstanceNumber,
//   Layout, Fit, Alignment,
// } from "@rive-app/react-canvas";
// import Squares from "./Squares";
// import Typewriter from "typewriter-effect";

// const SM = "State Machine 1";
// const VM = "View Model 1";

// export default function LandingComponent() {
//   const rootRef = useRef<HTMLDivElement | null>(null);
//   const riveWrapperRef = useRef<HTMLDivElement | null>(null);

//   const { rive, RiveComponent } = useRive({
//     src: "/redigen_1.riv",
//     stateMachines: SM,
//     autoplay: true,
//     autoBind: true,
//     layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
//   });

//   const viewModel = useViewModel(rive, { name: VM });
//   const vmi = useViewModelInstance(viewModel, { rive });
//   const { setValue: setMouseX } = useViewModelInstanceNumber("Mouse X", vmi);
//   const { setValue: setMouseY } = useViewModelInstanceNumber("Mouse Y", vmi);

//   useEffect(() => {
//     const el = rootRef.current;
//     if (!el || !setMouseX || !setMouseY) return;

//     const onMove = (e: PointerEvent) => {
//       const r = el.getBoundingClientRect();
//       const nx = ((e.clientX - r.left) / r.width) * 100;
//       const ny = ((e.clientY - r.top) / r.height) * 100;
//       setMouseX(Math.max(0, Math.min(100, nx)));
//       setMouseY(Math.max(0, Math.min(100, ny)));
//     };

//     window.addEventListener("pointermove", onMove, { passive: true });
//     return () => window.removeEventListener("pointermove", onMove);
//   }, [setMouseX, setMouseY]);

//   return (
//     <div ref={rootRef} className="relative w-full h-[100vh] overflow-hidden touch-none">
//       {/* Background grid */}
//       <Squares
//         speed={0.2}
//         squareSize={40}
//         direction="diagonal"
//         borderColor="rgba(255,255,255,0.22)"
//         hoverFillColor="rgba(0,0,0,0.35)"
//         backgroundTop="#020202"
//         backgroundBottom="#2C114A"
//         withVignette={true}
//         className="absolute inset-0 -z-10"
//         style={{ pointerEvents: "none" }}
//       />

//       {/* Rive layer */}
//       <div ref={riveWrapperRef} className="absolute inset-0 z-0">
//         <RiveComponent style={{ width: "100%", height: "100%" }} />
//       </div>

//       {/* LEFT TEXT OVERLAY (centered vertically, left-aligned) */}
//       <div className="absolute inset-y-0 left-0 z-10 w-full md:w-1/2 lg:w-5/12 px-6 md:px-8 flex items-center pointer-events-none">
//         <div className="max-w-3xl">
//           <h1 className="pl-8 text-white font-rubik font-bold tracking-tight leading-[3.05] text-4xl md:text-4xl lg:text-5xl">
//             Never  miss  a  <span className="text-[#8C45FF]"> Coding</span>
//             <br className="hidden sm:block" />
//            <span className="text-[#8C45FF]"> Contest</span> <span className="text-white"> again</span>
//           </h1>

//           <p className="pl-8 mt-4 font-rubik text-white/80 text-sm md:text-base lg:text-xl">
//             Real-time schedules for{" "}
//             <span className="font-bold text-[#8C45FF]">
//               <Typewriter
//                 component="span"
//                 options={{
//                   strings: ["Coding Contests", "Hackathons", "Bug Bounty Programs"],
//                   autoStart: true,
//                   loop: true,
//                   delay: 60,
//                   deleteSpeed: 35,
//                   cursor: "|",
//                   wrapperClassName: "inline text-[#8C45FF]",
//                   cursorClassName: "",
//                 }}
//               />
//             </span>
//             <span className="block mt-1">from all major platforms</span>
//           </p>
          
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useRef, useEffect } from "react";
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceNumber,
  Layout, Fit, Alignment,
} from "@rive-app/react-canvas";
import Squares from "./Squares";
import Typewriter from "typewriter-effect";

const SM = "State Machine 1";
const VM = "View Model 1";

export default function LandingComponent() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const riveWrapperRef = useRef<HTMLDivElement | null>(null);

  const { rive, RiveComponent } = useRive({
    src: "/redigen_1.riv",
    stateMachines: SM,
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
  });

  const viewModel = useViewModel(rive, { name: VM });
  const vmi = useViewModelInstance(viewModel, { rive });
  const { setValue: setMouseX } = useViewModelInstanceNumber("Mouse X", vmi);
  const { setValue: setMouseY } = useViewModelInstanceNumber("Mouse Y", vmi);

  // Eye-tracking stays global (container-relative)
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !setMouseX || !setMouseY) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 100;
      const ny = ((e.clientY - r.top) / r.height) * 100;
      setMouseX(Math.max(0, Math.min(100, nx)));
      setMouseY(Math.max(0, Math.min(100, ny)));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [setMouseX, setMouseY]);

  return (
    <div ref={rootRef} className="relative w-full h-[100vh] overflow-hidden touch-none">
      {/* Background grid */}
      <Squares
        speed={0.2}
        squareSize={40}
        direction="diagonal"
        borderColor="rgba(255,255,255,0.22)"
        hoverFillColor="rgba(0,0,0,0.35)"
        backgroundTop="#020202"
        backgroundBottom="#2C114A"
        withVignette={true}
        className="absolute inset-0 -z-10"
        style={{ pointerEvents: "none" }}
      />

      {/* Rive */}
      <div ref={riveWrapperRef} className="absolute inset-0 z-0">
        <RiveComponent style={{ width: "100%", height: "100%" }} />
      </div>

      {/* LEFT OVERLAY: pass-through by default (keeps eye tracking responsive) */}
      <div className="absolute inset-y-0 left-0 z-10 w-full md:w-1/2 lg:w-5/12 px-6 md:px-8 flex items-center pointer-events-none">
        <div className="max-w-3xl">
          {/* Non-interactive text (doesn't block pointer moves) */}
          <h1 className="text-white font-rubik font-bold tracking-tight leading-[1.08] text-4xl md:text-4xl lg:text-5xl select-none">
            Never miss a <span className="text-[#8C45FF]">Coding</span>
            <br className="hidden sm:block" />
            Contest <span className="text-white">again</span>
          </h1>

          <p className="mt-5 text-white/80 text-sm md:text-base lg:text-xl select-none">
            Real-time schedules for{" "}
            <span className="font-bold text-[#8C45FF]">
              <Typewriter
                component="span"
                options={{
                  strings: ["Coding Contests", "Hackathons", "Bug Bounty Programs"],
                  autoStart: true,
                  loop: true,
                  delay: 60,
                  deleteSpeed: 35,
                  cursor: "|",
                  wrapperClassName: "inline text-[#8C45FF]",
                  cursorClassName: "",
                }}
              />
            </span>
            <span className="block mt-2">from all major platforms</span>
          </p>

  {/* Android active button */}
  <a
  href="https://play.google.com/store/apps/details?id=your.app.id"
  target="_blank"
  rel="noopener noreferrer"
  className="pointer-events-auto rounded-full border-2 border-[#8C45FF] bg-gradient-to-r from-[#8C45FF] to-purple-900 hover:shadow-[#8C45FF] text-white font-medium px-5 py-2 mt-8 shadow-md transition inline-block"
>
  Download for Android
</a>


  {/* iOS disabled button */}
  <button
    className="rounded-full border-2 border-gray-400 text-gray-400 font-medium px-5 py-2 ml-4 cursor-not-allowed"
    disabled
  >
    iOS coming soon
  </button>
        </div>
      </div>
    </div>
  );
}
