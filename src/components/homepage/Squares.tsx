// app/components/Squares.tsx
"use client";

import React, { useRef, useEffect, useCallback } from "react";

type CanvasStrokeStyle = string | CanvasGradient | CanvasPattern;

interface GridOffset { x: number; y: number; }

interface SquaresProps {
  direction?: "diagonal" | "up" | "right" | "down" | "left";
  speed?: number;
  borderColor?: CanvasStrokeStyle;
  squareSize?: number;
  hoverFillColor?: CanvasStrokeStyle;
  className?: string;
  style?: React.CSSProperties;

  /** NEW: background gradient (top -> bottom). */
  backgroundTop?: string;    // default "#020202"
  backgroundBottom?: string; // default "#2C114A"
  /** Keep the radial darkening at the edges */
  withVignette?: boolean;    // default true
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

const Squares: React.FC<SquaresProps> = ({
  direction = "right",
  speed = 1,
  borderColor = "#999",
  squareSize = 40,
  hoverFillColor = "#222",
  className = "absolute inset-0 w-full h-full block",
  style,

  backgroundTop = "#020202",
  backgroundBottom = "#2C114A",
  withVignette = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const cssW = useRef<number>(0);
  const cssH = useRef<number>(0);
  const gridOffset = useRef<GridOffset>({ x: 0, y: 0 });
  const cellRef = useRef<number>(squareSize);
  const bgGradientRef = useRef<CanvasGradient | null>(null);
  const vignetteRef = useRef<CanvasGradient | null>(null);
  const hovered = useRef<{ x: number; y: number } | null>(null);

  const getCtx = useCallback(() => canvasRef.current?.getContext("2d") ?? null, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const rect = canvas.getBoundingClientRect();
    cssW.current = Math.max(1, rect.width);
    cssH.current = Math.max(1, rect.height);

    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.floor(cssW.current * dpr);
    canvas.height = Math.floor(cssH.current * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    cellRef.current = squareSize;

    // Background linear gradient (top -> bottom)
    const bg = ctx.createLinearGradient(0, 0, 0, cssH.current);
    bg.addColorStop(0, backgroundTop);
    bg.addColorStop(1, backgroundBottom);
    bgGradientRef.current = bg;

    // Vignette (transparent center -> dark edges)
    const cx = cssW.current / 2;
    const cy = cssH.current / 2;
    const r = Math.sqrt(cssW.current * cssW.current + cssH.current * cssH.current) / 2;
    const vg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    vg.addColorStop(0, "rgba(0,0,0,0.5)");
    vg.addColorStop(1, "rgba(6,0,16,1)"); // very dark purple edges
    vignetteRef.current = vg;
  }, [getCtx, squareSize, backgroundTop, backgroundBottom]);

  const draw = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    const w = cssW.current, h = cssH.current, cell = cellRef.current, off = gridOffset.current;

    // FILL BACKGROUND FIRST (this removes the white center)
    if (bgGradientRef.current) {
      ctx.fillStyle = bgGradientRef.current;
    } else {
      ctx.fillStyle = backgroundTop;
    }
    ctx.fillRect(0, 0, w, h);

    const startX = Math.floor(off.x / cell) * cell;
    const startY = Math.floor(off.y / cell) * cell;

    const cols = Math.ceil(w / cell) + 2;
    const rows = Math.ceil(h / cell) + 2;

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;

    for (let ix = 0; ix < cols; ix++) {
      const x = startX + ix * cell - (off.x % cell);
      for (let iy = 0; iy < rows; iy++) {
        const y = startY + iy * cell - (off.y % cell);

        if (hovered.current && ix === hovered.current.x && iy === hovered.current.y) {
          ctx.fillStyle = hoverFillColor;
          ctx.fillRect(x, y, cell, cell);
        }
        ctx.strokeRect(x, y, cell, cell);
      }
    }

    if (withVignette && vignetteRef.current) {
      ctx.fillStyle = vignetteRef.current;
      ctx.fillRect(0, 0, w, h);
    }
  }, [borderColor, hoverFillColor, backgroundTop, getCtx, withVignette]);

  const tick = useCallback(() => {
    const cell = cellRef.current;
    const s = Math.max(0.1, speed);

    switch (direction) {
      case "right": gridOffset.current.x = mod(gridOffset.current.x - s, cell); break;
      case "left":  gridOffset.current.x = mod(gridOffset.current.x + s, cell); break;
      case "up":    gridOffset.current.y = mod(gridOffset.current.y + s, cell); break;
      case "down":  gridOffset.current.y = mod(gridOffset.current.y - s, cell); break;
      case "diagonal":
        gridOffset.current.x = mod(gridOffset.current.x - s, cell);
        gridOffset.current.y = mod(gridOffset.current.y - s, cell);
        break;
    }
    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [direction, speed, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cell = cellRef.current;

      const startX = Math.floor(gridOffset.current.x / cell) * cell;
      const startY = Math.floor(gridOffset.current.y / cell) * cell;

      const ix = Math.floor((mx + (gridOffset.current.x - startX)) / cell);
      const iy = Math.floor((my + (gridOffset.current.y - startY)) / cell);

      if (!hovered.current || hovered.current.x !== ix || hovered.current.y !== iy) {
        hovered.current = { x: ix, y: iy };
      }
    };
    const onLeave = () => (hovered.current = null);

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    let rAF: number | null = null;
    const onResize = () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => { resize(); draw(); });
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
      if (rAF) cancelAnimationFrame(rAF);
    };
  }, [resize, draw]);

  useEffect(() => {
    const start = () => { if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick); };
    const stop  = () => { if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const onVis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [tick]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block", ...style }}
    />
  );
};

export default Squares;
