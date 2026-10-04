# 🚀 Cici 小博士 - 快速启动指南

## 🎮 立即开始

```bash
# 1. 启动开发服务器
npm run dev

# 2. 浏览器访问
# http://localhost:5173

# 3. 开始游戏！
```

---

## 📚 文档导航

| 文档 | 用途 | 适合人群 |
|------|------|---------|
| [GAME_REDESIGN.md](./GAME_REDESIGN.md) | 📖 完整重构说明 | 开发者、产品经理 |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | ✅ 功能测试清单 | 测试人员、开发者 |
| [BEFORE_AFTER.md](./BEFORE_AFTER.md) | 📊 前后对比分析 | 所有人 |
| 本文档 | 🚀 快速启动 | 所有人 |

---

## 🎯 首次体验建议

### 第一局游戏：观察视觉变化
1. **开始** → 注意背景的实验室装饰（烧杯、试管、电路）
2. **前 3 题** → 答对，看基础粒子效果
3. **第 4 题** → 故意答错，看鼓励反馈（温和的橙色）
4. **第 5-10 题** → 连续答对，观察：
   - Boss 表情变化（庆祝→兴奋）
   - 场景装饰开始动起来
   - 粒子增加气泡效果
5. **第 11-20 题** → 继续连击，观察：
   - 试管开始发光
   - 出现电火花粒子
   - 所有元素随节拍律动
6. **胜利** → 享受超大粒子爆发！

**预计游戏时长**: 3-5 分钟
**推荐体验**: 开启音乐 🔊

---

## 🎨 核心亮点速览

### 1️⃣ 科学实验室主题 🧪
- 烧杯、试管、电路板、仪表盘
- 随游戏进度变得更活跃

### 2️⃣ 泡泡博士的表情秀 🎭
- 6 种不同表情
- 答错不骂人，只鼓励

### 3️⃣ 越玩越精彩 🌈
- 6 个强度等级
- 从平静到爆发的渐进体验

### 4️⃣ 粒子魔法 ✨
- 彩带、星星、气泡、电火花
- 不同阶段不同效果

### 5️⃣ 音乐可视化 🎵
- 全场景随节拍律动
- Boss、按钮、装饰都会"跳舞"

---

## 🛠️ 开发者快速参考

### 启动项目
```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run preview      # 预览构建结果
npm run typecheck    # TypeScript 检查
```

### 关键文件
```
src/
├── components/
│   ├── LabEnvironment.tsx      # 实验室装饰
│   ├── Boss.tsx                # Boss 组件（多表情）
│   └── GameScreen.tsx          # 主游戏场景
├── game/
│   └── labIntensitySystem.ts   # 强度等级系统
├── styles/
│   ├── lab.css                 # 实验室主题样式
│   ├── scene.css               # 场景样式（试管气泡）
│   └── color.css               # 颜色系统
└── animation/
    └── particles.ts            # 粒子系统（4 种类型）
```

### 关键概念

#### 强度等级系统
```typescript
// labIntensitySystem.ts
getLabIntensity(questionIndex, combo)
// 返回: { level: 1-6, color, bubbleCount, ... }
```

#### CSS 变量驱动
```css
/* 节拍变量 */
--beat: 0-1        /* 音乐节拍强度 */

/* 实验室颜色 */
--lab-chemical: #38BDF8
--lab-energy: #6EE7B7
--lab-warning: #E9A568
```

#### 粒子类型
```typescript
type: 'confetti' | 'star' | 'bubble' | 'spark'
```

---

## 🎯 测试要点

### 快速验证清单
- [ ] 实验室装饰显示正常
- [ ] Boss 表情会变化（至少看到 3 种）
- [ ] 答错时是鼓励而非警告
- [ ] 场景随进度变化明显
- [ ] 高阶段出现气泡和电火花粒子
- [ ] 开启音乐能看到节拍效果

### 详细测试
请参考 [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

## 🐛 常见问题

### Q: 端口被占用怎么办？
```bash
# Windows
netstat -ano | findstr :5173
taskkill /F /PID <进程ID>

# 或修改端口
# 在 vite.config.ts 中设置不同端口
```

### Q: 样式没有加载？
```bash
# 1. 清除缓存
Ctrl + Shift + R (强制刷新)

# 2. 检查控制台
F12 → Console → 查看错误

# 3. 重启开发服务器
Ctrl + C → npm run dev
```

### Q: 类型错误？
```bash
# 运行类型检查
npm run typecheck

# 常见问题：
# - 确保已安装依赖: npm install
# - 检查 TypeScript 版本
```

### Q: 粒子效果看不到？
- ✅ 确保答对题目（粒子在答对时触发）
- ✅ 检查浏览器控制台是否有错误
- ✅ 尝试刷新页面

### Q: 音乐节拍效果不明显？
- ✅ 确保音乐已开启（点击音符图标）
- ✅ 玩到第 10+ 题（高阶段效果更明显）
- ✅ 检查 CSS 变量 `--beat` 是否存在

---

## 🎓 适合年龄

**目标用户**: 7-12 岁儿童

**教育价值**:
- ✅ 加减法练习（20 以内）
- ✅ 手眼协调训练
- ✅ 科学兴趣培养
- ✅ 抗挫折能力培养（正向反馈）

---

## 🌟 特别鸣谢

**参考项目**: [Dopa Drill](https://github.com/grmchn/dopa-drill)
- 渐进式场景变化的灵感来源
- 优秀的游戏节奏设计

**重构目标**: 在 Dopa Drill 的基础上：
- ✅ 更强的主题一致性（科学实验室）
- ✅ 更适合儿童的反馈系统（正向激励）
- ✅ 更丰富的视觉层次（装饰、粒子、音乐可视化）

---

## 📞 反馈与改进

欢迎提供反馈！特别是：
- 🎮 儿童实际游玩体验
- 🎨 视觉效果建议
- 🐛 Bug 报告
- 💡 新功能创意

---

## 🚀 下一步

### 立即开始：
```bash
npm run dev
```

### 深入了解：
1. 阅读 [GAME_REDESIGN.md](./GAME_REDESIGN.md) - 了解完整设计
2. 阅读 [BEFORE_AFTER.md](./BEFORE_AFTER.md) - 看看改进了什么
3. 使用 [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 全面测试

### 二次开发：
- 查看 `src/components/` - 理解组件结构
- 查看 `src/styles/` - 理解样式系统
- 查看 `src/game/` - 理解游戏逻辑

---

## 🎉 祝你玩得开心！

记住：Cici 小博士不仅仅是一个游戏，
它是一个让孩子在快乐中学习、
在鼓励中成长的科学小世界！

**让我们一起培养下一代的数学小博士！** 🧪✨

---

🤖 Generated with Claude Code - Opus 5.5
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
