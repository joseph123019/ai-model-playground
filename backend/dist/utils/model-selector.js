"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVAILABLE_MODELS = void 0;
exports.getModelPair = getModelPair;
exports.getOpenAIModels = getOpenAIModels;
exports.getAnthropicModels = getAnthropicModels;
exports.getAverageCost = getAverageCost;
exports.AVAILABLE_MODELS = {
    'gpt-4o': {
        id: 'gpt-4o',
        displayName: 'GPT-4o',
        provider: 'openai',
        inputCost: 0.0025,
        outputCost: 0.01,
        speed: 'fast',
        tier: 'standard',
    },
    'gpt-4o-mini': {
        id: 'gpt-4o-mini',
        displayName: 'GPT-4o Mini',
        provider: 'openai',
        inputCost: 0.00015,
        outputCost: 0.0006,
        speed: 'fast',
        tier: 'budget',
    },
    'claude-sonnet-4-20250514': {
        id: 'claude-sonnet-4-20250514',
        displayName: 'Claude Sonnet 4',
        provider: 'anthropic',
        inputCost: 0.003,
        outputCost: 0.015,
        speed: 'fast',
        tier: 'standard',
    },
    'claude-opus-4-20250514': {
        id: 'claude-opus-4-20250514',
        displayName: 'Claude Opus 4',
        provider: 'anthropic',
        inputCost: 0.015,
        outputCost: 0.075,
        speed: 'medium',
        tier: 'premium',
    },
};
function getModelPair(mode, manualModels) {
    if (mode === 'manual' && manualModels) {
        const openaiModel = manualModels.openai ? exports.AVAILABLE_MODELS[manualModels.openai] : null;
        const anthropicModel = manualModels.anthropic ? exports.AVAILABLE_MODELS[manualModels.anthropic] : null;
        if (openaiModel && anthropicModel) {
            return { openai: openaiModel, anthropic: anthropicModel };
        }
    }
    switch (mode) {
        case 'cheapest':
            return {
                openai: exports.AVAILABLE_MODELS['gpt-4o-mini'],
                anthropic: exports.AVAILABLE_MODELS['claude-sonnet-4-20250514'],
            };
        case 'fastest-cheapest':
            return {
                openai: exports.AVAILABLE_MODELS['gpt-4o-mini'],
                anthropic: exports.AVAILABLE_MODELS['claude-sonnet-4-20250514'],
            };
        case 'premium':
            return {
                openai: exports.AVAILABLE_MODELS['gpt-4o'],
                anthropic: exports.AVAILABLE_MODELS['claude-opus-4-20250514'],
            };
        default:
            return {
                openai: exports.AVAILABLE_MODELS['gpt-4o-mini'],
                anthropic: exports.AVAILABLE_MODELS['claude-sonnet-4-20250514'],
            };
    }
}
function getOpenAIModels() {
    return Object.values(exports.AVAILABLE_MODELS).filter(m => m.provider === 'openai');
}
function getAnthropicModels() {
    return Object.values(exports.AVAILABLE_MODELS).filter(m => m.provider === 'anthropic');
}
function getAverageCost(modelId) {
    const model = exports.AVAILABLE_MODELS[modelId];
    if (!model)
        return 0;
    return (model.inputCost + model.outputCost) / 2;
}
//# sourceMappingURL=model-selector.js.map