# Copilot Chat CN (BYOK)

> 基于 [microsoft/vscode-copilot-chat](https://github.com/microsoft/vscode-copilot-chat) 的深度定制版本，支持 BYOK (Bring Your Own Key) 模式，让 DeepSeek、Mimo 等 OpenAI 兼容模型享受原生 Copilot 的全部功能。

## ✨ 核心特性

- 🧠 **DeepSeek Reasoning 思维链** — 完整支持 reasoning_content 多轮对话传递，Thinking Effort 选择器 UI
- 🏷️ **自定义 Provider Group 显示名** — 通过 label 字段在模型 picker 中显示自定义名称
- 🔄 **BYOK 自动压缩** — 无 Copilot 订阅也能自动压缩长对话（background compaction）
- 📊 **上下文窗口显示** — 正确显示自定义模型的 context window 大小
- 🚫 **无限速** — BYOK 模型使用用户自己的 API key，不受 Copilot 配额限制
- 🔓 **免登录模式** — 无需 GitHub Copilot 订阅，BYOK-only 模式直接可用
- ⚙️ **丰富参数配置** — 支持 temperature、top_p、top_k、reasoning_effort 等参数

## 📦 安装

### 方式一：从 VSIX 安装
1. 从 [Releases](https://github.com/ClockZinc/vscode-copilot-chat-CN/releases) 下载 .vsix 文件
2. 在 VS Code 中：Ctrl+Shift+P → Extensions: Install from VSIX...
3. 选择下载的 .vsix 文件

### 方式二：从源码构建
`ash
git clone https://github.com/ClockZinc/vscode-copilot-chat-CN.git
cd vscode-copilot-chat-CN
npm install
npm run compile
npx @vscode/vsce package --allow-package-all-secrets
code --install-extension vscode-copilot-chat-cn-*.vsix --force
`

## 🔧 配置方法

在 chatLanguageModels.json 中配置（VS Code Insiders 路径：%APPDATA%/Code - Insiders/User/chatLanguageModels.json）：

`json
[
  {
    "name": "my-deepseek",
    "vendor": "customoai",
    "label": "DeepSeek 官方",
    "apiKey": "sk-your-api-key",
    "models": [
      {
        "id": "deepseek-v4-pro",
        "name": "DeepSeek V4 Pro",
        "url": "https://api.deepseek.com/chat/completions",
        "toolCalling": true,
        "vision": false,
        "maxInputTokens": 1000000,
        "maxOutputTokens": 384000,
        "thinking": true,
        "includeReasoning": true,
        "supportsReasoningEffort": ["high", "max"],
        "temperature": 0
      }
    ]
  },
  {
    "name": "my-mimo",
    "vendor": "customoai",
    "label": "小米 MIMO",
    "apiKey": "your-mimo-api-key",
    "models": [
      {
        "id": "mimo-v2.5-pro",
        "name": "MIMO V2.5 Pro",
        "url": "https://token-plan-cn.xiaomimimo.com/v1",
        "toolCalling": true,
        "vision": true,
        "maxInputTokens": 1000000,
        "maxOutputTokens": 131072,
        "thinking": true,
        "includeReasoning": true,
        "temperature": 1,
        "top_p": 0.95
      }
    ]
  }
]
`

### 模型配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 模型唯一标识符 |
| name | string | 模型显示名称 |
| url | string | API 端点 URL |
| toolCalling | boolean | 是否支持工具调用 |
| vision | boolean | 是否支持图片输入 |
| maxInputTokens | number | 最大输入 token 数 |
| maxOutputTokens | number | 最大输出 token 数 |
| thinking | boolean | 是否支持思维链（reasoning） |
| includeReasoning | boolean | 多轮对话中是否传递 reasoning_content，默认 true |
| supportsReasoningEffort | string[] | 支持的思维努力等级，如 ["high", "max"] |
| temperature | number | 采样温度 (0.0 - 2.0) |
| top_p | number | 核采样参数 |
| top_k | number | Top-K 采样参数 |

### Provider Group 字段

| 字段 | 说明 |
|------|------|
| name | Group 名称（VS Code 自动生成或手动指定） |
| label | 自定义显示名，优先级：label > name > "CustomOAI" |
| vendor | 固定为 "customoai" |
| apiKey | API 密钥，支持 ${input:...} 变量 |

---

## 📝 详细改动记录

以下是相对于原始 [microsoft/vscode-copilot-chat](https://github.com/microsoft/vscode-copilot-chat) v0.44.0 的所有修改，共 **24 个文件，+502/-142 行**。记录详细改动和原因，方便后续上游更新时合并。

### 1. package.json — 插件元数据 + 外部 Vendor 禁用 + 自定义模型参数扩展

**改动：**
- 插件名称改为 scode-copilot-chat-CN，作者改为 clockzinc，displayName 改为 Copilot Chat CN (BYOK)
- extensionDependencies 添加 GitHub.copilot（作为运行时依赖）
- 禁用 Anthropic、xAI、Google 三个外部 vendor（"when": "false"）
- customoai 和 zure 的 model schema 添加 includeReasoning、supportsReasoningEffort、	emperature、	op_p、	op_k 字段
- defaultSnippets 添加 thinking 相关参数

**原因：** 自定义模型需要更丰富的参数配置，同时减少不需要的外部 vendor 干扰。

### 2. src/extension/byok/common/byokProvider.ts — BYOK 模型能力扩展 + Thinking Effort UI

**改动：**
- BYOKModelCapabilities 接口新增 includeReasoning、	emperature、	op_p、	op_k
- esolveModelInfo() 中添加 easoning_effort 映射和新参数传递
- yokKnownModelToAPIInfo() 中当模型有 	hinking: true 且 supportsReasoningEffort 时自动生成 configurationSchema（Thinking Effort 选择器 UI）

**原因：** DeepSeek V4 等模型支持 easoning_effort 参数，需要在模型 picker UI 中提供选择器。

### 3. src/extension/byok/node/openAIEndpoint.ts — 核心：DeepSeek reasoning_content + 请求参数注入

**改动（最关键文件，+101行）：**

createRequestBody 回调：
- 区分 DeepSeek 风格 thinking（easoning_content）和其他模型（cot_id/cot_summary）
- 添加 easoning_effort 顶层参数到请求 body

interceptBody 方法（新增 ~90 行）：
- 应用用户配置的采样参数：	emperature、	op_p、	op_k
- **reasoning_content 多轮处理**：assistant 消息确保有 easoning_content（优先级：已有 > cot_summary > content array 中的 thinking data > 占位符），非 assistant 消息删除 easoning_content
- includeReasoning: false 时剥离所有 reasoning_content
- Chat Completions API 中注入 	hinking: { type: 'enabled' } 和 easoning_effort

**原因：** DeepSeek API 要求 easoning_content 必须在 assistant 消息上返回，否则返回 400 错误。VS Code 消息系统不原生支持此字段，需要在请求发送前拦截补全。

### 4. src/extension/byok/vscode-node/customOAIProvider.ts — 自定义显示名 + 模型自动识别

**改动（+99行）：**
- CustomOAIModelProviderConfig 新增 
ame、label 字段
- _CustomOAIModelConfig 新增 daptiveThinking、supportsReasoningEffort、includeReasoning、	emperature、	op_p、	op_k
- migrateConfig() 改为单次调用避免多组覆盖
- getAllModels() 使用 label > name > "CustomOAI" 三级 fallback 确定显示名
- createOpenAIEndPoint() 使用 esolveKnownModelDefaults() 自动识别 thinking 模型
- 新增 KNOWN_THINKING_MODEL_PATTERNS 和 esolveKnownModelDefaults()：自动识别 deepseek-v3/v4、deepseek-r1、qwq/qwen-q

**原因：** 用户不需要手动为已知模型配置 thinking 字段，通过 model ID 模式匹配自动推断。自定义显示名让 picker 更美观。

### 5. src/extension/byok/vscode-node/byokContribution.ts — 无 Copilot 订阅注册 BYOK

**改动：** 即使没有 Copilot token 也注册 BYOK providers。

**原因：** 允许纯 BYOK 模式，无需 GitHub Copilot 订阅。

### 6. src/platform/authentication/vscode-node/copilotTokenManager.ts — 免登录模式

**改动：**
- 删除 !session && !allowNoAuthAccess 时返回 GitHubLoginFailed 的逻辑
- 匿名认证失败时返回合成的 no-auth token（sku: 'no_auth_limited_copilot'）而不是 failure

**原因：** 没有 GitHub 账号的用户也能使用 BYOK 模型。

### 7. src/extension/conversation/vscode-node/conversationFeature.ts — 无 token 激活对话功能

**改动：** 即使没有 Copilot token，也设置 ctivated = true 和 enabled = true。

**原因：** Chat Panel 需要在 BYOK-only 模式下正常工作。

### 8. src/extension/conversation/vscode-node/chatParticipants.ts — BYOK 免限速

**改动：**
- shouldAutoSwitchToAuto 增加 endor === 'copilot' 条件
- switchToAutoModel() 中 BYOK 模型直接返回

**原因：** BYOK 模型不应被切换到 Copilot auto 模型。

### 9. src/extension/conversation/vscode-node/languageModelAccess.ts — BYOK Thinking Effort + Usage 传递

**改动：**
- BYOK 模型也显示 effort picker（modelProvider !== 'copilot'）
- isNoAuthUser 且 token 为空时返回 undefined
- 添加 storeUsageForCorrelation() 传递真实 usage 数据
- copilotPlan 获取添加 try-catch

**原因：** BYOK 模型需要 Thinking Effort UI，且需要传递真实 token usage。

### 10. src/extension/intents/node/agentIntent.ts — BYOK 强制启用后台压缩

**改动：** 非 copilot vendor 模型强制启用 ackgroundCompactionEnabled。

**原因：** BYOK 模型没有服务端上下文管理，必须本地摘要处理长对话。

### 11. src/extension/prompt/node/chatMLFetcher.ts — BYOK 免 Copilot Token 要求

**改动：**
- BYOK 模型在没有 token 时跳过获取，不抛异常
- copilotToken 参数类型改为 CopilotToken | undefined

**原因：** BYOK 模型使用自己的 API key。

### 12. src/extension/prompt/node/defaultIntentRequestHandler.ts — 安全获取 copilotPlan

**改动：** 新增 _getCopilotPlanSafe() 方法（try-catch），替换所有直接调用。

**原因：** BYOK-only 模式下 getCopilotToken() 可能抛异常。

### 13. src/platform/endpoint/vscode-node/extChatEndpoint.ts — Usage 数据恢复

**改动：** 从 side channel 获取真实 usage 数据，thinking-only 响应也视为成功。

**原因：** VS Code IPC 边界会丢弃 usage 数据。

### 14. src/platform/requestLogger/node/requestLogger.ts — Usage Side Channel

**改动：** 新增 usageCorrelationMap、storeUsageForCorrelation()、etrieveUsageByCorrelation()。

**原因：** 跨 IPC 边界传递 usage 数据。

### 15. src/platform/thinking/common/thinking.ts — DeepSeek thinking 字段

**改动：** ThinkingDataInMessage 和 RawThinkingDelta 添加 easoning_content?: string。

**原因：** DeepSeek API 使用 easoning_content 字段。

### 16. src/platform/thinking/common/thinkingUtils.ts — reasoning_content 读取

**改动：** getThinkingDeltaText() 中添加 easoning_content 检查。

**原因：** 确保 DeepSeek 思维链内容被正确提取。

### 17. src/platform/endpoint/common/endpointProvider.ts — 模型信息扩展

**改动：** IChatModelInformation 新增 includeReasoning、	emperature、	op_p、	op_k。

### 18. src/platform/configuration/common/configurationService.ts — 配置类型扩展

**改动：** CustomOAIModels 类型定义新增所有新字段。

### 19. src/extension/contextKeys/vscode-node/contextKeys.contribution.ts — BYOK-only 激活

**改动：** GitHubLoginFailedError 时改为激活状态而非错误状态。

**原因：** BYOK-only 模式下登录失败是预期行为。

### 20. src/extension/chatSessions/vscode-node/chatPromptFileService.ts — customAgents 空值保护

**改动：** scode.chat.customAgents 为 undefined 时直接 return。

### 21-23. 其他文件安全获取 copilotPlan

- src/extension/prompts/node/codeMapper/codeMapper.ts
- src/extension/inlineChat/node/inlineChatIntent.ts

**改动：** copilotPlan 获取添加 try-catch。

### 24. package.nls.json + package-lock.json

**改动：** 添加 eviewFileChange 键 + npm 自动更新。

---

## 🔄 与上游合并指南

当 [microsoft/vscode-copilot-chat](https://github.com/microsoft/vscode-copilot-chat) 发布新版本时：

`ash
git remote add upstream https://github.com/microsoft/vscode-copilot-chat.git
git fetch upstream
git merge upstream/main --allow-unrelated-histories
`

**重点关注的冲突文件（按冲突概率排序）：**
1. src/extension/byok/node/openAIEndpoint.ts — 最常变动，核心逻辑
2. src/extension/byok/vscode-node/customOAIProvider.ts — BYOK provider
3. src/extension/byok/common/byokProvider.ts — 模型能力定义
4. src/extension/conversation/vscode-node/chatParticipants.ts — 对话参与者
5. src/extension/prompt/node/chatMLFetcher.ts — 请求发送
6. src/platform/thinking/common/thinking.ts — thinking 类型
7. package.json — 插件元数据和 vendor 定义

**合并后验证：**
- 
pm install && npm run compile
- 测试 DeepSeek 和 Mimo 模型基本对话
- 测试 thinking/reasoning_content 多轮对话
- 测试 Thinking Effort 选择器 UI

**版本号：** 同步上游版本号，保持 publisher: "clockzinc" 和 
ame: "vscode-copilot-chat-cn"。

## 📋 已测试模型

| 模型 | 提供商 | 思维链 | 工具调用 | 视图 | 状态 |
|------|--------|--------|----------|------|------|
| DeepSeek V4 Pro | DeepSeek 官方 | ✅ | ✅ | ❌ | ✅ 已验证 |
| DeepSeek V4 Flash | DeepSeek 官方 | ✅ | ✅ | ❌ | ✅ 已验证 |
| Mimo V2.5 Pro | 小米 | ✅ | ✅ | ✅ | ✅ 已验证 |

## 📄 许可证

本项目继承原始 [microsoft/vscode-copilot-chat](https://github.com/microsoft/vscode-copilot-chat) 的许可证。

修改部分 © 2025 clockzinc
