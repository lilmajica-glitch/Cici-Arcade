# Cici 小博士

把答案变成攻击的儿童口算街机游戏。原创泡泡博士、吐题机器和彩色数字乐器键盘；一局 20 道题，音乐随着攻击逐层长大。

MVP 已完成。详情见 [MVP_COMPLETE.md](./MVP_COMPLETE.md)，实际验收见 [docs/qa.md](./docs/qa.md)。

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

## 测试

```powershell
npm test
npm run typecheck
```

`npm run build` 同时执行 TypeScript 检查。`npm run test:watch` 可用于开发。

开发服务器还提供 [离线音频检查](http://localhost:5173/tools/audio-check.html)：点击运行，验证全部必需音色、混音和静音。此页面不会进入生产构建。

## 工程文档

- [参考项目逆向分析](./docs/reverse-engineering.md)：数据流、合成音频、渐进反馈、数学与架构取舍、许可边界。
- [Cici 四层架构](./docs/cici-architecture.md)：游戏、数学、音频和 UI。
- [验收记录](./docs/qa.md)：33 个自动测试、真实浏览器流程、屏幕适配和检查证据。

代码以独立新项目实现，没有引入参考项目的源码、角色、Logo、音乐或视觉素材。范围止于一个 Boss、一个场景、20 道加减法。
