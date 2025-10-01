import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async getUserSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      include: {
        responses: {
          select: {
            id: true,
            model: true,
            tokens: true,
            cost: true,
            status: true,
            duration: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(session => ({
      id: session.id,
      prompt: session.prompt,
      createdAt: session.createdAt,
      responses: session.responses,
      totalTokens: session.responses.reduce((sum, r) => sum + (r.tokens || 0), 0),
      totalCost: session.responses.reduce((sum, r) => sum + (r.cost || 0), 0),
    }));
  }

  async getSessionById(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        responses: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Verify user owns this session
    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    return {
      id: session.id,
      prompt: session.prompt,
      createdAt: session.createdAt,
      responses: session.responses,
      user: session.user,
      totalTokens: session.responses.reduce((sum, r) => sum + (r.tokens || 0), 0),
      totalCost: session.responses.reduce((sum, r) => sum + (r.cost || 0), 0),
    };
  }
}
