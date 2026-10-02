# Cici 小博士 · MVP_COMPLETE

状态：**MVP 已完成。下文保留 2026-10-01 的验收快照；2026-10-02 已按新需求升级音乐，当前变更与验证见 [工作留痕](./docs/worklog-2026-10-02-focus-music.md)。**

已按「逆向文档 → 架构文档 → 项目骨架 → 数学与测试 → 状态 → UI → 核心音频 → 进阶音乐 → 动画 → polish」完成独立实现。参考项目克隆保留在工作区外，没有复制其源码、角色、Logo、旋律或视觉素材。

## 1. 当前完成了什么

- 一个原创泡泡博士、一个玩具实验室场景、一套吐题机器、一套 3×4 彩色数字乐器键盘。
- 开始即进入 20 题，10 道加法、10 道减法混合；前四题热身，操作数与答案均在 0～20，减法无负数，不连续重复同一道题。
- 完整输入、删除、确认、判定、下一题、Victory、再玩一次和回到开始。
- 真实进度以 questionIndex / totalQuestions 为准；HP 100，每题固定 -5。Combo 只增强演出，不缩短练习。
- 正确反馈包含合成音效、博士受击／眼镜歪斜、舞台轻 punch、粒子、-5、按钮 glow、combo 与音乐 accent。
- 错误反馈为 soft low boop、轻微题卡晃动、清空答案与温和重试提示，音乐和题目进度保持连续。
- Web Audio 实时合成十个必需音色；数字固定五声音阶，六阶段编曲，112→128 BPM 平滑增长、最后一题 riser、胜利和弦／impact／sparkle。
- 桌面／平板／手机与短屏样式；静音、减少动态、键盘支持及基础 ARIA。
- localStorage 只保存 bestAccuracy、bestCombo、gamesPlayed。准确率定义为一次答对题数 / 20。
- 33 个自动测试通过，TypeScript 与生产构建通过，桌面和手机尺寸各完整通关一局，没有明显控制台错误。

验收详情与证据见 [docs/qa.md](./docs/qa.md)。

## 2. 项目架构

| 层 | 目录 | 核心边界 |
| --- | --- | --- |
| Math Engine | `src/math/` | 有限合法题池、去重、生成一局、判答案 |
| Game Engine | `src/game/` | 纯状态转换、Zustand 快照、HP／combo、有限反馈时间线 |
| Audio Engine | `src/audio/` | 合成器、总线、调度、原创乐谱与 SFX；对象独立于 Zustand |
| UI | `src/components/`、`src/styles/` | React、原创 SVG、CSS 动画和数字输入 |

`src/animation/` 管理有上限的 Canvas 粒子和轻 shake；`src/hooks/` 管理输入、音频生命周期与局部音乐拍点；`src/utils/persistence.ts` 负责三项本地统计的校验／容错。

技术栈为 Vite、TypeScript、React、Zustand、Web Audio、CSS、SVG、有限 Canvas、localStorage 与 Vitest。没有后台、数据库、登录或传统游戏引擎。最大源码文件 152 行。

完整设计见 [docs/cici-architecture.md](./docs/cici-architecture.md)，参考机制分析见 [docs/reverse-engineering.md](./docs/reverse-engineering.md)。

## 3. 如何运行

需要 Node.js ≥22.12（已验证 24.15）。在项目目录执行：

```powershell
npm ci
npm run dev
```

打开 `http://localhost:5173/`，点击「开始游戏」。首次点击才创建并解锁 AudioContext。手机同网络试玩使用终端输出的 Network 地址。

```powershell
npm run build
npm run preview
```

`dist/` 是可静态托管的生产文件。当前提供本地运行与预览，没有公网部署。

## 4. 如何测试

```powershell
npm test
npm run typecheck
```

最后结果：5 个测试文件，33 个测试全部通过；`npm run build` 已通过 TypeScript 检查和生产打包。

在开发服务器打开 `/tools/audio-check.html`，点击「运行离线音频检查」，16 项真实 Web Audio 离线渲染检查全部通过；此入口不包含在生产构建。

手动验收：故意答错后重试、用 0／删除／Enter、连续 20 次答对、观察每次 -5 与六阶段音乐、Victory／重玩、静音／减少动态、手机短屏与控制台日志。既有检查结果和截图见 [docs/qa.md](./docs/qa.md)。

## 5. 哪些文件最重要

| 文件 | 用途 |
| --- | --- |
| [QuestionGenerator.ts](./src/math/QuestionGenerator.ts) | 合法题域、题序和答案判定 |
| [GameEngine.ts](./src/game/GameEngine.ts) | 纯规则、权威进度和胜利条件 |
| [GameController.ts](./src/game/GameController.ts) | 输入、音频事件、反馈时间线和一次保存 |
| [gameStore.ts](./src/game/gameStore.ts) | Zustand 与 UI 的状态接口 |
| [AudioEngine.ts](./src/audio/AudioEngine.ts) | 手势解锁、音频生命周期和独立对象 |
| [Synth.ts](./src/audio/Synth.ts)、[Mixer.ts](./src/audio/Mixer.ts) | 音色、音量、duck 和压缩／限制 |
| [Sequencer.ts](./src/audio/Sequencer.ts)、[MusicEngine.ts](./src/audio/MusicEngine.ts) | 音频时钟、平滑 BPM 和分层编曲 |
| [Boss.tsx](./src/components/Boss.tsx)、[QuestionMachine.tsx](./src/components/QuestionMachine.tsx) | 原创角色和吐题机器 |
| [NumberPad.tsx](./src/components/NumberPad.tsx) | pointerdown 输入、原生 click 和 pad 反馈 |
| [motion.css](./src/styles/motion.css)、[responsive.css](./src/styles/responsive.css) | 动画、减少动态、响应式 |
| [persistence.ts](./src/utils/persistence.ts) | 三项统计白名单与容错 |
| [tests/](./tests/) | 核心规则和时间线回归检查 |

## 6. 下一阶段可以扩展什么

等待新的明确需求后，可先进行真实儿童试玩，校准题目分布、字号和反馈节奏；在 iOS Safari／低端 Android 上测量触摸、音频端到端延迟与帧率，进一步优化当前一套音乐和场景。当前不继续增加课程、角色、商城或其他系统。

## 7. 当前已知问题与边界

- 已完成 Chromium 的桌面／手机尺寸验证；未进行手机实机或 iOS Safari 验收，尚不能确认所有普通手机都达到 60 FPS。
- 极短窗口和横屏允许纵向滚动，以保留至少 48px 的触摸目标；不强行裁切键盘。
- 音色已通过波形／混音检查，实际扬声器、耳机听感和硬件端到端延迟仍待实机校准。
- 音频不可用时可继续无声游戏；localStorage 不可用时统计仅不保存，不阻塞游戏。当前局不会跨刷新恢复。

当前验收范围内没有已知阻塞性问题。MVP 开发到此结束。
