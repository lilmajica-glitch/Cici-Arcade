# Cici 小博士

把答案变成攻击的儿童口算街机游戏。原创泡泡博士、吐题机器和彩色数字乐器键盘；一局 20 道题，音乐随着攻击逐层长大。

MVP 已完成；2026-10-02 已升级为原创专注律动配乐《向前一点》。详情见 [MVP_COMPLETE.md](./MVP_COMPLETE.md)，当前音频研究与工作记录见 [研究依据](./docs/focus-music-research.md) 和 [工作留痕](./docs/worklog-2026-10-02-focus-music.md)。

## 运行

需要 Node.js ≥ 22.12，本次使用 Node.js 24.15。

```powershell
cd D:\workqu\dr.cici
npm ci
npm run dev
```

打开终端显示的 `http://localhost:5173/`。手机与电脑连接同一网络后，可打开终端显示的 Network 地址；开发服务器已监听 `0.0.0.0`。

生产构建与本地预览：

```powershell
npm run build
npm run preview
```

产物在 `dist/`，可以部署到提供静态文件的站点。当前未发布到公网。

## 操作

- 点击「开始游戏」，输入答案，再按 ✓ 发射。
- 支持数字键 0～9、Backspace 删除、Enter 确认；触屏直接点击彩色键。
- 每题答对固定扣 5 HP，20 次正确攻击进入 Victory。答错清空答案、温和提示，可立即重试。
- 不计时，也不要求按拍作答。右上角可静音或减少动态效果。
- 音频在首次开始的用户手势中启用；数字键演奏五声音阶，音乐由 Web Audio 实时合成。
- 原创配乐保持 108 BPM，鼓、贝斯、电钢琴在开局就有律动；六阶段在小节边界增加配器。右上角可单独调整背景音乐，调到零仍保留答题音效。
- 开始页的「试听新配乐」可播放 54 秒渐进试听并导出 WAV；生产构建包含 `music-preview.html`。本地入口为 [音乐试听](http://localhost:5173/music-preview.html)。

## 测试

```powershell
npm test
npm run typecheck
```

`npm run build` 同时执行 TypeScript 检查。`npm run test:watch` 可用于开发。

开发服务器还提供 [离线音频检查](http://localhost:5173/tools/audio-check.html)：点击运行，验证全部必需音色、混音和静音。此页面不会进入生产构建。

新增 [整曲与六阶段检查](http://localhost:5173/tools/focus-check.html)：真实 OfflineAudioContext 验证每阶段八小节、44.1/48kHz、响度连续性、密集反馈、静音与独立音乐音量，实际结果保存在 `docs/focus-audio-verification.json`。

## 工程文档

- [参考项目逆向分析](./docs/reverse-engineering.md)：数据流、合成音频、渐进反馈、数学与架构取舍、许可边界。
- [Cici 四层架构](./docs/cici-architecture.md)：游戏、数学、音频和 UI。
- [MVP 验收记录](./docs/qa.md)：初版自动测试、真实浏览器流程、屏幕适配和检查证据。
- [配乐升级工作留痕](./docs/worklog-2026-10-02-focus-music.md)：研究决策、39 个自动测试、真实整曲渲染、生产试听与截图。

代码以独立新项目实现，没有引入参考项目的源码、角色、Logo、音乐或视觉素材。范围止于一个 Boss、一个场景、20 道加减法。
