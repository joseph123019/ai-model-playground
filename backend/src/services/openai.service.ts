import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { calculateCost } from '../utils/cost-calculator';

export interface StreamResponse {
  content: string;
  tokens: number;
  cost: number;
  model: string;
}

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async *streamResponse(
    prompt: string,
    model: string = 'gpt-4o',
  ): AsyncGenerator<StreamResponse, void, unknown> {
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
            cost: calculateCost(model, inputTokens, outputTokens),
            model,
          };
        }

        // Update input tokens from usage if available
        if (chunk.usage?.prompt_tokens) {
          inputTokens = chunk.usage.prompt_tokens;
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
      this.logger.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}
