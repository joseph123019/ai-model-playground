"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AnthropicService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicService = void 0;
const common_1 = require("@nestjs/common");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const cost_calculator_1 = require("../utils/cost-calculator");
let AnthropicService = AnthropicService_1 = class AnthropicService {
    logger = new common_1.Logger(AnthropicService_1.name);
    anthropic;
    constructor() {
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    async *streamResponse(prompt, model = 'claude-3-5-sonnet-20241022') {
        try {
            const stream = await this.anthropic.messages.create({
                model,
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
                stream: true,
            });
            let fullContent = '';
            let inputTokens = 0;
            let outputTokens = 0;
            for await (const event of stream) {
                if (event.type === 'message_start') {
                    inputTokens = event.message.usage.input_tokens;
                }
                else if (event.type === 'content_block_delta') {
                    const content = event.delta.text || '';
                    fullContent += content;
                    outputTokens += this.estimateTokens(content);
                    yield {
                        content: fullContent,
                        tokens: inputTokens + outputTokens,
                        cost: (0, cost_calculator_1.calculateCost)(model, inputTokens, outputTokens),
                        model,
                    };
                }
                else if (event.type === 'message_delta') {
                    if (event.usage?.output_tokens) {
                        outputTokens = event.usage.output_tokens;
                    }
                }
            }
            const finalTokens = inputTokens + outputTokens;
            const finalCost = (0, cost_calculator_1.calculateCost)(model, inputTokens, outputTokens);
            yield {
                content: fullContent,
                tokens: finalTokens,
                cost: finalCost,
                model,
            };
        }
        catch (error) {
            this.logger.error('Anthropic API error:', error);
            throw new Error(`Anthropic API error: ${error.message}`);
        }
    }
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
};
exports.AnthropicService = AnthropicService;
exports.AnthropicService = AnthropicService = AnthropicService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AnthropicService);
//# sourceMappingURL=anthropic.service.js.map