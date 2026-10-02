# Cici 小博士 · MVP 验收

验收日期：2026-10-01（任务日期）。浏览器检查通过 Codex 内置 Chromium 浏览器的实际页面操作进行，使用产品数字键与键盘完成流程，没有注入答案或直接改写游戏状态。

2026-10-02 音乐已按新需求升级。本页保留 MVP 验收快照；当前的 39 个自动测试、整曲与六阶段渲染、生产试听和浏览器验收见 [本轮工作留痕](./worklog-2026-10-02-focus-music.md)。

## 自动检查

| 命令 | 结果 |
| --- | --- |
| `npm test` | 5 个测试文件、33 个测试全部通过 |
| `npm run build` | TypeScript strict 检查与 Vite 生产构建通过 |
| `npm run dev` | `http://localhost:5173/` 正常提供页面 |
| `npm run preview -- --port 4173 --strictPort` | 生产产物正常提供页面 |

测试覆盖：合法整数题域、加减正确性、减法无负数、无相邻重复、10 加 + 10 减、输入与判定、空答案与 0、错误不推进、20 次正确胜利、HP 与 combo 分离、连击重置、重复确认锁、旧 session 回调、音频延迟初始化、统计容错、音乐阈值、BPM 平滑、调度卡顿和 suspended 状态。

生产包：JS 260.90 kB / gzip 82.46 kB，CSS 22.58 kB / gzip 6.19 kB。React 在离散输入／反馈时更新，粒子与音乐拍点不进入 React 每帧状态；源码最大文件 152 行，没有大组件或游戏引擎依赖。

## 完整浏览器流程

**桌面，1365×900**

1. 点击开始，音频状态从 idle 进入 ready；题目出现后允许输入。
2. 第一题提交 99：答案清空，显示「再试一次，你可以的！」，HP 100、进度 0；音乐继续。
3. 数字键盘输入、Backspace 删除、Enter 确认均有效；数字 pad 获得焦点后 Enter 也能提交。
4. 用真实 UI 连续完成全部 20 题。每次扣 5 HP，最终为 0；阶段在完成第 4、8、12、15、17 题时升级，最后一题阶段为 6。
5. Victory 显示 95% 一次答对率、×20 最大连击。错误发生在第一题答对之前，因此此后 20 次正确仍可形成 ×20。
6. 返回开始／刷新后仍显示已完成 1 局、最佳连击 ×20。
7. 全局静音与恢复声音可操作；减少动态后 CSS 动画为 none、Canvas 隐藏，HP 和当前题不受影响。
8. 结束后读取 warn / error 日志，均为空。

**手机尺寸，390×844**

1. 刷新后开始新局，首次手势音频正常启用。
2. 连续点击 1、2、3，输入保持 12，验证两位上限；删除一次得到 1，删除两次清空。前导 0 归一化有效。
3. 点击彩色键和确认键完成全部 20 题，HP 100→0，Victory 显示 100% 与 ×20。
4. 点击「再玩一次」，HP 恢复 100、音乐阶段恢复 1、输入和 combo 重置。
5. 刷新后菜单显示已完成 2 局、最佳连击 ×20，证明记录保留；未完成的重玩不计入 gamesPlayed。
6. warn / error 日志均为空。

**生产产物，1280×720**

通过 4173 端口打开 `dist/` 的预览，完成开始、AudioContext 解锁、一道题的输入／确认和下一题；HP 为 95，音频状态 ready，没有 warn / error。生产页面不依赖 Vite 开发模块或测试入口。

## 响应式检查

| 视口 | 数字键高度 | 键盘底边 | 检查结果 |
| --- | --- | --- | --- |
| 1365×900 | 53px | 778px | 完整游戏与页头／页尾可见 |
| 1280×720 | 48px | 621px | 游戏可操作，尾部有少量纵向滚动 |
| 768×1024 | 53px | 843px | 居中固定宽度，不横向拉伸 |
| 390×844 | 51px | 732px | 题目和完整键盘同时可见 |
| 375×667 | 48px | 590px | 完整键盘可见，页面高度 667px |
| 320×568 | 48px | 590px | 保留触摸目标，可纵向滚动到末行 |
| 844×390 横屏 | 48px | 651px | 允许纵向滚动，无横向内容溢出 |

手机实机的浏览器工具栏、安全区和触摸行为仍需实机验收；上述是浏览器视口检查。

## 音频工程检查

开发入口：`/tools/audio-check.html`，脚本为 `tests/browser/audio-check.ts`。使用真实 OfflineAudioContext，在 48kHz 双声道下渲染两秒并计算峰值、RMS 和最后 100ms 残留。

16 项均通过：10 个必需音色（kick / snare / hat / bass / pluck / pad / sparkle / impact / riser / swoosh）、number / correct / wrong / victory，以及 fullMix / muted。

- 有声检查全部非静默，最后 100ms 无音频残留。
- 全部有声检查峰值低于 0.95；高密度混音样本峰值 0.22605，预留足够余量。
- 错误音峰值 0.01257，正确音峰值 0.15038；错误提示柔和且不会停止音乐。
- Master 静音渐变后渲染结果 peak / RMS 均为 0。
- 实时开始后的浏览器音频状态为 ready，无 Web Audio 异常。

实际结果见 [audio-verification.json](./audio-verification.json)。噪声音色每次随机生成，峰值会有小幅差异。波形验证不能代替不同手机扬声器／耳机的主观听感测试，也不是所有进度阶段整曲的响度测量。

## 动画、延迟与可读性

观察并捕获了机器 anticipation、粉色舌头伸出／缩回、题卡 overshoot、博士后仰／眼镜歪斜、-5、确认键 glow、舞台轻 punch、纸屑与星星。出题动画 620ms，输入在 240ms 开放；正确反馈 420ms，减少动态时用 70ms / 220ms 的过渡。错误无锁定等待。

数字在 pointerdown 即录入；声音在音频时间轴约 currentTime + 4ms 启动，不等待换题动画。这里记录的是实现调度值，硬件端到端延迟尚未测量。数字 pad 位置不受屏幕 punch 影响。

十个数字的实测文字／底色对比度为 5.12:1～7.93:1，均高于 4.5:1；按钮用文字／图标说明，不以颜色独立表达正确／错误。提供中文 accessible name、原生键盘操作、可见 focus、aria-live、HP progressbar、aria-pressed。

60 FPS 为工程目标：最多 96 个粒子、DPR ≤2、粒子按需 rAF、音源上限 96、noise buffer 复用、有限 AudioNode 生命周期、每帧不更新 Zustand。未进行真实低端手机帧率基准，不声称所有设备已达到 60 FPS。

## 截图证据

- [桌面游戏](./screenshots/desktop-playing.png)
- [桌面胜利](./screenshots/desktop-victory.png)
- [Boss 受击](./screenshots/boss-hit.png)
- [舌头吐题](./screenshots/tongue-dispense.png)
- [手机游戏](./screenshots/mobile-playing.png)
- [手机胜利](./screenshots/mobile-victory.png)
- [短屏手机](./screenshots/mobile-short.png)
- [平板](./screenshots/tablet-playing.png)

截图中的粒子／面板淡入属于捕获的动画帧。

## 已发现并修复

重复 React sibling key、数字 pad 聚焦后的 Enter 路径、长游戏区域导致键盘出屏、旧 session 时间线、慢音频初始化时的音乐进度回退，均已修复并针对相关行为验证。当前验收范围内没有阻塞性问题。
