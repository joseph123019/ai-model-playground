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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const openai_service_1 = require("../services/openai.service");
const anthropic_service_1 = require("../services/anthropic.service");
let ComparisonsGateway = class ComparisonsGateway {
    jwtService;
    prisma;
    openaiService;
    anthropicService;
    server;
    constructor(jwtService, prisma, openaiService, anthropicService) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.openaiService = openaiService;
        this.anthropicService = anthropicService;
    }
    async handleConnection(client) {
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
        }
        catch (error) {
            console.error('Authentication error:', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.user) {
            console.log(`User ${client.user.email} disconnected`);
        }
    }
    async handleStartComparison(data, client) {
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
            const session = await this.prisma.session.create({
                data: {
                    prompt,
                    userId: client.user.id,
                },
            });
            client.emit('sessionCreated', { sessionId: session.id });
            const models = [
                { service: this.openaiService, model: 'gpt-4o', name: 'GPT-4o' },
                { service: this.anthropicService, model: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
            ];
            const responses = await Promise.allSettled(models.map(async ({ service, model, name }) => {
                const response = await this.prisma.response.create({
                    data: {
                        model: name,
                        content: '',
                        status: 'typing',
                        sessionId: session.id,
                    },
                });
                client.emit('statusUpdate', {
                    model: name,
                    status: 'typing',
                    responseId: response.id,
                });
                try {
                    for await (const chunk of service.streamResponse(prompt, model)) {
                        await this.prisma.response.update({
                            where: { id: response.id },
                            data: {
                                content: chunk.content,
                                tokens: chunk.tokens,
                                cost: chunk.cost,
                                status: 'streaming',
                            },
                        });
                        client.emit('responseChunk', {
                            model: name,
                            content: chunk.content,
                            tokens: chunk.tokens,
                            cost: chunk.cost,
                            responseId: response.id,
                        });
                    }
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
                }
                catch (error) {
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
            }));
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
        }
        catch (error) {
            console.error('Comparison error:', error);
            client.emit('error', { message: 'Internal server error' });
        }
    }
};
exports.ComparisonsGateway = ComparisonsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ComparisonsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('startComparison'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ComparisonsGateway.prototype, "handleStartComparison", null);
exports.ComparisonsGateway = ComparisonsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        openai_service_1.OpenaiService,
        anthropic_service_1.AnthropicService])
], ComparisonsGateway);
//# sourceMappingURL=comparisons.gateway.js.map