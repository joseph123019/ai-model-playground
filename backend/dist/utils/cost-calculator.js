"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_COSTS = void 0;
exports.calculateCost = calculateCost;
exports.getModelDisplayName = getModelDisplayName;
exports.MODEL_COSTS = {
    'gpt-4o': {
        input: 0.0025,
        output: 0.01,
    },
    'gpt-4o-mini': {
        input: 0.00015,
        output: 0.0006,
    },
    'claude-sonnet-4-20250514': {
        input: 0.003,
        output: 0.015,
    },
    'claude-opus-4-20250514': {
        input: 0.015,
        output: 0.075,
    },
    'claude-3-5-sonnet-20241022': {
        input: 0.003,
        output: 0.015,
    },
    'claude-3-5-haiku-20241022': {
        input: 0.0008,
        output: 0.004,
    },
    'claude-opus-4-1-20250805': {
        input: 0.015,
        output: 0.075,
    },
};
function calculateCost(model, inputTokens, outputTokens) {
    const costs = exports.MODEL_COSTS[model];
    if (!costs) {
        console.warn(`Unknown model: ${model}, using default costs`);
        return 0;
    }
    const inputCost = (inputTokens / 1000) * costs.input;
    const outputCost = (outputTokens / 1000) * costs.output;
    return inputCost + outputCost;
}
function getModelDisplayName(model) {
    const displayNames = {
        'gpt-4o': 'GPT-4o',
        'gpt-4o-mini': 'GPT-4o Mini',
        'claude-sonnet-4-20250514': 'Claude Sonnet 4',
        'claude-opus-4-20250514': 'Claude Opus 4',
        'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
        'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
        'claude-opus-4-1-20250805': 'Claude Opus 4.1',
    };
    return displayNames[model] || model;
}
//# sourceMappingURL=cost-calculator.js.map