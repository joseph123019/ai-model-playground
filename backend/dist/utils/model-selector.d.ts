export interface ModelInfo {
    id: string;
    displayName: string;
    provider: 'openai' | 'anthropic';
    inputCost: number;
    outputCost: number;
    speed: 'fast' | 'medium' | 'slow';
    tier: 'budget' | 'standard' | 'premium';
}
export declare const AVAILABLE_MODELS: Record<string, ModelInfo>;
export type SelectionMode = 'cheapest' | 'fastest-cheapest' | 'premium' | 'manual';
export interface ModelPair {
    openai: ModelInfo;
    anthropic: ModelInfo;
}
export declare function getModelPair(mode: SelectionMode, manualModels?: {
    openai?: string;
    anthropic?: string;
}): ModelPair;
export declare function getOpenAIModels(): ModelInfo[];
export declare function getAnthropicModels(): ModelInfo[];
export declare function getAverageCost(modelId: string): number;
