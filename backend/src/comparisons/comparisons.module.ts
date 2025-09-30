import { Module } from '@nestjs/common';
import { ComparisonsGateway } from './comparisons.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenaiService } from '../services/openai.service';
import { AnthropicService } from '../services/anthropic.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey',
    }),
  ],
  providers: [ComparisonsGateway, OpenaiService, AnthropicService],
})
export class ComparisonsModule {}
