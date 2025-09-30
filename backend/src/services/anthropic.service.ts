import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { calculateCost } from '../utils/cost-calculator';

export interface StreamResponse {
  content: string;
  tokens: number;
  cost: number;
  model: string;
}

@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async *streamResponse(
    prompt: string,
    model: string = 'claude-3-5-sonnet-20241022',
  ): AsyncGenerator<StreamResponse, void, unknown> {
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
        } else if (event.type === 'content_block_delta') {
          const content = (event.delta as any).text || '';
          fullContent += content;
          outputTokens += this.estimateTokens(content);
          
          yield {
            content: fullContent,
            tokens: inputTokens + outputTokens,
            cost: calculateCost(model, inputTokens, outputTokens),
            model,
          };
        } else if (event.type === 'message_delta') {
          // Update output tokens from usage
          if (event.usage?.output_tokens) {
            outputTokens = event.usage.output_tokens;
          }
        }
      }

      // Final response with accurate token counts
      const finalTokens = inputTokens + outputTokens;
      const finalCost = calculateCost(model, inputTokens, outputTokens);

      yield {
        content: fullContent,
        tokens: finalTokens,
        cost: finalCost,
        model,
      };
    } catch (error) {
      this.logger.error('Anthropic API error:', error);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}
