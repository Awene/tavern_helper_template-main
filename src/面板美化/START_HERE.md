# 🎯 从这里开始

欢迎使用修仙TRPG面板美化脚本库！

## 📌 你需要知道的最重要的事

### 如果你只想美化 `action_info` 面板

**使用这个文件**: `action_info美化.html` ⭐

这是一个**通用模板**，可以自动处理所有类型的 action_info 面板：
- ⚔️ 战斗行动
- 🔨 生产制作
- 📖 修为获取
- ⚡ 突破晋升
- 🧠 参悟领悟
- ⚖️ 非战斗判定

**最简单的使用方式**:

```javascript
// 你的文本
const text = `
  <action_info>
  {战况总览}
  | 人物: 李道玄 | 境界: 筑基中期 |
  </action_info>
`;

// 调用美化函数
processActionInfo(text);
```

**详细文档**: 📖 [action_info通用模板说明.md](action_info通用模板说明.md)

---

### 如果你需要美化其他类型的面板

| 面板类型       | 文件                         |
| -------------- | ---------------------------- |
| 物品/功法/法宝 | `item_info美化.html`         |
| 角色信息       | `char_info美化.html`         |
| 秘境信息       | `secret_realm_info美化.html` |

---

## 🚀 快速开始（3 步）

### 步骤 1: 复制文件

将 `action_info美化.html` 复制到你的项目中。

### 步骤 2: 在 HTML 中引入

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">

<div id="output-container">
  <div id="content"></div>
</div>

<script src="action_info美化.html"></script>
```

### 步骤 3: 调用函数

```javascript
const text = `<action_info>...</action_info>`;
processActionInfo(text);
```

完成！✅

---

## 📚 文档导航

### 核心文档

| 文档                           | 用途                                      |
| ------------------------------ | ----------------------------------------- |
| **action_info通用模板说明.md** | 详细的 API 文档和使用说明                 |
| **集成指南.md**                | 如何在项目中集成（Tavern、Vue、React 等） |
| **通用模板总结.md**            | 功能总结和对比                            |

### 参考文档

| 文档                | 用途                   |
| ------------------- | ---------------------- |
| **README.md**       | 总体使用指南           |
| **快速参考.md**     | 快速查询卡片           |
| **面板类型总结.md** | 所有面板类型的详细说明 |

---

## 🎨 核心特性

### ✨ 通用模板的优势

```
一个文件 → 处理所有 action_info 类型
   ↓
自动识别面板类型
   ↓
应用对应的配色和图标
   ↓
美化后的面板
```

### 🎯 支持的面板类型

```
战斗行动 (红色)
  ├─ 战况总览
  ├─ 行动顺序
  ├─ 攻击行动
  └─ ...

生产制作 (绿色)
  ├─ 生产准备
  ├─ 制作检定
  └─ 生产结算

修为获取 (蓝色)
  ├─ 修为状态总览
  └─ 修为获取

突破晋升 (橙色)
  ├─ 突破判定
  ├─ 历劫
  └─ 突破结算

参悟领悟 (紫色)
  ├─ 参悟检定
  ├─ 参悟结果
  └─ 大成奖励

非战斗判定 (蓝色)
  ├─ 判定检查
  └─ 判定结果
```

---

## 💡 常见问题

### Q: 我应该使用哪个文件？

**A**:
- 如果需要美化 `action_info` → 使用 `action_info美化.html` ⭐
- 如果需要美化其他面板 → 使用对应的文件

### Q: 如何处理多个面板？

**A**:
```javascript
const text = `
  <action_info>...</action_info>
  <action_info>...</action_info>
  <action_info>...</action_info>
`;
processActionInfo(text); // 自动处理所有面板
```

### Q: 如何自定义配色？

**A**: 编辑 CSS 中的颜色值，详见 [action_info通用模板说明.md](action_info通用模板说明.md)

### Q: 如何在 Tavern 中集成？

**A**: 查看 [集成指南.md](集成指南.md) 中的 Tavern 集成部分

---

## 🔗 推荐阅读顺序

1. **本文件** (START_HERE.md) ← 你在这里
2. **action_info通用模板说明.md** ← 了解详细用法
3. **集成指南.md** ← 学习如何集成
4. **快速参考.md** ← 快速查询

---

## ✅ 检查清单

开始使用前：

- [ ] 已复制 `action_info美化.html` 文件
- [ ] 已引入 jQuery、Lodash、Font Awesome
- [ ] 已创建 `output-container` 和 `content` 容器
- [ ] 已准备好包含 `action_info` 标签的文本
- [ ] 已准备好调用 `processActionInfo()` 函数

---

## 🎉 现在就开始吧！

```javascript
// 复制这段代码到你的项目中
const myText = `
  <action_info>
  {战况总览}
  | 人物: 李道玄 | 境界: 筑基中期 |
  | 对手: 妖兽 | 环境: 深山 |
  </action_info>
`;

processActionInfo(myText);
```

---

## 📞 需要帮助？

- 📖 查看 [action_info通用模板说明.md](action_info通用模板说明.md)
- 🚀 查看 [集成指南.md](集成指南.md)
- 📋 查看 [快速参考.md](快速参考.md)

---

**祝你使用愉快！** 🎊

如有任何问题，请参考相关文档。

**版本**: 1.0
**最后更新**: 2026年4月24日
