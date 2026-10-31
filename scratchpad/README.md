# tavern_helper_template scratchpad 临时工作区规范

本目录是前端工程的**临时演算区、单页调试沙盒与自动化截图存储库**。

> [!WARNING]
> **本目录默认不属于生产源码库**。
> 1. **根目录保留项**：`ignore_dist.mjs` 供 `pnpm run ignore:dist` 使用，保持在根目录。
> 2. **严禁在根目录下随意抛撒截图、HTML 和零散脚本**。

---

## 目录分层架构

```text
tavern_helper_template-main/scratchpad/
├── README.md                   # 本文件 (临时工作区规范)
├── ignore_dist.mjs             # [根目录保留] 供 npm/pnpm 脚本使用的 git skip-worktree 工具
│
├── 01-backups/                 # 重构前的组件源码或卡片片段快照
│   ├── chapter-refactor-before # 章节重构前留存的原版正文
│   └── task-card-comparison    # 任务卡对比副本
│
├── 02-ui-previews/             # 独立预览构建与调试沙盒单页
│   ├── current-panel-preview/  # 当前面板独立打包预览
│   ├── focus-panel-preview/    # 焦点面板独立打包预览
│   ├── reincarnation_preview.html
│   └── mvu-assets-preview.html
│
├── 03-test-artifacts/          # 自动化视觉测试截图与审计结果
│   ├── rc*.png                 # Playwright/Puppeteer 视觉回归比对截图
│   ├── chapter-ui-mobile.png   # 手机端布局渲染截图
│   └── *.json                  # 测试与性能基准报告 (results.json 等)
│
└── 04-test-scripts/            # 临时性排查、预览构建与集成验证脚本
    ├── test_*.mjs              # 单元与集成测试脚本
    ├── build_*.mjs             # 独立预览打包小脚本
    ├── sync_*.mjs              # 焦点同步等测试工具
    └── FocusPanelPreview.vue   # 预览使用的临时 Vue 组件
```

---

## AI 维护准则

1. **前端调试预览**：
   - 调试 Vue/TS 面板脱离酒馆宿主独立运行时，生成的 Webpack 调试包及 HTML 页面统一写入 `02-ui-previews/`。
2. **自动化测试截图**：
   - 使用无头浏览器录制的测试截图、对比图（`rc_good.png`, `rc_bad.png` 等）统一存入 `03-test-artifacts/`。
3. **临时测试脚本**：
   - 临时验证逻辑的测试脚本放入 `04-test-scripts/`。
4. **清理准则**：
   - 任务验收通过后，可向用户建议清理 `02-ui-previews/` 和 `03-test-artifacts/` 释放空间。

