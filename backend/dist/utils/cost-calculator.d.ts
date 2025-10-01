export declare const MODEL_COSTS: {
    'gpt-4o': {
        input: number;
        output: number;
    };
    'gpt-4o-mini': {
        input: number;
        output: number;
    };
    'claude-sonnet-4-20250514': {
        input: number;
        output: number;
    };
    'claude-opus-4-20250514': {
        input: number;
        output: number;
    };
    'claude-3-5-sonnet-20241022': {
        input: number;
        output: number;
    };
    'claude-3-5-haiku-20241022': {
        input: number;
        output: number;
    };
    'claude-opus-4-1-20250805': {
        input: number;
        output: number;
    };
};
export declare function calculateCost(model: string, inputTokens: number, outputTokens: number): number;
export declare function getModelDisplayName(model: string): string;
