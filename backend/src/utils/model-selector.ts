// Model selection utility for AI Model Playground

export interface ModelInfo {
  id: string;
  displayName: string;
  provider: 'openai' | 'anthropic';
  inputCost: number;  // per 1K tokens
  outputCost: number; // per 1K tokens
  speed: 'fast' | 'medium' | 'slow';
  tier: 'budget' | 'standard' | 'premium';
}

export const AVAILABLE_MODELS: Record<string, ModelInfo> = {
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

export type SelectionMode = 'cheapest' | 'fastest-cheapest' | 'premium' | 'manual';

export interface ModelPair {
  openai: ModelInfo;
  anthropic: ModelInfo;
}

/**
 * Get model pair based on selection mode
 */
export function getModelPair(mode: SelectionMode, manualModels?: { openai?: string; anthropic?: string }): ModelPair {
  if (mode === 'manual' && manualModels) {
    const openaiModel = manualModels.openai ? AVAILABLE_MODELS[manualModels.openai] : null;
    const anthropicModel = manualModels.anthropic ? AVAILABLE_MODELS[manualModels.anthropic] : null;
    
    if (openaiModel && anthropicModel) {
      return { openai: openaiModel, anthropic: anthropicModel };
    }
  }

  switch (mode) {
    case 'cheapest':
      return {
        openai: AVAILABLE_MODELS['gpt-4o-mini'],
        anthropic: AVAILABLE_MODELS['claude-sonnet-4-20250514'],
      };
    
    case 'fastest-cheapest':
      return {
        openai: AVAILABLE_MODELS['gpt-4o-mini'],
        anthropic: AVAILABLE_MODELS['claude-sonnet-4-20250514'],
      };
    
    case 'premium':
      return {
        openai: AVAILABLE_MODELS['gpt-4o'],
        anthropic: AVAILABLE_MODELS['claude-opus-4-20250514'],
      };
    
    default:
      // Default to cheapest
      return {
        openai: AVAILABLE_MODELS['gpt-4o-mini'],
        anthropic: AVAILABLE_MODELS['claude-sonnet-4-20250514'],
      };
  }
}

/**
 * Get all OpenAI models
 */
export function getOpenAIModels(): ModelInfo[] {
  return Object.values(AVAILABLE_MODELS).filter(m => m.provider === 'openai');
}

/**
 * Get all Anthropic models
 */
export function getAnthropicModels(): ModelInfo[] {
  return Object.values(AVAILABLE_MODELS).filter(m => m.provider === 'anthropic');
}

/**
 * Calculate average cost per 1K tokens (input + output)
 */
export function getAverageCost(modelId: string): number {
  const model = AVAILABLE_MODELS[modelId];
  if (!model) return 0;
  return (model.inputCost + model.outputCost) / 2;
}
