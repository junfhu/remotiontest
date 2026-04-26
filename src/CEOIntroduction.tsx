import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from "remotion";

const GREEN = "#76B900";
const GREEN_10 = "rgba(118, 185, 0, 0.10)";
const GREEN_20 = "rgba(118, 185, 0, 0.20)";
const GREEN_30 = "rgba(118, 185, 0, 0.30)";
const GREEN_40 = "rgba(118, 185, 0, 0.40)";
const GREEN_60 = "rgba(118, 185, 0, 0.60)";
const GREEN_80 = "rgba(118, 185, 0, 0.80)";
const DARK = "rgba(8, 14, 4, 0.88)";
const WHITE = "#ffffff";

const W = 1920;
const H = 1080;
const Cx = W / 2;
const Cy = H / 2;

/* ── helpers ─────────────────────────────────────────────── */

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* seeded pseudo-random for deterministic frames */
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ── Background layer: perspective grid + vignette ────────── */

const PerspectiveGrid: React.FC<{ frame: number }> = ({ frame }) => {
  const horizonY = 420;
  const speed = 0.6;
  const offset = (frame * speed) % 40;
  const opacity = interpolate(frame, [0, 25], [0, 0.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const linesH = [];
  for (let i = -10; i < 30; i++) {
    const y = horizonY + offset + i * 40;
    const t = clamp((y - horizonY) / (H - horizonY), 0, 1);
    const alpha = t * 0.6;
    linesH.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={y}
        x2={W}
        y2={y}
        stroke={GREEN}
        strokeWidth={0.5 + t * 1.5}
        opacity={alpha}
      />
    );
  }

  const linesV = [];
  const centerX = 1100; // shifted right because Jensen is on right
  for (let i = -20; i < 25; i++) {
    const baseX = centerX + i * 60;
    const t = clamp(Math.abs(i) / 20, 0, 1);
    linesV.push(
      <line
        key={`v${i}`}
        x1={baseX + (frame * 0.3 * (i % 2 === 0 ? 1 : -1)) % 120}
        y1={horizonY}
        x2={lerp(centerX, baseX, 2.5)}
        y2={H}
        stroke={GREEN}
        strokeWidth={0.5}
        opacity={0.15 * (1 - t * 0.7)}
      />
    );
  }

  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", top: 0, left: 0, opacity }}
    >
      <defs>
        <linearGradient id="horizonFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={WHITE} />
          <stop offset="30%" stopColor={WHITE} />
          <stop offset="100%" stopColor="rgba(118,185,0,0.04)" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#horizonFade)" />
      {linesH}
      {linesV}
    </svg>
  );
};

const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,0,0,0.12) 75%, rgba(0,0,0,0.25) 100%)",
      pointerEvents: "none",
      zIndex: 1,
    }}
  />
);

const NoiseOverlay: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={W} height={H} style={{ position: "absolute", top: 0, left: 0, opacity: 0.025, zIndex: 2 }}>
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed={frame % 8} />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#n)" />
  </svg>
);

/* ── Title: MUYA ─────────────────────────────────── */

const TitleBlock: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const titleScale = spring({
    frame,
    fps,
    config: { damping: 9, stiffness: 140, mass: 1.1, overshootClamping: false },
  });

  /* overshoot from 3.2 -> 1.05 -> 1.0 */
  const scale = interpolate(titleScale, [0, 1], [3.2, 1.05]);
  const settle = spring({
    frame: frame - 15,
    fps,
    config: { damping: 20, stiffness: 200 },
  });
  const finalScale = interpolate(settle, [0, 1], [scale, 1]);

  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glowOpacity = interpolate(frame, [0, 20], [0, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const chars = "慕涯说AI";
  const letterDelay = 2;

  return (
    <div
      style={{
        position: "absolute",
        top: 280,
        left: 0,
        width: W,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
        opacity,
      }}
    >
      {/* massive ambient glow behind text */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 300,
          background: `radial-gradient(ellipse, ${GREEN_30} 0%, transparent 70%)`,
          filter: "blur(60px)",
          opacity: glowOpacity,
          top: 0,
        }}
      />

      <div
        style={{
          transform: `scale(${finalScale})`,
          transformOrigin: "center center",
          position: "relative",
        }}
      >
        {/* Chromatic aberration layers */}
        <span
          style={{
            position: "absolute",
            left: 3,
            top: 0,
            fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
            fontSize: 150,
            fontWeight: 900,
            color: "#ff0040",
            letterSpacing: 14,
            textTransform: "uppercase",
            opacity: interpolate(frame, [0, 8, 12], [0.5, 0.15, 0]),
            mixBlendMode: "screen",
            whiteSpace: "nowrap",
          }}
        >
          {chars}
        </span>
        <span
          style={{
            position: "absolute",
            left: -3,
            top: 0,
            fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
            fontSize: 150,
            fontWeight: 900,
            color: "#00ffff",
            letterSpacing: 14,
            textTransform: "uppercase",
            opacity: interpolate(frame, [0, 8, 12], [0.5, 0.15, 0]),
            mixBlendMode: "screen",
            whiteSpace: "nowrap",
          }}
        >
          {chars}
        </span>

        {/* main text with per-letter subtle stagger */}
        <div style={{ display: "flex", gap: 6 }}>
          {chars.split("").map((ch, i) => {
            const d = spring({
              frame: frame - i * letterDelay,
              fps,
              config: { damping: 12, stiffness: 220, mass: 0.8 },
            });
            const yOff = interpolate(d, [0, 1], [-30, 0]);
            const chOp = interpolate(frame - i * letterDelay, [0, 4], [0, 1], { extrapolateLeft: "clamp" });
            return (
              <span
                key={i}
                style={{
                  fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
                  fontSize: 150,
                  fontWeight: 900,
                  color: ch === " " ? "transparent" : GREEN,
                  letterSpacing: ch === " " ? 20 : 4,
                  textTransform: "uppercase",
                  textShadow: `0 0 50px ${GREEN_20}, 0 0 100px ${GREEN_10}, 0 4px 0 rgba(0,0,0,0.04)`,
                  transform: `translateY(${yOff}px)`,
                  opacity: ch === " " ? 1 : chOp,
                  display: "inline-block",
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            );
          })}
        </div>

        {/* underline energy bar */}
        <div
          style={{
            marginTop: 12,
            height: 4,
            width: interpolate(frame, [10, 30], [0, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)`,
            boxShadow: `0 0 20px ${GREEN_40}`,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />
      </div>
    </div>
  );
};

/* ── Holographic Muya Portrait (placeholder) ───────────── */

const BackgroundPortrait: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const enter = spring({
    frame: frame - 40,
    fps,
    config: { damping: 7, stiffness: 280, mass: 1.3 },
  });
  const enterScale = interpolate(enter, [0, 1], [3.5, 1]);
  const enterOp = interpolate(frame - 40, [0, 10], [0, 0.35], { extrapolateLeft: "clamp" });

  /* float */
  const floatY = Math.sin(frame * 0.035) * 14;
  const floatX = Math.cos(frame * 0.022) * 6;

  return (
    <div
      style={{
        position: "absolute",
        right: 80,
        top: 140,
        width: 460,
        height: 780,
        zIndex: 2,
        transform: `scale(${enterScale}) translateX(${floatX}px) translateY(${floatY}px)`,
        opacity: enterOp,
        transformOrigin: "center bottom",
      }}
    >
      {/* main portrait (cartoonized) */}
      <Img src={staticFile("muya.png")} style={{ width: 460, height: 780, objectFit: 'contain' }} />

      {/* subtle scan lines on portrait */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(118,185,0,0.04) 2px,
            rgba(118,185,0,0.04) 4px
          )`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

/* ── HUD Panel ───────────────────────────────────────────── */

const HUDPanel: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const panelSpring = spring({
    frame: frame - 40,
    fps,
    config: { damping: 16, stiffness: 90, mass: 1.2 },
  });
  const x = interpolate(panelSpring, [0, 1], [-620, 90]);
  const op = interpolate(frame - 40, [0, 8], [0, 1], { extrapolateLeft: "clamp" });

  /* inner content reveal */
  const contentSpring = spring({
    frame: frame - 55,
    fps,
    config: { damping: 18, stiffness: 70 },
  });
  const contentX = interpolate(contentSpring, [0, 1], [-500, 0]);

  /* typewriter effect for bio lines */
  const bioLines = [
    "毕业于上海交通大学电子与信息工程系",
    "超过20年的世界五百强技术和管理工作经验",
    "技术狂热爱好者，新技术的坚定信仰者和推动者",
  ];
  const lineDelay = 4;

  /* blinking cursor */
  const blink = frame % 30 < 15;

  /* progress bar for "system initialization" */
  const prog = interpolate(frame - 40, [0, 60], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 550,
        width: 750,
        zIndex: 20,
        opacity: op,
      }}
    >
      {/* clip-path wrapper for cut corners */}
      <div
        style={{
          clipPath: "polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 28px 100%, 0 calc(100% - 28px))",
          background: DARK,
          border: `1px solid ${GREEN_30}`,
          boxShadow: `0 0 60px ${GREEN_10}, inset 0 0 40px rgba(118,185,0,0.03)`,
          position: "relative",
        }}
      >
        {/* corner accent brackets on panel */}
        <PanelCorner x={0} y={0} rotation={0} frame={frame} delay={50} />
        <PanelCorner x={412} y={0} rotation={90} frame={frame} delay={55} />
        <PanelCorner x={412} y={320} rotation={180} frame={frame} delay={60} />
        <PanelCorner x={0} y={320} rotation={270} frame={frame} delay={65} />

        {/* scan-line CRT overlay inside panel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(118,185,0,0.015) 3px, rgba(118,185,0,0.015) 6px)`,
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        <div style={{ padding: "32px 28px", position: "relative", zIndex: 2 }}>
          {/* animated top accent */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <div style={{ width: 40, height: 3, background: GREEN, boxShadow: `0 0 10px ${GREEN_60}` }} />
            <div style={{ width: 6, height: 6, background: GREEN, opacity: 0.6, transform: "rotate(45deg)" }} />
            <div
              style={{
                width: interpolate(frame - 45, [0, 20], [0, 100], { extrapolateLeft: "clamp" }),
                height: 1,
                background: `linear-gradient(90deg, ${GREEN}, transparent)`,
              }}
            />
          </div>

          {/* title with slide */}
          <div style={{ overflow: "hidden", marginBottom: 10 }}>
            <div
              style={{
                transform: `translateX(${contentX}px)`,
                fontFamily: "'Courier New', 'SF Mono', Consolas, monospace",
                fontSize: 26,
                fontWeight: 800,
                color: GREEN,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              技术极客 &amp; 公司创始人
              {blink && (
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 22,
                    background: GREEN,
                    marginLeft: 4,
                    verticalAlign: "middle",
                    opacity: 0.8,
                  }}
                />
              )}
            </div>
          </div>

          {/* system init bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ width: "100%", height: 2, background: "rgba(118,185,0,0.08)" }}>
              <div
                style={{
                  width: `${prog}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${GREEN}, ${GREEN_60})`,
                  boxShadow: `0 0 8px ${GREEN_40}`,
                }}
              />
            </div>
          </div>

          

          {/* bio lines with staggered reveal */}
          <div style={{ overflow: "hidden" }}>
            <div style={{ transform: `translateX(${contentX * 0.8}px)` }}>
              {bioLines.map((line, i) => {
                const visible = frame - (55 + i * lineDelay) > 0;
                const lineOp = interpolate(frame - (55 + i * lineDelay), [0, 5], [0, 1], { extrapolateLeft: "clamp" });
                return (
                  <div
                    key={i}
                    style={{
                      fontFamily: "'Courier New', 'SF Mono', Consolas, monospace",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.82)",
                      lineHeight: 1.9,
                      letterSpacing: i === 1 ? 1 : 0.5,
                      opacity: visible ? lineOp : 0,
                      whiteSpace: "pre",
                    }}
                  >
                    {line}
                  </div>
                );
              })}
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
};

const PanelCorner: React.FC<{
  x: number;
  y: number;
  rotation: number;
  frame: number;
  delay: number;
}> = ({ x, y, rotation, frame, delay }) => {
  const s = spring({ frame: frame - delay, fps: 30, config: { damping: 14, stiffness: 150 } });
  const len = interpolate(s, [0, 1], [0, 16], { extrapolateLeft: "clamp" });
  const op = interpolate(frame - delay, [0, 10], [0, 0.7], { extrapolateLeft: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: len,
        height: len,
        borderLeft: `2px solid ${GREEN}`,
        borderTop: `2px solid ${GREEN}`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: rotation === 90 || rotation === 180 ? "top right" : rotation === 180 || rotation === 270 ? "bottom right" : "top left",
        opacity: op,
        pointerEvents: "none",
      }}
    />
  );
};

/* ── Tech Rings (behind Muya) ──────────────────────────── */

const TechRings: React.FC<{ frame: number }> = ({ frame }) => {
  const cx = 1350;
  const cy = 540;
  const rings = [
    { r: 180, d: 20, g: 12, dir: 1, sw: 2.5, spd: 1.2, delay: 40 },
    { r: 240, d: 35, g: 8, dir: -1, sw: 1.5, spd: 0.8, delay: 48 },
    { r: 300, d: 16, g: 22, dir: 1, sw: 1, spd: 1.6, delay: 56 },
    { r: 360, d: 28, g: 14, dir: -1, sw: 0.8, spd: 0.5, delay: 64 },
    { r: 420, d: 10, g: 30, dir: 1, sw: 0.5, spd: 2.0, delay: 72 },
  ];

  return (
    <svg width={W} height={H} style={{ position: "absolute", top: 0, left: 0, zIndex: 5 }}>
      <defs>
        <filter id="ringGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {rings.map((ring, idx) => {
        const elapsed = Math.max(0, frame - ring.delay);
        const rot = (elapsed * ring.spd * 2) % 360 * ring.dir;
        const op = interpolate(frame - ring.delay, [0, 15], [0, 0.45], { extrapolateLeft: "clamp" });
        const pulse = 1 + Math.sin(frame * 0.08 + idx) * 0.08;
        const r = ring.r * pulse;
        const circ = 2 * Math.PI * r;
        const count = Math.floor(circ / (ring.d + ring.g));

        return (
          <g key={idx} transform={`rotate(${rot} ${cx} ${cy})`} opacity={op} filter={idx < 2 ? "url(#ringGlow)" : undefined}>
            {Array.from({ length: count }).map((_, i) => {
              const a = (i / count) * 360;
              const rad = (a * Math.PI) / 180;
              const seg = (ring.d / circ) * 360;
              const a2 = a + seg;
              const r1 = (a2 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={cx + r * Math.cos(rad)}
                  y1={cy + r * Math.sin(rad)}
                  x2={cx + r * Math.cos(r1)}
                  y2={cy + r * Math.sin(r1)}
                  stroke={GREEN}
                  strokeWidth={ring.sw}
                  strokeLinecap="round"
                  opacity={idx === 0 && i % 3 === 0 ? 1 : 0.6 + (i % 5 === 0 ? 0.4 : 0)}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

/* ── Scanner Lines ───────────────────────────────────────── */

const ScannerLines: React.FC<{ frame: number }> = ({ frame }) => {
  const x1 = interpolate(frame % 100, [0, 100], [-80, 2000]);
  const x2 = interpolate((frame + 50) % 130, [0, 130], [-80, 2000]);
  const y1 = interpolate(frame % 80, [0, 80], [0, 1080]);

  return (
    <>
      {/* vertical sweep 1 */}
      <div
        style={{
          position: "absolute",
          left: x1,
          top: 0,
          width: 2,
          height: H,
          background: `linear-gradient(to bottom, transparent, ${GREEN}, transparent)`,
          opacity: interpolate(frame, [0, 18], [0, 0.2], { extrapolateLeft: "clamp" }),
          boxShadow: `0 0 40px 8px ${GREEN_20}, 0 0 80px 16px ${GREEN_10}`,
          zIndex: 6,
        }}
      />
      {/* vertical sweep 2 (faster) */}
      <div
        style={{
          position: "absolute",
          left: x2,
          top: 0,
          width: 1,
          height: H,
          background: `linear-gradient(to bottom, transparent, ${GREEN_60}, transparent)`,
          opacity: interpolate(frame, [0, 18], [0, 0.12], { extrapolateLeft: "clamp" }),
          zIndex: 6,
        }}
      />
      {/* horizontal sweep */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: y1,
          width: W,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${GREEN_40}, transparent)`,
          opacity: 0.08,
          zIndex: 6,
        }}
      />
    </>
  );
};

/* ── Corner Brackets ─────────────────────────────────────── */

const CornerBrackets: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const brackets: Array<{ x: number; y: number; size: number; rot: number; delay: number }> = [
    { x: 50, y: 50, size: 70, rot: 0, delay: 18 },
    { x: 1850, y: 50, size: 70, rot: 90, delay: 22 },
    { x: 1850, y: 960, size: 70, rot: 180, delay: 26 },
    { x: 50, y: 960, size: 70, rot: 270, delay: 30 },
    { x: 620, y: 260, size: 30, rot: 0, delay: 35 },
    { x: 1270, y: 260, size: 30, rot: 90, delay: 37 },
    { x: 1270, y: 450, size: 30, rot: 180, delay: 39 },
    { x: 620, y: 450, size: 30, rot: 270, delay: 41 },
  ];

  return (
    <>
      {brackets.map((b, i) => {
        const s = spring({ frame: frame - b.delay, fps, config: { damping: 12, stiffness: 140 } });
        const sc = interpolate(s, [0, 1], [0.3, 1]);
        const op = interpolate(frame - b.delay, [0, 12], [0, 0.5], { extrapolateLeft: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              width: b.size,
              height: b.size,
              borderLeft: i < 4 ? `3px solid ${GREEN}` : `1.5px solid ${GREEN}`,
              borderTop: i < 4 ? `3px solid ${GREEN}` : `1.5px solid ${GREEN}`,
              transform: `scale(${sc}) rotate(${b.rot}deg)`,
              transformOrigin:
                b.rot === 0
                  ? "top left"
                  : b.rot === 90
                  ? "top right"
                  : b.rot === 180
                  ? "bottom right"
                  : "bottom left",
              opacity: op,
              zIndex: 8,
              boxShadow: i < 4 ? `0 0 15px ${GREEN_20}` : "none",
            }}
          />
        );
      })}
    </>
  );
};

/* ── Floating Particles ──────────────────────────────────── */

const Particles: React.FC<{ frame: number }> = ({ frame }) => {
  const particles = useMemo(
    () => [
      { x: 140, y: 180, s: 24, spd: 1.3, d: 50, t: "tri" },
      { x: 340, y: 760, s: 18, spd: 0.9, d: 60, t: "hex" },
      { x: 1680, y: 130, s: 20, spd: 1.6, d: 55, t: "tri" },
      { x: 1580, y: 840, s: 26, spd: 1.1, d: 65, t: "hex" },
      { x: 900, y: 80, s: 16, spd: 1.4, d: 70, t: "tri" },
      { x: 520, y: 480, s: 32, spd: 0.7, d: 45, t: "hex" },
      { x: 1420, y: 380, s: 22, spd: 1.2, d: 75, t: "tri" },
      { x: 220, y: 620, s: 28, spd: 0.85, d: 80, t: "hex" },
      { x: 1100, y: 200, s: 14, spd: 1.5, d: 52, t: "cross" },
      { x: 800, y: 750, s: 20, spd: 1.0, d: 68, t: "diamond" },
      { x: 400, y: 300, s: 12, spd: 1.8, d: 42, t: "tri" },
      { x: 1750, y: 600, s: 18, spd: 0.95, d: 58, t: "hex" },
    ],
    []
  );

  return (
    <svg width={W} height={H} style={{ position: "absolute", top: 0, left: 0, zIndex: 7, pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const e = Math.max(0, frame - p.d);
        const fy = Math.sin(e * p.spd * 0.04) * 18;
        const fx = Math.cos(e * p.spd * 0.025) * 10;
        const rot = (e * p.spd * 0.4) % 360;
        const op = interpolate(frame - p.d, [0, 15, 250, 300], [0, 0.35, 0.3, 0], { extrapolateLeft: "clamp" });

        let path = "";
        if (p.t === "tri") {
          path = `M${p.s / 2},0 L${p.s},${p.s} L0,${p.s} Z`;
        } else if (p.t === "hex") {
          const pts = [];
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k - Math.PI / 6;
            pts.push(`${p.s / 2 + (p.s / 2) * Math.cos(a)},${p.s / 2 + (p.s / 2) * Math.sin(a)}`);
          }
          path = `M${pts.join(" L")} Z`;
        } else if (p.t === "cross") {
          const w = p.s / 4;
          path = `M${p.s / 2 - w},0 L${p.s / 2 + w},0 L${p.s / 2 + w},${p.s / 2 - w} L${p.s},${p.s / 2 - w} L${p.s},${p.s / 2 + w} L${p.s / 2 + w},${p.s / 2 + w} L${p.s / 2 + w},${p.s} L${p.s / 2 - w},${p.s} L${p.s / 2 - w},${p.s / 2 + w} L0,${p.s / 2 + w} L0,${p.s / 2 - w} L${p.s / 2 - w},${p.s / 2 - w} Z`;
        } else if (p.t === "diamond") {
          path = `M${p.s / 2},0 L${p.s},${p.s / 2} L${p.s / 2},${p.s} L0,${p.s / 2} Z`;
        }

        return (
          <g key={i} transform={`translate(${p.x + fx},${p.y + fy}) rotate(${rot} ${p.s / 2} ${p.s / 2})`} opacity={op}>
            <path d={path} fill="none" stroke={GREEN} strokeWidth="1.2" />
          </g>
        );
      })}
    </svg>
  );
};

/* ── Cinematic Bars + Top/Bottom Accent ──────────────────── */

const CinematicBars: React.FC<{ frame: number }> = ({ frame }) => {
  const h = 60;
  const barOp = interpolate(frame, [0, 20], [0, 0.85], { extrapolateLeft: "clamp" });
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: W,
          height: h,
          background: `linear-gradient(to bottom, ${DARK}, transparent)`,
          opacity: barOp,
          zIndex: 25,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: W,
          height: h,
          background: `linear-gradient(to top, ${DARK}, transparent)`,
          opacity: barOp,
          zIndex: 25,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

const AccentLines: React.FC<{ frame: number }> = ({ frame }) => {
  const w1 = interpolate(frame, [0, 50], [0, W], { extrapolateLeft: "clamp" });
  const w2 = interpolate(frame, [10, 60], [0, W], { extrapolateLeft: "clamp" });
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: w1,
          height: 3,
          background: `linear-gradient(90deg, ${GREEN}, transparent)`,
          zIndex: 26,
          boxShadow: `0 0 20px ${GREEN_20}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: W - w2,
          width: w2,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${GREEN})`,
          zIndex: 26,
          boxShadow: `0 0 20px ${GREEN_20}`,
        }}
      />
    </>
  );
};

/* ── Frame Debug (subtle) ────────────────────────────────── */

const FrameDebug: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      position: "absolute",
      bottom: 18,
      right: 24,
      fontFamily: "monospace",
      fontSize: 10,
      color: GREEN,
      opacity: 0.25,
      zIndex: 30,
    }}
  >
    F:{String(frame).padStart(3, "0")} | 30FPS | 1920x1080
  </div>
);

/* ── Main Composition ────────────────────────────────────── */

export const CEOIntroduction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        width: W,
        height: H,
        backgroundColor: WHITE,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
      }}
    >
      {/* Layer 0: Background grid */}
      <PerspectiveGrid frame={frame} />

      {/* Layer 1: Vignette + noise */}
      <Vignette />
      <NoiseOverlay frame={frame} />

      {/* Layer 2: Cartoon background portrait (frame 40+) */}
      {frame >= 38 && <BackgroundPortrait frame={frame} fps={fps} />}

      {/* Layer 3: Tech rings */}
      <TechRings frame={frame} />

      {/* Layer 5: Scanner sweeps */}
      <ScannerLines frame={frame} />

      {/* Layer 6: Corner brackets */}
      <CornerBrackets frame={frame} fps={fps} />

      {/* Layer 7: Floating particles */}
      <Particles frame={frame} />

      {/* Layer 8: Title */}
      <TitleBlock frame={frame} fps={fps} />

      {/* Layer 9: HUD Panel (frame 40+) */}
      {frame >= 38 && <HUDPanel frame={frame} fps={fps} />}

      {/* Layer 10: Cinematic bars */}
      <CinematicBars frame={frame} />

      {/* Layer 11: Accent lines */}
      <AccentLines frame={frame} />

      {/* Layer 12: Frame counter */}
      <FrameDebug frame={frame} />
    </div>
  );
};
