# 🎮 Intro视频集成指南

我已经为你创建了完整的intro视频集成组件。现在有两种使用方式：

## 方式1: 带Intro的完整体验（推荐）

### 步骤1: 切换到带intro的App

修改 `src/main.tsx`：

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppWithIntro from './AppWithIntro'  // 改用带intro的版本

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithIntro />
  </StrictMode>,
)
```

### 步骤2: 渲染intro视频

```bash
npm run intro:render
```

### 步骤3: 启动开发服务器

```bash
npm run dev
```

现在访问游戏时，会先播放8秒的霓虹跑酷intro，然后自动过渡到游戏！

## 功能特性

✅ **自动播放**: 页面加载后自动播放intro  
✅ **可跳过**: 2秒后显示跳过按钮  
✅ **优雅降级**: 视频加载失败时自动跳到游戏  
✅ **仅首次播放**: 使用sessionStorage记录，刷新页面不会重复播放  
✅ **响应式设计**: 适配移动端和桌面端  
✅ **加载动画**: 视频加载时显示霓虹紫色spinner

## 方式2: 保持原有游戏（无intro）

如果你想保持当前的游戏体验，不需要做任何改动。intro系统是完全独立的。

## 自定义选项

### 选项A: 每次都播放intro

修改 `AppWithIntro.tsx`：

```tsx
const [showIntro, setShowIntro] = useState(true)  // 移除sessionStorage检查
```

### 选项B: 使用localStorage持久化（整个浏览器会话只播放一次）

```tsx
const hasSeenIntro = localStorage.getItem('hasSeenIntro')
// ...
localStorage.setItem('hasSeenIntro', 'true')
```

### 选项C: 添加"重播intro"按钮

在游戏菜单中添加：

```tsx
<button onClick={() => setShowIntro(true)}>
  🎬 重播开场动画
</button>
```

### 选项D: 调整跳过按钮出现时间

在 `IntroScreen.tsx` 中修改：

```tsx
setTimeout(() => setCanSkip(true), 3000)  // 3秒后可跳过
```

### 选项E: 禁用跳过功能

移除 `IntroScreen.tsx` 中的整个跳过按钮块。

## 样式自定义

在 `IntroScreen.css` 中可以调整：
- 跳过按钮位置、颜色、大小
- 加载动画样式
- 过渡效果

## 测试checklist

- [ ] intro视频已渲染 (`npm run intro:render`)
- [ ] 首次访问自动播放intro
- [ ] 2秒后出现跳过按钮
- [ ] intro结束后自动进入游戏
- [ ] 点击跳过按钮立即进入游戏
- [ ] 刷新页面不再播放intro
- [ ] 视频加载失败时自动跳过
- [ ] 移动端显示正常

## 文件结构

```
src/
├── AppWithIntro.tsx          # 带intro的主入口
├── App.tsx                   # 原始游戏入口（保留）
├── components/
│   ├── IntroScreen.tsx       # Intro组件
│   ├── IntroScreen.css       # Intro样式
│   └── FestivalGame.tsx      # 游戏主体
└── intro/
    ├── IntroVideo.tsx        # Remotion视频定义
    ├── Shoe.tsx              # 3D鞋子
    ├── NeonTrack.tsx         # 霓虹赛道
    ├── ParticleSystem.tsx    # 粒子系统
    └── Root.tsx              # Remotion配置

public/
└── intro.mp4                 # 渲染后的视频文件
```

## 性能考虑

### 视频文件大小
- 默认质量: ~8-12MB
- 优化后: ~3-5MB

### 优化建议

1. **压缩视频**（如果文件太大）:
```bash
npm run intro:render -- --quality=80
```

2. **预加载视频**:
在 `index.html` 中添加：
```html
<link rel="preload" href="/intro.mp4" as="video" type="video/mp4">
```

3. **使用较低分辨率**（移动端）:
```bash
npm run intro:render -- --width=1280 --height=720
```

## 下一步建议

1. ✅ 渲染intro视频
2. ✅ 测试播放流程
3. 🎨 根据需要调整颜色和时间
4. 📱 在不同设备上测试
5. 🚀 部署到生产环境

如果有任何问题或需要调整，随时告诉我！
