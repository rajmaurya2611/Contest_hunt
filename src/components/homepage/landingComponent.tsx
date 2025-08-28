"use client";

import React, { useRef } from "react";
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceNumber,
  Layout,
  Fit,
  Alignment,
} from "@rive-app/react-canvas";
import Squares from "./Squares"; // adjust path

const SM = "State Machine 1"; // exact names
const VM = "View Model 1";

export default function LandingComponent() {
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

  // Wrap the Rive canvas so we can target the right <canvas>
  const riveWrapperRef = useRef<HTMLDivElement | null>(null);

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!setMouseX || !setMouseY) return;
    const riveCanvas =
      riveWrapperRef.current?.querySelector("canvas") ?? null;
    if (!riveCanvas) return;

    const r = riveCanvas.getBoundingClientRect();
    // Normalize to 0..100 (match your VM expectations)
    setMouseX(((e.clientX - r.left) / r.width) * 100);
    setMouseY(((e.clientY - r.top) / r.height) * 100);
  };

  return (
    <div
      onPointerMove={onPointerMove}
      className="relative w-full h-[100vh] touch-none"
      // removed the CSS gradient — Squares will be the bg
    >
      {/* Background grid (behind everything) */}
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

      {/* Rive on top */}
      <div ref={riveWrapperRef} className="absolute inset-0">
        <RiveComponent style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Optional foreground content */}
      {/* <div className="relative z-10">Content</div> */}
    </div>
  );
}
