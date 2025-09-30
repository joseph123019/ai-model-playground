import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OpenaiService } from '../services/openai.service';
import { AnthropicService } from '../services/anthropic.service';
interface AuthenticatedSocket extends Socket {
    user?: {
        id: string;
        email: string;
    };
}
export declare class ComparisonsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private prisma;
    private openaiService;
    private anthropicService;
    server: Server;
    constructor(jwtService: JwtService, prisma: PrismaService, openaiService: OpenaiService, anthropicService: AnthropicService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleStartComparison(data: {
        prompt: string;
    }, client: AuthenticatedSocket): Promise<void>;
}
export {};
