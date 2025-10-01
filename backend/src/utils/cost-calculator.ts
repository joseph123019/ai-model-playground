// Cost per 1K tokens (in USD)
export const MODEL_COSTS = {
  // OpenAI Models
  'gpt-4o': {
    input: 0.0025,
    output: 0.01,
  },
  'gpt-4o-mini': {
    input: 0.00015,
    output: 0.0006,
  },
  // Anthropic Models (non-deprecated)
  'claude-sonnet-4-20250514': {
    input: 0.003,
    output: 0.015,
  },
  'claude-opus-4-20250514': {
    input: 0.015,
    output: 0.075,
  },
  // Legacy models (kept for backward compatibility)
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

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const costs = MODEL_COSTS[model];
  if (!costs) {
    console.warn(`Unknown model: ${model}, using default costs`);
    return 0;
  }

  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  
  return inputCost + outputCost;
}

export function getModelDisplayName(model: string): string {
  const displayNames: Record<string, string> = {
    // OpenAI
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    // Anthropic (non-deprecated)
    'claude-sonnet-4-20250514': 'Claude Sonnet 4',
    'claude-opus-4-20250514': 'Claude Opus 4',
    // Legacy
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
    'claude-opus-4-1-20250805': 'Claude Opus 4.1',
  };
  
  return displayNames[model] || model;
}
