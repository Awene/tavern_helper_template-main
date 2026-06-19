# 本格修仙 · 前端美化工程

> [本格修仙](../Cultivation-Card-Game/) 角色卡的**配套前端美化工程**。基于 [StageDog/tavern_helper_template](https://github.com/StageDog/tavern_helper_template) 模板，使用 Vue 3 + TypeScript + Tailwind 4 + webpack 编写酒馆助手前端界面，编译产物经 [jsdelivr](https://www.jsdelivr.com/) 注入到角色卡的正则中。

- **配套角色卡 / 世界书 / 预设**：[../Cultivation-Card-Game/](../Cultivation-Card-Game/)（独立仓库，经 `tavern_sync` 推送到酒馆）
- **本仓库职责**：状态栏、自定义开局向导、正文/思维链美化等**纯前端界面**
- **作者**：Awene & Vandark 范答客 · 免费分享 · 禁止商用

---

## 项目分工

本项目在酒馆中是一张完整的角色卡，但源工程拆成了**两个仓库**，二者协作但推送方式不同：

| 仓库 | 内容 | 推送方式 |
| --- | --- | --- |
| [Cultivation-Card-Game](../Cultivation-Card-Game/) | 角色卡（含世界书）、正则、脚本、预设 | `tavern_sync` 双向同步 |
| **tavern_helper_template-main（本仓库）** | 前端美化界面（Vue 工程 + 纯 HTML 面板） | webpack 打包 → jsdelivr 引用 |

角色卡仓库里的两条推送命令（在 [Cultivation-Card-Game/](../Cultivation-Card-Game/) 目录下执行）：

```bash
node tavern_sync.mjs push 本格修仙        # 角色卡（含世界书）
node tavern_sync.mjs push 本格修仙预设    # 预设
```

而本仓库的前端**不走 tavern_sync**：源码打包到 `dist/`，由角色卡仓库 `正则/` 中的 jsdelivr 链接（如 `状态栏.txt`、`自定义开局.txt`）拉取并注入到对话中。改动前端只需提交本仓库、等待 CI 重新打包，酒馆侧即可通过 jsdelivr 自动更新。

---

## 前端模块（`src/`）

三个独立子应用，视觉语言统一：远山 SVG 背景 + 仙鹤动画 + 卷轴主体 + 暗色琉璃质感。

### `src/修仙状态栏/` — 状态栏 HUD（Vue + Pinia）

挂载为 iframe 状态栏，等待 `Mvu` 全局就绪后读取 MVU 变量并渲染面板：

- **数据契约**：[schema.ts](src/修仙状态栏/schema.ts) / [schema.json](src/修仙状态栏/schema.json)（Zod，与角色卡脚本 `变量结构.js` 对齐）
- **页面**（[pages/](src/修仙状态栏/pages/)）：战斗单位 `CombatUnit`、技艺 `PageArts`、社交关系 `PageRelations`、传闻 `PageRumors`、储物 `PageStorage`、地图 `PageMap`
- **凡界地图**：[maps/凡界/](src/修仙状态栏/maps/凡界/)（东土 / 中原 / 北境 / 南疆 / 西域）
- **时间轴引擎**：[timeline-engine.ts](src/修仙状态栏/timeline-engine.ts) + [timeline.yaml](src/修仙状态栏/timeline.yaml)

### `src/自定义开局/` — 开局向导（Vue + Pinia）

多步骤建卡向导，替换首条消息中的 `<customized>` 占位符：

- **步骤流**（[steps/](src/自定义开局/steps/)）：封面 → 灵根 → 难度 → 出生地 → 物品 → 剧本 → 确认
- **静态配置**（[config/](src/自定义开局/config/)）：难度 `difficulties`、灵根 `roots`、体质 `physiques`、物品 `items`、地点 `locations`、剧本 `stories`
- **导出**：[export.ts](src/自定义开局/export.ts) 把玩家选择组装成 MVU 的 `stat_data`（形状对齐状态栏 schema）并写入当前消息的酒馆变量，从而完成 MVU 变量初始化

### `src/面板美化/` — 正文与思维链美化（纯 HTML/CSS）

[正文美化.html](src/面板美化/正文美化.html)、[思维链美化.html](src/面板美化/思维链美化.html)。**纯 HTML + CSS + jQuery，无 `index.ts` 入口，因此不经 webpack 打包**，内容直接被角色卡正则引用。负责把 `<gametxt>` / `<char_info>` / `<tp>` 等正文标签和 `<think>` 思维链渲染成美化卡片。

---

## 开发与构建

```bash
pnpm install            # 安装依赖（Node ≥ 22）
pnpm watch              # 开发：监听 src/ 变更，增量打包到 dist/
pnpm build              # 生产打包
pnpm format             # Prettier 格式化
pnpm lint:fix           # ESLint 自动修复
```

webpack（[webpack.config.ts](webpack.config.ts)）会 glob `{示例,src}/**/index.{ts,tsx,js,jsx}` 作为入口，每个子应用产出到 `dist/<子应用名>/`。配置了 Tailwind、Vue/SFC、auto-import、内联 CSS/SVG 等。

> 想跳过打包 `示例/` 文件夹，可把 webpack 配置里的 `{示例,src}/` 改为 `src/`；但请勿删除 `示例/`，AI 编写时需要参考其中代码。

### 实时编写 / 自动更新

前端产物随仓库上传后可用 jsdelivr 链接访问，从而实现"改完即更新"。详见模板作者的[教程文档](https://stagedog.github.io/青空莉/工具经验/实时编写前端界面或脚本/)。自动更新脚本示例：

```typescript
import 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/酒馆助手/场景感/index.js'
```

---

## CI 工作流（`.github/workflows`）

继承自模板，可在 GitHub `Actions` 页手动触发：

- **`bundle.yaml`** — 自动打包 `src/` 到 `dist/` 并递增版本号（加速 jsdelivr 缓存刷新）；同时按 `tavern_sync.yaml` 打包已配置的角色卡 / 世界书 / 预设。
- **`bump_deps.yaml`** — 每三天自动更新第三方依赖与 `@types`。
- **`sync_template.yaml`** — 发现上游模板更新时自动开 PR 同步（编程助手规则、MCP、`slash_command.txt` 等）；不想同步的文件加入 `.github/.templatesyncignore`。

> 注：本仓库根目录的 [tavern_sync.yaml](tavern_sync.yaml) 仍是模板默认的 `角色卡示例` 占位配置，前端美化本身不依赖它。本项目实际的 `tavern_sync` 配置在角色卡仓库 [Cultivation-Card-Game/tavern_sync.yaml](../Cultivation-Card-Game/tavern_sync.yaml)。

### 打包冲突与 git 配置

`dist/` 随仓库上传会引发分支冲突。`.gitattributes` 已设置 `dist/` 冲突总取当前版本（CI 会重新打包，本地内容无所谓）。启用一次：

```bash
git config --global merge.ours.driver true
```

若 `.vscode/launch.json` 中填了云酒馆地址，避免 IP 泄露：

```bash
git update-index --skip-worktree .vscode/launch.json
```

---

## 许可证

[Aladdin](LICENSE) · 免费分享 · 禁止商用 · 转载请保留作者署名（Awene & Vandark 范答客）。
