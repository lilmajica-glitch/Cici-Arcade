# CiciArcade 钴蓝游戏场：网站验收

final result: passed

验收日期：2026-10-04（用户时区）。用户选择已展示的第 3 张渲染图，并授权制作动效、悬停放大与打卡组件。当前首页、大厅与实际游戏入口没有未解决的 P0、P1 或 P2 问题。原有数学游戏验收完整保存于 [design-qa.game-backlash.md](./design-qa.game-backlash.md)。

## 比较目标与归一化

- source visual truth path：`D:/workqu/dr.cici/docs/website-concepts-2026-10-04/cobalt-playground.png`。
- implementation screenshot path：`D:/workqu/dr.cici/docs/website-concepts-2026-10-04/qa/desktop-final.jpg`。
- 比较状态：首页顶部，入场动画结束、未悬停、两个真实游戏初始卡片、学习标签为本局成绩。吉祥物持续缓慢浮动，截图时位置会有小幅差异。
- 浏览器视口：1086 × 1448 CSS px；页面内容宽度测得 1071 px，无横向溢出。浏览器滚动条约占 15 px，截图接口输出 1070 × 1448（宽度有 1 px 采样舍入）。源图实际为 1086 × 1448，无浏览器滚动条槽。
- 概览共同显示高度 650 px，两张图高度均为 1448 px，因此采用相同缩放比例 650 / 1448。原始密度细节图不再缩放，使用相同裁切起点。源图与实现的 16 px 宽度差异明确保留，不宣称逐像素相同。
- full-view + focused-region comparison evidence：[最终共同对照](./docs/website-concepts-2026-10-04/qa/comparison-final.jpg)，由 [comparison-final.html](./docs/website-concepts-2026-10-04/qa/comparison-final.html) 在 1280 × 1300 视口渲染。概览和主标题区域在同一图像输入中共同检查。
- 用户授权的范围差异：增加完整学习交互、每日打卡、游戏活动记录、移动菜单与动效；为实际信息和组件调整下半页高度。概念图的占位小字改为真实游戏文案与数据。

## 视觉迭代

| 轮次 | 发现 | 优先级 | 修复与证据 |
| --- | --- | --- | --- |
| 1 | 中文 fallback 未提供目标字重，主标题与章节标题过细 | P1 | 本地 Noto Sans SC Variable、中文字体栈和主标题 900 字重；[第一轮对照](./docs/website-concepts-2026-10-04/qa/comparison-pass1.png) 与最终共同对照可直接比较 |
| 1 | 吉祥物标记靠近次要按钮，下滑提示落在浅色边缘 | P2 | 桌面吉祥物下移；下滑提示移至蓝色区域，提高文字对比度 |
| 2 | 手机端吉祥物标记与学习按钮重叠 | P2 | 390 px 首屏 624 px、吉祥物宽 280 px；320 px 首屏 592 px、吉祥物宽 252 px；[修复前](./docs/website-concepts-2026-10-04/qa/mobile390-pass1.jpg)、[修复后](./docs/website-concepts-2026-10-04/qa/mobile390-final.jpg) |
| 3 | 字重、按钮间距、品牌和游戏入口共同复核 | — | 最终共同对照中两行标题、C 吉祥物、弧面与浅色内容顺序成立；无重叠、丢失图片或横向溢出 |

生成的弧面背景与概念图的光照、弧线不同；使用真实游戏截图后细节密度不同。这些属于实现素材与新增内容的定稿差异，保留钴蓝主面、品牌蓝按钮、浅色画布和原 Logo 中的小面积彩色标记。

## 真实交互验证

- 开始游戏悬停：实际移动鼠标，测得 `.game-launch` 从无变换变为 `matrix(1.06, 0, 0, 1.06, 0, -2)`；[悬停截图](./docs/website-concepts-2026-10-04/qa/desktop-hover.jpg)。
- 学习回顾：展开口算示例得到 `7 + 8 = 15` 与凑十说明；下一项切换至错题回顾，ArrowRight 切换至下一局建议。组件有真实标签、tabpanel、按钮；[桌面学习](./docs/website-concepts-2026-10-04/qa/desktop-learning.jpg)、[窄屏学习](./docs/website-concepts-2026-10-04/qa/mobile320-learning.jpg)。
- 手动打卡：0 → 1 天；按钮变为禁用的「已打卡，明天见」。目标改为每周 5 天；刷新仍为 1 / 5、当天已打卡，不重复计数。[桌面打卡](./docs/website-concepts-2026-10-04/qa/desktop-checkin.jpg)、[手机打卡](./docs/website-concepts-2026-10-04/qa/mobile390-checkin.jpg)。
- 手机菜单：打开、Escape 关闭、再次打开并选择每日打卡后关闭；`aria-expanded` 随状态更新。
- 320、390、834、1086 和 1440 px 布局检查。320 / 390 / 834 内容宽度为 305 / 375 / 819 px，均等于文档 scrollWidth。窄屏七天圆点均在面板内；[320 首屏](./docs/website-concepts-2026-10-04/qa/mobile320-final.jpg)、[平板](./docs/website-concepts-2026-10-04/qa/tablet834-final.jpg)。
- 口算实际输入 20 个正确答案，包含 0、两位数、加法与减法；结算为 2000 分、100%、20 题。返回首页后为完成 1 局、连续 1 天、当天已打卡，卡片显示最近玩过、再来一局。
- 新生产预览跑酷完成 12 道判定，覆盖超时和键盘选择错误答案；基础复盘显示本局得分、0% 正确率、12 题、实际薄弱单词与错题记录。重玩清除报告并开始新局，立即返回首页仍仅记 1 局。未手动打卡的生产预览从 0 天变为自动打卡 1 天。[跑酷结算](./docs/website-concepts-2026-10-04/qa/neon-completed.jpg)、[实测记录](./docs/website-concepts-2026-10-04/qa/gameplay-evidence.json)。
- 新生产预览浏览器 error / warn 日志为空。

## 程序检查与实际限制

- `npm test`：11 个文件，80 项全部通过。新增 9 项覆盖会话去重、同日打卡、连续天数、周日与跨月、闰日、无答题局、损坏或禁用存储、目标保存。
- `npm run build`：主站与独立跑酷 TypeScript 检查、生产构建通过。仍提示原有跑酷 1.47 MB JavaScript 分块较大；主站入口约 192 KB、gzip 67 KB。
- `git diff --check` 通过，仅有 Windows 换行转换提示。
- 减少动态效果通过源码检查：GSAP matchMedia 与 CSS media query 关闭或缩短对应动画。当前浏览器能力未提供此系统设置模拟，未声称完成该分支的浏览器动态实测。
- 初始 4173 预览进程缓存旧配置，POST 学习总结返回空响应；未改动游戏或 API 来绕过问题。新 4174 预览确认 API 对 GET 返回规范 JSON 405，并通过完整跑酷结算验证基础复盘；5173 开发服务也确认 API 正常。
- 打卡为当前设备的真实本地记录，暂无账号与跨设备同步。在线 AI 未连接时沿用明确标注的基础复盘。

主要预览：`http://localhost:5173/`。实现说明见 [IMPLEMENTATION.md](./docs/website-concepts-2026-10-04/IMPLEMENTATION.md)。
