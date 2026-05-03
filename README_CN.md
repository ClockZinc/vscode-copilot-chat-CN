# 🚀 Copilot Chat CN (BYOK)

> 🌐 基于 [microsoft/vscode-copilot-chat](https://github.com/microsoft/vscode-copilot-chat) 的深度定制版本，支持 BYOK (Bring Your Own Key) 模式，让 DeepSeek、Mimo 等 OpenAI 兼容模型享受原生 Copilot 的全部功能。

[🇺🇸 English](./README.md) · [📋 更新日志](./CHANGELOG.md)

---

## ✨ 核心特性

| 功能 | 说明 |
|------|------|
| 🧠 **DeepSeek Reasoning 思维链** | 完整支持 `reasoning_content` 多轮对话传递，Thinking Effort 选择器 UI |
| 🏷️ **自定义 Provider Group 显示名** | 通过 `label` 字段在模型 picker 中显示自定义名称 |
| 🔄 **BYOK 自动压缩** | 无 Copilot 订阅也能自动压缩长对话（background compaction） |
| 📊 **上下文窗口显示** | 正确显示自定义模型的 context window 大小 |
| 🚫 **无限速** | BYOK 模型使用用户自己的 API key，不受 Copilot 配额限制 |
| 🔓 **免登录模式** | 无需 GitHub Copilot 订阅，BYOK-only 模式直接可用 |
| ⚙️ **丰富参数配置** | 支持 `temperature`、`top_p`、`top_k`、`reasoning_effort` 等参数 |

---

## 📦 安装

### 🛒 从 VS Code Marketplace
在 VS Code 扩展面板中搜索 **"Copilot Chat CN"** 或 **"BYOK"** 并安装。

### 📥 从 VSIX 安装
1. ⬇️ 从 [Releases](https://github.com/ClockZinc/vscode-copilot-chat-CN/releases) 下载 `.vsix` 文件
2. 📂 在 VS Code 中：`Ctrl+Shift+P` → `Extensions: Install from VSIX...`
3. ✅ 选择下载的 `.vsix` 文件

### 🔧 从源码构建
```bash
git clone https://github.com/ClockZinc/vscode-copilot-chat-CN.git
cd vscode-copilot-chat-CN
npm install
npm run compile
npx @vscode/vsce package --allow-package-all-secrets
code --install-extension vscode-copilot-chat-cn-*.vsix --force
```

---

## 🔧 配置方法

在 `chatLanguageModels.json` 中配置：

> 📍 VS Code Insiders 路径：`%APPDATA%/Code - Insiders/User/chatLanguageModels.json`

```json
[
  {
    "name": "my-deepseek",
    "vendor": "customoai",
    "label": "🔷 DeepSeek 官方",
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
    "label": "🟢 小米 MIMO",
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
```

### 📝 模型配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| 🔑 `id` | `string` | 模型唯一标识符 |
| 📛 `name` | `string` | 模型显示名称 |
| 🌐 `url` | `string` | API 端点 URL |
| 🔧 `toolCalling` | `boolean` | 是否支持工具调用 |
| 👁️ `vision` | `boolean` | 是否支持图片输入 |
| 📏 `maxInputTokens` | `number` | 最大输入 token 数 |
| 📏 `maxOutputTokens` | `number` | 最大输出 token 数 |
| 🧠 `thinking` | `boolean` | 是否支持思维链（reasoning） |
| 💭 `includeReasoning` | `boolean` | 多轮对话中是否传递 `reasoning_content`，默认 `true` |
| ⚡ `supportsReasoningEffort` | `string[]` | 支持的思维努力等级，如 `["high", "max"]` |
| 🌡️ `temperature` | `number` | 采样温度 (`0.0` - `2.0`) |
| 🎯 `top_p` | `number` | 核采样参数 |
| 🔝 `top_k` | `number` | Top-K 采样参数 |

### 🏷️ Provider Group 字段

| 字段 | 说明 |
|------|------|
| 📝 `name` | Group 名称（VS Code 自动生成或手动指定） |
| 🏷️ `label` | 自定义显示名，优先级：`label` > `name` > `"CustomOAI"` |
| 🏢 `vendor` | 固定为 `"customoai"` |
| 🔐 `apiKey` | API 密钥，支持 `${input:...}` 变量 |

---

## 📋 已测试模型

| 模型 | 提供商 | 🧠 思维链 | 🔧 工具调用 | 👁️ 视图 | 状态 |
|------|--------|:---------:|:----------:|:-------:|------|
| 🔷 DeepSeek V4 Pro | DeepSeek 官方 | ✅ | ✅ | ❌ | ✅ 已验证 |
| 🔷 DeepSeek V4 Flash | DeepSeek 官方 | ✅ | ✅ | ❌ | ✅ 已验证 |
| 🟢 Mimo V2.5 Pro | 小米 | ✅ | ✅ | ✅ | ✅ 已验证 |

---

## 🔄 与上游合并

> 📖 详见 [CHANGELOG.md](./CHANGELOG.md) 中的改动记录和合并指南。

```bash
# 1️⃣ 添加上游远程仓库
git remote add upstream https://github.com/microsoft/vscode-copilot-chat.git

# 2️⃣ 拉取最新更改
git fetch upstream

# 3️⃣ 合并并解决冲突
git merge upstream/main --allow-unrelated-histories
```

---

## 📄 许可证

⚖️ 本项目继承原始 [microsoft/vscode-copilot-chat](https://github.com/microsoft/vscode-copilot-chat) 的许可证。

✨ 修改部分 © 2025 clockzinc
