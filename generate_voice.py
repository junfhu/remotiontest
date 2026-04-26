from voxcpm import VoxCPM
import soundfile as sf

model = VoxCPM.from_pretrained("/home/ppcorn/voxcpm/pretrained_models/VoxCPM2", load_denoiser=False)

ref_audio = "/home/ppcorn/qwen3tts/hjf_test.wav"
ref_text  = "这是一个测试录音，我们看看它的效果如何。"

text="""
第一步，安装Remotion。在你的项目目录中运行npm install remotion和npm install @remotion/cli。然后创建src目录和入口文件index.tsx。
"""

wav = model.generate(
    text="(正常语速，清晰)"+text,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/voice_step1.wav", wav, model.tts_model.sample_rate)

text="""
第二步，定义Composition。在Root组件中，使用Composition组件设置视频的宽度、高度、帧率和时长。比如我们设置1080乘1920，30帧每秒，300帧也就是10秒。
"""

wav = model.generate(
    text="(正常语速，清晰)"+text,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/voice_step2.wav", wav, model.tts_model.sample_rate)

text="""
第三步，编写视频组件。使用useCurrentFrame获取当前帧号，用interpolate做数值插值动画，用spring做弹性动画。你还可以添加文字、图片、SVG图形和CSS特效。
"""

wav = model.generate(
    text="(正常语速，清晰)"+text,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/voice_step3.wav", wav, model.tts_model.sample_rate)

text="""
第四步，渲染导出。运行npx remotion render命令，Remotion会逐帧渲染你的React组件，最终生成MP4视频文件。就是这么简单，用代码创造属于你的视频吧！
"""

wav = model.generate(
    text="(正常语速，清晰)"+text,
    reference_wav_path=ref_audio,
    cfg_value=2.0,
    inference_timesteps=10,
)
sf.write("/home/ppcorn/remotion/cinematic-tech-intro/public/voice_step4.wav", wav, model.tts_model.sample_rate)

print("All voice files generated!")
