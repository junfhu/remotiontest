from voxcpm import VoxCPM
import soundfile as sf

model = VoxCPM.from_pretrained("/home/ppcorn/voxcpm/pretrained_models/VoxCPM2", load_denoiser=False)

ref_audio = "/home/ppcorn/qwen3tts/hjf_test.wav"
ref_text  = "这是一个测试录音，我们看看它的效果如何。"

# Step 0: Intro
intro_text = "如何用 AI 代码 Agent，自动生成专业级视频？今天教你用 Claude Code 或 Devin，一行代码都不用写，让 AI 帮你完成全部工作。"
wav = model.generate(
    text="(正常语速，清晰，有感染力)"+intro_text,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/agent_voice_intro.wav", wav, model.tts_model.sample_rate)

# Step 1: Install
text1 = "第一步，安装 AI 代码 Agent。Claude Code 是首选，在终端运行命令安装即可。你也可以用 Devin、Cursor Agent 或 Windsurf。选择一个你顺手的工具。"
wav = model.generate(
    text="(正常语速，清晰)"+text1,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/agent_voice_step1.wav", wav, model.tts_model.sample_rate)

# Step 2: Prepare assets
text2 = "第二步，准备素材。只需要一张人物照片，和一段你想展示的文字介绍。照片建议用纯色背景或透明背景，效果最佳。"
wav = model.generate(
    text="(正常语速，清晰)"+text2,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/agent_voice_step2.wav", wav, model.tts_model.sample_rate)

# Step 3: Write Prompt
text3 = "第三步，写 Prompt 给 Agent。Prompt 越详细，效果越好。告诉它你的视频尺寸、画面风格、动画需求，以及素材路径。Agent 会自动安装 Remotion，编写 React 组件，添加特效和动画。"
wav = model.generate(
    text="(正常语速，清晰)"+text3,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/agent_voice_step3.wav", wav, model.tts_model.sample_rate)

# Step 4: Auto coding
text4 = "第四步，AI 自动编写代码。Agent 会分析你的需求，生成完整的 Remotion 项目结构，包括组件文件、动画逻辑、样式特效。你只需等待几分钟，代码就全部写好了。"
wav = model.generate(
    text="(正常语速，清晰)"+text4,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/agent_voice_step4.wav", wav, model.tts_model.sample_rate)

# Step 5: Preview & Export
text5 = "第五步，预览和导出。运行 n p x remotion studio，实时预览每一帧效果。不满意就告诉 Agent 修改，比如颜色太淡、动画太快。满意后直接渲染导出 M P 4，一条命令搞定。"
wav = model.generate(
    text="(正常语速，清晰)"+text5,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/agent_voice_step5.wav", wav, model.tts_model.sample_rate)

# Outro
outro_text = "AI 代码 Agent 让视频制作变得前所未有的简单。不需要学视频剪辑软件，不需要写复杂代码，只要会描述你的想法，AI 就能帮你实现。快去试试吧！"
wav = model.generate(
    text="(正常语速，清晰，有感染力)"+outro_text,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/agent_voice_outro.wav", wav, model.tts_model.sample_rate)

print("All agent voice files generated!")
