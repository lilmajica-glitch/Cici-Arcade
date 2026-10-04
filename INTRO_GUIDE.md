# 🎬 霓虹跑酷 Intro 视频制作完成

## ✅ 已完成的内容

1. **完整的Remotion视频项目**
   - 8秒确定性动画（480帧 @ 60fps）
   - 霓虹紫色主题 + 少量青色点缀
   - 3D鞋子模型与动画
   - 三条霓虹赛道
   - 粒子系统和光效
   - 未来城市剪影
   - 光门过渡效果

2. **核心组件**
   - `IntroVideo.tsx` - 主时间轴控制
   - `Shoe.tsx` - 3D鞋子（热身、蓄力、起跑动画）
   - `NeonTrack.tsx` - 霓虹赛道和城市背景
   - `ParticleSystem.tsx` - 动态粒子特效
   - `Root.tsx` - Remotion配置入口

3. **工具命令**
   - `npm run intro:preview` - 实时预览和编辑
   - `npm run intro:render` - 渲染MP4视频

## 🚀 快速开始

### 步骤1: 预览视频（推荐）

Remotion Studio已经在运行：**http://localhost:3002**

在浏览器中打开查看实时预览，可以：
- 拖动时间轴查看每一帧
- 实时调整参数
- 查看动画细节

### 步骤2: 渲染最终视频

当你满意预览效果后，渲染成MP4：

```bash
npm run intro:render
```

这会生成 `public/intro.mp4` 文件（约5-15MB）。

### 步骤3: 预览渲染结果

启动开发服务器：

```bash
npm run dev
```

然后访问：**http://localhost:5173/intro-preview.html**

## 🎨 当前视觉效果

### 颜色方案
- **主色**: 霓虹紫 `#a855f7`, `#8b5cf6`
- **辅助色**: 电子青 `#06b6d4`
- **背景**: 深空黑 `#0a0014`

### 动画时间轴（8秒）
```
00:00 ├─ 鞋子淡入
01:50 ├─ 脚踝旋转热身（紫色光弧）
03:00 ├─ 蓄力停顿（地面光圈）
04:00 ├─ 爆发起跑（粒子爆发）
05:50 ├─ 赛道显现（三轨+城市）
07:00 └─ 冲入光门（强光过渡）
```

## 🎯 后续集成建议

### 方案A: 独立intro页面

创建 `IntroScreen.tsx`：

```tsx
import { useState } from 'react'
import { FestivalGame } from './components/FestivalGame'

export default function App() {
  const [showIntro, setShowIntro] = useState(true)

  if (showIntro) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0014' }}>
        <video
          autoPlay
          muted
          playsInline
          onEnded={() => setShowIntro(false)}
          src="/intro.mp4"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    )
  }

  return <FestivalGame />
}
```

### 方案B: 可跳过的intro

```tsx
const [showIntro, setShowIntro] = useState(true)

{showIntro && (
  <div className="intro-container">
    <video
      autoPlay
      muted
      playsInline
      onEnded={() => setShowIntro(false)}
      src="/intro.mp4"
    />
    <button 
      onClick={() => setShowIntro(false)}
      className="skip-button"
    >
      跳过 ⏭
    </button>
  </div>
)}
```

### 方案C: 仅首次播放

```tsx
const [hasSeenIntro] = useState(() => 
  localStorage.getItem('hasSeenIntro') === 'true'
)

useEffect(() => {
  if (!hasSeenIntro) {
    localStorage.setItem('hasSeenIntro', 'true')
  }
}, [])
```

## ⚙️ 自定义调整

### 🎨 修改颜色

在各组件中搜索并替换：
- 紫色: `#a855f7` → 你的颜色
- 青色: `#06b6d4` → 你的颜色
- 背景: `#0a0014` → 你的颜色

### ⏱️ 修改时长

`Root.tsx`:
```tsx
durationInFrames={360}  // 6秒
durationInFrames={480}  // 8秒
durationInFrames={600}  // 10秒
```

`IntroVideo.tsx` 中同步调整各阶段的帧数范围。

### 🎥 修改分辨率

渲染时指定：
```bash
remotion render src/intro/Root.tsx NeonRunnerIntro public/intro.mp4 --width=1280 --height=720
```

或在 `Root.tsx` 中修改：
```tsx
width={1280}
height={720}
```

### 🔧 性能优化

**渲染慢的解决方案：**

1. 降低粒子数量（`ParticleSystem.tsx`）：
```tsx
const count = 200  // 从500改为200
```

2. 降低帧率（`Root.tsx`）：
```tsx
fps={30}  // 从60改为30
```

3. 使用较低分辨率先预览
4. 多线程渲染：
```bash
remotion render src/intro/Root.tsx NeonRunnerIntro public/intro.mp4 --concurrency=4
```

## 📦 导出选项

### 高质量（推荐用于最终版本）
```bash
npm run intro:render -- --quality=100
```

### 平衡版本（较小文件）
```bash
npm run intro:render -- --quality=80
```

### 快速预览版本
```bash
npm run intro:render -- --quality=50 --scale=0.5
```

## 🎨 进阶定制

### 使用真实3D鞋模型

1. 准备 `.glb` 或 `.gltf` 3D模型
2. 放入 `public/models/` 目录
3. 在 `Shoe.tsx` 中使用：

```tsx
import { useGLTF } from '@react-three/drei'

export const Shoe = (props) => {
  const { scene } = useGLTF('/models/shoe.glb')
  return <primitive object={scene} {...props} />
}
```

### 添加音效

在 `IntroVideo.tsx` 中：

```tsx
import { Audio } from 'remotion'

<Audio src="/sounds/intro-whoosh.mp3" />
```

### 添加文字动画

```tsx
import { interpolate } from 'remotion'

const textOpacity = interpolate(frame, [60, 90], [0, 1])

<div style={{ opacity: textOpacity }}>
  <h1>开始你的跑酷之旅</h1>
</div>
```

## 🐛 常见问题

### Q: Remotion Studio启动失败
A: 检查端口占用，或手动指定端口：
```bash
remotion studio src/intro/Root.tsx --port=8000
```

### Q: 渲染报错 "ENOENT"
A: 确保 `public/` 目录存在：
```bash
mkdir -p public
```

### Q: 视频太暗
A: 在各组件中增加光源的 `intensity`

### Q: 粒子太多/太少
A: 调整 `ParticleSystem.tsx` 中的 `count` 值

### Q: 需要更快的预览
A: 降低fps到30或使用较低分辨率

## 📚 相关文档

- [Remotion 官方文档](https://www.remotion.dev/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Three.js 文档](https://threejs.org/docs/)

## 🎉 完成！

你现在有了一个完全可定制的霓虹跑酷intro视频。视频最后1-2秒已经设计为向前冲刺、显露三条赛道和光门，可以完美过渡到你的Three.js跑酷游戏主体。

**下一步:**
1. 在 http://localhost:3002 查看实时预览
2. 调整你喜欢的参数
3. 运行 `npm run intro:render` 生成最终视频
4. 将视频集成到游戏开场
