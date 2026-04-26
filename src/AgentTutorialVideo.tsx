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
const Cy = H / 2;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const seededRandomRange = (seed: number, min: number, max: number) =>
  min + seededRandom(seed) * (max - min);

/* ═══════════════════════════════════════════════════════════
   GLITCH TITLE: Chromatic aberration + slice shifts + flash
   ═══════════════════════════════════════════════════════════ */

const GlitchTitle: React.FC<{
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

  // Glitch cycle
  const gCycle = (frame - delay) % 55;
  const isG = gCycle > 42 && gCycle < 50;
  const gIntensity = isG ? interpolate(gCycle, [42, 45, 48, 50], [0, 1, 0.8, 0]) : 0;
  const rgbShift = isG ? 6 * gIntensity : 0;
  const sliceOffset = isG ? Math.sin(frame * 1.5) * 12 * gIntensity : 0;
  const skewAmt = isG ? interpolate(gCycle, [42, 46, 50], [0, 12, 0]) : 0;
  const flashBright = isG ? interpolate(gCycle, [42, 44, 46, 48], [0, 0.2, 0.1, 0]) : 0;

  const text = lines.join("\n");

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
          transform: `rotateX(${rotateX}deg) scale(${scale}) skewX(${skewAmt}deg)`,
          transformOrigin: "center center",
          transformStyle: "preserve-3d",
          position: "relative",
        }}
      >
        {/* Red channel offset */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${rgbShift}px)`,
            mixBlendMode: "screen",
            opacity: gIntensity * 0.5,
          }}
        >
          <span
            style={{
              fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
              fontSize,
              color: "#ff0040",
              letterSpacing: 4,
              lineHeight: 1.3,
              whiteSpace: "pre-line",
            }}
          >
            {text}
          </span>
        </div>
        {/* Cyan channel offset */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${-rgbShift}px)`,
            mixBlendMode: "screen",
            opacity: gIntensity * 0.5,
          }}
        >
          <span
            style={{
              fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
              fontSize,
              color: "#00ffff",
              letterSpacing: 4,
              lineHeight: 1.3,
              whiteSpace: "pre-line",
            }}
          >
            {text}
          </span>
        </div>

        {/* Main title */}
        <div>
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
                  : `0 0 30px rgba(255,255,255,0.4), 0 0 60px rgba(255,255,255,0.2)`,
                lineHeight: 1.3,
                marginTop: i > 0 ? 12 : 0,
              }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Horizontal slice glitch */}
        {isG && (
          <div
            style={{
              position: "absolute",
              top: `${35 + (frame % 4) * 15}%`,
              left: 0,
              width: "100%",
              height: 3 + gIntensity * 16,
              background: GREEN,
              opacity: 0.4 * gIntensity,
              transform: `translateX(${sliceOffset}px)`,
              mixBlendMode: "overlay",
            }}
          />
        )}

        {/* Flash overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: WHITE,
            opacity: flashBright,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   VISIBLE MATRIX RAIN: Green falling characters (dark bg)
   ═══════════════════════════════════════════════════════════ */

const matrixPool = "01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEF<>{}[]=+-*;:\\/|~";

const MatrixRainDark: React.FC<{ frame: number }> = ({ frame }) => {
  const columns = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      x: 40 + i * 58,
      speed: 1.8 + seededRandom(i * 7) * 2.5,
      size: 14 + Math.floor(seededRandom(i * 13) * 6),
      seed: i * 31,
    }));
  }, []);

  return (
    <>
      {columns.map((col, idx) => {
        const rows = 50;
        const colH = rows * col.size;
        const off = (frame * col.speed * 0.7) % colH;
        const baseOp = 0.12 + (idx % 3) * 0.06;

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: col.x,
              top: -off,
              width: col.size + 4,
              height: H + colH,
              overflow: "hidden",
              opacity: baseOp,
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            {Array.from({ length: rows + 10 }).map((_, i) => {
              const charIdx = Math.floor(seededRandom(frame + i + col.seed + idx * 50) * 100) % matrixPool.length;
              const isHead = i === Math.floor((rows * 0.25 + frame * 0.04) % rows);
              return (
                <div
                  key={i}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: col.size,
                    color: isHead ? GREEN : GREEN_60,
                    lineHeight: `${col.size}px`,
                    opacity: isHead
                      ? 1
                      : interpolate(i, [0, rows * 0.2, rows * 0.5, rows], [0.15, 0.8, 0.35, 0.04]),
                    textShadow: isHead ? `0 0 12px ${GREEN_60}` : "none",
                    transition: "none",
                  }}
                >
                  {matrixPool[charIdx]}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   HOLOGRAPHIC CODE BLOCK: Chromatic aberration + scan lines
   ═══════════════════════════════════════════════════════════ */

const HolographicCodeBlock: React.FC<{
  frame: number;
  fps: number;
  code: string;
  top: number;
  delay?: number;
}> = ({ frame, fps, code, top, delay = 0 }) => {
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const yOff = interpolate(enter, [0, 1], [50, 0]);
  const op = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp" });

  // Scan shine
  const shineX = interpolate((frame - delay) % 90, [0, 45, 90], [-200, W + 200, W + 200]);
  const shineOp = interpolate((frame - delay) % 90, [0, 22, 45, 67, 90], [0, 0.4, 0, 0, 0], {
    extrapolateRight: "clamp",
  });

  // Holographic glitch
  const hGlitch = (frame - delay) % 60 > 52 ? 1 : 0;
  const hShift = hGlitch ? Math.sin(frame * 2) * 3 : 0;
  const hOp = hGlitch ? 0.3 : 0;

  // Floating scan line
  const scanY = ((frame - delay) * 1.2) % 200;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 60,
        right: 60,
        zIndex: 20,
        opacity: op,
        transform: `translateY(${yOff}px) translateX(${hShift}px)`,
      }}
    >
      {/* Red holographic channel */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: "translateX(2px)",
          mixBlendMode: "screen",
          opacity: hOp,
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: CODE_BG,
            border: `1px solid ${GREEN_30}`,
            borderRadius: 16,
            padding: "28px 32px",
            fontFamily: "'SF Mono', 'Courier New', Consolas, monospace",
            fontSize: 22,
            lineHeight: 1.7,
            color: "#ff0040",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {code}
        </div>
      </div>

      {/* Main code block */}
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
        {/* Scan shine */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: shineX,
            width: 120,
            height: "100%",
            background: `linear-gradient(90deg, transparent, ${GREEN}50, transparent)`,
            opacity: shineOp,
            pointerEvents: "none",
          }}
        />
        {/* CRT scan lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(118,185,0,0.025) 3px, rgba(118,185,0,0.025) 6px)`,
            pointerEvents: "none",
            borderRadius: 16,
          }}
        />
        {/* Floating holographic scan line */}
        <div
          style={{
            position: "absolute",
            top: scanY,
            left: 0,
            width: "100%",
            height: 2,
            background: `linear-gradient(90deg, transparent, ${GREEN_60}, transparent)`,
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />
        {/* Typewriter text */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {code.split("").map((ch, i) => {
            const chFrame = frame - delay - i * 0.4;
            const chOp = interpolate(chFrame, [0, 3], [0, 1], { extrapolateLeft: "clamp" });
            const isKeyword = /[{}()<>="'/\[\]]/.test(ch) ||
              ["npm", "install", "import", "from", "const", "export", "return", "function", "prompt", "Agent", "Claude"].some(
                (kw) => code.substring(i, i + kw.length) === kw
              );
            const isString = code.substring(0, i).split('"').length % 2 === 0 && ch !== '"';

            let chColor = WHITE;
            if (isKeyword && !isString) chColor = GREEN;
            if (isString) chColor = "#ffaa44";

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
   KINETIC SUBTITLE: Blur + scale + slide dramatic entrance
   ═══════════════════════════════════════════════════════════ */

const KineticSubtitle: React.FC<{
  frame: number;
  text: string;
  startFrame: number;
  endFrame: number;
}> = ({ frame, text, startFrame, endFrame }) => {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + 15, endFrame - 15, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const enterProgress = interpolate(frame, [startFrame, startFrame + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blur = interpolate(enterProgress, [0, 1], [20, 0]);
  const scale = interpolate(enterProgress, [0, 1], [0.85, 1]);
  const yOff = interpolate(enterProgress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 110,
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
          backdropFilter: `blur(12px)`,
          WebkitBackdropFilter: "blur(12px)",
          padding: "18px 28px",
          borderRadius: 16,
          border: `1px solid ${GREEN_20}`,
          display: "inline-block",
          maxWidth: "100%",
          boxShadow: `0 0 30px ${GREEN_10}`,
          transform: `scale(${scale}) translateY(${yOff}px)`,
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
            filter: `blur(${blur}px)`,
            transition: "none",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TRANSITION WIPE: Diamond mask wipe between steps
   ═══════════════════════════════════════════════════════════ */

const TransitionDiamond: React.FC<{
  frame: number;
  duration?: number;
}> = ({ frame, duration = 20 }) => {
  const size = interpolate(frame, [0, duration], [0, W * 1.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = interpolate(frame, [0, 5, duration - 5, duration], [0, 0.8, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        opacity: op,
        pointerEvents: "none",
        background: GREEN,
        clipPath: `polygon(
          ${Cx - size / 2}px ${Cy - size / 2}px,
          ${Cx}px ${Cy - size}px,
          ${Cx + size / 2}px ${Cy - size / 2}px,
          ${Cx + size}px ${Cy},
          ${Cx + size / 2}px ${Cy + size / 2}px,
          ${Cx}px ${Cy + size}px,
          ${Cx - size / 2}px ${Cy + size / 2}px,
          ${Cx - size}px ${Cy}
        )`,
      }}
    />
  );
};

/* ═══════════════════════════════════════════════════════════
   PROGRESS RING: Animated circular progress around step
   ═══════════════════════════════════════════════════════════ */

const ProgressRing: React.FC<{
  frame: number;
  totalSteps: number;
  currentStep: number;
}> = ({ frame, totalSteps, currentStep }) => {
  const gap = 22;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const startX = Cx - ((totalSteps - 1) * gap) / 2;

  return (
    <div style={{ position: "absolute", top: 120, left: 0, width: W, textAlign: "center", zIndex: 30 }}>
      <div style={{ display: "inline-flex", gap: 14, alignItems: "center" }}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isActive = i === currentStep;
          const isPast = i < currentStep;
          const progress = isPast ? 1 : isActive ? interpolate(frame, [0, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
          const activeSpring = spring({
            frame: isActive ? frame : 0,
            fps: 30,
            config: { damping: 12, stiffness: 200 },
          });
          const activeScale = isActive ? interpolate(activeSpring, [0, 1], [1.5, 1.2]) : 1;
          const activePulse = isActive ? 0.5 + Math.sin(frame * 0.12) * 0.5 : 0;

          return (
            <div key={i} style={{ position: "relative", display: "flex", alignItems: "center" }}>
              {/* Progress ring SVG */}
              <svg
                width={28}
                height={28}
                style={{ position: "absolute", top: -4, left: -4, opacity: isActive || isPast ? 1 : 0 }}
              >
                <circle
                  cx={14}
                  cy={14}
                  r={radius}
                  fill="none"
                  stroke={GREEN_30}
                  strokeWidth={2}
                />
                <circle
                  cx={14}
                  cy={14}
                  r={radius}
                  fill="none"
                  stroke={GREEN}
                  strokeWidth={2}
                  strokeDasharray={`${circumference * progress} ${circumference}`}
                  strokeLinecap="round"
                  transform="rotate(-90 14 14)"
                  style={{ transition: "none" }}
                />
              </svg>

              <div
                style={{
                  width: isActive ? 16 : 10,
                  height: isActive ? 16 : 10,
                  borderRadius: "50%",
                  background: isPast || isActive ? GREEN : "rgba(255,255,255,0.15)",
                  transform: `scale(${activeScale})`,
                  boxShadow: isActive ? `0 0 20px ${GREEN_60}, 0 0 40px ${GREEN_30}` : "none",
                  transition: "none",
                }}
              />
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    left: -10,
                    width: 36,
                    height: 36,
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
                    background: isPast ? GREEN : "rgba(255,255,255,0.12)",
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
   GLOBAL CRT OVERLAY: Full screen scan lines + flicker
   ═══════════════════════════════════════════════════════════ */

const GlobalCRT: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {/* Scan lines */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)`,
        pointerEvents: "none",
        zIndex: 200,
        opacity: 0.6,
      }}
    />
    {/* Subtle vignette flicker */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.08) 100%)",
        pointerEvents: "none",
        zIndex: 200,
        opacity: 0.5 + Math.sin(frame * 0.2) * 0.1,
      }}
    />
    {/* Occasional flash line */}
    {frame % 120 < 3 && (
      <div
        style={{
          position: "absolute",
          top: interpolate(frame % 120, [0, 3], [0, H]),
          left: 0,
          width: W,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${GREEN_40}, transparent)`,
          pointerEvents: "none",
          zIndex: 200,
          opacity: interpolate(frame % 120, [0, 1, 2, 3], [0, 0.3, 0.2, 0]),
        }}
      />
    )}
  </>
);

/* ═══════════════════════════════════════════════════════════
   FLOATING HEXAGONS: Rotating tech decorations
   ═══════════════════════════════════════════════════════════ */

const FloatingHexagons: React.FC<{ frame: number }> = ({ frame }) => {
  const hexagons = useMemo(
    () => [
      { x: 120, y: 250, r: 40, spd: 0.4, phase: 0 },
      { x: 960, y: 600, r: 60, spd: -0.3, phase: 1.5 },
      { x: 180, y: 1100, r: 35, spd: 0.5, phase: 3 },
      { x: 900, y: 1500, r: 50, spd: -0.35, phase: 0.8 },
      { x: 540, y: 200, r: 25, spd: 0.6, phase: 2.2 },
      { x: 300, y: 1700, r: 45, spd: -0.45, phase: 4.1 },
    ],
    []
  );

  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", top: 0, left: 0, zIndex: 4, pointerEvents: "none" }}
    >
      {hexagons.map((h, i) => {
        const rot = (frame * h.spd * 2) % 360;
        const floatY = Math.sin(frame * 0.008 + h.phase) * 15;
        const floatX = Math.cos(frame * 0.006 + h.phase) * 10;
        const op = 0.08 + Math.sin(frame * 0.04 + h.phase) * 0.04;
        const pulse = 1 + Math.sin(frame * 0.03 + h.phase) * 0.15;

        const pts = [];
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI / 3) * k - Math.PI / 6;
          pts.push(`${h.x + floatX + (h.r * pulse) * Math.cos(a)},${h.y + floatY + (h.r * pulse) * Math.sin(a)}`);
        }
        const path = `M${pts.join(" L")} Z`;

        return (
          <g key={i} transform={`rotate(${rot} ${h.x + floatX} ${h.y + floatY})`}>
            <path d={path} fill="none" stroke={GREEN} strokeWidth="1.2" opacity={op} />
            <path d={path} fill={GREEN} opacity={op * 0.3} />
          </g>
        );
      })}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════
   LASER SWEEP: Dramatic green beam sweeping across screen
   ═══════════════════════════════════════════════════════════ */

const LaserSweep: React.FC<{ frame: number; activeFrames?: number }> = ({ frame, activeFrames = 80 }) => {
  const y = interpolate(frame % activeFrames, [0, activeFrames], [-100, H + 100]);
  const op = interpolate(frame % activeFrames, [0, 10, activeFrames - 10, activeFrames], [0, 0.25, 0.25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: y - 60,
        left: 0,
        width: W,
        height: 120,
        background: `linear-gradient(to bottom, transparent, ${GREEN_20}, ${GREEN_40}, ${GREEN_20}, transparent)`,
        opacity: op,
        pointerEvents: "none",
        zIndex: 15,
        filter: "blur(8px)",
      }}
    />
  );
};

/* ═══════════════════════════════════════════════════════════
   SHOCKWAVE RING: Expanding ring on transitions
   ═══════════════════════════════════════════════════════════ */

const ShockwaveRing: React.FC<{
  frame: number;
  cx?: number;
  cy?: number;
}> = ({ frame, cx = Cx, cy = H / 2 }) => {
  const r = interpolate(frame, [0, 40], [0, W * 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = interpolate(frame, [0, 5, 25, 40], [0, 0.6, 0.3, 0], { extrapolateLeft: "clamp" });
  const strokeW = interpolate(frame, [0, 40], [4, 0.5], { extrapolateLeft: "clamp" });

  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", top: 0, left: 0, zIndex: 99, pointerEvents: "none" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={GREEN}
        strokeWidth={strokeW}
        opacity={op}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.7}
        fill="none"
        stroke={GREEN_40}
        strokeWidth={strokeW * 0.7}
        opacity={op * 0.6}
      />
    </svg>
  );
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
      <GlitchTitle
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
      {/* ===== LAYER 0: Background FX ===== */}
      <AnimatedBG frame={frame} />
      <FloatingOrbs frame={frame} />
      <MatrixRainDark frame={frame} />
      <FloatingHexagons frame={frame} />
      <Vignette />
      <LaserSweep frame={frame} activeFrames={100} />

      {/* ===== LAYER 1: Transition Effects ===== */}
      {/* Shockwave ring on step start */}
      {stepFrames.some(({ from }) => frame >= from && frame < from + 40) && (
        <ShockwaveRing
          frame={(() => {
            const sf = stepFrames.find(({ from }) => frame >= from && frame < from + 40);
            return sf ? frame - sf.from : 0;
          })()}
          cx={Cx}
          cy={600}
        />
      )}

      {/* Connecting lines during steps */}
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

      {/* Particle burst on step transitions */}
      {showBurst && (
        <ParticleBurst
          frame={frame % 45}
          cx={burstCenter[0]}
          cy={burstCenter[1]}
          seed={activeStepIndex}
        />
      )}

      {/* ===== LAYER 2: Decorative Overlays ===== */}
      <FancyCorners frame={frame} />
      <SideAccentBars frame={frame} />

      {/* ===== LAYER 3: Intro ===== */}
      {isIntro && (
        <>
          <IntroSequence frame={frame} fps={fps} />
          <Audio src={staticFile("agent_voice_intro.wav")} />
        </>
      )}

      {/* ===== LAYER 4: Step Progress Ring ===== */}
      {!isIntro && !isOutro && (
        <ProgressRing
          frame={frame}
          totalSteps={STEPS.length}
          currentStep={activeStepIndex}
        />
      )}

      {/* ===== LAYER 5: Steps ===== */}
      {stepFrames.map(({ from, to, config, index }) => (
        <Sequence key={index} from={from} durationInFrames={to - from}>
          {/* Glitch title with chromatic aberration */}
          <GlitchTitle
            frame={frame - from}
            fps={fps}
            lines={[`STEP 0${index + 1}`, config.name]}
            top={220}
            fontSize={52}
          />
          <Audio src={staticFile(config.voice)} />
          {/* Kinetic subtitle with blur+scale entrance */}
          <KineticSubtitle
            frame={frame}
            text={config.subtitle}
            startFrame={from + 15}
            endFrame={to - 15}
          />
          {config.isPrompt ? (
            <PromptShowcase frame={frame - from} fps={fps} delay={30} />
          ) : (
            <HolographicCodeBlock
              frame={frame - from}
              fps={fps}
              code={config.code}
              top={420}
              delay={25}
            />
          )}
        </Sequence>
      ))}

      {/* ===== LAYER 6: Outro ===== */}
      {isOutro && (
        <Sequence from={outroFrom} durationInFrames={346}>
          <OutroSequence frame={frame - outroFrom} fps={fps} />
          <Audio src={staticFile("agent_voice_outro.wav")} />
        </Sequence>
      )}

      {/* ===== LAYER 7: Global CRT Overlay (topmost) ===== */}
      <GlobalCRT frame={frame} />
    </div>
  );
};
