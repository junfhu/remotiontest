import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
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
const DARK = "rgba(8, 14, 4, 0.92)";
const WHITE = "#ffffff";
const CODE_BG = "rgba(0, 0, 0, 0.75)";

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

/* ── Background Grid (simplified from CEOIntroduction) ───────── */

const BGGrid: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [0, 25], [0, 0.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const linesH = [];
  for (let i = 0; i < 24; i++) {
    const y = i * 80 + (frame * 0.3) % 80;
    linesH.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={y}
        x2={W}
        y2={y}
        stroke={GREEN}
        strokeWidth={0.5}
        opacity={0.15}
      />
    );
  }

  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", top: 0, left: 0, opacity }}
    >
      {linesH}
    </svg>
  );
};

const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.3) 100%)",
      pointerEvents: "none",
      zIndex: 1,
    }}
  />
);

const FloatingParticles: React.FC<{ frame: number }> = ({ frame }) => {
  const particles = useMemo(
    () => [
      { x: 120, y: 300, s: 20, spd: 1.2, d: 30 },
      { x: 960, y: 500, s: 16, spd: 0.9, d: 45 },
      { x: 200, y: 900, s: 24, spd: 1.5, d: 60 },
      { x: 880, y: 1200, s: 18, spd: 1.0, d: 75 },
      { x: 500, y: 1600, s: 22, spd: 1.3, d: 50 },
      { x: 900, y: 1800, s: 14, spd: 0.8, d: 90 },
    ],
    []
  );

  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", top: 0, left: 0, zIndex: 3, pointerEvents: "none" }}
    >
      {particles.map((p, i) => {
        const e = Math.max(0, frame - p.d);
        const fy = Math.sin(e * p.spd * 0.03) * 15;
        const fx = Math.cos(e * p.spd * 0.02) * 8;
        const op = interpolate(frame - p.d, [0, 15, 200, 250], [0, 0.3, 0.25, 0], {
          extrapolateLeft: "clamp",
        });
        return (
          <g
            key={i}
            transform={`translate(${p.x + fx},${p.y + fy})`}
            opacity={op}
          >
            <circle cx={p.s / 2} cy={p.s / 2} r={p.s / 3} fill="none" stroke={GREEN} strokeWidth="1" />
          </g>
        );
      })}
    </svg>
  );
};

const CornerAccents: React.FC<{ frame: number }> = ({ frame }) => {
  const corners = [
    { x: 30, y: 30, rot: 0 },
    { x: 1050, y: 30, rot: 90 },
    { x: 1050, y: 1890, rot: 180 },
    { x: 30, y: 1890, rot: 270 },
  ];
  return (
    <>
      {corners.map((c, i) => {
        const s = spring({
          frame: frame - 10 - i * 4,
          fps: 30,
          config: { damping: 12, stiffness: 140 },
        });
        const sc = interpolate(s, [0, 1], [0.3, 1]);
        const op = interpolate(frame - 10 - i * 4, [0, 12], [0, 0.6], {
          extrapolateLeft: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: 50,
              height: 50,
              borderLeft: `2px solid ${GREEN}`,
              borderTop: `2px solid ${GREEN}`,
              transform: `scale(${sc}) rotate(${c.rot}deg)`,
              transformOrigin:
                c.rot === 0
                  ? "top left"
                  : c.rot === 90
                  ? "top right"
                  : c.rot === 180
                  ? "bottom right"
                  : "bottom left",
              opacity: op,
              zIndex: 8,
            }}
          />
        );
      })}
    </>
  );
};

/* ── Subtitle Component ───────────────────────────────────── */

const Subtitle: React.FC<{
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

  return (
    <div
      style={{
        position: "absolute",
        bottom: 120,
        left: 60,
        right: 60,
        zIndex: 50,
        opacity: progress,
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          padding: "16px 28px",
          borderRadius: 12,
          border: `1px solid ${GREEN_30}`,
          display: "inline-block",
          maxWidth: "100%",
        }}
      >
        <span
          style={{
            fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
            fontSize: 32,
            fontWeight: 600,
            color: WHITE,
            lineHeight: 1.5,
            textShadow: `0 0 20px ${GREEN_30}`,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

/* ── Step Title Animation ─────────────────────────────────── */

const StepTitle: React.FC<{
  frame: number;
  fps: number;
  stepNum: string;
  title: string;
}> = ({ frame, fps, stepNum, title }) => {
  const enter = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 200, mass: 1 },
  });
  const yOff = interpolate(enter, [0, 1], [60, 0]);
  const op = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 200,
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
          fontSize: 28,
          color: GREEN_60,
          letterSpacing: 6,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        {stepNum}
      </div>
      <div
        style={{
          fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
          fontSize: 56,
          color: GREEN,
          letterSpacing: 4,
          textShadow: `0 0 40px ${GREEN_20}, 0 0 80px ${GREEN_10}`,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 16,
          height: 3,
          width: interpolate(frame, [5, 25], [0, 200], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)`,
          marginLeft: "auto",
          marginRight: "auto",
          boxShadow: `0 0 15px ${GREEN_40}`,
        }}
      />
    </div>
  );
};

/* ── Code Block Component ─────────────────────────────────── */

const CodeBlock: React.FC<{
  frame: number;
  fps: number;
  code: string;
  delay?: number;
}> = ({ frame, fps, code, delay = 0 }) => {
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const yOff = interpolate(enter, [0, 1], [40, 0]);
  const op = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 420,
        left: 70,
        right: 70,
        zIndex: 20,
        opacity: op,
        transform: `translateY(${yOff}px)`,
      }}
    >
      <div
        style={{
          background: CODE_BG,
          border: `1px solid ${GREEN_30}`,
          borderRadius: 12,
          padding: "24px 28px",
          boxShadow: `0 0 40px ${GREEN_10}, inset 0 0 30px rgba(118,185,0,0.03)`,
          fontFamily: "'SF Mono', 'Courier New', Consolas, monospace",
          fontSize: 24,
          lineHeight: 1.7,
          color: WHITE,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {code.split("").map((ch, i) => {
          const chOp = interpolate(frame - delay - i * 0.3, [0, 3], [0, 1], {
            extrapolateLeft: "clamp",
          });
          const isGreen =
            /[{}()<>=/\"']/.test(ch) ||
            ["npm", "import", "from", "const", "export", "return", "function"].some(
              (kw) => code.substring(i, i + kw.length) === kw
            );
          return (
            <span
              key={i}
              style={{
                color: isGreen ? GREEN : WHITE,
                opacity: chOp,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main Title Intro ─────────────────────────────────────── */

const IntroTitle: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const s = spring({ frame, fps, config: { damping: 8, stiffness: 180, mass: 1.2 } });
  const scale = interpolate(s, [0, 1], [2.5, 1]);
  const settle = spring({ frame: frame - 20, fps, config: { damping: 20, stiffness: 200 } });
  const finalScale = interpolate(settle, [0, 1], [scale, 1]);
  const op = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top: 600,
        left: 0,
        width: W,
        textAlign: "center",
        zIndex: 20,
        opacity: op,
      }}
    >
      <div
        style={{
          transform: `scale(${finalScale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          style={{
            fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
            fontSize: 72,
            color: GREEN,
            letterSpacing: 6,
            textShadow: `0 0 60px ${GREEN_30}, 0 0 120px ${GREEN_10}`,
            lineHeight: 1.3,
          }}
        >
          如何用 Remotion
        </div>
        <div
          style={{
            fontFamily: "'Knewave', 'Arial Black', Impact, sans-serif",
            fontSize: 72,
            color: GREEN,
            letterSpacing: 6,
            textShadow: `0 0 60px ${GREEN_30}, 0 0 120px ${GREEN_10}`,
            lineHeight: 1.3,
            marginTop: 12,
          }}
        >
          制作视频
        </div>
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 28,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: 8,
        }}
      >
        REACT + CODE = VIDEO
      </div>
    </div>
  );
};

/* ── Outro ────────────────────────────────────────────────── */

const Outro: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const s = spring({ frame, fps, config: { damping: 10, stiffness: 150 } });
  const op = interpolate(s, [0, 1], [0, 1]);
  const yOff = interpolate(s, [0, 1], [30, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 720,
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
          textShadow: `0 0 50px ${GREEN_30}`,
        }}
      >
        开始创作吧！
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 26,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        github.com/remotion-dev/remotion
      </div>
    </div>
  );
};

/* ── Side Accent Lines ────────────────────────────────────── */

const SideAccents: React.FC<{ frame: number }> = ({ frame }) => {
  const h1 = interpolate(frame, [0, 40], [0, H], { extrapolateLeft: "clamp" });
  const h2 = interpolate(frame, [10, 50], [0, H], { extrapolateLeft: "clamp" });
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 20,
          width: 2,
          height: h1,
          background: `linear-gradient(to bottom, ${GREEN}, transparent)`,
          zIndex: 26,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 20,
          width: 2,
          height: h2,
          background: `linear-gradient(to top, ${GREEN}, transparent)`,
          zIndex: 26,
          opacity: 0.6,
        }}
      />
    </>
  );
};

/* ── Step Definitions ─────────────────────────────────────── */

const STEP_CONFIG = [
  {
    name: "STEP 01",
    title: "安装 Remotion",
    code: `npm install remotion
npm install @remotion/cli`,
    voice: "voice_step1.wav",
    subtitle: "第一步，安装Remotion。在你的项目目录中运行npm install remotion和npm install @remotion/cli。然后创建src目录和入口文件index.tsx。",
    duration: 461,
  },
  {
    name: "STEP 02",
    title: "定义 Composition",
    code: `<Composition
  id="MyVideo"
  component={MyVideo}
  width={1080}
  height={1920}
  fps={30}
  durationInFrames={300}
/>`,
    voice: "voice_step2.wav",
    subtitle: "第二步，定义Composition。在Root组件中，使用Composition组件设置视频的宽度、高度、帧率和时长。比如我们设置1080乘1920，30帧每秒，300帧也就是10秒。",
    duration: 461,
  },
  {
    name: "STEP 03",
    title: "编写视频组件",
    code: `const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const opacity = interpolate(
  frame, [0, 30], [0, 1]
);

return <div style={{ opacity }}>
  <Img src={staticFile("img.png")} />
</div>;`,
    voice: "voice_step3.wav",
    subtitle: "第三步，编写视频组件。使用useCurrentFrame获取当前帧号，用interpolate做数值插值动画，用spring做弹性动画。你还可以添加文字、图片、SVG图形和CSS特效。",
    duration: 499,
  },
  {
    name: "STEP 04",
    title: "渲染导出",
    code: `npx remotion render src/index.tsx
  MyVideo out/video.mp4`,
    voice: "voice_step4.wav",
    subtitle: "第四步，渲染导出。运行npx remotion render命令，Remotion会逐帧渲染你的React组件，最终生成MP4视频文件。就是这么简单，用代码创造属于你的视频吧！",
    duration: 384,
  },
];

/* ── Main Composition ────────────────────────────────────── */

export const TutorialVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let currentFrame = 60; // intro offset
  const stepFrames: Array<{ from: number; to: number; config: typeof STEP_CONFIG[0] }> = [];

  for (const config of STEP_CONFIG) {
    const from = currentFrame;
    const to = currentFrame + config.duration;
    stepFrames.push({ from, to, config });
    currentFrame = to;
  }

  const outroFrom = currentFrame;
  const outroTo = outroFrom + 60;

  const isIntro = frame < 60;
  const isOutro = frame >= outroFrom && frame < outroTo;

  return (
    <div
      style={{
        width: W,
        height: H,
        background: "#0a0f05",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background layers */}
      <BGGrid frame={frame} />
      <Vignette />
      <FloatingParticles frame={frame} />
      <CornerAccents frame={frame} />
      <SideAccents frame={frame} />

      {/* Intro */}
      {isIntro && <IntroTitle frame={frame} fps={fps} />}

      {/* Steps */}
      {stepFrames.map(({ from, to, config }, i) => (
        <Sequence key={i} from={from} durationInFrames={to - from}>
          <StepTitle
            frame={frame - from}
            fps={fps}
            stepNum={config.name}
            title={config.title}
          />
          <CodeBlock
            frame={frame - from}
            fps={fps}
            code={config.code}
            delay={30}
          />
          <Audio src={staticFile(config.voice)} />
          <Subtitle
            frame={frame}
            text={config.subtitle}
            startFrame={from + 15}
            endFrame={to - 15}
          />
        </Sequence>
      ))}

      {/* Outro */}
      {isOutro && (
        <Sequence from={outroFrom} durationInFrames={60}>
          <Outro frame={frame - outroFrom} fps={fps} />
        </Sequence>
      )}
    </div>
  );
};
