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
import { getModelPair, SelectionMode, AVAILABLE_MODELS } from '../utils/model-selector';

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
      console.log('🔌 New WebSocket connection attempt');
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('❌ No token provided, disconnecting');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        console.log('❌ User not found, disconnecting');
        client.disconnect();
        return;
      }

      client.user = {
        id: user.id,
        email: user.email,
      };

      console.log(`✅ User ${user.email} connected (Socket ID: ${client.id})`);
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
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
    @MessageBody() data: { 
      prompt: string;
      selectionMode?: SelectionMode;
      manualModels?: { openai?: string; anthropic?: string };
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { prompt, selectionMode = 'cheapest', manualModels } = data;
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

      // Get model pair based on selection
      const modelPair = getModelPair(selectionMode, manualModels);

      // Start both AI models simultaneously
      const models = [
        { service: this.openaiService, model: modelPair.openai.id, name: modelPair.openai.displayName },
        { service: this.anthropicService, model: modelPair.anthropic.id, name: modelPair.anthropic.displayName },
      ];

      const responses = await Promise.allSettled(
        models.map(async ({ service, model, name }) => {
          const startTime = Date.now();
          
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
            let lastChunk: any = null;
            
            // Stream response
            for await (const chunk of service.streamResponse(prompt, model)) {
              lastChunk = chunk;
              
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

            // Calculate duration
            const duration = Date.now() - startTime;

            // Mark as complete with final data
            await this.prisma.response.update({
              where: { id: response.id },
              data: { 
                status: 'complete',
                duration,
                content: lastChunk?.content || '',
                tokens: lastChunk?.tokens || 0,
                cost: lastChunk?.cost || 0,
              },
            });

            client.emit('statusUpdate', {
              model: name,
              status: 'complete',
              responseId: response.id,
              duration,
            });

            return { model: name, success: true, duration };
          } catch (error) {
            const duration = Date.now() - startTime;
            
            // Mark as error
            await this.prisma.response.update({
              where: { id: response.id },
              data: { 
                status: 'error',
                duration,
              },
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
        const responsesData = sessionWithResponses.responses.map((r) => ({
          model: r.model,
          tokens: r.tokens,
          cost: r.cost,
          status: r.status,
          duration: r.duration,
        }));

        // Calculate totals and find fastest
        const totalTokens = responsesData.reduce((sum, r) => sum + (r.tokens || 0), 0);
        const totalCost = responsesData.reduce((sum, r) => sum + (r.cost || 0), 0);
        const fastestModel = responsesData.reduce((fastest, r) => 
          (r.duration && (!fastest.duration || r.duration < fastest.duration)) ? r : fastest
        , responsesData[0]);

        client.emit('finalMetrics', {
          sessionId: session.id,
          responses: responsesData,
          totals: {
            tokens: totalTokens,
            cost: totalCost,
            fastestModel: fastestModel.model,
            fastestDuration: fastestModel.duration,
          },
        });
      }
    } catch (error) {
      console.error('Comparison error:', error);
      client.emit('error', { message: 'Internal server error' });
    }
  }
}
