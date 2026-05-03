# Copilot Chat CN (BYOK)

> A deeply customized fork of [microsoft/vscode-copilot-chat](https://github.com/microsoft/vscode-copilot-chat) that enables BYOK (Bring Your Own Key) mode - use DeepSeek, Mimo and other OpenAI-compatible models with the full power of native Copilot features.

[Chinese Docs](./README_CN.md) | [Changelog](./CHANGELOG.md)

## Key Features

- **DeepSeek Reasoning Chain** - Full reasoning_content multi-turn support with Thinking Effort selector UI
- **Custom Provider Group Labels** - Display custom names in the model picker via the label field
- **BYOK Auto-Compression** - Background conversation compaction without a Copilot subscription
- **Context Window Display** - Correctly shows context window size for custom models
- **No Rate Limits** - BYOK models use your own API key, bypassing Copilot quota
- **No-Login Mode** - Works without a GitHub Copilot subscription
- **Rich Parameter Config** - Supports temperature, top_p, top_k, reasoning_effort and more

## Installation

### From VS Code Marketplace
Search for **"Copilot Chat CN"** or **"BYOK"** in the VS Code Extensions panel and install.

### From VSIX
1. Download the .vsix file from [Releases](https://github.com/ClockZinc/vscode-copilot-chat-CN/releases)
2. In VS Code: `Ctrl+Shift+P` -> `Extensions: Install from VSIX...`
3. Select the downloaded file

### From Source
```bash
git clone https://github.com/ClockZinc/vscode-copilot-chat-CN.git
cd vscode-copilot-chat-CN
npm install
npm run compile
npx @vscode/vsce package --allow-package-all-secrets
code --install-extension vscode-copilot-chat-cn-*.vsix --force
```

## Configuration

Configure your models in `chatLanguageModels.json` (VS Code Insiders path: `%APPDATA%/Code - Insiders/User/chatLanguageModels.json`):

```json
[
  {
    "name": "my-deepseek",
    "vendor": "customoai",
    "label": "DeepSeek Official",
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
    "label": "Xiaomi MIMO",
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

### Model Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique model identifier |
| `name` | string | Display name of the model |
| `url` | string | API endpoint URL |
| `toolCalling` | boolean | Whether the model supports tool calling |
| `vision` | boolean | Whether the model supports image input |
| `maxInputTokens` | number | Maximum input token count |
| `maxOutputTokens` | number | Maximum output token count |
| `thinking` | boolean | Whether the model supports reasoning chain |
| `includeReasoning` | boolean | Include `reasoning_content` in multi-turn requests (default: true) |
| `supportsReasoningEffort` | string[] | Supported effort levels, e.g. `["high", "max"]` |
| `temperature` | number | Sampling temperature (0.0 - 2.0) |
| `top_p` | number | Nucleus sampling parameter |
| `top_k` | number | Top-K sampling parameter |

### Provider Group Fields

| Field | Description |
|-------|-------------|
| `name` | Group name (auto-generated or manually set) |
| `label` | Custom display name, priority: `label` > `name` > `"CustomOAI"` |
| `vendor` | Must be `"customoai"` |
| `apiKey` | API key, supports `${{input:...}}` variables |

## Tested Models

| Model | Provider | Thinking | Tool Calling | Vision | Status |
|-------|----------|----------|--------------|--------|--------|
| DeepSeek V4 Pro | DeepSeek Official | Yes | Yes | No | Verified |
| DeepSeek V4 Flash | DeepSeek Official | Yes | Yes | No | Verified |
| Mimo V2.5 Pro | Xiaomi | Yes | Yes | Yes | Verified |

## Merging Upstream Updates

See [CHANGELOG.md](./CHANGELOG.md) for detailed change descriptions and the upstream merge guide.

```bash
git remote add upstream https://github.com/microsoft/vscode-copilot-chat.git
git fetch upstream
git merge upstream/main --allow-unrelated-histories
```

## License

This project inherits the license from the original [microsoft/vscode-copilot-chat](https://github.com/microsoft/vscode-copilot-chat).

Modifications (c) 2025 clockzinc
