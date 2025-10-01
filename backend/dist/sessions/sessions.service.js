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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SessionsService = class SessionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserSessions(userId) {
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
    async getSessionById(sessionId, userId) {
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
            throw new common_1.NotFoundException('Session not found');
        }
        if (session.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this session');
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
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map