export interface StreamResponse {
    content: string;
    tokens: number;
    cost: number;
    model: string;
}
export declare class OpenaiService {
    private readonly logger;
    private openai;
    constructor();
    streamResponse(prompt: string, model?: string): AsyncGenerator<StreamResponse, void, unknown>;
    private estimateTokens;
}
