import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Audio,
  Sequence,
} from "remotion";

const GREEN = "#76B900";
const GREEN_10 = "rgba(118, 185, 0, 0.10)";
const GREEN_20 = "rgba(118, 185, 0, 0.20)";
const GREEN_30 = "rgba(118, 185, 0, 0.30)";
const GREEN_40 = "rgba(118, 185, 0, 0.40)";
const GREEN_60 = "rgba(118, 185, 0, 0.60)";
const GREEN_80 = "rgba(118, 185, 0, 0.80)";
const DARK = "rgba(8, 14, 4, 0.95)";
const WHITE = "#ffffff";
const CODE_BG = "rgba(0, 0, 0, 0.82)";

const W = 1080;
const H = 1920;
const Cx = W / 2;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ═══════════════════════════════════════════════════════════
   ANIMATED BACKGROUND: Flowing Grid + Warped Perspective
   ═══════════════════════════════════════════════════════════ */

const AnimatedBG: React.FC<{ frame: number }> = ({ frame }) => {
  const offset = (frame * 0.8) % 60;
  const pulse = 1 + Math.sin(frame * 0.05) * 0.15;

  const linesH = [];
  for (let i = -2; i < 30; i++) {
    const y = i * 65 + offset;
    if (y < 0 || y > H) continue;
    const distFromCenter = Math.abs(y - H / 2) / (H / 2);
    const alpha = (1 - distFromCenter) * 0.12 * pulse;
    linesH.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={y}
        x2={W}
        y2={y}
        stroke={GREEN}
        strokeWidth={0.6 + alpha * 2}
        opacity={alpha}
      />
    );
  }

  const linesV = [];
  for (let i = -5; i < 20; i++) {
    const x = i * 60 + (frame * 0.25) % 60;
    if (x < 0 || x > W) continue;
    const alpha = 0.08 * pulse;
    linesV.push(
      <line
        key={`v${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2={H}
        stroke={GREEN}
        strokeWidth={0.4}
        opacity={alpha}
      />
    );
  }

  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="rgba(118,185,0,0.03)" />
          <stop offset="50%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="#050a02" />
      <rect width={W} height={H} fill="url(#bgGrad)" opacity={pulse} />
      {linesH}
      {linesV}
    </svg>
  );
};

/* ── Vignette with animated corners ── */
const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.5) 100%)",
      pointerEvents: "none",
      zIndex: 2,
    }}
  />
);

/* ═══════════════════════════════════════════════════════════
   PARTICLE EXPLOSION: Burst on step transitions
   ═══════════════════════════════════════════════════════════ */

const ParticleBurst: React.FC<{ frame: number; cx: number; cy: number; seed: number }> = ({
  frame, cx, cy, seed,
}) => {
  const count = 24;
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + seededRandom(seed + i) * 0.5;
      const speed = 2 + seededRandom(seed + i * 3) * 4;
      const size = 2 + seededRandom(seed + i * 7) * 4;
      return { angle, speed, size };
    });
  }, [seed]);

  return (
    <svg width={W} height={H} style={{ position: "absolute", top: 0, left: 0, zIndex: 4, pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const dist = frame * p.speed;
        const x = cx + Math.cos(p.angle) * dist;
        const y = cy + Math.sin(p.angle) * dist;
        const op = interpolate(frame, [0, 5, 30, 45], [1, 1, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={p.size}
            fill={GREEN}
            opacity={op}
          />
        );
      })}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════
   FLOATING ORBS: Slow-moving background decorations
   ═══════════════════════════════════════════════════════════ */

const FloatingOrbs: React.FC<{ frame: number }> = ({ frame }) => {
  const orbs = useMemo(
    () => [
      { x: 150, y: 400, r: 80, spd: 0.6, phase: 0 },
      { x: 900, y: 800, r: 120, spd: 0.4, phase: 2 },
      { x: 200, y: 1400, r: 60, spd: 0.8, phase: 4 },
      { x: 850, y: 1700, r: 100, spd: 0.5, phase: 1 },
      { x: 500, y: 600, r: 50, spd: 0.7, phase: 3 },
    ],
    []
  );

  return (
    <svg width={W} height={H} style={{ position: "absolute", top: 0, left: 0, zIndex: 1, pointerEvents: "none" }}>
      {orbs.map((o, i) => {
        const ox = o.x + Math.sin(frame * 0.008 + o.phase) * 30;
        const oy = o.y + Math.cos(frame * 0.006 + o.phase) * 40;
        const pulse = 1 + Math.sin(frame * 0.03 + o.phase) * 0.2;
        return (
          <circle
            key={i}
            cx={ox}
            cy={oy}
            r={o.r * pulse}
            fill={GREEN}
            opacity={0.04}
            filter="url(#orbBlur)"
          />
        );
      })}
      <defs>
        <filter id="orbBlur">
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════
   3D FLIP TITLE: Dramatic entrance for main titles
   ═══════════════════════════════════════════════════════════ */

const FlipTitle: React.FC<{
  frame: number;
  fps: number;
  lines: string[];
  top: number;
  fontSize: number;
  delay?: number;
}> = ({ frame, fps, lines, top, fontSize, delay = 0 }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 120, mass: 1.2 } });
  const rotateX = interpolate(s, [0, 0.4, 1], [90, -10, 0]);
  const scale = interpolate(s, [0, 0.5, 1], [0.6, 1.05, 1]);
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: "clamp" });
  const glowPulse = 0.3 + Math.sin(frame * 0.08) * 0.15;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        width: W,
        textAlign: "center",
        zIndex: 20,
        opacity,
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) scale(${scale})`,
          transformOrigin: "center center",
          transformStyle: "preserve-3d",
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
              fontSize,
              color: i === 0 ? GREEN : WHITE,
              letterSpacing: 4,
              textShadow: i === 0
                ? `0 0 40px ${GREEN_40}, 0 0 80px ${GREEN_20}, 0 0 120px ${GREEN_10}`
                : `0 0 30px rgba(255,255,255,${glowPulse}), 0 0 60px rgba(255,255,255,${glowPulse * 0.5})`,
              lineHeight: 1.3,
              marginTop: i > 0 ? 12 : 0,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   NEON BREATHING TEXT: Pulsing glow effect
   ═══════════════════════════════════════════════════════════ */

const NeonText: React.FC<{
  frame: number;
  text: string;
  top: number;
  fontSize: number;
  color?: string;
  delay?: number;
}> = ({ frame, text, top, fontSize, color = GREEN, delay = 0 }) => {
  const op = interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: "clamp" });
  const breathe = 0.4 + Math.sin(frame * 0.06 + delay) * 0.25;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        width: W,
        textAlign: "center",
        zIndex: 20,
        opacity: op,
      }}
    >
      <span
        style={{
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize,
          fontWeight: 700,
          color,
          letterSpacing: 3,
          textShadow: `0 0 20px ${color}${Math.round(breathe * 255).toString(16).padStart(2, "0")}, 0 0 40px ${color}40`,
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CODE BLOCK WITH SCAN SHINE: Typewriter + light sweep
   ═══════════════════════════════════════════════════════════ */

const FancyCodeBlock: React.FC<{
  frame: number;
  fps: number;
  code: string;
  top: number;
  delay?: number;
  shineColor?: string;
}> = ({ frame, fps, code, top, delay = 0, shineColor = GREEN }) => {
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const yOff = interpolate(enter, [0, 1], [50, 0]);
  const op = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp" });

  // Scan shine effect
  const shineX = interpolate((frame - delay) % 80, [0, 40, 80], [-200, W + 200, W + 200]);
  const shineOp = interpolate((frame - delay) % 80, [0, 20, 40, 60, 80], [0, 0.3, 0, 0, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 60,
        right: 60,
        zIndex: 20,
        opacity: op,
        transform: `translateY(${yOff}px)`,
      }}
    >
      <div
        style={{
          background: CODE_BG,
          border: `1px solid ${GREEN_30}`,
          borderRadius: 16,
          padding: "28px 32px",
          boxShadow: `0 0 50px ${GREEN_10}, inset 0 0 30px rgba(118,185,0,0.03)`,
          fontFamily: "'SF Mono', 'Courier New', Consolas, monospace",
          fontSize: 22,
          lineHeight: 1.7,
          color: WHITE,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Scan shine overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: shineX,
            width: 120,
            height: "100%",
            background: `linear-gradient(90deg, transparent, ${shineColor}30, transparent)`,
            opacity: shineOp,
            pointerEvents: "none",
          }}
        />
        {/* CRT scan lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(118,185,0,0.02) 3px, rgba(118,185,0,0.02) 6px)`,
            pointerEvents: "none",
            borderRadius: 16,
          }}
        />
        {/* Typewriter text */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {code.split("").map((ch, i) => {
            const chFrame = frame - delay - i * 0.4;
            const chOp = interpolate(chFrame, [0, 4], [0, 1], { extrapolateLeft: "clamp" });
            const isKeyword = /[{}()<>="'/\[\]]/.test(ch) ||
              ["npm", "install", "import", "from", "const", "export", "return", "function", "prompt", "Agent", "Claude"].some(
                (kw) => code.substring(i, i + kw.length) === kw
              );
            const isString = code.substring(0, i).split('"').length % 2 === 0 && ch !== '"';
            const isComment = code.substring(0, i).includes("//") && !code.substring(0, i).split("\n").pop()?.includes("//");

            let chColor = WHITE;
            if (isKeyword && !isString) chColor = GREEN;
            if (isString) chColor = "#ffaa44";
            if (isComment) chColor = "#888888";

            return (
              <span
                key={i}
                style={{
                  color: chColor,
                  opacity: chOp,
                  textShadow: chOp > 0.8 && isKeyword ? `0 0 8px ${GREEN_40}` : "none",
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            );
          })}
          {/* Blinking cursor */}
          {frame > delay + code.length * 0.4 && (
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 24,
                background: GREEN,
                marginLeft: 4,
                verticalAlign: "middle",
                opacity: frame % 30 < 15 ? 1 : 0.3,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   WAVE TEXT: Characters wave in with staggered Y offset
   ═══════════════════════════════════════════════════════════ */

const WaveText: React.FC<{
  frame: number;
  text: string;
  top: number;
  fontSize: number;
  delay?: number;
}> = ({ frame, text, top, fontSize, delay = 0 }) => {
  const op = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        width: W,
        textAlign: "center",
        zIndex: 20,
        opacity: op,
      }}
    >
      <div style={{ display: "inline-flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
        {text.split("").map((ch, i) => {
          const chEnter = interpolate(frame - delay - i * 1.5, [0, 8], [0, 1], { extrapolateLeft: "clamp" });
          const waveY = Math.sin(frame * 0.08 + i * 0.4) * 6 * chEnter;
          return (
            <span
              key={i}
              style={{
                fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
                fontSize,
                fontWeight: 600,
                color: WHITE,
                display: "inline-block",
                transform: `translateY(${waveY}px)`,
                opacity: chEnter,
                textShadow: `0 0 20px ${GREEN_30}`,
                lineHeight: 1.5,
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   STEP INDICATOR: Animated progress ring + step pills
   ═══════════════════════════════════════════════════════════ */

const StepIndicator: React.FC<{
  frame: number;
  totalSteps: number;
  currentStep: number;
}> = ({ frame, totalSteps, currentStep }) => {
  const gap = 18;
  const startX = Cx - ((totalSteps - 1) * gap) / 2;

  return (
    <div style={{ position: "absolute", top: 130, left: 0, width: W, textAlign: "center", zIndex: 30 }}>
      <div style={{ display: "inline-flex", gap: 14, alignItems: "center" }}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isActive = i === currentStep;
          const isPast = i < currentStep;
          const activeSpring = spring({
            frame: isActive ? frame : 0,
            fps: 30,
            config: { damping: 12, stiffness: 200 },
          });
          const activeScale = isActive ? interpolate(activeSpring, [0, 1], [1.4, 1.2]) : 1;
          const activePulse = isActive ? 0.6 + Math.sin(frame * 0.1) * 0.4 : 0;

          return (
            <div key={i} style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: isActive ? 16 : 10,
                  height: isActive ? 16 : 10,
                  borderRadius: "50%",
                  background: isPast || isActive ? GREEN : "rgba(255,255,255,0.2)",
                  transform: `scale(${activeScale})`,
                  boxShadow: isActive ? `0 0 20px ${GREEN_60}, 0 0 40px ${GREEN_30}` : "none",
                  transition: "none",
                }}
              />
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: -8,
                    left: -8,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: `2px solid ${GREEN}`,
                    opacity: activePulse,
                    transform: `scale(${1 + activePulse * 0.3})`,
                    transition: "none",
                  }}
                />
              )}
              {i < totalSteps - 1 && (
                <div
                  style={{
                    width: gap - 4,
                    height: 2,
                    background: isPast ? GREEN : "rgba(255,255,255,0.15)",
                    marginLeft: 8,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SUBTITLE: Glassmorphism bottom overlay
   ═══════════════════════════════════════════════════════════ */

const Subtitle: React.FC<{
  frame: number;
  text: string;
  startFrame: number;
  endFrame: number;
}> = ({ frame, text, startFrame, endFrame }) => {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + 12, endFrame - 12, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 100,
        left: 50,
        right: 50,
        zIndex: 50,
        opacity: progress,
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "18px 28px",
          borderRadius: 16,
          border: `1px solid ${GREEN_20}`,
          display: "inline-block",
          maxWidth: "100%",
          boxShadow: `0 0 30px ${GREEN_10}`,
        }}
      >
        <span
          style={{
            fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
            fontSize: 30,
            fontWeight: 600,
            color: WHITE,
            lineHeight: 1.5,
            textShadow: `0 0 15px ${GREEN_30}`,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CONNECTING LINES: Animated SVG paths between elements
   ═══════════════════════════════════════════════════════════ */

const ConnectingLines: React.FC<{ frame: number; paths: Array<{ from: [number, number]; to: [number, number]; delay: number }> }> = ({ frame, paths }) => {
  return (
    <svg width={W} height={H} style={{ position: "absolute", top: 0, left: 0, zIndex: 5, pointerEvents: "none" }}>
      {paths.map((p, i) => {
        const d = `M${p.from[0]},${p.from[1]} L${p.to[0]},${p.to[1]}`;
        const len = Math.sqrt((p.to[0] - p.from[0]) ** 2 + (p.to[1] - p.from[1]) ** 2);
        const progress = interpolate(frame - p.delay, [0, 20], [0, len], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const op = interpolate(frame - p.delay, [0, 10, 30, 50], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp" });

        return (
          <line
            key={i}
            x1={p.from[0]}
            y1={p.from[1]}
            x2={p.to[0]}
            y2={p.to[1]}
            stroke={GREEN}
            strokeWidth={1.5}
            opacity={op}
            strokeDasharray={`${progress} ${len}`}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAGNETIC CARD: 3D tilt card that follows mouse-like motion
   ═══════════════════════════════════════════════════════════ */

const MagneticCard: React.FC<{
  frame: number;
  fps: number;
  top: number;
  delay?: number;
  children: React.ReactNode;
}> = ({ frame, fps, top, delay = 0, children }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 100 } });
  const yOff = interpolate(s, [0, 1], [60, 0]);
  const op = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp" });

  // Subtle 3D tilt based on frame (simulated mouse)
  const tiltX = Math.sin(frame * 0.015) * 3;
  const tiltY = Math.cos(frame * 0.012) * 2;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 70,
        right: 70,
        zIndex: 20,
        opacity: op,
        transform: `translateY(${yOff}px) perspective(800px) rotateX(${tiltY}deg) rotateY(${tiltX}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        style={{
          background: "rgba(12, 18, 8, 0.85)",
          border: `1px solid ${GREEN_30}`,
          borderRadius: 20,
          padding: "32px 36px",
          boxShadow: `0 20px 60px ${GREEN_10}, 0 0 40px ${GREEN_10}, inset 0 0 30px rgba(118,185,0,0.03)`,
          backdropFilter: "blur(10px)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CORNER ACCENTS: Animated bracket corners
   ═══════════════════════════════════════════════════════════ */

const FancyCorners: React.FC<{ frame: number }> = ({ frame }) => {
  const corners = [
    { x: 30, y: 30, w: 60, h: 60 },
    { x: W - 90, y: 30, w: 60, h: 60 },
    { x: W - 90, y: H - 90, w: 60, h: 60 },
    { x: 30, y: H - 90, w: 60, h: 60 },
  ];

  return (
    <svg width={W} height={H} style={{ position: "absolute", top: 0, left: 0, zIndex: 8, pointerEvents: "none" }}>
      {corners.map((c, i) => {
        const s = spring({ frame: frame - 8 - i * 4, fps: 30, config: { damping: 14, stiffness: 160 } });
        const len = interpolate(s, [0, 1], [0, 24], { extrapolateLeft: "clamp" });
        const op = interpolate(frame - 8 - i * 4, [0, 12], [0, 0.7], { extrapolateLeft: "clamp" });

        const d = i === 0
          ? `M${c.x},${c.y + len} L${c.x},${c.y} L${c.x + len},${c.y}`
          : i === 1
          ? `M${c.x + c.w - len},${c.y} L${c.x + c.w},${c.y} L${c.x + c.w},${c.y + len}`
          : i === 2
          ? `M${c.x + c.w},${c.y + c.h - len} L${c.x + c.w},${c.y + c.h} L${c.x + c.w - len},${c.y + c.h}`
          : `M${c.x + len},${c.y + c.h} L${c.x},${c.y + c.h} L${c.x},${c.y + c.h - len}`;

        return (
          <path
            key={i}
            d={d}
            stroke={GREEN}
            strokeWidth={2.5}
            fill="none"
            opacity={op}
            filter="url(#cornerGlow)"
          />
        );
      })}
      <defs>
        <filter id="cornerGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════
   SIDE ACCENT BARS: Vertical animated bars
   ═══════════════════════════════════════════════════════════ */

const SideAccentBars: React.FC<{ frame: number }> = ({ frame }) => {
  const h1 = interpolate(frame, [0, 50], [0, H], { extrapolateLeft: "clamp" });
  const h2 = interpolate(frame, [20, 70], [0, H], { extrapolateLeft: "clamp" });
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 16,
          width: 2,
          height: h1,
          background: `linear-gradient(to bottom, ${GREEN}, transparent)`,
          zIndex: 26,
          opacity: 0.5,
          boxShadow: `0 0 15px ${GREEN_30}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 16,
          width: 2,
          height: h2,
          background: `linear-gradient(to top, ${GREEN}, transparent)`,
          zIndex: 26,
          opacity: 0.5,
          boxShadow: `0 0 15px ${GREEN_30}`,
        }}
      />
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   PROMPT SHOWCASE: Special card showing the actual prompt
   ═══════════════════════════════════════════════════════════ */

const PromptShowcase: React.FC<{
  frame: number;
  fps: number;
  delay?: number;
}> = ({ frame, fps, delay = 0 }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 90 } });
  const yOff = interpolate(s, [0, 1], [40, 0]);
  const op = interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: "clamp" });
  const breathe = 0.5 + Math.sin(frame * 0.05) * 0.3;

  const promptText = `用 Remotion 做一个科技感 CEO 介绍视频。
尺寸 1080x1920，绿色主题。
包含：透视网格背景、人物照片、
动态标题动画、HUD 数据面板、
浮动粒子、扫描线特效。
照片放在 public/jensen.png，
文字用"JENSEN HUANG"，
风格参考黑客帝国 + 科幻电影。`;

  return (
    <div
      style={{
        position: "absolute",
        top: 480,
        left: 70,
        right: 70,
        zIndex: 20,
        opacity: op,
        transform: `translateY(${yOff}px)`,
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(118,185,0,0.08) 0%, rgba(0,0,0,0.7) 100%)",
          border: `1px solid ${GREEN_40}`,
          borderRadius: 20,
          padding: "28px 32px",
          boxShadow: `0 0 50px ${GREEN_20}, inset 0 0 40px rgba(118,185,0,0.04)`,
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 24,
          lineHeight: 1.8,
          color: WHITE,
          whiteSpace: "pre-wrap",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated border glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            border: `2px solid ${GREEN}${Math.round(breathe * 255).toString(16).padStart(2, "0")}`,
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 14,
              color: GREEN_60,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            SYSTEM PROMPT // AGENT INPUT
          </div>
          {promptText.split("").map((ch, i) => {
            const chOp = interpolate(frame - delay - 15 - i * 0.35, [0, 3], [0, 1], { extrapolateLeft: "clamp" });
            return (
              <span key={i} style={{ opacity: chOp }}>
                {ch}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   STEP DEFINITIONS
   ═══════════════════════════════════════════════════════════ */

const STEPS = [
  {
    name: "安装 Agent",
    code: `npm install -g @anthropic-ai/claude-code
# 或使用 Devin
devin login`,
    voice: "agent_voice_step1.wav",
    subtitle: "第一步，安装 AI 代码 Agent。Claude Code 是首选，在终端运行命令安装即可。你也可以用 Devin、Cursor Agent 或 Windsurf。选择一个你顺手的工具。",
    duration: 336,
  },
  {
    name: "准备素材",
    code: `mkdir public
cp myphoto.png public/photo.png
# 文案写入 prompt.txt`,
    voice: "agent_voice_step2.wav",
    subtitle: "第二步，准备素材。只需要一张人物照片，和一段你想展示的文字介绍。照片建议用纯色背景或透明背景，效果最佳。",
    duration: 307,
  },
  {
    name: "编写 Prompt",
    code: `// 不用写代码！
// 直接用自然语言告诉 Agent：
// "用 Remotion 做一个科技感视频
// 尺寸 1080x1920，绿色主题
// 包含透视网格、人物照片、
// 动态标题、HUD 面板、粒子特效"`,
    voice: "agent_voice_step3.wav",
    subtitle: "第三步，写 Prompt 给 Agent。Prompt 越详细，效果越好。告诉它你的视频尺寸、画面风格、动画需求，以及素材路径。Agent 会自动安装 Remotion，编写 React 组件，添加特效和动画。",
    duration: 484,
    isPrompt: true,
  },
  {
    name: "AI 自动生成",
    code: `# Agent 会自动执行：
# 1. npm install remotion
# 2. 创建 src/CEOIntroduction.tsx
# 3. 添加动画、特效、样式
# 4. 设置 Composition 参数
# 你只需等待 2-3 分钟...`,
    voice: "agent_voice_step4.wav",
    subtitle: "第四步，AI 自动编写代码。Agent 会分析你的需求，生成完整的 Remotion 项目结构，包括组件文件、动画逻辑、样式特效。你只需等待几分钟，代码就全部写好了。",
    duration: 422,
  },
  {
    name: "预览导出",
    code: `npx remotion studio      # 实时预览
npx remotion render \
  src/index.ts \
  CEOIntroduction \
  out/video.mp4`,
    voice: "agent_voice_step5.wav",
    subtitle: "第五步，预览和导出。运行 npx remotion studio，实时预览每一帧效果。不满意就告诉 Agent 修改，比如颜色太淡、动画太快。满意后直接渲染导出 MP4，一条命令搞定。",
    duration: 532,
  },
];

/* ═══════════════════════════════════════════════════════════
   INTRO SEQUENCE
   ═══════════════════════════════════════════════════════════ */

const IntroSequence: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  return (
    <>
      <FlipTitle
        frame={frame}
        fps={fps}
        lines={["AI AGENT", "自动生成视频"]}
        top={560}
        fontSize={68}
      />
      <NeonText
        frame={frame}
        text="Claude Code / Devin / Cursor"
        top={860}
        fontSize={28}
        delay={25}
      />
      <WaveText
        frame={frame}
        text="零代码  全自动  专业级输出"
        top={940}
        fontSize={30}
        delay={40}
      />
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   OUTRO SEQUENCE
   ═══════════════════════════════════════════════════════════ */

const OutroSequence: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const s = spring({ frame, fps, config: { damping: 10, stiffness: 150 } });
  const op = interpolate(s, [0, 1], [0, 1]);
  const yOff = interpolate(s, [0, 1], [40, 0]);
  const breathe = 0.4 + Math.sin(frame * 0.08) * 0.25;

  return (
    <div
      style={{
        position: "absolute",
        top: 680,
        left: 0,
        width: W,
        textAlign: "center",
        zIndex: 20,
        opacity: op,
        transform: `translateY(${yOff}px)`,
      }}
    >
      <div
        style={{
          fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
          fontSize: 64,
          color: GREEN,
          textShadow: `0 0 60px ${GREEN_40}, 0 0 100px ${GREEN_20}`,
          lineHeight: 1.3,
        }}
      >
        开始创造吧！
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 26,
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.6,
        }}
      >
        描述你的想法，AI 帮你实现
      </div>
      <div
        style={{
          marginTop: 60,
          fontFamily: "'SF Mono', monospace",
          fontSize: 18,
          color: GREEN_60,
          letterSpacing: 2,
          textShadow: `0 0 20px ${GREEN_20}`,
          opacity: breathe,
        }}
      >
        PROMPT → CODE → VIDEO
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPOSITION
   ═══════════════════════════════════════════════════════════ */

export const AgentTutorialVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introFrames = 303; // 283 audio frames + 20 buffer
  let currentFrame = introFrames;
  const stepFrames: Array<{
    from: number;
    to: number;
    config: typeof STEPS[0];
    index: number;
  }> = [];

  for (let i = 0; i < STEPS.length; i++) {
    const config = STEPS[i];
    const from = currentFrame;
    const to = currentFrame + config.duration + 30; // +30 for transition
    stepFrames.push({ from, to, config, index: i });
    currentFrame = to;
  }

  const outroFrom = currentFrame;
  const outroTo = outroFrom + 346; // 326 frames audio + 20 buffer

  const isIntro = frame < introFrames;
  const isOutro = frame >= outroFrom && frame < outroTo;
  const activeStepIndex = stepFrames.findIndex(
    ({ from, to }) => frame >= from && frame < to
  );

  // Particle bursts at step transitions
  const showBurst = stepFrames.some(
    ({ from }) => frame >= from && frame < from + 45
  );
  const burstCenter = activeStepIndex >= 0
    ? [Cx, 600] as [number, number]
    : [Cx, H / 2] as [number, number];

  return (
    <div
      style={{
        width: W,
        height: H,
        background: "#040802",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Layer 0: Animated background */}
      <AnimatedBG frame={frame} />
      <FloatingOrbs frame={frame} />
      <Vignette />

      {/* Layer 1: Connecting lines (only during steps) */}
      {!isIntro && !isOutro && activeStepIndex >= 0 && (
        <ConnectingLines
          frame={frame - stepFrames[activeStepIndex].from}
          paths={[
            { from: [100, 350], to: [Cx - 80, 480], delay: 15 },
            { from: [W - 100, 350], to: [Cx + 80, 480], delay: 20 },
            { from: [Cx, 820], to: [Cx, 960], delay: 40 },
          ]}
        />
      )}

      {/* Layer 2: Particle burst on transitions */}
      {showBurst && (
        <ParticleBurst
          frame={frame % 45}
          cx={burstCenter[0]}
          cy={burstCenter[1]}
          seed={activeStepIndex}
        />
      )}

      {/* Layer 3: Decorative corners and accents */}
      <FancyCorners frame={frame} />
      <SideAccentBars frame={frame} />

      {/* Layer 4: Intro */}
      {isIntro && (
        <>
          <IntroSequence frame={frame} fps={fps} />
          <Audio src={staticFile("agent_voice_intro.wav")} />
        </>
      )}

      {/* Layer 5: Step indicator */}
      {!isIntro && !isOutro && (
        <StepIndicator
          frame={frame}
          totalSteps={STEPS.length}
          currentStep={activeStepIndex}
        />
      )}

      {/* Layer 6: Steps */}
      {stepFrames.map(({ from, to, config, index }) => (
        <Sequence key={index} from={from} durationInFrames={to - from}>
          <FlipTitle
            frame={frame - from}
            fps={fps}
            lines={[`STEP 0${index + 1}`, config.name]}
            top={220}
            fontSize={52}
          />
          <Audio src={staticFile(config.voice)} />
          <Subtitle
            frame={frame}
            text={config.subtitle}
            startFrame={from + 15}
            endFrame={to - 15}
          />
          {config.isPrompt ? (
            <PromptShowcase frame={frame - from} fps={fps} delay={30} />
          ) : (
            <FancyCodeBlock
              frame={frame - from}
              fps={fps}
              code={config.code}
              top={420}
              delay={25}
            />
          )}
        </Sequence>
      ))}

      {/* Layer 7: Outro */}
      {isOutro && (
        <Sequence from={outroFrom} durationInFrames={346}>
          <OutroSequence frame={frame - outroFrom} fps={fps} />
          <Audio src={staticFile("agent_voice_outro.wav")} />
        </Sequence>
      )}
    </div>
  );
};
