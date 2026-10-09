"use client";

import * as React from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  vx: number;
  vy: number;
  swaySpeed: number;
  swayOffset: number;
  hue: string;
}

export function Hero3DParticles() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const prefersReduced = useReducedMotion();
  const mouseRef = React.useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  React.useEffect(() => {
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    // Track mouse for 3D air current interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // Generate 42 3D gold diya dust particles
    const particleCount = 42;
    const particles: Particle[] = [];

    const hues = [
      "rgba(201, 160, 82,", // Antique temple gold
      "rgba(233, 212, 174,", // Soft champagne gold
      "rgba(255, 235, 185,", // Radiant warm ivory
      "rgba(140, 37, 36,", // Rare auspicious kumkum spark
    ];

    for (let i = 0; i < particleCount; i++) {
      const z = 0.4 + Math.random() * 0.9;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        radius: (1.2 + Math.random() * 2) * z,
        baseAlpha: (0.25 + Math.random() * 0.55) * z,
        alpha: 0.3,
        vx: (Math.random() - 0.5) * 0.25 * z,
        vy: (-0.18 - Math.random() * 0.35) * z, // gently drift upward
        swaySpeed: 0.008 + Math.random() * 0.012,
        swayOffset: Math.random() * Math.PI * 2,
        hue: hues[Math.floor(Math.random() * (i % 7 === 0 ? 4 : 3))],
      });
    }

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Horizontal natural swaying motion
        p.x += p.vx + Math.sin(tick * p.swaySpeed + p.swayOffset) * 0.35 * p.z;
        p.y += p.vy;

        // Subtle 3D mouse repel breeze
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 130 * p.z;
          if (distSq < maxDist * maxDist && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / maxDist) * 1.5 * p.z;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        // Wrap around boundaries seamlessly
        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 10;
        if (p.x > width + 20) p.x = -10;

        // Volumetric beam brightening: particles crossing top-left spotlight glow more
        const inSpotlight =
          p.x < 550 && p.y < 500 && p.y > p.x * 0.25 && p.y < p.x * 1.8 + 200;
        const spotlightBoost = inSpotlight ? 1.6 : 1.0;

        // Alpha shimmer pulsation
        const shimmer =
          0.85 + Math.sin(tick * 0.04 + p.swayOffset) * 0.25;
        p.alpha = Math.min(1, p.baseAlpha * shimmer * spotlightBoost);

        // Draw particle with soft radial bloom
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.hue} ${p.alpha})`;
        ctx.shadowColor = "rgba(201, 160, 82, 0.4)";
        ctx.shadowBlur = 8 * p.z;
        ctx.fill();

        // Extra outer halo for close/large particles
        if (p.z > 0.9) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `${p.hue} ${p.alpha * 0.2})`;
          ctx.shadowBlur = 0;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-75"
    />
  );
}
