# CiciArcade 网站视觉探索计划

日期：2026-10-04（用户时区 America/Los_Angeles）

## 本轮目标

为现有 CiciArcade 网站优化首页视觉。先交付计划，再生成三张独立的首页渲染图，供用户选择方向。本轮止于视觉选择；没有修改网站应用代码。

用户硬约束：使用提供的蓝色 C 吉祥物作为品牌依据；参考教育游戏平台；避开大众儿童配色与风格；三个方向应有实质区别。

默认受众：现有数学街机与英语跑酷的学生玩家，以及希望理解学习价值的家长。核心行为是选一个游戏立即开始，次要行为是理解通关后的学习反馈。

## 已查看的依据

- 用户 Logo：D:/欢喜团/Glossy Blue CiciArcade Mascot.png。
- 现有首页图：D:/workqu/dr.cici/artifacts/ciciarcade/home.png。
- 页面与内容：src/arcade/ArcadeApp.tsx、games.ts、arcade.css。
- 已有内容：Cici 小博士 / 疯狂博士大作战；Neon Word Runner / 霓虹单词跑酷；成绩、错题、下一局建议。
- 参考 [Brilliant 数学](https://brilliant.org/math/) 的互动练习与即时反馈思路。
- 参考 [Mathigon](https://mathigon.org/) 的探索、操作与活动组织思路。
- 上述外部页面用于学习交互原则；未作为像素复制或视觉截图依据。两张本地图将实际作为 Image Gen 输入。

## 设计原则

1. Logo 的蓝色、C 形轮廓与光泽是品牌锚点；珊瑚、黄、薄荷色保留在 Logo 内，不扩大为页面主配色。
2. 首页遵循导航 → 主张与入口 → 两个实际游戏 → 学习反馈 → 行动入口的路径。
3. 使用成熟排版、两行宽标题、足够留白与清楚的按钮对比度。
4. 卡片只承载两个游戏对象；学习价值以文字、分隔线和真实反馈类别呈现。
5. 不添加虚构的游戏、用户数量、排行榜、评价、合作机构、登录、订阅或未来功能。
6. 三张使用相同产品内容与目标画布 1440 × 1920，分别改变版式、材质与氛围。
7. 图片是静态概念渲染，动效仅在计划中定义，待用户选定后再实现。

## 三个方向

| 方向 | 视觉 | 首屏结构 | 字体 | 主要区别 |
| --- | --- | --- | --- | --- |
| 午夜街机 | 深墨蓝与冷光蓝，细微颗粒、雕塑式吉祥物 | Artistic Asymmetry | Outfit + 中文无衬线 | 非对称首屏、横向展开的双游戏画廊、暗色沉浸感 |
| 纸感探索馆 | 暖白纸面、墨色与蓝色，柔和自然阴影 | Editorial Split | Cabinet Grotesk + 中文无衬线 | 编辑式分栏、展品式游戏入口、清晰的学习反馈 |
| 钴蓝游戏场 | 钴蓝大面、白色宽标题、下半页浅色画布 | Cinematic Center | Geist + 中文无衬线 | 居中大字与吉祥物、强图形节奏、蓝白章节切换 |

## gpt-taste 设计预检

<design_plan>

Python RNG：实际运行 Python random.Random(seed)，种子来自原始中文请求正文字符数，seed = 80。英雄版式采用无放回抽样，保证三个方向结构不同。下面是三行确定的输出：

```text
seed=80 | MIDNIGHT ATELIER | Hero=Artistic Asymmetry | Font=Outfit | Components=Infinite Marquee, Inline Typography Images, Horizontal Accordions | GSAP=Image Scale & Fade, Scrubbing Text Reveal
seed=80 | PAPER LAB | Hero=Editorial Split | Font=Cabinet Grotesk | Components=Inline Typography Images, Horizontal Accordions, Feedback Carousel | GSAP=Image Scale & Fade, Scrubbing Text Reveal
seed=80 | COBALT PLAYGROUND | Hero=Cinematic Center | Font=Geist | Components=Inline Typography Images, Feedback Carousel, Horizontal Accordions | GSAP=Image Scale & Fade, Scroll Pinning
```

AIDA：三图包含 Navigation；Attention 为宽主视觉；Interest 为两个游戏；Desire 为学习反馈；Action 为进入游戏大厅与页尾入口。

Hero 数学：首屏标题固定为“把练习，”和“玩成冒险。”两行。1440px 画布，两侧 80px 留白，内容宽 1280px；分栏方向左侧至少 580px，72px 字号下最长 5 个汉字约 360px，满足两行。未来实现对应 max-w-6xl，并按断点调整字体。没有标题贴纸、刷屏标签或统计数字。

Bento 密度：现有只有两个游戏，优先保留双列。1280px 内容宽减 24px 间隔，分为两列各 628px；占格为 1 + 1 = 2 个格 / 2 个总格，无空白。非等宽画廊也完整覆盖 1280px。未来若使用 CSS Grid，应用 grid-auto-flow: dense；不为了凑 Bento 添加第三个游戏。

组件取舍：水平手风琴用于两个游戏的展开预览；内联图像放在下方学习文字而非首屏；轮播用于成绩 / 错题 / 建议，不伪造用户评价；午夜方向的文字流只使用 PLAY / LEARN / REPLAY，不伪造合作伙伴。

动效：本轮定义图像缩放与淡出、文字逐步揭示、标题滚动固定。选择后采用 GSAP / ScrollTrigger 实现，并提供减少动态效果的可访问体验。渲染图本身不声称已实现这些动画。

标签与按钮：无 SECTION 01 / QUESTION 05 等标签，无表情；暗底白字、蓝底白字、浅底墨色；正文目标 16px。页首 Logo 使用原角色，页面不使用 Inter 或儿童泡泡字体。

</design_plan>

## 交付与选择

- 使用内置 Image Gen，每个方向独立调用；不把三图合并成一张。
- 保存独立渲染图、完整提示词与结果清单。
- 可见结果展示后再按展示顺序编号。
- 用户选择后，围绕所选渲染图优化现有网站，并补充响应式与实际动效。
