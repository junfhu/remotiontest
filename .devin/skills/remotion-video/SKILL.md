---
name: remotion-video
description: Create a cinematic Remotion video with AI agent workflow, voice cloning, and subtitles
argument-hint: "<video topic/description> [--portrait|--landscape] [--voice-model <path>]"
model: sonnet
allowed-tools:
  - read
  - edit
  - write
  - grep
  - exec
  - ask_user_question
permissions:
  allow:
    - Read(**)
    - Write(src/**)
    - Write(public/**)
    - Write(package.json)
    - Exec(npm)
    - Exec(npx)
    - Exec(git)
    - Exec(python3)
    - Exec(source)
  ask:
    - Exec(rm)
    - Exec(sudo)
---

Create a professional Remotion video based on the user's request.

## Prerequisites Check

1. Check if `remotion` is installed in the project (`package.json` dependencies).
2. If not, run: `npm install remotion @remotion/cli @remotion/player`
3. Ensure `src/index.ts` (or `src/index.tsx`) exists and registers a root component.
4. Check if a voxCPM (or other TTS) conda environment is available:
   - Look for `/home/ppcorn/miniconda3/envs/voxcpm` or ask user for their TTS setup.
   - If available, note the model path and reference audio path.

## Step 1: Determine Video Specs

From the user's `$ARGUMENTS`, determine:
- **Dimensions**: Default to portrait `1080x1920` (Douyin/TikTok). If `--landscape`, use `1920x1080`.
- **Duration**: Estimate based on voice script length (default ~60-90 seconds = 1800-2700 frames at 30fps).
- **Style**: "Green tech/hacker" is the default aesthetic (green `#76B900`, dark bg, grid, particles, glitch). Ask user if they want a different style.
- **Topic**: Extract the video subject from `$ARGUMENTS`.

## Step 2: Plan the Video Structure

Break the video into segments:
- **Intro** (2-3 seconds): Title animation with glitch/3D flip effect.
- **Content Steps** (1-4 steps depending on topic): Each with a title, code/illustration block, and voiceover.
- **Outro** (2-3 seconds): Call to action.

For each step, write:
1. Chinese narration script (for voxCPM voice cloning)
2. Matching subtitle text
3. Visual content (code block, image placeholder, or description)

## Step 3: Generate Voice Files

1. Create a Python script `generate_voice.py` that uses the voxCPM model:
```python
from voxcpm import VoxCPM
import soundfile as sf

model = VoxCPM.from_pretrained("$VOXCPM_MODEL_PATH", load_denoiser=False)
ref_audio = "$REFERENCE_AUDIO_PATH"
ref_text = "$REFERENCE_TEXT"

segments = [
    ("intro", "intro script text..."),
    ("step1", "step 1 script text..."),
    # ...
    ("outro", "outro script text..."),
]

for name, text in segments:
    wav = model.generate(
        text="(正常语速，清晰)" + text,
        reference_wav_path=ref_audio,
        cfg_value=2.0,
        inference_timesteps=10,
    )
    sf.write(f"public/voice_{name}.wav", wav, model.tts_model.sample_rate)
```
2. Activate conda environment and run the script.
3. Measure each `.wav` duration to calculate frame counts (`duration_seconds * 30`).

## Step 4: Create the Video Component

Create `src/VideoComposition.tsx` (or similar) with these layers and effects:

### Background Layer
- `AnimatedBG`: Flowing horizontal grid lines with scroll offset.
- `FloatingOrbs`: 4-6 large blurred green circles slowly drifting (zIndex 1, very low opacity ~0.04).
- `Vignette`: Radial gradient darkening edges.

### Matrix Rain Layer (Optional but recommended)
- `MatrixRainDark`: Green character columns falling. Use `GREEN` and `GREEN_60` colors.
- Only visible if background is dark enough (ensure background is `#040802` or similar).

### Transition Effects
- `ParticleBurst`: 24 particles exploding outward from center on step transitions.
- `ShockwaveRing`: SVG expanding circles on step starts.
- `LaserSweep`: Horizontal green beam sweeping down periodically.
- `FloatingHexagons`: Slow rotating hexagonal decorations.

### Content Layers
- **Step Indicator**: Progress dots with `spring()` animation. Active step gets a pulse ring.
- **GlitchTitle**: 3D flip entrance + RGB chromatic aberration + horizontal slice glitch + white flash.
- **HolographicCodeBlock**: Code with typewriter effect + scan shine sweep + CRT scanlines + holographic red channel offset.
- **KineticSubtitle**: Subtitles with blur→sharp + scale + slide entrance. Use glassmorphism background (`backdrop-filter: blur(12px)`).
- **Subtitle**: Standard bottom subtitle with fade in/out synchronized to voice frames.

### Text Animation Helpers
- Use `spring()` from remotion for elastic entrances.
- Use `interpolate()` for linear/progressive animations.
- Use `Sequence` for temporal composition of segments.
- Use `Audio` from remotion to embed voice files.

### Key Animation Patterns
```typescript
// 3D Flip entrance
const s = spring({ frame, fps, config: { damping: 10, stiffness: 120, mass: 1.2 } });
const rotateX = interpolate(s, [0, 0.4, 1], [90, -10, 0]);

// Chromatic aberration glitch
const gCycle = frame % 55;
const isG = gCycle > 42 && gCycle < 50;
const rgbShift = isG ? 6 * gIntensity : 0;
// Render red channel offset + cyan channel offset + main text

// Typewriter effect per character
const chOp = interpolate(frame - delay - i * 0.4, [0, 3], [0, 1]);
```

## Step 5: Register Composition

Update `src/Root.tsx` to add the new Composition:
```tsx
<Composition
  id="VideoComposition"
  component={VideoComposition}
  durationInFrames={TOTAL_FRAMES}
  fps={30}
  width={1080}
  height={1920}
/>
```
Keep existing compositions intact.

## Step 6: Add Build Scripts

Update `package.json` scripts:
```json
"build:video": "remotion render src/index.ts VideoComposition out/video.mp4",
"build:all": "npm run build && npm run build:video"
```

## Step 7: TypeScript Verification

Run `npx tsc --noEmit` to verify no type errors.

## Step 8: Git Commit & Push

```bash
git add .
git commit -m "Add Remotion video: <topic>"
git push origin main
```

## Style Constants (Copy these)

```typescript
const GREEN = "#76B900";
const GREEN_10 = "rgba(118, 185, 0, 0.10)";
const GREEN_20 = "rgba(118, 185, 0, 0.20)";
const GREEN_30 = "rgba(118, 185, 0, 0.30)";
const GREEN_40 = "rgba(118, 185, 0, 0.40)";
const GREEN_60 = "rgba(118, 185, 0, 0.60)";
const DARK = "rgba(8, 14, 4, 0.95)";
const WHITE = "#ffffff";
const CODE_BG = "rgba(0, 0, 0, 0.82)";
```

## Dimensions Reference

| Platform | Width | Height | Aspect |
|----------|-------|--------|--------|
| Douyin/TikTok/Reels | 1080 | 1920 | 9:16 |
| YouTube | 1920 | 1080 | 16:9 |
| YouTube Shorts | 1080 | 1920 | 9:16 |
| Instagram Feed | 1080 | 1080 | 1:1 |

## Important Notes

1. **Background must be dark** (`#040802` or similar) for matrix rain and green glow effects to be visible.
2. **Voice timing**: Always measure generated `.wav` files to get exact frame counts. Use Python `wave` module.
3. **Subtitle sync**: Subtitle `startFrame` should be `step_start + 15`, `endFrame` should be `step_end - 15` for padding.
4. **zIndex layering**: Background (0-3) → Decorations (4-8) → Content (10-20) → Subtitles (50) → Global overlays (200).
5. **Performance**: Avoid creating new arrays/objects every frame in render loops. Use `useMemo` for static particle positions.
