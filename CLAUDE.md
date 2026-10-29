# 酒馆助手前端界面或脚本编写

@.cursor/rules/项目基本概念.mdc
@.cursor/rules/mcp.mdc
@.cursor/rules/酒馆变量.mdc
@.cursor/rules/酒馆助手接口.mdc
@.cursor/rules/前端界面.mdc
@.cursor/rules/脚本.mdc
@.cursor/rules/mvu变量框架.mdc
@.cursor/rules/mvu角色卡.mdc

## 世界书交互式测试约定

默认由助手读取规则、给出建议输入，用户在酒馆发送；助手再依据用户提供的正文与变量反馈修改。未经用户当次明确要求，不自动发送对话、连续重生成或调用额外模型。只运行必要的离线条件检查与构建；测试同步不等于正式发布，不重置已有聊天。
