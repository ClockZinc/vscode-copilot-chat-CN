/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Config, ConfigKey, IConfigurationService } from '../../../platform/configuration/common/configurationService';
import { EndpointEditToolName, ModelSupportedEndpoint } from '../../../platform/endpoint/common/endpointProvider';
import { IVSCodeExtensionContext } from '../../../platform/extContext/common/extensionContext';
import { ILogService } from '../../../platform/log/common/logService';
import { IFetcherService } from '../../../platform/networking/common/fetcherService';
import { IExperimentationService } from '../../../platform/telemetry/common/nullExperimentationService';
import { IStringDictionary } from '../../../util/vs/base/common/collections';
import { IInstantiationService } from '../../../util/vs/platform/instantiation/common/instantiation';
import { byokKnownModelToAPIInfo, resolveModelInfo } from '../common/byokProvider';
import { OpenAIEndpoint } from '../node/openAIEndpoint';
import { AbstractOpenAICompatibleLMProvider, LanguageModelChatConfiguration, OpenAICompatibleLanguageModelChatInformation } from './abstractLanguageModelChatProvider';
import { IBYOKStorageService } from './byokStorageService';

export function resolveCustomOAIUrl(modelId: string, url: string): string {
	// The fully resolved url was already passed in
	if (hasExplicitApiPath(url)) {
		return url;
	}

	// Remove the trailing slash
	if (url.endsWith('/')) {
		url = url.slice(0, -1);
	}

	// Default to chat completions for base URLs
	const defaultApiPath = '/chat/completions';

	// Check if URL already contains any version pattern like /v1, /v2, etc
	const versionPattern = /\/v\d+$/;
	if (versionPattern.test(url)) {
		return `${url}${defaultApiPath}`;
	}

	// For standard OpenAI-compatible endpoints, just append the standard path
	return `${url}/v1${defaultApiPath}`;
}

export function hasExplicitApiPath(url: string): boolean {
	return url.includes('/responses') || url.includes('/chat/completions');
}

export interface CustomOAIModelProviderConfig extends LanguageModelChatConfiguration {
	/** Provider group name from chatLanguageModels.json (e.g., "MIMO", "deepseek"). Auto-generated when creating via UI. */
	name?: string;
	/** Custom display label for this provider group in the model picker (e.g., "DeepSeek 官方", "小米 MIMO"). Falls back to name, then "CustomOAI". */
	label?: string;
	url?: string;
	models?: CustomOAIModelConfig[];
}

interface _CustomOAIModelConfig {
	name: string;
	url: string;
	maxInputTokens: number;
	maxOutputTokens: number;
	toolCalling: boolean;
	vision: boolean;
	thinking?: boolean;
	adaptiveThinking?: boolean;
	streaming?: boolean;
	editTools?: EndpointEditToolName[];
	requestHeaders?: Record<string, string>;
	zeroDataRetentionEnabled?: boolean;
	/** Reasoning effort levels supported by this model (e.g., ['high', 'max'] for DeepSeek V4) */
	supportsReasoningEffort?: string[];
	/** Whether to include reasoning_content in multi-turn requests. Default: true for thinking models. */
	includeReasoning?: boolean;
	/** Sampling temperature (0.0 - 2.0). Higher = more random. */
	temperature?: number;
	/** Nucleus sampling: only tokens with cumulative probability up to top_p are considered. */
	top_p?: number;
	/** Top-K sampling: only the top K most likely tokens are considered. */
	top_k?: number;
}

export interface CustomOAIModelConfig extends _CustomOAIModelConfig {
	id: string;
}

export abstract class AbstractCustomOAIBYOKModelProvider extends AbstractOpenAICompatibleLMProvider<CustomOAIModelProviderConfig> {

	constructor(
		id: string,
		name: string,
		byokStorageService: IBYOKStorageService,
		@ILogService logService: ILogService,
		@IFetcherService fetcherService: IFetcherService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IConfigurationService configurationService: IConfigurationService,
		@IExperimentationService expService: IExperimentationService,
		@IVSCodeExtensionContext private readonly _extensionContext: IVSCodeExtensionContext
	) {
		super(id, name, undefined, byokStorageService, fetcherService, logService, instantiationService, configurationService, expService);
	}

	protected async migrateConfig(configKey: Config<IStringDictionary<_CustomOAIModelConfig>>, providerName: string, providerGroupName: string): Promise<void> {
		// Check if migration has already been completed
		const migrationKey = `copilot-byok-migration-${providerName}-${configKey}`;
		const migrationCompleted = this._extensionContext.globalState.get<boolean>(migrationKey, false);
		if (migrationCompleted) {
			return;
		}

		const allModels: Array<CustomOAIModelConfig & { requiresAPIKey?: boolean }> = [];
		const customOAIModelProviderConfig = this._configurationService.getConfig<IStringDictionary<_CustomOAIModelConfig>>(configKey);
		let firstApiKey = '';
		for (const [modelId, modelConfig] of Object.entries(customOAIModelProviderConfig)) {
			const apiKey = await this._byokStorageService.getAPIKey(providerName, modelId) ?? '';
			if (apiKey && !firstApiKey) {
				firstApiKey = apiKey;
			}
			allModels.push({ ...modelConfig, id: modelId, requiresAPIKey: undefined });
		}
		if (allModels.length > 0) {
			// Single call with ALL models to avoid overwriting (lm.migrateLanguageModelsProviderGroup is a replace operation)
			await this.configureDefaultGroupIfExists(providerGroupName, { models: allModels, apiKey: firstApiKey || undefined });
			// Mark migration as completed instead of deleting the config
			await this._extensionContext.globalState.update(migrationKey, true);
		}
	}

	protected override async configureDefaultGroupWithApiKeyOnly(): Promise<string | undefined> {
		// No-op: Custom OAI models are configured separately via migration
		return;
	}

	protected override async getAllModels(silent: boolean, apiKey: string | undefined, configuration: CustomOAIModelProviderConfig | undefined): Promise<OpenAICompatibleLanguageModelChatInformation<CustomOAIModelProviderConfig>[]> {
		if (configuration?.url) {
			return super.getAllModels(silent, apiKey, configuration);
		}
		const models: OpenAICompatibleLanguageModelChatInformation<CustomOAIModelProviderConfig>[] = [];
		// Use custom label > group name > provider name for display in picker
		const displayLabel = configuration?.label || configuration?.name || this._name;
		if (Array.isArray(configuration?.models)) {
			for (const modelConfig of configuration.models) {
				models.push({
					...byokKnownModelToAPIInfo(displayLabel, modelConfig.id, modelConfig),
					url: modelConfig.url
				});
			}
		}
		return models;
	}

	protected override async createOpenAIEndPoint(model: OpenAICompatibleLanguageModelChatInformation<CustomOAIModelProviderConfig>): Promise<OpenAIEndpoint> {
		const url = this.resolveUrl(model.id, model.url);
		const modelConfiguration = model.configuration?.models?.find(m => m.id === model.id);
		// Apply known model defaults for thinking-capable models (e.g., DeepSeek V3/V4, R1, QwQ)
		// This allows users to configure via Provider Group UI without specifying thinking fields
		const knownDefaults = resolveKnownModelDefaults(model.id, modelConfiguration ?? {});
		const modelCapabilities = {
			maxInputTokens: modelConfiguration?.maxInputTokens ?? knownDefaults.maxInputTokens ?? model.maxInputTokens,
			maxOutputTokens: modelConfiguration?.maxOutputTokens ?? knownDefaults.maxOutputTokens ?? model.maxOutputTokens,
			toolCalling: modelConfiguration?.toolCalling ?? (knownDefaults.toolCalling ?? (!!model.capabilities?.toolCalling || false)),
			vision: modelConfiguration?.vision ?? (!!model.capabilities?.imageInput || false),
			name: model.name,
			url,
			thinking: modelConfiguration?.thinking ?? knownDefaults.thinking ?? false,
			adaptiveThinking: modelConfiguration?.adaptiveThinking,
			supportsReasoningEffort: modelConfiguration?.supportsReasoningEffort ?? knownDefaults.supportsReasoningEffort,
			streaming: modelConfiguration?.streaming ?? knownDefaults.streaming,
			requestHeaders: modelConfiguration?.requestHeaders,
			zeroDataRetentionEnabled: modelConfiguration?.zeroDataRetentionEnabled,
			includeReasoning: modelConfiguration?.includeReasoning,
			temperature: modelConfiguration?.temperature,
			top_p: modelConfiguration?.top_p,
			top_k: modelConfiguration?.top_k,
		};
		const displayLabel = model.configuration?.label || model.configuration?.name || this._name;
		const modelInfo = resolveModelInfo(model.id, displayLabel, undefined, modelCapabilities);
		if (modelCapabilities?.url?.includes('/responses')) {
			modelInfo.supported_endpoints = [
				ModelSupportedEndpoint.ChatCompletions,
				ModelSupportedEndpoint.Responses
			];
		}
		return this._instantiationService.createInstance(OpenAIEndpoint, modelInfo, model.configuration?.apiKey ?? '', url);
	}

	protected getModelsBaseUrl(configuration: CustomOAIModelProviderConfig | undefined): string | undefined {
		return configuration?.url;
	}

	protected abstract resolveUrl(modelId: string, url: string): string;
}

/**
 * Known model defaults for models that support thinking/reasoning.
 * When a user configures a model via Provider Group UI without specifying these fields,
 * we auto-detect based on model ID patterns.
 */
const KNOWN_THINKING_MODEL_PATTERNS: Array<{ pattern: RegExp; defaults: Partial<_CustomOAIModelConfig> }> = [
	{
		pattern: /deepseek[-.]v[34]/i,
		defaults: { thinking: true, supportsReasoningEffort: ['high', 'max'], maxOutputTokens: 16384 }
	},
	{
		pattern: /deepseek[-.]r1/i,
		defaults: { thinking: true, supportsReasoningEffort: ['high', 'max'], maxOutputTokens: 16384 }
	},
	{
		pattern: /qwq|qwen[-.]q/i,
		defaults: { thinking: true, maxOutputTokens: 16384 }
	},
];

function resolveKnownModelDefaults(modelId: string, config: Partial<_CustomOAIModelConfig>): Partial<_CustomOAIModelConfig> {
	// Only apply defaults for fields that are NOT explicitly set by user
	for (const { pattern, defaults } of KNOWN_THINKING_MODEL_PATTERNS) {
		if (pattern.test(modelId)) {
			return {
				thinking: config.thinking ?? defaults.thinking,
				supportsReasoningEffort: config.supportsReasoningEffort ?? defaults.supportsReasoningEffort,
				maxOutputTokens: config.maxOutputTokens || defaults.maxOutputTokens || 4096,
				maxInputTokens: config.maxInputTokens || defaults.maxInputTokens || 128000,
				streaming: config.streaming ?? defaults.streaming ?? true,
				toolCalling: config.toolCalling ?? defaults.toolCalling ?? true,
			};
		}
	}
	return {};
}

export class CustomOAIBYOKModelProvider extends AbstractCustomOAIBYOKModelProvider {

	static readonly providerName: string = 'CustomOAI';
	private providerName: string = CustomOAIBYOKModelProvider.providerName;

	constructor(
		_byokStorageService: IBYOKStorageService,
		@ILogService logService: ILogService,
		@IFetcherService fetcherService: IFetcherService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IConfigurationService configurationService: IConfigurationService,
		@IExperimentationService expService: IExperimentationService,
		@IVSCodeExtensionContext extensionContext: IVSCodeExtensionContext
	) {
		super(CustomOAIBYOKModelProvider.providerName.toLowerCase(), CustomOAIBYOKModelProvider.providerName, _byokStorageService, logService, fetcherService, instantiationService, configurationService, expService, extensionContext);
		this.migrateExistingConfigs();
	}

	// TODO: Remove this after 6 months
	private async migrateExistingConfigs(): Promise<void> {
		await this.migrateConfig(ConfigKey.Deprecated.CustomOAIModels, this.providerName, this.providerName);
	}

	protected resolveUrl(modelId: string, url: string): string {
		return resolveCustomOAIUrl(modelId, url);
	}
}