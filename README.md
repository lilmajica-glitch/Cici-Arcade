# CiciArcade

一个可以接入 AI 导师的开源教育游戏平台。1.0 包含统一首页、游戏大厅、两个现有游戏，以及结算后的成绩、错题、学习总结和导师提问。游戏保留原有玩法、音频与计分；数学游戏额外展示首次答对题数 × 100 的挑战积分。

| 页面 | 地址 |
| --- | --- |
| 首页 | `/` |
| 游戏大厅 | `/games` |
| Cici 小博士数学游戏 | `/games/math` |
| Neon Word Runner 单词跑酷 | `/games/neon` |

网站使用 React + Vite。两个游戏通过同源 iframe 接入，数学游戏继续使用 `src/main.tsx`，跑酷游戏继续使用 `neon-word-runner/` 内的 React + Phaser 项目。

## 原有数学游戏

把答案变成反击的儿童口算街机游戏。疯狂博士、大舌头出题机和彩色数字乐器键盘；一局 20 道题，音乐随着进度逐层长大。

MVP 已完成；2026-10-02 已升级为原创专注律动配乐《向前一点》。详情见 [MVP_COMPLETE.md](./MVP_COMPLETE.md)，当前音频研究与工作记录见 [研究依据](./docs/focus-music-research.md) 和 [工作留痕](./docs/worklog-2026-10-02-focus-music.md)。

2026-10-03 按用户选择的第 3 套视觉方案重构游戏：舌头递题、接数字、吞答案，正确答案使机器失控反噬博士。见 [新版设计与交互](./docs/design-options-2026-10-03/REVISION-03.md)、[实施记录](./docs/design-options-2026-10-03/IMPLEMENTATION.md) 和 [设计验收](./design-qa.md)。

2026-10-04 新增《星轨弹跳》《云朵接力》，每局从三首原创配乐中等概率随机选一首；研究与作曲方案见 [三首配乐设计](./docs/music-tracks-2026-10-04.md)。

## 运行

需要 Node.js ≥ 22.18，本次使用 Node.js 24.15。

```powershell
cd D:\workqu\dr.cici
npm ci
npm run dev
```

打开终端显示的 `http://localhost:5173/`。`npm ci` 会自动安装单词跑酷项目的依赖，根目录的一条 `npm run dev` 即可启动整个网站。手机与电脑连接同一网络后，可打开终端显示的 Network 地址；开发服务器已监听 `0.0.0.0`。

生产构建与本地预览：

```powershell
npm run build
npm run preview
```

产物在 `dist/`，包含网站、数学游戏和跑酷游戏的全部资源。开发和预览都带有同源 AI API。生产运行使用：

```powershell
npm run build
npm start
```

打开 `http://localhost:3000/`。Node 服务同时提供网站、游戏静态资源和 AI API，无需另外启动游戏。单纯静态托管不能运行 AI 接口。当前未发布到公网。

## 连接 AI 导师

```powershell
Copy-Item .env.example .env.local
```

在 `.env.local` 填写 `OPENAI_API_KEY`，然后重启服务。Key 只由服务端读取；不要使用 `VITE_` 前缀，不要把 Key 写进游戏代码。环境文件已加入 Git 忽略列表。

当前实现 OpenAI provider，默认模型 `gpt-4.1-mini`，可通过 `OPENAI_MODEL` 修改。调用使用 [OpenAI Responses API 的结构化输出](https://developers.openai.com/api/docs/guides/structured-outputs)，并设置 `store: false`。模型调用和返回解析集中在 `server/provider.ts`；以后接入 Claude 或 DeepSeek，只需在此增加相同返回格式的实现，游戏和页面不需要知道供应商。

没有 Key 时仍可以运行：接口返回本地基础复盘，页面明确标注“AI 导师尚未连接”，不会将固定规则建议冒充 AI 输出。有 Key 但请求失败时，页面保留成绩和错题，并提供重新生成总结按钮。

### 统一接口

- `POST /api/ai/summary`：发送完整本局记录，返回 `summary`、`weakPoints`、`suggestions`、`source`。
- `POST /api/ai/tutor`：发送 `{ session: 本局记录, question: "这道题怎么想？" }`，返回 `answer`、`source`。

本局记录示例（`accuracy` 为 0–100，`durationSeconds` 单位为秒）：

```json
{
  "sessionId": "math-example-1",
  "gameId": "math",
  "gameName": "Cici 小博士",
  "score": 1900,
  "accuracy": 95,
  "durationSeconds": 72,
  "answeredCount": 20,
  "wrongAnswers": [{
    "question": "7 + 8",
    "userAnswer": "14",
    "correctAnswer": "15",
    "knowledgePoint": "凑十法加法"
  }]
}
```

两个游戏只通过同源 `postMessage` 上报开局与结算，网站校验 iframe 来源及本局数据后请求自己的 API。数学准确率沿用首次答对率；跑酷准确率沿用单词答对率。数学错题保留被拒绝的数字输入，跑酷错题包含选择错误及超时。分数不跨游戏比较。

服务端校验 JSON、字段、24 KB 请求大小和来源，每个 IP 每分钟最多 20 次请求。模型调用 20 秒超时，不向前端返回供应商的原始错误或 Key。生产入口使用 Node 的原生 TypeScript 支持，需要 Node.js ≥ 22.18（推荐 24）；开发仍支持 ≥ 22.12。

## 单词跑酷

Neon Word Runner 位于 [`neon-word-runner/`](./neon-word-runner/README.md)，在统一网站的 `/games/neon` 即可玩。保留单独开发方式，需要 Node.js ≥ 22.12：

```powershell
cd neon-word-runner
npm ci
npm run dev
```

按终端显示的地址打开游戏。

## 操作

- 点击「开始挑战」，从左到右喂入答案数字，末位正确后自动完成本题。
- 支持数字键 0～9、Backspace 删除；触屏直接点击彩色键。两位数先输入十位，再输入个位。
- 每题答对固定扣博士 5 HP，20 题后结算。错误数字退回，已正确的位保留，可立即重试。
- 点击「提示」显示凑十或数数思路，不直接填入答案。
- 不计时，也不要求按拍作答。右上角可静音或减少动态效果。
- 音频在首次开始的用户手势中启用；数字键演奏五声音阶，音乐由 Web Audio 实时合成。
- 每局随机播放《向前一点》（108 BPM）、《星轨弹跳》（112 BPM）或《云朵接力》（100 BPM）；同一局不换曲、不加速，六阶段在小节边界增加配器。右上角音符按钮中可单独调整背景音乐，调到零仍保留答题音效。
- 开始页的「试听实验室音乐」可选择三首、播放各自的渐进试听并导出 WAV；生产构建包含 `music-preview.html`。本地入口为 [音乐试听](http://localhost:5173/music-preview.html)。

## 测试

```powershell
npm test
npm run typecheck
```

`npm run typecheck` 检查网站及两个游戏；`npm run build` 同时执行这些检查，再构建完整网站。`npm run test:watch` 可用于开发。

开发服务器还提供 [离线音频检查](http://localhost:5173/tools/audio-check.html)：点击运行，验证全部必需音色、混音和静音。此页面不会进入生产构建。

[整曲与六阶段检查](http://localhost:5173/tools/focus-check.html)：真实 OfflineAudioContext 验证三首各六阶段的完整十六小节、44.1/48kHz、响度连续性、密集反馈、静音与独立音乐音量。`docs/focus-audio-verification.json` 保留上一轮单曲验证记录。

## 工程文档

- [参考项目逆向分析](./docs/reverse-engineering.md)：数据流、合成音频、渐进反馈、数学与架构取舍、许可边界。
- [Cici 四层架构](./docs/cici-architecture.md)：游戏、数学、音频和 UI。
- [MVP 验收记录](./docs/qa.md)：初版自动测试、真实浏览器流程、屏幕适配和检查证据。
- [配乐升级工作留痕](./docs/worklog-2026-10-02-focus-music.md)：研究决策、39 个自动测试、真实整曲渲染、生产试听与截图。
- [机器反噬版实施记录](./docs/design-options-2026-10-03/IMPLEMENTATION.md)：原创素材、逐位判定、47 项自动测试、实际通关与手机截图。
- [最终设计验收](./design-qa.md)：四轮设计与实际画面的并排对照、修复记录和验收结果。

代码以独立新项目实现，没有引入参考项目的源码、角色、Logo、音乐或视觉素材。范围止于一个 Boss、一个场景、20 道加减法。
