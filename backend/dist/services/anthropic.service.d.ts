export interface StreamResponse {
    content: string;
    tokens: number;
    cost: number;
    model: string;
}
export declare class AnthropicService {
    private readonly logger;
    private anthropic;
    constructor();
    streamResponse(prompt: string, model?: string): AsyncGenerator<StreamResponse, void, unknown>;
    private estimateTokens;
}
