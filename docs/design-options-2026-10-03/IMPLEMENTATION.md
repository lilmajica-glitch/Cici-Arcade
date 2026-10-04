# 机器反噬版：实施与验收

设计起始：2026-10-03；完成与验收：2026-10-04。视觉目标：[用户选定方案 3 的最终反噬修订](./concept-03-v3-machine-backlash.png)。当前本地试玩：`http://localhost:4173/`；开发入口：`http://localhost:5173/`。

## 结果

疯狂博士以自己的大舌头机器出题。玩家逐位喂答案，正确答案使机器失控，喷射泡泡与电火花反噬博士。20 次正确答案后博士认输。

- [桌面反噬成品图](./implementation-backlash-final.jpg)
- [手机反噬](./production-mobile-backlash-final.jpg)
- [320 像素手机答题](./production-small-phone-final.jpg)
- [平板首页](./production-tablet-menu-final.jpg)
- [桌面首页](./production-menu-desktop-final.jpg)
- [桌面结算](./production-victory-desktop-final.jpg)
- [手机结算](./production-victory-mobile-final.jpg)
- [设计与实现最终并排对照](./qa-comparison-pass4.jpg)

## 代码

`src/components/FestivalGame.tsx` 和 `src/styles/festival.css` 实现新舞台、舌面题纸、数字飞行、博士表情与生命条、六阶段音乐、连击、键盘、首页和结算。`src/App.tsx` 接入新的游戏表层，继续使用原有控制器与音频生命周期。

`GameEngine.feedDigit` 逐位验证答案，错误位不改变已正确的前缀；末位正确调用原有答题结算。`GameController.feed` 触发数字音效、错误反馈、音乐进度和反噬演出，通常 1300 ms 后换题，减少动态时为 360 ms。已有的会话守卫与取消回调避免重开后受上一局的定时器影响。

键盘数字键直接喂入，Backspace 删除，按键与键盘使用相同判定。新游戏无需提交按钮。原有完整答案接口保留给历史组件与测试。

## 素材

素材均由内置 imagegen 制作并实际查看，UI 使用分层素材，题目和数字仍为真实文字。

| 文件，位于 public/assets/festival/ | 用途 |
| --- | --- |
| laboratory-stage-clean.png | 无角色的舞台背景 |
| flask-band.png | 三个原创乐器助手 |
| tongue-machine.png | 珊瑚色大舌头出题机 |
| tongue-board.png | 连续舌根、题纸、卷舌尖 |
| doctor-idle.png / doctor-backlash.png | 博士怪笑与反噬后的惊慌表情 |
| backlash-burst.png | 朝博士方向的泡泡、蒸汽与电火花 |
| answer-bubble.png | 单位数字与嘴内整份答案的泡泡 |
| combo-badge.png | 粉色连击徽章 |
| baloo2-latin.ttf / OFL-Baloo2.txt | 自托管 Baloo 2 数字字体与许可 |

`laboratory-stage.png` 为保留的初版舞台素材；运行页面使用 clean 版本与独立助手。标准按钮图标来自 `@phosphor-icons/react`，数字字体采用 Baloo 2，中文继承系统中文字体。

## 自动检查

`npm test`：7 个测试文件，47 项通过。新增 8 项输入与控制器测试，覆盖两位数自动完成、错误前缀保留、零与错误前导零、删除与提示、20 题闭环、反噬时长、减少动态与回调取消、胜利只记录一次。原有数学、状态、持久化与音频相关测试继续通过。

`npm run build`：TypeScript 全项目检查与 Vite 生产构建通过。最终游戏 JS 296.67 kB（gzip 92.05 kB）、CSS 22.95 kB（gzip 6.28 kB），生产目录同时保留 `music-preview.html`。

## 真实浏览器检查

- [生产流程一](./browser-production-playthrough.json)：20 题，首题错误后通过键盘立即重试，结算 20 题、最高连击 20、首次答对 95%、博士 0 HP。
- [最终构建流程](./production-final-playthrough.json)：20 题全部正确，生命值逐次下降至 0，结算最高连击 20、首次答对 100%，六种乐器全部点亮。重开后生命值恢复 100、题号回到 1。
- 两位答案错误重试：已输入正确十位，错误个位退回，十位保留；删除可清除前缀。证据：[手机重试](./implementation-mobile-prefix-retry.jpg)。
- 提示、静音、音乐音量 0 与 75%、减少动态、键盘数字与删除、首页返回均经真实 UI 操作。
- 1487 × 1058、默认 1280 × 720、768 × 1024、390 × 844 与 320 × 740 已查看。320 宽下页面无横向滚动，最小按钮约 44 CSS px，数字键更大；所有图像完整载入，Baloo 2 载入成功。
- 最终生产浏览器整个通关与重开流程的 warning/error 日志为空。

## 工作区说明

开始时已有其他未提交的页面与主题改动；保留其文件。工作期间另一个任务加入了开场模块与相关依赖，未接入本次主游戏入口。该模块曾阻塞全项目 TypeScript 检查，因此只做最小构建修复：在 `src/intro/NeonTrack.tsx` 删除未使用的导入、引用和 MeshBasicMaterial 不支持的 emissive 属性；在 `src/intro/Shoe.tsx` 删除未使用的参数解构，保留接口。没有重构其功能。

没有提交、推送或公网发布。当前交付是本地可玩版本、源代码、设计稿与验收证据。
