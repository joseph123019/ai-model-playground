export declare const MODEL_COSTS: {
    'gpt-4o': {
        input: number;
        output: number;
    };
    'gpt-4o-mini': {
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
    'claude-3-opus-20240229': {
        input: number;
        output: number;
    };
    'claude-3-sonnet-20240229': {
        input: number;
        output: number;
    };
    'claude-3-haiku-20240307': {
        input: number;
        output: number;
    };
};
export declare function calculateCost(model: string, inputTokens: number, outputTokens: number): number;
export declare function getModelDisplayName(model: string): string;
