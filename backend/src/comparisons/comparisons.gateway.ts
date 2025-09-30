import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OpenaiService } from '../services/openai.service';
import { AnthropicService } from '../services/anthropic.service';
import { getModelDisplayName } from '../utils/cost-calculator';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ComparisonsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private openaiService: OpenaiService,
    private anthropicService: AnthropicService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.user = {
        id: user.id,
        email: user.email,
      };

      console.log(`User ${user.email} connected`);
    } catch (error) {
      console.error('Authentication error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      console.log(`User ${client.user.email} disconnected`);
    }
  }

  @SubscribeMessage('startComparison')
  async handleStartComparison(
    @MessageBody() data: { prompt: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { prompt } = data;
    if (!prompt?.trim()) {
      client.emit('error', { message: 'Prompt is required' });
      return;
    }

    try {
      // Create session
      const session = await this.prisma.session.create({
        data: {
          prompt,
          userId: client.user.id,
        },
      });

      // Emit session created
      client.emit('sessionCreated', { sessionId: session.id });

      // Start both AI models simultaneously
      const models = [
        { service: this.openaiService, model: 'gpt-4o', name: 'GPT-4o' },
        { service: this.anthropicService, model: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      ];

      const responses = await Promise.allSettled(
        models.map(async ({ service, model, name }) => {
          // Create response record
          const response = await this.prisma.response.create({
            data: {
              model: name,
              content: '',
              status: 'typing',
              sessionId: session.id,
            },
          });

          // Emit typing status
          client.emit('statusUpdate', {
            model: name,
            status: 'typing',
            responseId: response.id,
          });

          try {
            // Stream response
            for await (const chunk of service.streamResponse(prompt, model)) {
              // Update response in database
              await this.prisma.response.update({
                where: { id: response.id },
                data: {
                  content: chunk.content,
                  tokens: chunk.tokens,
                  cost: chunk.cost,
                  status: 'streaming',
                },
              });

              // Emit chunk to client
              client.emit('responseChunk', {
                model: name,
                content: chunk.content,
                tokens: chunk.tokens,
                cost: chunk.cost,
                responseId: response.id,
              });
            }

            // Mark as complete
            await this.prisma.response.update({
              where: { id: response.id },
              data: { status: 'complete' },
            });

            client.emit('statusUpdate', {
              model: name,
              status: 'complete',
              responseId: response.id,
            });

            return { model: name, success: true };
          } catch (error) {
            // Mark as error
            await this.prisma.response.update({
              where: { id: response.id },
              data: { status: 'error' },
            });

            client.emit('statusUpdate', {
              model: name,
              status: 'error',
              responseId: response.id,
            });

            client.emit('error', {
              model: name,
              message: error.message,
            });

            return { model: name, success: false, error: error.message };
          }
        }),
      );

      // Emit final metrics
      const sessionWithResponses = await this.prisma.session.findUnique({
        where: { id: session.id },
        include: { responses: true },
      });

      if (sessionWithResponses) {
        client.emit('finalMetrics', {
          sessionId: session.id,
          responses: sessionWithResponses.responses.map((r) => ({
            model: r.model,
            tokens: r.tokens,
            cost: r.cost,
            status: r.status,
          })),
        });
      }
    } catch (error) {
      console.error('Comparison error:', error);
      client.emit('error', { message: 'Internal server error' });
    }
  }
}
