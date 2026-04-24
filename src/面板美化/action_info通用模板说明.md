# action_info 通用美化模板

## 📋 概述

`action_info美化.html` 是一个**通用的行动面板美化模板**，可以自动识别和美化所有类型的 `action_info` 面板，包括：

- ⚔️ **战斗行动** (battle)
- 🔨 **生产制作** (craft)
- 📖 **修为获取** (cultivation)
- ⚡ **突破晋升** (breakthrough)
- 🧠 **参悟领悟** (insight)
- ⚖️ **非战斗判定** (judge)

## 🎯 核心特性

### 1. 自动类型识别
根据面板标题自动识别面板类型，应用对应的配色和图标：

```javascript
const PanelConfig = {
  '战况总览': { type: 'battle', icon: 'fa-solid fa-scroll' },
  '生产准备': { type: 'craft', icon: 'fa-solid fa-hammer' },
  '修为获取': { type: 'cultivation', icon: 'fa-solid fa-star' },
  // ... 更多配置
};
```

### 2. 正则表达式提取
使用你指定的正则表达式提取文本中的所有 `action_info` 面板：

```javascript
const regex = /<action_info>((?:(?!<\/?action_info>)[\s\S])*?)<\/action_info>/gs;
```

### 3. 动态配色
根据面板类型自动应用对应的配色方案：

| 类型         | 颜色 | 十六进制 |
| ------------ | ---- | -------- |
| battle       | 红色 | #fc8181  |
| craft        | 绿色 | #68d391  |
| cultivation  | 蓝色 | #90cdf4  |
| breakthrough | 橙色 | #f6ad55  |
| insight      | 紫色 | #b794f4  |
| judge        | 蓝色 | #63b3ed  |

### 4. 统一的标签美化
所有面板共享相同的标签美化规则，确保一致的视觉体验。

## 🚀 使用方法

### 基础使用

#### 方法 1: 直接在 HTML 中使用

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 引入美化脚本 -->
  <script src="action_info美化.html"></script>
</head>
<body>
  <div id="output-container">
    <div id="content"></div>
  </div>

  <script>
    // 你的文本内容
    const text = `
      <action_info>
      {战况总览}
      | 人物: 李道玄 | 境界: 筑基中期 |
      | 对手: 妖兽 | 环境: 深山 |
      </action_info>

      <action_info>
      {攻击行动}
      | 攻方: 李道玄 | 守方: 妖兽 |
      | 伤害: 250 | 命中: 85 |
      </action_info>
    `;

    // 处理文本
    processActionInfo(text);
  </script>
</body>
</html>
```

#### 方法 2: 在 JavaScript 中调用

```javascript
// 导入美化脚本后
const text = `你的包含 action_info 的文本`;
processActionInfo(text);
```

#### 方法 3: 通过 iframe 集成

```html
<iframe src="action_info美化.html" width="100%" height="600"></iframe>
```

### 高级用法

#### 自定义面板配置

如果需要添加新的面板类型，编辑 `PanelConfig` 对象：

```javascript
const PanelConfig = {
  '自定义面板': { type: 'custom', icon: 'fa-solid fa-star' },
  // ... 其他配置
};

// 在 CSS 中添加对应的颜色
.action-panel.custom {
  border-color: #your-color;
  --panel-color: #your-color;
}
```

#### 自定义标签映射

在 `beautifyRow` 函数中添加新的标签映射：

```javascript
const tagMappings = [
  {
    pattern: /自定义标签:\s*([^|]+)/g,
    label: '自定义标签',
    icon: 'fa-solid fa-star',
    className: 'tag-type'
  },
  // ... 其他映射
];
```

#### 自定义美化规则

在 `beautifyRow` 函数中添加自定义的正则替换：

```javascript
function beautifyRow(row) {
  let html = _.escape(row);

  // 你的自定义规则
  html = html.replace(/自定义模式/g, '替换内容');

  // ... 其他规则
  return html;
}
```

## 📝 面板格式规范

### 基础格式

```
<action_info>
{面板标题}
| 字段名: 值 | 字段名: 值 |
| 字段名: 值 |
</action_info>
```

### 完整示例

```
<action_info>
{战况总览}
| 人物: 李道玄 | 境界: 筑基中期 (L=2.0) |
| 对手: 妖兽 | 环境: 深山灵脉 |
| 天谴: 0 | 状态: 正常 |
</action_info>

<action_info>
{攻击行动}
| 攻方: 李道玄 | 守方: 妖兽 |
| 招式: 剑气纵横 | 伤害: 250 |
| 命中: 85 | 结果: 命中 |
</action_info>

<action_info>
{生产准备}
| 类型: 炼丹 | 品质: 天 |
| 投入物: 灵草×3 | 工具: 丹炉 |
</action_info>
```

## 🎨 支持的标签类型

### 品质标签
```
品质: 凡    品质: 黄    品质: 玄    品质: 地    品质: 天
```

### 结果标签
```
结果: 成功          结果: 失败
结果: 大成功        结果: 大失败
```

### 状态标签
```
状态: 制作成功      状态: 制作失败
```

### 通用标签
```
类型: xxx           方法: xxx           难度: xxx
当前境界: xxx       目标境界: xxx       攻方: xxx
守方: xxx           投入物: xxx         产出: xxx
```

## 🔧 API 参考

### 主要函数

#### `extractActionInfo(text)`
从文本中提取所有 `action_info` 面板。

**参数:**
- `text` (string): 包含 action_info 标签的文本

**返回:**
- Array: 解析后的面板数组

**示例:**
```javascript
const panels = extractActionInfo(myText);
console.log(panels); // [{sections: [...]}, ...]
```

#### `parsePanelContent(content)`
解析单个面板的内容。

**参数:**
- `content` (string): 面板内容

**返回:**
- Object: `{sections: [{title, rows}, ...]}`

#### `beautifyRow(row)`
美化单行数据。

**参数:**
- `row` (string): 数据行

**返回:**
- string: 美化后的 HTML

#### `renderPanels(panels, containerSelector)`
渲染面板到 DOM。

**参数:**
- `panels` (Array): 面板数组
- `containerSelector` (string): 容器选择器

#### `processActionInfo(text)`
处理文本中的所有 action_info 面板（主函数）。

**参数:**
- `text` (string): 包含 action_info 标签的文本

## 💡 使用技巧

### 技巧 1: 批量处理多个面板
```javascript
const text = `
  <action_info>...</action_info>
  <action_info>...</action_info>
  <action_info>...</action_info>
`;
processActionInfo(text); // 自动处理所有面板
```

### 技巧 2: 动态更新内容
```javascript
function updateContent(newText) {
  processActionInfo(newText);
}

// 当内容更新时调用
updateContent(newContent);
```

### 技巧 3: 与其他面板混合使用
```javascript
// 可以在同一个文本中混合使用不同类型的面板
const text = `
  <item_info>...</item_info>
  <action_info>...</action_info>
  <char_info>...</char_info>
`;
// 分别处理不同类型的面板
```

### 技巧 4: 自定义容器
```javascript
// 使用不同的容器渲染不同的面板组
const battlePanels = extractActionInfo(battleText);
renderPanels(battlePanels, '#battle-container');

const craftPanels = extractActionInfo(craftText);
renderPanels(craftPanels, '#craft-container');
```

### 技巧 5: 调试面板解析
```javascript
const panels = extractActionInfo(text);
console.log('解析的面板数:', panels.length);
console.log('面板详情:', panels);
```

## 🐛 常见问题

### Q: 为什么面板没有显示？
**A:** 检查以下几点：
1. 确保 `action_info` 标签格式正确
2. 确保面板标题在 `{}` 中
3. 确保数据行以 `|` 开头和结尾
4. 检查浏览器控制台是否有错误

### Q: 如何添加新的面板类型？
**A:**
1. 在 `PanelConfig` 中添加新的配置
2. 在 CSS 中添加对应的颜色类
3. 在 `beautifyRow` 中添加对应的标签映射

### Q: 如何修改配色？
**A:** 编辑 CSS 中的颜色值：
```css
.action-panel.battle {
  border-color: #your-new-color;
  --panel-color: #your-new-color;
}
```

### Q: 如何在 Vue/React 中使用？
**A:** 可以将 `processActionInfo` 函数提取为独立的 JavaScript 模块，然后在框架中调用。

## 📚 相关文档

- [README.md](README.md) - 总体使用指南
- [快速参考.md](快速参考.md) - 快速查询卡片
- [面板类型总结.md](面板类型总结.md) - 详细的面板说明

## 🔗 集成示例

### 与 Tavern 系统集成

```javascript
// 在 Tavern 的消息处理中
function processMessage(message) {
  // 提取 action_info 面板
  const regex = /<action_info>((?:(?!<\/?action_info>)[\s\S])*?)<\/action_info>/gs;

  if (regex.test(message)) {
    // 如果包含 action_info，使用美化模板
    const beautifiedMessage = beautifyActionInfo(message);
    displayMessage(beautifiedMessage);
  } else {
    // 否则正常显示
    displayMessage(message);
  }
}

function beautifyActionInfo(message) {
  // 调用美化脚本
  return processActionInfo(message);
}
```

## ✅ 检查清单

使用前请确保：

- [ ] 所有 `action_info` 标签都正确闭合
- [ ] 面板标题在 `{}` 中
- [ ] 数据行以 `|` 开头和结尾
- [ ] 没有嵌套的 `action_info` 标签
- [ ] 浏览器支持 ES6 和 jQuery
- [ ] 所有外部资源（CDN）可访问

---

**版本**: 1.0
**最后更新**: 2026年4月24日
**状态**: ✅ 完成
