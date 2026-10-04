# 霓虹跑酷 Intro 视频

这是一个6-8秒的确定性开场视频，使用Remotion + Three.js制作，展示霓虹紫色未来跑酷氛围。

## 🎬 视频内容

**时长**: 8秒 (480帧 @ 60fps)  
**分辨率**: 1920x1080  
**主题**: 霓虹紫色赛博跑酷

### 分镜时间轴

- **00:00 - 01.5s**: 鞋子在深黑紫色环境中出现
- **01.5s - 03.0s**: 脚踝旋转热身动画，紫色光弧效果
- **03.0s - 04.0s**: 蓄力停顿，地面霓虹线圈亮起
- **04.0s - 05.5s**: 爆发起跑，粒子拖尾，镜头加速
- **05.5s - 07.0s**: 显露三条霓虹赛道和未来城市剪影
- **07.0s - 08.0s**: 冲入紫色光门，强光过渡

## 🎨 视觉特点

- **主色调**: 霓虹紫色 (#a855f7, #8b5cf6)
- **辅助色**: 青色 (#06b6d4) 少量点缀
- **背景**: 深黑色 (#0a0014) 和深紫色
- **特效**: 
  - 发光鞋底和鞋身霓虹线条
  - 粒子系统拖尾
  - 地面反光和光晕
  - 霓虹赛道边缘线
  - 光门强光过渡

## 🚀 使用方法

### 1. 预览视频（实时编辑）

```bash
npm run intro:preview
```

这会启动Remotion Studio，可以在浏览器中实时预览和调整动画。

### 2. 渲染视频为MP4

```bash
npm run intro:render
```

这会将视频渲染为 `public/intro.mp4`，可以直接在游戏中使用。

### 3. 自定义渲染设置

```bash
# 渲染特定帧范围
remotion render src/intro/Root.tsx NeonRunnerIntro public/intro.mp4 --frames=0-240

# 调整质量
remotion render src/intro/Root.tsx NeonRunnerIntro public/intro.mp4 --quality=90

# 更改分辨率
remotion render src/intro/Root.tsx NeonRunnerIntro public/intro.mp4 --width=1280 --height=720
```

## 📁 文件结构

```
src/intro/
├── Root.tsx              # Remotion入口配置
├── IntroVideo.tsx        # 主视频组件，控制时间轴
├── Shoe.tsx              # 3D鞋子模型和动画
├── NeonTrack.tsx         # 霓虹赛道和未来城市
├── ParticleSystem.tsx    # 粒子系统
├── intro.css             # 样式和特效
└── README.md             # 本文档
```

## 🎮 集成到游戏

视频渲染完成后，可以通过以下方式集成到游戏中：

### 方案A: 作为背景视频元素

```tsx
<video
  autoPlay
  muted
  playsInline
  onEnded={startGame}
  src="/intro.mp4"
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>
```

### 方案B: 全屏intro，然后过渡到游戏

```tsx
const [showIntro, setShowIntro] = useState(true)

{showIntro ? (
  <video
    autoPlay
    muted
    playsInline
    onEnded={() => setShowIntro(false)}
    src="/intro.mp4"
    className="intro-video"
  />
) : (
  <FestivalGame />
)}
```

## 🎨 自定义调整

### 调整颜色

在各个组件中搜索颜色值并修改：
- 主紫色: `#a855f7`, `#8b5cf6`
- 辅助青色: `#06b6d4`
- 背景: `#0a0014`

### 调整时长

在 `Root.tsx` 中修改 `durationInFrames`：
```tsx
durationInFrames={360} // 6秒 @ 60fps
durationInFrames={480} // 8秒 @ 60fps
```

### 调整动画节奏

在 `IntroVideo.tsx` 中修改各个阶段的帧数范围。

## 💡 技术细节

- **Remotion**: 程序化视频生成，确保每次渲染结果一致
- **Three.js**: 3D渲染引擎
- **React Three Fiber**: Three.js的React封装
- **React Three Drei**: 辅助组件库（Camera, Environment等）

## 🔧 故障排除

### 渲染速度慢
- 降低帧率: 改为30fps
- 降低分辨率: 使用1280x720
- 减少粒子数量: 在ParticleSystem.tsx中调整count

### 视频太亮/太暗
- 调整Environment preset
- 调整各个光源的intensity
- 调整emissiveIntensity

### 需要更多3D细节
- 可以导入.glb/.gltf 3D模型替换简单的box geometry
- 使用useGLTF加载外部模型
