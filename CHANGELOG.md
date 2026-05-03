# Changelog

All notable changes to this project relative to microsoft/vscode-copilot-chat v0.44.0.

24 files changed, +502/-142 lines

---

## v0.44.0 - BYOK Integration (2026-05-04)

### Phase 1: Quota & Rate Limit Bypass

#### chatParticipants.ts
- Added vendor === copilot check to shouldAutoSwitchToAuto
- switchToAutoModel() returns early for non-copilot vendor models
- Reason: BYOK models use user API key, must not be switched to Copilot auto model

### Phase 2: Context Window & Usage Display

#### endpointProvider.ts
- Added includeReasoning, temperature, top_p, top_k to IChatModelInformation

#### requestLogger.ts
- Added usageCorrelationMap side channel
- New functions: storeUsageForCorrelation(), retrieveUsageByCorrelation()
- Reason: VS Code IPC discards usage data; side channel restores real numbers

#### extChatEndpoint.ts
- Retrieves real usage via retrieveUsageByCorrelation in success responses
- thinking-only responses also count as success

### Phase 3: Auto-Compression for BYOK

#### agentIntent.ts
- Force-enables backgroundCompactionEnabled for non-copilot models
- Reason: BYOK models have no server-side context management

### Phase 4: DeepSeek reasoning_content Support

#### thinking.ts
- Added reasoning_content?: string to ThinkingDataInMessage and RawThinkingDelta

#### thinkingUtils.ts
- getThinkingDeltaText() checks reasoning_content after reasoning_text

#### openAIEndpoint.ts (+101 lines, most critical)

createRequestBody callback:
- Distinguishes DeepSeek-style (reasoning_content) from others (cot_id/cot_summary)
- Passes reasoning_effort as top-level parameter

interceptBody method (~90 new lines):
- Applies user-configured sampling parameters: temperature, top_p, top_k
- reasoning_content multi-turn handling:
  - assistant messages: ensures reasoning_content exists (priority: existing > cot_summary > thinking data > placeholder)
  - non-assistant messages: removes reasoning_content
- includeReasoning: false strips all reasoning_content
- Injects thinking: { type: enabled } and reasoning_effort for Chat Completions API
- Reason: DeepSeek API requires reasoning_content on assistant messages or returns 400

### Phase 5: Generic Model Enhancements

#### byokProvider.ts (+41 lines)
- Added includeReasoning, temperature, top_p, top_k to BYOKModelCapabilities
- resolveModelInfo(): added reasoning_effort mapping
- byokKnownModelToAPIInfo(): auto-generates configurationSchema for Thinking Effort UI

#### customOAIProvider.ts (+99 lines)
- Added name, label fields to CustomOAIModelProviderConfig
- Added adaptiveThinking, supportsReasoningEffort, includeReasoning, temperature, top_p, top_k
- migrateConfig(): single call to avoid group overwriting
- getAllModels(): label > name > CustomOAI display name fallback
- New: KNOWN_THINKING_MODEL_PATTERNS and resolveKnownModelDefaults()
  - Auto-detects: deepseek-v3/v4, deepseek-r1, qwq/qwen-q

#### languageModelAccess.ts
- BYOK models show effort picker
- NoAuthUser returns undefined to prevent Copilot model registration
- storeUsageForCorrelation() for usage passthrough

#### configurationService.ts
- CustomOAIModels type updated with all new fields

### Phase 6: GitHub Auth Bypass (No-Login Mode)

#### byokContribution.ts
- Registers BYOK providers without Copilot token

#### copilotTokenManager.ts
- Removed GitHubLoginFailed early return
- Anonymous auth failure returns synthetic no-auth token (sku: no_auth_limited_copilot)

#### conversationFeature.ts
- Always sets activated=true and enabled=true

#### contextKeys.contribution.ts
- GitHubLoginFailedError triggers activation instead of error

#### chatMLFetcher.ts
- BYOK models skip Copilot token requirement
- copilotToken type changed to CopilotToken | undefined

#### defaultIntentRequestHandler.ts
- New _getCopilotPlanSafe() with try-catch

#### codeMapper.ts, inlineChatIntent.ts
- copilotPlan access wrapped in try-catch

### package.json Changes
- Name: vscode-copilot-chat-CN, publisher: clockzinc
- Disabled Anthropic, xAI, Google vendors (when: false)
- Added includeReasoning, supportsReasoningEffort, temperature, top_p, top_k to model schemas

### Other Changes
- chatPromptFileService.ts: null check for vscode.chat.customAgents
- package.nls.json: added reviewFileChange key
- package-lock.json: npm auto-updated peer dependencies

---

## Upstream Merge Guide

When microsoft/vscode-copilot-chat releases a new version:

git remote add upstream https://github.com/microsoft/vscode-copilot-chat.git
git fetch upstream
git merge upstream/main --allow-unrelated-histories

### High-Priority Conflict Files

1. src/extension/byok/node/openAIEndpoint.ts - Core logic
2. src/extension/byok/vscode-node/customOAIProvider.ts - BYOK provider
3. src/extension/byok/common/byokProvider.ts - Model capabilities
4. src/extension/conversation/vscode-node/chatParticipants.ts - Chat participants
5. src/extension/prompt/node/chatMLFetcher.ts - Request sending
6. src/platform/thinking/common/thinking.ts - Thinking types
7. package.json - Plugin metadata

### Post-Merge Verification
- npm install && npm run compile
- Test DeepSeek and Mimo basic conversations
- Test thinking/reasoning_content multi-turn
- Test Thinking Effort selector UI
- Update version number, keep publisher: clockzinc
