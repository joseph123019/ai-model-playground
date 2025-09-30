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
var OpenaiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenaiService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
const cost_calculator_1 = require("../utils/cost-calculator");
let OpenaiService = OpenaiService_1 = class OpenaiService {
    logger = new common_1.Logger(OpenaiService_1.name);
    openai;
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async *streamResponse(prompt, model = 'gpt-4o') {
        try {
            const stream = await this.openai.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                stream: true,
            });
            let fullContent = '';
            let inputTokens = 0;
            let outputTokens = 0;
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullContent += content;
                    outputTokens += this.estimateTokens(content);
                    yield {
                        content: fullContent,
                        tokens: inputTokens + outputTokens,
                        cost: (0, cost_calculator_1.calculateCost)(model, inputTokens, outputTokens),
                        model,
                    };
                }
                if (chunk.usage?.prompt_tokens) {
                    inputTokens = chunk.usage.prompt_tokens;
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
            this.logger.error('OpenAI API error:', error);
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
};
exports.OpenaiService = OpenaiService;
exports.OpenaiService = OpenaiService = OpenaiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], OpenaiService);
//# sourceMappingURL=openai.service.js.map